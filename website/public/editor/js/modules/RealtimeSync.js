export class RealtimeSync {
  constructor(projectSyncManager) {
    this.projectSync = projectSyncManager;
    this.ws = null;
    this.connected = false;
  }

  connect(url) {
    try {
      if (this.ws) this.ws.close();
    } catch {}
    try {
      this.ws = new WebSocket(url);
      this.ws.addEventListener('open', () => { this.connected = true; });
      this.ws.addEventListener('close', () => { this.connected = false; });
      this.ws.addEventListener('error', () => { this.connected = false; });
      this.ws.addEventListener('message', (ev) => this.onMessage(ev));
    } catch (e) {
      console.warn('[RealtimeSync] failed to connect', e);
    }
  }

  onMessage(ev) {
    // Placeholder for future live updates
    try { const data = JSON.parse(ev.data); console.log('[RealtimeSync]', data); } catch {}
  }

  broadcastFileChange(file) {
    if (!this.ws || this.ws.readyState !== 1) return;
    try {
      const payload = { type: 'file_change', projectId: this.projectSync?.currentProject?.id, file };
      this.ws.send(JSON.stringify(payload));
    } catch {}
  }
}


