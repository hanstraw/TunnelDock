import React from 'react';
import { ServerConfig } from '../types/server';

interface SidebarProps {
  servers: ServerConfig[];
  selectedServerId?: string;
  onSelectServer: (server: ServerConfig) => void;
  onAddServer: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ servers, selectedServerId, onSelectServer, onAddServer }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Servers</h2>
        <button onClick={onAddServer}>+ Add Server</button>
      </div>
      <ul className="server-list">
        {servers.map(server => (
          <li 
            key={server.id} 
            className={server.id === selectedServerId ? 'active' : ''}
            onClick={() => onSelectServer(server)}
          >
            {server.name}
          </li>
        ))}
      </ul>
    </div>
  );
};
