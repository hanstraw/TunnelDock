import React, { useEffect, useMemo, useState } from 'react';
import { Sidebar } from './Sidebar';
import { ServerHeader } from './ServerHeader';
import { TunnelTable } from './TunnelTable';
import { TauriApi } from '../api/tauri';
import { ServerConfig, ServerRuntimeStatus } from '../types/server';
import { TunnelConfig } from '../types/tunnel';
import { ConfirmDialog } from './ConfirmDialog';
import { ServerEditDialog } from './ServerEditDialog';
import { TunnelEditDialog } from './TunnelEditDialog';

type Language = 'zh' | 'en';

const dict = {
  zh: {
    servers: '服务器列表', addServer: '添加服务器', connected: '已连接', disconnected: '未连接', settings: '设置', about: '关于',
    start: '启动', stop: '停止', restart: '重连', edit: '编辑', delete: '删除', uptime: '运行时间',
    starting: '启动中', stopped: '已停止', stopping: '停止中', error: '异常', reconnecting: '重连中',
    tabs: { tunnels: '隧道列表', info: '服务器信息', logs: '日志' },
    table: { tunnels: '隧道列表', addTunnel: '添加隧道', enabled: '启用', name: '名称', local: '本地地址', remote: '远程地址', status: '状态', actions: '操作', connected: '已连接', stopped: '已停止', open: '打开', edit: '编辑', delete: '删除', empty: '暂无隧道，请点击“添加隧道”。' },
    import: '导入', export: '导出', language: '语言', chinese: '中文', english: 'English', theme: '主题', system: '跟随系统', light: '浅色', dark: '深色',
    noServer: '请选择或新增一个服务器。', host: 'SSH 地址', port: 'SSH 端口', user: '用户名', clearLogs: '清空日志', ready: '就绪', allStart: '全部启动', allStop: '全部停止', version: 'v1.0.0',
    deleteTitle: '删除确认', deleteMessage: '确定要删除这个项目吗？',
    failureReasons: { portOccupied: '端口被占用', sshMissing: '未找到 ssh.exe', hostKeyIssue: '主机密钥异常', connectionFailed: '连接失败', unknown: '未知错误' },
  },
  en: {
    servers: 'Servers', addServer: 'Add Server', connected: 'Connected', disconnected: 'Disconnected', settings: 'Settings', about: 'About',
    start: 'Start', stop: 'Stop', restart: 'Restart', edit: 'Edit', delete: 'Delete', uptime: 'Uptime',
    starting: 'Starting', stopped: 'Stopped', stopping: 'Stopping', error: 'Error', reconnecting: 'Reconnecting',
    tabs: { tunnels: 'Tunnels', info: 'Server Info', logs: 'Logs' },
    table: { tunnels: 'Tunnels', addTunnel: 'Add Tunnel', enabled: 'Enabled', name: 'Name', local: 'Local', remote: 'Remote', status: 'Status', actions: 'Actions', connected: 'Connected', stopped: 'Stopped', open: 'Open', edit: 'Edit', delete: 'Delete', empty: 'No tunnels configured. Click Add Tunnel.' },
    import: 'Import', export: 'Export', language: 'Language', chinese: '中文', english: 'English', theme: 'Theme', system: 'System', light: 'Light', dark: 'Dark',
    noServer: 'Select or add a server.', host: 'SSH Host', port: 'SSH Port', user: 'User', clearLogs: 'Clear Logs', ready: 'Ready', allStart: 'Start All', allStop: 'Stop All', version: 'v1.0.0',
    deleteTitle: 'Confirm delete', deleteMessage: 'Are you sure you want to delete this item?',
    failureReasons: { portOccupied: 'Port Occupied', sshMissing: 'SSH Missing', hostKeyIssue: 'Host Key Issue', connectionFailed: 'Connection Failed', unknown: 'Unknown Error' },
  },
};

export const TunnelDockApp: React.FC = () => {
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>();
  const [statuses, setStatuses] = useState<Record<string, ServerRuntimeStatus>>({});
  const [activeTab, setActiveTab] = useState<'tunnels' | 'info' | 'logs'>('tunnels');
  const [logs, setLogs] = useState<string[]>([]);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('tunneldock-language') as Language) || 'zh');
  const [showServerEdit, setShowServerEdit] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerConfig | undefined>();
  const [showTunnelEdit, setShowTunnelEdit] = useState(false);
  const [editingTunnel, setEditingTunnel] = useState<TunnelConfig | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<{type: 'server' | 'tunnel', item: ServerConfig | TunnelConfig} | null>(null);
  const [actionError, setActionError] = useState<string>();

  const t = dict[language];

  useEffect(() => { loadServers(); }, []);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('tunneldock-language', language); }, [language]);

  const loadServers = async () => {
    try {
      const data = await TauriApi.getServers();
      setServers(data || []);
      if (data && data.length > 0 && !selectedServerId) setSelectedServerId(data[0].id);
    } catch (err) {
      console.error('load servers failed', err);
    }
  };

  useEffect(() => {
    if (!selectedServerId) return;
    loadStatus(selectedServerId);
    const timer = setInterval(() => loadStatus(selectedServerId), 2000);
    return () => clearInterval(timer);
  }, [selectedServerId]);

  const loadStatus = async (serverId: string) => {
    try {
      const status = await TauriApi.getServerStatus(serverId);
      if (status) setStatuses(prev => ({ ...prev, [serverId]: status }));
    } catch (err) {
      console.error('load status failed', err);
    }
  };

  const selectedServer = servers.find(s => s.id === selectedServerId);
  const selectedStatus = selectedServerId ? statuses[selectedServerId] : undefined;
  const runningServerIds = useMemo(() => new Set(Object.values(statuses).filter(s => s.status === 'running').map(s => s.serverId)), [statuses]);
  const runningCount = Object.values(statuses).filter(s => s.status === 'running').length;

  const runServerAction = async (action: (serverId: string) => Promise<void>) => {
    if (!selectedServerId) return;
    setActionError(undefined);
    try {
      await action(selectedServerId);
      await loadStatus(selectedServerId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStart = () => runServerAction(TauriApi.startServer);
  const handleStop = () => runServerAction(TauriApi.stopServer);
  const handleRestart = () => runServerAction(TauriApi.restartServer);
  const handleDelete = () => { if (selectedServer) setConfirmDelete({ type: 'server', item: selectedServer }); };

  const executeDeleteServer = async (server: ServerConfig) => {
    await TauriApi.deleteServer(server.id);
    setSelectedServerId(undefined);
    await loadServers();
    setConfirmDelete(null);
  };

  const handleSaveServer = async (server: ServerConfig) => {
    if (editingServer) await TauriApi.updateServer(server); else await TauriApi.createServer(server);
    setSelectedServerId(server.id);
    setShowServerEdit(false);
    setEditingServer(undefined);
    loadServers();
  };

  const handleSaveTunnel = async (tunnel: TunnelConfig) => {
    if (!selectedServer) return;
    const updatedServer = {
      ...selectedServer,
      tunnels: editingTunnel ? selectedServer.tunnels.map(tun => tun.id === tunnel.id ? tunnel : tun) : [...selectedServer.tunnels, tunnel],
    };
    await TauriApi.updateServer(updatedServer);
    setShowTunnelEdit(false);
    setEditingTunnel(undefined);
    loadServers();
  };

  const executeDeleteTunnel = async (tunnel: TunnelConfig) => {
    if (!selectedServer) return;
    await TauriApi.updateServer({ ...selectedServer, tunnels: selectedServer.tunnels.filter(tun => tun.id !== tunnel.id) });
    loadServers();
    setConfirmDelete(null);
  };

  const handleToggleTunnel = async (tunnelId: string, enabled: boolean) => {
    if (!selectedServer) return;
    await TauriApi.updateServer({ ...selectedServer, tunnels: selectedServer.tunnels.map(tunnel => tunnel.id === tunnelId ? { ...tunnel, enabled } : tunnel) });
    loadServers();
  };

  const handleExport = async () => {
    const config = await TauriApi.getConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tunneldock-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await TauriApi.saveConfig(JSON.parse(await file.text()));
      loadServers();
    };
    input.click();
  };

  const loadLogs = async (serverId: string) => setLogs(await TauriApi.getLogs(serverId) || []);

  useEffect(() => {
    if (!selectedServerId || activeTab !== 'logs') return;
    loadLogs(selectedServerId);
    const timer = setInterval(() => loadLogs(selectedServerId), 2000);
    return () => clearInterval(timer);
  }, [selectedServerId, activeTab]);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Sidebar servers={servers} selectedServerId={selectedServerId} onSelectServer={(s) => setSelectedServerId(s.id)} onAddServer={() => { setEditingServer(undefined); setShowServerEdit(true); }} labels={t} runningServerIds={runningServerIds} />
        <div className="sidebar-controls">
          <button onClick={handleImport}>⇧ {t.import}</button>
          <button onClick={handleExport}>⇩ {t.export}</button>
          <label>
            {t.language}
            <select aria-label="语言" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
              <option value="zh">{t.chinese}</option>
              <option value="en">{t.english}</option>
            </select>
          </label>
          <label>
            {t.theme}
            <select aria-label={t.theme} value={theme} onChange={(e) => setTheme(e.target.value as 'system' | 'light' | 'dark')}>
              <option value="system">{t.system}</option>
              <option value="light">{t.light}</option>
              <option value="dark">{t.dark}</option>
            </select>
          </label>
        </div>
      </aside>

      <main className="app-main">
        {selectedServer ? (
          <>
            <ServerHeader server={selectedServer} status={selectedStatus} onStart={handleStart} onStop={handleStop} onRestart={handleRestart} onDelete={handleDelete} onEdit={() => { setEditingServer(selectedServer); setShowServerEdit(true); }} labels={t} />
            {actionError && <div className="action-error">{t.error}: {actionError}</div>}
            <nav className="tabs">
              <button className={activeTab === 'tunnels' ? 'active' : ''} onClick={() => setActiveTab('tunnels')}>{t.tabs.tunnels}</button>
              <button className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>{t.tabs.info}</button>
              <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>{t.tabs.logs}</button>
            </nav>

            {activeTab === 'tunnels' && <TunnelTable tunnels={selectedServer.tunnels || []} labels={t.table} onAdd={() => { setEditingTunnel(undefined); setShowTunnelEdit(true); }} onEdit={(tunnel) => { setEditingTunnel(tunnel); setShowTunnelEdit(true); }} onDelete={(tunnel) => setConfirmDelete({ type: 'tunnel', item: tunnel })} onToggle={handleToggleTunnel} onOpenUrl={(url) => TauriApi.openUrl(url)} />}
            {activeTab === 'info' && <section className="info-card"><p><strong>{t.host}</strong>{selectedServer.sshHost}</p><p><strong>{t.port}</strong>{selectedServer.sshPort}</p><p><strong>{t.user}</strong>{selectedServer.sshUser}</p></section>}
            {activeTab === 'logs' && <section className="logs-card"><button onClick={() => selectedServerId && TauriApi.clearLogs(selectedServerId).then(() => loadLogs(selectedServerId))}>{t.clearLogs}</button><pre>{logs.join('\n')}</pre></section>}
          </>
        ) : <div className="empty-state">{t.noServer}</div>}
      </main>

      <footer className="statusbar"><span><span className="server-dot online" /> {t.ready}</span><span>{t.connected}: {runningCount} / {servers.length}</span><span>{t.version}</span></footer>

      {showServerEdit && <ServerEditDialog server={editingServer} onSave={handleSaveServer} onCancel={() => setShowServerEdit(false)} />}
      {showTunnelEdit && <TunnelEditDialog tunnel={editingTunnel} onSave={handleSaveTunnel} onCancel={() => setShowTunnelEdit(false)} />}
      {confirmDelete && <ConfirmDialog title={t.deleteTitle} message={t.deleteMessage} onConfirm={() => confirmDelete.type === 'server' ? executeDeleteServer(confirmDelete.item as ServerConfig) : executeDeleteTunnel(confirmDelete.item as TunnelConfig)} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
};
