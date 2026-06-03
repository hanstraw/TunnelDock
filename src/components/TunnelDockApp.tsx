import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ServerHeader } from './ServerHeader';
import { TunnelTable } from './TunnelTable';
import { TauriApi } from '../api/tauri';
import { ServerConfig, ServerRuntimeStatus } from '../types/server';

export const TunnelDockApp: React.FC = () => {
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>();
  const [statuses, setStatuses] = useState<Record<string, ServerRuntimeStatus>>({});

  useEffect(() => {
    loadServers();
  }, []);

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
      setStatuses(prev => ({ ...prev, [serverId]: status }));
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
    await TauriApi.deleteServer(selectedServerId);
    setSelectedServerId(undefined);
    loadServers();
  };

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', borderRight: '1px solid #ccc' }}>
        <Sidebar 
          servers={servers} 
          selectedServerId={selectedServerId}
          onSelectServer={(s) => setSelectedServerId(s.id)} 
          onAddServer={() => {}} 
        />
      </div>
      <div style={{ flex: 1, padding: '20px' }}>
        {selectedServer ? (
          <>
            <ServerHeader 
              server={selectedServer}
              status={selectedStatus}
              onStart={handleStart}
              onStop={handleStop}
              onRestart={handleRestart}
              onDelete={handleDelete}
            />
            <div style={{ marginTop: '20px' }}>
              <div className="tabs" style={{ marginBottom: '10px' }}>
                <button>Tunnels</button>
                <button>Info</button>
                <button>Logs</button>
              </div>
              <TunnelTable 
                tunnels={selectedServer.tunnels || []} 
                onAdd={() => {}} 
                onEdit={() => {}} 
                onDelete={() => {}} 
                onToggle={() => {}} 
              />
            </div>
          </>
        ) : (
          <div>Select a server from the sidebar to view its details.</div>
        )}
      </div>
    </div>
  );
};
