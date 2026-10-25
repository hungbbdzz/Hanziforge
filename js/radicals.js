// HanziForge — Radical Learning Explorer Module (js/radicals.js)
// Supports 214+ KangXi radicals & variants, 5 semantic categories, diacritic-insensitive search,
// Allograph-aware compound lookup, and HanziWriter stroke animation/quiz.

class RadicalExplorer {
  constructor() {
    this.radicals = window.RADICALS_DATA || [];
    this.currentCategory = 'all';
    this.searchQuery = '';

    this.gridContainer = document.getElementById('radicals-grid-container');
    this.searchInput = document.getElementById('radical-search-input');
    this.filterButtons = document.querySelectorAll('.filter-btn');

    // Modal elements
    this.modal = document.getElementById('radical-detail-modal');
    this.modalChar = document.getElementById('modal-rad-char');
    this.modalName = document.getElementById('modal-rad-name');
    this.modalPinyin = document.getElementById('modal-rad-pinyin');
    this.modalMeaning = document.getElementById('modal-rad-meaning');
    this.modalStrokes = document.getElementById('modal-rad-strokes');
    this.modalDesc = document.getElementById('modal-rad-desc');
    this.modalExamples = document.getElementById('modal-rad-examples');
    this.modalCloseBtn = document.getElementById('btn-close-rad-modal');
    this.modalLearnBtn = document.getElementById('btn-modal-learn-rad');

    window.radicalExplorer = this;

    this.bindEvents();
    this.render();
  }

  normalizeText(str) {
    if (!str) return '';
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .trim();
  }

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.render();
      });
    }

    if (this.filterButtons) {
      this.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.filterButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentCategory = btn.dataset.category || 'all';
          window.soundEngine?.playTap();
          this.render();
        });
      });
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.gridContainer) {
      this.gridContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.radical-card');
        if (!card) return;
        const ch = card.dataset.char;
        const rad = this.radicals.find(r => r.character === ch);
        if (rad) this.openModal(rad);
      });
    }
  }

  render() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = '';

    const scriptMode = window.appState ? window.appState.getScriptMode() : 'simplified';
    const learnedSet = new Set((window.appState && window.appState.state && window.appState.state.learnedRadicals) || []);
    const qNorm = this.normalizeText(this.searchQuery);

    const filtered = this.radicals.filter(rad => {
      const pair = window.getTradSimpPair ? window.getTradSimpPair(rad.character) : { simplified: rad.character, traditional: rad.character };
      const displayChar = scriptMode === 'traditional' ? pair.traditional : pair.simplified;

      const matchCategory = this.currentCategory === 'all' || rad.category === this.currentCategory;
      const matchQuery = !qNorm ||
        rad.character.includes(this.searchQuery) ||
        displayChar.includes(this.searchQuery) ||
        pair.simplified.includes(this.searchQuery) ||
        pair.traditional.includes(this.searchQuery) ||
        this.normalizeText(rad.name).includes(qNorm) ||
        this.normalizeText(rad.pinyin).includes(qNorm) ||
        this.normalizeText(rad.meaning).includes(qNorm) ||
        this.normalizeText(rad.category).includes(qNorm);
      return matchCategory && matchQuery;
    });

    if (filtered.length === 0) {
      this.gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-dim);">
          <p style="font-size: 1.1rem;">Không tìm thấy bộ thủ nào phù hợp với từ khóa "${this.searchQuery}"</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach(rad => {
      const pair = window.getTradSimpPair ? window.getTradSimpPair(rad.character) : { simplified: rad.character, traditional: rad.character, isDifferent: false };
      const displayChar = scriptMode === 'traditional' ? pair.traditional : pair.simplified;
      const isLearned = learnedSet.has(rad.character) || learnedSet.has(displayChar);
      const variantNote = pair.isDifferent
        ? `<div class="rad-variant-note" style="font-size:0.75rem;color:var(--gold-primary);margin-top:2px;">${scriptMode === 'traditional' ? `Giản: ${pair.simplified}` : `Phồn: ${pair.traditional}`}</div>`
        : '';

      const card = document.createElement('div');
      card.className = `radical-card ${isLearned ? 'is-learned' : ''}`;
      card.dataset.char = rad.character;
      card.innerHTML = `
        <span class="rad-strokes">${rad.stroke_count} nét</span>
        ${isLearned ? `<span class="rad-learned-badge" title="Đã học">✓</span>` : ''}
        <div class="rad-char">${displayChar}</div>
        ${variantNote}
        <div class="rad-name">${rad.name}</div>
        <div class="rad-pinyin">${rad.pinyin || ''}</div>
        <div class="rad-meaning">${rad.meaning}</div>
      `;
      fragment.appendChild(card);
    });

    this.gridContainer.appendChild(fragment);
  }

  openModal(rad) {
    const scriptMode = window.appState ? window.appState.getScriptMode() : 'simplified';
    const pair = window.getTradSimpPair ? window.getTradSimpPair(rad.character) : { simplified: rad.character, traditional: rad.character, isDifferent: false };
    const displayChar = scriptMode === 'traditional' ? pair.traditional : pair.simplified;

    window.soundEngine?.playTap();
    window.soundEngine?.speakChinese(displayChar);

    if (this.modalChar) {
      this.modalChar.textContent = displayChar;
      this.modalChar.style.cursor = 'pointer';
      this.modalChar.onclick = () => window.soundEngine?.speakChinese(displayChar);
    }
    if (this.modalName) this.modalName.textContent = `Bộ ${rad.name}`;
    if (this.modalPinyin) this.modalPinyin.textContent = `Pinyin: ${rad.pinyin || '—'}`;
    if (this.modalMeaning) this.modalMeaning.textContent = `📖 Ý nghĩa: ${rad.meaning || ''}`;
    if (this.modalStrokes) {
      const variantText = pair.isDifferent ? ` • ${scriptMode === 'traditional' ? `Giản thể: ${pair.simplified}` : `Phồn thể: ${pair.traditional}`}` : '';
      const catText = rad.category ? ` • Nhóm: ${rad.category}` : '';
      this.modalStrokes.textContent = `${rad.stroke_count || 1} nét cơ bản${catText}${variantText}`;
    }
    if (this.modalDesc) this.modalDesc.textContent = rad.description || '';

    // ── HanziWriter Stroke Order Integration for Radicals ──
    const hwTarget   = document.getElementById('hanziwriter-rad-target');
    const hwWrap     = document.getElementById('rad-stroke-order-wrap');
    const hwStatus   = document.getElementById('rad-hw-status');
    const btnAnimate = document.getElementById('btn-rad-hw-animate');
    const btnQuiz    = document.getElementById('btn-rad-hw-quiz');
    const btnStop    = document.getElementById('btn-rad-hw-stop');

    if (window._hwRadInstance) {
      try { window._hwRadInstance.cancelQuiz(); } catch (e) {}
      window._hwRadInstance = null;
    }
    if (hwTarget) hwTarget.innerHTML = '';

    if (hwWrap && window.HanziWriter) {
      hwWrap.style.display = 'flex';
      if (hwStatus) hwStatus.textContent = 'Đang tải hoạt họa nét...';

      try {
        const writer = HanziWriter.create('hanziwriter-rad-target', displayChar, {
          width: 120,
          height: 120,
          padding: 5,
          strokeColor:      '#F59E0B',
          outlineColor:     'rgba(255,255,255,0.12)',
          radicalColor:     '#10B981',
          drawingColor:     '#FFFFFF',
          strokeAnimationSpeed: 0.8,
          delayBetweenStrokes: 300,
          showCharacter: false,
          showOutline: true,
          charDataLoader: (charToLoad, onComplete, onError) => {
            fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${encodeURIComponent(charToLoad)}.json`)
              .then(res => {
                if (res.ok) return res.json();
                throw new Error("Not in standard set");
              })
              .then(data => onComplete(data))
              .catch(() => {
                fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data-traditional@latest/${encodeURIComponent(charToLoad)}.json`)
                  .then(res => {
                    if (res.ok) return res.json();
                    throw new Error("Not in traditional set");
                  })
                  .then(data => onComplete(data))
                  .catch(err => {
                    if (onError) onError(err);
                  });
              });
          },
          onLoadCharDataSuccess: () => {
            if (hwStatus) hwStatus.textContent = 'Đang vẽ nét...';
            writer.animateCharacter();
          },
          onLoadCharDataError: () => {
            if (hwTarget) {
              hwTarget.innerHTML = `<div style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;font-family:var(--font-hanzi);font-size:3.8rem;color:var(--gold-light);">${displayChar}</div>`;
            }
            if (hwStatus) hwStatus.textContent = 'Bộ thủ cổ/biến thể (hiển thị mặt chữ)';
          }
        });
        window._hwRadInstance = writer;

        if (btnAnimate) btnAnimate.onclick = () => {
          try { writer.cancelQuiz(); } catch (e) {}
          writer.animateCharacter();
          if (hwStatus) hwStatus.textContent = 'Đang vẽ...';
        };
        if (btnQuiz) btnQuiz.onclick = () => {
          writer.quiz({
            onMistake: (strokeData) => {
              window.soundEngine?.playError();
              if (hwStatus) hwStatus.textContent = `Nét ${strokeData.strokeNum + 1}: Thử lại! (${strokeData.mistakesOnStroke} lỗi)`;
            },
            onCorrectStroke: (strokeData) => {
              window.soundEngine?.playTap();
              if (hwStatus) hwStatus.textContent = `✅ Nét ${strokeData.strokeNum + 1} đúng! (${strokeData.totalMistakes} lỗi tổng)`;
            },
            onComplete: (summary) => {
              window.soundEngine?.playSuccess();
              if (hwStatus) hwStatus.textContent = `🎉 Hoàn thành! Tổng lỗi: ${summary.totalMistakes}`;
              if (window.appState) window.appState.markRadicalLearned(rad.character);
              this.render();
            }
          });
          if (hwStatus) hwStatus.textContent = '✏️ Hãy vẽ nét theo thứ tự...';
        };
        if (btnStop) btnStop.onclick = () => {
          try { writer.cancelQuiz(); } catch (e) {}
          writer.hideCharacter();
          writer.showOutline();
          if (hwStatus) hwStatus.textContent = 'Đã dừng.';
        };
      } catch (err) {
        if (hwWrap) hwWrap.style.display = 'none';
      }
    } else if (hwWrap) {
      hwWrap.style.display = 'none';
    }

    // Allograph-aware Dynamic Compound Characters lookup from recipes map
    if (this.modalExamples) {
      this.modalExamples.innerHTML = '';
      const recipesMap = window.CRAFTING_RECIPES_MAP || {};
      const charDb = window.CHARACTERS_DB || {};
      const eqRads = window.getEquivalentRadicals ? window.getEquivalentRadicals(rad.character) : [rad.character];

      const seenChars = new Set();
      const pureChars = [];

      Object.values(recipesMap).forEach(r => {
        if (!r.parts || r.character === rad.character || seenChars.has(r.character)) return;
        if (!r.parts.some(p => eqRads.includes(p))) return;
        const code = r.character.charCodeAt(0);
        if (code >= 0x2E80 && code <= 0x2EFF) return;
        if (['扌', '⺮', '⺡', '刂', '阝', '亻', '冫', '氵', '灬', '犭', '礻', '衤'].includes(r.character)) return;
        seenChars.add(r.character);
        pureChars.push(r);
      });

      pureChars.sort((a, b) => {
        const hskA = window.getHskInfo ? window.getHskInfo(a.character).code : 7;
        const hskB = window.getHskInfo ? window.getHskInfo(b.character).code : 7;
        if (hskA !== hskB) return hskA - hskB;
        return a.character.length - b.character.length;
      });

      const related = pureChars.slice(0, 6);

      if (related.length === 0) {
        this.modalExamples.innerHTML = '<span style="color:var(--text-dim);font-size:0.85rem;grid-column:1/-1;">Chưa có chữ ghép phổ biến.</span>';
      } else {
        related.forEach(rec => {
          const dbInfo = charDb[rec.character] || {};
          const rawSino = dbInfo.sino_vietnamese || rec.sino_vietnamese || '';
          const hasValidSino = window.isValidSinoVietnamese ? window.isValidSinoVietnamese(rawSino, rec.character) : (rawSino && rawSino !== rec.character);
          const sinoText = hasValidSino ? rawSino.toUpperCase() : '';
          const cleanPinyin = window.convertNumberedPinyinToAccents ? window.convertNumberedPinyinToAccents(rec.pinyin || dbInfo.pinyin || '') : (rec.pinyin || '');
          const cleanMeaning = (rec.meaning || dbInfo.meaning || '').replace(/\(dạng kết hợp\)\s*/g, '').replace(/^\((.+)\)$/, '$1').trim();

          const chip = document.createElement('div');
          chip.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            padding: 0.35rem 0.6rem;
            cursor: pointer;
            transition: all 0.2s ease;
          `;
          chip.innerHTML = `
            <span style="font-family:var(--font-hanzi);font-size:1.5rem;color:var(--gold-light);line-height:1;font-weight:700;">${rec.character}</span>
            <div style="font-size:0.75rem;line-height:1.2;overflow:hidden;">
              <div style="font-weight:700;color:#fff;">${sinoText || rec.character} <span style="color:var(--gold-primary);font-size:0.7rem;">(${cleanPinyin})</span></div>
              <div style="color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;">${cleanMeaning || ''}</div>
            </div>
          `;
          chip.title = `Bấm để tra từ điển & từ ghép của chữ「${rec.character}」`;
          chip.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeModal();
            if (window.openVocabModal) {
              window.openVocabModal(rec.character);
            } else if (window.soundEngine) {
              window.soundEngine.speakChinese(rec.character);
            }
          });
          this.modalExamples.appendChild(chip);
        });
      }
    }

    const craftBtn = document.getElementById('btn-modal-craft-with-rad');
    if (craftBtn) {
      craftBtn.onclick = () => {
        this.closeModal();
        const builderTabBtn = document.querySelector('[data-tab="builder"]');
        if (builderTabBtn) builderTabBtn.click();

        if (window.hanziBuilder) {
          window.hanziBuilder.addTokenToCanvas(rad.character, rad.name || rad.character, rad.pinyin || '', 30, 50);
          window.showToast && window.showToast(`Đã đưa Bộ「${rad.name || rad.character}」lên khung ghép!`, 'success');
        }
      };
    }

    if (this.modalLearnBtn) {
      const isAlreadyLearned = window.appState && window.appState.state && window.appState.state.learnedRadicals.includes(rad.character);
      this.modalLearnBtn.textContent = isAlreadyLearned ? '✓ Đã nắm vững' : '✓ Đã học (+10 XP)';
      this.modalLearnBtn.onclick = () => {
        if (window.appState) {
          window.appState.markRadicalLearned(rad.character);
        }
        this.render();
        this.closeModal();
        if (window.showToast) {
          window.showToast(`Đã lưu bộ「${rad.character}」vào danh sách đã học! (+10 XP)`, 'success');
        }
      };
    }

    if (this.modal) this.modal.classList.add('active');
  }

  closeModal() {
    if (window._hwRadInstance) {
      try { window._hwRadInstance.cancelQuiz(); } catch (e) {}
      window._hwRadInstance = null;
    }
    if (this.modal) this.modal.classList.remove('active');
  }
}

window.RadicalExplorer = RadicalExplorer;
