use crate::models::config::ConfigFile;
use std::fs;
use std::path::PathBuf;

pub struct ConfigStore {
    config_path: PathBuf,
}

impl ConfigStore {
    pub fn new() -> Self {
        let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".into());
        let mut path = PathBuf::from(appdata);
        path.push("ssh-tunnel-tray");
        path.push("config.json");
        Self { config_path: path }
    }

    pub fn with_path(path: PathBuf) -> Self {
        Self { config_path: path }
    }

    pub fn get_config_path(&self) -> &PathBuf {
        &self.config_path
    }

    pub fn load_config(&self) -> Result<ConfigFile, String> {
        if !self.config_path.exists() {
            let default_config = ConfigFile::default();
            self.save_config(&default_config)?;
            return Ok(default_config);
        }

        let content = fs::read_to_string(&self.config_path)
            .map_err(|e| format!("Failed to read config file: {}", e))?;
        
        let mut json_val: serde_json::Value = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config JSON: {}", e))?;
            
        let mut migrated = false;
        
        if json_val.get("version").is_none() {
            json_val["version"] = serde_json::json!(1);
            migrated = true;
        }
        
        let config: ConfigFile = serde_json::from_value(json_val)
            .map_err(|e| format!("Failed to parse config JSON: {}", e))?;
            
        if migrated {
            self.backup_config()?;
            self.save_config(&config)?;
        }
            
        Ok(config)
    }

    pub fn backup_config(&self) -> Result<(), String> {
        if !self.config_path.exists() {
            return Ok(());
        }
        let backup_path = self.config_path.with_extension("json.bak");
        fs::copy(&self.config_path, &backup_path)
            .map_err(|e| format!("Failed to backup config: {}", e))?;
        Ok(())
    }

    pub fn save_config(&self, config: &ConfigFile) -> Result<(), String> {
        if let Some(parent) = self.config_path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create config directory: {}", e))?;
            }
        }

        let content = serde_json::to_string_pretty(config)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;
            
        fs::write(&self.config_path, content)
            .map_err(|e| format!("Failed to write config file: {}", e))?;
            
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_load_save_config() {
        let dir = tempdir().unwrap();
        let config_path = dir.path().join("config.json");
        let store = ConfigStore::with_path(config_path.clone());

        // Test load defaults when not exists
        let config = store.load_config().unwrap();
        assert_eq!(config.version, 1);
        assert!(config_path.exists());

        // Modify and save
        let mut new_config = config.clone();
        new_config.app.theme = "dark".to_string();
        store.save_config(&new_config).unwrap();

        // Load again
        let loaded = store.load_config().unwrap();
        assert_eq!(loaded.app.theme, "dark");
    }

    #[test]
    fn test_config_migration() {
        let dir = tempdir().unwrap();
        let config_path = dir.path().join("config.json");
        let store = ConfigStore::with_path(config_path.clone());

        // Write a v0 config (missing version)
        let v0_json = r#"{
            "app": {
                "startMinimized": true,
                "closeToTray": true,
                "launchAtLogin": true,
                "theme": "system"
            },
            "servers": []
        }"#;
        fs::write(&config_path, v0_json).unwrap();

        // Load should migrate to v1
        let config = store.load_config().unwrap();
        assert_eq!(config.version, 1);

        // Check if backup was created
        let backup_path = config_path.with_extension("json.bak");
        assert!(backup_path.exists(), "Backup file should be created during migration");

        // Verify backup content
        let backup_content = fs::read_to_string(&backup_path).unwrap();
        assert_eq!(backup_content, v0_json);

        // Verify the saved config is v1
        let saved_content = fs::read_to_string(&config_path).unwrap();
        assert!(saved_content.contains("\"version\": 1"));
    }
}
