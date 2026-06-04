use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use tokio::sync::RwLock;
use std::path::PathBuf;
use tokio::fs::OpenOptions;
use tokio::io::AsyncWriteExt;
use std::env;

const MAX_LINES: usize = 200;

#[derive(Clone)]
pub struct LogStore {
    logs: Arc<RwLock<HashMap<String, VecDeque<String>>>>,
    log_dir: PathBuf,
}

impl LogStore {
    pub fn new() -> Self {
        let app_data = env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
        let mut log_dir = PathBuf::from(app_data);
        log_dir.push("ssh-tunnel-tray");
        log_dir.push("logs");

        std::fs::create_dir_all(&log_dir).ok();

        Self {
            logs: Arc::new(RwLock::new(HashMap::new())),
            log_dir,
        }
    }

    pub async fn append_log(&self, server_id: &str, line: String) {
        let mut logs = self.logs.write().await;
        let server_logs = logs.entry(server_id.to_string()).or_insert_with(VecDeque::new);
        
        server_logs.push_back(line.clone());
        if server_logs.len() > MAX_LINES {
            server_logs.pop_front();
        }

        // write to file
        let mut file_path = self.log_dir.clone();
        file_path.push(format!("{}.log", server_id));
        
        if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(&file_path).await {
            let _ = file.write_all(format!("{}\n", line).as_bytes()).await;
        }
    }

    pub async fn get_logs(&self, server_id: &str) -> Vec<String> {
        let logs = self.logs.read().await;
        logs.get(server_id)
            .map(|l| l.iter().cloned().collect())
            .unwrap_or_default()
    }

    pub async fn clear_logs(&self, server_id: &str) {
        let mut logs = self.logs.write().await;
        if let Some(server_logs) = logs.get_mut(server_id) {
            server_logs.clear();
        }

        let mut file_path = self.log_dir.clone();
        file_path.push(format!("{}.log", server_id));
        let _ = tokio::fs::remove_file(&file_path).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_log_store() {
        let store = LogStore::new();
        store.append_log("test1", "line 1".to_string()).await;
        store.append_log("test1", "line 2".to_string()).await;

        let logs = store.get_logs("test1").await;
        assert_eq!(logs.len(), 2);
        assert_eq!(logs[0], "line 1");

        store.clear_logs("test1").await;
        let logs = store.get_logs("test1").await;
        assert_eq!(logs.len(), 0);
    }
}
