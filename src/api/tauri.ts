import { invoke } from '@tauri-apps/api/core';
import { ServerConfig, ServerRuntimeStatus, ConfigFile } from '../types/server';

export const TauriApi = {
  getConfig: () => invoke<ConfigFile>('get_config'),
  saveConfig: (config: ConfigFile) => invoke<void>('save_config', { config }),
  getServers: () => invoke<ServerConfig[]>('list_servers'),
  getServerStatus: (serverId: string) => invoke<ServerRuntimeStatus | null>('get_runtime_status', { serverId }),
  startServer: (serverId: string) => invoke<void>('start_server', { serverId }),
  stopServer: (serverId: string) => invoke<void>('stop_server', { serverId }),
  restartServer: (serverId: string) => invoke<void>('restart_server', { serverId }),
  deleteServer: (serverId: string) => invoke<void>('delete_server', { serverId }),
  createServer: (server: ServerConfig) => invoke<void>('create_server', { server }),
  updateServer: (server: ServerConfig) => invoke<void>('update_server', { server }),
  getLogs: (serverId: string) => invoke<string[]>('get_logs', { serverId }),
  clearLogs: (serverId: string) => invoke<void>('clear_logs', { serverId }),
  checkLocalPort: (host: string, port: number) => invoke<string[]>('check_local_port', { host, port }),
  openUrl: (url: string) => invoke<void>('open_url', { url }),
  validateServer: (server: ServerConfig) => invoke<string[]>('validate_server', { server }),
};
