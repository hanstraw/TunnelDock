use crate::models::config::ServerConfig;
use crate::models::status::{ServerRuntimeStatus, Status};
use crate::core::ssh_command_builder::SshCommandBuilder;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, oneshot};
use tokio::process::Command;
use chrono::Utc;
use std::process::Stdio;

pub struct ManagedProcess {
    pub status: ServerRuntimeStatus,
    pub stop_tx: Option<oneshot::Sender<()>>,
}

#[derive(Clone)]
pub struct ProcessManager {
    processes: Arc<Mutex<HashMap<String, ManagedProcess>>>,
}

impl ProcessManager {
    pub fn new() -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn start_server(&self, server: &ServerConfig) -> Result<(), String> {
        let mut procs = self.processes.lock().await;
        
        if let Some(proc) = procs.get(&server.id) {
            if proc.status.status == Status::Running || proc.status.status == Status::Starting {
                return Ok(());
            }
        }

        let args = SshCommandBuilder::build_args(server);
        
        let mut cmd = Command::new("ssh");
        cmd.args(args);
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());
        
        #[cfg(target_os = "windows")]
        {
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        }

        let mut child = cmd.spawn().map_err(|e| format!("Failed to start ssh: {}", e))?;
        let pid = child.id();

        let active_tunnels = server.tunnels.iter().filter(|t| t.enabled).count();

        let status = ServerRuntimeStatus {
            server_id: server.id.clone(),
            status: Status::Running,
            pid,
            started_at: Some(Utc::now().to_rfc3339()),
            uptime_sec: 0,
            restart_count: 0,
            last_error: None,
            active_tunnel_count: active_tunnels,
        };

        let (stop_tx, mut stop_rx) = oneshot::channel();
        
        procs.insert(server.id.clone(), ManagedProcess {
            status: status.clone(),
            stop_tx: Some(stop_tx),
        });

        let procs_clone = self.processes.clone();
        let server_id = server.id.clone();
        
        tokio::spawn(async move {
            tokio::select! {
                _ = child.wait() => {
                    let mut p = procs_clone.lock().await;
                    if let Some(proc) = p.get_mut(&server_id) {
                        proc.status.status = Status::Stopped;
                        proc.status.pid = None;
                        proc.stop_tx = None;
                    }
                }
                _ = &mut stop_rx => {
                    let _ = child.kill().await;
                    let mut p = procs_clone.lock().await;
                    if let Some(proc) = p.get_mut(&server_id) {
                        proc.status.status = Status::Stopped;
                        proc.status.pid = None;
                        proc.stop_tx = None;
                    }
                }
            }
        });

        Ok(())
    }

    pub async fn stop_server(&self, server_id: &str) -> Result<(), String> {
        let mut procs = self.processes.lock().await;
        if let Some(proc) = procs.get_mut(server_id) {
            proc.status.status = Status::Stopping;
            if let Some(tx) = proc.stop_tx.take() {
                let _ = tx.send(());
            }
        }
        Ok(())
    }

    pub async fn get_status(&self, server_id: &str) -> Option<ServerRuntimeStatus> {
        let procs = self.processes.lock().await;
        procs.get(server_id).map(|p| p.status.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_process_manager() {
        let pm = ProcessManager::new();
        assert!(pm.get_status("test").await.is_none());
    }
}
