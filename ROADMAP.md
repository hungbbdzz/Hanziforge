# 📋 HanziForge — Weekly Development Roadmap

> **Course:** Special Topics in AI Product Development — VKU 2026  
> **Project:** AI-Assisted Chinese Character Learning Platform  
> **Repo:** github.com/hungbbdzz/Hanziforge

---

## 🗂️ Project Structure

```
hanziforge/
├── index.html           ← Single Page Application
├── ROADMAP.md           ← Weekly milestone plan
├── PRD.md               ← Product Requirements Document
├── css/style.css        ← Design system & all UI components
└── js/
    ├── app.js             ← Tab nav, modals, UI controller
    ├── radicals.js        ← 214 KangXi radicals palette & browser
    ├── builder.js         ← Canvas workspace & fusion engine
    ├── state.js           ← (Week 7) XP, levels, LocalStorage
    ├── audio.js           ← (Week 11) Web Speech API
    └── fps_meter.js       ← (Week 12) Performance HUD
```

---

## ✅ Completed (Weeks 1–3)

### Week 1 — 18/08/2026 | Ch.1: AI Introduction
**Commit:** `feat: initial project scaffold`
- HTML5 app structure: header, 3 sections (Builder, Radicals, Progress), 2 modals
- Dark Oriental design system: Imperial Red + Gold + Jade palette
- Google Fonts: Noto Serif SC, Plus Jakarta Sans, Cinzel
- Full CSS component library (palette, canvas, cards, modals, animations)
- Responsive 3-column Spatial Forge layout

### Week 2 — 25/08/2026 | Ch.1 Lab
**Commit:** `feat: add app controller — tab navigation and UI management`
- Tab switching: Builder ↔ Radicals ↔ Progress
- Modal open/close management (character detail + recipe book)
- Sound toggle & Simplified/Traditional script toggle (UI)
- Base user stats display
- Global `window.HanziForge` API surface for module communication

### Week 3 — 01/09/2026 | Ch.2: Prompt Engineering
**Commit:** `feat: add radical palette and canvas workspace`
- 96 KangXi radicals (strokes 1–5) with Sino-Vietnamese readings
- Search + stroke filter for both palette and grid view
- Drag-and-drop from palette onto Tianzige canvas
- Token repositioning via mouse drag within canvas
- Undo last placement
- 15 demo fusion recipes with result display
- Fusion history log
- Basic spatial layout detection preview (Trái–Phải / Trên–Dưới)

---

## 🚀 Upcoming (Weeks 4–13)

### Week 4 — 08/09/2026 | Ch.3: Requirement Analysis & PRD
**Planned commit:** `docs: add PRD and system architecture`
- [ ] `ROADMAP.md` update with user stories and acceptance criteria
- [ ] Full `SpatialGeometry` engine: 10 IDS topology patterns
  - `⿰` Left–Right, `⿱` Top–Bottom
  - `⿴⿵⿶⿷⿸⿹⿺` Surround variants
  - `⿲⿳` Three-part, `品` Triangle pyramid
- [ ] Full `CRAFTING_RECIPES_MAP`: 8,660 recipes from MakeMeAHanzi
- [ ] Particle burst fusion animation

### Week 5 — 15/09/2026 | Ch.4: Product Design & Prototype
**Planned commit:** `feat: integrate HanziWriter stroke animations`
- [ ] HanziWriter stroke order animation on all radical cards
- [ ] Interactive stroke quiz (draw character in correct order)
- [ ] Character detail modal fully wired: HanziWriter + HSK vocab

### Week 6 — 22/09/2026 | Ch.5: Software Architecture
**Planned commit:** `feat: character detail modal — full vocabulary and sentences`
- [ ] HSK Level 1–6 compound vocabulary per character
- [ ] Accented Pinyin display
- [ ] CVDICT Vietnamese definitions (basic subset)
- [ ] System architecture documentation update

### Week 7 — 29/09/2026 | Ch.6: AI Coding
**Planned commit:** `feat: game state — XP, levels, streak, save/load`
- [ ] `js/state.js` — LocalStorage persistence
- [ ] XP award on successful fusion (+10 XP)
- [ ] Level calculation (every 100 XP = 1 level)
- [ ] Daily streak tracker
- [ ] Export / Import JSON save file

### Week 8 — 06/10/2026 | Ch.6 cont.
**Planned commit:** `feat: full CVDICT data — 9,574 Hanzi with Vietnamese definitions`
- [ ] Integrate `hanzi_data_runtime.js` (214 radicals + 8,660 recipes + 9,574 Hanzi)
- [ ] Bi-directional Simplified ↔ Traditional toggle (wire `chinese_variants.js`)
- [ ] Unlocked characters grid in Progress section

### Week 9 — 13/10/2026 | Ch.7: Code Refactoring
**Planned commit:** `refactor: eliminate inline styles, restructure modules`
- [ ] Remove all `style="..."` attributes from HTML and JS
- [ ] Separate engine logic from UI rendering in `builder.js`
- [ ] Add JSDoc comments to all public functions
- [ ] Code smell detection and cleanup

### Week 10 — 20/10/2026 | Ch.8: Software Testing
**Planned commit:** `test: unit tests for spatial engine and data validation`
- [ ] Unit tests for `SpatialGeometry` layout detection
- [ ] Data integrity checks for recipe map
- [ ] Test cases for edge cases (3-token pyramid, overlaid characters)

### Week 11 — 27/10/2026 | Ch.9: Technical Documentation
**Planned commit:** `feat: bilingual sentence corpus + audio pronunciation`
- [ ] Integrate `sentences_db.js` — 253,427 parallel CN-VI sentences
- [ ] `js/audio.js` — Web Speech API pronunciation
- [ ] Finalize `HANZIFORGE_SYSTEM_DOCS.md`

### Week 12 — 03/11/2026 | Polish
**Planned commit:** `feat: PWA + performance optimization`
- [ ] Service Worker for offline capability
- [ ] `js/fps_meter.js` — real-time FPS monitoring HUD
- [ ] CSS containment optimization
- [ ] PWA manifest + installable on desktop

### Week 13 — 10/11/2026 | Final Prep
**Planned commit:** `chore: final polish, README update, presentation prep`
- [ ] Update README with all features
- [ ] Final UI polish and bug fixes
- [ ] Demo recording / screenshots

---

## 📊 Chapter → Feature Mapping

| Chapter | Topic | Reflected in Project |
|---------|-------|---------------------|
| Ch.1 | AI Intro & LLM | Entire project built with Gemini |
| Ch.2 | Prompt Engineering | Data generation, code scaffolding via prompts |
| Ch.3 | Requirement Analysis | This ROADMAP, user stories, PRD |
| Ch.4 | Product Design | UI/UX, wireframe → prototype |
| Ch.5 | Software Architecture | System docs, module design |
| Ch.6 | AI Coding | JS engine, data pipeline |
| Ch.7 | Code Refactoring | Week 9 cleanup sprint |
| Ch.8 | Testing | Week 10 unit tests |
| Ch.9 | Documentation | Week 11 final docs |
| Ch.10 | Final Presentation | Week 13 demo |
