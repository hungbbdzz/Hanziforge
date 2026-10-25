// HanziForge — State Management Store (js/state.js)
// LocalStorage persistence, accurate local-date streak calculation, XP/Level progression & JSON Backup

const DEFAULT_STATE = {
  learnedRadicals: ["亻", "木", "氵"],
  completedCharacters: [], // ["char_休", "char_明", ...]
  flashcardProgress: {},    // { "char_休": "mastered" }
  scriptMode: 'simplified', // 'simplified' (Giản thể) | 'traditional' (Phồn thể)
  quizStats: {
    totalPlayed: 0,
    totalCorrect: 0,
    bestScore: 0,
    history: []
  },
  xp: 120,
  streakDays: 3,
  lastActiveDate: null
};

function getLocalDateString(dateObj = new Date()) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

class StateStore {
  constructor() {
    this.key = 'hanziforge_storage_v1';
    this.subscribers = [];
    this.state = this.loadState();
    this.checkStreak();
  }

  getScriptMode() {
    return this.state.scriptMode || 'simplified';
  }

  setScriptMode(mode) {
    this.state.scriptMode = mode === 'traditional' ? 'traditional' : 'simplified';
    this.saveState();
  }

  toggleScriptMode() {
    const nextMode = this.getScriptMode() === 'simplified' ? 'traditional' : 'simplified';
    this.setScriptMode(nextMode);
    return nextMode;
  }

  loadState() {
    try {
      const data = localStorage.getItem(this.key);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          learnedRadicals: Array.isArray(parsed.learnedRadicals) ? [...parsed.learnedRadicals] : [...DEFAULT_STATE.learnedRadicals],
          completedCharacters: Array.isArray(parsed.completedCharacters) ? [...parsed.completedCharacters] : []
        };
      }
    } catch (e) {
      console.warn("Error loading localStorage state:", e);
    }
    return {
      ...DEFAULT_STATE,
      learnedRadicals: [...DEFAULT_STATE.learnedRadicals],
      completedCharacters: [],
      lastActiveDate: getLocalDateString()
    };
  }

  saveState() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.state));
    } catch (e) {
      console.warn("Error saving localStorage state:", e);
    }
    this.notifySubscribers();
  }

  checkStreak() {
    const todayStr = getLocalDateString();
    const lastStr = this.state.lastActiveDate;

    if (!lastStr) {
      this.state.lastActiveDate = todayStr;
      this.state.streakDays = Math.max(1, this.state.streakDays || 1);
      this.saveState();
      return;
    }

    if (lastStr !== todayStr) {
      const todayDate = new Date(todayStr + 'T00:00:00');
      const lastDate = new Date(lastStr + 'T00:00:00');
      const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day! Increment streak and award daily login bonus
        this.state.streakDays = (this.state.streakDays || 1) + 1;
        this.addXP(15);
      } else if (diffDays > 1) {
        // Missed one or more days — reset streak to 1
        this.state.streakDays = 1;
      }
      this.state.lastActiveDate = todayStr;
      this.saveState();
    }
  }

  markCharacterCompleted(charId) {
    if (!charId) return false;
    const normalizedId = charId.startsWith('char_') ? charId : `char_${charId}`;
    if (!this.state.completedCharacters.includes(normalizedId)) {
      this.state.completedCharacters.push(normalizedId);
      this.addXP(25);
      this.saveState();
      return true;
    }
    return false;
  }

  markRadicalLearned(radicalChar) {
    if (!radicalChar) return false;
    if (!this.state.learnedRadicals.includes(radicalChar)) {
      this.state.learnedRadicals.push(radicalChar);
      this.addXP(10);
      this.saveState();
      return true;
    }
    return false;
  }

  updateFlashcard(charId, status) {
    this.state.flashcardProgress[charId] = status;
    if (status === 'mastered') {
      this.addXP(15);
    }
    this.saveState();
  }

  recordQuiz(score, total) {
    this.state.quizStats.totalPlayed++;
    this.state.quizStats.totalCorrect += score;
    if (score > this.state.quizStats.bestScore) {
      this.state.quizStats.bestScore = score;
    }
    this.state.quizStats.history.push({
      date: new Date().toISOString(),
      score,
      total
    });
    this.addXP(score * 10);
    this.saveState();
  }

  addXP(amount) {
    this.state.xp = Math.max(0, (this.state.xp || 0) + amount);
  }

  getUserLevel() {
    const xp = this.state.xp || 0;
    const level = Math.floor(xp / 100) + 1;
    const currentLevelXp = xp % 100;
    return { level, currentLevelXp, nextLevelXp: 100 };
  }

  isCompleted(charId) {
    if (!this.state || !this.state.completedCharacters) return false;
    const raw = charId.replace(/^char_/, '');
    return this.state.completedCharacters.includes(`char_${raw}`) ||
           this.state.completedCharacters.includes(raw);
  }

  getUnlockedCharactersList() {
    if (!this.state || !Array.isArray(this.state.completedCharacters)) return [];
    return this.state.completedCharacters.map(id => id.replace(/^char_/, '')).filter(Boolean);
  }

  // ── Offline Game Save / Export / Import ──────────────────────────────────
  exportSaveFile() {
    try {
      const payload = {
        app: "HanziForge",
        version: "2.0",
        exportedAt: new Date().toISOString(),
        saveData: this.state
      };
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hanziforge_save_${getLocalDateString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (err) {
      console.error("Export save failed:", err);
      return { success: false, error: err.message };
    }
  }

  importSaveFile(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      const data = parsed.saveData || parsed;
      if (!data || typeof data !== 'object') {
        throw new Error("Tập tin lưu không đúng định dạng HanziForge!");
      }
      this.state = {
        ...DEFAULT_STATE,
        ...data,
        completedCharacters: Array.isArray(data.completedCharacters) ? data.completedCharacters : [],
        learnedRadicals: Array.isArray(data.learnedRadicals) ? data.learnedRadicals : [...DEFAULT_STATE.learnedRadicals],
        xp: typeof data.xp === 'number' ? data.xp : 0,
        streakDays: typeof data.streakDays === 'number' ? data.streakDays : 1,
        lastActiveDate: getLocalDateString()
      };
      this.saveState();
      return { success: true, count: this.state.completedCharacters.length };
    } catch (err) {
      console.error("Import save failed:", err);
      return { success: false, error: err.message };
    }
  }

  resetProgress() {
    this.state = {
      ...DEFAULT_STATE,
      learnedRadicals: [...DEFAULT_STATE.learnedRadicals],
      completedCharacters: [],
      lastActiveDate: getLocalDateString()
    };
    this.saveState();
  }

  subscribe(callback) {
    if (!this.subscribers) this.subscribers = [];
    this.subscribers.push(callback);
  }

  notifySubscribers() {
    if (this.subscribers) {
      this.subscribers.forEach(cb => {
        try { cb(this.state); } catch (e) { console.warn(e); }
      });
    }
  }
}

window.appState = new StateStore();
