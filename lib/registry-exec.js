import { runPowerShell } from "./wsl-host.js";
import { normalize, normalizeKeys } from "./registry.js";
const ALLOWED = [
  "HKLM:\\SOFTWARE", "HKLM:\\SYSTEM\\CurrentControlSet\\Services",
  "HKCU:\\SOFTWARE", "HKLM:\\HARDWARE",
];
export function assertRegistryPath(path) {
  const p = String(path ?? "").trim();
  if (!p) throw new Error("path is required");
  const ok = ALLOWED.some((a) => p.toUpperCase().startsWith(a.toUpperCase()));
  if (!ok) throw new Error(`registry path is outside the allowlist: ${p}`);
  // Run / RunOnce as a whole path segment, wherever it appears, including at the
  // end of the path. A pattern requiring a trailing separator let
  // "...CurrentVersion\\Run" through.
  const segments = p.split(/[\\/:]+/).filter(Boolean);
  if (segments.some((s) => /^Run(Once)?$/i.test(s))) throw new Error("autorun keys are outside the allowlist");
  return p;
}
/** The kit's one escaping rule: single-quote the value, doubling any apostrophe. */
function esc(s) {
  return "'" + String(s ?? "").replace(/'/g, "''") + "'";
}

function clamp(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/**
 * The script is built here, at the call site, the way every other plugin in the
 * kit does it: the PowerShell is written inline and the values are escaped as
 * they are interpolated. An earlier version of this file used a @@TOKEN@@
 * substitution table instead, which needed a template literal that ate the
 * backslashes in a regex and quoted every token twice.
 */
export function script(a) {
  return ((a) => `
if (-not (Test-Path ${esc(a.path)})) { ConvertTo-Json -Compress @{ error = 'key not found' }; exit }
$key = Get-Item -Path ${esc(a.path)}
${a.subkeys ? `
ConvertTo-Json -Compress -Depth 4 @{
  path = ${esc(a.path)}
  subkeys = @($key.GetSubKeyNames() | Select-Object -First 200)
  valueCount = @($key.GetValueNames()).Count
}
exit` : ""}
${a.name ? `
$item = Get-ItemProperty -Path ${esc(a.path)} -Name ${esc(a.name)} -ErrorAction SilentlyContinue
if ($null -eq $item) { ConvertTo-Json -Compress @{ error = 'value not found' }; exit }
$v = $item.PSObject.Properties[${esc(a.name)}].Value
ConvertTo-Json -Compress @{ path = ${esc(a.path)}; values = @(@{ name = ${esc(a.name)}; value = "$v" }) }
exit` : ""}
$vals = $key.GetValueNames() | Select-Object -First 100 | ForEach-Object {
  $m = "$($key.GetValue($_))"
  @{ name = $_; kind = "$($key.GetValueKind($_))"; value = $m.Substring(0,[Math]::Min(400,$m.Length)) }
}
ConvertTo-Json -Compress -Depth 4 @{ path = ${esc(a.path)}; values = @($vals) }`)(a);
}

export async function execute(args, config = {}) {
  const a = {
    name: typeof args?.name === "string" ? args.name : "",
    state: typeof args?.state === "string" ? args.state : "",
    log: typeof args?.log === "string" ? args.log : "System",
    path: typeof args?.path === "string" ? args.path : "",
    provider: typeof args?.provider === "string" ? args.provider : "",
    level: clamp(args?.level, 1, 5, 2),
    count: clamp(args?.count, 1, 200, 20),
    limit: clamp(args?.limit, 1, 400, 40),
    top: clamp(args?.top, 1, 40, 8),
    detail: Boolean(args?.detail),
    subkeys: Boolean(args?.subkeys),
    all: Boolean(args?.all),
    full: Boolean(args?.full),
    since: null,
  };

  if (a.path) a.path = assertRegistryPath(a.path);

  const timeoutMs = clamp(config.timeoutMs, 1000, 120000, 30000);
  if (a.subkeys) {
    const { stdout } = await runPowerShell(script(a), { timeoutMs });
    const raw = JSON.parse(stdout.trim() || "{}");
    if (raw.error) return { ok: false, error: String(raw.error) };
    return { ok: true, ...normalizeKeys(raw) };
  }
  const { stdout } = await runPowerShell(script(a), { timeoutMs });
  const raw = JSON.parse(stdout.trim() || "{}");
  if (raw.error) return { ok: false, error: String(raw.error) };
  return { ok: true, ...normalize(raw) };
}
