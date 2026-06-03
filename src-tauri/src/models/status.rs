use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Status {
    Stopped,
    Starting,
    Running,
    Stopping,
    Error,
    Reconnecting,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerRuntimeStatus {
    #[serde(rename = "serverId")]
    pub server_id: String,
    pub status: Status,
    pub pid: Option<u32>,
    #[serde(rename = "startedAt")]
    pub started_at: Option<String>,
    #[serde(rename = "uptimeSec")]
    pub uptime_sec: u64,
    #[serde(rename = "restartCount")]
    pub restart_count: u32,
    #[serde(rename = "lastError")]
    pub last_error: Option<String>,
    #[serde(rename = "activeTunnelCount")]
    pub active_tunnel_count: usize,
}
