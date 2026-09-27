import { runPowerShell } from "./wsl-host.js";
import { normalize } from "./registry.js";

const ALLOWED = [
  "HKLM:\\SOFTWARE", "HKLM:\\SYSTEM\\CurrentControlSet\\Services",
  "HKCU:\\SOFTWARE", "HKLM:\\HARDWARE",
];
export function assertRegistryPath(path) {
  const p = String(path ?? "").trim();
  if (!p) throw new Error("path is required");
  const ok = ALLOWED.some((a) => p.toUpperCase().startsWith(a.toUpperCase()));
  if (!ok) throw new Error(`registry path is outside the allowlist: ${p}`);
  // Run / RunOnce as a whole path segment, wherever it appears — including at
  // the end of the path. A pattern that required a trailing separator let
  // "...\\CurrentVersion\\Run" through.
  const segments = p.split(/[\\/:]+/).filter(Boolean);
  if (segments.some((s) => /^Run(Once)?$/i.test(s))) throw new Error("autorun keys are outside the allowlist");
  return p;
}

const PRELUDE = "$ErrorActionPreference = 'Stop'\n# The console codepage mangles non-ASCII output; force UTF-8.\n[Console]::OutputEncoding = [Text.Encoding]::UTF8";

/** Every parameter reaches PowerShell as a single-quoted literal. */
function q(s) {
  return "'" + String(s ?? "").replace(/'/g, "''") + "'";
}

function clamp(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

// Substitution runs on @@TOKEN@@ placeholders rather than bare words: a plain
// replace("NAME", ...) also matches inside LOGNAME, which silently corrupts the
// script. Each token appears at most once.
export function buildScript(a) {
  const values = {
    NAME: "",
    STATE: q(a.state),
    LIMIT: String(a.limit),
    COUNT: String(a.count),
    LOGNAME: q(a.log),
    LEVEL: String(a.level),
    TOPN: String(a.top),
    REGPATH: q(a.path),
    VALNAME: q(a.name),
  };
  return PRELUDE + "\n" + TEMPLATE.replace(/@@(\w+)@@/g, (_, k) => values[k] ?? "");
}

const TEMPLATE = `

if (-not (Test-Path @@REGPATH@@)) { ConvertTo-Json -Compress @{ error = 'key not found' }; exit }
if (@@VALNAME@@) {
  $item = Get-ItemProperty -Path @@REGPATH@@ -Name @@VALNAME@@ -ErrorAction SilentlyContinue
  if ($null -eq $item) { ConvertTo-Json -Compress @{ error = 'value not found' }; exit }
  # $item.$@@VALNAME@@ is not valid PowerShell once @@VALNAME@@ is a quoted literal;
  # index the property bag instead.
  $v = $item.PSObject.Properties[@@VALNAME@@].Value
  ConvertTo-Json -Compress @{ path = @@REGPATH@@; values = @(@{ name = @@VALNAME@@; value = "$v" }) }
} else {
  $key = Get-Item -Path @@REGPATH@@
  $vals = $key.GetValueNames() | Select-Object -First 100 | ForEach-Object {
    @{ name = $_; kind = "$($key.GetValueKind($_))"; value = "$($key.GetValue($_))".Substring(0,[Math]::Min(400,"$($key.GetValue($_))".Length)) }
  }
  ConvertTo-Json -Compress -Depth 4 @{ path = @@REGPATH@@; values = @($vals) }
}
`;

export async function execute(args, config = {}) {
  const a = {
    name: typeof args?.name === "string" ? args.name : "",
    state: typeof args?.state === "string" ? args.state : "",
    log: typeof args?.log === "string" ? args.log : "System",
    path: typeof args?.path === "string" ? args.path : "",
    level: clamp(args?.level, 1, 5, 2),
    count: clamp(args?.count, 1, 200, 20),
    limit: clamp(args?.limit, 1, 400, 40),
    top: clamp(args?.top, 1, 40, 8),
  };
  if (a.path) a.path = assertRegistryPath(args?.path);
  const timeoutMs = clamp(config.timeoutMs, 1000, 120000, 30000);
  const { stdout } = await runPowerShell(buildScript(a), { timeoutMs });
  const raw = JSON.parse(stdout.trim() || "{}");
  if (raw.error) return { ok: false, error: String(raw.error) };
  return { ok: true, ...normalize(raw) };
}
