import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ServerHeader } from './ServerHeader';
import { TunnelTable } from './TunnelTable';
import { TauriApi } from '../api/tauri';
import { ServerConfig, ServerRuntimeStatus } from '../types/server';
import { TunnelConfig } from '../types/tunnel';
import { ConfirmDialog } from './ConfirmDialog';
import { ServerEditDialog } from './ServerEditDialog';
import { TunnelEditDialog } from './TunnelEditDialog';

export const TunnelDockApp: React.FC = () => {
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>();
  const [statuses, setStatuses] = useState<Record<string, ServerRuntimeStatus>>({});
  const [activeTab, setActiveTab] = useState<'tunnels' | 'info' | 'logs'>('tunnels');
  const [logs, setLogs] = useState<string[]>([]);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');

  const [showServerEdit, setShowServerEdit] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerConfig | undefined>();
  
  const [showTunnelEdit, setShowTunnelEdit] = useState(false);
  const [editingTunnel, setEditingTunnel] = useState<TunnelConfig | undefined>();

  const [confirmDelete, setConfirmDelete] = useState<{type: 'server' | 'tunnel', item: any} | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const loadServers = async () => {
    try {
      const data = await TauriApi.getServers();
      setServers(data || []);
      if (data && data.length > 0 && !selectedServerId) {
        setSelectedServerId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load servers', err);
    }
  };

  useEffect(() => {
    if (selectedServerId) {
      loadStatus(selectedServerId);
    }
  }, [selectedServerId]);

  const loadStatus = async (serverId: string) => {
    try {
      const status = await TauriApi.getServerStatus(serverId);
      if (status) {
        setStatuses(prev => ({ ...prev, [serverId]: status }));
      }
    } catch (err) {
      console.error('Failed to load status for', serverId, err);
    }
  };

  const selectedServer = servers.find(s => s.id === selectedServerId);
  const selectedStatus = selectedServerId ? statuses[selectedServerId] : undefined;

  const handleStart = async () => {
    if (!selectedServerId) return;
    await TauriApi.startServer(selectedServerId);
    loadStatus(selectedServerId);
  };

  const handleStop = async () => {
    if (!selectedServerId) return;
    await TauriApi.stopServer(selectedServerId);
    loadStatus(selectedServerId);
  };

  const handleRestart = async () => {
    if (!selectedServerId) return;
    await TauriApi.restartServer(selectedServerId);
    loadStatus(selectedServerId);
  };

  const handleDelete = async () => {
    if (!selectedServerId) return;
    setConfirmDelete({ type: 'server', item: selectedServer });
  };

  const executeDeleteServer = async (server: ServerConfig) => {
    await TauriApi.deleteServer(server.id);
    setSelectedServerId(undefined);
    loadServers();
    setConfirmDelete(null);
  };

  const handleSaveServer = async (server: ServerConfig) => {
    if (editingServer) {
      await TauriApi.updateServer(server);
    } else {
      await TauriApi.createServer(server);
      setSelectedServerId(server.id);
    }
    setShowServerEdit(false);
    setEditingServer(undefined);
    loadServers();
  };

  const handleSaveTunnel = async (tunnel: TunnelConfig) => {
    if (!selectedServer) return;
    const updatedServer = { ...selectedServer };
    if (editingTunnel) {
      updatedServer.tunnels = updatedServer.tunnels.map(t => t.id === tunnel.id ? tunnel : t);
    } else {
      updatedServer.tunnels = [...updatedServer.tunnels, tunnel];
    }
    await TauriApi.updateServer(updatedServer);
    setShowTunnelEdit(false);
    setEditingTunnel(undefined);
    loadServers();
  };

  const executeDeleteTunnel = async (tunnel: TunnelConfig) => {
    if (!selectedServer) return;
    const updatedServer = { ...selectedServer, tunnels: selectedServer.tunnels.filter(t => t.id !== tunnel.id) };
    await TauriApi.updateServer(updatedServer);
    loadServers();
    setConfirmDelete(null);
  };

  const handleToggleTunnel = async (tunnelId: string, enabled: boolean) => {
    if (!selectedServer) return;
    const updatedServer = { ...selectedServer, tunnels: selectedServer.tunnels.map(t => t.id === tunnelId ? { ...t, enabled } : t) };
    await TauriApi.updateServer(updatedServer);
    loadServers();
  };

  const handleExport = async () => {
    try {
      const config = await TauriApi.getConfig();
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tunnel-dock-config.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export', err);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const config = JSON.parse(text);
        await TauriApi.saveConfig(config);
        loadServers();
      } catch (err) {
        console.error('Failed to import', err);
      }
    };
    input.click();
  };

  const loadLogs = async (serverId: string) => {
    try {
      const serverLogs = await TauriApi.getLogs(serverId);
      setLogs(serverLogs || []);
    } catch (err) {
      console.error('Failed to load logs', err);
    }
  };

  useEffect(() => {
    if (selectedServerId && activeTab === 'logs') {
      loadLogs(selectedServerId);
      const timer = setInterval(() => {
        loadLogs(selectedServerId);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [selectedServerId, activeTab]);

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
        <Sidebar 
          servers={servers} 
          selectedServerId={selectedServerId}
          onSelectServer={(s) => setSelectedServerId(s.id)} 
          onAddServer={() => {
            setEditingServer(undefined);
            setShowServerEdit(true);
          }} 
        />
        <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ccc' }}>
          <button onClick={handleImport}>Import</button>
          <button onClick={handleExport}>Export</button>
        </div>
        <div style={{ padding: '10px', borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'center' }}>
          <select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {selectedServer ? (
          <>
            <ServerHeader 
              server={selectedServer}
              status={selectedStatus}
              onStart={handleStart}
              onStop={handleStop}
              onRestart={handleRestart}
              onDelete={handleDelete}
              onEdit={() => {
                setEditingServer(selectedServer);
                setShowServerEdit(true);
              }}
            />
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="tabs" style={{ marginBottom: '10px' }}>
                <button onClick={() => setActiveTab('tunnels')} style={{ fontWeight: activeTab === 'tunnels' ? 'bold' : 'normal' }}>Tunnels</button>
                <button onClick={() => setActiveTab('info')} style={{ fontWeight: activeTab === 'info' ? 'bold' : 'normal' }}>Info</button>
                <button onClick={() => setActiveTab('logs')} style={{ fontWeight: activeTab === 'logs' ? 'bold' : 'normal' }}>Logs</button>
              </div>
              
              {activeTab === 'tunnels' && (
                <TunnelTable 
                  tunnels={selectedServer.tunnels || []} 
                  onAdd={() => {
                    setEditingTunnel(undefined);
                    setShowTunnelEdit(true);
                  }} 
                  onEdit={(tunnel) => {
                    setEditingTunnel(tunnel);
                    setShowTunnelEdit(true);
                  }} 
                  onDelete={(tunnel) => setConfirmDelete({ type: 'tunnel', item: tunnel })} 
                  onToggle={handleToggleTunnel} 
                  onOpenUrl={(url) => TauriApi.openUrl(url)}
                />
              )}

              {activeTab === 'info' && (
                <div>
                  <p><strong>Host:</strong> {selectedServer.sshHost}</p>
                  <p><strong>Port:</strong> {selectedServer.sshPort}</p>
                  <p><strong>User:</strong> {selectedServer.sshUser}</p>
                </div>
              )}

              {activeTab === 'logs' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <button onClick={() => { if (selectedServerId) TauriApi.clearLogs(selectedServerId).then(() => loadLogs(selectedServerId)) }}>Clear Logs</button>
                  </div>
                  <pre style={{ flex: 1, backgroundColor: '#1e1e1e', color: '#fff', padding: '10px', overflowY: 'auto', margin: 0 }}>
                    {logs.join('\n')}
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div>Select a server from the sidebar to view its details.</div>
        )}
      </div>

      {showServerEdit && (
        <ServerEditDialog 
          server={editingServer} 
          onSave={handleSaveServer} 
          onCancel={() => setShowServerEdit(false)} 
        />
      )}

      {showTunnelEdit && (
        <TunnelEditDialog 
          tunnel={editingTunnel} 
          onSave={handleSaveTunnel} 
          onCancel={() => setShowTunnelEdit(false)} 
        />
      )}

      {confirmDelete && (
        <ConfirmDialog 
          title={`Delete ${confirmDelete.type}`}
          message={`Are you sure you want to delete this ${confirmDelete.type}?`}
          onConfirm={() => confirmDelete.type === 'server' ? executeDeleteServer(confirmDelete.item) : executeDeleteTunnel(confirmDelete.item)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};
