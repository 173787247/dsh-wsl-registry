// Pure side of dsh-wsl-registry: normalisation and formatting, testable without Windows.
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

export function normalize(raw) {
  return ((raw) => ({
      path: String(raw.path ?? ""),
      values: (raw.values || []).map((x) => ({ name: String(x.name ?? ""), kind: String(x.kind ?? ""), value: String(x.value ?? "") })),
    }))(raw ?? {});
}

export function format(v) {
  return ((v) => {
      const l = [`win_reg ok=${v.ok} path=${v.path} values=${(v.values || []).length}`];
      for (const x of v.values || []) l.push(`  ${x.name}${x.kind ? ` (${x.kind})` : ""} = ${x.value.slice(0, 100)}`);
      if (v.error) l.push(`error: ${v.error}`);
      return l.join("\n");
    })({ ok: true, ...v });
}

export function parameters() {
  return {
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "path": {
      "type": "string",
      "description": "Registry path, e.g. HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion."
    },
    "name": {
      "type": "string",
      "description": "Read one value by name (optional; omit to list the key's values)."
    }
  }
};
}

export function outputSchema() {
  return { type: "object", additionalProperties: true };
}
