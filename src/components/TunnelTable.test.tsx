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
];

describe('TunnelTable', () => {
  it('renders a list of tunnels', () => {
    render(<TunnelTable tunnels={mockTunnels} onAdd={() => {}} onEdit={() => {}} onDelete={() => {}} onToggle={() => {}} />);
    expect(screen.getByText('Panel')).toBeInTheDocument();
    expect(screen.getByText('127.0.0.1:8080')).toBeInTheDocument();
    expect(screen.getByText('127.0.0.1:80')).toBeInTheDocument();
  });

  it('calls onAdd when Add Tunnel is clicked', () => {
    const handleAdd = vi.fn();
    render(<TunnelTable tunnels={mockTunnels} onAdd={handleAdd} onEdit={() => {}} onDelete={() => {}} onToggle={() => {}} />);
    fireEvent.click(screen.getByText('Add Tunnel'));
    expect(handleAdd).toHaveBeenCalled();
  });

  it('calls onEdit and onDelete when buttons are clicked', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    render(<TunnelTable tunnels={mockTunnels} onAdd={() => {}} onEdit={handleEdit} onDelete={handleDelete} onToggle={() => {}} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(handleEdit).toHaveBeenCalledWith(mockTunnels[0]);

    fireEvent.click(screen.getByText('Delete'));
    expect(handleDelete).toHaveBeenCalledWith(mockTunnels[0]);
  });
});
