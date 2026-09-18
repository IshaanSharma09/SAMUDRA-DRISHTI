/* ==========================================================================
   SAMUDRA DRISHTI — SHARED JAVASCRIPT (shared.js)
   Theme engine · Language toggle · Live IST clock · Reveal observer
   ========================================================================== */

'use strict';

/* ── THEME ENGINE ──────────────────────────────────────────────────────────
   Preference is stored in localStorage under the key 'sd-theme'.
   The <head> inline script applies it before first paint (no flash).
   This module wires up the toggle button and exposes applyTheme().
   ─────────────────────────────────────────────────────────────────────── */
const THEME_KEY = 'sd-theme';

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* storage unavailable */ }
  _syncToggleLabel(theme);
}

function _syncToggleLabel(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const label = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  btn.setAttribute('aria-label', label);
  btn.setAttribute('title', label);
}

function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  _syncToggleLabel(current);
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(isDark ? 'light' : 'dark');
  });
}

/* ── LANGUAGE TOGGLE ─────────────────────────────────────────────────────── */
const STRINGS = {
  en: { title: 'Samudra Drishti', lang: 'en' },
  hi: { title: 'समुद्र दृष्टि',   lang: 'hi' }
};
let currentLang = 'en';

function applyLanguage(lang) {
  const s = STRINGS[lang] || STRINGS.en;
  const titleEl = document.getElementById('main-title');
  if (titleEl) titleEl.textContent = s.title;
  document.documentElement.lang = s.lang;
  currentLang = lang;
}

function initLangToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    applyLanguage(currentLang === 'en' ? 'hi' : 'en');
  });
}

/* ── LIVE IST CLOCK ──────────────────────────────────────────────────────── */
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

function updateEnvTime() {
  const el = document.getElementById('env-update-time');
  if (!el) return;
  const d = _nowIST();
  el.textContent = `Updated: ${_pad(d.getHours())}:${_pad(d.getMinutes())} IST`;
}

/* ── SCROLL REVEAL ───────────────────────────────────────────────────────── */
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

/* ── INIT ────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initLangToggle();
  applyLanguage('en');
  initRevealObserver();
  updateLastCheck();
  updateEnvTime();
  setInterval(updateLastCheck, 1000);
  setInterval(updateEnvTime,   60000);

  console.info(
    '%c SAMUDRA DRISHTI — Operational',
    'color:#D45A00;font-weight:700;font-size:13px;background:#0B1E3D;padding:4px 10px;border-radius:3px;'
  );
  console.info(
    '%cGovernment of India  |  Ministry of Earth Sciences  |  NTRO',
    'color:#486480;font-size:11px;'
  );
});
