# 🇨🇳 HSK Chinese Learning Platform

An advanced, highly interactive web application for learning and mastering Chinese vocabulary, character stroke order, and grammar from HSK 1 to HSK 5. Features a Spaced Repetition System (SRS), active character writing checks, text-to-speech (TTS) integration, and dynamic statistics tracking.

[![React](https://img.shields.io/badge/React-18-20232A?style=flat-flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-007ACC?style=flat-flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-B736FF?style=flat-flat&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?style=flat-flat&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 🚀 Key Highlights & CV Bullet Points
- **Performance Optimization**: Structured and optimized a local JSON dataset for efficient vocabulary tracking, improving data loading speed and app performance.
- **Client-Side Caching & Persistence**: Implemented client-side caching (LocalStorage) to save learning progress, SRS review states, and settings, enhancing user retention and creating a seamless offline experience.
- **Spaced Repetition System (SRS)**: Built a custom repetition scheduler based on user recall performance to optimize vocabulary retention and highlight weaker areas.
- **Serverless API Proxying**: Designed Vercel Serverless Functions (`api/deepl-translate.ts`, `api/tts.ts`) to proxy DeepL translation and TTS APIs, successfully resolving CORS restrictions while keeping API credentials secured.
- **Interactive Hanzi Writing Engine**: Integrated `hanzi-writer` for real-time stroke order visualization and canvas-based character writing validation.
- **Advanced UX Features**: Implemented custom hooks for hotkey navigation (`useKeyboardShortcuts`) and virtual scrolling (`useVirtualScroll`) to handle large word lists efficiently without performance lag.

---

## 🌟 Key Features
- **5 HSK Levels**: Pre-loaded vocabulary sets for HSK 1 through HSK 5.
- **Multiple Learning Modes**:
  - **Vocab Checks**: Test pinyin input with spelling normalization.
  - **Meaning Quizzes**: Select/write the correct translation.
  - **Stroke Practice**: Interactive canvas for drawing characters.
  - **Sentence Practice**: Exercises for syntax, grammar, and building Chinese sentences.
- **Spaced Repetition (SRS)**: Automatically schedules review cards depending on grading levels.
- **Real-Time Translation**: Direct lookups with DeepL integration.
- **Speech Synthesis (TTS)**: Clean audio pronunciations for vocabulary and sentences.
- **Custom Content Manager**: Direct dashboard to add, edit, or import custom vocabulary and sentences.
- **Analytics & History**: Track daily streaks, correct answer percentage, and HSK level completion progress.

---

## 🛠️ Tech Stack
- **Frontend Core**: React 18, TypeScript, Vite
- **Styling**: Custom CSS3 (CSS Variables, Responsive Layouts, Light/Dark Modes)
- **Backend / Serverless**: Vercel Serverless Functions (Node.js)
- **APIs & Tools**: DeepL API, Web Speech Synthesis / Custom TTS, Hanzi Writer, Pinyin-Pro
- **Analytics & Data**: Vercel Analytics, Local JSON Dataset with XLSX & CSV importing pipelines

---

## 📂 Project Architecture
```text
├── api/                  # Vercel Serverless API routes (TTS, DeepL)
├── src/
│   ├── components/       # Component-Folder UI Architecture (20+ components)
│   │   ├── BottomNavBar/ # Component logic, styling, and index.ts entry point
│   │   ├── SRSReview/    # Spaced Repetition scheduler folder
│   │   └── ...           
│   ├── contexts/         # ThemeContext (Light/Dark themes)
│   ├── data/             # Vocabulary and sentence datasets
│   ├── hooks/            # Custom React hooks (shortcuts, virtualization)
│   ├── utils/            # Helper utils (Pinyin normalization)
│   ├── App.tsx           # Application root layout & routing
│   ├── App.css           # Component styles
│   └── index.css         # Theme-based CSS3 system and animations
├── public/               # Static assets
├── package.json          # Node dependencies and scripts
└── vite.config.ts        # Vite build configuration
```

---

## ⚙️ Quick Start

### 1. Installation
```bash
# Clone the repository and install dependencies
npm install
```

### 2. Run Locally
To run the full app locally with serverless function proxies (DeepL / TTS), use the Vercel CLI:
```bash
# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# Run development server with Serverless Functions support
vercel dev
```
*(Alternatively, run `npm run dev` for frontend-only development).*

---

## 📄 License
This project is licensed under the MIT License.
