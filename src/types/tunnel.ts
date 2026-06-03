export type TunnelConfig = {
  id: string
  name: string
  enabled: boolean

  localHost: string
  localPort: number

  remoteHost: string
  remotePort: number

  openUrl?: string
  description?: string
}
