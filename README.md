# oxfd.js

JavaScript API wrapper for [Oxford Response](https://docs.oxfd.re).  
Supports CommonJS, ESM, and TypeScript out of the box.

## Install

```sh
npm install oxfd.js
```

## Usage

### CommonJS (require)
```js
const { OxfordAPI } = require("oxfd.js");

const api = new OxfordAPI({ serverKey: "your-api-key" });

const server  = await api.getServer();
const players = await api.getPlayers();
```

### ESM (import)
```js
import OxfordAPI from "oxfd.js";

const api = new OxfordAPI({ serverKey: "your-api-key" });

const server  = await api.getServer();
const players = await api.getPlayers();
```

### TypeScript
```ts
import OxfordAPI, { ServerInfo, Player } from "oxfd.js";

const api = new OxfordAPI({ serverKey: "your-api-key" });

const server: ServerInfo = await api.getServer();
const players: Player[]  = await api.getPlayers();
```

---

## Initialization Options

```js
const api = new OxfordAPI({
  serverKey: "your-api-key",   // required
  rateLimit: "auto",           // "auto" | "none" | number (seconds). Default: "auto"
  maxRetries: 3,               // retries on 429. Default: 3
  timeout: 10000,              // ms before timeout. Default: 10000
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `serverKey` | `string` | `string` | Your API key **(required)** |
| `rateLimit` | `"auto"` \| `"none"` \| `number` | `"auto"` | `"auto"` = ~29 req/s with burst, `"none"` = unlimited, `number` = seconds between requests |
| `maxRetries` | `number` | `3` | Times to retry on rate limit (429) |
| `timeout` | `number` | `10000` | Request timeout in ms |

---

## Methods

All methods return a `Promise`.

### Flat API

```js
api.getServer()            // Server info, weather, time
api.getPlayers()           // Online players
api.getQueue()             // Reserved queue
api.getBans()              // Active bans
api.getVehicles()          // Spawned vehicles
api.getRobberies()         // Robbery location statuses
api.getKillLogs()          // Kill logs (last 100)
api.getCommandLogs()       // Command logs
api.getModCalls()          // Mod calls
api.getRadioCalls()        // Radio calls (last 100)
api.getJoinLogs()          // Join/leave logs
api.executeCommand(string) // Execute an admin command
```

### Grouped Managers

```js
// Server data
api.servers.getServer()
api.servers.getPlayers()
api.servers.getQueue()
api.servers.getBans()
api.servers.getVehicles()
api.servers.getRobberies()

// Logs
api.logs.getKillLogs()
api.logs.getCommandLogs()
api.logs.getModCalls()
api.logs.getRadioCalls()
api.logs.getJoinLogs()

// Commands
api.commands.execute("announce Server restart in 5 minutes!")
api.commands.execute("kick SomePlayer")
```

---

## Error Handling

```js
import {
  OxfordAPIError,
  RateLimitError,
  AuthError,
  ServerUnavailableError,
} from "oxfd.js";

try {
  const players = await api.getPlayers();
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log("Rate limited, retry after:", err.retryAfter);
  } else if (err instanceof AuthError) {
    console.log("Bad API key.");
  } else if (err instanceof ServerUnavailableError) {
    console.log("Server offline.");
  } else if (err instanceof OxfordAPIError) {
    console.log(`Error ${err.status}: ${err.message}`, err.details);
  }
}
```

---

