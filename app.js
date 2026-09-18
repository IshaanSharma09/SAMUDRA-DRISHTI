/* ════════════════════════════════════════════════════════════
   SAMUDRA DRISHTI — JavaScript (app.js)
   ════════════════════════════════════════════════════════════ */

'use strict';

// ─── IST CLOCK ───────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  // IST = UTC + 5:30
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);

  const hh = String(ist.getHours()).padStart(2, '0');
  const mm = String(ist.getMinutes()).padStart(2, '0');
  const ss = String(ist.getSeconds()).padStart(2, '0');

  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const dd = String(ist.getDate()).padStart(2, '0');
  const mon = months[ist.getMonth()];
  const yyyy = ist.getFullYear();

  const clockEl = document.getElementById('clock-time');
  const dateEl  = document.getElementById('clock-date');
  const mapTs   = document.getElementById('map-ts');

  if (clockEl) clockEl.textContent = `${hh}:${mm}:${ss}`;
  if (dateEl)  dateEl.textContent  = `${dd} ${mon} ${yyyy}`;
  if (mapTs)   mapTs.textContent   = `${hh}:${mm}:${ss} IST`;
}

setInterval(updateClock, 1000);
updateClock();

// ─── FONT SIZE CONTROLS ──────────────────────────────────────
const fontBtns = document.querySelectorAll('.font-btn');
const fontSm   = document.getElementById('font-sm');
const fontMd   = document.getElementById('font-md');
const fontLg   = document.getElementById('font-lg');

function setFontSize(size) {
  document.body.classList.remove('text-sm', 'text-lg');
  if (size === 'sm') document.body.classList.add('text-sm');
  if (size === 'lg') document.body.classList.add('text-lg');
  fontBtns.forEach(b => b.classList.remove('font-active'));
  const target = size === 'sm' ? fontSm : size === 'lg' ? fontLg : fontMd;
  if (target) target.classList.add('font-active');
}

fontSm && fontSm.addEventListener('click', () => setFontSize('sm'));
fontMd && fontMd.addEventListener('click', () => setFontSize('md'));
fontLg && fontLg.addEventListener('click', () => setFontSize('lg'));

// ─── LANGUAGE SWITCH ─────────────────────────────────────────
const langEn = document.getElementById('lang-en');
const langHi = document.getElementById('lang-hi');

langEn && langEn.addEventListener('click', () => {
  langEn.classList.add('lang-active');
  langHi && langHi.classList.remove('lang-active');
  langEn.setAttribute('aria-pressed', 'true');
  langHi && langHi.setAttribute('aria-pressed', 'false');
});
langHi && langHi.addEventListener('click', () => {
  langHi.classList.add('lang-active');
  langEn && langEn.classList.remove('lang-active');
  langHi.setAttribute('aria-pressed', 'true');
  langEn && langEn.setAttribute('aria-pressed', 'false');
  // Indicate translation coming soon
  const label = document.querySelector('.gov-label');
  if (label) {
    const orig = label.innerHTML;
    label.innerHTML = label.innerHTML.replace('Government of India', 'भारत सरकार');
  }
});

// ─── SIDEBAR NAVIGATION ──────────────────────────────────────
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navItems.forEach(n => {
      n.classList.remove('active');
      n.removeAttribute('aria-current');
    });
    item.classList.add('active');
    item.setAttribute('aria-current', 'page');
  });
});

// ─── MAP TOOLBAR BUTTONS ─────────────────────────────────────
const mapBtns = document.querySelectorAll('.map-btn');
mapBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active-btn');
    const pressed = btn.classList.contains('active-btn');
    btn.setAttribute('aria-pressed', String(pressed));
    flashMapLayer(btn.id, pressed);
  });
});

function flashMapLayer(btnId, active) {
  // Visual feedback for layer toggle
  const mapSvg = document.querySelector('.map-svg');
  if (!mapSvg) return;

  const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  overlay.setAttribute('width', '900');
  overlay.setAttribute('height', '560');
  overlay.setAttribute('fill', active ? 'rgba(0,255,136,0.04)' : 'rgba(255,0,0,0.03)');
  overlay.style.pointerEvents = 'none';
  mapSvg.appendChild(overlay);
  setTimeout(() => overlay.remove(), 300);
}

// ─── ZOOM CONTROLS ───────────────────────────────────────────
let zoomLevel = 6;
const coordEl = document.getElementById('map-coords');

document.getElementById('zoom-in') && document.getElementById('zoom-in').addEventListener('click', () => {
  if (zoomLevel < 14) {
    zoomLevel++;
    updateZoomDisplay();
    animateMapZoom(true);
  }
});
document.getElementById('zoom-out') && document.getElementById('zoom-out').addEventListener('click', () => {
  if (zoomLevel > 2) {
    zoomLevel--;
    updateZoomDisplay();
    animateMapZoom(false);
  }
});

function updateZoomDisplay() {
  if (coordEl) {
    const lat  = (12.45 + (zoomLevel - 6) * 0.2).toFixed(4);
    const lon  = (76.832 + (zoomLevel - 6) * 0.3).toFixed(4);
    coordEl.textContent = `${lat}°N  ${lon}°E  |  Alt: 0m  |  Zoom: ${zoomLevel}`;
  }
}

function animateMapZoom(zoomIn) {
  const mapSvg = document.querySelector('.map-svg');
  if (!mapSvg) return;

  const scale = zoomIn ? 1.04 : 0.97;
  mapSvg.style.transition = 'transform 0.25s ease';
  mapSvg.style.transform = `scale(${scale})`;
  setTimeout(() => {
    mapSvg.style.transform = 'scale(1)';
    setTimeout(() => { mapSvg.style.transition = ''; }, 250);
  }, 250);
}

// ─── LIVE VESSEL COUNT SIMULATION ────────────────────────────
function simulateLiveData() {
  const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
  const count = 47 + variation;

  const sbVessels = document.getElementById('sb-vessels');
  if (sbVessels) sbVessels.textContent = count;

  const kpiVessels = document.getElementById('kpi-vessels-r');
  if (kpiVessels) kpiVessels.textContent = count;

  // Randomly blink pulse dot
  const pulseDot = document.getElementById('status-pulse');
  if (pulseDot) {
    pulseDot.style.background = '#4ade80';
    setTimeout(() => { if (pulseDot) pulseDot.style.background = ''; }, 200);
  }
}

setInterval(simulateLiveData, 8000);

// ─── ALERT CARD INTERACTIONS ─────────────────────────────────
const alertCards = document.querySelectorAll('.alert-card');
alertCards.forEach(card => {
  card.addEventListener('click', () => {
    // Brief highlight
    card.style.borderLeftWidth = '5px';
    card.style.background = '#1e2d45';
    setTimeout(() => {
      card.style.borderLeftWidth = '';
      card.style.background = '';
    }, 600);
  });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
});

// ─── SECTOR CELLS TOOLTIP & CLICK ────────────────────────────
const sectorItems = document.querySelectorAll('.sector-item');
sectorItems.forEach(item => {
  item.addEventListener('click', () => {
    sectorItems.forEach(s => s.style.outline = '');
    item.style.outline = '2px solid var(--saffron, #FF9933)';
  });
  item.setAttribute('tabindex', '0');
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
  });
  item.setAttribute('role', 'button');
});

// ─── VESSEL HIGHLIGHT ON HOVER (SVG) ────────────────────────
const vesselGroups = document.querySelectorAll('g.vessel');
vesselGroups.forEach(g => {
  g.setAttribute('tabindex', '0');
  g.setAttribute('role', 'button');
  g.setAttribute('aria-label', 'Vessel — click to view details');
  g.addEventListener('focus', () => { g.style.filter = 'brightness(1.4)'; });
  g.addEventListener('blur',  () => { g.style.filter = ''; });
});

// ─── KPI LATENCY SIMULATION ──────────────────────────────────
function updateLatency() {
  const el = document.getElementById('kpi-latency');
  if (!el) return;
  const lat = (1.2 + Math.random() * 0.5).toFixed(1);
  el.textContent = `${lat}s`;
}
setInterval(updateLatency, 5000);

// ─── SKIP LINK ───────────────────────────────────────────────
const skipLink = document.getElementById('skip-link');
if (skipLink) {
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const main = document.getElementById('main-content');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus();
      setTimeout(() => main.removeAttribute('tabindex'), 1000);
    }
  });
}

// ─── KEYBOARD NAVIGATION ─────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // Alt + M → focus map
  if (e.altKey && e.key === 'm') {
    e.preventDefault();
    const mapEl = document.getElementById('map-container');
    if (mapEl) mapEl.focus();
  }
  // Alt + N → focus nav
  if (e.altKey && e.key === 'n') {
    e.preventDefault();
    const firstNav = document.querySelector('.nav-item');
    if (firstNav) firstNav.focus();
  }
});

// ─── ENV DATA UPDATE TIME ────────────────────────────────────
const envUpdateEl = document.getElementById('env-update-time');
function updateEnvTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  if (envUpdateEl) envUpdateEl.textContent = `Updated: ${h}:${m} IST`;
}
updateEnvTime();
setInterval(updateEnvTime, 60000);

// ─── INTERCEPT BUTTON INTERACTION ────────────────────────────
const interceptBtn = document.getElementById('btn-intercept-poseidon');
interceptBtn && interceptBtn.addEventListener('click', () => {
  interceptBtn.textContent = 'ORDER TRANSMITTED';
  interceptBtn.style.background = '#dc2626';
  interceptBtn.style.color = '#fff';
  interceptBtn.style.borderColor = '#dc2626';
  interceptBtn.style.boxShadow = '0 0 16px rgba(239,68,68,0.6)';
  setTimeout(() => {
    interceptBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> INTERCEPT`;
    interceptBtn.style.background = '';
    interceptBtn.style.color = '';
    interceptBtn.style.borderColor = '';
    interceptBtn.style.boxShadow = '';
  }, 4000);
});

// TRACK buttons
document.querySelectorAll('.susp-btn-track').forEach(btn => {
  btn.addEventListener('click', () => {
    const original = btn.innerHTML;
    btn.textContent = '◎ Tracking…';
    btn.style.color = '#4ade80';
    setTimeout(() => { btn.innerHTML = original; btn.style.color = ''; }, 3500);
  });
});

const slider     = document.getElementById('timelag-slider');
const offsetDisp = document.getElementById('tl-offset-display');
const liveText   = document.getElementById('tl-live-text');
const liveDot    = document.getElementById('tl-live-dot');

// Hindcast/Forecast path elements (SVG)
const hindcastPath = document.getElementById('hindcast-path');
const forecastPath = document.getElementById('forecast-path');
const slickPoly    = document.getElementById('slick-polygon');
const culpritGroup = document.getElementById('vessel-culprit');

function updateSlider(val) {
  const v = parseInt(val, 10);
  slider.setAttribute('aria-valuenow', v);

  if (v === 0) {
    offsetDisp.textContent = 'T+0 (Live)';
    liveText.textContent   = '● LIVE';
    liveDot.style.display  = 'inline-block';
    slider.setAttribute('aria-valuetext', 'Live');
  } else if (v < 0) {
    offsetDisp.textContent = `T${v}h (Hindcast)`;
    liveText.textContent   = `HINDCAST ${v}h`;
    liveDot.style.display  = 'none';
    slider.setAttribute('aria-valuetext', `Hindcast ${Math.abs(v)} hours`);
  } else {
    offsetDisp.textContent = `T+${v}h (Forecast)`;
    liveText.textContent   = `FORECAST +${v}h`;
    liveDot.style.display  = 'none';
    slider.setAttribute('aria-valuetext', `Forecast plus ${v} hours`);
  }

  // Adjust path opacity based on direction
  const normalizedH = Math.max(0, Math.min(1, (v < 0 ? Math.abs(v)/48 : 0)));
  const normalizedF = Math.max(0, Math.min(1, (v > 0 ? v/24 : 0)));

  if (hindcastPath) hindcastPath.style.opacity = 0.3 + normalizedH * 0.6;
  if (forecastPath) forecastPath.style.opacity = 0.3 + normalizedF * 0.6;

  // Animate spill polygon size slightly based on time
  if (slickPoly) {
    // Forecast: spill grows; hindcast: spill shrinks
    const scaleF = 1 + (v > 0 ? (v / 24) * 0.25 : 0);
    const scaleH = 1 - (v < 0 ? (Math.abs(v) / 48) * 0.5 : 0);
    const scale  = v >= 0 ? scaleF : scaleH;
    slickPoly.style.transform = `scale(${scale.toFixed(3)})`;
    slickPoly.style.transformOrigin = '256px 280px';
  }
}

slider && slider.addEventListener('input', (e) => {
  updateSlider(e.target.value);
});
slider && slider.addEventListener('change', (e) => {
  updateSlider(e.target.value);
});

// ─── TOAST CLOSE ─────────────────────────────────────────────
const toastEl    = document.getElementById('map-toast');
const toastClose = document.getElementById('toast-close');

toastClose && toastClose.addEventListener('click', () => {
  if (toastEl) {
    toastEl.classList.add('toast-dismissed');
    setTimeout(() => {
      toastEl.style.display = 'none';
    }, 380);
  }
});

// Auto-dismiss after 18 seconds
setTimeout(() => {
  if (toastEl && !toastEl.classList.contains('toast-dismissed')) {
    toastEl.classList.add('toast-dismissed');
    setTimeout(() => { if (toastEl) toastEl.style.display = 'none'; }, 380);
  }
}, 18000);

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  updateZoomDisplay();
  updateSlider(0);
  console.log('%cSAMUDRA DRISHTI v2.4 — OPERATIONAL', 'color:#FF9933;font-weight:bold;font-size:14px;');
  console.log('%cNational Technical Research Organisation (NTRO)', 'color:#94a3b8;font-size:12px;');
  console.log('%cAI-Driven Maritime Spill Detection & Vessel Tracking', 'color:#60A5FA;font-size:11px;');
});
