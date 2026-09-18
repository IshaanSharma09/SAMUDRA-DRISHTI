/* ==========================================================================
   SAMUDRA DRISHTI — SHARED JAVASCRIPT SYSTEM (shared.js)
   National Maritime Surveillance & Oceanographic Civic Intelligence
   Theme engine · Sound feedback · Live IST clock · Reveal observer · Export
   ========================================================================== */

'use strict';

(function () {
  /* ── 1. TACTILE AUDIO SYNTHESIS ── */
  let audioCtx = null;
  let soundEnabled = false;

  function initAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  window.playTactileClick = function () {
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
      /* Audio policy restriction before user gesture */
    }
  };

  /* ── 2. THEME ENGINE ── */
  const THEME_KEY = 'sd-theme';

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    _syncToggleLabel(theme);
  }

  function _syncToggleLabel(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const label = theme === 'dark' ? 'Switch to Sunlit Civic Hall Mode' : 'Switch to Deep Indigo Night Mode';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  }

  function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn || btn.dataset.boundTheme) return;
    btn.dataset.boundTheme = 'true';

    const current = document.documentElement.getAttribute('data-theme') || 'light';
    _syncToggleLabel(current);

    btn.addEventListener('click', () => {
      window.playTactileClick();
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      applyTheme(isDark ? 'light' : 'dark');
    });
  }

  /* ── 3. SOUND TOGGLE ── */
  function initSoundToggle() {
    const btn = document.getElementById('sound-toggle');
    if (!btn || btn.dataset.boundSound) return;
    btn.dataset.boundSound = 'true';

    btn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      if (soundEnabled) {
        initAudio();
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('title', 'Mute Tactile Audio Feedback');
        window.playTactileClick();
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('title', 'Enable Tactile Audio Feedback');
      }
    });
  }

  /* ── 4. LIVE IST CLOCK & SATELLITE COUNTDOWN ── */
  function _nowIST() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + (5 * 60 + 30) * 60000);
  }

  function _pad(n) { return String(n).padStart(2, '0'); }

  function _formatTime(d) {
    return `${_pad(d.getHours())}:${_pad(d.getMinutes())}:${_pad(d.getSeconds())} IST`;
  }

  function updateLastCheck() {
    const el = document.getElementById('last-check-time');
    if (el) el.textContent = _formatTime(_nowIST());
  }

  let satSeconds = 258; // 04:18
  function updateSatCountdown() {
    const el = document.getElementById('sat-countdown-timer');
    if (!el) return;
    satSeconds = satSeconds > 0 ? satSeconds - 1 : 3600;
    const m = Math.floor(satSeconds / 60);
    const s = satSeconds % 60;
    el.textContent = `T-${_pad(m)}:${_pad(s)}`;
  }

  /* ── 5. SCROLL REVEAL OBSERVER ── */
  function initRevealObserver() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    elements.forEach(el => observer.observe(el));
  }

  /* ── 6. DETERMINISTIC DOSSIER EXPORT ── */
  function initDossierExport() {
    const btn = document.querySelector('.btn-export-pdf');
    if (!btn || btn.dataset.boundExport) return;
    btn.dataset.boundExport = 'true';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.playTactileClick();

      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.style.opacity = '0.85';
      btn.innerHTML = `
        <span class="loading-spinner" style="width:13px;height:13px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;" aria-hidden="true"></span>
        <span>Compiling SHA-256 Dossier...</span>
      `;

      setTimeout(() => {
        // Generate authentic institutional JSON export dossier
        const dossierData = {
          initiative: "Samudra Drishti (समुद्र दृष्टि)",
          ministry: "Ministry of Earth Sciences (MoES), Government of India",
          nodal_agency: "Indian National Centre for Ocean Information Services (INCOIS)",
          operational_partner: "Indian Coast Guard (ICG)",
          classification: "RESTRICTED OFFICIAL // CITIZEN AUDIT VERIFIED",
          generated_at_ist: _formatTime(_nowIST()),
          sar_sensor: "Sentinel-1A C-SAR (Synthetic Aperture Radar)",
          scene_checksum_sha256: "9a8f3b4c5e2d1a0f8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a",
          eez_coverage_km2: 2372000,
          coastline_km: 7516,
          active_spill_incidents: 0,
          vessels_in_ais_window: 1420,
          verification_protocol: "NDSAP Level-4 Open Civic Standard"
        };

        const blob = new Blob([JSON.stringify(dossierData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `samudra_drishti_intelligence_dossier_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        btn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Dossier Downloaded</span>
        `;

        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.disabled = false;
          btn.style.opacity = '1';
        }, 2200);
      }, 750);
    });
  }

  /* ── 7. INITIALIZE DOM ── */
  document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initSoundToggle();
    initRevealObserver();
    initDossierExport();

    updateLastCheck();
    updateSatCountdown();
    setInterval(updateLastCheck, 1000);
    setInterval(updateSatCountdown, 1000);

    console.info(
      '%c SAMUDRA DRISHTI — Sovereign Civic Intelligence',
      'color:#FFFFFF;font-weight:700;font-size:12px;background:#071324;padding:4px 10px;border-left:3px solid #FF9E0B;'
    );
  });
})();
