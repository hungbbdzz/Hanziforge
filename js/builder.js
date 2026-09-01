/**
 * HanziForge — builder.js
 * Canvas workspace: drag-and-drop token system & fusion engine
 * Built with AI assistance (Google Gemini)
 *
 * Current: basic drag-and-drop, 15 demo recipes, undo, history
 * See ROADMAP.md for weekly feature additions
 */

(function () {
  'use strict';

  // ── Canvas State ──────────────────────────────────────────────────────────
  const tokens   = [];      // { char, sino, pinyin, meaning, x, y, el }
  const history  = [];      // fusion history log
  let   fuseCount = 0;

  // ── DOM Refs ──────────────────────────────────────────────────────────────
  const dropZone  = document.getElementById('canvas-drop-zone');
  const fuseBtn   = document.getElementById('btn-fuse');
  const clearBtn  = document.getElementById('btn-clear-canvas');
  const undoBtn   = document.getElementById('btn-undo');
  const resultArea = document.getElementById('codex-result-area');
  const historyList = document.getElementById('codex-history-list');
  const layoutLabel = document.getElementById('canvas-layout-label');
  const hintEl    = document.getElementById('canvas-hint');

  if (!dropZone) return;

  // ── Drag from Palette → Canvas ────────────────────────────────────────────
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dropZone.style.boxShadow = 'inset 0 0 30px rgba(245,158,11,.12)';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.boxShadow = '';
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.style.boxShadow = '';

    const data = window.HanziForge?.dragData;
    if (!data) return;

    if (tokens.length >= 3) {
      showResult({ type: 'warning', html: '⚠️ Tối đa 3 bộ thủ trên canvas cùng lúc.' });
      return;
    }

    const rect = dropZone.getBoundingClientRect();
    const x = parseFloat(((e.clientX - rect.left) / rect.width  * 100).toFixed(1));
    const y = parseFloat(((e.clientY - rect.top)  / rect.height * 100).toFixed(1));

    placeToken({ ...data, x, y });
    window.HanziForge.dragData = null;
  });

  // ── Place Token on Canvas ─────────────────────────────────────────────────
  function placeToken(data) {
    // Clamp to canvas bounds
    const safeX = Math.max(8, Math.min(92, data.x));
    const safeY = Math.max(8, Math.min(92, data.y));

    const el = document.createElement('div');
    el.className = 'canvas-token';
    el.style.left = `${safeX}%`;
    el.style.top  = `${safeY}%`;
    el.innerHTML  = `<span class="token-char">${data.char}</span>`;
    el.title      = `${data.char} — ${data.sino} (${data.pinyin}): ${data.meaning}`;

    makeDraggable(el, data);
    el.addEventListener('dblclick', () => {
      // Double-click → open character detail (Week 5: HanziWriter)
      if (window.HanziForge?.openRadicalDetail) {
        window.HanziForge.openRadicalDetail(
          window.HanziForge.RADICALS_DATA?.find(r => r[0] === data.char)
          || [data.char, data.sino, data.pinyin, 0, data.meaning]
        );
      }
    });

    dropZone.appendChild(el);
    tokens.push({ ...data, x: safeX, y: safeY, el });

    // Hide hint when tokens placed
    if (hintEl) hintEl.style.display = 'none';

    updateUI();
  }

  // ── Make token draggable within canvas ────────────────────────────────────
  function makeDraggable(el, data) {
    let dragging = false;
    let startMouseX, startMouseY, startLeft, startTop;

    el.addEventListener('mousedown', e => {
      dragging    = true;
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startLeft   = parseFloat(el.style.left);
      startTop    = parseFloat(el.style.top);
      el.style.zIndex = 10;
      el.style.transition = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const rect = dropZone.getBoundingClientRect();
      const dx = (e.clientX - startMouseX) / rect.width  * 100;
      const dy = (e.clientY - startMouseY) / rect.height * 100;
      const nx = Math.max(8, Math.min(92, startLeft + dx));
      const ny = Math.max(8, Math.min(92, startTop  + dy));
      el.style.left = `${nx}%`;
      el.style.top  = `${ny}%`;
      data.x = nx;
      data.y = ny;
      updateLayoutLabel();
    });

    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        el.style.zIndex    = '';
        el.style.transition = '';
      }
    });
  }

  // ── Update UI state ───────────────────────────────────────────────────────
  function updateUI() {
    if (fuseBtn)  fuseBtn.disabled  = tokens.length < 2;
    if (undoBtn)  undoBtn.disabled  = tokens.length === 0;
    updateLayoutLabel();
  }

  function updateLayoutLabel() {
    if (!layoutLabel) return;
    if (tokens.length === 0) { layoutLabel.textContent = '— Chờ ghép —'; return; }
    if (tokens.length === 1) { layoutLabel.textContent = 'Kéo thêm 1–2 bộ thủ'; return; }

    // Week 3: simple axis detection preview (Week 4 will be the full SpatialGeometry engine)
    const [a, b] = tokens;
    const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
    const layout = dx > dy ? '⿰ Trái–Phải' : '⿱ Trên–Dưới';
    layoutLabel.textContent = tokens.length === 3 ? '3 bộ thủ — ⿲/⿳/品' : layout;
  }

  // ── Fuse Action ───────────────────────────────────────────────────────────
  if (fuseBtn) {
    fuseBtn.addEventListener('click', performFusion);
  }

  function performFusion() {
    if (tokens.length < 2) return;

    const chars  = tokens.map(t => t.char);
    const result = lookupRecipe(chars);
    fuseCount++;

    if (result) {
      showResult({
        type: 'success',
        html: `
          <div class="codex-result-char">${result.char}</div>
          <div class="codex-result-sino">${result.sino}</div>
          <div class="codex-result-pinyin">${result.pinyin || '—'}</div>
          <div class="codex-result-meaning">${result.meaning}</div>
        `
      });
      addToHistory(chars, result);
      // TODO Week 7: window.HanziForge.awardXP(10)
    } else {
      showResult({
        type: 'warning',
        html: `<p>⚠️ <strong>${chars.join(' + ')}</strong> chưa có công thức.</p>
               <p style="font-size:.75rem;margin-top:.4rem;color:var(--text-dim)">
               Tuần 4 sẽ tích hợp đầy đủ 8,660 công thức từ MakeMeAHanzi.</p>`
      });
    }
  }

  function showResult({ type, html }) {
    if (!resultArea) return;
    resultArea.innerHTML = `<div class="codex-result-card ${type}">${html}</div>`;
  }

  function addToHistory(chars, result) {
    history.unshift({ chars, result, time: new Date() });
    if (history.length > 10) history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (!historyList) return;
    if (history.length === 0) {
      historyList.innerHTML = '<p class="history-empty">Chưa có lịch sử</p>';
      return;
    }
    historyList.innerHTML = history.slice(0, 5).map(h => `
      <div class="history-item">
        <span class="h-char">${h.chars.join('+')}</span>
        <span>→</span>
        <span class="h-char">${h.result.char}</span>
        <span style="color:var(--text-dim);font-size:.72rem">${h.result.sino}</span>
      </div>
    `).join('');
  }

  // ── Clear Canvas ──────────────────────────────────────────────────────────
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      tokens.forEach(t => t.el?.remove());
      tokens.length = 0;
      if (hintEl) hintEl.style.display = 'flex';
      if (resultArea) resultArea.innerHTML = `
        <div class="codex-empty-state">
          <span class="codex-empty-icon">🔮</span>
          <p>Ghép thành công sẽ hiển thị kết quả tại đây</p>
        </div>`;
      updateUI();
    });
  }

  // ── Undo Last Token ───────────────────────────────────────────────────────
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      const last = tokens.pop();
      if (last?.el) last.el.remove();
      if (tokens.length === 0 && hintEl) hintEl.style.display = 'flex';
      updateUI();
    });
  }

  // ── Basic Recipe Lookup ───────────────────────────────────────────────────
  // Week 3: demo set — Week 4 will replace with full CRAFTING_RECIPES_MAP
  const DEMO_RECIPES = {
    '人+木': { char: '休', sino: 'Hưu',  pinyin: 'xiū', meaning: 'Nghỉ ngơi, hưu trí' },
    '木+木': { char: '林', sino: 'Lâm',  pinyin: 'lín', meaning: 'Rừng thưa' },
    '日+月': { char: '明', sino: 'Minh', pinyin: 'míng',meaning: 'Sáng, rõ ràng, thông minh' },
    '人+人': { char: '从', sino: 'Tùng', pinyin: 'cóng',meaning: 'Theo sau, cùng đi' },
    '林+木': { char: '森', sino: 'Sâm',  pinyin: 'sēn', meaning: 'Rừng rậm' },
    '女+子': { char: '好', sino: 'Hảo',  pinyin: 'hǎo', meaning: 'Tốt, đẹp, thích' },
    '火+火': { char: '炎', sino: 'Viêm', pinyin: 'yán', meaning: 'Nóng bỏng, bốc lửa' },
    '水+木': { char: '沐', sino: 'Mộc',  pinyin: 'mù',  meaning: 'Gội đầu' },
    '口+口': { char: '吕', sino: 'Lữ',   pinyin: 'lǚ',  meaning: 'Họ Lữ, cung nhạc' },
    '山+山': { char: '屾', sino: 'Sàn',  pinyin: 'shèn',meaning: 'Hai núi cạnh nhau' },
    '日+木': { char: '杲', sino: 'Cảo',  pinyin: 'gǎo', meaning: 'Mặt trời trên cây, sáng rực' },
    '土+口': { char: '吐', sino: 'Thổ',  pinyin: 'tǔ',  meaning: 'Nôn mửa, thổ lộ' },
    '心+刀': { char: '忍', sino: 'Nhẫn', pinyin: 'rěn', meaning: 'Nhẫn nhịn, chịu đựng' },
    '小+大': { char: '尖', sino: 'Tiêm', pinyin: 'jiān',meaning: 'Nhọn, sắc bén' },
    '日+日': { char: '昌', sino: 'Xương',pinyin: 'chāng',meaning: 'Thịnh vượng, phát đạt' },
  };

  function lookupRecipe(chars) {
    const keys = [
      chars.join('+'),
      chars.slice().reverse().join('+'),
    ];
    // Try all permutations for 3-char
    if (chars.length === 3) {
      const perms = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
      perms.forEach(p => keys.push(p.map(i => chars[i]).join('+')));
    }
    for (const key of keys) {
      if (DEMO_RECIPES[key]) return DEMO_RECIPES[key];
    }
    return null;
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  updateUI();

  window.HanziForge = window.HanziForge || {};
  window.HanziForge.placeToken = placeToken;

  console.log('[HanziForge] builder.js loaded — canvas drag-and-drop active');
})();
