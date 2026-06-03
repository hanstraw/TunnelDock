import React, { useState } from 'react';
import { ServerConfig } from '../types/server';

interface ServerEditDialogProps {
  server?: ServerConfig;
  onSave: (server: ServerConfig) => void;
  onCancel: () => void;
}

export const ServerEditDialog: React.FC<ServerEditDialogProps> = ({ server, onSave, onCancel }) => {
  const [formData, setFormData] = useState<ServerConfig>(server || {
    id: crypto.randomUUID(),
    name: 'New Server',
    sshHost: '127.0.0.1',
    sshPort: 22,
    sshUser: 'root',
    useAgent: true,
    autoStart: false,
    autoReconnect: true,
    reconnectDelaySec: 5,
    enabled: true,
    tunnels: []
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2>{server ? 'Edit Server' : 'Add Server'}</h2>
        <div className="form-group">
          <label>Name</label>
          <input name="name" value={formData.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>SSH Host</label>
          <input name="sshHost" value={formData.sshHost} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>SSH Port</label>
          <input type="number" name="sshPort" value={formData.sshPort} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>SSH User</label>
          <input name="sshUser" value={formData.sshUser} onChange={handleChange} />
        </div>
        <div className="form-group checkbox">
          <label>
            <input type="checkbox" name="useAgent" checked={formData.useAgent} onChange={handleChange} />
            Use SSH Agent
          </label>
        </div>
        <div className="dialog-actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={() => onSave(formData)}>Save</button>
        </div>
      </div>
    </div>
  );
};