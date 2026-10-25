/**
 * HanziForge — Main Application Controller & Linguistic Helper Engine (js/app.js)
 * Coordinates Tab Navigation, Synergy Inverted Index, Pinyin Tone Converter,
 * Vocab/HanziWriter Inspector Modal, Script Mode Toggle, and Progress Dashboard.
 */

(function (root) {
  'use strict';

  // ── 1. Numbered Pinyin to Tone Marks Converter (e.g. "yi1 zui4" -> "yī zuì") ──
  const TONE_MAP = {
    a: ['ā', 'á', 'ǎ', 'à', 'a'],
    e: ['ē', 'é', 'ě', 'è', 'e'],
    i: ['ī', 'í', 'ǐ', 'ì', 'i'],
    o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
    u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
    v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    A: ['Ā', 'Á', 'Ǎ', 'À', 'A'],
    E: ['Ē', 'É', 'Ě', 'È', 'E'],
    I: ['Ī', 'Í', 'Ǐ', 'Ì', 'I'],
    O: ['Ō', 'Ó', 'Ǒ', 'Ò', 'O'],
    U: ['Ū', 'Ú', 'Ǔ', 'Ù', 'U']
  };

  function convertSyllable(syllable) {
    const m = syllable.match(/^([a-zA-ZüÜ:]+)([1-5])$/);
    if (!m) return syllable.replace(/u:|v/g, 'ü');
    let base = m[1].replace(/u:|v/g, 'ü').replace(/U:|V/g, 'Ü');
    const toneIdx = parseInt(m[2], 10) - 1;
    if (toneIdx < 0 || toneIdx > 4) return base;

    // Standard Pinyin vowel priority rules: a > e > ou > last vowel
    for (const v of ['a', 'A', 'e', 'E']) {
      if (base.includes(v)) {
        return base.replace(v, TONE_MAP[v][toneIdx]);
      }
    }
    if (base.toLowerCase().includes('ou')) {
      const oChar = base.includes('O') ? 'O' : 'o';
      return base.replace(oChar, TONE_MAP[oChar][toneIdx]);
    }
    for (let i = base.length - 1; i >= 0; i--) {
      const ch = base[i];
      if (TONE_MAP[ch]) {
        return base.slice(0, i) + TONE_MAP[ch][toneIdx] + base.slice(i + 1);
      }
    }
    return base;
  }

  function convertNumberedPinyinToAccents(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .split(/(\s+|[,;/])/)
      .map(token => (/^[a-zA-ZüÜ:]+[1-5]$/.test(token) ? convertSyllable(token) : token))
      .join('');
  }

  // ── 2. Radical Allograph Equivalence & O(1) Smart Synergy Inverted Index ──────
  function getEquivalentRadicals(char) {
    if (!char) return [];
    const set = new Set([char]);
    if (root.ALLOGRAPH_MAP && root.ALLOGRAPH_MAP[char]) {
      root.ALLOGRAPH_MAP[char].forEach(c => set.add(c));
    }
    if (root.getTradSimpPair) {
      const pair = root.getTradSimpPair(char);
      if (pair.simplified) {
        set.add(pair.simplified);
        if (root.ALLOGRAPH_MAP && root.ALLOGRAPH_MAP[pair.simplified]) {
          root.ALLOGRAPH_MAP[pair.simplified].forEach(c => set.add(c));
        }
      }
      if (pair.traditional) {
        set.add(pair.traditional);
        if (root.ALLOGRAPH_MAP && root.ALLOGRAPH_MAP[pair.traditional]) {
          root.ALLOGRAPH_MAP[pair.traditional].forEach(c => set.add(c));
        }
      }
    }
    return Array.from(set);
  }

  let _synergyOneIndex = null; // Map<part, Set<partner>>
  let _synergyTwoIndex = null; // Map<"p1|p2", Array<{ missingPart, targetChar, targetName, layoutName }>>

  function ensureSynergyIndex() {
    if (_synergyOneIndex && _synergyTwoIndex) return;
    _synergyOneIndex = new Map();
    _synergyTwoIndex = new Map();

    const recipesMap = root.CRAFTING_RECIPES_MAP || {};
    const addOne = (a, b) => {
      if (!_synergyOneIndex.has(a)) _synergyOneIndex.set(a, new Set());
      _synergyOneIndex.get(a).add(b);
    };

    const addTwo = (a, b, info) => {
      const key = [a, b].sort().join('|');
      if (!_synergyTwoIndex.has(key)) _synergyTwoIndex.set(key, []);
      const arr = _synergyTwoIndex.get(key);
      if (!arr.some(x => x.targetChar === info.targetChar && x.missingPart === info.missingPart)) {
        arr.push(info);
      }
    };

    Object.values(recipesMap).forEach(rec => {
      const parts = rec.parts || [];
      if (parts.length === 2) {
        const [p1, p2] = parts;
        const eq1 = getEquivalentRadicals(p1);
        const eq2 = getEquivalentRadicals(p2);
        eq1.forEach(a => {
          eq2.forEach(b => {
            addOne(a, b);
            addOne(b, a);
          });
        });
      } else if (parts.length === 3) {
        const [p1, p2, p3] = parts;
        const eq1 = getEquivalentRadicals(p1);
        const eq2 = getEquivalentRadicals(p2);
        const eq3 = getEquivalentRadicals(p3);

        // Single part synergy
        eq1.forEach(a => { eq2.forEach(b => { addOne(a, b); addOne(b, a); }); });
        eq1.forEach(a => { eq3.forEach(c => { addOne(a, c); addOne(c, a); }); });
        eq2.forEach(b => { eq3.forEach(c => { addOne(b, c); addOne(c, b); }); });

        // Pair -> 3rd part near-complete hints
        const targetName = rec.sino_vietnamese && rec.sino_vietnamese !== rec.character
          ? `[${rec.sino_vietnamese.toUpperCase()}]`
          : (rec.meaning || '');
        const layoutName = rec.layout_name || rec.layout || '';

        eq1.forEach(a => eq2.forEach(b => addTwo(a, b, { missingPart: p3, targetChar: rec.character, targetName, layoutName })));
        eq1.forEach(a => eq3.forEach(c => addTwo(a, c, { missingPart: p2, targetChar: rec.character, targetName, layoutName })));
        eq2.forEach(b => eq3.forEach(c => addTwo(b, c, { missingPart: p1, targetChar: rec.character, targetName, layoutName })));
      }
    });
  }

  function getCompatibleParts(placedParts) {
    ensureSynergyIndex();
    const result = new Set();
    if (!placedParts || placedParts.length === 0) return result;

    if (placedParts.length === 1) {
      const eqs = getEquivalentRadicals(placedParts[0]);
      eqs.forEach(p => {
        const partners = _synergyOneIndex.get(p);
        if (partners) {
          partners.forEach(partner => {
            result.add(partner);
            getEquivalentRadicals(partner).forEach(eqP => result.add(eqP));
          });
        }
      });
    } else if (placedParts.length === 2) {
      const eq1 = getEquivalentRadicals(placedParts[0]);
      const eq2 = getEquivalentRadicals(placedParts[1]);
      eq1.forEach(a => {
        eq2.forEach(b => {
          const key = [a, b].sort().join('|');
          const hints = _synergyTwoIndex.get(key);
          if (hints) {
            hints.forEach(h => {
              result.add(h.missingPart);
              getEquivalentRadicals(h.missingPart).forEach(eqM => result.add(eqM));
            });
          }
        });
      });
    }
    return result;
  }

  function getNearCompleteHints(placedParts) {
    ensureSynergyIndex();
    if (!placedParts || placedParts.length !== 2) return [];
    const results = [];
    const seen = new Set();
    const eq1 = getEquivalentRadicals(placedParts[0]);
    const eq2 = getEquivalentRadicals(placedParts[1]);

    eq1.forEach(a => {
      eq2.forEach(b => {
        const key = [a, b].sort().join('|');
        const list = _synergyTwoIndex.get(key);
        if (list) {
          list.forEach(item => {
            if (!seen.has(item.targetChar)) {
              seen.add(item.targetChar);
              results.push(item);
            }
          });
        }
      });
    });
    return results;
  }

  // ── 3. Toast Notification System ─────────────────────────────────────────────
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container || !message) return;

    const icons = {
      success: '✨',
      warning: '⚠️',
      error: '❌',
      info: '💡'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${icons[type] || '💡'}</span>
      <span>${message}</span>
    `;

    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    };

    toast.addEventListener('click', dismiss);
    container.appendChild(toast);

    // Cap max visible toasts at 4
    while (container.children.length > 4) {
      container.firstElementChild.remove();
    }

    setTimeout(dismiss, 3200);
  }

  // ── 4. Vocab & Character Inspector Modal (#hanzi-vocab-modal) ────────────────
  let _vocabHwInstance = null;
  let _currentVocabChar = null;

  function openVocabModal(rawChar) {
    if (!rawChar) return;
    const modal = document.getElementById('hanzi-vocab-modal');
    if (!modal) return;

    const scriptMode = root.appState ? root.appState.getScriptMode() : 'simplified';
    const pair = root.getTradSimpPair
      ? root.getTradSimpPair(rawChar)
      : { simplified: rawChar, traditional: rawChar, isDifferent: false };
    const displayChar = scriptMode === 'traditional' ? pair.traditional : pair.simplified;
    _currentVocabChar = displayChar;

    const db = root.CHARACTERS_DB || {};
    const rads = root.RADICALS_DATA || [];
    const recipesMap = root.CRAFTING_RECIPES_MAP || {};

    const charInfo = db[rawChar] || db[pair.simplified] || db[pair.traditional] || {};
    const radInfo = rads.find(r => r.character === rawChar || r.character === pair.simplified) || {};
    const recipeEntry = Object.values(recipesMap).find(
      r => r.character === rawChar || r.character === pair.simplified || r.character === pair.traditional
    );

    if (root.soundEngine) {
      root.soundEngine.playTap();
      root.soundEngine.speakChinese(displayChar);
    }

    // 1. Header fields
    const elChar = document.getElementById('vocab-modal-char');
    const elName = document.getElementById('vocab-modal-name');
    const elHsk = document.getElementById('vocab-modal-hsk');
    const elPinyin = document.getElementById('vocab-modal-pinyin');
    const elStrokes = document.getElementById('vocab-modal-strokes');
    const elVariant = document.getElementById('vocab-modal-variant');
    const elMeaning = document.getElementById('vocab-modal-meaning');
    const elMnemonic = document.getElementById('vocab-modal-mnemonic');

    if (elChar) {
      elChar.textContent = displayChar;
      elChar.onclick = () => root.soundEngine && root.soundEngine.speakChinese(displayChar);
    }

    const rawSino = charInfo.sino_vietnamese || radInfo.name || (recipeEntry && recipeEntry.sino_vietnamese) || '';
    const validSino = root.isValidSinoVietnamese
      ? root.isValidSinoVietnamese(rawSino, displayChar)
      : (rawSino && rawSino !== displayChar);
    if (elName) {
      elName.textContent = validSino ? `Hán Việt: ${rawSino.toUpperCase()}` : `Chữ Hán: ${displayChar}`;
    }

    const hskInfo = root.getHskInfo ? root.getHskInfo(displayChar) : { levelText: 'Hán Tự', code: 7 };
    if (elHsk) {
      elHsk.textContent = hskInfo.levelText;
    }

    const rawPy = charInfo.pinyin || radInfo.pinyin || (recipeEntry && recipeEntry.pinyin) || '';
    const cleanPy = convertNumberedPinyinToAccents(rawPy);
    if (elPinyin) {
      elPinyin.textContent = `Pinyin: ${cleanPy || '—'}`;
    }

    const strokes = charInfo.stroke_count || radInfo.stroke_count || 1;
    const mainRad = charInfo.radical || radInfo.character || displayChar;
    const mainRadObj = rads.find(r => r.character === mainRad);
    const mainRadLabel = mainRadObj ? `Bộ ${mainRadObj.name} (${mainRad})` : `Bộ thủ ${mainRad}`;
    if (elStrokes) {
      elStrokes.textContent = `${strokes} nét • ${mainRadLabel}`;
    }

    if (elVariant) {
      if (pair.isDifferent) {
        elVariant.style.display = 'inline-block';
        elVariant.style.cssText = 'display:inline-block;font-size:0.76rem;padding:0.15rem 0.55rem;border-radius:999px;background:rgba(245,158,11,0.14);color:var(--gold-light);border:1px solid rgba(245,158,11,0.35);';
        elVariant.textContent = scriptMode === 'traditional'
          ? `Giản thể: ${pair.simplified}`
          : `Phồn thể: ${pair.traditional}`;
      } else {
        elVariant.style.display = 'none';
      }
    }

    // 2. Meaning & Etymology
    const rawMeaning = (charInfo.meaning || radInfo.meaning || (recipeEntry && recipeEntry.meaning) || 'Hán tự tiêu chuẩn')
      .replace(/\(dạng kết hợp\)\s*/g, '')
      .replace(/^\((.+)\)$/, '$1')
      .trim();
    if (elMeaning) {
      elMeaning.textContent = `📖 Ý nghĩa: ${rawMeaning}`;
    }

    const compsForStory = recipeEntry && recipeEntry.parts
      ? recipeEntry.parts.map(p => {
          const rObj = rads.find(x => x.character === p);
          return { radical: p, name: rObj ? rObj.name : p, meaning: rObj ? rObj.meaning : '' };
        })
      : [];
    const story = root.getEtymologyStory
      ? root.getEtymologyStory({ character: displayChar, sino_vietnamese: rawSino, meaning: rawMeaning }, compsForStory, charInfo)
      : (charInfo.mnemonic || radInfo.description || '');
    if (elMnemonic) {
      elMnemonic.innerHTML = story;
    }

    // 3. HanziWriter Stroke Animation & Interactive Quiz
    const hwTarget = document.getElementById('hanziwriter-target');
    const hwWrap = document.getElementById('vocab-stroke-order-wrap');
    const hwStatus = document.getElementById('vocab-hw-status');
    const btnAnimate = document.getElementById('btn-hw-animate');
    const btnQuiz = document.getElementById('btn-hw-quiz');
    const btnStop = document.getElementById('btn-hw-stop');

    if (_vocabHwInstance) {
      try { _vocabHwInstance.cancelQuiz(); } catch (e) {}
      _vocabHwInstance = null;
    }
    if (hwTarget) hwTarget.innerHTML = '';

    if (hwWrap && root.HanziWriter && hwTarget) {
      hwWrap.style.display = 'flex';
      if (hwStatus) hwStatus.textContent = 'Đang tải hoạt họa nét...';

      try {
        const writer = root.HanziWriter.create('hanziwriter-target', displayChar, {
          width: 120,
          height: 120,
          padding: 5,
          strokeColor: '#F59E0B',
          outlineColor: 'rgba(255,255,255,0.14)',
          radicalColor: '#10B981',
          drawingColor: '#FFFFFF',
          strokeAnimationSpeed: 0.9,
          delayBetweenStrokes: 260,
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
            if (hwStatus) hwStatus.textContent = 'Đang vẽ thứ tự nét...';
            writer.animateCharacter();
          },
          onLoadCharDataError: () => {
            hwTarget.innerHTML = `<div style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;font-family:var(--font-hanzi);font-size:4rem;color:var(--gold-light);">${displayChar}</div>`;
            if (hwStatus) hwStatus.textContent = 'Chữ cổ / Hiển thị mặt chữ tiêu chuẩn';
          }
        });
        _vocabHwInstance = writer;

        if (btnAnimate) {
          btnAnimate.onclick = () => {
            try { writer.cancelQuiz(); } catch (e) {}
            writer.animateCharacter();
            if (hwStatus) hwStatus.textContent = 'Đang vẽ thứ tự nét...';
          };
        }
        if (btnQuiz) {
          btnQuiz.onclick = () => {
            writer.quiz({
              onMistake: (strokeData) => {
                if (root.soundEngine) root.soundEngine.playError();
                if (hwStatus) hwStatus.textContent = `❌ Nét ${strokeData.strokeNum + 1} chưa chuẩn — thử lại! (${strokeData.mistakesOnStroke} lỗi)`;
              },
              onCorrectStroke: (strokeData) => {
                if (root.soundEngine) root.soundEngine.playTap();
                if (hwStatus) hwStatus.textContent = `✅ Nét ${strokeData.strokeNum + 1} chính xác!`;
              },
              onComplete: (summary) => {
                if (root.soundEngine) root.soundEngine.playSuccess();
                if (hwStatus) hwStatus.textContent = `🎉 Hoàn thành bút thuận! (Tổng lỗi: ${summary.totalMistakes}) +15 XP`;
                if (root.appState) {
                  root.appState.recordQuiz(1, 1);
                }
                showToast(`Hoàn thành luyện viết chữ「${displayChar}」! (+10 XP)`, 'success');
              }
            });
            if (hwStatus) hwStatus.textContent = '✏️ Dùng chuột/cảm ứng tô theo thứ tự nét...';
          };
        }
        if (btnStop) {
          btnStop.onclick = () => {
            try { writer.cancelQuiz(); } catch (e) {}
            writer.hideCharacter();
            writer.showOutline();
            if (hwStatus) hwStatus.textContent = 'Đã dừng.';
          };
        }
      } catch (e) {
        hwTarget.innerHTML = `<div style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;font-family:var(--font-hanzi);font-size:4rem;color:var(--gold-light);">${displayChar}</div>`;
      }
    } else if (hwTarget) {
      hwTarget.innerHTML = `<div style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;font-family:var(--font-hanzi);font-size:4rem;color:var(--gold-light);">${displayChar}</div>`;
      if (hwStatus) hwStatus.textContent = "Chế độ Offline: Hiển thị mặt chữ tiêu chuẩn";
    }

    // 4. Populate Compounds (#vocab-modal-compounds)
    const compoundsContainer = document.getElementById('vocab-modal-compounds');
    if (compoundsContainer) {
      compoundsContainer.innerHTML = '';
      const rawCompounds = charInfo.compounds || [];
      const seenWords = new Set();
      const cleanCompounds = [];

      rawCompounds.forEach(cp => {
        if (!cp || !cp.word) return;
        const w = scriptMode === 'traditional' && root.toTraditional
          ? root.toTraditional(cp.word)
          : (root.toSimplified ? root.toSimplified(cp.word) : cp.word);
        if (seenWords.has(w)) return;
        seenWords.add(w);
        cleanCompounds.push({
          word: w,
          pinyin: convertNumberedPinyinToAccents(cp.pinyin || ''),
          meaning: (cp.meaning || '').replace(/\|[^\s]+/g, '').replace(/\[[a-z0-9\s]+\]/gi, '').trim()
        });
      });

      if (cleanCompounds.length === 0) {
        compoundsContainer.innerHTML = `<div style="color:var(--text-dim);font-size:0.84rem;padding:0.4rem 0;">Chữ đơn độc lập / chưa có cụm từ ghép mở rộng.</div>`;
      } else {
        cleanCompounds.slice(0, 6).forEach(cp => {
          const item = document.createElement('div');
          item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:0.75rem;background:rgba(255,255,255,0.04);border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:0.5rem 0.75rem;cursor:pointer;transition:all 0.15s ease;';
          item.innerHTML = `
            <div>
              <span style="font-family:var(--font-hanzi);font-size:1.15rem;font-weight:700;color:var(--gold-light);margin-right:0.45rem;">${cp.word}</span>
              <span style="font-size:0.8rem;color:var(--gold-primary);">[${cp.pinyin}]</span>
              <div style="font-size:0.82rem;color:var(--text-muted);margin-top:0.15rem;">${cp.meaning}</div>
            </div>
            <span style="font-size:0.85rem;color:var(--text-dim);">🔊</span>
          `;
          item.addEventListener('click', () => {
            if (root.soundEngine) {
              root.soundEngine.playTap();
              root.soundEngine.speakChinese(cp.word);
            }
          });
          compoundsContainer.appendChild(item);
        });
      }
    }

    // 5. Populate Bilingual Sentences (#vocab-modal-sentences)
    const sentencesContainer = document.getElementById('vocab-modal-sentences');
    const sentencesCount = document.getElementById('vocab-modal-sentences-count');
    if (sentencesContainer) {
      sentencesContainer.innerHTML = '';
      const sentences = root.getSentencesForCharacter ? root.getSentencesForCharacter(displayChar) : [];
      if (sentencesCount) {
        sentencesCount.textContent = `${sentences.length} câu`;
      }
      sentences.forEach((s, idx) => {
        const card = document.createElement('div');
        card.className = 'forge-sentence-card';
        card.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:var(--radius-sm);padding:0.55rem 0.75rem;cursor:pointer;transition:all 0.15s ease;';
        card.innerHTML = `
          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:0.5rem;">
            <span style="font-family:var(--font-hanzi);font-size:0.98rem;color:#fff;font-weight:600;">${idx + 1}. ${s.zh}</span>
            <span style="font-size:0.75rem;color:var(--gold-primary);">🔊</span>
          </div>
          ${s.py ? `<div style="font-size:0.78rem;color:var(--gold-light);opacity:0.85;margin-top:0.15rem;">${s.py}</div>` : ''}
          <div style="font-size:0.82rem;color:#cbd5e1;margin-top:0.15rem;">${s.vi}</div>
        `;
        card.addEventListener('click', () => {
          if (root.soundEngine) {
            root.soundEngine.playTap();
            root.soundEngine.speakChinese(s.zh);
          }
        });
        sentencesContainer.appendChild(card);
      });
    }

    // 6. Action Buttons (#btn-vocab-craft-char & #btn-vocab-speak)
    const btnCraft = document.getElementById('btn-vocab-craft-char');
    if (btnCraft) {
      btnCraft.onclick = () => {
        closeVocabModal();
        switchTab('builder');
        if (root.hanziBuilder) {
          if (recipeEntry && recipeEntry.parts && recipeEntry.parts.length >= 2) {
            root.hanziBuilder.loadRecipeOntoBoard(recipeEntry);
          } else {
            root.hanziBuilder.clearCanvas();
            root.hanziBuilder.addTokenToCanvas(displayChar, rawSino || displayChar, cleanPy, 50, 50);
            showToast(`Đã đặt chữ「${displayChar}」lên khung Tianzige!`, 'success');
          }
        }
      };
    }

    const btnSpeak = document.getElementById('btn-vocab-speak');
    if (btnSpeak) {
      btnSpeak.onclick = () => {
        if (root.soundEngine) root.soundEngine.speakChinese(displayChar);
      };
    }

    modal.classList.add('active');
  }

  function closeVocabModal() {
    if (_vocabHwInstance) {
      try { _vocabHwInstance.cancelQuiz(); } catch (e) {}
      _vocabHwInstance = null;
    }
    const modal = document.getElementById('hanzi-vocab-modal');
    if (modal) modal.classList.remove('active');
  }

  // ── 5. Tab Navigation & UI Controller ────────────────────────────────────────
  function switchTab(targetTab) {
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    const sections = document.querySelectorAll('.view-section');

    tabBtns.forEach(btn => {
      const active = btn.dataset.tab === targetTab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    sections.forEach(sec => {
      sec.classList.toggle('active', sec.id === `section-${targetTab}`);
    });

    if (root.soundEngine) root.soundEngine.playTap();
    if (targetTab === 'progress') {
      renderStats();
    }
  }

  // ── 6. Header & Progress Dashboard Synchronization ───────────────────────────
  function renderStats() {
    if (!root.appState) return;
    const state = root.appState.state;
    const levelInfo = root.appState.getUserLevel();
    const unlockedChars = root.appState.getUnlockedCharactersList();
    const learnedRads = state.learnedRadicals || [];
    const totalCharsCount = root.CHARACTERS_DB ? Object.keys(root.CHARACTERS_DB).length : 9574;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    // Header pills
    set('header-streak-days', `${state.streakDays || 1} ngày`);
    set('header-xp-val', `${state.xp || 0} XP`);
    set('header-level-badge', `Cấp ${levelInfo.level}`);

    // Section 3: Progress Dashboard cards
    set('dash-chars-count', `${unlockedChars.length} / ${totalCharsCount.toLocaleString()}`);
    set('dash-rads-count', `${learnedRads.length} / 214`);
    set('dash-streak-count', `${state.streakDays || 1} ngày`);
    set('dash-total-xp', `${state.xp || 0} XP (Cấp ${levelInfo.level})`);

    // Render unlocked characters grid (#dash-completed-grid)
    const grid = document.getElementById('dash-completed-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (unlockedChars.length === 0) {
      grid.innerHTML = `
        <div style="color:var(--text-dim);font-size:0.88rem;padding:1rem 0;">
          Chưa có chữ Hán nào được chế tác. Hãy sang tab <b>⚒️ Không Gian Ghép Chữ</b> và ghép thử <b>人 + 木 → 休</b>!
        </div>
      `;
      return;
    }

    const db = root.CHARACTERS_DB || {};
    const scriptMode = root.appState.getScriptMode();
    const fragment = document.createDocumentFragment();

    unlockedChars.forEach(ch => {
      const pair = root.getTradSimpPair ? root.getTradSimpPair(ch) : { simplified: ch, traditional: ch };
      const disp = scriptMode === 'traditional' ? pair.traditional : pair.simplified;
      const info = db[ch] || db[pair.simplified] || {};
      const sv = info.sino_vietnamese && info.sino_vietnamese !== ch ? info.sino_vietnamese.toUpperCase() : '';
      const py = convertNumberedPinyinToAccents(info.pinyin || '');

      const badge = document.createElement('div');
      badge.className = 'unlocked-char-chip';
      badge.style.cssText = 'display:flex;align-items:center;gap:0.55rem;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.35);border-radius:var(--radius-md);padding:0.45rem 0.8rem;cursor:pointer;transition:all 0.2s ease;';
      badge.title = `Bấm để xem chi tiết & tập viết chữ「${disp}」`;
      badge.innerHTML = `
        <span style="font-family:var(--font-hanzi);font-size:1.75rem;color:var(--gold-light);font-weight:800;line-height:1;">${disp}</span>
        <div style="line-height:1.25;">
          <div style="font-size:0.78rem;font-weight:700;color:#fff;">${sv || disp} <span style="color:var(--gold-primary);font-weight:600;">${py ? `(${py})` : ''}</span></div>
          <div style="font-size:0.72rem;color:var(--text-muted);max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${info.meaning || ''}</div>
        </div>
      `;
      badge.addEventListener('click', () => openVocabModal(ch));
      fragment.appendChild(badge);
    });

    grid.appendChild(fragment);
  }

  // ── 7. Initialize Application on DOM Ready ───────────────────────────────────
  function initApp() {
    // Wire top navigation tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Instantiate core modules
    if (root.HanziBuilder && !root.hanziBuilder) {
      root.hanziBuilder = new root.HanziBuilder();
    }
    if (root.RadicalExplorer && !root.radicalExplorer) {
      root.radicalExplorer = new root.RadicalExplorer();
    }

    // Wire Sound Toggle Button
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn && root.soundEngine) {
      const updateSoundUI = (on) => {
        soundBtn.textContent = on ? '🔊' : '🔇';
        soundBtn.title = on ? 'Tắt âm thanh' : 'Bật âm thanh';
      };
      updateSoundUI(root.soundEngine.enabled);
      soundBtn.addEventListener('click', () => {
        const isOn = root.soundEngine.toggle();
        updateSoundUI(isOn);
        if (isOn) root.soundEngine.playTap();
        showToast(isOn ? 'Đã bật hiệu ứng âm thanh & phát âm' : 'Đã tắt âm thanh', 'info');
      });
    }

    // Wire Script Mode Toggle Button (Simplified <-> Traditional)
    const scriptBtn = document.getElementById('btn-toggle-script');
    if (scriptBtn && root.appState) {
      const updateScriptUI = (mode) => {
        const isTrad = mode === 'traditional';
        scriptBtn.textContent = isTrad ? '🇹🇼 Phồn thể' : '🇨🇳 Giản thể';
        scriptBtn.classList.toggle('trad', isTrad);
      };
      updateScriptUI(root.appState.getScriptMode());

      scriptBtn.addEventListener('click', () => {
        const nextMode = root.appState.toggleScriptMode();
        updateScriptUI(nextMode);
        if (root.soundEngine) root.soundEngine.playTap();

        // Re-render all views dynamically in the new script mode
        if (root.hanziBuilder) {
          root.hanziBuilder.renderPalette(
            root.hanziBuilder.paletteSearch ? root.hanziBuilder.paletteSearch.value.trim() : ''
          );
          if (root.hanziBuilder.currentCraftedChar) {
            root.hanziBuilder.renderDetailResult(root.hanziBuilder.currentCraftedChar);
          }
          if (root.hanziBuilder.codexModal && root.hanziBuilder.codexModal.classList.contains('active')) {
            root.hanziBuilder.renderCodexGrid();
          }
        }
        if (root.radicalExplorer) {
          root.radicalExplorer.render();
        }
        renderStats();
        showToast(
          nextMode === 'traditional'
            ? 'Đã chuyển sang chế độ chữ Hán Phồn thể (繁體中文)'
            : 'Đã chuyển sang chế độ chữ Hán Giản thể (简体中文)',
          'info'
        );
      });
    }

    // Wire Vocab Modal backdrop & close button
    const vocabModal = document.getElementById('hanzi-vocab-modal');
    if (vocabModal) {
      vocabModal.addEventListener('click', (e) => {
        if (e.target === vocabModal) closeVocabModal();
      });
    }
    document.getElementById('btn-close-vocab-modal')?.addEventListener('click', closeVocabModal);
    document.getElementById('btn-close-rad-modal')?.addEventListener('click', () => {
      if (root.radicalExplorer) root.radicalExplorer.closeModal();
    });

    // Global Escape key closes any active modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeVocabModal();
        if (root.radicalExplorer) root.radicalExplorer.closeModal();
        if (root.hanziBuilder) root.hanziBuilder.closeCodex();
      }
    });

    // Wire Offline Save / Export / Import / Reset buttons
    const btnExport = document.getElementById('btn-export-save');
    const btnImport = document.getElementById('btn-import-save');
    const btnReset = document.getElementById('btn-reset-save');
    const fileInput = document.getElementById('save-file-input');

    if (btnExport) {
      btnExport.addEventListener('click', () => {
        if (!root.appState) return;
        const res = root.appState.exportSaveFile();
        if (res.success) {
          if (root.soundEngine) root.soundEngine.playSuccess();
          showToast('💾 Đã xuất tập tin sao lưu tiến độ thành công!', 'success');
        } else {
          showToast('Lỗi khi xuất file lưu: ' + res.error, 'error');
        }
      });
    }

    if (btnImport && fileInput) {
      btnImport.addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target && evt.target.result;
          if (typeof content === 'string' && root.appState) {
            const res = root.appState.importSaveFile(content);
            if (res.success) {
              if (root.soundEngine) root.soundEngine.playSuccess();
              if (root.hanziBuilder && root.hanziBuilder.restoreCraftedFromState) {
                root.hanziBuilder.restoreCraftedFromState();
              }
              renderStats();
              showToast(`🎉 Đã khôi phục tiến độ (${res.count} chữ Hán đã mở khóa)!`, 'success');
            } else {
              showToast('Lỗi nạp file lưu: ' + res.error, 'error');
            }
          }
        };
        reader.readAsText(file);
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (!root.appState) return;
        root.appState.resetProgress();
        if (root.hanziBuilder && root.hanziBuilder.restoreCraftedFromState) {
          root.hanziBuilder.restoreCraftedFromState();
          root.hanziBuilder.clearCanvas();
        }
        renderStats();
        showToast('🔄 Đã đặt lại tiến độ học tập về mặc định.', 'warning');
      });
    }

    // Subscribe to state changes
    if (root.appState) {
      root.appState.subscribe(renderStats);
      renderStats();
    }

    // Register Service Worker for offline PWA capability if over HTTP/HTTPS
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  // Export globals expected by builder.js and radicals.js
  root.convertNumberedPinyinToAccents = convertNumberedPinyinToAccents;
  root.getEquivalentRadicals = getEquivalentRadicals;
  root.getCompatibleParts = getCompatibleParts;
  root.getNearCompleteHints = getNearCompleteHints;
  root.showToast = showToast;
  root.openVocabModal = openVocabModal;
  root.closeVocabModal = closeVocabModal;

  root.HanziForge = {
    switchTab,
    openVocabModal,
    closeVocabModal,
    showToast,
    renderStats,
    convertNumberedPinyinToAccents,
    getCompatibleParts,
    getNearCompleteHints
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})(typeof window !== 'undefined' ? window : global);
