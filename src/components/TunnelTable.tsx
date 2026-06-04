import React from 'react';
import { TunnelConfig } from '../types/tunnel';

interface TunnelTableProps {
  tunnels: TunnelConfig[];
  onAdd: () => void;
  onEdit: (tunnel: TunnelConfig) => void;
  onDelete: (tunnel: TunnelConfig) => void;
  onToggle: (tunnelId: string, enabled: boolean) => void;
  onOpenUrl: (url: string) => void;
  serverRunning?: boolean;
  labels?: {
    tunnels: string;
    addTunnel: string;
    enabled: string;
    name: string;
    local: string;
    remote: string;
    status: string;
    actions: string;
    connected: string;
    stopped: string;
    open: string;
    edit: string;
    delete: string;
    empty: string;
  };
}

export const TunnelTable: React.FC<TunnelTableProps> = ({ tunnels, onAdd, onEdit, onDelete, onToggle, onOpenUrl, labels, serverRunning = true }) => {
  const text = labels ?? { tunnels: 'Tunnels', addTunnel: 'Add Tunnel', enabled: 'Enabled', name: 'Name', local: 'Local', remote: 'Remote', status: 'Status', actions: 'Actions', connected: 'Connected', stopped: 'Stopped', open: 'Open', edit: 'Edit', delete: 'Delete', empty: 'No tunnels configured.' };
  return (
    <div className="tunnel-table-container">
      <div className="table-header">
        <h3>{text.tunnels}</h3>
        <button className="secondary" onClick={onAdd}>{text.addTunnel}</button>
      </div>
      <table className="tunnel-table">
        <thead>
          <tr>
            <th>{text.enabled}</th>
            <th>{text.name}</th>
            <th>{text.local}</th>
            <th>{text.remote}</th>
            <th>{text.status}</th>
            <th>{text.actions}</th>
          </tr>
        </thead>
        <tbody>
          {tunnels.map(tunnel => (
            <tr key={tunnel.id}>
              {/** A tunnel is connected only when it is enabled and its server process is running. */}
              <td>
                <input 
                  type="checkbox" 
                  className="toggle"
                  checked={tunnel.enabled} 
                  onChange={(e) => onToggle(tunnel.id, e.target.checked)} 
                />
              </td>
              <td>{tunnel.name}</td>
              <td>{`${tunnel.localHost}:${tunnel.localPort}`}</td>
              <td>{`${tunnel.remoteHost}:${tunnel.remotePort}`}</td>
              <td><span className={`row-status ${tunnel.enabled && serverRunning ? 'running' : 'stopped'}`}>{tunnel.enabled && serverRunning ? text.connected : text.stopped}</span></td>
              <td className="table-actions">
                {tunnel.openUrl && <button aria-label={text.open} onClick={() => onOpenUrl(tunnel.openUrl!)}>{text.open}</button>}
                <button aria-label={text.edit} onClick={() => onEdit(tunnel)}>{text.edit}</button>
                <button aria-label={text.delete} onClick={() => onDelete(tunnel)} className="danger-icon">{text.delete}</button>
              </td>
            </tr>
          ))}
          {tunnels.length === 0 && (
            <tr>
              <td colSpan={6} className="empty-cell">{text.empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
