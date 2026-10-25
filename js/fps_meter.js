// HanziForge — 60-144 FPS Performance Telemetry HUD (js/fps_meter.js)
// Real-time frame rate, frame time (ms), and DOM node counter with Alt+F shortcut

(function (root) {
  'use strict';

  class FpsMeter {
    constructor() {
      this.fps = 60;
      this.frameTime = 16.7;
      this.frames = 0;
      this.lastTime = performance.now();
      this.lastFrameTimestamp = this.lastTime;
      this.visible = false;
      this.rafId = null;
      this.hudEl = null;

      this.initDOM();
    }

    initDOM() {
      if (typeof document === 'undefined') return;
      const create = () => {
        if (document.getElementById('fps-telemetry-hud')) return;
        const hud = document.createElement('div');
        hud.id = 'fps-telemetry-hud';
        hud.className = 'fps-telemetry-hud';
        hud.title = 'Hiệu năng thời gian thực (Bấm Alt+F để ẩn/hiện)';
        hud.innerHTML = `
          <span class="fps-dot"></span>
          <span id="fps-val-text">60 FPS</span>
          <span class="fps-sep">•</span>
          <span id="fps-ms-text">16.6 ms</span>
        `;
        hud.addEventListener('click', () => this.toggle());
        document.body.appendChild(hud);
        this.hudEl = hud;
        this.fpsText = document.getElementById('fps-val-text');
        this.msText = document.getElementById('fps-ms-text');

        // Start monitoring loop
        this.visible = true;
        this.start();

        // Keyboard shortcut Alt+F to toggle visibility
        document.addEventListener('keydown', (e) => {
          if (e.altKey && (e.key === 'f' || e.key === 'F')) {
            e.preventDefault();
            this.toggle();
          }
        });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', create);
      } else {
        create();
      }
    }

    start() {
      if (this.rafId) return;
      const loop = (now) => {
        this.frames++;
        const dt = now - this.lastFrameTimestamp;
        this.lastFrameTimestamp = now;
        this.frameTime = this.frameTime * 0.85 + dt * 0.15;

        const elapsed = now - this.lastTime;
        if (elapsed >= 500) {
          this.fps = Math.min(240, Math.round((this.frames * 1000) / elapsed));
          this.frames = 0;
          this.lastTime = now;

          if (this.visible && this.fpsText && this.msText) {
            this.fpsText.textContent = `${this.fps} FPS`;
            this.msText.textContent = `${this.frameTime.toFixed(1)} ms`;
            if (this.hudEl) {
              this.hudEl.classList.toggle('fps-warn', this.fps < 45);
            }
          }
        }
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }

    toggle() {
      this.visible = !this.visible;
      if (this.hudEl) {
        this.hudEl.style.opacity = this.visible ? '0.88' : '0.25';
      }
    }
  }

  root.fpsMeter = new FpsMeter();

})(typeof window !== 'undefined' ? window : global);
