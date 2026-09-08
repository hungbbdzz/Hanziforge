# ⚒️ HanziForge (漢字工坊)

> **Nền tảng học chữ Hán tương tác qua cơ chế dung hợp bộ thủ 2D không gian (Spatial Hanzi Fusion Platform)**  
> **Môn học:** Chuyên đề 4: Phát triển sản phẩm với AI (AI Product Development) — VKU 2026  
> **Tác giả:** [hungbbdzz](https://github.com/hungbbdzz)  
> **Repository:** [github.com/hungbbdzz/Hanziforge](https://github.com/hungbbdzz/Hanziforge)  

---

## 📖 Giới thiệu Dự Án

Học chữ Hán truyền thống thường nặng về ghi nhớ máy móc từng nét vẽ rời rạc, dẫn đến nhanh quên và khó hiểu sâu. Thực tế, hơn **95% chữ Hán** được cấu thành từ **214 bộ thủ Khang Hy (KangXi Radicals)** sắp xếp theo các quy luật không gian xác định (Trái–Phải, Trên–Dưới, Bao bọc, Kim tự tháp 品,...).

**HanziForge** đổi mới phương pháp học chữ Hán bằng việc đưa trải nghiệm tương tác kiểu **chế tạo vật phẩm (crafting canvas tương tự Minecraft/Alchemy)** vào việc ghép chữ:
- Kéo thả các bộ thủ tự do trên khung **Điền Tự Cách (田字格 - Tianzige)** 2D.
- Hệ thống tự động phân tích tương quan vị trí không gian để dung hợp thành chữ Hán hoàn chỉnh.
- Gắn liền với **Âm Hán–Việt**, Pinyin, nghĩa tiếng Việt chuẩn xác và giải nghĩa từ nguyên trực quan.

---

## 🚀 Tính năng hiện tại (Bản Demo Prototype)

### 1. 🧩 Bảng Bộ Thủ Khả Dụng (Curated Demo Palette)
- **Bộ lọc thông minh ngoài UI chính:** Thay vì hiển thị tràn lan cả 214 bộ thủ khiến người học bị ngợp, giao diện chính mặc định lọc ra **20 bộ thủ có thể ghép được** trong bản demo (`人`, `木`, `日`, `月`, `女`, `子`, `火`, `水`, `口`, `山`, `土`, `心`, `刀`, `小`, `大`, `田`, `力`, `宀`, `手`, `目`).
- **Hệ thống Tab phân loại tiện lợi:**
  - `✨ Ghép Được (Demo)`: Danh sách các bộ thủ hoạt động trong các công thức hiện có.
  - `⭐ Đã Ghép`: Lưu trữ các chữ Hán người dùng đã chế tác thành công (có thể kéo ngược lại vào bàn để ghép chữ cấp cao hơn, ví dụ: `木 + 木 → 林`, rồi `林 + 木 → 森`).
  - `⚡ Hợp Lệ (Live Synergy)`: Tự động lọc và làm sáng các bộ thủ có thể ghép đôi với thẻ đang đặt trên bàn Tianzige.
  - `Tất Cả`: Chế độ tra cứu toàn bộ 214 bộ thủ Khang Hy với đầy đủ thông tin nét vẽ.

### 2. ⚒️ Không Gian Ghép Chữ 2D (Spatial Canvas Workspace)
- Kéo thả mượt mà các thẻ bộ thủ lên khung Điền Tự Cách.
- Tự do di chuyển, sắp xếp lại vị trí thẻ bằng chuột.
- Nhận diện hướng ghép cơ bản: **Trái–Phải (`⿰`)** hoặc **Trên–Dưới (`⿱`)**.
- Hỗ trợ công thức ghép 2 thành phần và 3 thành phần (chữ phẩm `品`, tam giác kim tự tháp).

### 3. 📜 Sách Công Thức Ghép Chữ (Codex)
- Tra cứu danh mục các công thức ghép sẵn có trong hệ thống.
- Tìm kiếm tức thì theo chữ Hán, bộ thủ, âm Hán Việt hoặc ý nghĩa.
- **Tính năng "⚡ Thử ghép":** Nhấp 1 chạm để hệ thống tự động dọn bàn và đặt các bộ thủ tương ứng lên khung ghép để người học thử nghiệm ngay.

### 4. 🎨 Giao diện Đông Phương Sang Trọng (Luxury Oriental Dark Theme)
- Bảng màu: Đỏ Cung Đình (`Imperial Red`), Vàng Hoàng Gia (`Imperial Gold`), Xanh Ngọc Bích (`Jade Green`).
- Tối ưu hiển thị mượt mà trên nền tảng Web tiêu chuẩn.

---

## 🛠️ Công Nghệ & Kiến Trúc Kỹ Thuật

Dự án tuân theo tiêu chuẩn **Zero-Build, Pure Vanilla Web Architecture**:

| Thành phần | Công nghệ sử dụng | Lý do lựa chọn |
|---|---|---|
| **Cấu trúc (Markup)** | **HTML5 Semantic** | Tương thích mọi trình duyệt, chuẩn SEO, tối ưu accessibility. |
| **Giao diện (Styling)** | **Pure Vanilla CSS3** (CSS Variables, Flexbox, CSS Grid) | Kiểm soát 100% từng pixel, không phụ thuộc thư viện nặng như Tailwind hay Bootstrap. |
| **Logic & Thuật toán** | **Pure Vanilla JavaScript** (ES6+) | Thao tác DOM trực tiếp, đạt hiệu năng 60–144 FPS khi kéo thả tọa độ 2D, không bị overhead diffing của Virtual DOM. |
| **Phụ thuộc bên ngoài** | **0 dependencies** (Không cần `npm install` hay Webpack/Vite) | Chạy ngay lập tức trên mọi máy tính mà không cần cài đặt môi trường phức tạp. |

> 📌 **Về câu hỏi: "Dự án này có cần dùng Framework (React, Vue, Next.js...) không?"**  
> **Câu trả lời là KHÔNG.** Dự án được thiết kế hoàn toàn bằng **Pure Vanilla HTML5/CSS3/JavaScript**. Với bài toán kéo thả 2D Canvas thời gian thực và nạp tập dữ liệu từ điển lớn, việc dùng Vanilla JS mang lại:
> 1. Hiệu năng tính toán vị trí và render cực nhanh (60–144 FPS), không có độ trễ do Virtual DOM re-render.
> 2. Dễ dàng nạp các file database dung lượng lớn vào RAM runtime dưới dạng object toàn cục.
> 3. Khả năng đóng gói cực kỳ gọn nhẹ, mở là chạy ngay không cần cài đặt môi trường.

---

## 📁 Cấu trúc Thư mục

```
hanziforge/
├── index.html            # Ứng dụng Single Page Web App
├── README.md             # Tài liệu hướng dẫn & kiến trúc hệ thống
├── PRD.md                # Bản đặc tả yêu cầu sản phẩm (Product Requirements)
├── ROADMAP.md            # Lộ trình phát triển qua các tuần
├── css/
│   └── style.css         # Toàn bộ Design System, animations, layout
└── js/
    ├── app.js            # Điều hướng tab, quản trị Modal, trạng thái cơ sở
    ├── radicals.js       # Dữ liệu bộ thủ Khang Hy, bộ lọc Palette, Modal chi tiết
    └── builder.js        # Engine phân tích không gian 2D, thuật toán dung hợp & Codex
```

---

## ⚡ Hướng dẫn Khởi chạy Cục bộ

Do ứng dụng sử dụng chuẩn Web tĩnh không cần biên dịch, bạn có thể chạy bằng bất kỳ cách nào sau đây:

### Cách 1: Sử dụng Python HTTP Server (Được khuyến nghị)
Mở terminal tại thư mục dự án và chạy:
```powershell
python -m http.server 3000
```
Sau đó truy cập trình duyệt tại: **`http://localhost:3000`**

### Cách 2: Sử dụng Node.js `serve` hoặc `http-server`
```powershell
npx -y serve . -p 3000
```

### Cách 3: Mở trực tiếp file
Nhấp đúp chuột vào file **`index.html`** để mở trực tiếp trên Chrome / Edge / Firefox.

---

## 📚 Danh mục Công thức Ghép Mẫu (Demo Recipes)

Hiện tại trong bản demo, bạn có thể thử nghiệm các công thức tiêu biểu sau:

| Công thức | Chữ tạo thành | Âm Hán–Việt | Pinyin | Ý nghĩa cấu tạo |
|:---:|:---:|:---:|:---:|---|
| **人 + 木** | **休** | Hưu | xiū | Người tựa vào gốc cây → Nghỉ ngơi |
| **木 + 木** | **林** | Lâm | lín | Hai cây đứng cạnh nhau → Rừng thưa |
| **林 + 木** | **森** | Sâm | sēn | Ba cây sum sê → Rừng rậm |
| **木 + 木 + 木** | **森** | Sâm | sēn | Ba cây sum sê (Ghép 3 thẻ) → Rừng rậm |
| **日 + 月** | **明** | Minh | míng | Mặt trời và mặt trăng kết hợp → Sáng rõ, thông minh |
| **人 + 人** | **从** | Tùng | cóng | Một người đi theo một người → Theo sau |
| **人 + 人 + 人** | **众** | Chúng | zhòng | Ba người hợp lại → Đông người, quần chúng |
| **女 + 子** | **好** | Hảo | hǎo | Người phụ nữ có con cái → Tốt lành, yêu thích |
| **火 + 火** | **炎** | Viêm | yán | Hai ngọn lửa bốc lên → Nóng bỏng, viêm |
| **火 + 火 + 火** | **焱** | Diễm | yàn | Ba ngọn lửa rực cháy → Ánh lửa bốc cao |
| **水 + 木** | **沐** | Mộc | mù | Lấy nước gội đầu dưới gốc cây → Tắm gội |
| **口 + 口** | **吕** | Lữ | lǚ | Hai miệng xướng họa → Cung nhạc, họ Lữ |
| **口 + 口 + 口** | **品** | Phẩm | pǐn | Ba chiếc miệng cùng nếm thử → Phẩm chất, phẩm bình |
| **山 + 山** | **屾** | Sàn | shèn | Hai ngọn núi cạnh nhau |
| **日 + 木** | **杲** | Cảo | gǎo | Mặt trời nhô lên trên ngọn cây → Sáng rực |
| **土 + 口** | **吐** | Thổ | tǔ | Mở miệng nhả đất → Thổ lộ, nôn ói |
| **心 + 刀** | **忍** | Nhẫn | rěn | Lưỡi dao đặt trên trái tim → Nhẫn nhịn, kiên tâm |
| **小 + 大** | **尖** | Tiêm | jiān | Phía dưới to, phía trên nhỏ → Nhọn, sắc bén |
| **日 + 日** | **昌** | Xương | chāng | Hai mặt trời cùng chiếu rọi → Thịnh vượng, xán lạn |
| **日 + 日 + 日** | **晶** | Tinh | jīng | Ba mặt trời phản chiếu lấp lánh → Tinh thể, pha lê |
| **田 + 力** | **男** | Nam | nán | Dùng sức lực làm ruộng đồng → Người nam, đàn ông |
| **宀 + 女** | **安** | An | ān | Người phụ nữ yên ổn dưới mái nhà → Bình an |
| **宀 + 子** | **字** | Tự | zì | Đứa trẻ học hành dưới mái nhà → Chữ viết |
| **手 + 目** | **看** | Khán | kàn | Bàn tay đặt che trên mắt để nhìn xa → Nhìn, xem |

---

## 📅 Lộ Trình Phát Triển Theo Tuần (Weekly Milestones & Git Commits)

> 💡 **Triết lý phát triển:** Dự án được phát triển **cuốn chiếu theo từng tuần học (Weekly Agile Iterations)**. Mỗi tuần học đều có mục tiêu nghiên cứu cụ thể, bài tập thực hành tương ứng và được cam kết mã nguồn lên Git định kỳ để thể hiện rõ quá trình hoàn thiện sản phẩm.

| Tuần học | Ngày | Nội dung & Chương trình học | Git Commit Milestone | Trạng thái |
|:---:|:---:|---|---|:---:|
| **Tuần 1** | 18/08/2026 | **Ch.1: Tổng quan AI** — Khởi tạo scaffold HTML5/CSS3, bố cục 3 cột | `feat: initial project scaffold` | ✅ Hoàn thành |
| **Tuần 2** | 25/08/2026 | **Ch.1 Lab** — Điều hướng Tab, hệ thống Modal, toggle giản/phồn | `feat: add app controller — tab navigation` | ✅ Hoàn thành |
| **Tuần 3** | 01/09/2026 | **Ch.2: Prompt Engineering** — Bảng 96 bộ thủ, canvas 2D kéo thả | `feat: add radical palette, canvas workspace` | ✅ Hoàn thành |
| **Tuần 4** | 08/09/2026 | **Ch.3: Đặc tả PRD & Kiến trúc** — Lọc bộ thủ khả dụng, 24 demo recipes | `feat: filter craftable radicals on UI, add README` | 🚀 **Hiện tại** |
| **Tuần 5** | 15/09/2026 | **Ch.4: Hoạt họa nét viết** — Tích hợp thư viện HanziWriter stroke animation | `feat: integrate hanzi-writer animations` | ⏳ Sắp tới |
| **Tuần 6** | 22/09/2026 | **Ch.4 Lab** — Tích hợp bộ từ điển tiếng Việt CVDICT (122k mục) | `feat: integrate cvdict definitions` | ⏳ Sắp tới |
| **Tuần 7** | 29/09/2026 | **Ch.5: Quản trị trạng thái** — Gamification XP, cấp độ, lưu LocalStorage | `feat: add state manager and persistence` | ⏳ Sắp tới |
| **Tuần 8** | 06/10/2026 | **Ch.6: Big Data Pipeline** — Nạp runtime 8,660 công thức & 9,574 chữ Hán | `feat: full runtime data integration` | ⏳ Sắp tới |
| **Tuần 11** | 27/10/2026 | **Ch.8: Đa phương tiện** — Web Speech API phát âm giọng đọc bản ngữ | `feat: add text-to-speech audio` | ⏳ Sắp tới |
| **Tuần 12** | 03/11/2026 | **Ch.9: Tối ưu hiệu năng** — Đo kiểm 60-144 FPS HUD & PWA offline | `perf: optimize rendering, add pwa` | ⏳ Sắp tới |
| **Tuần 13** | 10/11/2026 | **Nghiệm thu cuối kỳ** — Hoàn thiện toàn bộ sản phẩm hoàn chỉnh | `release: finalize hanziforge platform` | ⏳ Đích đến |

---

## 🔮 Kế hoạch Giai đoạn Kế tiếp

Các tính năng chưa tới tuần học sẽ được giữ ở trạng thái **Coming Soon** trên giao diện:
1. **Tuần 5:** Tích hợp `HanziWriter` vào modal chi tiết chữ để hiển thị thứ tự nét viết động.
2. **Tuần 6–7:** Hoàn thiện engine lưu trữ `state.js` để người dùng lưu tiến độ cày cấp XP và chữ đã ghép vào trình duyệt.
3. **Tuần 8:** Nạp bộ dữ liệu lớn `hanzi_data_runtime.js` thay thế bộ demo 24 công thức hiện tại, mở khóa khả năng ghép tự do hơn 8,660 chữ Hán.
