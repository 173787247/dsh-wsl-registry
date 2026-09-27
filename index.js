import { detectWsl } from "./lib/wsl-host.js";
import * as core from "./lib/registry.js";
import { execute } from "./lib/registry-exec.js";

export const name = "dsh-wsl-registry";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:win_reg",
    order: 217,
    text: "Use win_reg for WSL/Windows interop: Read-only Windows registry access from WSL, restricted to an allowlist of key prefixes.",
  });

  ctx.tools.register({
    name: "win_reg",
    description: "Read-only Windows registry access from WSL, restricted to an allowlist of key prefixes.",
    parameters: core.parameters(),
    output: {
      schema: core.outputSchema(),
      render: (_args, value) => [{ type: "text", text: core.format(value) }],
    },
    timeoutMs: Number(config.timeoutMs) > 0 ? Number(config.timeoutMs) : 30_000,
    isConcurrencySafe: () => true,
    async execute(args) {
      if (!wsl) return { ok: false, error: "not running in WSL" };
      try {
        return await execute(args, config);
      } catch (error) {
        return { ok: false, error: String(error?.message ?? error) };
      }
    },
    presentCall: () => ({ card: "generic", title: "win_reg" }),
    presentResult: (_args, result) => ({ card: "generic", title: "win_reg", content: result?.content }),
  });
}
