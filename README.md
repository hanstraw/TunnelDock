# ssh-tunnel-tray (TunnelDock)

A lightweight Windows tray app for managing multiple SSH local port forwarding tunnels.

中文：一个轻量的 Windows 托盘 SSH 隧道管理器，支持多服务器、多端口转发、开机自启和自动重连。

![Main Dashboard Placeholder](https://via.placeholder.com/800x450.png?text=Main+Dashboard+Screenshot)
![Server Details Placeholder](https://via.placeholder.com/800x450.png?text=Server+Details+Screenshot)
![Tray Menu Placeholder](https://via.placeholder.com/300x400.png?text=Tray+Menu+Screenshot)

## Features

- **Multiple SSH servers**: Manage different servers from one place.
- **Multiple local tunnels per server**: Group multiple port forwards under a single connection.
- **One SSH process per server**: Optimizes resources by reusing a single SSH connection for multiple ports.
- **System tray**: Unobtrusive, runs in the background.
- **Auto start on login**: Ready to go when you boot up Windows.
- **Auto reconnect**: Automatically tries to reconnect if a connection drops.
- **Open local service with one click**: Quick access to web services via local forwarding.
- **JSON config**: Easy to edit and back up configuration.
- **No password storage**: Utilizes SSH keys and agents for better security.

## Setup

1. **Prerequisites**: Ensure you have Windows OpenSSH Client installed. (It is usually installed by default on Windows 10/11).
2. **Download**: Grab the latest `.msi` or `.exe` installer from the Releases page.
3. **Install**: Run the installer and follow the instructions.
4. **First Run**: Open the application. It will minimize to the system tray. Right-click the tray icon to open the main dashboard and add your first server.
5. **Authentication**: Configure your server to accept your SSH private key (or use `ssh-agent`). The app relies on SSH keys and does not store SSH passwords.

## Configuration Schema

The application stores its configuration in `%APPDATA%\ssh-tunnel-tray\config.json`. The configuration schema is automatically migrated on version updates.

```json
{
  "version": 1,
  "app": {
    "startMinimized": true,
    "closeToTray": true,
    "launchAtLogin": true,
    "theme": "system"
  },
  "servers": [
    {
      "id": "unique-server-id",
      "name": "My Server",
      "sshHost": "example.com",
      "sshPort": 22,
      "sshUser": "root",
      "privateKey": "C:\\Users\\user\\.ssh\\id_ed25519",
      "useAgent": true,
      "autoStart": true,
      "autoReconnect": true,
      "reconnectDelaySec": 5,
      "enabled": true,
      "tunnels": [
        {
          "id": "tunnel-1",
          "name": "Web Dashboard",
          "enabled": true,
          "localHost": "127.0.0.1",
          "localPort": 8080,
          "remoteHost": "127.0.0.1",
          "remotePort": 80,
          "openUrl": "http://127.0.0.1:8080",
          "description": "My internal dashboard"
        }
      ]
    }
  ]
}
```

### Config Properties

- `version`: The schema version (currently `1`).
- `app.startMinimized`: Start minimized in the system tray.
- `app.closeToTray`: Hiding the window to the tray when the close button is clicked.
- `servers[].privateKey`: Absolute path to your SSH private key. If omitted and `useAgent` is `false`, it attempts to use the default ssh keys.
- `servers[].tunnels[].localHost`: Recommended to keep as `127.0.0.1` for security reasons.

## Troubleshooting

- **Server stuck at "starting" / fails to connect**:
  - Check the Logs page for the server. Look for `Permission denied (publickey)` or similar SSH errors.
  - Make sure your SSH private key is correctly specified or added to your `ssh-agent`.
  - Ensure Windows OpenSSH is correctly in your system `PATH`. Try running `ssh` in PowerShell.

- **Port already in use**:
  - The local port you assigned might be used by another application. Check the error log, change the `localPort` in your tunnel settings, or stop the conflicting application.

- **Connection works but can't access service**:
  - Check that the `remoteHost` and `remotePort` are correct relative to the server you connected to. For example, if the service is bound to `localhost` on the server, `remoteHost` should be `127.0.0.1`.
  - Ensure `ExitOnForwardFailure=yes` didn't terminate the session (look at the Logs).

- **Config File Corruption**:
  - The app automatically creates a backup (`config.json.bak`) during schema migrations. If you need to restore or edit the config manually, go to `%APPDATA%\ssh-tunnel-tray\`.
