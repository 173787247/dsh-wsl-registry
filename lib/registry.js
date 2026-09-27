// Pure side of registry: normalisation and formatting, testable without Windows.
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

export function normalize(raw) {
  return ((raw) => ({
      path: String(raw.path ?? ""),
      values: (raw.values || []).map((x) => ({ name: String(x.name ?? ""), kind: String(x.kind ?? ""), value: String(x.value ?? "") })),
    }))(raw ?? {});
}

// Dispatch on the shape of the result rather than making the caller say which
// formatter to use: a result carries either `detail`, or `subkeys`, or neither.
export function format(v) {
  const withOk = { ok: true, ...v };
  if (withOk.detail && typeof formatDetail === "function") return formatDetail(withOk);
  if (withOk.subkeys && typeof formatKeys === "function") return formatKeys(withOk);
  return ((v) => {
      const l = [`win_reg ok=${v.ok} path=${v.path} values=${(v.values || []).length}`];
      for (const x of v.values || []) l.push(`  ${x.name}${x.kind ? ` (${x.kind})` : ""} = ${x.value.slice(0, 100)}`);
      if (v.error) l.push(`error: ${v.error}`);
      return l.join("\n");
    })(withOk);
}

export function parameters() {
  return {
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "path": {
      "type": "string",
      "description": "Registry path, e.g. HKLM:\\\\SOFTWARE\\\\Microsoft\\\\Windows NT\\\\CurrentVersion."
    },
    "name": {
      "type": "string",
      "description": "Read one value by name (optional; omit to list the key's values)."
    },
    "subkeys": {
      "type": "boolean",
      "description": "List the child keys under this path instead of its values. A key is a container as well as a set of values."
    }
  }
};
}

export function outputSchema() {
  return { type: "object", additionalProperties: true };
}

export function normalizeKeys(raw) {
  return ((raw) => ({
      path: String(raw.path ?? ""),
      subkeys: (raw.subkeys || []).map(String),
      valueCount: num(raw.valueCount),
    }))(raw ?? {});
}

export function formatKeys(raw) {
  return ((v) => {
      const l = [`win_reg ok=${v.ok} path=${v.path} subkeys=${(v.subkeys ?? []).length} values=${v.valueCount}`];
      for (const k of v.subkeys ?? []) l.push(`  ${k}`);
      if (v.error) l.push(`error: ${v.error}`);
      return l.join("\n");
    })(raw ?? {});
}
