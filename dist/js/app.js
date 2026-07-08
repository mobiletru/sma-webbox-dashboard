/**
 * SMA Webbox Dashboard — main application
 */
(function () {
  let client = null;
  let history = [];
  const MAX_HISTORY = 120;
  let flowDirty = false;
  let historyDirty = false;
  let flowTimer = null;
  let historyTimer = null;

  const $ = (sel) => document.querySelector(sel);

  function init() {
    document.title = DASHBOARD_CONFIG.title;
    $('#dashboard-title').textContent = DASHBOARD_CONFIG.title;
    $('#dashboard-subtitle').textContent = DASHBOARD_CONFIG.subtitle;
    $('#year').textContent = new Date().getFullYear();

    bindAuth();
    bindSettings();
    renderMetricPlaceholders();
    ParameterControls.render($('#controls-container'));
    tryConnect();
  }

  function showToast(message, type = 'info') {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.dataset.type = type;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
  }

  function bindAuth() {
    $('#connect-btn').addEventListener('click', () => {
      const token = $('#token-input').value.trim();
      if (!token) return;
      storeToken(token);
      hideAuth();
      tryConnect();
    });

    $('#disconnect-btn').addEventListener('click', () => {
      client?.disconnect();
      clearToken();
      showAuth();
      setConnectionStatus('disconnected');
    });
  }

  function bindSettings() {
    $('#settings-btn').addEventListener('click', () => {
      $('#settings-panel').classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.settings-wrap')) {
        $('#settings-panel').classList.remove('open');
      }
    });
  }

  function tryConnect() {
    const token = getStoredToken();
    if (!token) {
      showAuth();
      return;
    }
    hideAuth();
    connectHA(token);
  }

  function connectHA(token) {
    client?.disconnect();

    client = new HAClient({
      url: detectHAUrl(),
      token,
      onConnect: async () => {
        setConnectionStatus('connected');
        ParameterControls.attach(client, showToast);
        try {
          await client.subscribeEntities(getAllEntityIds());
          updateAllFromStates();
          logUnavailableEntities();
        } catch (err) {
          setConnectionStatus('error', err.message);
        }
      },
      onDisconnect: () => setConnectionStatus('disconnected'),
      onStateChange: (entityId, state) => {
        handleStateChange(entityId, state);
      },
      onError: (msg) => {
        if (msg.toLowerCase().includes('token')) {
          clearToken();
          showAuth();
        }
        setConnectionStatus('error', msg);
      },
    });

    setConnectionStatus('connecting');
    client.connect();
  }

  function logUnavailableEntities() {
    const missing = getAllEntityIds().filter((id) => {
      const state = client.getState(id);
      return !state || BAD_STATES.has(String(state.state).toLowerCase());
    });
    if (missing.length) {
      console.info('[SMA Webbox] Unavailable entities:', missing);
    }
  }

  function showAuth() {
    $('#auth-overlay').classList.remove('hidden');
    $('#token-input').value = '';
    $('#token-input').focus();
  }

  function hideAuth() {
    $('#auth-overlay').classList.add('hidden');
  }

  function setConnectionStatus(status, detail = '') {
    const el = $('#connection-status');
    el.dataset.status = status;
    const labels = {
      connected: 'Live',
      connecting: 'Connecting…',
      disconnected: 'Offline',
      error: detail || 'Error',
    };
    el.textContent = labels[status] || status;
  }

  function handleStateChange(entityId, state) {
    const meta = ENTITY_INDEX.byEntity.get(entityId);
    if (!meta) return;

    if (meta.kind === 'metric') updateMetric(meta, state);
    else ParameterControls.updateFromState(entityId, state);

    if (meta.flow) scheduleFlowUpdate();
    if (meta.key === 'soc' || meta.key === 'plantPower') scheduleHistoryUpdate();
  }

  function updateAllFromStates() {
    for (const state of Object.values(client.getStates())) {
      handleStateChange(state.entity_id, state);
    }
    flushFlowUpdate();
    flushHistoryUpdate();
  }

  function updateMetric(meta, state) {
    const value = formatMetricValue(meta, state);
    const unit = state.attributes?.unit_of_measurement || '';

    const valueEl = $(`[data-metric="${meta.key}"] .metric-value`);
    const unitEl = $(`[data-metric="${meta.key}"] .metric-unit`);
    if (valueEl) valueEl.textContent = value;
    if (unitEl) unitEl.textContent = unit;

    if (meta.key === 'soc') updateSocGauge(state.state);
    if (meta.status) updateStatusBadge(meta.key, state.state);
  }

  function formatMetricValue(meta, state) {
    const raw = state.state;
    if (BAD_STATES.has(String(raw).toLowerCase())) return '—';
    if (meta.format === 'text') return raw;

    const num = parseFloat(raw);
    if (isNaN(num)) return raw;

    switch (meta.format) {
      case 'percent':
        return num.toFixed(1);
      case 'energy':
        return num.toFixed(1);
      case 'power':
      case 'number':
        if (Math.abs(num) >= 1000) return (num / 1000).toFixed(2);
        if (Number.isInteger(num)) return String(num);
        return num.toFixed(Math.abs(num) < 10 ? 2 : 1);
      default:
        return String(raw);
    }
  }

  function updateSocGauge(socRaw) {
    const soc = parseFloat(socRaw);
    const arc = $('#soc-arc');
    const label = $('#soc-label');
    const status = $('#soc-status');

    if (isNaN(soc) || BAD_STATES.has(String(socRaw).toLowerCase())) {
      arc.style.strokeDashoffset = '283';
      label.textContent = '—';
      status.textContent = 'No data';
      return;
    }

    const circumference = 283;
    arc.style.strokeDashoffset = String(circumference - (soc / 100) * circumference);
    label.textContent = `${soc.toFixed(1)}%`;

    if (soc >= 80) status.textContent = 'Well charged';
    else if (soc >= 50) status.textContent = 'Normal';
    else if (soc >= 20) status.textContent = 'Low';
    else status.textContent = 'Critical';

    arc.classList.toggle('soc-low', soc < 20);
    arc.classList.toggle('soc-mid', soc >= 20 && soc < 50);
    arc.classList.toggle('soc-high', soc >= 50);
  }

  function updateStatusBadge(key, value) {
    const el = $(`[data-status="${key}"]`);
    if (!el) return;
    el.textContent = BAD_STATES.has(String(value).toLowerCase()) ? '—' : value;
    el.className = 'status-badge';
    const v = String(value).toLowerCase();
    if (v.includes('operat') || v.includes('normal') || v.includes('ok')) el.classList.add('ok');
    else if (v.includes('warn') || v.includes('fault')) el.classList.add('warn');
    else if (BAD_STATES.has(v)) el.classList.add('muted');
    else el.classList.add('info');
  }

  function getPowerW(key) {
    const meta = METRICS[key];
    if (!meta) return 0;
    const state = client?.getState(meta.entity);
    if (!state || BAD_STATES.has(String(state.state).toLowerCase())) return 0;
    let val = parseFloat(state.state);
    if (isNaN(val)) return 0;
    if (state.attributes?.unit_of_measurement === 'kW') val *= 1000;
    return val;
  }

  function scheduleFlowUpdate() {
    flowDirty = true;
    clearTimeout(flowTimer);
    flowTimer = setTimeout(flushFlowUpdate, 150);
  }

  function flushFlowUpdate() {
    if (!flowDirty) return;
    flowDirty = false;
    updateFlowDiagram();
  }

  function scheduleHistoryUpdate() {
    historyDirty = true;
    clearTimeout(historyTimer);
    historyTimer = setTimeout(flushHistoryUpdate, 1000);
  }

  function flushHistoryUpdate() {
    if (!historyDirty) return;
    historyDirty = false;
    recordHistory();
  }

  function updateFlowDiagram() {
    const solar = getPowerW('solarProduction');
    const consumption = getPowerW('consumption');
    const battery = getPowerW('siPower');
    const grid = getPowerW('gridPower');
    const plant = getPowerW('plantPower');

    setFlowValue('flow-solar', solar, 'W');
    setFlowValue('flow-consumption', consumption, 'W', true);
    setFlowValue('flow-battery', battery, 'W');
    setFlowValue('flow-grid', grid, 'W');
    setFlowValue('flow-plant', plant, 'W');

    setFlowDirection('arrow-solar-home', solar > 50);
    setFlowDirection('arrow-battery-home', Math.abs(battery) > 50, battery < 0);
    setFlowDirection('arrow-grid-home', Math.abs(grid) > 50, grid < 0);
    setFlowDirection('arrow-solar-battery', plant > 50 && solar > 50);
  }

  function setFlowValue(id, watts, unit, forceKw) {
    const el = document.getElementById(id);
    if (!el) return;
    const abs = Math.abs(watts);
    if (abs >= 1000 || forceKw) {
      el.textContent = `${(watts / 1000).toFixed(2)} kW`;
    } else {
      el.textContent = `${watts.toFixed(0)} ${unit}`;
    }
    el.classList.toggle('active', abs > 10);
    el.classList.toggle('negative', watts < -10);
  }

  function setFlowDirection(id, active, reverse = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('flow-active', active);
    el.classList.toggle('flow-reverse', reverse);
  }

  function recordHistory() {
    const point = {
      t: Date.now(),
      soc: parseFloat(client?.getState(METRICS.soc.entity)?.state) || null,
      plant: getPowerW('plantPower'),
      solar: getPowerW('solarProduction'),
    };
    history.push(point);
    if (history.length > MAX_HISTORY) history.shift();
    drawSparkline();
  }

  function drawSparkline() {
    const canvas = $('#power-sparkline');
    if (!canvas || history.length < 2) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const values = history.map((p) => p.plant);
    const max = Math.max(...values, 500);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    ctx.beginPath();
    ctx.strokeStyle = '#ff7700';
    ctx.lineWidth = 2;
    history.forEach((p, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((p.plant - min) / range) * (h - 8) - 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255,119,0,0.25)');
    grad.addColorStop(1, 'rgba(255,119,0,0)');
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function renderMetricPlaceholders() {
    const grid = $('#metrics-grid');
    grid.innerHTML = DASHBOARD_CONFIG.metricGroups
      .map(
        (g) => `
      <section class="metric-group">
        <h3>${g.title}</h3>
        <div class="metric-cards">
          ${g.keys
            .map(
              (key) => `
            <div class="metric-card" data-metric="${key}">
              <span class="metric-label">${getMetricLabel(key)}</span>
              <span class="metric-value-wrap">
                <span class="metric-value">—</span>
                <span class="metric-unit"></span>
              </span>
            </div>`
            )
            .join('')}
        </div>
      </section>`
      )
      .join('');
  }

  document.addEventListener('DOMContentLoaded', init);
})();