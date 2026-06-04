# Security Policy

## 安全边界

TunnelDock 不实现 SSH 协议，也不保存 SSH 密码。应用只负责调用 Windows 自带 OpenSSH `ssh.exe` 并管理本地端口转发进程。

## 不保存的信息

- SSH 登录密码
- 私钥 passphrase
- root 密码

## 推荐配置

- 使用 SSH 私钥登录。
- 使用 `ssh-agent` 管理私钥。
- 本地监听地址保持为 `127.0.0.1`。
- 首次连接时手动确认 host key，不要默认关闭 host key 检查。

## 报告安全问题

如果发现安全问题，请不要在公开 Issue 中贴出敏感配置、私钥、密码或真实服务器地址。可以先创建不含敏感信息的问题描述，再通过私有渠道补充细节。
