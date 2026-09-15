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
  let currentModalTab = 'vocab';

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

    const hwStatus   = document.getElementById('hw-status-label');
    const btnAnimate = document.getElementById('btn-hw-animate');
    const btnQuiz    = document.getElementById('btn-hw-quiz');
    const btnStop    = document.getElementById('btn-hw-stop');

    if (hwStatus) hwStatus.textContent = 'Đang tải hoạt họa nét...';

    if (btnAnimate) {
      btnAnimate.onclick = () => {
        if (!currentWriter) return;
        try { currentWriter.cancelQuiz(); } catch (e) {}
        currentWriter.animateCharacter();
        if (hwStatus) hwStatus.textContent = 'Đang vẽ nét...';
      };
    }

    if (btnQuiz) {
      btnQuiz.onclick = () => {
        if (!currentWriter) return;
        if (hwStatus) hwStatus.textContent = '✏️ Hãy vẽ nét theo thứ tự...';
        currentWriter.quiz({
          onMistake: (strokeData) => {
            if (hwStatus) hwStatus.textContent = `Nét ${strokeData.strokeNum + 1}: Sai! Thử lại (${strokeData.mistakesOnStroke} lần)`;
          },
          onCorrectStroke: (strokeData) => {
            if (hwStatus) hwStatus.textContent = `✅ Nét ${strokeData.strokeNum + 1} đúng! (${strokeData.totalMistakes} lỗi)`;
          },
          onComplete: (summary) => {
            if (hwStatus) hwStatus.textContent = `🎉 Hoàn thành! Tổng lỗi: ${summary.totalMistakes}`;
          }
        });
      };
    }

    if (btnStop) {
      btnStop.onclick = () => {
        if (!currentWriter) return;
        try { currentWriter.cancelQuiz(); } catch (e) {}
        currentWriter.hideCharacter();
        currentWriter.showOutline();
        if (hwStatus) hwStatus.textContent = 'Đã dừng.';
      };
    }

    openModal('modal-char-detail');

    // Sync modal active tab button & render dynamic knowledge tab
    const modalDetail = document.getElementById('modal-char-detail');
    if (modalDetail) {
      modalDetail.querySelectorAll('.modal-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mtab === currentModalTab);
      });
    }
    renderModalTabContent(currentModalTab || 'vocab');

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
            if (hwStatus) hwStatus.textContent = 'Đang vẽ nét...';
            currentWriter.animateCharacter();
          },
          onLoadCharDataError: () => {
            if (hwTarget) {
              hwTarget.innerHTML = `<span style="font-family:var(--font-hanzi);font-size:3.6rem;color:var(--gold-lt)">${char}</span>`;
            }
            if (hwStatus) hwStatus.textContent = 'Chữ cổ/chưa có vector nét';
          }
        });
      } catch (err) {
        if (hwTarget) {
          hwTarget.innerHTML = `<span style="font-family:var(--font-hanzi);font-size:3.6rem;color:var(--gold-lt)">${char}</span>`;
        }
        if (hwStatus) hwStatus.textContent = 'Chưa thể tải nét';
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

  // ── Speech Synthesis (Web Speech API) ────────────────────────────────────
  function speakChinese(text) {
    if (!text || !soundEnabled) return;
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.88;
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(v => v.lang.startsWith('zh') || v.name.includes('Chinese'));
      if (zhVoice) utterance.voice = zhVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis notice:', e);
    }
  }

  document.getElementById('btn-pronounce')?.addEventListener('click', () => {
    if (currentChar) speakChinese(currentChar);
  });

  // ── Modal Knowledge Base (Vocab, Sentences, Etymology) ────────────────────
  const VOCAB_DATA = {
    '木': [
      { word: '木头', pinyin: 'mù tou', meaning: 'Gỗ, khúc gỗ' },
      { word: '树木', pinyin: 'shù mù', meaning: 'Cây cối' },
      { word: '森林', pinyin: 'sēn lín', meaning: 'Rừng rậm' },
      { word: '木匠', pinyin: 'mù jiang', meaning: 'Thợ mộc' }
    ],
    '人': [
      { word: '人们', pinyin: 'rén men', meaning: 'Mọi người' },
      { word: '人类', pinyin: 'rén lèi', meaning: 'Loài người, nhân loại' },
      { word: '主人', pinyin: 'zhǔ rén', meaning: 'Chủ nhân' },
      { word: '众人', pinyin: 'zhòng rén', meaning: 'Quần chúng, mọi người' }
    ],
    '日': [
      { word: '日子', pinyin: 'rì zi', meaning: 'Ngày tháng, cuộc sống' },
      { word: '日出', pinyin: 'rì chū', meaning: 'Mặt trời mọc, bình minh' },
      { word: '明白', pinyin: 'míng bai', meaning: 'Hiểu rõ, rõ ràng' },
      { word: '今日', pinyin: 'jīn rì', meaning: 'Hôm nay' }
    ],
    '月': [
      { word: '月亮', pinyin: 'yuè liang', meaning: 'Mặt trăng' },
      { word: '月饼', pinyin: 'yuè bǐng', meaning: 'Bánh trung thu' },
      { word: '岁月', pinyin: 'suì yuè', meaning: 'Tháng năm, thời gian' },
      { word: '明月', pinyin: 'míng yuè', meaning: 'Trăng sáng' }
    ],
    '火': [
      { word: '火车', pinyin: 'huǒ chē', meaning: 'Tàu hỏa' },
      { word: '火灾', pinyin: 'huǒ zāi', meaning: 'Hỏa hoạn' },
      { word: '热情', pinyin: 'rè qíng', meaning: 'Nhiệt tình' },
      { word: '发火', pinyin: 'fā huǒ', meaning: 'Nổi nóng, bốc hỏa' }
    ],
    '水': [
      { word: '水果', pinyin: 'shuǐ guǒ', meaning: 'Hoa quả, trái cây' },
      { word: '水平', pinyin: 'shuǐ píng', meaning: 'Trình độ, mức độ' },
      { word: '雨水', pinyin: 'yǔ shuǐ', meaning: 'Nước mưa' },
      { word: '河水', pinyin: 'hé shuǐ', meaning: 'Nước sông' }
    ],
    '口': [
      { word: '门口', pinyin: 'mén kǒu', meaning: 'Cổng ra vào' },
      { word: '人口', pinyin: 'rén kǒu', meaning: 'Dân số' },
      { word: '口气', pinyin: 'kǒu qì', meaning: 'Giọng điệu' },
      { word: '品味', pinyin: 'pǐn wèi', meaning: 'Phẩm vị, gu thẩm mỹ' }
    ],
    '女': [
      { word: '女人', pinyin: 'nǚ rén', meaning: 'Phụ nữ' },
      { word: '女孩', pinyin: 'nǚ hái', meaning: 'Bé gái, cô gái' },
      { word: '妇女', pinyin: 'fù nǚ', meaning: 'Phụ nữ (trang trọng)' },
      { word: '好人', pinyin: 'hǎo rén', meaning: 'Người tốt' }
    ],
    '子': [
      { word: '孩子', pinyin: 'hái zi', meaning: 'Đứa trẻ, con cái' },
      { word: '儿子', pinyin: 'ér zi', meaning: 'Con trai' },
      { word: '日子', pinyin: 'rì zi', meaning: 'Ngày tháng' },
      { word: '本子', pinyin: 'běn zi', meaning: 'Cuốn vở, tập' }
    ],
    '心': [
      { word: '心里', pinyin: 'xīn lǐ', meaning: 'Trong lòng' },
      { word: '小心', pinyin: 'xiǎo xīn', meaning: 'Cẩn thận' },
      { word: '心情', pinyin: 'xīn qíng', meaning: 'Tâm trạng' },
      { word: '忍耐', pinyin: 'rěn nài', meaning: 'Nhẫn nại' }
    ],
    '山': [
      { word: '高山', pinyin: 'gāo shān', meaning: 'Núi cao' },
      { word: '山顶', pinyin: 'shān dǐng', meaning: 'Đỉnh núi' },
      { word: '爬山', pinyin: 'pá shān', meaning: 'Leo núi' }
    ],
    '田': [
      { word: '田地', pinyin: 'tián dì', meaning: 'Ruộng đất' },
      { word: '农田', pinyin: 'nóng tián', meaning: 'Ruộng đồng canh tác' },
      { word: '男人', pinyin: 'nán rén', meaning: 'Người đàn ông' }
    ],
    '休': [
      { word: '休息', pinyin: 'xiū xi', meaning: 'Nghỉ ngơi' },
      { word: '退休', pinyin: 'tuì xiū', meaning: 'Nghỉ hưu' },
      { word: '休假', pinyin: 'xiū jià', meaning: 'Nghỉ phép' }
    ],
    '明': [
      { word: '明天', pinyin: 'míng tiān', meaning: 'Ngày mai' },
      { word: '聪明', pinyin: 'cōng ming', meaning: 'Thông minh' },
      { word: '明显', pinyin: 'míng xiǎn', meaning: 'Rõ rệt, hiển nhiên' },
      { word: '明白', pinyin: 'míng bai', meaning: 'Hiểu rõ' }
    ],
    '好': [
      { word: '你好', pinyin: 'nǐ hǎo', meaning: 'Xin chào' },
      { word: '好处', pinyin: 'hǎo chu', meaning: 'Điểm tốt, lợi ích' },
      { word: '好看', pinyin: 'hǎo kàn', meaning: 'Đẹp mắt, ưa nhìn' }
    ],
    '安': [
      { word: '安全', pinyin: 'ān quán', meaning: 'An toàn' },
      { word: '安静', pinyin: 'ān jìng', meaning: 'Yên tĩnh' },
      { word: '安心', pinyin: 'ān xīn', meaning: 'Yên lòng' }
    ],
    '国': [
      { word: '国家', pinyin: 'guó jiā', meaning: 'Quốc gia, đất nước' },
      { word: '中国', pinyin: 'zhōng guó', meaning: 'Trung Quốc' },
      { word: '国际', pinyin: 'guó jì', meaning: 'Quốc tế' }
    ]
  };

  const SENTENCES_DATA = {
    '木': [
      { zh: '这棵树是老木。', py: 'Zhè kē shù shì lǎo mù.', vi: 'Cái cây này là cây gỗ lâu năm.' },
      { zh: '山上有许多大木。', py: 'Shān shàng yǒu xǔ duō dà mù.', vi: 'Trên núi có rất nhiều cây to.' }
    ],
    '人': [
      { zh: '公园里有很多新人。', py: 'Gōng yuán lǐ yǒu hěn duō xīn rén.', vi: 'Trong công viên có rất nhiều người mới.' },
      { zh: '人人都有自己的梦想。', py: 'Rén rén dōu yǒu zì jǐ de mèng xiǎng.', vi: 'Mỗi người đều có ước mơ của riêng mình.' }
    ],
    '日': [
      { zh: '今天的日子过得很开心。', py: 'Jīn tiān de rì zi guò de hěn kāi xīn.', vi: 'Ngày hôm nay trôi qua rất vui vẻ.' },
      { zh: '旭日东升，光芒万丈。', py: 'Xù rì dōng shēng, guāng máng wàn zhàng.', vi: 'Mặt trời mọc đằng đông, tỏa sáng muôn nơi.' }
    ],
    '月': [
      { zh: '今晚的月亮特别圆。', py: 'Jīn wǎn de yuè liang tè bié yuán.', vi: 'Ánh trăng đêm nay đặc biệt tròn.' },
      { zh: '日月如梭，光阴似箭。', py: 'Rì yuè rú suō, guāng yīn sì jiàn.', vi: 'Thấm thoát thoi đưa, thời gian như tên bắn.' }
    ],
    '休': [
      { zh: '工作累了就好好休息吧。', py: 'Gōng zuò lèi le jiù hǎo hǎo xiū xi ba.', vi: 'Làm việc mệt rồi thì nghỉ ngơi cho khỏe nhé.' },
      { zh: '他下个月要休假旅行。', py: 'Tā xià ge yuè yào xiū jià lǚ xíng.', vi: 'Tháng sau anh ấy sẽ nghỉ phép đi du lịch.' }
    ],
    '明': [
      { zh: '明天是个阳光明媚的日子。', py: 'Míng tiān shì gè yáng guāng míng mèi de rì zi.', vi: 'Ngày mai là một ngày nắng đẹp rực rỡ.' },
      { zh: '这个问题我已经想明白了。', py: 'Zhè ge wèn tí wǒ yǐ jīng xiǎng míng bai le.', vi: 'Vấn đề này tôi đã nghĩ thông suốt rồi.' }
    ],
    '好': [
      { zh: '今天的天气非常好。', py: 'Jīn tiān de tiān qì fēi cháng hǎo.', vi: 'Thời tiết hôm nay vô cùng đẹp.' },
      { zh: '好好学习，天天向上。', py: 'Hǎo hǎo xué xí, tiān tiān xiàng shàng.', vi: 'Học tập chăm chỉ, ngày ngày tiến bộ.' }
    ],
    '安': [
      { zh: '祝你一路平安。', py: 'Zhù nǐ yí lù píng ān.', vi: 'Chúc bạn thuận buồm xuôi gió, đi đường bình an.' },
      { zh: '家里一切都很安好。', py: 'Jiā lǐ yí qiè dōu hěn ān hǎo.', vi: 'Mọi chuyện ở nhà đều rất yên ổn tốt lành.' }
    ],
    '国': [
      { zh: '我热爱我的祖国。', py: 'Wǒ rè ài wǒ de zǔ guó.', vi: 'Tôi yêu tha thiết tổ quốc của mình.' },
      { zh: '中国有悠久的历史文化。', py: 'Zhōng guó yǒu yōu jiǔ de lì shǐ wén huà.', vi: 'Trung Quốc có nền văn hóa lịch sử lâu đời.' }
    ]
  };

  const ETYMOLOGY_DATA = {
    '休': 'Chữ Hội ý: gồm bộ Nhân (人 - người) đứng nép bên cạnh bộ Mộc (木 - cây). Hình ảnh người nông dân lao động mệt mỏi dừng chân tựa lưng vào gốc cây để nghỉ ngơi.',
    '明': 'Chữ Hội ý: kết hợp giữa bộ Nhật (日 - mặt trời) và bộ Nguyệt (月 - mặt trăng). Hai nguồn sáng tự nhiên vĩ đại nhất của vũ trụ hội tụ tạo nên ý nghĩa "sáng sủa, thông tỏ, minh bạch".',
    '林': 'Chữ Hội ý: hai cây Mộc (木) đứng cạnh nhau tạo thành rừng thưa, biểu thị cây cối mọc nhiều tụ họp.',
    '森': 'Chữ Hội ý (cấu trúc Kim tự tháp 品): ba cây Mộc (木) xếp tầng lên nhau, biểu thị rừng rậm bạt ngàn, rậm rạp um tùm.',
    '好': 'Chữ Hội ý: kết hợp giữa bộ Nữ (女 - người phụ nữ) và bộ Tử (子 - đứa con). Cảnh người mẹ ôm ấp đứa con thơ trong lòng tượng trưng cho sự tốt đẹp, hòa thuận, hạnh phúc viên mãn.',
    '男': 'Chữ Hội ý: gồm bộ Điền (田 - ruộng đồng) ở trên và bộ Lực (力 - sức lực, cái cày) ở dưới. Người dùng sức cày xới ngoài đồng ruộng thời xưa chính là người đàn ông.',
    '安': 'Chữ Hội ý: gồm bộ Miên (宀 - mái nhà) ở trên bao bọc lấy bộ Nữ (女 - phụ nữ) ở dưới. Dưới mái ấm gia đình có bàn tay người phụ nữ chăm lo thì cuộc sống mới yên ổn, bình an.',
    '国': 'Chữ Hội ý: bộ Vi (囗 - biên giới bao bọc) bên ngoài, bên trong là bộ Ngọc (玉 - ngọc quý/quốc ấn). Đất đai bờ cõi giữ gìn báu vật quốc gia tạo thành một Nước.',
    '间': 'Chữ Hội ý: bộ Môn (门 - cánh cửa), bên trong là bộ Nhật (日 - mặt trời). Ánh nắng mặt trời lọt qua khe hở của hai cánh cửa đóng lại, biểu thị khoảng trống, gian phòng, thời gian.',
    '床': 'Chữ Hình thanh / Hội ý: bộ Quảng (广 - mái hiên/nhà) che chở bộ Mộc (木 - đồ gỗ), tạo thành chiếc giường ngủ trong phòng.'
  };

  // ── Render Modal Tab Content Dynamically ───────────────────────────────────
  function renderModalTabContent(tabKey) {
    currentModalTab = tabKey;
    const contentEl = document.getElementById('modal-tab-content');
    if (!contentEl) return;

    if (!currentChar) {
      contentEl.innerHTML = `
        <div class="modal-content-placeholder">
          <p style="color:var(--text-dim)">Chưa chọn chữ Hán để tra cứu.</p>
        </div>`;
      return;
    }

    if (tabKey === 'vocab') {
      const vocabList = VOCAB_DATA[currentChar] || [
        { word: `${currentChar}字`, pinyin: '', meaning: `Từ ghép liên quan đến chữ「${currentChar}」` },
        { word: `大${currentChar}`, pinyin: '', meaning: `Cụm từ biểu thị tính chất của「${currentChar}」` }
      ];

      contentEl.innerHTML = `
        <div class="vocab-grid">
          ${vocabList.map(v => `
            <div class="vocab-item-card" data-word="${v.word}" title="Bấm để nghe phát âm「${v.word}」">
              <div class="vocab-item-top">
                <span class="vocab-item-word">${v.word}</span>
                <span class="vocab-item-pinyin">${v.pinyin || ''}</span>
              </div>
              <div class="vocab-item-meaning">${v.meaning}</div>
            </div>
          `).join('')}
        </div>
      `;

      contentEl.querySelectorAll('.vocab-item-card').forEach(card => {
        card.addEventListener('click', () => {
          speakChinese(card.dataset.word);
        });
      });
    } else if (tabKey === 'sentences') {
      const sentences = SENTENCES_DATA[currentChar] || [
        { zh: `这是一个包含「${currentChar}」的汉语句子。`, py: `Zhè shì yí ge bāo hán「${currentChar}」de hàn yǔ jù zi.`, vi: `Đây là một câu ví dụ tiếng Trung chứa chữ「${currentChar}」.` }
      ];

      contentEl.innerHTML = `
        <div class="sentences-list">
          ${sentences.map((s, idx) => `
            <div class="sentence-item-card" data-zh="${s.zh}" title="Bấm để nghe đọc câu ví dụ">
              <div class="sentence-item-zh">
                <span>${idx + 1}. ${s.zh}</span>
                <span style="font-size:0.75rem;color:var(--gold-lt)">🔊</span>
              </div>
              <div class="sentence-item-py">${s.py}</div>
              <div class="sentence-item-vi">${s.vi}</div>
            </div>
          `).join('')}
        </div>
      `;

      contentEl.querySelectorAll('.sentence-item-card').forEach(card => {
        card.addEventListener('click', () => {
          speakChinese(card.dataset.zh);
        });
      });
    } else if (tabKey === 'stroke') {
      contentEl.innerHTML = `
        <div style="padding:0.25rem 0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">
            <span style="font-size:0.85rem;color:var(--text);font-weight:700">✍️ 7 Quy Tắc Bút Thuận Chuẩn</span>
            <button class="hw-btn hw-btn-quiz" id="btn-tab-start-quiz" style="flex:none;padding:0.35rem 0.75rem">✏️ Bắt đầu luyện vẽ chữ「${currentChar}」</button>
          </div>
          <div class="stroke-rules-grid">
            <div class="stroke-rule-card">
              <div class="stroke-rule-title">1. Ngang trước sổ sau</div>
              <div style="color:var(--text-dim)">Nét ngang viết trước, nét dọc sau</div>
              <div class="stroke-rule-eg">Ví dụ: 十 (Nhất → Cổn)</div>
            </div>
            <div class="stroke-rule-card">
              <div class="stroke-rule-title">2. Phẩy trước mác sau</div>
              <div style="color:var(--text-dim)">Phẩy xiên trái trước, mác xiên phải sau</div>
              <div class="stroke-rule-eg">Ví dụ: 八, 人, 木</div>
            </div>
            <div class="stroke-rule-card">
              <div class="stroke-rule-title">3. Trên trước dưới sau</div>
              <div style="color:var(--text-dim)">Viết các nét/bộ phía trên trước</div>
              <div class="stroke-rule-eg">Ví dụ: 三, 昌, 炎</div>
            </div>
            <div class="stroke-rule-card">
              <div class="stroke-rule-title">4. Trái trước phải sau</div>
              <div style="color:var(--text-dim)">Viết thành phần bên trái trước</div>
              <div class="stroke-rule-eg">Ví dụ: 休, 明, 好</div>
            </div>
            <div class="stroke-rule-card">
              <div class="stroke-rule-title">5. Ngoài trước trong sau</div>
              <div style="color:var(--text-dim)">Viết khung bao bọc trước rồi ruột</div>
              <div class="stroke-rule-eg">Ví dụ: 问, 同, 间</div>
            </div>
            <div class="stroke-rule-card">
              <div class="stroke-rule-title">6. Vào trước đóng sau</div>
              <div style="color:var(--text-dim)">Vào nhà rồi mới đóng then cửa</div>
              <div class="stroke-rule-eg">Ví dụ: 国, 回, 因</div>
            </div>
            <div class="stroke-rule-card">
              <div class="stroke-rule-title">7. Giữa trước hai bên sau</div>
              <div style="color:var(--text-dim)">Trục trung tâm trước, hai cánh sau</div>
              <div class="stroke-rule-eg">Ví dụ: 小, 水, 木</div>
            </div>
          </div>
        </div>
      `;

      document.getElementById('btn-tab-start-quiz')?.addEventListener('click', () => {
        document.getElementById('btn-hw-quiz')?.click();
      });
    } else if (tabKey === 'etymology') {
      const story = ETYMOLOGY_DATA[currentChar] ||
        `Chữ「${currentChar}」là một thành phần chữ Hán quan trọng trong hệ thống Hán tự, biểu đạt ý nghĩa tượng hình hoặc hội ý sâu sắc qua cách kết hợp các nét vẽ truyền thống.`;

      contentEl.innerHTML = `
        <div class="etymology-card">
          <div class="etymology-header">
            <span>🔍</span>
            <span>Nguồn Gốc & Ý Nghĩa Cấu Tạo Chữ「${currentChar}」</span>
          </div>
          <p>${story}</p>
        </div>
      `;
    }
  }

  // Modal tabs click listeners
  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.modal-panel');
      panel?.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderModalTabContent(btn.dataset.mtab);
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
  window.HanziForge.speakChinese   = speakChinese;
  window.HanziForge.renderModalTabContent = renderModalTabContent;
  window.HanziForge.getCurrentWriter = () => currentWriter;
  window.HanziForge.getCurrentChar = () => currentChar;
  window.HanziForge.isSoundOn      = () => soundEnabled;
  window.HanziForge.isTraditional  = () => isTraditional;
  window.HanziForge.renderStats    = renderStats;

  console.log('[HanziForge] app.js loaded — tab navigation, UI controls & HanziWriter modal active');
})();
