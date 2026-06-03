use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;
use crate::core::config_store::ConfigStore;
use crate::core::process_manager::ProcessManager;
use crate::core::log_store::LogStore;
use crate::core::port_checker::PortChecker;
use crate::models::config::{ConfigFile, ServerConfig};
use crate::models::status::ServerRuntimeStatus;

pub struct AppState {
    pub config_store: Arc<Mutex<ConfigStore>>,
    pub process_manager: ProcessManager,
    pub log_store: Arc<LogStore>,
}

#[tauri::command]
pub async fn get_logs(server_id: String, state: State<'_, AppState>) -> Result<Vec<String>, String> {
    Ok(state.log_store.get_logs(&server_id).await)
}

#[tauri::command]
pub async fn clear_logs(server_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.log_store.clear_logs(&server_id).await;
    Ok(())
}

#[tauri::command]
pub async fn check_local_port(host: String, port: u16) -> Result<Vec<String>, String> {
    PortChecker::check_local_port(&host, port)
}

#[tauri::command]
pub async fn open_url(url: String) -> Result<(), String> {
    open::that(url).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn validate_server(server: ServerConfig) -> Result<Vec<String>, String> {
    PortChecker::validate_server(&server)
}

#[tauri::command]
pub async fn get_config(state: State<'_, AppState>) -> Result<ConfigFile, String> {
    let store = state.config_store.lock().await;
    store.load_config()
}

#[tauri::command]
pub async fn save_config(config: ConfigFile, state: State<'_, AppState>) -> Result<(), String> {
    let store = state.config_store.lock().await;
    store.save_config(&config)
}

#[tauri::command]
pub async fn list_servers(state: State<'_, AppState>) -> Result<Vec<ServerConfig>, String> {
    let store = state.config_store.lock().await;
    let config = store.load_config()?;
    Ok(config.servers)
}

#[tauri::command]
pub async fn create_server(server: ServerConfig, state: State<'_, AppState>) -> Result<(), String> {
    let store = state.config_store.lock().await;
    let mut config = store.load_config()?;
    config.servers.push(server);
    store.save_config(&config)
}

#[tauri::command]
pub async fn update_server(server: ServerConfig, state: State<'_, AppState>) -> Result<(), String> {
    let store = state.config_store.lock().await;
    let mut config = store.load_config()?;
    if let Some(pos) = config.servers.iter().position(|s| s.id == server.id) {
        config.servers[pos] = server;
        store.save_config(&config)
    } else {
        Err("Server not found".into())
    }
}

#[tauri::command]
pub async fn delete_server(server_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let store = state.config_store.lock().await;
    let mut config = store.load_config()?;
    config.servers.retain(|s| s.id != server_id);
    store.save_config(&config)
}

#[tauri::command]
pub async fn start_server(server_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let store = state.config_store.lock().await;
    let config = store.load_config()?;
    let server = config.servers.iter().find(|s| s.id == server_id).ok_or("Server not found")?;
    state.process_manager.start_server(server).await
}

#[tauri::command]
pub async fn stop_server(server_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.process_manager.stop_server(&server_id).await
}

#[tauri::command]
pub async fn restart_server(server_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.process_manager.stop_server(&server_id).await?;
    let store = state.config_store.lock().await;
    let config = store.load_config()?;
    let server = config.servers.iter().find(|s| s.id == server_id).ok_or("Server not found")?;
    state.process_manager.start_server(server).await
}

#[tauri::command]
pub async fn get_runtime_status(server_id: String, state: State<'_, AppState>) -> Result<Option<ServerRuntimeStatus>, String> {
    Ok(state.process_manager.get_status(&server_id).await)
}
