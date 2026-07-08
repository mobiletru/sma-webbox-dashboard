/**
 * SMA Webbox Dashboard — parameter controls (number / select / readonly)
 */
const ParameterControls = (function () {
  const BAD_STATES = new Set(['unknown', 'unavailable', 'none', '']);

  function render(container, client, onToast) {
    if (!DASHBOARD_CONFIG.parameters?.length) return;

    container.innerHTML = `
      <section class="controls-section card">
        <div class="controls-header">
          <h2 class="card-title">Parameter Controls</h2>
          <p class="controls-note">Changes are sent to the Sunny Island via Home Assistant WebBox entities.</p>
        </div>
        <div class="controls-groups">
          ${DASHBOARD_CONFIG.parameters.map(renderGroup).join('')}
        </div>
      </section>`;

    bindEvents(container, client, onToast);
  }

  function renderGroup(group) {
    return `
      <div class="control-group" data-readonly="${group.readOnly ? 'true' : 'false'}">
        <h3>${group.title}</h3>
        <div class="control-items">
          ${group.items.map(renderItem).join('')}
        </div>
      </div>`;
  }

  function renderItem(item) {
    if (item.type === 'readonly') {
      return `
        <div class="control-item readonly" data-param="${item.key}" data-entity="${item.entity}">
          <div class="control-label-row">
            <span class="control-label">${item.label}</span>
            <span class="control-live" data-live>—</span>
          </div>
        </div>`;
    }

    if (item.type === 'select') {
      return `
        <div class="control-item" data-param="${item.key}" data-entity="${item.entity}" data-type="select">
          <div class="control-label-row">
            <span class="control-label">${item.label}</span>
            <span class="control-status" data-status></span>
          </div>
          <div class="control-row">
            <select class="control-select" data-input disabled>
              <option value="">Loading…</option>
            </select>
            <button class="btn-apply" data-apply disabled>Apply</button>
          </div>
        </div>`;
    }

    return `
      <div class="control-item" data-param="${item.key}" data-entity="${item.entity}" data-type="number">
        <div class="control-label-row">
          <span class="control-label">${item.label}</span>
          <span class="control-live" data-live>—</span>
        </div>
        <div class="control-row">
          <input type="range" class="control-slider" data-slider disabled />
          <input type="number" class="control-number" data-input disabled />
          <span class="control-unit" data-unit></span>
          <button class="btn-apply" data-apply disabled>Apply</button>
        </div>
      </div>`;
  }

  function bindEvents(container, client, onToast) {
    container.querySelectorAll('.control-item:not([data-type="readonly"])').forEach((item) => {
      const type = item.dataset.type;
      const applyBtn = item.querySelector('[data-apply]');
      const input = item.querySelector('[data-input]');
      const slider = item.querySelector('[data-slider]');

      if (slider && input) {
        slider.addEventListener('input', () => {
          input.value = slider.value;
          markDirty(item);
        });
        input.addEventListener('input', () => {
          slider.value = input.value;
          markDirty(item);
        });
      }

      if (type === 'select') {
        input.addEventListener('change', () => markDirty(item));
      }

      applyBtn?.addEventListener('click', async () => {
        await applyChange(item, client, onToast);
      });
    });
  }

  function markDirty(item) {
    item.classList.add('dirty');
    const status = item.querySelector('[data-status]');
    if (status) status.textContent = 'Unsaved';
  }

  async function applyChange(item, client, onToast) {
    const entityId = item.dataset.entity;
    const type = item.dataset.type;
    const input = item.querySelector('[data-input]');
    const applyBtn = item.querySelector('[data-apply]');
    const label = item.querySelector('.control-label')?.textContent || entityId;

    applyBtn.disabled = true;
    applyBtn.textContent = 'Sending…';

    try {
      if (type === 'number') {
        const value = parseFloat(input.value);
        if (isNaN(value)) throw new Error('Invalid number');
        await client.callService('number', 'set_value', { value }, { entity_id: entityId });
      } else if (type === 'select') {
        const option = input.value;
        if (!option) throw new Error('Select an option');
        await client.callService('select', 'select_option', { option }, { entity_id: entityId });
      }
      item.classList.remove('dirty');
      const status = item.querySelector('[data-status]');
      if (status) status.textContent = 'Saved';
      onToast?.(`Updated ${label}`, 'success');
    } catch (err) {
      onToast?.(`Failed: ${label} — ${err.message}`, 'error');
    } finally {
      applyBtn.textContent = 'Apply';
      applyBtn.disabled = item.classList.contains('unavailable');
    }
  }

  function updateFromState(entityId, state) {
    const item = document.querySelector(`[data-entity="${entityId}"]`);
    if (!item || !state) return;

    const raw = state.state;
    const unavailable = BAD_STATES.has(String(raw).toLowerCase());
    const type = item.dataset.type;

    if (type === 'readonly') {
      const live = item.querySelector('[data-live]');
      const unit = state.attributes?.unit_of_measurement || '';
      if (live) {
        live.textContent = unavailable ? '—' : `${raw}${unit ? ' ' + unit : ''}`;
      }
      item.classList.toggle('unavailable', unavailable);
      return;
    }

    item.classList.toggle('unavailable', unavailable);

    const live = item.querySelector('[data-live]');
    const unitEl = item.querySelector('[data-unit]');
    const input = item.querySelector('[data-input]');
    const slider = item.querySelector('[data-slider]');
    const applyBtn = item.querySelector('[data-apply]');
    const status = item.querySelector('[data-status]');
    const unit = state.attributes?.unit_of_measurement || '';

    if (unitEl) unitEl.textContent = unit;
    if (live && type === 'number') {
      live.textContent = unavailable ? '—' : `${raw}${unit ? ' ' + unit : ''}`;
    }

    if (unavailable) {
      if (input) input.disabled = true;
      if (slider) slider.disabled = true;
      if (applyBtn) applyBtn.disabled = true;
      if (status) status.textContent = 'Unavailable';
      return;
    }

    if (type === 'number') {
      const min = state.attributes?.min ?? 0;
      const max = state.attributes?.max ?? 100;
      const step = state.attributes?.step ?? 1;
      const val = parseFloat(raw);

      if (slider) {
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = val;
        slider.disabled = false;
      }
      if (input) {
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = val;
        input.disabled = false;
      }
      if (applyBtn) applyBtn.disabled = false;
      if (status && !item.classList.contains('dirty')) status.textContent = '';
    }

    if (type === 'select') {
      const options = state.attributes?.options || [];
      if (input) {
        const current = String(raw);
        input.innerHTML = options.map((o) => `<option value="${o}"${o === current ? ' selected' : ''}>${o}</option>`).join('');
        input.disabled = options.length === 0;
      }
      if (applyBtn) applyBtn.disabled = false;
      if (status && !item.classList.contains('dirty')) status.textContent = '';
    }
  }

  function updateAll(states) {
    for (const state of Object.values(states)) {
      updateFromState(state.entity_id, state);
    }
  }

  return { render, updateFromState, updateAll };
})();