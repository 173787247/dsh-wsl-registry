# dsh-wsl-registry

DeepSeek Harness plugin: Read-only Windows registry access from WSL, restricted to an allowlist of key prefixes.

Part of **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**.

[中文说明 → README.zh.md](./README.zh.md)

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-registry
```

## Usage

```
win_reg path='HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'
win_reg path='HKLM:\SOFTWARE\...' name=ProductName
```

## Notes

**Read-only, and restricted to an allowlist** of key prefixes:
`HKLM:\SOFTWARE`, `HKLM:\SYSTEM\CurrentControlSet\Services`, `HKCU:\SOFTWARE`,
`HKLM:\HARDWARE`. Keys under a `Run` or `RunOnce` segment are refused wherever they
appear — matched as a whole path segment, so `...\CurrentVersion\Run` is caught as
well as `...\Run\Something`. Values are truncated to 400 characters.

## Requirements

- Windows with WSL, and DeepSeek Harness running inside it.

## Tests

```sh
npm test
```

The unit tests run anywhere. The live tests are skipped outside WSL.

## Compatibility

| Field | Value |
|-------|-------|
| **Plugin** | `dsh-wsl-registry` **0.1.0** |
| **Minimum dsh** | ≥ **0.1.2** (web UI one-shot `?token=` on Windows relay `:3081`) |
| **Latest verified** | See [dsh-wsl-kit Compatibility](https://github.com/173787247/dsh-wsl-kit#compatibility-2026-09) (currently **`0.2.0-rc.2`**) — single source of truth for the suite |
| **Kit set** | `full` or install alone |

## License

MIT
