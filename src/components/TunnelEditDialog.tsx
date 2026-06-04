import React, { useState } from 'react';
import { TunnelConfig } from '../types/tunnel';

interface TunnelEditDialogProps {
  tunnel?: TunnelConfig;
  onSave: (tunnel: TunnelConfig) => void;
  onCancel: () => void;
}

const createId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `tunnel-${Date.now()}`);

export const TunnelEditDialog: React.FC<TunnelEditDialogProps> = ({ tunnel, onSave, onCancel }) => {
  const [formData, setFormData] = useState<TunnelConfig>(tunnel || {
    id: createId(),
    name: '新隧道',
    enabled: true,
    localHost: '127.0.0.1',
    localPort: 18000,
    remoteHost: '127.0.0.1',
    remotePort: 8000,
    openUrl: 'http://127.0.0.1:18000',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const save = () => {
    onSave({
      ...formData,
      localHost: formData.localHost || '127.0.0.1',
      remoteHost: formData.remoteHost || '127.0.0.1',
      openUrl: formData.openUrl?.trim() || undefined,
      description: formData.description?.trim() || undefined,
    });
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2>{tunnel ? '编辑隧道' : '添加隧道'}</h2>
        <div className="form-group checkbox">
          <label><input type="checkbox" name="enabled" checked={formData.enabled} onChange={handleChange} /> 启用隧道</label>
        </div>
        <div className="form-group">
          <label htmlFor="tunnel-name">隧道名称</label>
          <input id="tunnel-name" name="name" value={formData.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="local-host">本地监听地址</label>
          <input id="local-host" name="localHost" value={formData.localHost} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="local-port">本地端口</label>
          <input id="local-port" type="number" name="localPort" min="1" max="65535" value={formData.localPort} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="remote-host">远程目标地址</label>
          <input id="remote-host" name="remoteHost" value={formData.remoteHost} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="remote-port">远程目标端口</label>
          <input id="remote-port" type="number" name="remotePort" min="1" max="65535" value={formData.remotePort} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="open-url">打开地址</label>
          <input id="open-url" name="openUrl" value={formData.openUrl || ''} onChange={handleChange} />
        </div>
        <div className="dialog-actions">
          <button onClick={onCancel}>取消</button>
          <button className="primary" onClick={save}>保存</button>
        </div>
      </div>
    </div>
  );
};
