import { render, screen, fireEvent } from '@testing-library/react';
import { TunnelTable } from './TunnelTable';
import { TunnelConfig } from '../types/tunnel';
import { vi } from 'vitest';

const mockTunnels: TunnelConfig[] = [
  {
    id: 't1',
    name: 'Panel',
    enabled: true,
    localHost: '127.0.0.1',
    localPort: 8080,
    remoteHost: '127.0.0.1',
    remotePort: 80,
  },
  {
    id: 't2',
    name: 'Panel 2',
    enabled: true,
    localHost: '127.0.0.1',
    localPort: 9090,
    remoteHost: '127.0.0.1',
    remotePort: 90,
    openUrl: 'http://localhost:9090',
  }
];

describe('TunnelTable', () => {
  it('renders a list of tunnels', () => {
    render(<TunnelTable tunnels={mockTunnels} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} onToggle={() => {}} onOpenUrl={() => {}} />);
    expect(screen.getByText('Panel')).toBeInTheDocument();
    expect(screen.getByText('127.0.0.1:8080')).toBeInTheDocument();
    expect(screen.getByText('127.0.0.1:80')).toBeInTheDocument();
  });

  it('calls onAdd when Add Tunnel is clicked', () => {
    const handleAdd = vi.fn();
    render(<TunnelTable tunnels={mockTunnels} onAdd={handleAdd} onEdit={() => {}} onDelete={() => {}} onToggle={() => {}} onOpenUrl={() => {}} />);
    fireEvent.click(screen.getByText('Add Tunnel'));
    expect(handleAdd).toHaveBeenCalled();
  });

  it('calls onEdit and onDelete when buttons are clicked', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    render(<TunnelTable tunnels={mockTunnels} onAdd={() => {}} onEdit={handleEdit} onDelete={handleDelete} onToggle={() => {}} onOpenUrl={() => {}} />);
    
    const editBtns = screen.getAllByText('Edit');
    fireEvent.click(editBtns[0]);
    expect(handleEdit).toHaveBeenCalledWith(mockTunnels[0]);

    const delBtns = screen.getAllByText('Delete');
    fireEvent.click(delBtns[0]);
    expect(handleDelete).toHaveBeenCalledWith(mockTunnels[0]);
  });

  it('calls onOpenUrl when Open button is clicked', () => {
    const handleOpen = vi.fn();
    render(<TunnelTable tunnels={mockTunnels} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} onToggle={() => {}} onOpenUrl={handleOpen} />);
    
    const openBtn = screen.getByText('Open');
    fireEvent.click(openBtn);
    expect(handleOpen).toHaveBeenCalledWith('http://localhost:9090');
  });

  it('shows enabled tunnels as stopped when server is not running', () => {
    render(<TunnelTable tunnels={mockTunnels} serverRunning={false} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} onToggle={() => {}} onOpenUrl={() => {}} />);

    expect(screen.getAllByText('Stopped').length).toBe(2);
    expect(screen.queryByText('Connected')).not.toBeInTheDocument();
  });
});
