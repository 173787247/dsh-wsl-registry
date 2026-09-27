# dsh-wsl-registry

> 从 WSL 只读访问 Windows 注册表，限定在白名单键前缀内。

DeepSeek Harness 插件：Read-only Windows registry access from WSL, restricted to an allowlist of key prefixes.

属于 **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)** 的一部分。

[English → README.md](./README.md)

## 安装

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-registry
```

## 用法

```
win_reg path='HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'
win_reg path='HKLM:\SOFTWARE\...' name=ProductName
```

## 说明

**Read-only, and restricted to an allowlist** of key prefixes:
`HKLM:\SOFTWARE`, `HKLM:\SYSTEM\CurrentControlSet\Services`, `HKCU:\SOFTWARE`,
`HKLM:\HARDWARE`. Keys under a `Run` or `RunOnce` segment are refused wherever they
appear — matched as a whole path segment, so `...\CurrentVersion\Run` is caught as
well as `...\Run\Something`. Values are truncated to 400 characters.

## 依赖

- Windows + WSL，DeepSeek Harness 跑在 WSL 里。

## 测试

```sh
npm test
```

单元测试在任何平台都能跑；实时测试在 WSL 之外自动跳过。

## 许可

MIT
