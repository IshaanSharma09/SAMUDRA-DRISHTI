/**
 * SAMUDRA DRISHTI — SWISS / INTERNATIONAL CIVIC PORTAL ENGINE
 * Script: landing.js
 * High-precision tactile interactions, real-time coastal telemetry,
 * incident reporting receipt generation, and Swiss wayfinding.
 */

(function () {
  'use strict';

  // ── 1. TACTILE AUDIO SYNTHESIS (MECHANICAL MICRO-FEEDBACK) ──
  let audioCtx = null;
  let soundEnabled = false;

  function initAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playTactileClick() {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.012);

      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.015);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.016);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }

  // ── 2. THEME CONTROLLER ──
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  function getPreferredTheme() {
    const saved = localStorage.getItem('sd-theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeToggleBtn) {
        themeToggleBtn.setAttribute('title', 'Switch to Sunlit Civic Hall Mode');
        themeToggleBtn.setAttribute('aria-label', 'Switch to Sunlit Civic Hall Mode');
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeToggleBtn) {
        themeToggleBtn.setAttribute('title', 'Switch to Deep Indigo Night Mode');
        themeToggleBtn.setAttribute('aria-label', 'Switch to Deep Indigo Night Mode');
      }
    }
    localStorage.setItem('sd-theme', theme);
  }

  if (themeToggleBtn && !themeToggleBtn.dataset.boundTheme) {
    themeToggleBtn.dataset.boundTheme = 'true';
    themeToggleBtn.addEventListener('click', () => {
      playTactileClick();
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Initialize theme
  applyTheme(getPreferredTheme());

  // Sound Toggle Controller
  const soundToggleBtn = document.getElementById('sound-toggle');
  if (soundToggleBtn && !soundToggleBtn.dataset.boundSound) {
    soundToggleBtn.dataset.boundSound = 'true';
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      if (soundEnabled) {
        initAudio();
        soundToggleBtn.classList.add('active');
        soundToggleBtn.setAttribute('aria-pressed', 'true');
        soundToggleBtn.setAttribute('title', 'Mute Tactile Audio Feedback');
        playTactileClick();
      } else {
        soundToggleBtn.classList.remove('active');
        soundToggleBtn.setAttribute('aria-pressed', 'false');
        soundToggleBtn.setAttribute('title', 'Enable Tactile Audio Feedback');
      }
    });
  }

  // ── 3. COASTAL INSPECTOR DATA SECTOR SWITCHER ──
  const coastalSectors = {
    west: {
      name: 'Sector West: Arabian Sea (Mumbai — Gujarat — Goa)',
      coords: '18.9220° N, 72.8347° E // EEZ SECTOR 01-W',
      waveHeight: '1.4 m',
      waveSub: 'Nominal Swell • Low Turbulence',
      spillRisk: '0.04%',
      spillSub: 'Zero Anomalies Detected',
      satPass: 'Sentinel-1A (04:12 IST)',
      satSub: 'SAR Swath Cleared 100%',
      waterTemp: '28.4 °C',
      tempSub: 'Moored Buoy AD06 Live',
      vessels: '842 Monitored',
      vesselSub: '100% AIS Identification',
      statusTag: 'STATUS: SECURE • NORMAL'
    },
    east: {
      name: 'Sector East: Bay of Bengal (Chennai — Vizag — Kolkata)',
      coords: '13.0827° N, 80.2707° E // EEZ SECTOR 02-E',
      waveHeight: '1.8 m',
      waveSub: 'Moderate Surface Current',
      spillRisk: '0.02%',
      spillSub: 'Zero Active Discharges',
      satPass: 'EOS-04 Radar (06:45 IST)',
      satSub: 'C-band Microwave Clear',
      waterTemp: '29.1 °C',
      tempSub: 'Moored Buoy BD11 Active',
      vessels: '614 Monitored',
      vesselSub: 'Coast Guard Radar Synced',
      statusTag: 'STATUS: SECURE • VERIFIED'
    },
    southwest: {
      name: 'Sector South-West: Lakshadweep Archipelago',
      coords: '10.5667° N, 72.6417° E // EEZ SECTOR 03-SW',
      waveHeight: '0.9 m',
      waveSub: 'Calm Waters • Coral Shelf',
      spillRisk: '0.01%',
      spillSub: 'Biosphere Protected Sanctuary',
      satPass: 'RISAT-1A (08:20 IST)',
      satSub: 'Eco-Sentinel High Resolution',
      waterTemp: '29.6 °C',
      tempSub: 'INCOIS Coral Bleach Watch Active',
      vessels: '128 Monitored',
      vesselSub: 'Eco-Corridor Adherence High',
      statusTag: 'STATUS: PRISTINE • PROTECTED'
    },
    southeast: {
      name: 'Sector South-East: Andaman & Nicobar Malacca Approaches',
      coords: '11.6234° N, 92.7265° E // EEZ SECTOR 04-SE',
      waveHeight: '2.1 m',
      waveSub: 'International Shipping Trench',
      spillRisk: '0.07%',
      spillSub: 'High-Density Traffic Escort',
      satPass: 'Sentinel-1B (09:04 IST)',
      satSub: 'Continuous Swath Monitoring',
      waterTemp: '29.8 °C',
      tempSub: 'Deep Trench Mooring CB04',
      vessels: '1,420 Monitored',
      vesselSub: 'International Corridor AIS Sync',
      statusTag: 'STATUS: HIGH ACTIVITY • SECURED'
    }
  };

  const sectorTabs = document.querySelectorAll('.sector-tab-btn');
  const sectorNameEl = document.getElementById('inspector-sector-name');
  const sectorCoordsEl = document.getElementById('inspector-sector-coords');
  const waveValEl = document.getElementById('inspector-wave-val');
  const waveSubEl = document.getElementById('inspector-wave-sub');
  const spillValEl = document.getElementById('inspector-spill-val');
  const spillSubEl = document.getElementById('inspector-spill-sub');
  const satValEl = document.getElementById('inspector-sat-val');
  const satSubEl = document.getElementById('inspector-sat-sub');
  const tempValEl = document.getElementById('inspector-temp-val');
  const tempSubEl = document.getElementById('inspector-temp-sub');
  const hudTagEl = document.getElementById('inspector-hud-tag');

  const dataPanel = document.querySelector('.inspector-data-panel');

  function updateSector(sectorKey) {
    const data = coastalSectors[sectorKey];
    if (!data) return;

    if (dataPanel) dataPanel.classList.add('telemetry-syncing');

    setTimeout(() => {
      if (sectorNameEl) sectorNameEl.textContent = data.name;
      if (sectorCoordsEl) sectorCoordsEl.textContent = data.coords;
      if (waveValEl) waveValEl.textContent = data.waveHeight;
      if (waveSubEl) waveSubEl.textContent = data.waveSub;
      if (spillValEl) spillValEl.textContent = data.spillRisk;
      if (spillSubEl) spillSubEl.textContent = data.spillSub;
      if (satValEl) satValEl.textContent = data.satPass;
      if (satSubEl) satSubEl.textContent = data.satSub;
      if (tempValEl) tempValEl.textContent = data.waterTemp;
      if (tempSubEl) tempSubEl.textContent = data.tempSub;
      if (hudTagEl) hudTagEl.textContent = data.statusTag;

      if (dataPanel) dataPanel.classList.remove('telemetry-syncing');
    }, 140);
  }

  sectorTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      playTactileClick();
      sectorTabs.forEach((t) => {
        t.classList.remove('tab-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('tab-active');
      tab.setAttribute('aria-selected', 'true');
      const sector = tab.getAttribute('data-sector');
      updateSector(sector);
    });
  });

  // ── 4. INCIDENT REPORT MODAL ──
  const modalOverlay = document.getElementById('incident-modal');
  const openModalBtns = document.querySelectorAll('.open-incident-modal-btn');
  const closeModalBtns = document.querySelectorAll('.close-modal-btn');
  const incidentForm = document.getElementById('incident-form');
  const receiptBox = document.getElementById('receipt-box');
  const receiptIdEl = document.getElementById('receipt-ticket-id');
  const receiptTimeEl = document.getElementById('receipt-timestamp');
  const submitBtn = document.getElementById('incident-submit-btn');

  function openModal() {
    playTactileClick();
    if (modalOverlay) {
      modalOverlay.classList.add('open');
      modalOverlay.setAttribute('aria-hidden', 'false');
      const firstInput = modalOverlay.querySelector('input, select');
      if (firstInput) firstInput.focus();
    }
  }

  function closeModal() {
    playTactileClick();
    if (modalOverlay) {
      modalOverlay.classList.remove('open');
      modalOverlay.setAttribute('aria-hidden', 'true');
    }
  }

  openModalBtns.forEach((btn) => btn.addEventListener('click', openModal));
  closeModalBtns.forEach((btn) => btn.addEventListener('click', closeModal));

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('open')) {
      closeModal();
    }
  });

  if (incidentForm) {
    incidentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      playTactileClick();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.innerHTML = '<span class="loading-spinner" aria-hidden="true"></span> Cryptographically Signing...';
      }

      setTimeout(() => {
        const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
        const ticketId = `IN-SD-2026-${randomHex}`;
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' IST';

        if (receiptIdEl) receiptIdEl.textContent = ticketId;
        if (receiptTimeEl) receiptTimeEl.textContent = now;

        if (receiptBox) {
          receiptBox.classList.add('show');
        }

        incidentForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.setAttribute('aria-busy', 'false');
          submitBtn.innerHTML = '<span>Incident Committed to Civic Grid</span>';
        }
      }, 600);
    });
  }

  // ── 5. WAYFINDING SCROLL SPY ──
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.masthead-nav .nav-anchor');

  function onScrollSpy() {
    const scrollPos = window.scrollY + 120;
    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('nav-active');
          } else {
            link.classList.remove('nav-active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', onScrollSpy, { passive: true });

  // ── 6. REAL-TIME SATELLITE PASS COUNTDOWN SIMULATOR ──
  const satTimerEl = document.getElementById('sat-countdown-timer');
  let secondsRemaining = 258; // 4 min 18 sec

  function updateCountdown() {
    if (!satTimerEl) return;
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    satTimerEl.textContent = `T-${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    secondsRemaining = secondsRemaining > 0 ? secondsRemaining - 1 : 360;
  }

  setInterval(updateCountdown, 1000);

  // Bind tactile sound to all interactive elements
  document.querySelectorAll('a, button, input, select').forEach((elem) => {
    elem.addEventListener('click', () => {
      if (!elem.classList.contains('tactile-switch-btn') && !elem.classList.contains('sector-tab-btn')) {
        playTactileClick();
      }
    });
  });

  console.log('Samudra Drishti — National Maritime Intelligence Grid Initialized.');
})();
