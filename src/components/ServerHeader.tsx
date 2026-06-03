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
}

const formatFailureReason = (reason?: FailureReason) => {
  switch (reason) {
    case 'portOccupied': return 'Port Occupied';
    case 'sshMissing': return 'SSH Missing';
    case 'hostKeyIssue': return 'Host Key Issue';
    case 'connectionFailed': return 'Connection Failed';
    default: return 'Unknown Error';
  }
};

export const ServerHeader: React.FC<ServerHeaderProps> = ({ server, status, onStart, onStop, onRestart, onDelete, onEdit }) => {
  const currentStatus = status?.status || 'stopped';
  const displayStatus = currentStatus === 'error' && status?.failureReason 
    ? `Error: ${formatFailureReason(status.failureReason)}`
    : currentStatus;

  return (
    <div className="server-header">
      <div className="title-area">
        <h1>{server.name}</h1>
        <span className={`status-badge status-${currentStatus}`} title={status?.lastError}>{displayStatus}</span>
      </div>
      <div className="actions">
        <button onClick={onStart} disabled={currentStatus === 'running' || currentStatus === 'starting'}>Start</button>
        <button onClick={onStop} disabled={currentStatus === 'stopped'}>Stop</button>
        <button onClick={onRestart}>Restart</button>
        <button onClick={onEdit}>Edit</button>
        <button onClick={onDelete} className="danger">Delete</button>
      </div>
    </div>
  );
};
