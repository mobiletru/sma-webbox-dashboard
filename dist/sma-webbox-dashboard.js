/**
 * SMA Webbox Dashboard — HACS plugin entry
 * Full dashboard: /local/community/sma-webbox-dashboard/index.html
 */
class SMAWebboxDashboardLink extends HTMLElement {
  connectedCallback() {
    if (this.childElementCount > 0) return;
    const href = '/local/community/sma-webbox-dashboard/index.html';
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Open SMA Webbox Dashboard';
    a.style.cssText = 'color:var(--primary-color,#ff7700);font-weight:600;text-decoration:none';
    this.appendChild(a);
  }
}
customElements.define('sma-webbox-dashboard-link', SMAWebboxDashboardLink);