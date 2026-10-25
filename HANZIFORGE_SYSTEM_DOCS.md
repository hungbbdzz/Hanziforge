# 🏛️ HANZIFORGE SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION
> **Project:** HanziForge — Interactive 2D Spatial Hanzi Fusion Platform  
> **Version:** Big Data Runtime v2.0 (Full Sino-Vietnamese & 2D Spatial Engine)  
> **Updated:** August 2026

---

## 📑 TABLE OF CONTENTS
1. [Project Overview & Core Objectives](#1-project-overview--core-objectives)
2. [Data Sources & Ingestion Pipeline](#2-data-sources--ingestion-pipeline)
3. [Big Data Processing Architecture](#3-big-data-processing-architecture)
4. [2D Spatial Geometry Engine](#4-2d-spatial-geometry-engine)
5. [Recursive Compound Crafting Engine](#5-recursive-compound-crafting-engine)
6. [Runtime Data Design & UI/UX Systems](#6-runtime-data-design--uiux-systems)
7. [Project Directory Structure & File Map](#7-project-directory-structure--file-map)

---

## 1. PROJECT OVERVIEW & CORE OBJECTIVES

### 1.1. Context & Motivation
Traditional Chinese character learning often relies on rote memorization. However, over 95% of Chinese characters are structurally composed of **214 KangXi Radicals** assembled according to well-defined spatial topologies (Left–Right, Top–Bottom, Surroundings, Triangular Pyramids, etc.).

International datasets (such as *MakeMeAHanzi*) provide 9,574 decomposed characters but present critical barriers:
1. **Language Barrier:** English-only definitions and etymological mnemonics.
2. **Missing Sino-Vietnamese (Âm Hán Việt):** Crucial mnemonic anchor for Vietnamese learners.
3. **Static IDS representations:** Static character decomposition strings (`⿰木木`, `⿱十口`) lacking interactive 2D spatial engagement.

### 1.2. Delivered Solution
- **2D Freeform Canvas Engine:** Spatial fusion algorithm operating in real-time ($O(1)$ lookup).
- **100% Sino-Vietnamese Coverage:** Extracted from the **Unicode Consortium (Unihan)** database.
- **CVDICT Integration (122,591 entries):** Providing **99.2% authentic Vietnamese definition coverage**.
- **Full KangXi 214 Radicals & Positional Variants:** (`亻`, `氵`, `灬`, `扌`, `忄`, `犭`, `礻`, `衤`, `⺮`, `阝`, `辶`...).
- **253,000+ Clean Bilingual Sentence Corpus:** Multi-domain authentic sentence examples covering 6,800+ characters.

---

## 2. DATA SOURCES & INGESTION PIPELINE

```
┌─────────────────────────┐   ┌──────────────────────────┐   ┌─────────────────────────┐
│   MakeMeAHanzi Dataset  │   │ Unicode Consortium Unihan│   │   CVDICT Database (u8)  │
│  (9,574 JSONL Hanzi)    │   │  (Unihan_Readings.txt)   │   │  (122,591 Entries)      │
│ - Structural IDS syntax │   │ - 8,305 kVietnamese tags │   │ - Full Vietnamese defs  │
│ - Pinyin, stroke counts │   │ - Standard UTF-32 points │   │ - Trad/Simp mappings    │
└────────────┬────────────┘   └────────────┬─────────────┘   └────────────┬────────────┘
             │                             │                              │
             └──────────────────────┬──────┴──────────────────────────────┘
                                    ▼
                 ┌──────────────────────────────────────┐
                 │    scripts/build_data.ps1 Pipeline   │
                 │ - Two-Pass Non-Surname Semantic Pick │
                 │ - Spatial Layout Formula Parser      │
                 │ - 214 Radical Canonical Normalizer   │
                 └──────────────────┬───────────────────┘
                                    ▼
                 ┌──────────────────────────────────────┐
                 │     data/hanzi_data_runtime.js       │
                 │ • RADICALS_DATA (214 KangXi rads)    │
                 │ • CRAFTING_RECIPES_MAP (8,660 recipes│
                 │ • CHARACTERS_DB (9,574 Hanzi records)│
                 └──────────────────────────────────────┘
```

1. **MakeMeAHanzi (`data/dictionary.txt` - 2.5 MB):** 9,574 JSONL records detailing character composition, strokes, and IDS sequences.
2. **Unicode Unihan (`data/unihan/Unihan_Readings.txt` - 8.8 MB):** Official Unicode Consortium database parsing `kVietnamese` tags.
3. **CVDICT Database (`data/CVDICT.u8` - 10.8 MB):** Comprehensive Chinese-Vietnamese dictionary with 122k entries.
4. **Master Sentence Corpus (`data/cmn_vie_sentences.tsv` - 23.7 MB):** 253,427 sanitized parallel sentences from Tatoeba, WikiMatrix, and TED2020.

---

## 3. BIG DATA PROCESSING ARCHITECTURE

### Phase 1: Sino-Vietnamese Standardization
- Scans `Unihan_Readings.txt`, extracts `kVietnamese` codes, converts `U+XXXX` to UTF-32.
- Normalizes primary readings to TitleCase (e.g., `hưu` $\to$ `Hưu`, `minh` $\to$ `Minh`).

### Phase 2: Two-Pass Semantic Filter
- **Challenge:** Dictionaries often assign "Surname" (`họ [Shan1]`, `họ [Mu4]`) as the first definition.
- **Two-Pass Algorithm:**
  1. *Pass 1 (Collect):* Harvest all definitions separated by `/` into a character list.
  2. *Pass 2 (Filter & Pick Best):* Strip diacritics to detect prefixes (`ho `, `ten `, `viet tat cua `). Bypass surnames, prioritizing real noun/verb/adjective meanings (`山` $\to$ `núi; đồi`, `木` $\to$ `cây, gỗ`).
  3. Achieves **99.2% authentic Vietnamese semantic coverage**.

### Phase 3: IDS Layout Parsing & 8,660 Recipe Synthesis
Synthesizes IDS strings into $O(1)$ fast-lookup spatial keys:

| IDS Symbol | Spatial Layout Name | System Layout Code | Example Hanzi | Formula Key |
|:---:|:---|:---|:---|:---|
| `⿰` | Left — Right | `LEFT_RIGHT` | `休`, `明`, `好`, `林`, `语` | `LEFT_RIGHT:亻+木 -> 休` |
| `⿱` | Top — Bottom | `TOP_BOTTOM` | `安`, `字`, `古`, `炎`, `森` | `TOP_BOTTOM:十+口 -> 古` |
| `⿴` | Full Surround | `SURROUND` | `国`, `回`, `园`, `图` | `SURROUND:囗+玉 -> 国` |
| `⿵` | Top Surround | `SURROUND_TOP` | `闪`, `间`, `问`, `闭` | `SURROUND_TOP:门+人 -> 闪` |
| `⿶` | Bottom Surround | `SURROUND_BOTTOM` | `凶`, `画`, `幽` | `SURROUND_BOTTOM:凵+乂 -> 凶` |
| `⿷` | Left Surround | `SURROUND_LEFT` | `区`, `匠`, `巨` | `SURROUND_LEFT:匚+乂 -> 区` |
| `⿸` | Top-Left Surround | `SURROUND_TOPLEFT` | `病`, `床`, `屋`, `房` | `SURROUND_TOPLEFT:疒+丙 -> 病` |
| `⿹` | Top-Right Surround | `SURROUND_TOPRIGHT` | `包`, `句`, `氧`, `气` | `SURROUND_TOPRIGHT:勹+巳 -> 包` |
| `⿺` | Bottom-Left Surround | `SURROUND_BOTTOMLEFT` | `这`, `远`, `道`, `起` | `SURROUND_BOTTOMLEFT:辶+文 -> 这` |
| `⿻` | Overlaid / Intersecting | `OVERLAID` | `东`, `巫`, `乘`, `爽` | `OVERLAID:木+一 -> 未` |
| `⿲` | Three-Part Horizontal | `THREE_PART_H` | `湖`, `树`, `做` | `THREE_PART_H:氵+古+月 -> 湖` |
| `⿳` | Three-Part Vertical | `THREE_PART_V` | `鼻`, `曼`, `京` | `THREE_PART_V:自+田+廾 -> 鼻` |
| `品` | Triangular Pyramid | `TRIANGLE_PYRAMID` | `众`, `森`, `品`, `晶`, `焱` | `TRIANGLE_PYRAMID:木+木+木 -> 森` |

---

## 4. 2D SPATIAL GEOMETRY ENGINE

Implemented in `SpatialGeometry` (`js/builder.js`), operating in real-time as users drag tokens across the canvas:

### 4.1. Coordinate System & Geometry Vectors
Each token is positioned by normalized canvas percentages $(x_i, y_i) \in [0, 100] \times [0, 100]$.
- **Euclidean Distance:** $d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$
- **Axis Deltas:** $\Delta x = x_2 - x_1, \quad \Delta y = y_2 - y_1$

### 4.2. Layout Decision Tree
```
Token Count on Canvas:
├── 2 Tokens:
│   ├── Token in SURROUND_FULL_RADS (囗) and d ≤ 38%? ➔ SURROUND
│   ├── Token in SURROUND_TOP_RADS (门, 冂) and |Δx| ≤ 32%, Δy > -10%? ➔ SURROUND_TOP
│   ├── Token in SURROUND_TOPLEFT_RADS (疒, 广, 尸, 户...) and d ≤ 46%? ➔ SURROUND_TOPLEFT
│   ├── Token in SURROUND_BOTTOMLEFT_RADS (辶, 走, 廴...) and d ≤ 46%? ➔ SURROUND_BOTTOMLEFT
│   ├── Token in SURROUND_TOPRIGHT_RADS (勹, 气, 几...) and d ≤ 46%? ➔ SURROUND_TOPRIGHT
│   ├── |Δx| ≥ |Δy|? ➔ LEFT_RIGHT
│   └── |Δy| > |Δx|? ➔ TOP_BOTTOM
│
└── 3 Tokens:
    ├── Pyramid pattern (Top: y < 45%; Bottom 2: y > 45%, x₁ < 50 < x₂)? ➔ TRIANGLE_PYRAMID
    ├── Vertical progression (Low Δx, strictly increasing Y)? ➔ THREE_PART_V
    └── Horizontal progression (Low Δy, strictly increasing X)? ➔ THREE_PART_H
```

---

## 5. RECURSIVE COMPOUND CRAFTING ENGINE

```
[Tier 0: Base Radicals]       [Tier 1: Intermediate Character]       [Tier 2: Complex Character]
    人 + 人            ───►            从 (Tùng)             ───►       从 + 人 ───► 众 (Chúng)
    木 + 木            ───►            林 (Lâm)              ───►       林 + 木 ───► 森 (Sâm)
    十 + 口            ───►            古 (Cổ)               ───►   氵 + 古 + 月 ───► 湖 (Hồ)
```

- **Auto-Harvesting:** Successfully crafted characters are automatically cataloged into the **`⭐ Crafted Tokens`** tab.
- **Instant Reusability:** Players can immediately drag crafted characters back onto the canvas as ingredients for advanced recipes.

---

## 6. RUNTIME DATA DESIGN & UI/UX SYSTEMS

### 6.1. Character Information Architecture
1. **Sino-Vietnamese Name:** Capitalized Vietnamese reading (`Thủy`, `Hỏa`, `Hưu`, `Minh`, `Sâm`...).
2. **Standard Pinyin:** Accented tones (`shuǐ`, `huǒ`, `xiū`, `míng`, `sēn`...).
3. **Authentic Vietnamese Definitions:** Concise CVDICT meanings (`Nước, chất lỏng`, `Nghỉ ngơi, hưu trí`...).
4. **Etymology & Mnemonic Story:** Visual storytelling explaining the ideographic components.
5. **HSK Categorization & Sentence Examples:** Real-world bilingual example sentences.

### 6.2. 60–144 FPS Performance Optimization
- **CSS Containment:** `contain: content;` applied to high-volume modal lists to isolate DOM reflows.
- **Lightweight Glassmorphism:** Opaque and translucent layers replacing GPU-heavy `backdrop-filter: blur()`.
- **NFD Normalization:** 4-in-1 search matching unaccented, accented, pinyin, and Hanzi in $< 1\text{ms}$.

---

## 7. PROJECT DIRECTORY STRUCTURE & FILE MAP

```
Chuyên đề 4/
├── index.html                       # HTML5 Single Page Application
├── HANZIFORGE_SYSTEM_DOCS.md        # Technical System Specification (This file)
├── PROJECT_ROADMAP.md               # Milestones, Completed Tasks & Future Roadmap
├── css/
│   └── style.css                    # Dark Slate & Amber Gold Theme (60-144 FPS Optimized)
├── js/
│   ├── app.js                       # Navigation, Pinyin conversion, Modal controllers
│   ├── builder.js                   # 2D Spatial Geometry Engine, 1-Click Fusion, Codex
│   ├── radicals.js                  # 214 KangXi Radicals, HanziWriter stroke animation & quiz
│   ├── audio.js                     # Web Speech API & Sound synthesizer
│   ├── fps_meter.js                 # Real-time FPS monitoring HUD
│   └── state.js                     # LocalStorage sync, XP, Level, Save/Load JSON Engine
├── data/
│   ├── hanzi_data_runtime.js        # [Runtime] 214 Radicals, 8,660 Recipes, 9,574 Hanzi records
│   ├── sentences_db.js              # [Runtime] 6,814 Hanzi with 100% clean bilingual examples
│   ├── chinese_variants.js          # [Runtime] Bi-directional Simplified <-> Traditional engine
│   ├── hsk_etymology.js             # [Runtime] HSK Levels 1-6 & Mnemonic Etymology records
│   ├── cmn_vie_sentences.tsv        # [Master Data] 253,427 clean parallel sentence corpus
│   ├── CVDICT.u8                    # [Raw Source] CC-CEDICT Vietnamese Dictionary (122k entries)
│   ├── dictionary.txt               # [Raw Source] MakeMeAHanzi Decomposition Records (9.5k chars)
│   └── unihan/
│       └── Unihan_Readings.txt      # [Raw Source] Official Unicode Consortium kVietnamese dataset
└── scripts/
    ├── build_data.ps1               # PowerShell Pipeline: Unihan + CVDICT + IDS -> HanziForge DB
    └── export_runtime.ps1           # PowerShell Pipeline: Packs databases into hanzi_data_runtime.js
```
