pub mod core;
pub mod models;
pub mod commands;

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent},
    Manager, WindowEvent, Emitter,
};
use tauri_plugin_autostart::ManagerExt;
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
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .manage(AppState {
            config_store: config_store.clone(),
            process_manager: process_manager.clone(),
        })
        .setup(move |app| {
            // Read config
            let config = {
                let store = tokio::task::block_in_place(|| {
                    tokio::runtime::Handle::current().block_on(async { config_store.lock().await.load_config() })
                }).unwrap_or_default();
                store
            };

            // Setup tray menu
            let show_i = MenuItem::with_id(app, "show", "Show Main Window", true, None::<&str>)?;
            let start_all_i = MenuItem::with_id(app, "start_all", "Start All", true, None::<&str>)?;
            let stop_all_i = MenuItem::with_id(app, "stop_all", "Stop All", true, None::<&str>)?;
            let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &start_all_i, &stop_all_i, &settings_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                window.show().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                        "start_all" => {
                            let pm = app.state::<AppState>().process_manager.clone();
                            let cs = app.state::<AppState>().config_store.clone();
                            tauri::async_runtime::spawn(async move {
                                if let Ok(cfg) = cs.lock().await.load_config() {
                                    for server in cfg.servers {
                                        if server.enabled {
                                            let _ = pm.start_server(&server).await;
                                        }
                                    }
                                }
                            });
                        }
                        "stop_all" => {
                            let pm = app.state::<AppState>().process_manager.clone();
                            let cs = app.state::<AppState>().config_store.clone();
                            tauri::async_runtime::spawn(async move {
                                if let Ok(cfg) = cs.lock().await.load_config() {
                                    for server in cfg.servers {
                                        let _ = pm.stop_server(&server.id).await;
                                    }
                                }
                            });
                        }
                        "settings" => {
                            if let Some(window) = app.get_webview_window("main") {
                                window.show().unwrap();
                                window.set_focus().unwrap();
                                let _ = window.emit("navigate", "settings");
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                window.hide().unwrap();
                            } else {
                                window.show().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                    }
                })
                .build(app)?;

            // Auto-start enabled servers
            let pm_clone = process_manager.clone();
            let config_clone = config.clone();
            tauri::async_runtime::spawn(async move {
                for server in config_clone.servers {
                    if server.auto_start && server.enabled {
                        let _ = pm_clone.start_server(&server).await;
                    }
                }
            });
            
            // Handle app autostart toggle
            let autolaunch = app.autolaunch();
            if config.app.launch_at_login {
                let _ = autolaunch.enable();
            } else {
                let _ = autolaunch.disable();
            }

            // Check if launched by autostart with --minimized
            let args: Vec<String> = std::env::args().collect();
            let has_minimized_flag = args.contains(&"--minimized".to_string());
            
            if !config.app.start_minimized && !has_minimized_flag {
                if let Some(window) = app.get_webview_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();
                let config_store = app.state::<AppState>().config_store.clone();
                let close_to_tray = {
                    let store = tokio::task::block_in_place(|| {
                        tokio::runtime::Handle::current().block_on(async { config_store.lock().await.load_config() })
                    }).unwrap_or_default();
                    store.app.close_to_tray
                };
                
                if close_to_tray {
                    window.hide().unwrap();
                    api.prevent_close();
                }
            }
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
