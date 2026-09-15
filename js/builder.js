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
      // Double-click → open character detail modal with HanziWriter
      if (window.HanziForge?.openCharDetail) {
        const rad = window.HanziForge.RADICALS_DATA?.find(r => r[0] === data.char);
        window.HanziForge.openCharDetail(data.char, {
          sino: rad ? rad[1] : (data.sino || data.char),
          pinyin: rad ? rad[2] : (data.pinyin || ''),
          strokes: rad ? rad[3] : 0,
          meaning: rad ? rad[4] : (data.meaning || '')
        });
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

  // ── Known Radical Sets for Spatial Layout Detection ──────────────────────
  const SURROUND_BOTTOMLEFT_RADS = new Set(['辶','走','廴','之','辵','夂','夊','尢','乙','爪','瓜','支','弋','乚']);
  const SURROUND_TOPRIGHT_RADS   = new Set(['刀','勹','气','几','司','弋','戈','户','羽','鸟','烏','令','刁']);
  const SURROUND_BOTTOM_RADS     = new Set(['凵','舁']);
  const SURROUND_LEFT_RADS       = new Set(['匚','匸']);
  const SURROUND_FULL_RADS       = new Set(['囗','口','行','衣']);
  const SURROUND_TOP_RADS        = new Set(['门','冂','几','凡','門','鬥','齐','齊']);
  const SURROUND_TOPLEFT_RADS    = new Set(['疒','广','尸','户','戶','厂','虍','麻','鹿','辰','耂','尹']);

  class SpatialGeometry {
    static analyze(tokens) {
      if (!tokens || tokens.length < 2) {
        return { layout: null, layoutName: '— Chờ ghép —', formula: '', roles: [] };
      }

      // ── 2-Component Analysis ──
      if (tokens.length === 2) {
        const [t1, t2] = tokens;
        const dx = t2.x - t1.x; // > 0 if t2 is to the right of t1
        const dy = t2.y - t1.y; // > 0 if t2 is below t1
        const dist = Math.sqrt(dx * dx + dy * dy);

        const isT1Surround = (set) => set.has(t1.char);
        const isT2Surround = (set) => set.has(t2.char);

        // Nửa bao dưới-trái (⿺) - e.g. 辶, 走
        if (isT1Surround(SURROUND_BOTTOMLEFT_RADS) && t1.x <= t2.x + 10 && t1.y >= t2.y - 10 && dist <= 48) {
          return {
            layout: 'SURROUND_BOTTOMLEFT',
            layoutName: '⿺ Nửa bao góc dưới-trái',
            formula: `${t1.char} [Bao dưới-trái] ❖ ${t2.char} [Bên trong]`,
            roles: [{ token: t1, position: 'BOTTOMLEFT' }, { token: t2, position: 'INSIDE' }]
          };
        }
        if (isT2Surround(SURROUND_BOTTOMLEFT_RADS) && t2.x <= t1.x + 10 && t2.y >= t1.y - 10 && dist <= 48) {
          return {
            layout: 'SURROUND_BOTTOMLEFT',
            layoutName: '⿺ Nửa bao góc dưới-trái',
            formula: `${t2.char} [Bao dưới-trái] ❖ ${t1.char} [Bên trong]`,
            roles: [{ token: t2, position: 'BOTTOMLEFT' }, { token: t1, position: 'INSIDE' }]
          };
        }

        // Nửa bao góc trên-trái (⿸) - e.g. 广, 疒, 尸
        if (isT1Surround(SURROUND_TOPLEFT_RADS) && t1.x <= t2.x + 10 && t1.y <= t2.y + 10 && dist <= 48) {
          return {
            layout: 'SURROUND_TOPLEFT',
            layoutName: '⿸ Nửa bao góc trên-trái',
            formula: `${t1.char} [Góc trên-trái] ❖ ${t2.char} [Bên trong]`,
            roles: [{ token: t1, position: 'TOPLEFT' }, { token: t2, position: 'INSIDE' }]
          };
        }
        if (isT2Surround(SURROUND_TOPLEFT_RADS) && t2.x <= t1.x + 10 && t2.y <= t1.y + 10 && dist <= 48) {
          return {
            layout: 'SURROUND_TOPLEFT',
            layoutName: '⿸ Nửa bao góc trên-trái',
            formula: `${t2.char} [Góc trên-trái] ❖ ${t1.char} [Bên trong]`,
            roles: [{ token: t2, position: 'TOPLEFT' }, { token: t1, position: 'INSIDE' }]
          };
        }

        // Nửa bao góc trên-phải (⿹) - e.g. 勹, 气, 刀
        if (isT1Surround(SURROUND_TOPRIGHT_RADS) && t1.x >= t2.x - 10 && t1.y <= t2.y + 10 && dist <= 48) {
          return {
            layout: 'SURROUND_TOPRIGHT',
            layoutName: '⿹ Nửa bao góc trên-phải',
            formula: `${t1.char} [Bao trên-phải] ❖ ${t2.char} [Bên trong]`,
            roles: [{ token: t1, position: 'TOPRIGHT' }, { token: t2, position: 'INSIDE' }]
          };
        }
        if (isT2Surround(SURROUND_TOPRIGHT_RADS) && t2.x >= t1.x - 10 && t2.y <= t1.y + 10 && dist <= 48) {
          return {
            layout: 'SURROUND_TOPRIGHT',
            layoutName: '⿹ Nửa bao góc trên-phải',
            formula: `${t2.char} [Bao trên-phải] ❖ ${t1.char} [Bên trong]`,
            roles: [{ token: t2, position: 'TOPRIGHT' }, { token: t1, position: 'INSIDE' }]
          };
        }

        // Bao bọc trên & 2 bên (⿵) - e.g. 门, 冂
        if (isT1Surround(SURROUND_TOP_RADS) && t1.y <= t2.y - 4 && Math.abs(dx) <= 24 && dist <= 48) {
          return {
            layout: 'SURROUND_TOP',
            layoutName: '⿵ Bao bọc trên',
            formula: `${t1.char} [Bao trên] ❖ ${t2.char} [Bên trong]`,
            roles: [{ token: t1, position: 'TOP_FRAME' }, { token: t2, position: 'INSIDE' }]
          };
        }
        if (isT2Surround(SURROUND_TOP_RADS) && t2.y <= t1.y - 4 && Math.abs(dx) <= 24 && dist <= 48) {
          return {
            layout: 'SURROUND_TOP',
            layoutName: '⿵ Bao bọc trên',
            formula: `${t2.char} [Bao trên] ❖ ${t1.char} [Bên trong]`,
            roles: [{ token: t2, position: 'TOP_FRAME' }, { token: t1, position: 'INSIDE' }]
          };
        }

        // Bao bọc dưới hở trên (⿶) - e.g. 凵
        if (isT1Surround(SURROUND_BOTTOM_RADS) && t1.y >= t2.y + 4 && Math.abs(dx) <= 24 && dist <= 48) {
          return {
            layout: 'SURROUND_BOTTOM',
            layoutName: '⿶ Bao bọc dưới',
            formula: `${t1.char} [Bao dưới] ❖ ${t2.char} [Bên trong]`,
            roles: [{ token: t1, position: 'BOTTOM_FRAME' }, { token: t2, position: 'INSIDE' }]
          };
        }
        if (isT2Surround(SURROUND_BOTTOM_RADS) && t2.y >= t1.y + 4 && Math.abs(dx) <= 24 && dist <= 48) {
          return {
            layout: 'SURROUND_BOTTOM',
            layoutName: '⿶ Bao bọc dưới',
            formula: `${t2.char} [Bao dưới] ❖ ${t1.char} [Bên trong]`,
            roles: [{ token: t2, position: 'BOTTOM_FRAME' }, { token: t1, position: 'INSIDE' }]
          };
        }

        // Bao bọc bên trái hở phải (⿷) - e.g. 匚
        if (isT1Surround(SURROUND_LEFT_RADS) && t1.x <= t2.x - 4 && Math.abs(dy) <= 24 && dist <= 48) {
          return {
            layout: 'SURROUND_LEFT',
            layoutName: '⿷ Bao bọc bên trái',
            formula: `${t1.char} [Bao trái] ❖ ${t2.char} [Bên trong]`,
            roles: [{ token: t1, position: 'LEFT_FRAME' }, { token: t2, position: 'INSIDE' }]
          };
        }
        if (isT2Surround(SURROUND_LEFT_RADS) && t2.x <= t1.x - 4 && Math.abs(dy) <= 24 && dist <= 48) {
          return {
            layout: 'SURROUND_LEFT',
            layoutName: '⿷ Bao bọc bên trái',
            formula: `${t2.char} [Bao trái] ❖ ${t1.char} [Bên trong]`,
            roles: [{ token: t2, position: 'LEFT_FRAME' }, { token: t1, position: 'INSIDE' }]
          };
        }

        // Bao bọc toàn phần (⿴) - e.g. 囗
        if ((isT1Surround(SURROUND_FULL_RADS) || isT2Surround(SURROUND_FULL_RADS)) && dist <= 42) {
          const outer = isT1Surround(SURROUND_FULL_RADS) ? t1 : t2;
          const inner = isT1Surround(SURROUND_FULL_RADS) ? t2 : t1;
          return {
            layout: 'SURROUND',
            layoutName: '⿴ Bao bọc toàn phần',
            formula: `${outer.char} [Bao ngoài] ❖ ${inner.char} [Bên trong]`,
            roles: [{ token: outer, position: 'OUTSIDE' }, { token: inner, position: 'INSIDE' }]
          };
        }

        // Giao nhau / Chồng lớp (⿻) - dist rất gần
        if (dist <= 18) {
          return {
            layout: 'OVERLAID',
            layoutName: '⿻ Giao nhau / Chồng lớp',
            formula: `${t1.char} ❖ ${t2.char}`,
            roles: [{ token: t1, position: 'OVERLAY' }, { token: t2, position: 'BASE' }]
          };
        }

        // Binary Geometric Standard Fallback (Trái–Phải vs Trên–Dưới)
        if (Math.abs(dx) >= Math.abs(dy)) {
          const left  = dx > 0 ? t1 : t2;
          const right = dx > 0 ? t2 : t1;
          return {
            layout: 'LEFT_RIGHT',
            layoutName: '⿰ Trái–Phải',
            formula: `${left.char} [Trái] ❖ ${right.char} [Phải]`,
            roles: [{ token: left, position: 'LEFT' }, { token: right, position: 'RIGHT' }]
          };
        } else {
          const top    = dy > 0 ? t1 : t2;
          const bottom = dy > 0 ? t2 : t1;
          return {
            layout: 'TOP_BOTTOM',
            layoutName: '⿱ Trên–Dưới',
            formula: `${top.char} [Trên] ❖ ${bottom.char} [Dưới]`,
            roles: [{ token: top, position: 'TOP' }, { token: bottom, position: 'BOTTOM' }]
          };
        }
      }

      // ── 3-Component Analysis ──
      if (tokens.length === 3) {
        const sortedY = [...tokens].sort((a, b) => a.y - b.y);
        const top = sortedY[0];
        const b1  = sortedY[1];
        const b2  = sortedY[2];

        // Kim tự tháp (品): 1 token ở trên giữa, 2 token ở dưới 2 bên
        const xDistBottom = Math.abs(b1.x - b2.x);
        const yDistFromTop = Math.min(b1.y, b2.y) - top.y;
        if (yDistFromTop >= 10 && xDistBottom >= 14) {
          const bl = b1.x < b2.x ? b1 : b2;
          const br = b1.x < b2.x ? b2 : b1;
          return {
            layout: 'TRIANGLE_PYRAMID',
            layoutName: '品 Kim tự tháp / Phẩm tự',
            formula: `${top.char} [Đỉnh] ❖ ${bl.char} [Dưới-Trái] ❖ ${br.char} [Dưới-Phải]`,
            roles: [{ token: top, position: 'TOP' }, { token: bl, position: 'BOTTOM_LEFT' }, { token: br, position: 'BOTTOM_RIGHT' }]
          };
        }

        const sortedX = [...tokens].sort((a, b) => a.x - b.x);
        const xSpread = sortedX[2].x - sortedX[0].x;
        const ySpread = sortedY[2].y - sortedY[0].y;

        if (ySpread > xSpread) {
          return {
            layout: 'THREE_PART_V',
            layoutName: '⿳ Ba phần dọc',
            formula: `${sortedY[0].char} [Trên] ❖ ${sortedY[1].char} [Giữa] ❖ ${sortedY[2].char} [Dưới]`,
            roles: [{ token: sortedY[0], position: 'TOP' }, { token: sortedY[1], position: 'MIDDLE' }, { token: sortedY[2], position: 'BOTTOM' }]
          };
        } else {
          return {
            layout: 'THREE_PART_H',
            layoutName: '⿲ Ba phần ngang',
            formula: `${sortedX[0].char} [Trái] ❖ ${sortedX[1].char} [Giữa] ❖ ${sortedX[2].char} [Phải]`,
            roles: [{ token: sortedX[0], position: 'LEFT' }, { token: sortedX[1], position: 'MIDDLE' }, { token: sortedX[2], position: 'RIGHT' }]
          };
        }
      }

      return { layout: null, layoutName: '— Chờ ghép —', formula: '', roles: [] };
    }
  }

  // ── Particle Burst Animation ──────────────────────────────────────────────
  function triggerParticleBurst(centerX, centerY) {
    if (!dropZone) return;
    const count = 28;
    const colors = ['#f59e0b', '#fbbf24', '#fef08a', '#10b981', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'fusion-particle';
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const distance = 45 + Math.random() * 65;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const size = 3 + Math.random() * 5;
      const color = colors[Math.floor(Math.random() * colors.length)];

      p.style.left = `${centerX}%`;
      p.style.top = `${centerY}%`;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = color;
      p.style.boxShadow = `0 0 10px ${color}`;
      p.style.setProperty('--dx', `${dx.toFixed(1)}px`);
      p.style.setProperty('--dy', `${dy.toFixed(1)}px`);

      dropZone.appendChild(p);
      setTimeout(() => p.remove(), 650);
    }
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

    const analysis = SpatialGeometry.analyze(tokens);
    layoutLabel.textContent = analysis.layoutName || '— Chờ ghép —';
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
      // Calculate token centroid for particle burst animation
      const avgX = tokens.reduce((sum, t) => sum + t.x, 0) / tokens.length;
      const avgY = tokens.reduce((sum, t) => sum + t.y, 0) / tokens.length;
      triggerParticleBurst(avgX, avgY);

      showResult({
        type: 'success',
        html: `
          <div class="codex-result-char" style="cursor:pointer" title="Nhấp để xem animation nét viết">${result.char}</div>
          <div class="codex-result-sino">${result.sino}</div>
          <div class="codex-result-pinyin">${result.pinyin || '—'}</div>
          <div class="codex-result-meaning">${result.meaning}</div>
          ${result.layoutName ? `<div style="font-size:0.75rem;color:var(--gold-lt);margin-top:0.35rem">${result.layoutName}</div>` : ''}
        `
      });

      const resChar = resultArea?.querySelector('.codex-result-char');
      if (resChar) {
        resChar.addEventListener('click', () => {
          window.HanziForge?.openCharDetail(result.char, result);
        });
      }

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
        card.style.cursor = 'pointer';
        card.title = `${result.char} — ${result.sino}\nNhấp để xem animation nét viết`;
        card.innerHTML = `
          <div class="radical-char">${result.char}</div>
          <div class="radical-sino">${result.sino}</div>
          <div class="radical-pinyin">${result.pinyin || '—'}</div>
          <div class="radical-meaning">${result.meaning}</div>
        `;
        card.addEventListener('click', () => {
          window.HanziForge?.openCharDetail(result.char, result);
        });
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
    // 2-component fusions — Left-Right (⿰)
    '人+木': { char: '休', sino: 'Hưu',  pinyin: 'xiū', meaning: 'Nghỉ ngơi, hưu trí', layout: 'LEFT_RIGHT', layoutName: 'Trái — Phải (⿰)' },
    '木+木': { char: '林', sino: 'Lâm',  pinyin: 'lín', meaning: 'Rừng thưa', layout: 'LEFT_RIGHT', layoutName: 'Trái — Phải (⿰)' },
    '林+木': { char: '森', sino: 'Sâm',  pinyin: 'sēn', meaning: 'Rừng rậm', layout: 'LEFT_RIGHT', layoutName: 'Trái — Phải (⿰)' },
    '日+月': { char: '明', sino: 'Minh', pinyin: 'míng',meaning: 'Sáng, rõ ràng, thông minh', layout: 'LEFT_RIGHT', layoutName: 'Trái — Phải (⿰)' },
    '人+人': { char: '从', sino: 'Tùng', pinyin: 'cóng',meaning: 'Theo sau, cùng đi', layout: 'LEFT_RIGHT', layoutName: 'Trái — Phải (⿰)' },
    '女+子': { char: '好', sino: 'Hảo',  pinyin: 'hǎo', meaning: 'Tốt, đẹp, thích', layout: 'LEFT_RIGHT', layoutName: 'Trái — Phải (⿰)' },
    '水+木': { char: '沐', sino: 'Mộc',  pinyin: 'mù',  meaning: 'Gội đầu, tắm gội', layout: 'LEFT_RIGHT', layoutName: 'Trái — Phải (⿰)' },
    '山+山': { char: '屾', sino: 'Sàn',  pinyin: 'shèn',meaning: 'Hai núi cạnh nhau', layout: 'LEFT_RIGHT', layoutName: 'Trái — Phải (⿰)' },
    '土+口': { char: '吐', sino: 'Thổ',  pinyin: 'tǔ',  meaning: 'Nôn mửa, thổ lộ', layout: 'LEFT_RIGHT', layoutName: 'Trái — Phải (⿰)' },

    // 2-component fusions — Top-Bottom (⿱)
    '火+火': { char: '炎', sino: 'Viêm', pinyin: 'yán', meaning: 'Nóng bỏng, bốc lửa', layout: 'TOP_BOTTOM', layoutName: 'Trên — Dưới (⿱)' },
    '口+口': { char: '吕', sino: 'Lữ',   pinyin: 'lǚ',  meaning: 'Họ Lữ, cung nhạc', layout: 'TOP_BOTTOM', layoutName: 'Trên — Dưới (⿱)' },
    '日+木': { char: '杲', sino: 'Cảo',  pinyin: 'gǎo', meaning: 'Mặt trời trên cây, sáng rực', layout: 'TOP_BOTTOM', layoutName: 'Trên — Dưới (⿱)' },
    '心+刀': { char: '忍', sino: 'Nhẫn', pinyin: 'rěn', meaning: 'Nhẫn nhịn, chịu đựng', layout: 'TOP_BOTTOM', layoutName: 'Trên — Dưới (⿱)' },
    '小+大': { char: '尖', sino: 'Tiêm', pinyin: 'jiān',meaning: 'Nhọn, sắc bén', layout: 'TOP_BOTTOM', layoutName: 'Trên — Dưới (⿱)' },
    '日+日': { char: '昌', sino: 'Xương',pinyin: 'chāng',meaning: 'Thịnh vượng, phát đạt', layout: 'TOP_BOTTOM', layoutName: 'Trên — Dưới (⿱)' },
    '田+力': { char: '男', sino: 'Nam',  pinyin: 'nán', meaning: 'Người nam, đàn ông', layout: 'TOP_BOTTOM', layoutName: 'Trên — Dưới (⿱)' },
    '宀+女': { char: '安', sino: 'An',   pinyin: 'ān',  meaning: 'Bình an, yên ổn', layout: 'TOP_BOTTOM', layoutName: 'Trên — Dưới (⿱)' },
    '宀+子': { char: '字', sino: 'Tự',   pinyin: 'zì',  meaning: 'Chữ viết', layout: 'TOP_BOTTOM', layoutName: 'Trên — Dưới (⿱)' },
    '手+目': { char: '看', sino: 'Khán', pinyin: 'kàn', meaning: 'Nhìn, xem', layout: 'TOP_BOTTOM', layoutName: 'Trên — Dưới (⿱)' },

    // Surround topologies (10 IDS patterns)
    '囗+玉': { char: '国', sino: 'Quốc', pinyin: 'guó', meaning: 'Đất nước, quốc gia', layout: 'SURROUND', layoutName: 'Bao bọc toàn phần (⿴)' },
    '囗+大': { char: '因', sino: 'Nhân', pinyin: 'yīn', meaning: 'Nguyên nhân, vì', layout: 'SURROUND', layoutName: 'Bao bọc toàn phần (⿴)' },
    '门+日': { char: '间', sino: 'Gian', pinyin: 'jiān',meaning: 'Khoảng giữa, gian phòng', layout: 'SURROUND_TOP', layoutName: 'Bao bọc trên & 2 bên (⿵)' },
    '广+木': { char: '床', sino: 'Sàng', pinyin: 'chuáng', meaning: 'Cái giường ngủ', layout: 'SURROUND_TOPLEFT', layoutName: 'Nửa bao góc trên-trái (⿸)' },
    '疒+丙': { char: '病', sino: 'Bệnh', pinyin: 'bìng',meaning: 'Bệnh tật, ốm đau', layout: 'SURROUND_TOPLEFT', layoutName: 'Nửa bao góc trên-trái (⿸)' },
    '走+干': { char: '赶', sino: 'Cản',  pinyin: 'gǎn', meaning: 'Đuổi theo, vội vã', layout: 'SURROUND_BOTTOMLEFT', layoutName: 'Nửa bao góc dưới-trái (⿺)' },
    '辶+斤': { char: '近', sino: 'Cận',  pinyin: 'jìn', meaning: 'Gần gũi, tiếp cận', layout: 'SURROUND_BOTTOMLEFT', layoutName: 'Nửa bao góc dưới-trái (⿺)' },
    '凵+凶': { char: '凶', sino: 'Hung', pinyin: 'xiōng',meaning: 'Hung dữ, điềm xấu', layout: 'SURROUND_BOTTOM', layoutName: 'Bao bọc dưới hở trên (⿶)' },
    '匚+斤': { char: '匠', sino: 'Tượng',pinyin: 'jiàng',meaning: 'Người thợ tài hoa', layout: 'SURROUND_LEFT', layoutName: 'Bao bọc bên trái (⿷)' },
    '勹+日': { char: '旬', sino: 'Tuần', pinyin: 'xún', meaning: 'Tuần lễ, 10 ngày', layout: 'SURROUND_TOPRIGHT', layoutName: 'Nửa bao góc trên-phải (⿹)' },

    // 3-component fusions (Kim tự tháp / 品字 & Ba phần)
    '木+木+木': { char: '森', sino: 'Sâm',  pinyin: 'sēn', meaning: 'Rừng rậm', layout: 'TRIANGLE_PYRAMID', layoutName: 'Kim tự tháp / Phẩm tự (品)' },
    '人+人+人': { char: '众', sino: 'Chúng', pinyin: 'zhòng',meaning: 'Đám đông, quần chúng', layout: 'TRIANGLE_PYRAMID', layoutName: 'Kim tự tháp / Phẩm tự (品)' },
    '口+口+口': { char: '品', sino: 'Phẩm', pinyin: 'pǐn', meaning: 'Phẩm chất, đánh giá', layout: 'TRIANGLE_PYRAMID', layoutName: 'Kim tự tháp / Phẩm tự (品)' },
    '日+日+日': { char: '晶', sino: 'Tinh', pinyin: 'jīng',meaning: 'Pha lê, sáng lấp lánh', layout: 'TRIANGLE_PYRAMID', layoutName: 'Kim tự tháp / Phẩm tự (品)' },
    '火+火+火': { char: '焱', sino: 'Diễm', pinyin: 'yàn', meaning: 'Lửa bốc cao, sáng rực', layout: 'TRIANGLE_PYRAMID', layoutName: 'Kim tự tháp / Phẩm tự (品)' },
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

  window.SpatialGeometry = SpatialGeometry;
  window.HanziForge = window.HanziForge || {};
  window.HanziForge.SpatialGeometry = SpatialGeometry;
  window.HanziForge.placeToken = placeToken;
  window.HanziForge.DEMO_RECIPES = DEMO_RECIPES;
  window.HanziForge.quickLoadRecipe = quickLoadRecipe;
  window.HanziForge.triggerParticleBurst = triggerParticleBurst;

  console.log('[HanziForge] builder.js loaded — 10-pattern SpatialGeometry & particle burst active');
})();
