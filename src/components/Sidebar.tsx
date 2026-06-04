import React from 'react';
import { ServerConfig } from '../types/server';

interface SidebarProps {
  servers: ServerConfig[];
  selectedServerId?: string;
  onSelectServer: (server: ServerConfig) => void;
  onAddServer: () => void;
  onShowSettings?: () => void;
  onShowAbout?: () => void;
  labels?: {
    servers: string;
    addServer: string;
    connected: string;
    disconnected: string;
    settings: string;
    about: string;
  };
  runningServerIds?: Set<string>;
}

export const Sidebar: React.FC<SidebarProps> = ({ servers, selectedServerId, onSelectServer, onAddServer, onShowSettings, onShowAbout, labels, runningServerIds }) => {
  const text = labels ?? { servers: 'Servers', addServer: '+ Add Server', connected: 'Connected', disconnected: 'Disconnected', settings: 'Settings', about: 'About' };
  const runningIds = runningServerIds ?? new Set<string>();
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>{text.servers}</h2>
        <button className="icon-button" aria-label={text.addServer} onClick={onAddServer}>{text.addServer}</button>
      </div>
      <ul className="server-list">
        {servers.map(server => (
          <li
            key={server.id} 
            className={`server-list-item ${server.id === selectedServerId ? 'active' : ''}`}
            onClick={() => onSelectServer(server)}
          >
            <span className={`server-dot ${runningIds.has(server.id) ? 'online' : 'offline'}`} />
            <span>
              <strong>{server.name}</strong>
              <small>{runningIds.has(server.id) ? text.connected : text.disconnected}</small>
            </span>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <button className="side-link" onClick={onShowSettings}>⚙ {text.settings}</button>
        <button className="side-link" onClick={onShowAbout}>ⓘ {text.about}</button>
      </div>
    </div>
  );
};
