export interface OxfordAPIOptions {
  /** Your API key */
  serverKey: string;
  /** "auto" (~29 req/s with burst), "none", or seconds between requests. Default: "auto" */
  rateLimit?: "auto" | "none" | number;
  /** How many times to retry on 429 rate limit. Default: 3 */
  maxRetries?: number;
  /** Request timeout in milliseconds. Default: 10000 */
  timeout?: number;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface ServerInfo {
  Name: string;
  StyledName: string;
  Description: string;
  Tags: string[];
  ThemeColour: string;
  OwnerId: number;
  CurrentPlayers: number;
  MaxPlayers: number;
  JoinCode: string;
  CreatedAt: number;
  Packages: string[];
  Weather: string;
  TimeOfDay: string;
}

export interface Player {
  Username: string;
  DisplayName: string;
  UserId: number;
  Team: string;
  WantedLevel: number;
  Permission: string;
  Callsign: string;
  Location: string;
}

export interface Queue {
  total: number;
  users: number[];
}

export interface Ban {
  UserId: number;
  Username: string;
  Reason: string;
  BannedBy: string;
  BannedById: number;
  Expiry: number;
}

export interface KillLog {
  Timestamp: number;
  KillerUserId: number;
  KillerUsername: string;
  VictimUserId: number;
  VictimUsername: string;
  Distance: number;
  Weapon: string;
}

export interface CommandLog {
  Timestamp: number;
  UserId: number;
  Username: string;
  Command: string;
  Args: string[];
}

export interface JoinLog {
  Timestamp: number;
  UserId: number;
  Username: string;
  Action: "joined" | "left";
}

export interface ModCallResponder {
  UserId: number;
  Username: string;
}

export interface ModCall {
  Timestamp: number;
  CallerUserId: number;
  CallerUsername: string;
  CallerDisplayName: string;
  CaseId: string;
  Responders: ModCallResponder[];
}

export interface Vehicle {
  OwnerUserId: number;
  OwnerUsername: string;
  Registration: string;
  Model: string;
  Electric: boolean;
  ELS: boolean;
  ELS_Style: string;
}

export interface Robbery {
  Name: string;
  Alarm: boolean;
  Available: boolean;
}

export interface RadioCall {
  Timestamp: number;
  AuthorUserId: number;
  AuthorUsername: string;
  Location: string;
  Description: string;
  Channel: string;
}

export interface CommandResult {
  message: string;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class OxfordAPIError extends Error {
  status: number;
  details: string | null;
}

export class RateLimitError extends OxfordAPIError {
  retryAfter: string | null;
}

export class AuthError extends OxfordAPIError {}
export class ServerUnavailableError extends OxfordAPIError {}

// ─── Managers ─────────────────────────────────────────────────────────────────

export class Servers {
  getServer(): Promise<ServerInfo>;
  getPlayers(): Promise<Player[]>;
  getQueue(): Promise<Queue>;
  getBans(): Promise<Ban[]>;
  getVehicles(): Promise<Vehicle[]>;
  getRobberies(): Promise<Robbery[]>;
}

export class Logs {
  getKillLogs(): Promise<KillLog[]>;
  getCommandLogs(): Promise<CommandLog[]>;
  getModCalls(): Promise<ModCall[]>;
  getRadioCalls(): Promise<RadioCall[]>;
  getJoinLogs(): Promise<JoinLog[]>;
}

export class Commands {
  execute(command: string): Promise<CommandResult>;
}

// ─── Main Class ───────────────────────────────────────────────────────────────

export class OxfordAPI {
  servers: Servers;
  logs: Logs;
  commands: Commands;

  constructor(options: OxfordAPIOptions);

  getServer(): Promise<ServerInfo>;
  getPlayers(): Promise<Player[]>;
  getQueue(): Promise<Queue>;
  getBans(): Promise<Ban[]>;
  getKillLogs(): Promise<KillLog[]>;
  getCommandLogs(): Promise<CommandLog[]>;
  getModCalls(): Promise<ModCall[]>;
  getVehicles(): Promise<Vehicle[]>;
  getRobberies(): Promise<Robbery[]>;
  getRadioCalls(): Promise<RadioCall[]>;
  getJoinLogs(): Promise<JoinLog[]>;
  executeCommand(command: string): Promise<CommandResult>;
}

export default OxfordAPI;
