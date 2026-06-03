import { TunnelConfig } from './tunnel'

export type AppConfig = {
  startMinimized: boolean;
  closeToTray: boolean;
  launchAtLogin: boolean;
  theme: string;
};

export type ConfigFile = {
  version: number;
  app: AppConfig;
  servers: ServerConfig[];
};

export type ServerConfig = {
  id: string
  name: string

  sshHost: string
  sshPort: number
  sshUser: string

  privateKey?: string
  useAgent: boolean

  autoStart: boolean
  autoReconnect: boolean
  reconnectDelaySec: number

  enabled: boolean
  tunnels: TunnelConfig[]
}

export type ServerRuntimeStatus = {
  serverId: string
  status: "stopped" | "starting" | "running" | "stopping" | "error" | "reconnecting"
  pid?: number
  startedAt?: string
  uptimeSec: number
  restartCount: number
  lastError?: string
  activeTunnelCount: number
}
