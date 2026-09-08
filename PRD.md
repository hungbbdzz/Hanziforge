# 📄 Product Requirements Document (PRD)
## HanziForge — Interactive Chinese Character Learning Platform

> **Course:** Special Topics in AI Product Development — VKU 2026  
> **Version:** 1.0  
> **Date:** September 2026  
> **Author:** AI-assisted (Google Gemini) — Ch.3 Requirement Analysis Lab

---

## 1. Product Discovery

### 1.1 Problem Statement

Học chữ Hán theo phương pháp truyền thống (ghi nhớ máy móc từng chữ) đang gặp các vấn đề cốt lõi:

| Vấn đề | Tác động |
|--------|----------|
| Không hiểu cấu trúc chữ | Học viên quên nhanh vì thiếu liên kết có nghĩa |
| Tài liệu toàn tiếng Anh | Rào cản với người Việt, mất mnemonic tự nhiên |
| Thiếu âm Hán Việt | Người Việt không tận dụng được vốn từ gốc Hán sẵn có |
| Học thụ động (nhìn → nhớ) | Không có tương tác, dễ chán, retention thấp |
| Flash card không giải thích | Không trả lời được "tại sao chữ này lại có hình dạng như vậy?" |

### 1.2 Target Users

**Primary:** Sinh viên/người đi làm Việt Nam (18–30 tuổi) đang học tiếng Trung từ A0–B2.

**Secondary:** Người Việt đang ôn HSK 1–4 muốn củng cố từ gốc Hán.

### 1.3 Value Proposition

> **HanziForge biến việc học chữ Hán thành trò chơi ghép chữ không gian 2D** — người dùng *tự tay* lắp ráp các bộ thủ theo không gian, hiểu tại sao 人 + 木 = 休 (người dựa vào cây → nghỉ ngơi).

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Người dùng hiểu cấu trúc Hanzi | Tỷ lệ nhận ra bộ thủ trong chữ mới | ≥ 70% sau 10 buổi |
| Tăng retention từ vựng | Recall rate sau 7 ngày | ≥ 60% (vs ~30% truyền thống) |
| Engagement | Session length trung bình | ≥ 8 phút |
| Progression | Số chữ ghép thành công / tuần | ≥ 20 chữ |

---

## 3. User Stories & Acceptance Criteria

### Epic 1: Khám phá bộ thủ (Radical Discovery)

**US-01** — *Là học viên, tôi muốn xem toàn bộ 214 bộ thủ Khang Hy cùng âm Hán Việt và nghĩa tiếng Việt để hiểu các thành phần cơ bản của chữ Hán.*

| Acceptance Criteria | Priority |
|---------------------|----------|
| Hiển thị đủ 214 bộ thủ dạng grid | Must Have |
| Mỗi card có: chữ Hán, âm Hán Việt (Thủy, Hỏa...), Pinyin, nghĩa Việt, số nét | Must Have |
| Lọc theo số nét (1–5+) | Must Have |
| Tìm kiếm theo Hán/Pinyin/Hán Việt/nghĩa | Must Have |
| Click vào card → mở modal chi tiết với animation nét | Should Have |

---

**US-02** — *Là học viên, tôi muốn xem animation thứ tự nét và tự luyện viết bộ thủ để ghi nhớ sâu hơn.*

| Acceptance Criteria | Priority |
|---------------------|----------|
| HanziWriter animation cho tất cả 214 bộ thủ | Must Have |
| Chế độ quiz: tự vẽ đúng thứ tự nét | Should Have |
| Phản hồi đúng/sai ngay lập tức | Should Have |

---

### Epic 2: Ghép chữ không gian 2D (Spatial Fusion)

**US-03** — *Là học viên, tôi muốn kéo thả các bộ thủ lên canvas và hệ thống tự nhận diện cách ghép để tôi hiểu cấu trúc không gian của chữ Hán.*

| Acceptance Criteria | Priority |
|---------------------|----------|
| Kéo bộ thủ từ palette vào canvas Tianzige | Must Have |
| Tối đa 3 token cùng lúc | Must Have |
| Di chuyển tự do token trên canvas | Must Have |
| Hệ thống nhận diện 10 layout IDS (⿰ ⿱ ⿴ ⿵ ⿶ ⿷ ⿸ ⿹ ⿺ ⿻) | Must Have |
| Hiển thị label layout theo thời gian thực | Should Have |
| Nút Undo | Should Have |

---

**US-04** — *Là học viên, tôi muốn nhấn "Dung Hợp" và hệ thống tra ra chữ Hán kết quả cùng nghĩa tiếng Việt để xác nhận việc ghép.*

| Acceptance Criteria | Priority |
|---------------------|----------|
| Lookup trong 8,660 công thức từ MakeMeAHanzi | Must Have |
| Hiển thị: chữ kết quả, âm Hán Việt, Pinyin, nghĩa Việt | Must Have |
| Animation particle burst khi ghép thành công | Nice to Have |
| Lưu vào lịch sử ghép (session) | Should Have |
| Chữ mới ghép được thêm vào palette → dùng tiếp | Should Have |

---

### Epic 3: Từ điển & Tra cứu (Vocabulary)

**US-05** — *Là học viên, tôi muốn xem định nghĩa tiếng Việt đầy đủ, từ vựng HSK và câu ví dụ song ngữ cho mỗi chữ Hán.*

| Acceptance Criteria | Priority |
|---------------------|----------|
| Định nghĩa từ CVDICT (122,591 entries) | Must Have |
| Phân loại HSK 1–6 | Must Have |
| Câu ví dụ song ngữ Hán–Việt (từ 253k corpus) | Must Have |
| Từ ghép phổ biến (compounds) có Pinyin và nghĩa | Should Have |
| Chuyển đổi Giản thể ↔ Phồn thể | Should Have |

---

### Epic 4: Tiến độ & Gamification (Progress)

**US-06** — *Là học viên, tôi muốn theo dõi chuỗi ngày học, XP và cấp độ để có động lực học tiếp.*

| Acceptance Criteria | Priority |
|---------------------|----------|
| Chuỗi ngày liên tiếp (daily streak) | Must Have |
| XP tích lũy khi ghép thành công | Must Have |
| Hệ thống cấp độ (100 XP / cấp) | Must Have |
| Lưu tiến độ qua LocalStorage | Must Have |
| Xuất/Nhập file JSON backup | Should Have |

---

### Epic 5: Trải nghiệm (UX & Performance)

**US-07** — *Là học viên, tôi muốn ứng dụng chạy mượt, đẹp và phát âm chính xác để có trải nghiệm học tốt nhất.*

| Acceptance Criteria | Priority |
|---------------------|----------|
| 60+ FPS ổn định khi drag-and-drop | Must Have |
| Dark mode mặc định | Must Have |
| Nút phát âm Pinyin (Web Speech API) | Should Have |
| Cài đặt dưới dạng PWA (offline capable) | Nice to Have |

---

## 4. Feature Specification

### 4.1 Core Features (MVP)

| Feature | Module | Status |
|---------|--------|--------|
| 214 KangXi radicals grid | `radicals.js` | ✅ Week 3 |
| Search + filter | `radicals.js` | ✅ Week 3 |
| Drag-and-drop canvas | `builder.js` | ✅ Week 3 |
| Basic fusion (15 recipes) | `builder.js` | ✅ Week 3 |
| Tab navigation + modals | `app.js` | ✅ Week 2 |
| Full spatial engine (8,660 recipes) | `builder.js` | 🔄 Week 4 |
| HanziWriter stroke animation | `radicals.js` | 🔄 Week 5 |
| CVDICT definitions | `app.js` | 🔄 Week 6 |
| XP / Level / Streak | `state.js` | 🔄 Week 7 |
| Full Hanzi database (9,574 chars) | `data/` | 🔄 Week 8 |
| Bilingual sentences | `data/` | 🔄 Week 11 |
| Audio pronunciation | `audio.js` | 🔄 Week 11 |
| PWA offline | `sw.js` | 🔄 Week 12 |

### 4.2 Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load time | < 2 giây (initial shell) |
| FPS khi drag | ≥ 60 FPS |
| Browser support | Chrome 100+, Edge 100+, Firefox 100+ |
| Offline capability | Full offline sau lần load đầu (PWA) |
| Accessibility | ARIA labels, keyboard navigation |

---

## 5. Out of Scope (v1.0)

- Multiplayer / real-time features
- Backend server / user accounts
- Mobile native app
- Community-generated content

---

## 6. AI Tools Used

| Phase | Tool | Usage |
|-------|------|-------|
| Ideation | Gemini | Product concept, problem framing |
| Data Pipeline | Gemini | PowerShell script to parse Unihan + CVDICT |
| UI Design | Gemini | HTML structure, CSS design system |
| Logic | Gemini | Spatial geometry engine, recipe matching |
| Docs | Gemini | This PRD, ROADMAP, system architecture |
| Refactoring | Gemini | Code review, inline CSS elimination |
