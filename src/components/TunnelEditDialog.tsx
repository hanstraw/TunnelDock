import React, { useState } from 'react';
import { TunnelConfig } from '../types/tunnel';

interface TunnelEditDialogProps {
  tunnel?: TunnelConfig;
  onSave: (tunnel: TunnelConfig) => void;
  onCancel: () => void;
}

export const TunnelEditDialog: React.FC<TunnelEditDialogProps> = ({ tunnel, onSave, onCancel }) => {
  const [formData, setFormData] = useState<TunnelConfig>(tunnel || {
    id: crypto.randomUUID(),
    name: 'New Tunnel',
    enabled: true,
    localHost: '127.0.0.1',
    localPort: 8080,
    remoteHost: '127.0.0.1',
    remotePort: 80,
    openUrl: '',
    description: ''
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
        <h2>{tunnel ? 'Edit Tunnel' : 'Add Tunnel'}</h2>
        <div className="form-group">
          <label>Name</label>
          <input name="name" value={formData.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Local Host</label>
          <input name="localHost" value={formData.localHost} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Local Port</label>
          <input type="number" name="localPort" value={formData.localPort} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Remote Host</label>
          <input name="remoteHost" value={formData.remoteHost} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Remote Port</label>
          <input type="number" name="remotePort" value={formData.remotePort} onChange={handleChange} />
        </div>
        <div className="dialog-actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={() => onSave(formData)}>Save</button>
        </div>
      </div>
    </div>
  );
};