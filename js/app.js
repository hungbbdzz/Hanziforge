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
  let currentWriter = null;
  let currentChar = '';

  function openModal(id)  { document.getElementById(id)?.removeAttribute('hidden'); }
  function closeModal(id) {
    if (id === 'modal-char-detail' && currentWriter) {
      try { currentWriter.cancelQuiz(); } catch (e) {}
    }
    document.getElementById(id)?.setAttribute('hidden', '');
  }

  // Character Detail & HanziWriter Integration
  function openCharDetail(char, info = {}) {
    if (!char) return;
    currentChar = char;

    if (currentWriter) {
      try { currentWriter.cancelQuiz(); } catch (e) {}
      currentWriter = null;
    }

    const hwTarget = document.getElementById('char-hw-target');
    if (hwTarget) hwTarget.innerHTML = '';

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('modal-char-title', info.sino || char);
    set('modal-char-pinyin', info.pinyin ? `[${info.pinyin}]` : '');
    set('modal-char-meaning', info.meaning || '');

    const tagsEl = document.getElementById('modal-char-tags');
    if (tagsEl) {
      const strokesText = info.strokes ? `Bộ ${info.strokes} nét` : 'Hán tự';
      tagsEl.innerHTML = `
        <span class="tag hsk">${strokesText}</span>
        <span class="tag trad">${char}</span>
      `;
    }

    openModal('modal-char-detail');

    if (window.HanziWriter && hwTarget) {
      try {
        currentWriter = HanziWriter.create('char-hw-target', char, {
          width: 110,
          height: 110,
          padding: 5,
          strokeColor: '#F59E0B',
          outlineColor: 'rgba(255, 255, 255, 0.15)',
          radicalColor: '#10B981',
          drawingColor: '#FFFFFF',
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 250,
          showCharacter: false,
          showOutline: true,
          charDataLoader: (charToLoad, onComplete, onError) => {
            fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${encodeURIComponent(charToLoad)}.json`)
              .then(res => {
                if (res.ok) return res.json();
                throw new Error('Not in standard set');
              })
              .then(data => onComplete(data))
              .catch(() => {
                fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data-traditional@latest/${encodeURIComponent(charToLoad)}.json`)
                  .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Not in traditional set');
                  })
                  .then(data => onComplete(data))
                  .catch(err => {
                    if (onError) onError(err);
                  });
              });
          },
          onLoadCharDataSuccess: () => {
            currentWriter.animateCharacter();
          },
          onLoadCharDataError: () => {
            if (hwTarget) {
              hwTarget.innerHTML = `<span style="font-family:var(--font-hanzi);font-size:3.6rem;color:var(--gold-lt)">${char}</span>`;
            }
          }
        });
      } catch (err) {
        if (hwTarget) {
          hwTarget.innerHTML = `<span style="font-family:var(--font-hanzi);font-size:3.6rem;color:var(--gold-lt)">${char}</span>`;
        }
      }
    } else if (hwTarget) {
      hwTarget.innerHTML = `<span style="font-family:var(--font-hanzi);font-size:3.6rem;color:var(--gold-lt)">${char}</span>`;
    }
  }

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
  const tabNames = {
    vocab: 'Từ vựng HSK',
    sentences: 'Câu ví dụ song ngữ',
    stroke: 'Luyện nét viết HanziWriter',
    etymology: 'Từ nguyên & Nguồn gốc'
  };

  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.modal-panel');
      panel?.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const contentEl = document.getElementById('modal-tab-content');
      if (contentEl) {
        const title = tabNames[btn.dataset.mtab] || 'Dữ liệu';
        contentEl.innerHTML = `
          <div class="modal-content-placeholder">
            <span style="font-size:2rem;display:block;margin-bottom:0.25rem">✨</span>
            <p style="font-weight:700;font-size:1rem;color:var(--gold-lt)">Coming Soon</p>
            <p style="font-size:0.82rem;color:var(--text-dim);margin-top:0.2rem">
              Tính năng <strong>${title}</strong> đang được phát triển.
            </p>
          </div>
        `;
      }
    });
  });

  // ── Base State Display ────────────────────────────────────────────────────
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

  // ── Save / Export buttons (Coming Soon) ───────────────────────────────────
  document.getElementById('btn-save')?.addEventListener('click', () => {
    alert('Coming Soon — Tính năng lưu tiến độ đang được hoàn thiện!');
  });

  document.getElementById('btn-export-save')?.addEventListener('click', () => {
    alert('Coming Soon — Tính năng xuất dữ liệu đang được hoàn thiện!');
  });

  document.getElementById('btn-import-save')?.addEventListener('click', () => {
    alert('Coming Soon — Tính năng nhập dữ liệu đang được hoàn thiện!');
  });

  // ── Expose global API for other modules ──────────────────────────────────
  window.HanziForge = window.HanziForge || {};
  window.HanziForge.openModal      = openModal;
  window.HanziForge.closeModal     = closeModal;
  window.HanziForge.openCharDetail = openCharDetail;
  window.HanziForge.getCurrentWriter = () => currentWriter;
  window.HanziForge.getCurrentChar = () => currentChar;
  window.HanziForge.isSoundOn      = () => soundEnabled;
  window.HanziForge.isTraditional  = () => isTraditional;
  window.HanziForge.renderStats    = renderStats;

  console.log('[HanziForge] app.js loaded — tab navigation, UI controls & HanziWriter modal active');
})();
