use crate::models::config::ServerConfig;
use std::net::TcpListener;
use std::collections::HashSet;

pub struct PortChecker;

impl PortChecker {
    pub fn check_local_port(host: &str, port: u16) -> Result<Vec<String>, String> {
        let mut warnings = Vec::new();
        
        if host == "0.0.0.0" {
            warnings.push(format!("Warning: localHost {} is unsafe.", host));
        }

        let addr = format!("{}:{}", host, port);
        match TcpListener::bind(&addr) {
            Ok(_) => Ok(warnings),
            Err(e) => Err(format!("Port {} is in use on {}: {}", port, host, e)),
        }
    }

    pub fn validate_server(server: &ServerConfig) -> Result<Vec<String>, String> {
        let mut warnings = Vec::new();
        let mut seen = HashSet::new();

        for tunnel in &server.tunnels {
            if !tunnel.enabled {
                continue;
            }

            let key = format!("{}:{}", tunnel.local_host, tunnel.local_port);
            if !seen.insert(key.clone()) {
                return Err(format!("Duplicate local forwarding found in config: {}", key));
            }

            let port_warnings = Self::check_local_port(&tunnel.local_host, tunnel.local_port)?;
            warnings.extend(port_warnings);
        }
        
        Ok(warnings)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::config::TunnelConfig;

    #[test]
    fn test_check_local_port() {
        // Try to bind to port 0 (OS assigns a random free port), this should always succeed.
        // But for testing explicit port, we might have issues if port is in use.
        // We just test 0.
        let res = PortChecker::check_local_port("127.0.0.1", 0);
        assert!(res.is_ok());
        assert!(res.unwrap().is_empty());

        let res2 = PortChecker::check_local_port("0.0.0.0", 0);
        assert!(res2.is_ok());
        assert_eq!(res2.unwrap().len(), 1);
    }

    #[test]
    fn test_validate_server_duplicate() {
        let mut server = ServerConfig {
            id: "1".to_string(),
            name: "s1".to_string(),
            ssh_host: "127.0.0.1".to_string(),
            ssh_port: 22,
            ssh_user: "root".to_string(),
            private_key: None,
            use_agent: false,
            auto_start: false,
            auto_reconnect: false,
            reconnect_delay_sec: 5,
            enabled: true,
            tunnels: vec![],
        };
        server.tunnels = vec![
            TunnelConfig {
                id: "1".to_string(),
                name: "t1".to_string(),
                enabled: true,
                local_host: "127.0.0.1".to_string(),
                local_port: 8080,
                remote_host: "127.0.0.1".to_string(),
                remote_port: 80,
                open_url: None,
                description: None,
            },
            TunnelConfig {
                id: "2".to_string(),
                name: "t2".to_string(),
                enabled: true,
                local_host: "127.0.0.1".to_string(),
                local_port: 8080,
                remote_host: "127.0.0.1".to_string(),
                remote_port: 90,
                open_url: None,
                description: None,
            }
        ];

        let res = PortChecker::validate_server(&server);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Duplicate"));
    }
}
