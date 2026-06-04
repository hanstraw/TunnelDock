use crate::models::config::ServerConfig;
use crate::models::status::{ServerRuntimeStatus, Status, FailureReason};
use crate::core::ssh_command_builder::SshCommandBuilder;
use crate::core::log_store::LogStore;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, oneshot};
use tokio::process::Command;
use chrono::{DateTime, Utc};
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, BufReader};

pub struct ManagedProcess {
    pub status: ServerRuntimeStatus,
    pub stop_tx: Option<oneshot::Sender<()>>,
}

fn detect_failure_reason(line: &str) -> Option<FailureReason> {
    let lower = line.to_lowercase();
    if lower.contains("address already in use") || lower.contains("bind: address") || lower.contains("cannot listen to port") {
        Some(FailureReason::PortOccupied)
    } else if lower.contains("host key verification failed") || lower.contains("offending key") || lower.contains("strict checking") {
        Some(FailureReason::HostKeyIssue)
    } else if lower.contains("connection refused") || lower.contains("network is unreachable") || lower.contains("connection timed out") {
        Some(FailureReason::ConnectionFailed)
    } else {
        None
    }
}

#[derive(Clone)]
pub struct ProcessManager {
    processes: Arc<Mutex<HashMap<String, ManagedProcess>>>,
    log_store: Arc<LogStore>,
}

impl ProcessManager {
    pub fn new(log_store: Arc<LogStore>) -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
            log_store,
        }
    }

    pub async fn start_server(&self, server: &ServerConfig) -> Result<(), String> {
        let mut procs = self.processes.lock().await;
        
        if let Some(proc) = procs.get(&server.id) {
            if proc.status.status == Status::Running || proc.status.status == Status::Starting || proc.status.status == Status::Reconnecting {
                return Ok(());
            }
        }

        let active_tunnels = server.tunnels.iter().filter(|t| t.enabled).count();

        let status = ServerRuntimeStatus {
            server_id: server.id.clone(),
            status: Status::Starting,
            pid: None,
            started_at: Some(Utc::now().to_rfc3339()),
            uptime_sec: 0,
            restart_count: 0,
            last_error: None,
            failure_reason: None,
            active_tunnel_count: active_tunnels,
        };

        let (stop_tx, stop_rx) = oneshot::channel();
        
        procs.insert(server.id.clone(), ManagedProcess {
            status: status.clone(),
            stop_tx: Some(stop_tx),
        });

        let procs_clone = self.processes.clone();
        let server_clone = server.clone();
        let log_store_clone = self.log_store.clone();
        
        tokio::spawn(async move {
            Self::run_process_loop(procs_clone, server_clone, stop_rx, log_store_clone).await;
        });

        Ok(())
    }

    async fn run_process_loop(procs: Arc<Mutex<HashMap<String, ManagedProcess>>>, server: ServerConfig, mut stop_rx: oneshot::Receiver<()>, log_store: Arc<LogStore>) {
        let server_id = server.id.clone();
        let mut restart_count = 0;

        loop {
            // Update status to starting or reconnecting
            {
                let mut p = procs.lock().await;
                if let Some(proc) = p.get_mut(&server_id) {
                    if restart_count > 0 {
                        proc.status.status = Status::Reconnecting;
                    } else {
                        proc.status.status = Status::Starting;
                    }
                    proc.status.restart_count = restart_count;
                }
            }

            let args = SshCommandBuilder::build_args(&server);
            let mut cmd = Command::new("ssh");
            cmd.args(args);
            cmd.stdout(Stdio::piped());
            cmd.stderr(Stdio::piped());
            
            #[cfg(target_os = "windows")]
            {
                cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
            }

            let spawn_result = cmd.spawn();
            
            let mut child = match spawn_result {
                Ok(c) => c,
                Err(e) => {
                    let err_msg = format!("Failed to spawn: {}", e);
                    let reason = if e.kind() == std::io::ErrorKind::NotFound {
                        Some(FailureReason::SshMissing)
                    } else {
                        Some(FailureReason::Unknown)
                    };
                    log_store.append_log(&server_id, err_msg.clone()).await;
                    let mut p = procs.lock().await;
                    if let Some(proc) = p.get_mut(&server_id) {
                        proc.status.status = Status::Error;
                        proc.status.last_error = Some(err_msg);
                        proc.status.failure_reason = reason;
                    }
                    // Wait before retry if auto_reconnect
                    if server.auto_reconnect {
                        let delay = calculate_backoff(restart_count + 1, server.reconnect_delay_sec);
                        let sleep = tokio::time::sleep(tokio::time::Duration::from_secs(delay));
                        tokio::pin!(sleep);
                        tokio::select! {
                            _ = &mut sleep => {
                                restart_count += 1;
                                continue;
                            }
                            _ = &mut stop_rx => {
                                break;
                            }
                        }
                    } else {
                        break;
                    }
                }
            };

            let pid = child.id();
            {
                let mut p = procs.lock().await;
                if let Some(proc) = p.get_mut(&server_id) {
                    proc.status.status = Status::Running;
                    proc.status.pid = pid;
                    if restart_count == 0 {
                        proc.status.started_at = Some(Utc::now().to_rfc3339());
                    }
                }
            }

            let stdout = child.stdout.take().unwrap();
            let stderr = child.stderr.take().unwrap();
            
            let log_store_out = log_store.clone();
            let server_id_out = server_id.clone();
            let mut stdout_reader = BufReader::new(stdout).lines();
            let procs_out = procs.clone();
            tokio::spawn(async move {
                while let Ok(Some(line)) = stdout_reader.next_line().await {
                    if let Some(reason) = detect_failure_reason(&line) {
                        let mut p = procs_out.lock().await;
                        if let Some(proc) = p.get_mut(&server_id_out) {
                            proc.status.failure_reason = Some(reason);
                        }
                    }
                    log_store_out.append_log(&server_id_out, line).await;
                }
            });

            let log_store_err = log_store.clone();
            let server_id_err = server_id.clone();
            let mut stderr_reader = BufReader::new(stderr).lines();
            let procs_err = procs.clone();
            tokio::spawn(async move {
                while let Ok(Some(line)) = stderr_reader.next_line().await {
                    if let Some(reason) = detect_failure_reason(&line) {
                        let mut p = procs_err.lock().await;
                        if let Some(proc) = p.get_mut(&server_id_err) {
                            proc.status.failure_reason = Some(reason);
                        }
                    }
                    log_store_err.append_log(&server_id_err, line).await;
                }
            });

            // Wait for child to exit or stop signal
            let mut manually_stopped = false;
            tokio::select! {
                _ = child.wait() => {
                    // Child exited
                }
                _ = &mut stop_rx => {
                    let _ = child.kill().await;
                    manually_stopped = true;
                }
            }

            if manually_stopped {
                let mut p = procs.lock().await;
                if let Some(proc) = p.get_mut(&server_id) {
                    proc.status.status = Status::Stopped;
                    proc.status.pid = None;
                    proc.stop_tx = None;
                }
                break;
            }

            // Child exited on its own
            if server.auto_reconnect {
                {
                    let mut p = procs.lock().await;
                    if let Some(proc) = p.get_mut(&server_id) {
                        proc.status.status = Status::Error;
                        proc.status.pid = None;
                    }
                }
                let delay = calculate_backoff(restart_count + 1, server.reconnect_delay_sec);
                let sleep = tokio::time::sleep(tokio::time::Duration::from_secs(delay));
                tokio::pin!(sleep);
                tokio::select! {
                    _ = &mut sleep => {
                        restart_count += 1;
                    }
                    _ = &mut stop_rx => {
                        let mut p = procs.lock().await;
                        if let Some(proc) = p.get_mut(&server_id) {
                            proc.status.status = Status::Stopped;
                            proc.stop_tx = None;
                        }
                        break;
                    }
                }
            } else {
                let mut p = procs.lock().await;
                if let Some(proc) = p.get_mut(&server_id) {
                    proc.status.status = Status::Stopped;
                    proc.status.pid = None;
                    proc.stop_tx = None;
                }
                break;
            }
        }
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
        procs.get(server_id).map(|p| {
            let mut status = p.status.clone();
            if matches!(status.status, Status::Running | Status::Starting | Status::Reconnecting) {
                if let Some(started_at) = &status.started_at {
                    if let Ok(started_at) = DateTime::parse_from_rfc3339(started_at) {
                        status.uptime_sec = Utc::now()
                            .signed_duration_since(started_at.with_timezone(&Utc))
                            .num_seconds()
                            .max(0) as u64;
                    }
                }
            }
            status
        })
    }
}

pub fn calculate_backoff(restart_count: u32, base_delay: u32) -> u64 {
    if restart_count == 0 {
        return base_delay as u64;
    }
    let delay = (base_delay as u64) * 2u64.pow(restart_count - 1);
    std::cmp::min(delay, 60)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_process_manager() {
        let log_store = Arc::new(LogStore::new());
        let pm = ProcessManager::new(log_store);
        assert!(pm.get_status("test").await.is_none());
    }

    #[tokio::test]
    async fn test_get_status_updates_uptime() {
        let log_store = Arc::new(LogStore::new());
        let pm = ProcessManager::new(log_store);
        let started_at = (Utc::now() - chrono::Duration::seconds(75)).to_rfc3339();

        {
            let mut processes = pm.processes.lock().await;
            processes.insert("server-1".to_string(), ManagedProcess {
                status: ServerRuntimeStatus {
                    server_id: "server-1".to_string(),
                    status: Status::Running,
                    pid: Some(1),
                    started_at: Some(started_at),
                    uptime_sec: 0,
                    restart_count: 0,
                    last_error: None,
                    failure_reason: None,
                    active_tunnel_count: 1,
                },
                stop_tx: None,
            });
        }

        let status = pm.get_status("server-1").await.unwrap();
        assert!(status.uptime_sec >= 70, "uptime should be calculated dynamically");
    }

    #[test]
    fn test_calculate_backoff() {
        assert_eq!(calculate_backoff(0, 5), 5); // Although normally retry starts at 1, if 0 it's 5
        assert_eq!(calculate_backoff(1, 5), 5); // 1st retry
        assert_eq!(calculate_backoff(2, 5), 10); // 2nd retry
        assert_eq!(calculate_backoff(3, 5), 20); // 3rd retry
        assert_eq!(calculate_backoff(4, 5), 40); // 4th retry
        assert_eq!(calculate_backoff(5, 5), 60); // 5th retry -> capped at 60
        assert_eq!(calculate_backoff(10, 5), 60); // 10th retry -> capped at 60
    }
}
