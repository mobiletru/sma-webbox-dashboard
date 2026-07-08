/**
 * SMA Webbox Dashboard — main application
 */
(function () {
  const BAD_STATES = new Set(['unknown', 'unavailable', 'none', '']);

  let client = null;
  let history = [];
  const MAX_HISTORY = 120;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function init() {
    document.title = DASHBOARD_CONFIG.title;
    $('#dashboard-title').textContent = DASHBOARD_CONFIG.title;
    $('#dashboard-subtitle').textContent = DASHBOARD_CONFIG.subtitle;
    $('#year').textContent = new Date().getFullYear();

    bindAuth();
    bindSettings();
    renderMetricPlaceholders();
    renderParameterControls();
    tryConnect();
  }

  function renderParameterControls() {
    const container = $('#controls-container');
    if (!container) return;
    ParameterControls.render(container, null, showToast);
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
        const entityIds = getAllEntityIds();
        try {
          await client.subscribeEntities(entityIds);
          updateAllFromStates();
          ParameterControls.render($('#controls-container'), client, showToast);
        } catch (err) {
          setConnectionStatus('error', err.message);
        }
      },
      onDisconnect: () => setConnectionStatus('disconnected'),
      onStateChange: (entityId, state) => {
        updateEntity(entityId, state);
        ParameterControls.updateFromState(entityId, state);
        recordHistory();
      },
      onError: (msg) => {
        if (msg.includes('token')) {
          clearToken();
          showAuth();
        }
        setConnectionStatus('error', msg);
      },
    });

    setConnectionStatus('connecting');
    client.connect();
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

  function updateAllFromStates() {
    const states = client.getStates();
    for (const state of Object.values(states)) {
      updateEntity(state.entity_id, state);
    }
    ParameterControls.updateAll(states);
    recordHistory();
  }

  function updateEntity(entityId, state) {
    const key = Object.entries(DASHBOARD_CONFIG.entities).find(([, id]) => id === entityId)?.[0];
    if (!key) return;

    const value = formatValue(key, state);
    const unit = state.attributes?.unit_of_measurement || '';

    const valueEl = $(`[data-metric="${key}"] .metric-value`);
    const unitEl = $(`[data-metric="${key}"] .metric-unit`);
    if (valueEl) valueEl.textContent = value;
    if (unitEl) unitEl.textContent = unit;

    if (key === 'soc') updateSocGauge(state.state);
    if (key === 'deviceStatus' || key === 'plantStatus') updateStatusBadge(key, state.state);
    if (['siPower', 'plantPower', 'batteryCharge', 'gridPower', 'gridFeedIn', 'solarProduction', 'consumption', 'netConsumption'].includes(key)) {
      updateFlowDiagram();
    }
  }

  function formatValue(key, state) {
    const raw = state.state;
    if (BAD_STATES.has(String(raw).toLowerCase())) return '—';

    if (['deviceStatus', 'plantStatus'].includes(key)) return raw;

    const num = parseFloat(raw);
    if (isNaN(num)) return raw;

    if (key === 'soc') return num.toFixed(1);
    if (key.includes('Today') || key === 'energyToday') return num.toFixed(1);
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(2);
    if (Number.isInteger(num)) return String(num);
    return num.toFixed(Math.abs(num) < 10 ? 2 : 1);
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
    const offset = circumference - (soc / 100) * circumference;
    arc.style.strokeDashoffset = String(offset);
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
    const entityId = DASHBOARD_CONFIG.entities[key];
    const state = client?.getStates()[entityId];
    if (!state || BAD_STATES.has(String(state.state).toLowerCase())) return 0;
    let val = parseFloat(state.state);
    if (isNaN(val)) return 0;
    const unit = state.attributes?.unit_of_measurement || '';
    if (unit === 'kW') val *= 1000;
    return val;
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
      soc: parseFloat(client?.getStates()[DASHBOARD_CONFIG.entities.soc]?.state) || null,
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
    const groups = [
      { title: 'Battery', keys: ['siPower', 'batteryCharge', 'dcVoltage', 'dcCurrent', 'batteryTemp'] },
      { title: 'Grid', keys: ['gridPower', 'gridFeedIn'] },
      { title: 'Plant', keys: ['plantPower', 'energyToday', 'plantStatus'] },
      { title: 'Solar (Envoy)', keys: ['solarProduction', 'solarProductionToday', 'consumption', 'consumptionToday', 'netConsumption'] },
    ];

    grid.innerHTML = groups
      .map(
        (g) => `
      <section class="metric-group">
        <h3>${g.title}</h3>
        <div class="metric-cards">
          ${g.keys
            .map(
              (key) => `
            <div class="metric-card" data-metric="${key}">
              <span class="metric-label">${DASHBOARD_CONFIG.labels[key]}</span>
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