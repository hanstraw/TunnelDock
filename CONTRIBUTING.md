# Contributing

感谢你关注 TunnelDock。

## 开发环境

- Windows 10 / Windows 11
- Node.js + pnpm
- Rust toolchain
- Windows OpenSSH Client

## 本地验证

提交前请运行：

```powershell
pnpm test
pnpm tsc --noEmit
cd src-tauri
cargo test
```

## 安全规则

- 不要在 Issue、PR、截图或测试数据中提交 SSH 密码、私钥、私钥 passphrase。
- 配置示例只能使用 `example.com`、`127.0.0.1`、假路径或测试端口。
- 不要默认禁用 host key 检查。

## 代码方向

TunnelDock 第一版只聚焦 Windows + SSH 本地端口转发，不计划加入远程终端、SFTP、云同步或团队共享。
