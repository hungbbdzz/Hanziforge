/**
 * HanziForge — radicals.js
 * 214 KangXi Radicals: palette, browser, search/filter
 * Built with AI assistance (Google Gemini)
 *
 * Current: 96 radicals (strokes 1–5), full search & filter, modal hooks
 * See ROADMAP.md for weekly feature additions
 */

(function () {
  'use strict';

  // ── Radical Dataset ───────────────────────────────────────────────────────
  // Source: Unicode Unihan (kVietnamese) + MakeMeAHanzi decomposition
  // Format: [hanzi, sinoVietnamese, pinyin, strokes, meaning]
  const RADICALS_DATA = [
    // 1 stroke
    ['一','Nhất','yī',1,'Một'],['丨','Côn','gǔn',1,'Đường thẳng'],['丶','Chủ','zhǔ',1,'Chấm'],
    ['丿','Phiệt','piě',1,'Nét phẩy'],['乙','Ất','yǐ',1,'Thứ hai (Can Chi)'],['亅','Quyết','jué',1,'Nét móc'],
    // 2 strokes
    ['二','Nhị','èr',2,'Hai'],['亠','Đầu','tóu',2,'Nắp, mũ'],['人','Nhân','rén',2,'Người'],
    ['儿','Nhân','ér',2,'Chân người'],['入','Nhập','rù',2,'Vào'],['八','Bát','bā',2,'Tám'],
    ['冂','Quynh','jiōng',2,'Vùng xa'],['冖','Mịch','mì',2,'Tấm che'],['冫','Băng','bīng',2,'Băng đá'],
    ['几','Kỷ','jī',2,'Bàn nhỏ'],['凵','Khảm','kǎn',2,'Chỗ trũng'],['刀','Đao','dāo',2,'Dao'],
    ['力','Lực','lì',2,'Sức mạnh'],['勺','Chước','sháo',2,'Thìa'],['又','Hựu','yòu',2,'Lại, tay phải'],
    // 3 strokes
    ['口','Khẩu','kǒu',3,'Miệng'],['囗','Vi','wéi',3,'Vây quanh'],['土','Thổ','tǔ',3,'Đất'],
    ['士','Sĩ','shì',3,'Sĩ quan'],['夕','Tịch','xī',3,'Buổi tối'],['大','Đại','dà',3,'To lớn'],
    ['女','Nữ','nǚ',3,'Phụ nữ'],['子','Tử','zǐ',3,'Con trẻ'],['宀','Miên','mián',3,'Mái nhà'],
    ['寸','Thốn','cùn',3,'Tấc'],['小','Tiểu','xiǎo',3,'Nhỏ bé'],['尸','Thi','shī',3,'Xác chết'],
    ['山','Sơn','shān',3,'Núi'],['川','Xuyên','chuān',3,'Sông ngòi'],['工','Công','gōng',3,'Thợ'],
    ['己','Kỷ','jǐ',3,'Bản thân'],['巾','Cân','jīn',3,'Khăn vải'],['广','Nghiễm','yǎn',3,'Mái hiên'],
    ['弓','Cung','gōng',3,'Cây cung'],['彡','Sam','shān',3,'Lông tua'],['忄','Tâm','xīn',3,'Tim (biến thể)'],
    // 4 strokes
    ['心','Tâm','xīn',4,'Trái tim'],['戈','Qua','gē',4,'Giáo mác'],['户','Hộ','hù',4,'Cửa, hộ gia đình'],
    ['手','Thủ','shǒu',4,'Bàn tay'],['支','Chi','zhī',4,'Cành nhánh'],['文','Văn','wén',4,'Chữ viết'],
    ['斤','Cân','jīn',4,'Rìu'],['方','Phương','fāng',4,'Vuông'],['无','Vô','wú',4,'Không có'],
    ['日','Nhật','rì',4,'Mặt trời'],['曰','Viết','yuē',4,'Nói rằng'],['月','Nguyệt','yuè',4,'Mặt trăng'],
    ['木','Mộc','mù',4,'Cây gỗ'],['欠','Khiếm','qiàn',4,'Thiếu, ngáp'],['止','Chỉ','zhǐ',4,'Dừng lại'],
    ['水','Thủy','shuǐ',4,'Nước'],['火','Hỏa','huǒ',4,'Lửa'],['爪','Trảo','zhǎo',4,'Móng vuốt'],
    ['父','Phụ','fù',4,'Cha'],['片','Phiến','piàn',4,'Mảnh tấm'],['牙','Nha','yá',4,'Răng ngà'],
    ['牛','Ngưu','niú',4,'Con bò'],['犬','Khuyển','quǎn',4,'Con chó'],['王','Vương','wáng',4,'Vua'],
    ['木','Mộc','mù',4,'Gỗ, cây'],['气','Khí','qì',4,'Hơi, khí'],['爻','Hào','yáo',4,'Quẻ bói'],
    // 5 strokes
    ['玉','Ngọc','yù',5,'Đá quý'],['瓜','Qua','guā',5,'Dưa'],['瓦','Ngõa','wǎ',5,'Ngói gốm'],
    ['甘','Cam','gān',5,'Ngọt ngào'],['生','Sinh','shēng',5,'Sinh ra'],['用','Dụng','yòng',5,'Sử dụng'],
    ['田','Điền','tián',5,'Ruộng đồng'],['疒','Nạch','nè',5,'Bệnh tật'],['白','Bạch','bái',5,'Trắng'],
    ['皮','Bì','pí',5,'Da, vỏ'],['目','Mục','mù',5,'Mắt'],['矛','Mâu','máo',5,'Giáo dài'],
    ['矢','Thỉ','shǐ',5,'Mũi tên'],['石','Thạch','shí',5,'Đá'],['示','Thị','shì',5,'Thần, hiển thị'],
    ['禾','Hòa','hé',5,'Lúa mì'],['穴','Huyệt','xué',5,'Hang hốc'],['立','Lập','lì',5,'Đứng thẳng'],
    ['糸','Mịch','mì',5,'Sợi chỉ'],['网','Võng','wǎng',5,'Lưới bắt cá'],['羊','Dương','yáng',5,'Con dê'],
    ['羽','Vũ','yǔ',5,'Lông vũ'],['老','Lão','lǎo',5,'Già lão'],['而','Nhi','ér',5,'Mà, và'],
    ['耳','Nhĩ','ěr',5,'Tai'],['聿','Duật','yù',5,'Bút lông'],['肉','Nhục','ròu',5,'Thịt'],
    ['臣','Thần','chén',5,'Bề tôi, quan'],['自','Tự','zì',5,'Tự mình'],['至','Chí','zhì',5,'Đến nơi'],
    ['臼','Cữu','jiù',5,'Cối giã gạo'],['舌','Thiệt','shé',5,'Lưỡi'],['舛','Suyễn','chuǎn',5,'Sai lầm'],
    ['舟','Chu','zhōu',5,'Con thuyền'],['艮','Cấn','gèn',5,'Cứng nhắc'],['色','Sắc','sè',5,'Màu sắc'],
    ['虍','Hổ','hǔ',5,'Con hổ (trên)'],['血','Huyết','xuè',5,'Máu'],['行','Hành','xíng',5,'Đi, hành động'],
  ];

  // ── State ─────────────────────────────────────────────────────────────────
  let filterStrokes = 'all';
  let searchQuery   = '';

  // ── Render Functions ──────────────────────────────────────────────────────
  function getFiltered() {
    return RADICALS_DATA.filter(r => {
      // Stroke filter
      if (filterStrokes !== 'all') {
        if (filterStrokes === '5+') { if (r[3] < 5) return false; }
        else { if (r[3] !== parseInt(filterStrokes)) return false; }
      }
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r[0].includes(q) || r[1].toLowerCase().includes(q) ||
               r[2].includes(q) || r[4].toLowerCase().includes(q);
      }
      return true;
    });
  }

  function renderRadicalsGrid() {
    const grid   = document.getElementById('radicals-grid');
    const shownEl = document.getElementById('radicals-shown');
    if (!grid) return;

    const data = getFiltered();
    if (shownEl) shownEl.textContent = data.length;

    grid.innerHTML = '';
    if (data.length === 0) {
      grid.innerHTML = '<p class="state-loading">Không tìm thấy bộ thủ phù hợp.</p>';
      return;
    }

    data.forEach(r => {
      const card = document.createElement('div');
      card.className  = 'radical-card';
      card.role       = 'listitem';
      card.title      = `${r[0]} — ${r[1]} (${r[2]}) — ${r[4]}`;
      card.dataset.hanzi  = r[0];
      card.dataset.sino   = r[1];
      card.dataset.pinyin = r[2];
      card.dataset.strokes = r[3];
      card.dataset.meaning = r[4];
      card.innerHTML = `
        <div class="radical-char">${r[0]}</div>
        <div class="radical-sino">${r[1]}</div>
        <div class="radical-pinyin">${r[2]}</div>
        <div class="radical-meaning">${r[4]}</div>
        <div class="radical-strokes">${r[3]} nét</div>
      `;
      card.addEventListener('click', () => onRadicalCardClick(r));
      grid.appendChild(card);
    });
  }

  // ── Craftable Radicals in Demo ────────────────────────────────────────────
  const CRAFTABLE_RADICAL_CHARS = new Set([
    '人', '木', '日', '月', '女', '子', '火', '水', '口', '山',
    '土', '心', '刀', '小', '大', '田', '力', '宀', '手', '目', '玉'
  ]);

  let paletteTab     = 'demo'; // 'demo' | 'crafted' | 'synergy' | 'all'
  let paletteQuery   = '';
  let paletteStrokes = 'all';

  function renderPaletteTokens() {
    const paletteEl      = document.getElementById('palette-tokens');
    const countEl        = document.getElementById('palette-count');
    const craftedCountEl = document.getElementById('crafted-count');
    const synergyCountEl = document.getElementById('synergy-count');
    if (!paletteEl) return;

    window.HanziForge = window.HanziForge || {};
    const craftedList = window.HanziForge.craftedTokens || [];
    const synergySet  = window.HanziForge.synergyRadicals || new Set();

    if (craftedCountEl) craftedCountEl.textContent = craftedList.length;
    if (synergyCountEl) synergyCountEl.textContent = synergySet.size;

    let baseData = [];
    if (paletteTab === 'demo') {
      baseData = RADICALS_DATA.filter(r => CRAFTABLE_RADICAL_CHARS.has(r[0]));
    } else if (paletteTab === 'crafted') {
      baseData = craftedList.map(c => [c.char, c.sino, c.pinyin, c.strokes || 0, c.meaning]);
    } else if (paletteTab === 'synergy') {
      if (synergySet.size === 0) {
        baseData = [];
      } else {
        baseData = RADICALS_DATA.filter(r => synergySet.has(r[0]));
      }
    } else {
      baseData = RADICALS_DATA;
    }

    // Filter by stroke chips
    if (paletteStrokes !== 'all') {
      baseData = baseData.filter(r => {
        const s = r[3];
        if (paletteStrokes === '5+') return s >= 5;
        if (paletteStrokes === '1-2') return s <= 2;
        return s === parseInt(paletteStrokes);
      });
    }

    // Filter by search query
    if (paletteQuery) {
      baseData = baseData.filter(r =>
        r[0].includes(paletteQuery) ||
        (r[1] && r[1].toLowerCase().includes(paletteQuery)) ||
        (r[2] && r[2].toLowerCase().includes(paletteQuery)) ||
        (r[4] && r[4].toLowerCase().includes(paletteQuery))
      );
    }

    if (countEl) countEl.textContent = baseData.length;
    paletteEl.innerHTML = '';

    if (baseData.length === 0) {
      let emptyMsg = 'Không tìm thấy bộ thủ phù hợp.';
      if (paletteTab === 'crafted') {
        emptyMsg = 'Chưa có chữ nào được chế tác. Hãy kéo ghép các bộ thủ trên bàn trước!';
      } else if (paletteTab === 'synergy') {
        emptyMsg = 'Kéo ít nhất 1 bộ thủ lên bàn Tianzige để xem các bộ thủ hợp lệ có thể ghép cùng!';
      }
      paletteEl.innerHTML = `<div class="palette-empty">${emptyMsg}</div>`;
      return;
    }

    baseData.forEach(r => {
      const token = document.createElement('div');
      token.className  = 'palette-token';
      token.role       = 'listitem';
      token.draggable  = true;
      token.dataset.hanzi   = r[0];
      token.dataset.sino    = r[1] || '';
      token.dataset.pinyin  = r[2] || '';
      token.dataset.strokes = r[3] || 0;
      token.dataset.meaning = r[4] || '';

      if (synergySet.has(r[0])) {
        token.classList.add('synergy-match');
        token.title = `✨ Có thể ghép với thẻ đang có trên bàn!`;
      }

      token.innerHTML = `
        <span class="token-char">${r[0]}</span>
        <span class="token-info">
          <span class="token-sino">${r[1] || '—'}</span>
          <span class="token-sub">${r[2] || ''} · ${r[4] || ''}</span>
        </span>
      `;
      token.addEventListener('dragstart', e => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', JSON.stringify({
          char: r[0], sino: r[1], pinyin: r[2], meaning: r[4]
        }));
        window.HanziForge = window.HanziForge || {};
        window.HanziForge.dragData = { char: r[0], sino: r[1], pinyin: r[2], meaning: r[4] };
      });
      paletteEl.appendChild(token);
    });
  }

  // ── Radical Card Click → Open Character Detail Modal ─────────────────────
  function onRadicalCardClick(r) {
    // Populate modal fields
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('modal-char-title',   r[1]);
    set('modal-char-pinyin',  r[2]);
    set('modal-char-meaning', r[4]);

    // Display the character large in the HanziWriter slot
    const hwTarget = document.getElementById('char-hw-target');
    if (hwTarget) {
      hwTarget.innerHTML = `<span style="font-family:var(--font-hanzi);font-size:4rem;color:var(--gold-lt)">${r[0]}</span>`;
    }

    // Tags
    const tagsEl = document.getElementById('modal-char-tags');
    if (tagsEl) {
      tagsEl.innerHTML = `
        <span class="tag hsk">Bộ thủ ${r[3]} nét</span>
        <span class="tag trad">KangXi #${RADICALS_DATA.indexOf(r) + 1}</span>
      `;
    }

    // Placeholder tab content — Coming Soon
    const contentEl = document.getElementById('modal-tab-content');
    if (contentEl) {
      contentEl.innerHTML = `
        <div style="padding:1.5rem;color:var(--text-muted);font-size:.85rem;text-align:center">
          <p style="margin-bottom:.5rem;color:var(--gold-lt);font-weight:600;font-size:1rem">📝 Coming Soon</p>
          <p style="font-size:.78rem;color:var(--text-dim)">Tính năng tra cứu từ vựng, luyện nét viết và câu ví dụ đang được phát triển.</p>
        </div>
      `;
    }

    window.HanziForge?.openModal('modal-char-detail');
  }

  // ── Filter & Search bindings ──────────────────────────────────────────────

  // Search in radical browser (Tab 2)
  document.getElementById('radical-search')?.addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    renderRadicalsGrid();
  });

  // Stroke filter buttons in radical browser (Tab 2)
  document.querySelectorAll('#stroke-filter .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#stroke-filter .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterStrokes = btn.dataset.strokes;
      renderRadicalsGrid();
    });
  });

  // Palette tabs (Tab 1)
  document.querySelectorAll('#palette-filter-tabs .filter-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#palette-filter-tabs .filter-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      paletteTab = btn.dataset.tab;
      renderPaletteTokens();
    });
  });

  // Palette search
  document.getElementById('palette-search')?.addEventListener('input', e => {
    paletteQuery = e.target.value.trim().toLowerCase();
    renderPaletteTokens();
  });

  // Stroke chips in palette
  document.querySelectorAll('#stroke-chips .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#stroke-chips .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      paletteStrokes = btn.dataset.strokes;
      renderPaletteTokens();
    });
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  window.HanziForge = window.HanziForge || {};
  window.HanziForge.RADICALS_DATA = RADICALS_DATA;
  window.HanziForge.CRAFTABLE_RADICAL_CHARS = CRAFTABLE_RADICAL_CHARS;
  window.HanziForge.craftedTokens = window.HanziForge.craftedTokens || [];
  window.HanziForge.synergyRadicals = window.HanziForge.synergyRadicals || new Set();
  window.HanziForge.renderPaletteTokens = renderPaletteTokens;
  window.HanziForge.openRadicalDetail = onRadicalCardClick;

  renderPaletteTokens();
  renderRadicalsGrid();

  console.log(`[HanziForge] radicals.js loaded — ${RADICALS_DATA.length} radicals, demo filter active`);
})();
