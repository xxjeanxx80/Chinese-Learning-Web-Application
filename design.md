# MikuHan — Frontend Redesign Blueprint

> Design system v2 dành cho **mikuhan.vercel.app** — `MikuHan - Học Tiếng Trung HSK`.
> Dựa trên codebase hiện tại (React 18 + TypeScript + Vite), giữ nguyên logic, nâng cấp giao diện theo hướng **tối giản, hiện đại, mượt mà**.

---

## 1. Design Philosophy

| Nguyên tắc | Mô tả |
|---|---|
| **Liquid Glass 2.0** | Kế thừa Apple iOS frosted glass, tăng độ sâu với multi-layer blur và gradient overlay tinh tế hơn. |
| **Calm & Focus** | Không màu mè. Bảng màu dịu, ít noise, giúp người học tập trung vào nội dung Hán tự. |
| **Fluid Motion** | Mọi transition dùng `cubic-bezier(0.16, 1, 0.3, 1)` (Apple ease-out). Không có animation giật. |
| **Content First** | Chữ Hán to, rõ, là trung tâm. UI chrome mờ dần vào nền. |
| **Mobile Native Feel** | Bottom nav như iOS tab bar, swipe gestures, safe area. |
| **Accessible** | Contrast ratio >= 4.5:1, focus ring rõ ràng, font size tối thiểu 16px cho input. |

---

## 2. Visual Identity

### 2.1. Typography

```
Tier 1: "SF Pro" / -apple-system (UI text)
Tier 2: "Noto Sans SC" (Chinese characters)
Tier 3: "Inter" (fallback)

Scale (Major Third):
- xs: 0.75rem (12px)   — captions, meta
- sm: 0.875rem (14px)  — secondary text
- base: 1rem (16px)    — body
- md: 1.25rem (20px)   — sub-heading
- lg: 1.5rem (24px)    — heading
- xl: 2rem (32px)      — hero
- 2xl: 2.5rem (40px)   — display
- 3xl: 3rem (48px)     — chinese char hero
```

### 2.2. Color Palette (CSS Variables)

```css
/* Light Mode */
--surface-0: #ffffff;
--surface-50: #f5f7fa;
--surface-100: #e8ecf1;
--surface-glass: rgba(255,255,255,0.18);
--text-0: #0b111e;
--text-50: rgba(11, 17, 30, 0.6);

--accent: #2563eb;       /* Primary blue */
--accent-soft: #3b82f6;  /* Hover */
--accent-subtle: #dbeafe; /* Background */
--success: #16a34a;
--error: #dc2626;
--warning: #ea580c;

/* Dark Mode */
--surface-0: #0b1120;
--surface-50: #131b2f;
--surface-100: #1a2540;
--surface-glass: rgba(19, 27, 47, 0.3);
--text-0: #e8edf5;
--text-50: rgba(232, 237, 245, 0.6);

--accent: #3b82f6;
--accent-soft: #60a5fa;
--accent-subtle: #1e3a5f;
--success: #22c55e;
--error: #ef4444;
--warning: #f97316;
```

### 2.3. Iconography

- **Lucide Icons** (thay thế Emoji hiện tại).
- `24px` base, `stroke-width: 2`.
- Emoji chỉ giữ cho nút support modal (🥛).

### 2.4. Glass Depth System

```
Layer 0: Background mesh + animation
Layer 1: Glass panels (z-10)  — blur 45px, bg opacity 18%
Layer 2: Cards (z-20)         — blur 30px, bg opacity 25%
Layer 3: Popups/Modals (z-50) — blur 55px, bg opacity 35%, darker shadow
Layer 4: Tooltips/Toasts (z-100)
```

---

## 3. Layout Architecture

### 3.1. Desktop (>= 1024px)

```
┌─────────────────────────────────────────────────┐
│  Header (glass, sticky)                         │
│  [Logo] [MikuHan] ── [Level] [Topic] [🌙/☀️]  │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  Main Content Area                   │
│ (glass,  │  ┌──────────────────────────────┐    │
│  fixed)  │  │  Practice Card (glass)       │    │
│          │  │  ┌──────────────────────┐    │    │
│  Vocab ▸ │  │  │  🔈 Chinese Char     │    │    │
│   Pinyin │  │  │  Vietnamese meaning   │    │    │
│   Writing│  │  │  [input] [check]      │    │    │
│   Meaning│  │  └──────────────────────┘    │    │
│   Random │  │                              │    │
│   Manage │  │  Result / Next               │    │
│          │  │                              │    │
│  Sentence│  │  Learned Words Panel (right) │    │
│   ...    │  └──────────────────────────────┘    │
│          │                                      │
│  Translate                                      │
│  Statistics                                     │
│          │  [Right Sidebar: LearnedWordsPanel]  │
├──────────┴──────────────────────────────────────┤
│  (Bottom Nav hidden on desktop)                 │
└─────────────────────────────────────────────────┘
```

**Changes:**
- Sidebar luôn hiển thị, **icon + text inline** (hiện tại có).
- Right sidebar `LearnedWordsPanel` giữ nguyên nhưng phải tách biệt rõ bằng border-left.
- Main content width max `800px`, căn giữa để tránh quá dài.

### 3.2. Tablet (768px–1023px)

- Sidebar collapse thành **top tab bar** hoặc hamburger menu.
- Main content `padding: 20px`.
- Bottom nav ẩn.

### 3.3. Mobile (< 768px)

```
┌─────────────────────┐
│ Header (compact)    │
│ ☰ [Logo] MikuHan 🌙│
├─────────────────────┤
│                     │
│  Main Content       │
│  (full width)       │
│                     │
├─────────────────────┤
│ Bottom Nav (fixed)  │
│ 📚Học │ 💬Câu │ 🌐Dịch│ 📊TK│
└─────────────────────┘
```

**Changes:**
- Header gọn hơn: chỉ logo, tên app rút gọn, nút dark mode.
- Level/topic selector chuyển vào trong content area qua dropdown.
- Bottom nav: 4 items như hiện tại nhưng redesign thành iOS tab bar style (nền glass, icon line art, active indicator dot).
- Swipe gesture trái/phải để next/previous (thêm hook mới).

---

## 4. Component Redesign

### 4.1. `AppHeader`

| Trước | Sau |
|---|---|
| Padding rộng, nhiều controls | Gọn, clean, background transparent hơn |
| Menu text "Buying miku..." quá dài | Icon 🥛 nhỏ + tooltip |
| Logo GIF (cũ) | Logo PNG `hero_chara.png` 48x48, `border-radius: 14px` |

```css
.app-header {
  padding: 12px 24px;
  background: rgba(255,255,255,0.08); /* more transparent */
  backdrop-filter: blur(50px) saturate(180%);
  border-bottom: 0.5px solid rgba(255,255,255,0.2);
}

.app-header h1 {
  font-size: 1.5rem; /* giảm từ 2.2rem */
  font-weight: 700;
  background: none; /* bỏ gradient text, dùng solid */
  -webkit-text-fill-color: var(--text-0);
  color: var(--text-0);
}

.logo-container {
  width: 48px;
  height: 48px;
  border-radius: 14px;
}
```

### 4.2. `HSKLevelSelector`

| Trước | Sau |
|---|---|
| Dropdown mega-menu với emoji + màu | **Pill-shaped segmented control** hiện đại |
| Mỗi level có màu riêng | Các pill nằm ngang, scroll ngang trên mobile |

```
┌────────────────────────────────────────────────┐
│ [● HSK1] [● HSK2] [● HSK3] [● HSK4] [● HSK5] │
│  ─ active pill: filled accent color            │
│  ─ inactive: outline ghost                     │
└────────────────────────────────────────────────┘
```

```css
.hsk-segmented {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--surface-glass);
  border-radius: var(--radius-pill);
  backdrop-filter: blur(20px);
}

.hsk-segment {
  padding: 6px 16px;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.25s ease;
  color: var(--text-50);
  background: transparent;
  border: none;
}

.hsk-segment.active {
  background: var(--accent);
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}
```

### 4.3. `Sidebar`

- Giữ nguyên layout, đổi style:
  - Active item: background `var(--accent-subtle)`, text `var(--accent)`, border-left 3px `var(--accent)`.
  - Hover: scale 1.02, background `rgba(0,0,0,0.03)`.
  - Nhóm menu có thể collapse với animation mượt.
  - Thêm icon Lucide SVG thay vì Unicode.

### 4.4. `BottomNavBar`

Redesign thành iOS Tab Bar style:

```css
.bottom-nav-bar {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 400px;
  height: 60px;
  background: var(--surface-glass);
  backdrop-filter: blur(50px) saturate(180%);
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255,255,255,0.2);
  display: flex;
  justify-content: space-around;
  padding: 4px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: var(--radius-pill);
  transition: all 0.2s ease;
}

.bottom-nav-item.active {
  background: var(--accent);
  color: white;
}

.bottom-nav-icon { font-size: 1.2rem; }
.bottom-nav-label { font-size: 0.65rem; font-weight: 600; }
```

### 4.5. Practice Cards (`CheckVocabulary`, `PracticeWriting`, `PracticeMeaning`, `RandomPractice`)

**Thiết kế chung cho tất cả practice component:**

```
┌─────────────────────────────────────┐
│  [🔊 Speak Button — vị trí như cũ] │
│                                     │
│       我 爱 你                      │  ← Chinese char, 3rem, bold
│       wǒ ài nǐ                      │  ← Pinyin hint (smaller, muted)
│       Tôi yêu bạn                   │  ← Vietnamese meaning
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Input area                 │    │
│  │  [________________] [Check] │    │
│  └─────────────────────────────┘    │
│                                     │
│  Progress: ████████░░ 15/30        │  ← Progress bar mới
└─────────────────────────────────────┘
```

**Key changes:**
1. **Progress bar** thay cho text `Từ đã học: 15/30`.
   - Bar mảnh (4px), bo tròn, màu accent fill, nền `surface-100`.
   - Hiển thị % completion.

2. **Speak button** redesign:
   ```css
   .speak-button {
     width: 40px;
     height: 40px;
     border-radius: 50%;
     background: var(--surface-glass);
     border: 1px solid rgba(255,255,255,0.2);
     backdrop-filter: blur(20px);
     font-size: 1.2rem;
     display: flex;
     align-items: center;
     justify-content: center;
     transition: all 0.2s ease;
   }
   .speak-button:hover {
     background: var(--accent-subtle);
     transform: scale(1.1);
   }
   .speak-button.speaking {
     animation: speakPulse 0.8s infinite;
     background: var(--accent);
     color: white;
   }
   ```

3. **Input field**: 
   - `border-radius: 14px`, `padding: 14px 18px`.
   - `border: 1.5px solid var(--surface-100)`.
   - Focus: `border-color: var(--accent)`, `box-shadow: 0 0 0 3px var(--accent-subtle)`.
   - Font size `1.1rem` để dễ gõ pinyin có dấu.

4. **Check button**:
   - `background: var(--accent)`, `color: white`.
   - `border-radius: var(--radius-pill)`.
   - `padding: 12px 28px`, `font-weight: 700`.
   - Hover: `background: var(--accent-soft)`, `transform: translateY(-1px)`.

5. **Result section**:
   - Correct: background `#f0fdf4`, border-left 4px `var(--success)`.
   - Incorrect: background `#fef2f2`, border-left 4px `var(--error)`.
   - Animate slide-in từ dưới lên.

6. **Flashcard mode** (SentencePractice):
   - Card `perspective: 1000px`, flip animation `rotateY(180deg)`.
   - Face front: chỉ Chinese char.
   - Face back: pinyin + vietnamese.
   - Nút Previous/Next dạng pill nhỏ dưới card.

### 4.6. `Translate`

- Giữ layout 2 cột source/target.
- Bỏ provider selector (đã done).
- Textarea: `min-height: 240px`, glass border.
- Result area: hiển thị với font chữ Hán to, pinyin bên dưới.
- Nút "Thêm vào từ vựng / câu" chuyển thành **floating action** nhỏ bên cạnh result.

### 4.7. `StatisticsDashboard`

- Dùng **line chart** (recharts hoặc canvas) thay vì số liệu text.
- Stack cards cho từng metric.
- Mỗi card: icon + số + label + trend arrow.
- Animation count-up khi load.

### 4.8. `VocabularyManager` & `SentenceManager`

- Bảng dữ liệu với hàng `border-radius: 10px`, hover highlight.
- Header sticky.
- Empty state: illustration + CTA button.
- Search bar: pill shape, icon search, tự động focus khi Ctrl+K (đã có).

### 4.9. `LearnedWordsPanel` (Right Sidebar)

- Mỗi item: row compact, có dot indicator (xanh = đúng, đỏ = sai).
- Scrollable list với `max-height: calc(100vh - 200px)`.
- Sticky header "Từ đã học".

### 4.10. Modals (`StrokeOrderModal`, `SupportModal`, `KeyboardShortcutsModal`)

- Backdrop: `backdrop-filter: blur(8px)`, background `rgba(0,0,0,0.4)`.
- Modal content: `border-radius: 24px`, glass background.
- Animate: scale từ 0.95 lên 1, opacity 0→1 (0.2s).
- Đóng: click outside + Esc key (đã có).

### 4.11. New Component: `ThemeToggle`

```tsx
// Animated sun/moon icon toggle
// Hiện tại dùng emoji 🌙/☀️ → đổi thành SVG animated
```

```html
<button class="theme-toggle" aria-label="Toggle theme">
  <svg class="sun-icon">...</svg>
  <svg class="moon-icon">...</svg>
</button>
```

Animation: sun xoay 180° fade out, moon xoay vào fade in.

---

## 5. Motion & Micro-interactions

| Interaction | Animation |
|---|---|
| Page transition | Opacity fade 0.3s + translateY(4px) |
| Button press | `scale(0.97)` 0.1s |
| Card hover | `translateY(-2px)` + shadow increase 0.25s |
| Correct/Incorrect reveal | Slide up + opacity 0.3s |
| Modal open | Scale 0.95→1 + fade 0.2s |
| Flashcard flip | `rotateY(180deg)` 0.6s |
| Speak button active | Pulse ring 0.8s infinite |
| Navigation switch | Crossfade 0.2s |
| Toast notification | Slide from top 0.3s, auto-dismiss 3s |

---

## 6. Dark Mode Strategy

- CSS variables toàn bộ (đã có).
- Toggle lưu vào localStorage (đã có).
- **Mới**: `prefers-color-scheme` media query detection on first visit (đã có).
- **Mới**: Transition màu nền `transition: background 0.4s ease, color 0.4s ease` cho body để dark↔light mượt.
- Glass effect trong dark mode: layer nền tối hơn, blur mạnh hơn, viền sáng hơn.

---

## 7. Performance Optimization

| Technique | Priority |
|---|---|
| `React.lazy()` cho tất cả page component (đã có) | ✅ Done |
| CSS containment: `contain: layout style paint` trên card | 🔴 New |
| `will-change: transform` cho animated element | 🔴 New |
| Memoize heavy computed values (đã dùng `useMemo`) | ✅ Done |
| Optimize background animation: dùng `@media (prefers-reduced-motion)` | 🔴 New |
| Font subset: chỉ load `Noto Sans SC` weight 400, 700 | 🔴 New |

---

## 8. File Structure (After Redesign)

```
src/
├── components/
│   ├── ui/                          # Shared primitives
│   │   ├── GlassCard.tsx
│   │   ├── GlassButton.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── SegmentedControl.tsx
│   │   ├── FloatingAction.tsx
│   │   └── IconButton.tsx
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── Sidebar.tsx
│   │   ├── BottomNavBar.tsx
│   │   └── MobileDrawer.tsx
│   ├── practice/                    # Tất cả practice component
│   │   ├── CheckVocabulary.tsx
│   │   ├── PracticeWriting.tsx
│   │   ├── PracticeMeaning.tsx
│   │   ├── RandomPractice.tsx
│   │   ├── SentencePractice.tsx
│   │   └── RandomSentencePractice.tsx
│   ├── manager/
│   │   ├── VocabularyManager.tsx
│   │   └── SentenceManager.tsx
│   ├── tools/
│   │   ├── Translate.tsx
│   │   ├── StrokeOrderModal.tsx
│   │   └── StatisticsDashboard.tsx
│   └── panels/
│       ├── LearnedWordsPanel.tsx
│       ├── SupportModal.tsx
│       └── KeyboardShortcutsModal.tsx
├── styles/
│   ├── tokens.css                   # CSS variables
│   ├── glass.css                    # Glass mixin classes
│   ├── typography.css
│   └── animations.css
├── hooks/                           # (giữ nguyên)
├── utils/                           # (giữ nguyên)
├── data/                            # (giữ nguyên)
└── config/                          # (giữ nguyên)
```

---

## 9. Implementation Plan

### Phase 1: Design Tokens (1-2 days)
- [ ] Tạo file `src/styles/tokens.css` — export tất cả CSS variables mới.
- [ ] Tạo `src/styles/glass.css` — `.glass-surface`, `.glass-card`, `.glass-modal` utility classes.
- [ ] Cập nhật `index.css` dùng tokens mới.
- [ ] Xóa legacy variables, giữ backward compatibility.

### Phase 2: Shared Components (2-3 days)
- [ ] `GlassCard` — wrapper component với glass style.
- [ ] `ProgressBar` — animated progress.
- [ ] `SegmentedControl` — thay HSKLevelSelector cũ.

### Phase 3: Layout + Navigation (2-3 days)
- [ ] Redesign `AppHeader`.
- [ ] Redesign `BottomNavBar` (floating pill).
- [ ] Redesign `Sidebar` với Lucide icons.

### Phase 4: Practice Components (3-4 days)
- [ ] Từng bước redesign từng practice component.
- [ ] Thống nhất input, button, result style.
- [ ] Thêm progress bar.

### Phase 5: Tools + Manager (2-3 days)
- [ ] Redesign Translate (đã partially done).
- [ ] Redesign StatisticsDashboard.
- [ ] Redesign Manager components.

### Phase 6: Polish (2-3 days)
- [ ] Animation & micro-interactions.
- [ ] Dark mode testing.
- [ ] Mobile responsive QA.
- [ ] Performance audit.
- [ ] Accessibility audit.

**Tổng thời gian ước tính: 12-18 ngày (full-time).**

---

## 10. Key Deliverables

1. **Figma/design mockup** cho 3–5 màn hình chính (nếu cần).
2. **Storybook** hoặc component catalog cho shared UI.
3. **CSS refactor** không break logic TypeScript hiện có.
4. **100% mobile responsive** trên mọi breakpoint.
5. **Lighthouse score**: Performance >= 90, Accessibility >= 95.

---

*Design document version 2.0 — Last updated: 2026-07-12*