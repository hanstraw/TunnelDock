import React from 'react';
import { TunnelConfig } from '../types/tunnel';

interface TunnelTableProps {
  tunnels: TunnelConfig[];
  onAdd: () => void;
  onEdit: (tunnel: TunnelConfig) => void;
  onDelete: (tunnel: TunnelConfig) => void;
  onToggle: (tunnelId: string, enabled: boolean) => void;
  onOpenUrl: (url: string) => void;
}

export const TunnelTable: React.FC<TunnelTableProps> = ({ tunnels, onAdd, onEdit, onDelete, onToggle, onOpenUrl }) => {
  return (
    <div className="tunnel-table-container">
      <div className="table-header">
        <h3>Tunnels</h3>
        <button onClick={onAdd}>Add Tunnel</button>
      </div>
      <table className="tunnel-table">
        <thead>
          <tr>
            <th>Enabled</th>
            <th>Name</th>
            <th>Local</th>
            <th>Remote</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tunnels.map(tunnel => (
            <tr key={tunnel.id}>
              <td>
                <input 
                  type="checkbox" 
                  checked={tunnel.enabled} 
                  onChange={(e) => onToggle(tunnel.id, e.target.checked)} 
                />
              </td>
              <td>{tunnel.name}</td>
              <td>{`${tunnel.localHost}:${tunnel.localPort}`}</td>
              <td>{`${tunnel.remoteHost}:${tunnel.remotePort}`}</td>
              <td>
                <button onClick={() => onEdit(tunnel)}>Edit</button>
                <button onClick={() => onDelete(tunnel)} className="danger">Delete</button>
                {tunnel.openUrl && <button onClick={() => onOpenUrl(tunnel.openUrl!)}>Open</button>}
              </td>
            </tr>
          ))}
          {tunnels.length === 0 && (
            <tr>
              <td colSpan={5}>No tunnels configured.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
