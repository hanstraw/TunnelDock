use crate::models::config::ServerConfig;

pub struct SshCommandBuilder;

impl SshCommandBuilder {
    pub fn build_args(server: &ServerConfig) -> Vec<String> {
        let mut args = vec![
            "-N".to_string(),
            "-o".to_string(),
            "ServerAliveInterval=30".to_string(),
            "-o".to_string(),
            "ServerAliveCountMax=3".to_string(),
            "-o".to_string(),
            "ExitOnForwardFailure=yes".to_string(),
            "-o".to_string(),
            "BatchMode=yes".to_string(),
        ];

        if let Some(key) = &server.private_key {
            if !key.is_empty() {
                args.push("-i".to_string());
                args.push(key.clone());
            }
        }

        for tunnel in &server.tunnels {
            if tunnel.enabled {
                args.push("-L".to_string());
                args.push(format!(
                    "{}:{}:{}:{}",
                    tunnel.local_host, tunnel.local_port, tunnel.remote_host, tunnel.remote_port
                ));
            }
        }

        args.push(format!("{}@{}", server.ssh_user, server.ssh_host));
        args.push("-p".to_string());
        args.push(server.ssh_port.to_string());

        args
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::config::TunnelConfig;

    #[test]
    fn test_build_args() {
        let server = ServerConfig {
            id: "test".to_string(),
            name: "Test".to_string(),
            ssh_host: "example.com".to_string(),
            ssh_port: 2222,
            ssh_user: "root".to_string(),
            private_key: Some("C:\\key".to_string()),
            use_agent: false,
            auto_start: false,
            auto_reconnect: false,
            reconnect_delay_sec: 5,
            enabled: true,
            tunnels: vec![
                TunnelConfig {
                    id: "t1".to_string(),
                    name: "T1".to_string(),
                    enabled: true,
                    local_host: "127.0.0.1".to_string(),
                    local_port: 8080,
                    remote_host: "127.0.0.1".to_string(),
                    remote_port: 80,
                    open_url: None,
                    description: None,
                },
                TunnelConfig {
                    id: "t2".to_string(),
                    name: "T2".to_string(),
                    enabled: false,
                    local_host: "127.0.0.1".to_string(),
                    local_port: 8081,
                    remote_host: "127.0.0.1".to_string(),
                    remote_port: 81,
                    open_url: None,
                    description: None,
                },
            ],
        };

        let args = SshCommandBuilder::build_args(&server);
        
        let expected = vec![
            "-N",
            "-o", "ServerAliveInterval=30",
            "-o", "ServerAliveCountMax=3",
            "-o", "ExitOnForwardFailure=yes",
            "-o", "BatchMode=yes",
            "-i", "C:\\key",
            "-L", "127.0.0.1:8080:127.0.0.1:80",
            "root@example.com",
            "-p", "2222"
        ];
        
        assert_eq!(args, expected);
    }
}
