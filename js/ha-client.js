/**
 * Minimal Home Assistant WebSocket client for live entity updates.
 */
class HAClient {
  constructor({ url, token, onConnect, onDisconnect, onStateChange, onError }) {
    this.url = url;
    this.token = token;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onStateChange = onStateChange;
    this.onError = onError;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
    this.states = new Map();
    this.reconnectTimer = null;
    this.intentionalClose = false;
    this.entityFilter = null;
  }

  connect() {
    this.intentionalClose = false;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this._send({ type: 'auth', access_token: this.token });
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this._handleMessage(msg);
    };

    this.ws.onclose = () => {
      this.onDisconnect?.();
      if (!this.intentionalClose) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
    };

    this.ws.onerror = () => {
      this.onError?.('WebSocket connection failed');
    };
  }

  disconnect() {
    this.intentionalClose = true;
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }

  async subscribeEntities(entityIds) {
    this.entityFilter = new Set(entityIds);

    // Initial snapshot
    const allStates = await this._call('get_states');
    for (const state of allStates) {
      if (this.entityFilter.has(state.entity_id)) {
        this.states.set(state.entity_id, state);
        this.onStateChange?.(state.entity_id, state);
      }
    }

    // Live updates
    await this._call('subscribe_events', { event_type: 'state_changed' });
  }

  getStates() {
    return Object.fromEntries(this.states);
  }

  _handleMessage(msg) {
    if (msg.type === 'auth_required') return;

    if (msg.type === 'auth_ok') {
      this.onConnect?.();
      return;
    }

    if (msg.type === 'auth_invalid') {
      this.onError?.('Invalid access token');
      this.disconnect();
      return;
    }

    if (msg.type === 'result' && msg.id && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.success) resolve(msg.result);
      else reject(new Error(msg.error?.message || 'Request failed'));
      return;
    }

    if (msg.type === 'event' && msg.event?.event_type === 'state_changed') {
      const { entity_id, new_state } = msg.event.data;
      if (!new_state) return;
      if (this.entityFilter && !this.entityFilter.has(entity_id)) return;
      this.states.set(entity_id, new_state);
      this.onStateChange?.(entity_id, new_state);
    }
  }

  _send(msg) {
    this.ws?.send(JSON.stringify(msg));
  }

  _call(type, payload = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.pending.set(id, { resolve, reject });
      this._send({ id, type, ...payload });
    });
  }
}

function detectHAUrl() {
  const { protocol, host } = window.location;
  const wsProto = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProto}//${host}/api/websocket`;
}

function getStoredToken() {
  return localStorage.getItem('sma_webbox_ha_token') || '';
}

function storeToken(token) {
  localStorage.setItem('sma_webbox_ha_token', token);
}

function clearToken() {
  localStorage.removeItem('sma_webbox_ha_token');
}