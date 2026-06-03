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
  }
}));

describe('TunnelDockApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(screen.getByRole('heading', { name: 'Tunnels' })).toBeInTheDocument();
      expect(screen.getByText('running')).toBeInTheDocument();
    });
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
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Start'));
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
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Stop'));
    expect(TauriApi.stopServer).toHaveBeenCalledWith('1');
  });
});
