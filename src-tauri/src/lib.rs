pub mod core;
pub mod models;
pub mod commands;

use std::sync::Arc;
use tokio::sync::Mutex;
use crate::core::config_store::ConfigStore;
use crate::core::process_manager::ProcessManager;
use crate::commands::server::*;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg(test)]
mod tests {
    use super::greet;

    #[test]
    fn greet_formats_the_name() {
        assert_eq!(
            greet("TunnelDock"),
            "Hello, TunnelDock! You've been greeted from Rust!"
        );
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config_store = Arc::new(Mutex::new(ConfigStore::new()));
    let process_manager = ProcessManager::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            config_store,
            process_manager,
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_config,
            save_config,
            list_servers,
            create_server,
            update_server,
            delete_server,
            start_server,
            stop_server,
            restart_server,
            get_runtime_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
