// HanziForge — Minecraft-Style Free 2D Crafting Canvas & Recursive Compound Engine
//
// Supported Spatial Layouts (covering all Unicode IDS operators in dictionary.txt):
//  Binary (2 tokens):
//    ⿰ LEFT_RIGHT          — 休, 明, 好, 林, 语
//    ⿱ TOP_BOTTOM          — 安, 字, 古, 炎, 森
//    ⿴ SURROUND            — 国, 回, 园, 图  (outer: 囗)
//    ⿵ SURROUND_TOP        — 闪, 间, 问  (outer: 门)
//    ⿶ SURROUND_BOTTOM     — 凶, 画  (outer: 凵)
//    ⿷ SURROUND_LEFT       — 区, 匠  (outer: 匚)
//    ⿸ SURROUND_TOPLEFT    — 病, 床, 屋  (outer: 疒, 广)
//    ⿹ SURROUND_TOPRIGHT   — 包, 句, 氧  (outer: 勹, 气)
//    ⿺ SURROUND_BOTTOMLEFT — 这, 远, 道, 起  (outer: 辶, 走, 廴)
//    ⿻ OVERLAID            — 东, 干, 巫
//  Ternary (3 tokens):
//    ⿲ THREE_PART_H        — 湖, 树, 做  (left + mid + right)
//    ⿳ THREE_PART_V        — 鼻, 曼  (top + mid + bottom)
//    品字 TRIANGLE_PYRAMID   — 众, 森, 品, 晶, 焱, 磊, 淼, 犇, 垚

// ── Known Radical Sets for Spatial Layout Detection ──────────────────────────────
const SURROUND_BOTTOMLEFT_RADS = new Set(['辶','走','廴','之','辵','夂','夊','尢','乙','爪','瓜','支','弋','乚','更','尧','虎','犬']);
const SURROUND_TOPRIGHT_RADS   = new Set(['刀','勹','气','几','司','弋','戈','户','羽','鸟','烏','令','丩','哉','刁']);
const SURROUND_BOTTOM_RADS     = new Set(['凵','舁']);
const SURROUND_LEFT_RADS       = new Set(['匚','匸']);
const SURROUND_FULL_RADS       = new Set(['囗','口','行','衣']);
const SURROUND_TOP_RADS        = new Set(['门','冂','几','凡','門','鬥','齐','齊','尺','戊','乃','大']);
const SURROUND_TOPLEFT_RADS    = new Set(['疒','广','尸','户','戶','厂','虍','麻','鹿','辰','耂','尹','才','原','丰','羊']);

// Diacritic-insensitive string normalization for 4-in-1 smart search
function normalizeSearchText(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

class SpatialGeometry {
  static analyze(tokens) {
    if (!tokens || tokens.length < 2) {
      return { layout: null, confidence: 0, formula: '', roles: [] };
    }

    const recipesMap = window.CRAFTING_RECIPES_MAP || {};

    // ── 2-Component Analysis ──────────────────────────────────────────────────
    if (tokens.length === 2) {
      const [t1, t2] = tokens;
      const dx = t2.x - t1.x; // positive if t2 is to the right of t1
      const dy = t2.y - t1.y; // positive if t2 is below t1
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Step 1: Find all candidate recipes for {t1, t2}
      const candidates = [];
      const layouts = [
        'LEFT_RIGHT', 'TOP_BOTTOM', 'SURROUND', 'SURROUND_TOP',
        'SURROUND_TOPLEFT', 'SURROUND_BOTTOMLEFT', 'SURROUND_TOPRIGHT',
        'SURROUND_BOTTOM', 'SURROUND_LEFT', 'OVERLAID'
      ];

      for (const layout of layouts) {
        const k1 = `${layout}:${t1.radical}+${t2.radical}`;
        const k2 = `${layout}:${t2.radical}+${t1.radical}`;
        if (recipesMap[k1]) candidates.push({ match: recipesMap[k1], layout, first: t1, second: t2, key: k1 });
        if (recipesMap[k2]) candidates.push({ match: recipesMap[k2], layout, first: t2, second: t1, key: k2 });
      }

      // Step 2: Evaluate candidate recipes based on strict structure type
      for (const cand of candidates) {
        const { layout, first, second, match } = cand;
        const cDx = second.x - first.x; // > 0 if second is to the right of first
        const cDy = second.y - first.y; // > 0 if second is below first
        const cDist = Math.sqrt(cDx * cDx + cDy * cDy);

        // ── PHÂN NHÓM 1: Ghép thường (Trái — Phải, Trên — Dưới) ──
        if (layout === 'LEFT_RIGHT') {
          // Bắt buộc first nằm bên trái second theo phương ngang
          if (first.x < second.x - 4 && Math.abs(cDx) >= Math.abs(cDy) * 0.4) {
            return {
              layout: 'LEFT_RIGHT',
              matchedCandidate: match,
              roles: [{ token: first, position: 'LEFT' }, { token: second, position: 'RIGHT' }],
              formula: `${first.radical} [Trái] ❖ ${second.radical} [Phải]`,
              layoutName: 'Trái — Phải (⿰)'
            };
          }
        } else if (layout === 'TOP_BOTTOM') {
          // Bắt buộc first nằm ở TRÊN second theo phương dọc
          if (first.y < second.y - 4 && Math.abs(cDy) >= Math.abs(cDx) * 0.4) {
            return {
              layout: 'TOP_BOTTOM',
              matchedCandidate: match,
              roles: [{ token: first, position: 'TOP' }, { token: second, position: 'BOTTOM' }],
              formula: `${first.radical} [Trên] ❖ ${second.radical} [Dưới]`,
              layoutName: 'Trên — Dưới (⿱)'
            };
          }
        }

        // ── PHÂN NHÓM 2: Bao che 1 phần, Bao vây & Chồng lớp ──
        // Bắt buộc phải CHẠM/LỒNG NHAU (cDist <= 42%) VÀ ĐÚNG HƯỚNG GÓC BAO BỌC
        else if (cDist <= 42) {
          if (layout === 'SURROUND_BOTTOMLEFT') {
            // first là bộ bao ngoài góc dưới-trái (e.g. 辶, 廴, 走)
            if (first.x <= second.x + 8 && first.y >= second.y - 8) {
              return {
                layout: 'SURROUND_BOTTOMLEFT',
                matchedCandidate: match,
                roles: [{ token: first, position: 'BOTTOMLEFT' }, { token: second, position: 'INSIDE_TOPRIGHT' }],
                formula: `${first.radical} [Bao dưới-trái] ❖ ${second.radical} [Bên trong]`,
                layoutName: 'Nửa bao góc dưới-trái (⿺)'
              };
            }
          } else if (layout === 'SURROUND_TOPLEFT') {
            // first là bộ bao ngoài góc trên-trái (e.g. 广, 疒, 尸, 户)
            if (first.x <= second.x + 8 && first.y <= second.y + 8) {
              return {
                layout: 'SURROUND_TOPLEFT',
                matchedCandidate: match,
                roles: [{ token: first, position: 'TOPLEFT' }, { token: second, position: 'INSIDE_BOTTOMRIGHT' }],
                formula: `${first.radical} [Góc trên-trái] ❖ ${second.radical} [Bên trong]`,
                layoutName: 'Nửa bao góc trên-trái (⿸)'
              };
            }
          } else if (layout === 'SURROUND_TOPRIGHT') {
            // first là bộ bao ngoài góc trên-phải (e.g. 刀, 勹, 气)
            if (first.x >= second.x - 8 && first.y <= second.y + 8) {
              return {
                layout: 'SURROUND_TOPRIGHT',
                matchedCandidate: match,
                roles: [{ token: first, position: 'TOPRIGHT' }, { token: second, position: 'INSIDE_BOTTOMLEFT' }],
                formula: `${first.radical} [Bao trên-phải] ❖ ${second.radical} [Bên trong]`,
                layoutName: 'Nửa bao góc trên-phải (⿹)'
              };
            }
          } else if (layout === 'SURROUND_TOP') {
            // first là bộ bao trên (e.g. 门, 冂), bắt buộc first nằm TRÊN second và thẳng hàng ngang
            if (first.y <= second.y - 4 && Math.abs(cDx) <= 22) {
              return {
                layout: 'SURROUND_TOP',
                matchedCandidate: match,
                roles: [{ token: first, position: 'OUTSIDE' }, { token: second, position: 'INSIDE' }],
                formula: `${first.radical} [Bao trên] ❖ ${second.radical} [Bên trong]`,
                layoutName: 'Bao bọc trên & 2 bên (⿵)'
              };
            }
          } else if (layout === 'SURROUND_BOTTOM') {
            // first là bộ bao dưới (e.g. 凵), bắt buộc first nằm DƯỚI second và thẳng hàng ngang
            if (first.y >= second.y + 4 && Math.abs(cDx) <= 22) {
              return {
                layout: 'SURROUND_BOTTOM',
                matchedCandidate: match,
                roles: [{ token: first, position: 'BOTTOM' }, { token: second, position: 'INSIDE_TOP' }],
                formula: `${first.radical} [Bao dưới] ❖ ${second.radical} [Bên trong]`,
                layoutName: 'Bao bọc dưới hở trên (⿶)'
              };
            }
          } else if (layout === 'SURROUND_LEFT') {
            // first là bộ bao trái (e.g. 匚), bắt buộc first nằm BÊN TRÁI second và thẳng hàng dọc
            if (first.x <= second.x - 4 && Math.abs(cDy) <= 22) {
              return {
                layout: 'SURROUND_LEFT',
                matchedCandidate: match,
                roles: [{ token: first, position: 'LEFT_FRAME' }, { token: second, position: 'INSIDE_RIGHT' }],
                formula: `${first.radical} [Bao trái] ❖ ${second.radical} [Bên trong]`,
                layoutName: 'Bao bọc bên trái hở phải (⿷)'
              };
            }
          } else if (layout === 'SURROUND' || layout === 'OVERLAID') {
            if (cDist <= 38) {
              return {
                layout: layout,
                matchedCandidate: match,
                roles: [{ token: first, position: 'OUTSIDE' }, { token: second, position: 'INSIDE' }],
                formula: `${first.radical} ❖ ${second.radical}`,
                layoutName: layout === 'SURROUND' ? 'Bao bọc toàn phần (⿴)' : 'Giao nhau / Chồng lớp (⿻)'
              };
            }
          }
        }
      }

      // Check if any candidate was an OVERLAID candidate that just needs closer distance
      const overlaidCand = candidates.find(c => c.layout === 'OVERLAID');
      const hintOverlaid = overlaidCand ? overlaidCand.match : null;

      // Step 3: Pure Geometric Fallback when no candidate recipe matched the placement
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx >= absDy) {
        const leftToken = dx > 0 ? t1 : t2;
        const rightToken = dx > 0 ? t2 : t1;
        return {
          layout: 'LEFT_RIGHT',
          hintOverlaid: hintOverlaid,
          roles: [
            { token: leftToken, position: 'LEFT' },
            { token: rightToken, position: 'RIGHT' }
          ],
          formula: `${leftToken.radical} [Trái] ❖ ${rightToken.radical} [Phải]`,
          layoutName: 'Trái — Phải (⿰)'
        };
      } else {
        const topToken = dy > 0 ? t1 : t2;
        const bottomToken = dy > 0 ? t2 : t1;
        return {
          layout: 'TOP_BOTTOM',
          hintOverlaid: hintOverlaid,
          roles: [
            { token: topToken, position: 'TOP' },
            { token: bottomToken, position: 'BOTTOM' }
          ],
          formula: `${topToken.radical} [Trên] ❖ ${bottomToken.radical} [Dưới]`,
          layoutName: 'Trên — Dưới (⿱)'
        };
      }
    }

    // ── 3-Component Analysis ──────────────────────────────────────────────────
    if (tokens.length === 3) {
      const sortedByY = [...tokens].sort((a, b) => a.y - b.y);
      const topToken = sortedByY[0];
      const bottom1 = sortedByY[1];
      const bottom2 = sortedByY[2];
      const bl = bottom1.x < bottom2.x ? bottom1 : bottom2;
      const br = bottom1.x < bottom2.x ? bottom2 : bottom1;

      // 1. Check Triangle Pyramid Recipe (品, 众, 森, 晶, 焱, 磊, 淼, 犇, 垚...)
      const triKey = `TRIANGLE_PYRAMID:${topToken.radical}+${bl.radical}+${br.radical}`;
      if (recipesMap[triKey]) {
        return {
          layout: 'TRIANGLE_PYRAMID',
          matchedCandidate: recipesMap[triKey],
          roles: [
            { token: topToken, position: 'TOP' },
            { token: bl, position: 'BOTTOM_LEFT' },
            { token: br, position: 'BOTTOM_RIGHT' }
          ],
          formula: `${topToken.radical} [Đỉnh] ❖ ${bl.radical} [Dưới-Trái] ❖ ${br.radical} [Dưới-Phải]`,
          layoutName: 'Kim tự tháp / Phẩm tự (品)'
        };
      }

      // 2. Check Three-Part Horizontal Recipe (⿲ 湖, 树, 做...)
      const sortedX = [...tokens].sort((a, b) => a.x - b.x);
      const h3Key = `THREE_PART_H:${sortedX[0].radical}+${sortedX[1].radical}+${sortedX[2].radical}`;
      if (recipesMap[h3Key]) {
        return {
          layout: 'THREE_PART_H',
          matchedCandidate: recipesMap[h3Key],
          roles: [
            { token: sortedX[0], position: 'LEFT' },
            { token: sortedX[1], position: 'MIDDLE' },
            { token: sortedX[2], position: 'RIGHT' }
          ],
          formula: `${sortedX[0].radical} [Trái] ❖ ${sortedX[1].radical} [Giữa] ❖ ${sortedX[2].radical} [Phải]`,
          layoutName: 'Ba phần ngang (⿲)'
        };
      }

      // 3. Check Three-Part Vertical Recipe (⿳ 鼻, 曼...)
      const v3Key = `THREE_PART_V:${sortedByY[0].radical}+${sortedByY[1].radical}+${sortedByY[2].radical}`;
      if (recipesMap[v3Key]) {
        return {
          layout: 'THREE_PART_V',
          matchedCandidate: recipesMap[v3Key],
          roles: [
            { token: sortedByY[0], position: 'TOP' },
            { token: sortedByY[1], position: 'MIDDLE' },
            { token: sortedByY[2], position: 'BOTTOM' }
          ],
          formula: `${sortedByY[0].radical} [Trên] ❖ ${sortedByY[1].radical} [Giữa] ❖ ${sortedByY[2].radical} [Dưới]`,
          layoutName: 'Ba phần dọc (⿳)'
        };
      }

      // 4. Geometric fallback for 3 parts
      const xSpread = Math.max(...tokens.map(t => t.x)) - Math.min(...tokens.map(t => t.x));
      const ySpread = Math.max(...tokens.map(t => t.y)) - Math.min(...tokens.map(t => t.y));

      if (ySpread > xSpread) {
        return {
          layout: 'THREE_PART_V',
          roles: [
            { token: sortedByY[0], position: 'TOP' },
            { token: sortedByY[1], position: 'MIDDLE' },
            { token: sortedByY[2], position: 'BOTTOM' }
          ],
          formula: `${sortedByY[0].radical} [Trên] ❖ ${sortedByY[1].radical} [Giữa] ❖ ${sortedByY[2].radical} [Dưới]`,
          layoutName: 'Ba phần dọc (⿳)'
        };
      } else {
        return {
          layout: 'THREE_PART_H',
          roles: [
            { token: sortedX[0], position: 'LEFT' },
            { token: sortedX[1], position: 'MIDDLE' },
            { token: sortedX[2], position: 'RIGHT' }
          ],
          formula: `${sortedX[0].radical} [Trái] ❖ ${sortedX[1].radical} [Giữa] ❖ ${sortedX[2].radical} [Phải]`,
          layoutName: 'Ba phần ngang (⿲)'
        };
      }
    }

    return { layout: null, roles: [], formula: '' };
  }
}
window.SpatialGeometry = SpatialGeometry;

class HanziBuilder {
  constructor() {
    this.characters   = window.HANZI_DATA   || [];
    this.radicalsData = [...(window.RADICALS_DATA || [])];

    // State for placed tokens on canvas: [{ id, radical, name, pinyin, x, y, el }]
    this.canvasTokens = [];
    this.tokenIdCounter = 0;
    this.currentCraftedChar = null;
    this.lastNotifiedCraftId = null;
    this.sessionDiscoveries = [];
    this.draggedCanvasToken = null;

    // Stroke & Category Filter State
    this.currentStrokeFilter = 'all'; // 'all', '1-2', '3-4', '5-6', '7+', 'crafted'

    // Recipe Codex State
    this.codexActiveTab = 'all'; // 'all', 'unlocked', 'locked'
    this.codexSearchQuery = '';

    this.initDOM();
    this.bindEvents();
    this.initCodex();
    this.renderPalette();
  }

  // ── DOM References ──────────────────────────────────────────────────────────

  initDOM() {
    this.paletteSearch      = document.getElementById('spatial-palette-search');
    this.paletteGrid        = document.getElementById('spatial-radical-palette');
    this.paletteCount       = document.getElementById('palette-count-badge');
    this.filterTabsWrap     = document.getElementById('palette-filter-tabs');
    this.canvasBoard        = document.getElementById('tianzige-2d-board');
    this.tokensLayer        = document.getElementById('canvas-tokens-layer');
    this.ghostGuide         = document.getElementById('magnetic-ghost-guide');
    this.emptyPrompt        = document.getElementById('canvas-empty-prompt');
    this.statusText         = document.getElementById('spatial-detected-text');
    this.layoutTag          = document.getElementById('spatial-layout-tag');
    this.craftArrowWrap     = document.getElementById('crafting-arrow-wrap');
    this.outputSlot         = document.getElementById('crafting-output-slot');
    this.outputSlotInner    = document.getElementById('output-slot-inner');
    this.craftedDisplay     = document.getElementById('crafted-item-display');
    this.craftedGlyph       = document.getElementById('crafted-glyph');
    this.craftedPinyin      = document.getElementById('crafted-pinyin');
    this.claimBtn           = document.getElementById('btn-claim-crafted');
    this.detailResultBox    = document.getElementById('forge-detail-result');
    this.suggestionAlert    = document.getElementById('spatial-suggestion-alert');
    this.alertMsg           = document.getElementById('spatial-alert-msg');
    this.flipBtn            = document.getElementById('btn-flip-components');
    this.clearBtn           = document.getElementById('btn-clear-canvas');
    this.fuseBtn            = document.getElementById('btn-fuse-canvas');
    this.historyFeed        = document.getElementById('forge-history-feed');
    this.discoveryCount     = document.getElementById('forge-discovery-count');

    // Codex Modal DOM
    this.codexModal         = document.getElementById('recipe-codex-modal');
    this.btnOpenCodex       = document.getElementById('btn-open-codex');
    this.btnCloseCodex      = document.getElementById('btn-close-codex-modal');
    this.codexSearchInput   = document.getElementById('codex-search-input');
    this.codexGrid          = document.getElementById('codex-recipes-grid');
    this.codexStatTotal     = document.getElementById('codex-stat-total');
    this.codexStatUnlocked  = document.getElementById('codex-stat-unlocked');
    this.codexStatPercent   = document.getElementById('codex-stat-percent');
  }

  // ── Event Bindings ──────────────────────────────────────────────────────────

  bindEvents() {
    // 4-in-1 Smart Search (Hanzi, Pinyin, Sino-Vietnamese, Meaning)
    if (this.paletteSearch) {
      this.paletteSearch.addEventListener('input', () => {
        this.renderPalette(this.paletteSearch.value.trim());
      });
    }

    // Stroke Count Filter Tabs
    if (this.filterTabsWrap) {
      this.filterTabsWrap.querySelectorAll('.filter-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.filterTabsWrap.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentStrokeFilter = btn.dataset.filter || 'all';
          window.soundEngine.playTap();
          this.renderPalette(this.paletteSearch ? this.paletteSearch.value.trim() : '');
        });
      });
    }

    // Canvas Board Drag & Drop
    if (this.canvasBoard) {
      this.canvasBoard.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        this.handleCanvasDragOver(e);
      });

      this.canvasBoard.addEventListener('dragleave', (e) => {
        if (!this.canvasBoard.contains(e.relatedTarget)) {
          this.hideGhostGuide();
        }
      });

      this.canvasBoard.addEventListener('drop', (e) => {
        e.preventDefault();
        this.hideGhostGuide();
        this.handleCanvasDrop(e);
      });
    }

    // Global dragover & drop to detect dragging outside the canvas to discard
    document.addEventListener('dragover', (e) => {
      if (this.draggedCanvasToken) {
        e.preventDefault();
      }
    });

    document.addEventListener('drop', (e) => {
      if (this.draggedCanvasToken) {
        const rect = this.canvasBoard.getBoundingClientRect();
        const isInsideCanvas = (
          e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom
        );

        if (!isInsideCanvas) {
          const removedId = this.draggedCanvasToken.id;
          const removedRad = this.draggedCanvasToken.radical;
          this.removeToken(removedId);
          window.showToast(`Đã loại bỏ bộ [ ${removedRad} ] ra khỏi khung`, 'info');
        }
        this.draggedCanvasToken = null;
      }
    });

    // Clear Button
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clearCanvas());
    }

    // Flip Components Button
    if (this.flipBtn) {
      this.flipBtn.addEventListener('click', () => this.flipCanvasPositions());
    }

    // Crafting Arrow: Click = Fuse tokens into the new character on canvas!
    if (this.craftArrowWrap) {
      this.craftArrowWrap.addEventListener('click', () => {
        if (this.currentCraftedChar) {
          this.renderDetailResult(this.currentCraftedChar);
          this.claimCraftedCharacter();
        }
      });
    }

    // Output Slot: Click = Fuse & Harvest directly onto Canvas!
    if (this.outputSlot) {
      this.outputSlot.addEventListener('click', () => {
        if (this.currentCraftedChar) {
          this.renderDetailResult(this.currentCraftedChar);
          this.claimCraftedCharacter();
        }
      });

      // Output Slot: Right Click = Put crafted character directly onto Canvas!
      this.outputSlot.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentCraftedChar) {
          const ch = this.currentCraftedChar;
          this.clearCanvas();
          this.addTokenToCanvas(ch.character, ch.sino_vietnamese || ch.meaning, ch.pinyin, 50, 50);
          this.renderDetailResult(ch);
          window.soundEngine.playTap();
          window.showToast(`Đã đặt chữ「${ch.character}」lên khung ghép!`, 'success');
        }
      });
    }
  }

  // ── Render Palette (with 4-in-1 Smart Search & Stroke Filtering) ─────────────

  renderPalette(rawQuery = '') {
    if (!this.paletteGrid) return;

    const q = normalizeSearchText(rawQuery);
    const placedParts = this.canvasTokens.map(t => t.radical);
    // Pre-compute compatible set ONCE (O(1) lookup via Inverted Index):
    const compatible = (this.currentStrokeFilter === 'synergy' || placedParts.length > 0) && window.getCompatibleParts 
      ? window.getCompatibleParts(placedParts) 
      : new Set();

    // 1. Filter by Stroke / Category
    let list = this.radicalsData.filter(r => {
      // Synergy Tab Filter (Filter radicals that can combine with canvas tokens)
      if (this.currentStrokeFilter === 'synergy') {
        // Fallback: If canvas is empty, show all radicals
        if (placedParts.length === 0) return true;
        return compatible.has(r.character);
      }

      // Crafted Tab Filter
      if (this.currentStrokeFilter === 'crafted') {
        return r.is_crafted === true;
      }

      const sc = r.stroke_count || 1;
      if (this.currentStrokeFilter === '1-2') {
        if (sc > 2) return false;
      } else if (this.currentStrokeFilter === '3-4') {
        if (sc < 3 || sc > 4) return false;
      } else if (this.currentStrokeFilter === '5-6') {
        if (sc < 5 || sc > 6) return false;
      } else if (this.currentStrokeFilter === '7+') {
        if (sc < 7) return false;
      }

      return true;
    });

    // 2. 4-in-1 Smart Search: Hanzi, Pinyin (tone/no tone), Sino-Vietnamese, Meaning
    if (q) {
      list = list.filter(r => {
        const hz = r.character || '';
        const py = normalizeSearchText(r.pinyin || '');
        const sv = normalizeSearchText(r.name || '');
        const mn = normalizeSearchText(r.meaning || '');

        return hz.includes(q) || py.includes(q) || sv.includes(q) || mn.includes(q);
      });
    }

    // Sort: Pinned crafted ingredients first, then by stroke count
    list.sort((a, b) => {
      if (a.is_crafted && !b.is_crafted) return -1;
      if (!a.is_crafted && b.is_crafted) return 1;
      return (a.stroke_count || 1) - (b.stroke_count || 1);
    });

    if (this.paletteCount) {
      this.paletteCount.textContent = `${list.length} bộ`;
    }

    this.paletteGrid.innerHTML = '';

    if (list.length === 0) {
      if (this.currentStrokeFilter === 'synergy') {
        this.paletteGrid.innerHTML = `
          <div style="color:var(--text-dim);font-size:0.85rem;padding:2.5rem 1rem;grid-column:1/-1;text-align:center;line-height:1.6;">
            <div style="font-size:2.2rem;margin-bottom:0.6rem;">🔍</div>
            <b style="color:var(--text-primary);font-size:0.92rem;">Không còn bộ nào ghép được</b><br>
            <span style="color:var(--text-secondary);font-size:0.8rem;">Không tìm thấy thêm bộ thủ nào trong kho có thể kết hợp với các thẻ hiện tại trên khung.</span>
          </div>
        `;
        return;
      }

      this.paletteGrid.innerHTML = `
        <div style="color:var(--text-dim);font-size:0.82rem;padding:1.5rem 0.5rem;grid-column:1/-1;text-align:center;">
          Không tìm thấy bộ thủ phù hợp với bộ lọc.
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    const scriptMode = window.appState ? window.appState.getScriptMode() : 'simplified';

    list.forEach(r => {
      const pair = window.getTradSimpPair ? window.getTradSimpPair(r.character) : { simplified: r.character, traditional: r.character };
      const displayChar = scriptMode === 'traditional' ? pair.traditional : pair.simplified;
      const isSynergy = compatible.has(r.character) || compatible.has(displayChar);

      const chip = document.createElement('div');
      chip.className = `spatial-palette-chip ${r.is_crafted ? 'is-crafted-ingredient' : ''} ${isSynergy ? 'synergy-match' : ''}`;
      chip.draggable = true;
      chip.dataset.radical = displayChar;
      const strokesText = r.stroke_count ? ` (${r.stroke_count} nét)` : '';
      chip.title = `${r.name || displayChar} [${r.pinyin || ''}]${strokesText} — ${r.meaning || ''}\n• Bấm hoặc Kéo lên khung\n• Chuột phải để nhân bản`;

      chip.innerHTML = `
        <span class="chip-glyph">${displayChar}</span>
        <span class="chip-label">${r.name || displayChar}</span>
      `;

      // Drag start from palette
      chip.addEventListener('dragstart', (e) => {
        window.soundEngine.playTap();
        this.draggedCanvasToken = null;
        e.dataTransfer.setData('text/plain', JSON.stringify({
          source: 'palette',
          radical: displayChar,
          name: r.name || displayChar,
          pinyin: r.pinyin || '',
          meaning: r.meaning || '',
          stroke_count: r.stroke_count || 1
        }));
        chip.classList.add('dragging');
      });

      chip.addEventListener('dragend', () => {
        chip.classList.remove('dragging');
      });

      // Left click to quick-place
      chip.addEventListener('click', () => {
        this.quickPlaceFromPalette(r);
      });

      // Double-click to inspect radical stroke animation & details
      chip.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (window.openVocabModal) window.openVocabModal(r.character);
      });

      fragment.appendChild(chip);
    });

    this.paletteGrid.appendChild(fragment);
  }

  quickPlaceFromPalette(radObj) {
    if (this.canvasTokens.length >= 3) {
      window.showToast('Tối đa 3 bộ thủ trên khung!', 'warning');
      return;
    }

    window.soundEngine.playTap();

    let defaultX = 50;
    let defaultY = 50;

    if (this.canvasTokens.length === 0) {
      defaultX = 30; defaultY = 50;
    } else if (this.canvasTokens.length === 1) {
      defaultX = 70; defaultY = 50;
    } else if (this.canvasTokens.length === 2) {
      defaultX = 50; defaultY = 75;
    }

    this.addTokenToCanvas(radObj.character, radObj.name || radObj.character, radObj.pinyin || '', defaultX, defaultY);
  }

  // ── Canvas Drag & Drop Operations ───────────────────────────────────────────

  handleCanvasDragOver(e) {
    const rect = this.canvasBoard.getBoundingClientRect();
    const xPct = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));

    if (this.ghostGuide) {
      this.ghostGuide.style.display = 'block';
      this.ghostGuide.style.left = `${xPct}%`;
      this.ghostGuide.style.top = `${yPct}%`;
    }
  }

  hideGhostGuide() {
    if (this.ghostGuide) {
      this.ghostGuide.style.display = 'none';
    }
  }

  handleCanvasDrop(e) {
    const rect = this.canvasBoard.getBoundingClientRect();
    const xPct = Math.max(15, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(15, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      if (data.source === 'palette') {
        if (this.canvasTokens.length >= 3) {
          window.showToast('Tối đa 3 bộ thủ trên khung.', 'warning');
          return;
        }
        window.soundEngine.playTap();
        this.addTokenToCanvas(data.radical, data.name, data.pinyin, xPct, yPct);
      } else if (data.source === 'canvas_token') {
        const token = this.canvasTokens.find(t => t.id === data.id);
        if (token) {
          window.soundEngine.playTap();
          token.x = xPct;
          token.y = yPct;
          this.updateTokenElementPosition(token);
          this.onCanvasStateChanged();
        }
      }
    } catch (err) {
      console.warn("Drop parse error:", err);
    }
    this.draggedCanvasToken = null;
  }

  // ── Token Management on Canvas ──────────────────────────────────────────────

  addTokenToCanvas(radical, name, pinyin, x, y) {
    const tokenId = `token_${++this.tokenIdCounter}`;
    const tokenObj = { id: tokenId, radical, name, pinyin, x, y };

    this.canvasTokens.push(tokenObj);
    this.renderTokenElement(tokenObj);
    this.onCanvasStateChanged();
  }

  renderTokenElement(tokenObj) {
    if (!this.tokensLayer) return;

    const el = document.createElement('div');
    el.className = 'canvas-token';
    el.id = tokenObj.id;
    el.draggable = true;
    el.style.left = `${tokenObj.x}%`;
    el.style.top = `${tokenObj.y}%`;

    el.innerHTML = `
      <span class="token-glyph">${tokenObj.radical}</span>
      <span class="token-pinyin">${tokenObj.name || tokenObj.pinyin || ''}</span>
      <button class="token-remove-btn" title="Xóa bộ thủ này">×</button>
    `;

    // Remove token event
    el.querySelector('.token-remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeToken(tokenObj.id);
    });

    // Single Click: Inspect token details & pronounce
    el.addEventListener('click', (e) => {
      if (e.target.closest('.token-remove-btn')) return;
      window.soundEngine?.playTap();
      window.soundEngine?.speakChinese(tokenObj.radical);

      const db = window.CHARACTERS_DB || {};
      const p = window.getTradSimpPair ? window.getTradSimpPair(tokenObj.radical) : { simplified: tokenObj.radical, traditional: tokenObj.radical };
      const radData = (window.RADICALS_DATA || []).find(r => r.character === tokenObj.radical || r.character === p.simplified);
      const charObj = db[tokenObj.radical] || db[p.simplified] || radData || {
        character: tokenObj.radical,
        sino_vietnamese: tokenObj.name,
        pinyin: tokenObj.pinyin,
        meaning: tokenObj.name,
        components: []
      };

      this.renderDetailResult(charObj);
    });

    // Double Click: Open full dictionary & writing modal
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (window.openVocabModal) window.openVocabModal(tokenObj.radical);
    });

    // Right-Click: Clone / Duplicate token nearby!
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.canvasTokens.length >= 3) {
        window.showToast('Tối đa 3 bộ thủ trên khung!', 'warning');
        return;
      }

      window.soundEngine.playTap();
      // Place clone slightly offset
      let newX = tokenObj.x > 50 ? tokenObj.x - 18 : tokenObj.x + 18;
      let newY = tokenObj.y > 50 ? tokenObj.y - 14 : tokenObj.y + 14;

      this.addTokenToCanvas(tokenObj.radical, tokenObj.name, tokenObj.pinyin, newX, newY);
      window.showToast(`Đã sao chép bộ [ ${tokenObj.radical} ]`, 'info');
    });

    // Drag to reposition token OR drag outside to discard
    el.addEventListener('dragstart', (e) => {
      this.draggedCanvasToken = tokenObj;
      e.dataTransfer.setData('text/plain', JSON.stringify({
        source: 'canvas_token',
        id: tokenObj.id,
        radical: tokenObj.radical
      }));
      el.classList.add('moving');
    });

    el.addEventListener('dragend', (e) => {
      el.classList.remove('moving');
      const rect = this.canvasBoard.getBoundingClientRect();
      const isInside = (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom
      );
      if (!isInside && this.draggedCanvasToken) {
        this.removeToken(tokenObj.id);
        window.showToast(`Đã loại bỏ [ ${tokenObj.radical} ]`, 'info');
      }
      this.draggedCanvasToken = null;
    });

    tokenObj.el = el;
    this.tokensLayer.appendChild(el);
  }

  updateTokenElementPosition(tokenObj) {
    if (tokenObj.el) {
      tokenObj.el.style.left = `${tokenObj.x}%`;
      tokenObj.el.style.top = `${tokenObj.y}%`;
    }
  }

  removeToken(tokenId) {
    window.soundEngine.playTap();
    const idx = this.canvasTokens.findIndex(t => t.id === tokenId);
    if (idx !== -1) {
      const token = this.canvasTokens[idx];
      if (token.el) {
        token.el.classList.add('puff-out');
        setTimeout(() => token.el.remove(), 180);
      }
      this.canvasTokens.splice(idx, 1);
    }
    this.onCanvasStateChanged();
  }

  clearCanvas() {
    window.soundEngine.playTap();
    this.canvasTokens.forEach(t => { if (t.el) t.el.remove(); });
    this.canvasTokens = [];
    this.currentCraftedChar = null;
    this.lastNotifiedCraftId = null;
    this.updateOutputSlot(null);
    if (this.suggestionAlert) this.suggestionAlert.style.display = 'none';
    this.onCanvasStateChanged();
    this.resetDetailResultBox();
  }

  // ── Spatial Evaluation & Live Minecraft Crafting ───────────────────────────

  onCanvasStateChanged() {
    if (this.suggestionAlert) this.suggestionAlert.style.display = 'none';

    // Toggle empty prompt
    if (this.emptyPrompt) {
      this.emptyPrompt.style.display = this.canvasTokens.length === 0 ? 'flex' : 'none';
    }

    if (this.canvasTokens.length === 0) {
      if (this.statusText) this.statusText.textContent = 'Kéo 2 hoặc 3 thành phần vào khung Tianzige';
      if (this.layoutTag) this.layoutTag.style.display = 'none';
      this.updateOutputSlot(null);
      this.lastNotifiedCraftId = null;
      this.updateSynergyHighlight([]); // Clear highlights
      return;
    }

    if (this.canvasTokens.length === 1) {
      const t = this.canvasTokens[0];
      const placedParts = [t.radical];
      const compatible = window.getCompatibleParts ? window.getCompatibleParts(placedParts) : new Set();
      if (this.statusText) {
        this.statusText.innerHTML = `Đã đặt bộ <b style="color:var(--gold-primary);">[ ${t.radical} ]</b>. Có <b>${compatible.size}</b> bộ có thể kết hợp (Chuột phải để nhân bản)`;
      }
      if (this.layoutTag) this.layoutTag.style.display = 'none';
      this.updateOutputSlot(null);
      this.lastNotifiedCraftId = null;
      this.updateSynergyHighlight(placedParts); // Highlight compatible partners
      return;
    }

    // Analyze spatial geometry
    const analysis = SpatialGeometry.analyze(this.canvasTokens);

    if (this.statusText) {
      this.statusText.textContent = `⚡ Nhận diện: ${analysis.formula}`;
    }

    if (this.layoutTag && analysis.layoutName) {
      this.layoutTag.style.display = 'inline-block';
      this.layoutTag.textContent = analysis.layoutName;
    }

    // Live Recipe Matching
    const matchedChar = this.findMatchingCharacter(analysis);

    if (matchedChar) {
      // Direct Match! Show in Minecraft output slot immediately & Auto-claim to Inventory!
      this.onCraftingMatched(matchedChar, analysis);
      this.updateSynergyHighlight([]); // Match found — no more hints needed
      return;
    }

    // Check Reverse/Flipped Placement
    const reversedChar = this.findReversedCharacter();
    if (reversedChar) {
      this.onCraftingReversed(reversedChar);
      this.updateOutputSlot(null);
      this.lastNotifiedCraftId = null;
      this.updateSynergyHighlight([]); // Clear on reverse hint
      return;
    }

    // No Match yet — still show synergy for current placed parts
    const placedParts = this.canvasTokens.map(t => t.radical);
    this.updateSynergyHighlight(placedParts);

    // Smart Live Hint for Near-Complete Recipes (e.g. 2 of 3 tokens placed, like 川 = 丿+丨+丨)
    const hints = window.getNearCompleteHints ? window.getNearCompleteHints(placedParts) : [];
    if (hints && hints.length > 0) {
      const h = hints[0];
      if (this.statusText) {
        this.statusText.innerHTML = `💡 <span style="color:var(--gold-primary);font-weight:600;">Gợi ý:</span> Thêm 1 bộ <b style="color:var(--gold-primary);background:rgba(245,158,11,0.15);padding:1px 6px;border-radius:4px;border:1px solid var(--gold-glow);">[ ${h.missingPart} ]</b> nữa để ghép thành chữ「<b style="color:#fff;">${h.targetChar}</b> ${h.targetName}」(${h.layoutName || ''})!`;
      }
    } else if (analysis && analysis.hintOverlaid) {
      if (this.statusText) {
        this.statusText.innerHTML = `💡 <span style="color:var(--gold-primary);font-weight:600;">Gợi ý:</span> Kéo 2 thẻ đè chồng lên nhau để ghép chữ「<b style="color:#fff;">${analysis.hintOverlaid.character}</b>」!`;
      }
    }

    // No Match
    this.updateOutputSlot(null);
    this.lastNotifiedCraftId = null;
    this.resetTokenStyles();
  }

  // ── Smart Synergy Highlight ───────────────────────────────────────────────
  // Glows compatible palette chips when tokens are on the canvas.
  updateSynergyHighlight(placedParts) {
    const compatible = window.getCompatibleParts ? window.getCompatibleParts(placedParts) : new Set();

    // Update synergy tab badge if present
    const synergyTabBtn = document.getElementById('tab-synergy-filter');
    if (synergyTabBtn) {
      if (placedParts.length > 0 && compatible.size > 0) {
        synergyTabBtn.innerHTML = `✨ Ghép được <span class="synergy-count-badge">${compatible.size}</span>`;
      } else {
        synergyTabBtn.innerHTML = `✨ Ghép được`;
      }
    }

    // If currently on synergy tab, dynamically re-render the palette to reflect current canvas state
    if (this.currentStrokeFilter === 'synergy') {
      this.renderPalette(this.paletteSearch ? this.paletteSearch.value.trim() : '');
      return;
    }

    const chips = this.paletteGrid ? this.paletteGrid.querySelectorAll('.spatial-palette-chip') : [];
    if (placedParts.length === 0) {
      chips.forEach(chip => chip.classList.remove('synergy-match'));
      return;
    }

    chips.forEach(chip => {
      const char = chip.dataset.radical;
      if (compatible.has(char)) {
        chip.classList.add('synergy-match');
      } else {
        chip.classList.remove('synergy-match');
      }
    });
  }


  findMatchingCharacter(analysis) {
    if (!analysis || !analysis.layout || !analysis.roles || analysis.roles.length === 0) return null;

    // 0. Direct Match from Recipe-Aware Analyzer
    if (analysis.matchedCandidate) {
      const match = analysis.matchedCandidate;
      const charInfo = (window.CHARACTERS_DB && window.CHARACTERS_DB[match.character]) || {};
      const parts = analysis.roles.map(r => r.token.radical);

      return {
        id: `char_${match.character}`,
        character: match.character,
        pinyin: match.pinyin || charInfo.pinyin || '',
        meaning: match.meaning || charInfo.meaning || '',
        sino_vietnamese: charInfo.sino_vietnamese || match.sino_vietnamese || '',
        hsk_level: charInfo.hsk || 1,
        layout: match.layout,
        layout_name: match.layout_name,
        mnemonic: match.mnemonic || charInfo.mnemonic || `Chữ「${match.character}」tạo bởi [ ${parts.join(' + ')} ]`,
        components: analysis.roles.map(r => ({
          radical: r.token.radical,
          name: r.token.name || r.token.radical,
          pinyin: r.token.pinyin || '',
          meaning: r.token.name || '',
          position: r.position
        }))
      };
    }

    // 1. Try O(1) Spatial Recipe Hash Map (Over 8,660+ Unicode IDS recipes)
    const recipesMap = window.CRAFTING_RECIPES_MAP;
    const parts = analysis.roles.map(r => r.token.radical);
    const hashKey = `${analysis.layout}:${parts.join('+')}`;

    if (recipesMap && recipesMap[hashKey]) {
      const match = recipesMap[hashKey];
      const charInfo = (window.CHARACTERS_DB && window.CHARACTERS_DB[match.character]) || {};

      return {
        id: `char_${match.character}`,
        character: match.character,
        pinyin: match.pinyin || charInfo.pinyin || '',
        meaning: match.meaning || charInfo.meaning || '',
        sino_vietnamese: charInfo.sino_vietnamese || '',
        hsk_level: charInfo.hsk || 1,
        layout: match.layout,
        layout_name: match.layout_name,
        mnemonic: match.mnemonic || charInfo.mnemonic || `Chữ「${match.character}」tạo bởi [ ${parts.join(' + ')} ]`,
        components: analysis.roles.map(r => ({
          radical: r.token.radical,
          name: r.token.name || r.token.radical,
          pinyin: r.token.pinyin || '',
          meaning: r.token.name || '',
          position: r.position
        }))
      };
    }

    // 2. Fallback to Curated HANZI_DATA list
    return this.characters.find(ch => {
      if (ch.layout !== analysis.layout) return false;
      if (ch.components.length !== analysis.roles.length) return false;

      return analysis.roles.every(role => {
        return ch.components.some(c =>
          c.position === role.position &&
          c.radical.normalize() === role.token.radical.normalize()
        );
      });
    });
  }

  findReversedCharacter() {
    if (this.canvasTokens.length !== 2) return null;
    const [t1, t2] = this.canvasTokens;
    const recipesMap = window.CRAFTING_RECIPES_MAP;

    if (recipesMap) {
      const possibleLayouts = [
        'LEFT_RIGHT', 'TOP_BOTTOM', 'SURROUND', 'SURROUND_TOP',
        'SURROUND_TOPLEFT', 'SURROUND_BOTTOMLEFT', 'SURROUND_TOPRIGHT',
        'SURROUND_BOTTOM', 'SURROUND_LEFT'
      ];

      for (const layout of possibleLayouts) {
        const revKey1 = `${layout}:${t2.radical}+${t1.radical}`;
        const revKey2 = `${layout}:${t1.radical}+${t2.radical}`;

        if (recipesMap[revKey1]) {
          const match = recipesMap[revKey1];
          return {
            character: match.character,
            meaning: match.meaning,
            layout: match.layout,
            components: [
              { radical: t2.radical, position: 'FIRST' },
              { radical: t1.radical, position: 'SECOND' }
            ]
          };
        }
        if (recipesMap[revKey2]) {
          const match = recipesMap[revKey2];
          return {
            character: match.character,
            meaning: match.meaning,
            layout: match.layout,
            components: [
              { radical: t1.radical, position: 'FIRST' },
              { radical: t2.radical, position: 'SECOND' }
            ]
          };
        }
      }
    }

    const rads = this.canvasTokens.map(t => t.radical);
    return this.characters.find(ch => {
      if (ch.components.length !== 2) return false;
      const compRads = ch.components.map(c => c.radical);
      return rads.every(r => compRads.some(cr => cr.normalize() === r.normalize()));
    });
  }

  onCraftingMatched(charObj, analysis) {
    this.currentCraftedChar = charObj;

    // 1. Magnetic snap components into clean distinct positions (NO full overlap!)
    this.magneticSnapTokens(charObj, analysis);

    // 2. Light up Minecraft Crafting Arrow & Output Slot
    this.updateOutputSlot(charObj);

    // 3. Render Details
    this.renderDetailResult(charObj);

    // 4. Auto-claim into Inventory immediately (no extra manual click required!)
    this.autoClaimToInventory(charObj);

    // 5. Toast notification & Pronounce (deduplicated)
    if (this.lastNotifiedCraftId !== charObj.id) {
      this.lastNotifiedCraftId = charObj.id;
      window.soundEngine.playSuccess();
      window.soundEngine.speakChinese(charObj.character);
      window.showToast(`✨ Chế tác thành công chữ「${charObj.character}」! (Đã tự thu nạp vào Kho)`, 'success');
    }
  }

  autoClaimToInventory(ch) {
    // Record in session discoveries & game state
    this.recordDiscovery(ch);

    // Auto-add newly crafted character to inventory as a composite component!
    const alreadyInPalette = this.radicalsData.some(r => r.character === ch.character);
    if (!alreadyInPalette) {
      this.radicalsData.unshift({
        character: ch.character,
        name: ch.sino_vietnamese || ch.meaning,
        pinyin: ch.pinyin,
        meaning: ch.meaning,
        category: "Chữ đã chế tác",
        stroke_count: ch.stroke_count || 6,
        is_crafted: true
      });

      this.renderPalette(this.paletteSearch ? this.paletteSearch.value.trim() : '');
    }
  }

  updateOutputSlot(charObj) {
    if (!this.outputSlot || !this.craftedDisplay || !this.outputSlotInner) return;

    if (charObj) {
      this.outputSlot.classList.add('has-result');
      if (this.craftArrowWrap) this.craftArrowWrap.classList.add('active');
      this.outputSlotInner.style.display = 'none';
      this.craftedDisplay.style.display = 'flex';
      this.craftedGlyph.textContent = charObj.character;
      this.craftedPinyin.textContent = charObj.pinyin;
    } else {
      this.outputSlot.classList.remove('has-result');
      if (this.craftArrowWrap) this.craftArrowWrap.classList.remove('active');
      this.outputSlotInner.style.display = 'flex';
      this.craftedDisplay.style.display = 'none';
    }
  }

  // ── Visual Crafting Feedback (Maintains 100% Free Movement Without Snapping) ──

  magneticSnapTokens(charObj, analysis) {
    this.resetTokenStyles();

    // Preserve 100% user dragged positions without any snapping
    this.canvasTokens.forEach(t => {
      if (t.el) {
        t.el.classList.add('token-bonding-glow');
      }
    });

    if (this.canvasTokens.length === 2 && analysis && analysis.roles) {
      const [t1, t2] = this.canvasTokens;
      if (charObj.layout === 'SURROUND') {
        const outer = analysis.roles.find(r => r.position === 'OUTSIDE')?.token || t1;
        const inner = analysis.roles.find(r => r.position === 'INSIDE')?.token || t2;
        if (outer && outer.el) outer.el.classList.add('token-enclosure-outer');
        if (inner && inner.el) inner.el.classList.add('token-enclosure-inner');
      } else if (charObj.layout === 'SURROUND_TOP') {
        const outer = analysis.roles.find(r => r.position === 'OUTSIDE')?.token || t1;
        const inner = analysis.roles.find(r => r.position === 'INSIDE')?.token || t2;
        if (outer && outer.el) outer.el.classList.add('token-door-frame');
        if (inner && inner.el) inner.el.classList.add('token-door-cavity-inner');
      }
    }
  }

  resetTokenStyles() {
    this.canvasTokens.forEach(t => {
      if (t.el) {
        t.el.classList.remove(
          'token-enclosure-outer',
          'token-enclosure-inner',
          'token-door-frame',
          'token-door-cavity-inner',
          'token-three-part',
          'token-pyramid-item'
        );
      }
    });
  }

  // ── Fusion Animation & Recursive Crafting ───────────────────────────────────

  claimCraftedCharacter() {
    if (!this.currentCraftedChar) return;
    const ch = this.currentCraftedChar;
    window.soundEngine.playSuccess();

    // Play Fusion Morph Animation on Crafting Board & Spawn the newly crafted character token
    this.playFusionMorphAnimation(ch, () => {
      this.clearCanvas();
      this.addTokenToCanvas(
        ch.character,
        ch.sino_vietnamese || ch.meaning,
        ch.pinyin,
        50,
        50
      );
      window.soundEngine.speakChinese(ch.character);
      window.showToast(`✨ Đã hợp nhất thành công chữ「${ch.character}」trên khung!`, 'success');
    });
  }

  playFusionMorphAnimation(ch, onComplete) {
    if (this.canvasTokens.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    // Animate all tokens sliding into the center (50%, 50%) and collapsing
    this.canvasTokens.forEach(t => {
      t.x = 50; t.y = 50;
      this.updateTokenElementPosition(t);
      if (t.el) t.el.classList.add('fusing-collapse');
    });

    // Create a golden fusion burst element in the center
    const burst = document.createElement('div');
    burst.className = 'fusion-center-burst';
    burst.innerHTML = `<span class="fused-glyph-pop">${ch.character}</span>`;
    this.tokensLayer.appendChild(burst);

    setTimeout(() => {
      burst.remove();
      if (onComplete) onComplete();
    }, 600);
  }

  onCraftingReversed(reversedChar) {
    this.lastReversedChar = reversedChar;
    if (this.suggestionAlert && this.alertMsg) {
      const currentRads = this.canvasTokens.map(t => `<b style="color:var(--gold-light); font-size:1.05rem; font-family:var(--font-hanzi);">${t.radical}</b>`).join(' và ');
      const cleanMeaning = (reversedChar.meaning || '').replace(/\(dạng kết hợp\)\s*/g, '').replace(/^\((.+)\)$/, '$1').trim();

      this.alertMsg.innerHTML = `
        <div style="font-size:0.84rem; color:var(--gold-light); font-weight:600; margin-bottom:2px;">
          ⚠️ Đang đặt ngược vị trí của [ ${currentRads} ]
        </div>
        <div style="font-size:0.8rem; color:var(--text-dim); line-height:1.3;">
          Tổ hợp đúng: <span style="font-family:var(--font-hanzi); font-size:1.15rem; color:#fff; font-weight:800;">${reversedChar.character}</span> 
          ${reversedChar.sino_vietnamese ? `[<b style="color:#ffffff;">${reversedChar.sino_vietnamese}</b>]` : ''} 
          ${cleanMeaning ? `— <i>${cleanMeaning}</i>` : ''}
        </div>
      `;
      this.suggestionAlert.style.display = 'flex';
    }
  }

  flipCanvasPositions() {
    window.soundEngine.playTap();
    if (this.canvasTokens.length === 2 && this.lastReversedChar) {
      const targetChar = this.lastReversedChar;
      const [t1, t2] = this.canvasTokens;

      const comp1 = targetChar.components[0];
      const comp2 = targetChar.components[1];

      const tokenForComp1 = this.canvasTokens.find(t => t.radical.normalize() === comp1.radical.normalize());
      const tokenForComp2 = this.canvasTokens.find(t => t.id !== tokenForComp1?.id);

      if (tokenForComp1 && tokenForComp2) {
        if (targetChar.layout === 'LEFT_RIGHT') {
          tokenForComp1.x = 28; tokenForComp1.y = 50;
          tokenForComp2.x = 72; tokenForComp2.y = 50;
        } else if (targetChar.layout === 'TOP_BOTTOM') {
          tokenForComp1.x = 50; tokenForComp1.y = 28;
          tokenForComp2.x = 50; tokenForComp2.y = 72;
        } else if (targetChar.layout === 'SURROUND' || targetChar.layout === 'SURROUND_TOP') {
          tokenForComp1.x = 50; tokenForComp1.y = 44;
          tokenForComp2.x = 50; tokenForComp2.y = 58;
        } else if (targetChar.layout === 'SURROUND_TOPLEFT') {
          tokenForComp1.x = 38; tokenForComp1.y = 38;
          tokenForComp2.x = 60; tokenForComp2.y = 60;
        } else if (targetChar.layout === 'SURROUND_BOTTOMLEFT') {
          tokenForComp1.x = 34; tokenForComp1.y = 62;
          tokenForComp2.x = 62; tokenForComp2.y = 36;
        } else if (targetChar.layout === 'SURROUND_TOPRIGHT') {
          tokenForComp1.x = 64; tokenForComp1.y = 36;
          tokenForComp2.x = 38; tokenForComp2.y = 62;
        } else if (targetChar.layout === 'OVERLAID') {
          tokenForComp1.x = 50; tokenForComp1.y = 50;
          tokenForComp2.x = 50; tokenForComp2.y = 50;
        }
        this.updateTokenElementPosition(tokenForComp1);
        this.updateTokenElementPosition(tokenForComp2);
      } else {
        const tempX = t1.x; const tempY = t1.y;
        t1.x = t2.x; t1.y = t2.y;
        t2.x = tempX; t2.y = tempY;
        this.updateTokenElementPosition(t1);
        this.updateTokenElementPosition(t2);
      }

      if (this.suggestionAlert) this.suggestionAlert.style.display = 'none';
      this.onCanvasStateChanged();
    }
  }

  // ── Result Details & Feed ───────────────────────────────────────────────────

  renderDetailResult(ch) {
    if (!this.detailResultBox) {
      this.detailResultBox = document.getElementById('forge-detail-result');
    }
    if (!this.detailResultBox || !ch) return;

    try {
      const db = window.CHARACTERS_DB || {};
      const pair = window.getTradSimpPair ? window.getTradSimpPair(ch.character) : { simplified: ch.character, traditional: ch.character, isDifferent: false };
      const charData = db[ch.character] || db[pair.simplified] || db[pair.traditional] || ch;
      const compounds = charData.compounds || ch.compounds || [];
      const scriptMode = window.appState ? window.appState.getScriptMode() : 'simplified';
      const displayChar = scriptMode === 'traditional' ? pair.traditional : pair.simplified;
      const rawSino = ch.sino_vietnamese || charData.sino_vietnamese || '';
      const hasValidSino = window.isValidSinoVietnamese ? window.isValidSinoVietnamese(rawSino, displayChar) : (rawSino && rawSino !== displayChar && !/[^\u0000-\u007F\u00C0-\u1EF9\s]/.test(rawSino));
      const sino = hasValidSino ? rawSino : '';

      // 1. Accurate HSK Level Info
      const hskInfo = window.getHskInfo ? window.getHskInfo(displayChar) : { levelText: 'Hán Tự', badgeClass: 'hsk-ancient' };

      // 2. Authoritative or Smart 2-Tier Etymology Story
      const mnemonicText = window.getEtymologyStory
        ? window.getEtymologyStory(ch, ch.components, charData)
        : (ch.mnemonic || `Chữ「${displayChar}」tạo bởi các bộ phận cấu thành.`);

      const variantBadge = pair.isDifferent
        ? `<span class="detail-variant-pill" style="background:rgba(255,255,255,0.06);border:1px solid var(--border-color);color:var(--text-dim);padding:0.2rem 0.6rem;border-radius:var(--radius-full);font-size:0.78rem;">${scriptMode === 'traditional' ? `Giản thể: <b style="color:#fff;">${pair.simplified}</b>` : `Phồn thể: <b style="color:#fff;">${pair.traditional}</b>`}</span>`
        : '';

      // 3. Deduplicate & Clean Stacked 2-Tier Compound Cards
      const seenWords = new Set();
      const cleanCompounds = [];
      (compounds || []).forEach(cp => {
        if (!cp || !cp.word) return;
        const dispWord = scriptMode === 'traditional' && window.toTraditional
          ? window.toTraditional(cp.word)
          : (window.toSimplified ? window.toSimplified(cp.word) : cp.word);
        if (seenWords.has(dispWord)) return;
        seenWords.add(dispWord);

        let m = (cp.meaning || '').trim();
        m = m.replace(/biến thể của\s+([^\|\[]+)[^;]*/gi, 'dạng biến thể ngữ âm của $1');
        m = m.replace(/variant of\s+([^\|\[]+)[^;]*/gi, 'dạng biến thể của $1');
        m = m.replace(/\[[a-z0-9\s]+\]/gi, '');
        m = m.replace(/\|[^\s]+/gi, '');
        m = m.trim();

        cleanCompounds.push({
          word: dispWord,
          pinyin: cp.pinyin,
          meaning: m || 'Từ ghép Hán tự'
        });
      });

      const compoundsHtml = (cleanCompounds && cleanCompounds.length > 0) ? `
        <div style="margin-top:0.9rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.07);">
          <div style="font-size:0.76rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.5rem;display:flex;align-items:center;justify-content:space-between;">
            <span>📚 Từ ghép đàm thoại thông dụng (Bấm để nghe):</span>
            <span style="font-size:0.72rem;color:var(--gold-primary);">${cleanCompounds.length} cụm từ</span>
          </div>
          <div class="forge-compounds-grid">
            ${cleanCompounds.slice(0, 4).map(cp => {
              const dispPy = window.convertNumberedPinyinToAccents ? window.convertNumberedPinyinToAccents(cp.pinyin) : cp.pinyin;
              return `
                <div class="forge-compound-card" data-word="${cp.word}" title="Bấm để nghe phát âm「${cp.word}」">
                  <div class="fcc-top-row">
                    <span class="fcc-hanzi">${cp.word}</span>
                    <span class="fcc-pinyin">[${dispPy}]</span>
                  </div>
                  <div class="fcc-meaning">${cp.meaning}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : '';

      const cleanMeaning = (ch.meaning || charData.meaning || 'Đang cập nhật').replace(/\(dạng kết hợp\)\s*/g, '').replace(/^\((.+)\)$/, '$1').trim();

      this.detailResultBox.innerHTML = `
        <div class="forge-success-detail">
          <div class="detail-top-row">
            <div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">
              <span class="detail-hsk-badge ${hskInfo.badgeClass}">${hskInfo.levelText}</span>
              ${sino ? `<span class="detail-sv-badge" style="background:rgba(245,158,11,0.18);color:var(--gold-light);border:1px solid rgba(245,158,11,0.4);padding:0.25rem 0.75rem;border-radius:var(--radius-full);font-size:0.85rem;font-weight:700;">Hán Việt: ${sino.toUpperCase()}</span>` : ''}
              ${variantBadge}
              <span class="detail-layout-tag">${ch.layout_name || ch.layout || 'Hội ý'}</span>
            </div>
            <div style="display:flex;gap:0.4rem;">
              <button class="btn btn-gold btn-sm" id="btn-detail-vocab" title="Mở từ điển chi tiết, từ ghép & hoạt họa tập viết">
                🔍 Tra cứu & Tập viết
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-detail-speak" title="Nghe phát âm người thật">
                🔊 ${ch.pinyin || charData.pinyin || 'Phát âm'}
              </button>
            </div>
          </div>

          <div style="margin: 0.6rem 0; padding: 0.55rem 0.85rem; background: rgba(255,255,255,0.04); border-radius: var(--radius-md); font-size: 0.95rem;">
            <b style="color: var(--jade-glow);">📖 Giải nghĩa:</b> <span style="color: var(--text-primary); font-weight: 500;">${cleanMeaning}</span>
          </div>

          <div class="mnemonic-reveal-card">
            <div class="mnemonic-title">💡 Câu chuyện văn tự & Tự nguyên:</div>
            <p class="mnemonic-body">${mnemonicText}</p>
          </div>

          ${ch.components && ch.components.length > 0 ? `
            <div class="components-breakdown-row" style="margin-top: 0.65rem;">
              ${ch.components.map(c => {
                const posName = (window.POSITION_VIETNAMESE && window.POSITION_VIETNAMESE[c.position]) || c.position || '';
                return `
                  <div class="comp-tag-card" style="cursor:pointer;" title="Bấm để phát âm và tra cứu bộ ${c.radical}" data-rad="${c.radical}">
                    <span class="ctc-glyph">${c.radical}</span>
                    <div class="ctc-text">
                      <b>Bộ ${c.name} (${c.pinyin || ''})</b>
                      <small>${posName ? `${posName}` : (c.meaning || c.radical)}</small>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}

          ${compoundsHtml}

          ${(() => {
            const tatoebaList = window.getSentencesForCharacter ? window.getSentencesForCharacter(displayChar) : [];
            const sentences = (tatoebaList && tatoebaList.length > 0)
              ? tatoebaList
              : (ch.example_sentence ? [{ zh: ch.example_sentence, vi: ch.example_translation || '???' }] : []);
            if (sentences.length === 0) return '';
            return `
              <div style="margin-top:0.9rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.07);">
                <div style="font-size:0.76rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.5rem;display:flex;align-items:center;justify-content:space-between;">
                  <span>💬 Câu ví dụ đàm thoại thực tế (Bấm câu để nghe):</span>
                  <span style="font-size:0.72rem;color:var(--jade-glow);font-weight:600;">${sentences.length} câu ví dụ</span>
                </div>
                <div class="forge-sentences-scroll" style="display:flex;flex-direction:column;gap:0.45rem;max-height:165px;overflow-y:auto;overscroll-behavior:contain;contain:content;-webkit-overflow-scrolling:touch;padding-right:4px;">
                  ${sentences.map((s, idx) => {
                    const hasVi = s.vi && s.vi !== '???';
                    return `
                      <div class="forge-sentence-card" data-sentence="${s.zh}" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:var(--radius-sm);padding:0.5rem 0.75rem;cursor:pointer;transition:all 0.15s ease;" title="Bấm để nghe phát âm câu này">
                        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:0.5rem;">
                          <span style="font-family:var(--font-hanzi);font-size:0.98rem;color:#fff;font-weight:600;line-height:1.4;">${idx + 1}. ${s.zh}</span>
                          <span style="font-size:0.72rem;color:var(--text-dim);flex-shrink:0;">🔊</span>
                        </div>
                        <div style="font-size:0.82rem;color:${hasVi ? '#cbd5e1' : 'var(--text-dim)'};margin-top:0.2rem;line-height:1.35;${hasVi ? '' : 'font-style:italic;'}">
                          ${hasVi ? s.vi : 'Dịch nghĩa: Chưa có bản dịch tiếng Việt (???)'}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          })()}
        </div>
      `;

      // Event listeners
      document.getElementById('btn-detail-speak')?.addEventListener('click', () => {
        window.soundEngine?.speakChinese(displayChar);
      });

      document.getElementById('btn-detail-vocab')?.addEventListener('click', () => {
        if (window.openVocabModal) window.openVocabModal(displayChar);
      });

      // Sub-components click handler
      this.detailResultBox.querySelectorAll('.comp-tag-card').forEach(tag => {
        tag.addEventListener('click', () => {
          const rad = tag.dataset.rad;
          if (rad) {
            window.soundEngine?.playTap();
            window.soundEngine?.speakChinese(rad);
            if (window.openVocabModal) window.openVocabModal(rad);
          }
        });
      });

      // Sentence cards audio click handler
      this.detailResultBox.querySelectorAll('.forge-sentence-card').forEach(card => {
        card.addEventListener('click', () => {
          const sent = card.dataset.sentence;
          if (sent) {
            window.soundEngine?.playTap();
            window.soundEngine?.speakChinese(sent);
          }
        });
      });

      // Compounds click handler
      this.detailResultBox.querySelectorAll('.forge-compound-card').forEach(card => {
        card.addEventListener('click', () => {
          const w = card.dataset.word;
          if (w) {
            window.soundEngine?.playTap();
            window.soundEngine?.speakChinese(w);
          }
        });
      });
    } catch(err) {
      console.warn("renderDetailResult error:", err);
    }
  }

  resetDetailResultBox() {
    if (this.detailResultBox) {
      this.detailResultBox.innerHTML = `
        <div class="result-placeholder">
          <span style="font-size:2rem;opacity:0.3;">📜</span>
          <p style="color:var(--text-muted);font-size:0.9rem;margin-top:0.3rem;">
            Kết quả ghép chữ, câu chuyện ghi nhớ và ví dụ sẽ hiển thị tại đây khi bạn chế tác thành công.
          </p>
        </div>
      `;
    }
  }

  recordDiscovery(ch) {
    if (!this.sessionDiscoveries.find(d => d.character === ch.character)) {
      this.sessionDiscoveries.unshift(ch);
    }

    if (window.appState) {
      window.appState.markCharacterCompleted(ch.id || `char_${ch.character}`);
    }

    if (this.discoveryCount) {
      this.discoveryCount.textContent = `${this.sessionDiscoveries.length} chữ`;
    }

    this.renderHistoryFeed();
  }

  renderHistoryFeed() {
    if (!this.historyFeed) return;

    if (this.sessionDiscoveries.length === 0) {
      this.historyFeed.innerHTML = `
        <p style="color:var(--text-dim);font-size:0.85rem;text-align:center;padding:1.5rem 0;">
          Chưa có chữ nào được ghép trong phiên này. Hãy bắt đầu kéo thả!
        </p>
      `;
      return;
    }

    this.historyFeed.innerHTML = '';
    this.sessionDiscoveries.forEach(ch => {
      const item = document.createElement('div');
      item.className = 'history-feed-item';
      item.title = `Bấm để tra cứu từ điển & tập viết chữ「${ch.character}」`;
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <span class="hfi-glyph">${ch.character}</span>
        <div class="hfi-meta">
          <span class="hfi-pinyin">${ch.pinyin}</span>
          <span class="hfi-meaning">${ch.meaning}</span>
          <span class="hfi-comps">${ch.components ? ch.components.map(c => c.radical).join(' + ') : ''}</span>
        </div>
      `;
      item.addEventListener('click', () => {
        if (window.openVocabModal) {
          window.openVocabModal(ch.character);
        } else {
          window.soundEngine.speakChinese(ch.character);
        }
      });
      this.historyFeed.appendChild(item);
    });
  }

  // ── Recipe Codex (Minecraft Sách Công Thức & Cây Khám Phá) ─────────────────

  initCodex() {
    if (this.btnOpenCodex) {
      this.btnOpenCodex.addEventListener('click', () => this.openCodex());
    }

    if (this.btnCloseCodex) {
      this.btnCloseCodex.addEventListener('click', () => this.closeCodex());
    }

    if (this.codexModal) {
      this.codexModal.addEventListener('click', (e) => {
        if (e.target === this.codexModal) this.closeCodex();
      });
    }

    if (this.codexSearchInput) {
      let searchTimeout = null;
      this.codexSearchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.codexSearchQuery = this.codexSearchInput.value.trim();
          this.renderCodexGrid();
        }, 120);
      });
    }

    // Event Delegation on Codex Grid for high performance (0 listener per card)
    if (this.codexGrid) {
      this.codexGrid.addEventListener('click', (e) => {
        const loadBtn = e.target.closest('.btn-load-recipe');
        if (loadBtn) {
          const char = loadBtn.dataset.char;
          const layout = loadBtn.dataset.layout;
          const parts = (loadBtn.dataset.parts || '').split(',');
          if (parts.length > 0) {
            this.loadRecipeOntoBoard({ character: char, layout: layout, parts: parts });
            this.closeCodex();
          }
          return;
        }

        const inspectBtn = e.target.closest('.btn-inspect-recipe');
        if (inspectBtn) {
          const char = inspectBtn.dataset.char;
          if (char && window.openVocabModal) {
            window.openVocabModal(char);
          }
          return;
        }

        const unlockedGlyph = e.target.closest('.rci-result-glyph.unlocked');
        if (unlockedGlyph) {
          const char = unlockedGlyph.textContent.trim();
          if (char && char !== '?' && window.openVocabModal) {
            window.openVocabModal(char);
          }
          return;
        }

        const speakBtn = e.target.closest('.btn-speak-recipe');
        if (speakBtn) {
          const char = speakBtn.dataset.char;
          if (char) window.soundEngine.speakChinese(char);
        }
      });

      // Infinite scroll listener
      this.codexGrid.addEventListener('scroll', () => {
        if (this.codexGrid.scrollTop + this.codexGrid.clientHeight >= this.codexGrid.scrollHeight - 250) {
          this.renderMoreCodexCards(24);
        }
      }, { passive: true });
    }

    document.querySelectorAll('.codex-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.codex-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.codexActiveTab = btn.dataset.tab || 'all';
        window.soundEngine.playTap();
        this.renderCodexGrid();
      });
    });
  }

  openCodex(filterRadical = null) {
    if (!this.codexModal) return;
    window.soundEngine.playTap();
    this.codexModal.classList.add('active');

    if (filterRadical && this.codexSearchInput) {
      this.codexSearchInput.value = filterRadical;
      this.codexSearchQuery = filterRadical;
    }

    this.renderCodexGrid();
  }

  closeCodex() {
    if (!this.codexModal) return;
    window.soundEngine.playTap();
    this.codexModal.classList.remove('active');
  }

  isCharacterUnlocked(char) {
    if (this.sessionDiscoveries.some(d => d.character === char)) return true;
    if (window.appState && window.appState.isCompleted && window.appState.isCompleted(`char_${char}`)) return true;
    return false;
  }

  renderCodexGrid() {
    if (!this.codexGrid) return;
    this.codexGrid.innerHTML = '';

    const recipesMap = window.CRAFTING_RECIPES_MAP || {};
    const entries = Object.entries(recipesMap);
    const totalCount = entries.length;

    let unlockedCount = 0;
    const q = normalizeSearchText(this.codexSearchQuery);

    this.currentFilteredCodex = entries.filter(([key, rec]) => {
      const isUnlocked = this.isCharacterUnlocked(rec.character);
      if (isUnlocked) unlockedCount++;

      // Tab filter
      if (this.codexActiveTab === 'unlocked' && !isUnlocked) return false;
      if (this.codexActiveTab === 'locked' && isUnlocked) return false;

      // Search filter
      if (q) {
        const partsText = (rec.parts || []).join('');
        const charText = rec.character || '';
        const pyText = normalizeSearchText(rec.pinyin || '');
        const mnText = normalizeSearchText(rec.meaning || '');
        const lnText = normalizeSearchText(rec.layout_name || '');

        const match = charText.includes(q) || partsText.includes(q) || pyText.includes(q) || mnText.includes(q) || lnText.includes(q);
        if (!match) return false;
      }

      return true;
    });

    // Update Codex header stats
    if (this.codexStatTotal) this.codexStatTotal.textContent = totalCount.toLocaleString();
    if (this.codexStatUnlocked) this.codexStatUnlocked.textContent = unlockedCount.toLocaleString();
    if (this.codexStatPercent) {
      const pct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
      this.codexStatPercent.textContent = `${pct}%`;
    }

    if (this.currentFilteredCodex.length === 0) {
      this.codexGrid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:2.5rem 1rem;color:var(--text-dim);">
          Không tìm thấy công thức phù hợp với bộ lọc tìm kiếm.
        </div>
      `;
      return;
    }

    this.codexRenderedCount = 0;
    this.renderMoreCodexCards(24);
  }

  renderMoreCodexCards(batchSize = 24) {
    if (!this.currentFilteredCodex || !this.codexGrid) return;
    if (this.codexRenderedCount >= this.currentFilteredCodex.length) return;

    const start = this.codexRenderedCount;
    const end = Math.min(this.currentFilteredCodex.length, start + batchSize);
    const fragment = document.createDocumentFragment();

    for (let i = start; i < end; i++) {
      const [key, rec] = this.currentFilteredCodex[i];
      const isUnlocked = this.isCharacterUnlocked(rec.character);

      const card = document.createElement('div');
      card.className = `recipe-card-item ${isUnlocked ? 'is-unlocked' : 'is-locked'}`;

      const partsHtml = (rec.parts || []).map(p => `
        <span class="rci-ing-chip" title="Bộ: ${p}">${p}</span>
      `).join('<span style="color:var(--text-dim);font-size:0.8rem;">+</span>');

      card.innerHTML = `
        <div class="rci-header">
          <span class="rci-layout-tag">${rec.layout_name || rec.layout}</span>
          <span class="rci-status-badge ${isUnlocked ? 'unlocked' : 'locked'}">
            ${isUnlocked ? '✅ Đã mở' : '❓ Chưa mở'}
          </span>
        </div>

        <div class="rci-body">
          <div class="rci-ingredients">
            ${partsHtml}
            <span class="rci-arrow">➔</span>
          </div>
          <div class="rci-result-glyph ${isUnlocked ? 'unlocked' : 'locked'}" title="${isUnlocked ? rec.character : 'Chưa khám phá'}">
            ${isUnlocked ? rec.character : '?'}
          </div>
        </div>

        <div class="rci-meta">
          <b>${isUnlocked ? rec.character : '???'}</b>
          <span>${rec.pinyin ? `(${rec.pinyin})` : ''}</span>
          <div style="color:var(--text-dim);font-size:0.75rem;margin-top:0.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${rec.meaning || 'Chưa mở khóa'}
          </div>
        </div>

        <div class="rci-action-row">
          <button class="btn btn-secondary btn-sm btn-load-recipe" data-char="${rec.character}" data-layout="${rec.layout}" data-parts="${(rec.parts || []).join(',')}" title="Nạp nhanh các bộ này lên khung ghép">
            ⚡ Ghép ngay
          </button>
          ${isUnlocked ? `
            <button class="btn btn-gold btn-sm btn-inspect-recipe" data-char="${rec.character}" title="Tra cứu từ điển & tập viết">
              🔍 Chi tiết
            </button>
            <button class="btn btn-secondary btn-sm btn-speak-recipe" data-char="${rec.character}" title="Phát âm">
              🔊
            </button>
          ` : ''}
        </div>
      `;

      fragment.appendChild(card);
    }

    this.codexRenderedCount = end;
    this.codexGrid.appendChild(fragment);
  }

  loadRecipeOntoBoard(rec) {
    if (!rec || !rec.parts) return;
    this.clearCanvas();

    const parts = rec.parts;
    if (parts.length === 2) {
      if (rec.layout === 'LEFT_RIGHT') {
        this.addTokenToCanvas(parts[0], parts[0], '', 28, 50);
        this.addTokenToCanvas(parts[1], parts[1], '', 72, 50);
      } else if (rec.layout === 'TOP_BOTTOM') {
        this.addTokenToCanvas(parts[0], parts[0], '', 50, 28);
        this.addTokenToCanvas(parts[1], parts[1], '', 50, 72);
      } else if (rec.layout === 'SURROUND_BOTTOMLEFT') {
        this.addTokenToCanvas(parts[0], parts[0], '', 34, 62);
        this.addTokenToCanvas(parts[1], parts[1], '', 62, 36);
      } else if (rec.layout === 'SURROUND_TOPRIGHT') {
        this.addTokenToCanvas(parts[0], parts[0], '', 64, 36);
        this.addTokenToCanvas(parts[1], parts[1], '', 38, 62);
      } else {
        this.addTokenToCanvas(parts[0], parts[0], '', 38, 50);
        this.addTokenToCanvas(parts[1], parts[1], '', 62, 50);
      }
    } else if (parts.length === 3) {
      if (rec.layout === 'TRIANGLE_PYRAMID') {
        this.addTokenToCanvas(parts[0], parts[0], '', 50, 26);
        this.addTokenToCanvas(parts[1], parts[1], '', 28, 70);
        this.addTokenToCanvas(parts[2], parts[2], '', 72, 70);
      } else {
        this.addTokenToCanvas(parts[0], parts[0], '', 22, 50);
        this.addTokenToCanvas(parts[1], parts[1], '', 50, 50);
        this.addTokenToCanvas(parts[2], parts[2], '', 78, 50);
      }
    }

    window.showToast(`Đã nạp công thức tạo chữ「${rec.character}」lên khung!`, 'success');
  }

  init() {
    this.renderPalette();
    this.clearCanvas();
    this.renderHistoryFeed();
  }
}

window.HanziBuilder = HanziBuilder;
