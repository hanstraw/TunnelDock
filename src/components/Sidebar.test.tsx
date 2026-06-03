import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { ServerConfig } from '../types/server';
import { vi } from 'vitest';

const mockServers: ServerConfig[] = [
  {
    id: '1',
    name: 'Server 1',
    sshHost: 'host1',
    sshPort: 22,
    sshUser: 'root',
    useAgent: true,
    autoStart: false,
    autoReconnect: false,
    reconnectDelaySec: 5,
    enabled: true,
    tunnels: [],
  },
  {
    id: '2',
    name: 'Server 2',
    sshHost: 'host2',
    sshPort: 22,
    sshUser: 'root',
    useAgent: true,
    autoStart: false,
    autoReconnect: false,
    reconnectDelaySec: 5,
    enabled: true,
    tunnels: [],
  },
];

describe('Sidebar', () => {
  it('renders a list of servers', () => {
    render(<Sidebar servers={mockServers} onSelectServer={() => {}} onAddServer={() => {}} />);
    expect(screen.getByText('Server 1')).toBeInTheDocument();
    expect(screen.getByText('Server 2')).toBeInTheDocument();
  });

  it('calls onSelectServer when a server is clicked', () => {
    const handleSelect = vi.fn();
    render(<Sidebar servers={mockServers} onSelectServer={handleSelect} onAddServer={() => {}} />);
    fireEvent.click(screen.getByText('Server 1'));
    expect(handleSelect).toHaveBeenCalledWith(mockServers[0]);
  });

  it('calls onAddServer when add button is clicked', () => {
    const handleAdd = vi.fn();
    render(<Sidebar servers={mockServers} onSelectServer={() => {}} onAddServer={handleAdd} />);
    fireEvent.click(screen.getByText('+ Add Server'));
    expect(handleAdd).toHaveBeenCalled();
  });
});
