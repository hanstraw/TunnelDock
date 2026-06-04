import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ServerHeader } from './ServerHeader';
import { ServerConfig } from '../types/server';

const mockServer: ServerConfig = {
  id: 'server1',
  name: 'Test Server',
  sshHost: 'localhost',
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
  it('renders server name and default status', () => {
    render(<ServerHeader 
      server={mockServer} 
      status={{ serverId: 'server1', status: 'stopped', uptimeSec: 0, restartCount: 0, activeTunnelCount: 0 }}
      onStart={() => {}} 
      onStop={() => {}} 
      onRestart={() => {}} 
      onDelete={() => {}} 
      onEdit={() => {}}
    />);
    expect(screen.getByText('Test Server')).toBeInTheDocument();
    expect(screen.getByText('stopped')).toBeInTheDocument();
  });

  it('calls onStart when start is clicked and not running', () => {
    const onStart = vi.fn();
    render(<ServerHeader 
      server={mockServer} 
      status={{ serverId: 'server1', status: 'stopped', uptimeSec: 0, restartCount: 0, activeTunnelCount: 0 }}
      onStart={onStart} 
      onStop={vi.fn()} 
      onRestart={vi.fn()} 
      onDelete={() => {}} 
      onEdit={() => {}}
    />);
    
    const startBtn = screen.getByText('Start');
    expect(startBtn).not.toBeDisabled();
    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalled();
  });

  it('disables Start and enables Stop when running', () => {
    const onStop = vi.fn();
    render(<ServerHeader 
      server={mockServer} 
      status={{ serverId: 'server1', status: 'running', uptimeSec: 10, restartCount: 0, activeTunnelCount: 0 }}
      onStart={vi.fn()} 
      onStop={onStop} 
      onRestart={vi.fn()} 
      onDelete={() => {}} 
      onEdit={() => {}}
    />);
    
    const startBtn = screen.getByText('Start');
    expect(startBtn).toBeDisabled();

    const stopBtn = screen.getByText('Stop');
    expect(stopBtn).not.toBeDisabled();
    fireEvent.click(stopBtn);
    expect(onStop).toHaveBeenCalled();
  });

  it('calls onDelete', () => {
    const onDelete = vi.fn();
    render(<ServerHeader 
      server={mockServer} 
      status={undefined}
      onStart={() => {}} 
      onStop={() => {}} 
      onRestart={() => {}} 
      onDelete={onDelete} 
      onEdit={() => {}}
    />);
    
    const delBtn = screen.getByText('Delete');
    fireEvent.click(delBtn);
    expect(onDelete).toHaveBeenCalled();
  });

  it('uses Chinese labels when provided', () => {
    render(<ServerHeader
      server={mockServer}
      status={{ serverId: 'server1', status: 'stopped', uptimeSec: 0, restartCount: 0, activeTunnelCount: 0 }}
      onStart={() => {}}
      onStop={() => {}}
      onRestart={() => {}}
      onDelete={() => {}}
      onEdit={() => {}}
      labels={{
        start: '启动', stop: '停止', restart: '重连', edit: '编辑', delete: '删除', uptime: '运行时间', connected: '已连接', starting: '启动中', stopped: '已停止', stopping: '停止中', error: '异常', reconnecting: '重连中',
        failureReasons: { portOccupied: '端口被占用', sshMissing: '未找到 ssh.exe', hostKeyIssue: '主机密钥异常', connectionFailed: '连接失败', unknown: '未知错误' },
      }}
    />);

    expect(screen.getByText('已停止')).toBeInTheDocument();
    expect(screen.getByText('启动')).toBeInTheDocument();
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
        onEdit={() => {}}
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
        onEdit={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Stop'));
    expect(handleStop).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Restart'));
    expect(handleRestart).toHaveBeenCalled();
  });
});
