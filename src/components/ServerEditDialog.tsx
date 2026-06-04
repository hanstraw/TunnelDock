import React, { useState } from 'react';
import { ServerConfig } from '../types/server';

interface ServerEditDialogProps {
  server?: ServerConfig;
  onSave: (server: ServerConfig) => void;
  onCancel: () => void;
}

const createId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `server-${Date.now()}`);

export const ServerEditDialog: React.FC<ServerEditDialogProps> = ({ server, onSave, onCancel }) => {
  const [formData, setFormData] = useState<ServerConfig>(server || {
    id: createId(),
    name: '新服务器',
    sshHost: 'example.com',
    sshPort: 22,
    sshUser: 'root',
    privateKey: '',
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

  const save = () => {
    onSave({ ...formData, privateKey: formData.privateKey?.trim() || undefined });
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2>{server ? '编辑服务器' : '添加服务器'}</h2>
        <div className="form-group">
          <label htmlFor="server-name">服务器名称</label>
          <input id="server-name" name="name" value={formData.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="ssh-host">SSH 地址</label>
          <input id="ssh-host" name="sshHost" value={formData.sshHost} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="ssh-port">SSH 端口</label>
          <input id="ssh-port" type="number" name="sshPort" min="1" max="65535" value={formData.sshPort} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="ssh-user">用户名</label>
          <input id="ssh-user" name="sshUser" value={formData.sshUser} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="private-key">私钥路径</label>
          <input id="private-key" name="privateKey" value={formData.privateKey || ''} onChange={handleChange} placeholder="C:\\Users\\you\\.ssh\\id_ed25519" />
        </div>
        <div className="form-group checkbox">
          <label><input type="checkbox" name="useAgent" checked={formData.useAgent} onChange={handleChange} /> 使用 ssh-agent</label>
        </div>
        <div className="form-group checkbox">
          <label><input type="checkbox" name="autoStart" checked={formData.autoStart} onChange={handleChange} /> 应用启动后自动启动此服务器</label>
        </div>
        <div className="form-group checkbox">
          <label><input type="checkbox" name="autoReconnect" checked={formData.autoReconnect} onChange={handleChange} /> 断线自动重连</label>
        </div>
        <div className="dialog-actions">
          <button onClick={onCancel}>取消</button>
          <button className="primary" onClick={save}>保存</button>
        </div>
      </div>
    </div>
  );
};
