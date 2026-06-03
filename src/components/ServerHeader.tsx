import React from 'react';
import { ServerConfig, ServerRuntimeStatus } from '../types/server';

interface ServerHeaderProps {
  server: ServerConfig;
  status?: ServerRuntimeStatus;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onDelete: () => void;
}

export const ServerHeader: React.FC<ServerHeaderProps> = ({ server, status, onStart, onStop, onRestart, onDelete }) => {
  const currentStatus = status?.status || 'stopped';

  return (
    <div className="server-header">
      <div className="title-area">
        <h1>{server.name}</h1>
        <span className={`status-badge status-${currentStatus}`}>{currentStatus}</span>
      </div>
      <div className="actions">
        <button onClick={onStart} disabled={currentStatus === 'running' || currentStatus === 'starting'}>Start</button>
        <button onClick={onStop} disabled={currentStatus === 'stopped'}>Stop</button>
        <button onClick={onRestart}>Restart</button>
        <button onClick={onDelete} className="danger">Delete</button>
      </div>
    </div>
  );
};
