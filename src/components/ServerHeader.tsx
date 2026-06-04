import React from 'react';
import { ServerConfig, ServerRuntimeStatus, FailureReason } from '../types/server';

interface ServerHeaderProps {
  server: ServerConfig;
  status?: ServerRuntimeStatus;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onDelete: () => void;
  onEdit: () => void;
  labels?: {
    start: string;
    stop: string;
    restart: string;
    edit: string;
    delete: string;
    uptime: string;
    connected: string;
    starting: string;
    stopped: string;
    stopping: string;
    error: string;
    reconnecting: string;
    failureReasons: Record<FailureReason | 'unknown', string>;
  };
}

const formatUptime = (seconds?: number) => {
  const total = seconds ?? 0;
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return `${days} 天 ${hours} 小时 ${minutes} 分钟`;
};

export const ServerHeader: React.FC<ServerHeaderProps> = ({ server, status, onStart, onStop, onRestart, onDelete, onEdit, labels }) => {
  const text = labels ?? {
    start: 'Start', stop: 'Stop', restart: 'Restart', edit: 'Edit', delete: 'Delete', uptime: 'Uptime', connected: 'running', starting: 'starting', stopped: 'stopped', stopping: 'stopping', error: 'error', reconnecting: 'reconnecting',
    failureReasons: { portOccupied: 'Port Occupied', sshMissing: 'SSH Missing', hostKeyIssue: 'Host Key Issue', connectionFailed: 'Connection Failed', unknown: 'Unknown Error' },
  };
  const currentStatus = status?.status || 'stopped';
  const statusLabels = {
    running: text.connected,
    starting: text.starting,
    stopped: text.stopped,
    stopping: text.stopping,
    error: text.error,
    reconnecting: text.reconnecting,
  };
  const displayStatus = currentStatus === 'error' && status?.failureReason
    ? `${text.error}: ${text.failureReasons[status.failureReason]}`
    : statusLabels[currentStatus];

  return (
    <div className="server-header">
      <div className="title-area">
        <h1>{server.name}</h1>
        <div className="meta-row">
          <span className={`status-dot status-${currentStatus}`} />
          <span className="status-text" title={status?.lastError}>{displayStatus}</span>
          <span className="meta-separator" />
          <span className="uptime">{text.uptime}: {formatUptime(status?.uptimeSec)}</span>
        </div>
      </div>
      <div className="actions">
        <button className="primary" aria-label={text.start} onClick={onStart} disabled={currentStatus === 'running' || currentStatus === 'starting'}>{text.start}</button>
        <button className="danger-soft" aria-label={text.stop} onClick={onStop} disabled={currentStatus === 'stopped'}>{text.stop}</button>
        <button aria-label={text.restart} onClick={onRestart}>{text.restart}</button>
        <button onClick={onEdit}>{text.edit}</button>
        <button onClick={onDelete} className="icon-danger">{text.delete}</button>
      </div>
    </div>
  );
};
