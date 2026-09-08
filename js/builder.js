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
    updateSynergy();
  }

  function updateLayoutLabel() {
    if (!layoutLabel) return;
    if (tokens.length === 0) { layoutLabel.textContent = '— Chờ ghép —'; return; }
    if (tokens.length === 1) { layoutLabel.textContent = 'Kéo thêm 1–2 bộ thủ'; return; }

    const [a, b] = tokens;
    const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
    const layout = dx > dy ? '⿰ Trái–Phải' : '⿱ Trên–Dưới';
    layoutLabel.textContent = tokens.length === 3 ? '3 bộ thủ — ⿲/⿳/品' : layout;
  }

  // ── Synergy Calculation ───────────────────────────────────────────────────
  function updateSynergy() {
    const placed = tokens.map(t => t.char);
    const synergySet = new Set();

    if (placed.length === 1) {
      const c1 = placed[0];
      for (const key of Object.keys(DEMO_RECIPES)) {
        const parts = key.split('+');
        if (parts.length === 2) {
          if (parts[0] === c1) synergySet.add(parts[1]);
          else if (parts[1] === c1) synergySet.add(parts[0]);
        } else if (parts.length === 3) {
          const idx = parts.indexOf(c1);
          if (idx !== -1) {
            parts.forEach((p, i) => { if (i !== idx) synergySet.add(p); });
          }
        }
      }
    } else if (placed.length === 2) {
      const [c1, c2] = placed;
      for (const key of Object.keys(DEMO_RECIPES)) {
        const parts = key.split('+');
        if (parts.length === 3) {
          const copy = [...parts];
          const i1 = copy.indexOf(c1);
          if (i1 !== -1) {
            copy.splice(i1, 1);
            const i2 = copy.indexOf(c2);
            if (i2 !== -1) {
              copy.splice(i2, 1);
              copy.forEach(p => synergySet.add(p));
            }
          }
        }
      }
    }

    window.HanziForge = window.HanziForge || {};
    window.HanziForge.synergyRadicals = synergySet;
    window.HanziForge.renderPaletteTokens?.();
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
      unlockCharacter(result);
    } else {
      showResult({
        type: 'warning',
        html: `<p>⚠️ <strong>${chars.join(' + ')}</strong> chưa có công thức ghép.</p>
               <p style="font-size:.75rem;margin-top:.4rem;color:var(--text-dim)">
               Hãy thử các bộ thủ có trong sách công thức hoặc danh sách gợi ý!</p>`
      });
    }
  }

  function unlockCharacter(result) {
    window.HanziForge = window.HanziForge || {};
    window.HanziForge.craftedTokens = window.HanziForge.craftedTokens || [];

    // Add to crafted tokens if not existing
    if (!window.HanziForge.craftedTokens.some(c => c.char === result.char)) {
      window.HanziForge.craftedTokens.unshift({
        char: result.char,
        sino: result.sino,
        pinyin: result.pinyin,
        meaning: result.meaning,
        strokes: 0
      });
    }

    // Update crafted counter badge
    const craftedCountEl = document.getElementById('crafted-count');
    if (craftedCountEl) craftedCountEl.textContent = window.HanziForge.craftedTokens.length;

    // Update progress stats
    const unlockedEl = document.getElementById('stat-unlocked');
    if (unlockedEl) unlockedEl.textContent = window.HanziForge.craftedTokens.length;
    const recipesEl = document.getElementById('stat-recipes');
    if (recipesEl) recipesEl.textContent = fuseCount;

    // Add to unlocked grid in Progress view
    const unlockedGrid = document.getElementById('unlocked-grid');
    if (unlockedGrid) {
      const emptyEl = unlockedGrid.querySelector('.unlocked-empty');
      if (emptyEl) emptyEl.remove();

      let existingCard = unlockedGrid.querySelector(`[data-char="${result.char}"]`);
      if (!existingCard) {
        const card = document.createElement('div');
        card.className = 'radical-card';
        card.dataset.char = result.char;
        card.innerHTML = `
          <div class="radical-char">${result.char}</div>
          <div class="radical-sino">${result.sino}</div>
          <div class="radical-pinyin">${result.pinyin || '—'}</div>
          <div class="radical-meaning">${result.meaning}</div>
        `;
        unlockedGrid.appendChild(card);
      }
    }

    window.HanziForge.renderPaletteTokens?.();
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

  // ── Demo Recipes Dictionary ───────────────────────────────────────────────
  const DEMO_RECIPES = {
    // 2-component fusions
    '人+木': { char: '休', sino: 'Hưu',  pinyin: 'xiū', meaning: 'Nghỉ ngơi, hưu trí' },
    '木+木': { char: '林', sino: 'Lâm',  pinyin: 'lín', meaning: 'Rừng thưa' },
    '林+木': { char: '森', sino: 'Sâm',  pinyin: 'sēn', meaning: 'Rừng rậm' },
    '日+月': { char: '明', sino: 'Minh', pinyin: 'míng',meaning: 'Sáng, rõ ràng, thông minh' },
    '人+人': { char: '从', sino: 'Tùng', pinyin: 'cóng',meaning: 'Theo sau, cùng đi' },
    '女+子': { char: '好', sino: 'Hảo',  pinyin: 'hǎo', meaning: 'Tốt, đẹp, thích' },
    '火+火': { char: '炎', sino: 'Viêm', pinyin: 'yán', meaning: 'Nóng bỏng, bốc lửa' },
    '水+木': { char: '沐', sino: 'Mộc',  pinyin: 'mù',  meaning: 'Gội đầu, tắm gội' },
    '口+口': { char: '吕', sino: 'Lữ',   pinyin: 'lǚ',  meaning: 'Họ Lữ, cung nhạc' },
    '山+山': { char: '屾', sino: 'Sàn',  pinyin: 'shèn',meaning: 'Hai núi cạnh nhau' },
    '日+木': { char: '杲', sino: 'Cảo',  pinyin: 'gǎo', meaning: 'Mặt trời trên cây, sáng rực' },
    '土+口': { char: '吐', sino: 'Thổ',  pinyin: 'tǔ',  meaning: 'Nôn mửa, thổ lộ' },
    '心+刀': { char: '忍', sino: 'Nhẫn', pinyin: 'rěn', meaning: 'Nhẫn nhịn, chịu đựng' },
    '小+大': { char: '尖', sino: 'Tiêm', pinyin: 'jiān',meaning: 'Nhọn, sắc bén' },
    '日+日': { char: '昌', sino: 'Xương',pinyin: 'chāng',meaning: 'Thịnh vượng, phát đạt' },
    '田+力': { char: '男', sino: 'Nam',  pinyin: 'nán', meaning: 'Người nam, đàn ông' },
    '宀+女': { char: '安', sino: 'An',   pinyin: 'ān',  meaning: 'Bình an, yên ổn' },
    '宀+子': { char: '字', sino: 'Tự',   pinyin: 'zì',  meaning: 'Chữ viết' },
    '手+目': { char: '看', sino: 'Khán', pinyin: 'kàn', meaning: 'Nhìn, xem' },

    // 3-component fusions (Kim tự tháp / 品字)
    '木+木+木': { char: '森', sino: 'Sâm',  pinyin: 'sēn', meaning: 'Rừng rậm' },
    '人+人+人': { char: '众', sino: 'Chúng', pinyin: 'zhòng',meaning: 'Đám đông, quần chúng' },
    '口+口+口': { char: '品', sino: 'Phẩm', pinyin: 'pǐn', meaning: 'Phẩm chất, đánh giá' },
    '日+日+日': { char: '晶', sino: 'Tinh', pinyin: 'jīng',meaning: 'Pha lê, sáng lấp lánh' },
    '火+火+火': { char: '焱', sino: 'Diễm', pinyin: 'yàn', meaning: 'Lửa bốc cao, sáng rực' },
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

  // ── Render Codex Recipe Book ──────────────────────────────────────────────
  function renderCodexRecipes(filterQuery = '') {
    const grid = document.getElementById('codex-recipes-grid');
    if (!grid) return;

    const query = filterQuery.toLowerCase().trim();
    const recipeKeys = Object.keys(DEMO_RECIPES);

    const filtered = recipeKeys.filter(key => {
      const r = DEMO_RECIPES[key];
      if (!query) return true;
      return key.includes(query) ||
             r.char.includes(query) ||
             r.sino.toLowerCase().includes(query) ||
             (r.pinyin && r.pinyin.toLowerCase().includes(query)) ||
             r.meaning.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<p class="palette-empty" style="grid-column:1/-1">Không tìm thấy công thức nào phù hợp.</p>';
      return;
    }

    grid.innerHTML = filtered.map(key => {
      const r = DEMO_RECIPES[key];
      return `
        <div class="recipe-card" data-key="${key}" title="Nhấp để thử ghép chữ này trên bàn!">
          <div class="recipe-ingredients">${key}</div>
          <div class="recipe-arrow">↓</div>
          <div class="recipe-result">${r.char}</div>
          <div class="recipe-name"><strong>${r.sino}</strong> (${r.pinyin || '—'})</div>
          <div style="font-size:0.72rem;color:var(--text-dim);margin-top:0.25rem">${r.meaning}</div>
        </div>
      `;
    }).join('');

    // Click recipe card to auto-load onto canvas
    grid.querySelectorAll('.recipe-card').forEach(card => {
      card.addEventListener('click', () => {
        quickLoadRecipe(card.dataset.key);
      });
    });
  }

  function quickLoadRecipe(recipeKey) {
    const parts = recipeKey.split('+');
    // Clear canvas
    tokens.forEach(t => t.el?.remove());
    tokens.length = 0;

    // Switch to Builder tab
    document.getElementById('tab-builder')?.click();

    // Close codex modal
    window.HanziForge?.closeModal?.('modal-codex');

    // Place tokens across the canvas
    const spacing = 100 / (parts.length + 1);
    parts.forEach((p, idx) => {
      const rad = window.HanziForge?.RADICALS_DATA?.find(r => r[0] === p) ||
                  window.HanziForge?.craftedTokens?.find(c => c.char === p);
      placeToken({
        char: p,
        sino: rad ? (rad[1] || rad.sino) : p,
        pinyin: rad ? (rad[2] || rad.pinyin) : '',
        meaning: rad ? (rad[4] || rad.meaning) : '',
        x: parseFloat((spacing * (idx + 1)).toFixed(1)),
        y: 50
      });
    });
  }

  // Bind codex search
  document.getElementById('codex-search')?.addEventListener('input', e => {
    renderCodexRecipes(e.target.value);
  });

  // Re-render codex recipes when codex modal opens
  document.getElementById('btn-open-codex')?.addEventListener('click', () => {
    renderCodexRecipes();
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  updateUI();
  renderCodexRecipes();

  window.HanziForge = window.HanziForge || {};
  window.HanziForge.placeToken = placeToken;
  window.HanziForge.DEMO_RECIPES = DEMO_RECIPES;
  window.HanziForge.quickLoadRecipe = quickLoadRecipe;

  console.log('[HanziForge] builder.js loaded — canvas workspace & fusion engine ready');
})();
