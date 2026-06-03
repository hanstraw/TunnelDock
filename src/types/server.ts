import { TunnelConfig } from './tunnel'

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
