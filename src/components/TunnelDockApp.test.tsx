import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TunnelDockApp } from './TunnelDockApp';
import { vi } from 'vitest';
import { TauriApi } from '../api/tauri';

vi.mock('../api/tauri', () => ({
  TauriApi: {
    getServers: vi.fn(),
    getServerStatus: vi.fn(),
    startServer: vi.fn(),
    stopServer: vi.fn(),
    restartServer: vi.fn(),
    deleteServer: vi.fn(),
    saveServer: vi.fn(),
    getLogs: vi.fn(),
    clearLogs: vi.fn(),
    getConfig: vi.fn(),
    saveConfig: vi.fn(),
    openUrl: vi.fn(),
  }
}));

describe('TunnelDockApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('loads and displays servers', async () => {
    vi.mocked(TauriApi.getServers).mockResolvedValue([
      {
        id: '1',
        name: 'My Test Server',
        sshHost: 'host',
        sshPort: 22,
        sshUser: 'root',
        useAgent: true,
        autoStart: false,
        autoReconnect: false,
        reconnectDelaySec: 5,
        enabled: true,
        tunnels: [],
      }
    ]);
    vi.mocked(TauriApi.getServerStatus).mockResolvedValue({
      serverId: '1',
      status: 'running',
      uptimeSec: 100,
      restartCount: 0,
      activeTunnelCount: 0,
    });

    render(<TunnelDockApp />);

    await waitFor(() => {
      expect(screen.getAllByText('My Test Server').length).toBeGreaterThan(0);
    });

    // Click server to select (from sidebar)
    fireEvent.click(screen.getAllByText('My Test Server')[0]);

    // Header and TunnelTable should be visible
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'My Test Server' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '隧道列表' })).toBeInTheDocument();
      expect(screen.getAllByText('已连接').length).toBeGreaterThan(0);
    });
  });

  it('defaults to Chinese UI and can switch to English', async () => {
    vi.mocked(TauriApi.getServers).mockResolvedValue([]);

    render(<TunnelDockApp />);

    await waitFor(() => {
      expect(screen.getByText('服务器列表')).toBeInTheDocument();
      expect(screen.getByText('请选择或新增一个服务器。')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('语言'), { target: { value: 'en' } });

    expect(screen.getByText('Servers')).toBeInTheDocument();
    expect(screen.getByText('Select or add a server.')).toBeInTheDocument();
  });

  it('can start/stop a server', async () => {
    vi.mocked(TauriApi.getServers).mockResolvedValue([
      {
        id: '1',
        name: 'My Test Server',
        sshHost: 'host',
        sshPort: 22,
        sshUser: 'root',
        useAgent: true,
        autoStart: false,
        autoReconnect: false,
        reconnectDelaySec: 5,
        enabled: true,
        tunnels: [],
      }
    ]);
    vi.mocked(TauriApi.getServerStatus).mockResolvedValue({
      serverId: '1',
      status: 'stopped',
      uptimeSec: 0,
      restartCount: 0,
      activeTunnelCount: 0,
    });

    const { unmount } = render(<TunnelDockApp />);
    
    await waitFor(() => {
      expect(screen.getAllByText('My Test Server').length).toBeGreaterThan(0);
    });
    
    fireEvent.click(screen.getAllByText('My Test Server')[0]);
    
    await waitFor(() => {
      expect(screen.getByText('启动')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('启动'));
    expect(TauriApi.startServer).toHaveBeenCalledWith('1');

    unmount();

    // Re-render to test Stop button with running status
    vi.mocked(TauriApi.getServerStatus).mockResolvedValue({
      serverId: '1',
      status: 'running',
      uptimeSec: 0,
      restartCount: 0,
      activeTunnelCount: 0,
    });
    render(<TunnelDockApp />);
    await waitFor(() => {
      expect(screen.getAllByText('My Test Server').length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByText('My Test Server')[0]);
    await waitFor(() => {
      expect(screen.getByText('停止')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('停止'));
    expect(TauriApi.stopServer).toHaveBeenCalledWith('1');
  });
});
