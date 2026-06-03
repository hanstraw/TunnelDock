import { invoke } from '@tauri-apps/api/core';
import { ServerConfig, ServerRuntimeStatus } from '../types/server';

export const TauriApi = {
  getServers: () => invoke<ServerConfig[]>('get_servers'),
  getServerStatus: (serverId: string) => invoke<ServerRuntimeStatus>('get_server_status', { serverId }),
  startServer: (serverId: string) => invoke<void>('start_server', { serverId }),
  stopServer: (serverId: string) => invoke<void>('stop_server', { serverId }),
  restartServer: (serverId: string) => invoke<void>('restart_server', { serverId }),
  deleteServer: (serverId: string) => invoke<void>('delete_server', { serverId }),
  saveServer: (server: ServerConfig) => invoke<void>('save_server', { server }),
};
