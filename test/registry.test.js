import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalize, format, parameters } from "../lib/registry.js";

describe("registry", () => {
  it("normalises values and keeps the key kind", () => {
    const v = normalize({ path: "HKLM:\\X", values: [{ name: "A", kind: "DWord", value: "1" }] });
    assert.equal(v.path, "HKLM:\\X");
    assert.equal(v.values[0].kind, "DWord");
  });
  it("defaults missing values to an empty array", () => {
    assert.deepEqual(normalize({}).values, []);
  });
  it("summarises the path and value count", () => {
    const out = format(normalize({ path: "HKLM:\\X", values: [{ name: "A", value: "1" }] }));
    assert.match(out, /path=HKLM:\\X/);
    assert.match(out, /values=1/);
  });
});
