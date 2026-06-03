use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
pub struct AppConfig {
    #[serde(rename = "startMinimized")]
    pub start_minimized: bool,
    #[serde(rename = "closeToTray")]
    pub close_to_tray: bool,
    #[serde(rename = "launchAtLogin")]
    pub launch_at_login: bool,
    pub theme: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TunnelConfig {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    #[serde(rename = "localHost")]
    pub local_host: String,
    #[serde(rename = "localPort")]
    pub local_port: u16,
    #[serde(rename = "remoteHost")]
    pub remote_host: String,
    #[serde(rename = "remotePort")]
    pub remote_port: u16,
    #[serde(rename = "openUrl")]
    pub open_url: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ServerConfig {
    pub id: String,
    pub name: String,
    #[serde(rename = "sshHost")]
    pub ssh_host: String,
    #[serde(rename = "sshPort")]
    pub ssh_port: u16,
    #[serde(rename = "sshUser")]
    pub ssh_user: String,
    #[serde(rename = "privateKey")]
    pub private_key: Option<String>,
    #[serde(rename = "useAgent")]
    pub use_agent: bool,
    #[serde(rename = "autoStart")]
    pub auto_start: bool,
    #[serde(rename = "autoReconnect")]
    pub auto_reconnect: bool,
    #[serde(rename = "reconnectDelaySec")]
    pub reconnect_delay_sec: u32,
    pub enabled: bool,
    pub tunnels: Vec<TunnelConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ConfigFile {
    pub version: u32,
    pub app: AppConfig,
    pub servers: Vec<ServerConfig>,
}

impl Default for ConfigFile {
    fn default() -> Self {
        Self {
            version: 1,
            app: AppConfig {
                start_minimized: true,
                close_to_tray: true,
                launch_at_login: true,
                theme: "system".to_string(),
            },
            servers: vec![],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_config_defaults() {
        let config = ConfigFile::default();
        assert_eq!(config.app.start_minimized, true);
        assert_eq!(config.app.close_to_tray, true);
        assert_eq!(config.app.launch_at_login, true);
        assert_eq!(config.app.theme, "system");
    }
}
