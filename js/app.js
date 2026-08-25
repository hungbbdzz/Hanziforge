/**
 * HanziForge — app.js
 * Week 2: Tab navigation & base UI controller
 * Built with AI assistance (Google Gemini)
 * Course: Special Topics in AI Product Development — VKU 2026
 *
 * Responsibilities:
 *  - Tab switching (Builder / Radicals / Progress)
 *  - Sound toggle UI
 *  - Script mode toggle (Simplified ↔ Traditional) — UI only, data wired Week 8
 *  - Modal open/close management
 *  - Base user stats display
 */

(function () {
  'use strict';

  // ── Tab Navigation ────────────────────────────────────────────────────────
  const tabBtns  = document.querySelectorAll('.nav-tab-btn');
  const sections = document.querySelectorAll('.view-section');

  function switchTab(targetTab) {
    tabBtns.forEach(btn => {
      const active = btn.dataset.tab === targetTab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active);
    });
    sections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${targetTab}`);
    });
  }

  tabBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  // ── Sound Toggle ──────────────────────────────────────────────────────────
  let soundEnabled = true;
  const soundBtn   = document.getElementById('btn-toggle-sound');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
      soundBtn.title = soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh';
    });
  }

  // ── Script Mode Toggle (Simplified ↔ Traditional) ─────────────────────────
  // UI only in Week 2 — Week 8 will connect to chinese_variants.js data
  let isTraditional = false;
  const scriptBtn   = document.getElementById('btn-toggle-script');

  if (scriptBtn) {
    scriptBtn.addEventListener('click', () => {
      isTraditional = !isTraditional;
      scriptBtn.textContent  = isTraditional ? '🇹🇼 Phồn thể' : '🇨🇳 Giản thể';
      scriptBtn.classList.toggle('trad', isTraditional);
      // TODO Week 8: call VariantsEngine.setMode(isTraditional ? 'trad' : 'simp')
    });
  }

  // ── Modal Management ──────────────────────────────────────────────────────
  function openModal(id)  { document.getElementById(id)?.removeAttribute('hidden'); }
  function closeModal(id) { document.getElementById(id)?.setAttribute('hidden', ''); }

  // Codex modal
  document.getElementById('btn-open-codex')
    ?.addEventListener('click', () => openModal('modal-codex'));
  document.getElementById('btn-close-codex')
    ?.addEventListener('click', () => closeModal('modal-codex'));

  // Character detail modal
  document.getElementById('btn-close-char-modal')
    ?.addEventListener('click', () => closeModal('modal-char-detail'));

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.setAttribute('hidden', '');
    });
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal-overlay:not([hidden])').forEach(m => {
      m.setAttribute('hidden', '');
    });
  });

  // Modal tabs
  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.modal-panel');
      panel?.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // TODO Week 5+: render tab content based on btn.dataset.mtab
    });
  });

  // ── Base State Display ────────────────────────────────────────────────────
  // Static placeholder — Week 7 replaces with LocalStorage state.js
  const baseState = { streak: 1, xp: 0, level: 1, unlocked: 0, recipes: 0 };

  function renderStats(s) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('header-streak-days', `${s.streak} ngày`);
    set('header-xp-val',      `${s.xp} XP`);
    set('header-level-badge', `Cấp ${s.level}`);
    set('stat-streak',        s.streak);
    set('stat-xp',            s.xp);
    set('stat-level',         s.level);
    set('stat-unlocked',      s.unlocked);
    set('stat-recipes',       s.recipes);
    set('stat-best-streak',   s.streak);
    set('xp-bar-level',       s.level);
    set('xp-bar-current',     s.xp);
    const nextXp = s.level * 100;
    set('xp-bar-max',         nextXp);
    set('stat-xp-next',       nextXp);
    const fill = document.getElementById('xp-bar-fill');
    if (fill) fill.style.width = `${Math.min(100, (s.xp / nextXp) * 100)}%`;
  }

  renderStats(baseState);

  // ── Save / Export buttons (placeholder — Week 7 will wire state.js) ───────
  document.getElementById('btn-save')?.addEventListener('click', () => {
    console.log('[HanziForge] Save — Week 7: state.js will handle LocalStorage persistence');
    alert('Tính năng lưu sẽ được thêm vào tuần 7!');
  });

  document.getElementById('btn-export-save')?.addEventListener('click', () => {
    console.log('[HanziForge] Export — Week 7: state.js will export JSON save file');
    alert('Tính năng xuất dữ liệu sẽ được thêm vào tuần 7!');
  });

  document.getElementById('btn-import-save')?.addEventListener('click', () => {
    console.log('[HanziForge] Import — Week 7: state.js will import JSON save file');
    alert('Tính năng nhập dữ liệu sẽ được thêm vào tuần 7!');
  });

  // ── Expose global API for other modules ──────────────────────────────────
  window.HanziForge = window.HanziForge || {};
  window.HanziForge.openModal    = openModal;
  window.HanziForge.closeModal   = closeModal;
  window.HanziForge.isSoundOn    = () => soundEnabled;
  window.HanziForge.isTraditional = () => isTraditional;
  window.HanziForge.renderStats  = renderStats;

  console.log('[HanziForge] app.js loaded — tab navigation & UI controls active');
})();
