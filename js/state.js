// HanziForge - State Management Store

const DEFAULT_STATE = {
  learnedRadicals: ["亻", "木", "氵"],
  completedCharacters: [], // ["xiu1", "ming2", ...]
  flashcardProgress: {},    // { "xiu1": "mastered", "ming2": "learning" }
  scriptMode: 'simplified', // 'simplified' (Giản thể) | 'traditional' (Phồn thể)
  quizStats: {
    totalPlayed: 0,
    totalCorrect: 0,
    bestScore: 0,
    history: []
  },
  xp: 120,
  streakDays: 3,
  lastActiveDate: new Date().toISOString().slice(0, 10)
};

class StateStore {
  constructor() {
    this.key = 'hanziforge_storage_v1';
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
        return { ...DEFAULT_STATE, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn("Error loading localStorage state:", e);
    }
    return { ...DEFAULT_STATE };
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
    const today = new Date().toISOString().slice(0, 10);
    if (this.state.lastActiveDate !== today) {
      this.state.lastActiveDate = today;
      this.saveState();
    }
  }

  markCharacterCompleted(charId) {
    if (!this.state.completedCharacters.includes(charId)) {
      this.state.completedCharacters.push(charId);
      this.addXP(25);
      this.saveState();
    }
  }

  markRadicalLearned(radicalChar) {
    if (!this.state.learnedRadicals.includes(radicalChar)) {
      this.state.learnedRadicals.push(radicalChar);
      this.addXP(10);
      this.saveState();
    }
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
    this.state.xp = (this.state.xp || 0) + amount;
  }

  getUserLevel() {
    const xp = this.state.xp || 0;
    const level = Math.floor(xp / 100) + 1;
    const currentLevelXp = xp % 100;
    return { level, currentLevelXp, nextLevelXp: 100 };
  }

  isCompleted(charId) {
    if (!this.state || !this.state.completedCharacters) return false;
    return this.state.completedCharacters.includes(charId);
  }

  // ── Offline Game Save / Export / Import ──────────────────────────────────
  exportSaveFile() {
    try {
      const payload = {
        app: "HanziForge",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        saveData: this.state
      };
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hanziforge_save_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch(err) {
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
        learnedRadicals: Array.isArray(data.learnedRadicals) ? data.learnedRadicals : DEFAULT_STATE.learnedRadicals,
        xp: typeof data.xp === 'number' ? data.xp : 0,
        streakDays: typeof data.streakDays === 'number' ? data.streakDays : 1
      };
      this.saveState();
      return { success: true, count: this.state.completedCharacters.length };
    } catch(err) {
      console.error("Import save failed:", err);
      return { success: false, error: err.message };
    }
  }

  resetProgress() {
    this.state = { ...DEFAULT_STATE };
    this.saveState();
  }

  subscribe(callback) {
    if (!this.subscribers) this.subscribers = [];
    this.subscribers.push(callback);
  }

  notifySubscribers() {
    if (this.subscribers) {
      this.subscribers.forEach(cb => cb(this.state));
    }
  }
}

window.appState = new StateStore();

