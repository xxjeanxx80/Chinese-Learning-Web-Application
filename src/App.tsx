import { useState, lazy, Suspense, useMemo, useEffect } from 'react';
import './App.css';
import './AppNew.css';
import HSKLevelSelector from './components/HSKLevelSelector';
import TopicSelector from './components/TopicSelector';
import { useTheme } from './contexts/ThemeContext';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import SupportModal from './components/SupportModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import MobileDrawer from './components/MobileDrawer';
import BottomNavBar from './components/BottomNavBar';
import Sidebar from './components/Sidebar/Sidebar';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useCustomBackground } from './hooks/useCustomBackground';
import { Analytics } from '@vercel/analytics/react';
import { exportBackup, importBackup } from './storage/backup';
import SyncStatus from './components/SyncStatus';

// Lazy load components
const CheckVocabulary = lazy(() => import('./components/CheckVocabulary'));
const PracticeWriting = lazy(() => import('./components/PracticeWriting'));
const PracticeMeaning = lazy(() => import('./components/PracticeMeaning'));
const RandomPractice = lazy(() => import('./components/RandomPractice'));
const VocabularyManager = lazy(() => import('./components/VocabularyManager'));
const SentencePractice = lazy(() => import('./components/SentencePractice'));
const SentenceManager = lazy(() => import('./components/SentenceManager'));
const RandomSentencePractice = lazy(() => import('./components/RandomSentencePractice'));
const Translate = lazy(() => import('./components/Translate'));
const StatisticsDashboard = lazy(() => import('./components/StatisticsDashboard'));
const ReviewQueue = lazy(() => import('./components/ReviewQueue'));

const ComponentLoader = () => (
  <div style={{
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: '400px', fontSize: '1.2rem', color: '#666'
  }}>
    Đang tải...
  </div>
);

function App() {
  const { theme, toggleTheme } = useTheme();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isLearnedWordsOpen, setIsLearnedWordsOpen] = useState(false);

  const handleExportBackup = async () => {
    try {
      await exportBackup();
    } catch (e) {
      console.error('Export backup failed', e);
      alert('Lỗi khi xuất bản sao lưu!');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-import of same file
    if (!file) return;
    try {
      const res = await importBackup(file, 'replace');
      if (res.errors > 0) {
        alert(`Khôi phục: ${res.added} mục, ${res.errors} lỗi.`);
      } else {
        alert(`Khôi phục thành công! Đã khôi phục ${res.added} mục. Vui lòng tải lại trang.`);
      }
    } catch (err) {
      console.error('Import backup failed', err);
      alert('Lỗi khi khôi phục bản sao lưu!');
    }
  };

  const {
    currentLevel, setCurrentLevel,
    currentFunction, handleFunctionChange,
    expandedMenu, setExpandedMenu,
    currentTopic, setCurrentTopic
  } = useAppNavigation();

  const {
    customBackground, handleBackgroundUpload, removeCustomBackground
  } = useCustomBackground();

  const renderFunction = useMemo(() => {
    const props = { level: currentLevel };
    const managerProps = { currentLevel };
    const sentenceProps = {
      level: currentLevel, currentTopic,
      onTopicChange: setCurrentTopic
    };
    const sentenceManagerProps = {
      currentLevel, currentTopic,
      onTopicChange: setCurrentTopic
    };

    switch (currentFunction) {
      case 'vocabulary':        return <CheckVocabulary {...props} />;
      case 'writing':           return <PracticeWriting {...props} />;
      case 'meaning':           return <PracticeMeaning {...props} />;
      case 'random':            return <RandomPractice {...props} />;
      case 'manage':            return <VocabularyManager {...managerProps} />;
      case 'sentence-pinyin':   return <SentencePractice {...sentenceProps} initialMode="pinyin" />;
      case 'sentence-writing':  return <SentencePractice {...sentenceProps} initialMode="writing" />;
      case 'sentence-meaning':  return <SentencePractice {...sentenceProps} initialMode="meaning" />;
      case 'sentence-random':   return <RandomSentencePractice {...sentenceProps} />;
      case 'sentence-manage':   return <SentenceManager {...sentenceManagerProps} />;
      case 'translate':         return <Translate currentLevel={currentLevel} />;
      case 'statistics':        return <StatisticsDashboard currentLevel={currentLevel} />;
      case 'review':            return <ReviewQueue level={currentLevel} />;
      default:                  return <CheckVocabulary {...props} />;
    }
  }, [currentFunction, currentLevel, currentTopic, setCurrentTopic]);

  useKeyboardShortcuts({
    onCtrlK: () => {
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    },
    onEscape: () => {
      if (showShortcutsModal) setShowShortcutsModal(false);
    },
  });

  useEffect(() => {
    const handleShortcutsModal = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleShortcutsModal);
    return () => document.removeEventListener('keydown', handleShortcutsModal);
  }, []);

  return (
    <div className="app-new">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Mở menu"
              title="Menu"
            >
              ☰
            </button>
            <div className="logo-container">
              <img src="/mikulogo.jpg" alt="MikuHan Logo" className="app-logo" />
            </div>
            <h1>MikuHan</h1>
          </div>
          <div className="header-actions">
            <HSKLevelSelector
              currentLevel={currentLevel}
              onLevelChange={setCurrentLevel}
            />
            {currentFunction.startsWith('sentence-') && (
              <TopicSelector
                currentLevel={currentLevel}
                currentTopic={currentTopic}
                onTopicChange={setCurrentTopic}
              />
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <SyncStatus />
              {customBackground ? (
                <button
                  onClick={removeCustomBackground}
                  className="btn-theme-toggle"
                  title="Xoá ảnh nền tuỳ chỉnh"
                  style={{ background: 'rgba(255, 59, 48, 0.2)', borderColor: 'rgba(255, 59, 48, 0.5)' }}
                >
                  🗑️
                </button>
              ) : (
                <label
                  className="btn-theme-toggle"
                  title="Tải lên ảnh nền (Dưới 5MB)"
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="file" accept="image/*"
                    onChange={handleBackgroundUpload}
                    style={{ display: 'none' }}
                  />
                  🖼️
                </label>
              )}
              
              <button
                onClick={() => setIsLearnedWordsOpen(prev => !prev)}
                className={`btn-theme-toggle btn-learned-toggle ${isLearnedWordsOpen ? 'active' : ''}`}
                title="Xem danh sách từ/câu đã học hoặc sai"
                aria-label="Toggle learned words panel"
              >
                📖
              </button>

              <button
                onClick={toggleTheme}
                className="btn-theme-toggle"
                title={theme === 'light' ? 'Chuyển sang Dark Mode' : 'Chuyển sang Light Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              <button
                onClick={handleExportBackup}
                className="btn-theme-toggle"
                title="Xuất bản sao lưu dữ liệu (JSON)"
                aria-label="Export backup"
              >
                💾
              </button>

              <label
                className="btn-theme-toggle"
                title="Khôi phục dữ liệu từ bản sao lưu JSON"
                style={{ cursor: 'pointer' }}
              >
                📂
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportBackup}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      >
        <Sidebar
          currentFunction={currentFunction}
          expandedMenu={expandedMenu}
          onFunctionChange={(func) => handleFunctionChange(func, () => setIsMobileDrawerOpen(false))}
          onToggleMenu={setExpandedMenu}
        />
      </MobileDrawer>

      <div className="app-layout">
        <aside className="sidebar desktop-sidebar">
          <Sidebar
            currentFunction={currentFunction}
            expandedMenu={expandedMenu}
            onFunctionChange={handleFunctionChange}
            onToggleMenu={setExpandedMenu}
          />
          <button
            onClick={() => setShowSupportModal(true)}
            className="btn-support-sidebar"
            title="Buying miku a Milkkkkkkkiiuu"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="heart-icon" style={{ marginRight: '6px' }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span className="support-text">Miku Support</span>
          </button>
        </aside>

        <main className="app-main">
          <Suspense fallback={<ComponentLoader />}>
            {renderFunction}
          </Suspense>
        </main>
        
        <div className={`learned-words-drawer ${isLearnedWordsOpen ? 'open' : ''}`}>
          <div className="drawer-overlay" onClick={() => setIsLearnedWordsOpen(false)} />
          <div className="drawer-content">
            <button className="drawer-close-btn" onClick={() => setIsLearnedWordsOpen(false)}>×</button>
            <div id="right-sidebar-portal" />
          </div>
        </div>
      </div>

      <BottomNavBar
        currentFunction={currentFunction}
        onFunctionChange={handleFunctionChange}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {showSupportModal && (
        <SupportModal onClose={() => setShowSupportModal(false)} />
      )}

      <Analytics />
    </div>
  );
}


export default App;