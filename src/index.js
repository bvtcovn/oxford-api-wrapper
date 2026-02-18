class OxfordAPIError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = "OxfordAPIError";
    this.status = status;
    this.details = details;
  }
}

class RateLimitError extends OxfordAPIError {
  constructor(message, retryAfter = null) {
    super(message, 429);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

class AuthError extends OxfordAPIError {
  constructor() {
    super("Invalid API key or unauthorized access", 403);
    this.name = "AuthError";
  }
}

class ServerUnavailableError extends OxfordAPIError {
  constructor(message) {
    super(message || "Server data temporarily unavailable", 503);
    this.name = "ServerUnavailableError";
  }
}

// ─── Token Bucket Rate Limiter ────────────────────────────────────────────────

class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // tokens per ms
    this.lastRefill = Date.now();
    this.queue = [];
    this.processing = false;
  }

  _refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  acquire() {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this._process();
    });
  }

  _process() {
    if (this.processing) return;
    this.processing = true;

    const tick = () => {
      if (this.queue.length === 0) {
        this.processing = false;
        return;
      }
      this._refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        this.queue.shift()();
        tick();
      } else {
        const waitMs = (1 - this.tokens) / this.refillRate;
        setTimeout(tick, waitMs);
      }
    };

    tick();
  }
}

// ─── Grouped Managers ─────────────────────────────────────────────────────────

class Servers {
  constructor(api) { this._api = api; }
  getServer()    { return this._api.getServer(); }
  getPlayers()   { return this._api.getPlayers(); }
  getQueue()     { return this._api.getQueue(); }
  getBans()      { return this._api.getBans(); }
  getVehicles()  { return this._api.getVehicles(); }
  getRobberies() { return this._api.getRobberies(); }
}

class Logs {
  constructor(api) { this._api = api; }
  getKillLogs()    { return this._api.getKillLogs(); }
  getCommandLogs() { return this._api.getCommandLogs(); }
  getModCalls()    { return this._api.getModCalls(); }
  getRadioCalls()  { return this._api.getRadioCalls(); }
  getJoinLogs()    { return this._api.getJoinLogs(); }
}

class Commands {
  constructor(api) { this._api = api; }
  execute(command) { return this._api.executeCommand(command); }
}

// ─── Core Client ──────────────────────────────────────────────────────────────

class OxfordAPI {
  /**
   * @param {object} options
   * @param {string}        options.serverKey   Your API key (required)
   * @param {"auto"|"none"|number} [options.rateLimit="auto"]  Rate limit mode
   * @param {number}        [options.maxRetries=3]  Retries on 429
   * @param {number}        [options.timeout=10000] Request timeout ms
   */
  constructor({ serverKey, rateLimit = "auto", maxRetries = 3, timeout = 10000 } = {}) {
    if (!serverKey) throw new Error("[oxfd.js] serverKey is required");

    this.serverKey = serverKey;
    this.baseUrl = "https://api.oxfd.re/v1";
    this.maxRetries = maxRetries;
    this.timeout = timeout;

    if (rateLimit === "none") {
      this._bucket = null;
    } else if (rateLimit === "auto") {
      this._bucket = new TokenBucket(10, 29 / 1000);
    } else {
      this._bucket = new TokenBucket(1, 1 / (Number(rateLimit) * 1000));
    }

    this.servers  = new Servers(this);
    this.logs     = new Logs(this);
    this.commands = new Commands(this);
  }

  async _request(method, path, body = null, attempt = 0) {
    if (this._bucket) await this._bucket.acquire();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    const options = {
      method,
      headers: {
        "server-key": this.serverKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
    };

    if (body !== null) options.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(`${this.baseUrl}${path}`, options);
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError") throw new OxfordAPIError("Request timed out", 408);
      throw new OxfordAPIError(`Network error: ${err.message}`, 0);
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 429) {
      if (attempt < this.maxRetries) {
        const wait = Number(res.headers.get("Retry-After") || 1) * 1000;
        await new Promise((r) => setTimeout(r, wait));
        return this._request(method, path, body, attempt + 1);
      }
      throw new RateLimitError("Rate limit exceeded", res.headers.get("Retry-After"));
    }

    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; }
    catch { data = { message: text }; }

    if (!res.ok) {
      const msg    = data?.message || res.statusText;
      const detail = data?.error   || null;
      switch (res.status) {
        case 400: throw new OxfordAPIError(`Bad request: ${msg}`, 400, detail);
        case 403: throw new AuthError();
        case 404: throw new OxfordAPIError(`Not found: ${path}`, 404, detail);
        case 500: throw new OxfordAPIError(`Internal server error: ${msg}`, 500, detail);
        case 503: throw new ServerUnavailableError(msg);
        default:  throw new OxfordAPIError(msg, res.status, detail);
      }
    }

    return data;
  }

  _get(path)        { return this._request("GET",  path); }
  _post(path, body) { return this._request("POST", path, body); }

  getServer()             { return this._get("/server"); }
  getPlayers()            { return this._get("/server/players"); }
  getQueue()              { return this._get("/server/queue"); }
  getBans()               { return this._get("/server/bans"); }
  getKillLogs()           { return this._get("/server/killlogs"); }
  getCommandLogs()        { return this._get("/server/commandlogs"); }
  getModCalls()           { return this._get("/server/modcalls"); }
  getVehicles()           { return this._get("/server/vehicles"); }
  getRobberies()          { return this._get("/server/robberies"); }
  getRadioCalls()         { return this._get("/server/radiocalls"); }
  getJoinLogs()           { return this._get("/server/joinlogs"); }
  executeCommand(command) {
    if (!command || typeof command !== "string")
      throw new TypeError("[oxfd.js] command must be a non-empty string");
    return this._post("/server/command", { command });
  }
}

module.exports = {
  OxfordAPI,
  Servers,
  Logs,
  Commands,
  OxfordAPIError,
  RateLimitError,
  AuthError,
  ServerUnavailableError,
};
