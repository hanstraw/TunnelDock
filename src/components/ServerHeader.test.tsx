import { render, screen, fireEvent } from '@testing-library/react';
import { ServerHeader } from './ServerHeader';
import { ServerConfig, ServerRuntimeStatus } from '../types/server';
import { vi } from 'vitest';

const mockServer: ServerConfig = {
  id: '1',
  name: 'Main Server',
  sshHost: 'host1',
  sshPort: 22,
  sshUser: 'root',
  useAgent: true,
  autoStart: false,
  autoReconnect: false,
  reconnectDelaySec: 5,
  enabled: true,
  tunnels: [],
};

describe('ServerHeader', () => {
  it('renders server name and status', () => {
    const status: ServerRuntimeStatus = { serverId: '1', status: 'running', uptimeSec: 100, restartCount: 0, activeTunnelCount: 1 };
    render(<ServerHeader server={mockServer} status={status} onStart={() => {}} onStop={() => {}} onRestart={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Main Server')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('calls start/stop/restart handlers', () => {
    const handleStart = vi.fn();
    const handleStop = vi.fn();
    const handleRestart = vi.fn();

    const { unmount } = render(
      <ServerHeader 
        server={mockServer} 
        status={{ serverId: '1', status: 'stopped', uptimeSec: 0, restartCount: 0, activeTunnelCount: 0 }} 
        onStart={handleStart} 
        onStop={handleStop} 
        onRestart={handleRestart} 
        onDelete={() => {}} 
      />
    );
    
    fireEvent.click(screen.getByText('Start'));
    expect(handleStart).toHaveBeenCalled();

    unmount();

    render(
      <ServerHeader 
        server={mockServer} 
        status={{ serverId: '1', status: 'running', uptimeSec: 0, restartCount: 0, activeTunnelCount: 0 }} 
        onStart={handleStart} 
        onStop={handleStop} 
        onRestart={handleRestart} 
        onDelete={() => {}} 
      />
    );

    fireEvent.click(screen.getByText('Stop'));
    expect(handleStop).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Restart'));
    expect(handleRestart).toHaveBeenCalled();
  });

  it('calls delete handler', () => {
    const handleDelete = vi.fn();
    render(<ServerHeader server={mockServer} status={undefined} onStart={() => {}} onStop={() => {}} onRestart={() => {}} onDelete={handleDelete} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(handleDelete).toHaveBeenCalled();
  });
});
