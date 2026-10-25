// HanziForge — Web Audio FX Synthesizer & Native Speech Engine (js/audio.js)
// Zero-dependency procedural Oriental sound effects + Web Speech API TTS

(function (root) {
  'use strict';

  class SoundEngine {
    constructor() {
      this.enabled = true;
      this.ctx = null;
      try {
        const saved = localStorage.getItem('hanziforge_sound_enabled');
        if (saved !== null) {
          this.enabled = saved === 'true';
        }
      } catch (e) {}
    }

    _getContext() {
      if (!this.enabled) return null;
      if (!this.ctx) {
        const AudioCtx = root.AudioContext || root.webkitAudioContext;
        if (AudioCtx) {
          try {
            this.ctx = new AudioCtx();
          } catch (e) {
            return null;
          }
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    setEnabled(val) {
      this.enabled = Boolean(val);
      try {
        localStorage.setItem('hanziforge_sound_enabled', String(this.enabled));
      } catch (e) {}
      if (!this.enabled && 'speechSynthesis' in root) {
        try { root.speechSynthesis.cancel(); } catch (e) {}
      }
      return this.enabled;
    }

    toggle() {
      return this.setEnabled(!this.enabled);
    }

    // Crisp wooden/jade tile tap sound
    playTap() {
      const ctx = this._getContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.045);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } catch (e) {}
    }

    // Harmonious pentatonic chime on successful character fusion (C5 - E5 - G5 - C6)
    playSuccess() {
      const ctx = this._getContext();
      if (!ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const start = ctx.currentTime + idx * 0.065;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.14, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.36);
        });
      } catch (e) {}
    }

    // Subtle alert tone for reversed/invalid placement
    playError() {
      const ctx = this._getContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.15);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.17);
      } catch (e) {}
    }

    // Native Chinese TTS pronunciation via Web Speech API
    speakChinese(text) {
      if (!text || !this.enabled) return;
      if (!('speechSynthesis' in root) || typeof SpeechSynthesisUtterance === 'undefined') return;
      try {
        root.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const isTrad = root.appState && root.appState.getScriptMode && root.appState.getScriptMode() === 'traditional';
        utterance.lang = isTrad ? 'zh-TW' : 'zh-CN';
        utterance.rate = 0.88;
        utterance.pitch = 1.0;

        const voices = root.speechSynthesis.getVoices ? root.speechSynthesis.getVoices() : [];
        if (voices && voices.length > 0) {
          const preferred = voices.find(v => v.lang === utterance.lang) ||
                            voices.find(v => v.lang && v.lang.startsWith('zh')) ||
                            voices.find(v => v.name && /chinese|mandarin|普通话|國語/i.test(v.name));
          if (preferred) utterance.voice = preferred;
        }
        root.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis notice:', e);
      }
    }
  }

  root.soundEngine = new SoundEngine();

})(typeof window !== 'undefined' ? window : global);
