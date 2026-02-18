// Simple build script — generates dist/index.cjs and dist/index.mjs from src/index.js
// Run with: node build.js

const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "src/index.js"), "utf-8");
const types = fs.readFileSync(path.join(__dirname, "src/index.d.ts"), "utf-8");

fs.mkdirSync(path.join(__dirname, "dist"), { recursive: true });

// ── CJS (CommonJS) ── stays exactly as-is, already uses module.exports
fs.writeFileSync(path.join(__dirname, "dist/index.cjs"), src, "utf-8");

// ── ESM ── swap module.exports for named + default exports
const esmBody = src.replace(
  /module\.exports\s*=\s*\{[\s\S]*?\};?\s*$/,
  `export {
  OxfordAPI,
  Servers,
  Logs,
  Commands,
  OxfordAPIError,
  RateLimitError,
  AuthError,
  ServerUnavailableError,
};
export default OxfordAPI;`
);

fs.writeFileSync(path.join(__dirname, "dist/index.mjs"), esmBody, "utf-8");

// ── Types ──
fs.writeFileSync(path.join(__dirname, "dist/index.d.ts"), types, "utf-8");

console.log("✅ Built: dist/index.cjs  dist/index.mjs  dist/index.d.ts");
