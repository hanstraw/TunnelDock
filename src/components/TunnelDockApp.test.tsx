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
    createServer: vi.fn(),
    updateServer: vi.fn(),
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
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('shows Chinese server dialog and saves a server', async () => {
    vi.mocked(TauriApi.getServers).mockResolvedValue([]);
    vi.mocked(TauriApi.createServer).mockResolvedValue(undefined);

    render(<TunnelDockApp />);

    await waitFor(() => expect(screen.getByText('服务器列表')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('添加服务器'));
    expect(screen.getByRole('heading', { name: '添加服务器' })).toBeInTheDocument();
    expect(screen.getByLabelText('服务器名称')).toBeInTheDocument();

    fireEvent.click(screen.getByText('保存'));

    await waitFor(() => {
      expect(TauriApi.createServer).toHaveBeenCalledWith(expect.objectContaining({
        name: '新服务器',
        sshHost: 'example.com',
        sshPort: 22,
        sshUser: 'root',
      }));
    });
  });

  it('opens settings and about pages from sidebar', async () => {
    vi.mocked(TauriApi.getServers).mockResolvedValue([]);
    render(<TunnelDockApp />);

    await waitFor(() => expect(screen.getByRole('button', { name: /设置/ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /设置/ }));
    expect(screen.getByRole('heading', { name: '应用设置' })).toBeInTheDocument();
    expect(screen.getByText('配置工具')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /关于/ }));
    expect(screen.getByRole('heading', { name: '关于 TunnelDock' })).toBeInTheDocument();
  });

  it('fills a common private key path in server dialog', async () => {
    vi.mocked(TauriApi.getServers).mockResolvedValue([]);

    render(<TunnelDockApp />);

    await waitFor(() => expect(screen.getByLabelText('添加服务器')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('添加服务器'));
    fireEvent.click(screen.getByText('id_ed25519'));

    await waitFor(() => expect(screen.getByLabelText('私钥路径')).toHaveValue('C:\\Users\\<你的用户名>\\.ssh\\id_ed25519'));
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

  it('keeps polling status after start until server leaves starting state', async () => {
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
    vi.mocked(TauriApi.getServerStatus)
      .mockResolvedValueOnce({ serverId: '1', status: 'stopped', uptimeSec: 0, restartCount: 0, activeTunnelCount: 0 })
      .mockResolvedValueOnce({ serverId: '1', status: 'starting', uptimeSec: 0, restartCount: 0, activeTunnelCount: 0 })
      .mockResolvedValue({ serverId: '1', status: 'running', uptimeSec: 1, restartCount: 0, activeTunnelCount: 0 });
    vi.mocked(TauriApi.startServer).mockResolvedValue(undefined);

    render(<TunnelDockApp />);

    await waitFor(() => expect(screen.getAllByText('My Test Server').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByText('启动'));

    await waitFor(() => expect(screen.getByText('启动中')).toBeInTheDocument());

    await waitFor(() => expect(screen.getAllByText('已连接').length).toBeGreaterThan(0), { timeout: 3000 });
  }, 5000);
});
