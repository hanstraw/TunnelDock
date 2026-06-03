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
        
        let config: ConfigFile = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config JSON: {}", e))?;
            
        Ok(config)
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
}
