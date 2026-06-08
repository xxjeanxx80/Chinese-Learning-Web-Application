import { useState, lazy, Suspense, useMemo, useEffect } from 'react';
import './App.css';
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

// Lazy load components để giảm bundle size ban đầu
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

// Loading component đơn giản
const ComponentLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '400px',
    fontSize: '1.2rem',
    color: '#666'
  }}>
    Đang tải...
  </div>
);

function App() {
  const { theme, toggleTheme } = useTheme();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const {
    currentLevel,
    setCurrentLevel,
    currentFunction,
    handleFunctionChange,
    expandedMenu,
    setExpandedMenu,
    currentTopic,
    setCurrentTopic
  } = useAppNavigation();

  const {
    customBackground,
    handleBackgroundUpload,
    removeCustomBackground
  } = useCustomBackground();

  const renderFunction = useMemo(() => {
    const props = { level: currentLevel };
    const managerProps = { currentLevel };
    const sentenceProps = { 
      level: currentLevel, 
      currentTopic, 
      onTopicChange: setCurrentTopic 
    };
    const sentenceManagerProps = {
      currentLevel,
      currentTopic,
      onTopicChange: setCurrentTopic
    };
    
    switch (currentFunction) {
      case 'vocabulary':
        return <CheckVocabulary {...props} />;
      case 'writing':
        return <PracticeWriting {...props} />;
      case 'meaning':
        return <PracticeMeaning {...props} />;
      case 'random':
        return <RandomPractice {...props} />;
      case 'manage':
        return <VocabularyManager {...managerProps} />;
      case 'sentence-pinyin':
        return <SentencePractice {...sentenceProps} initialMode="pinyin" />;
      case 'sentence-writing':
        return <SentencePractice {...sentenceProps} initialMode="writing" />;
      case 'sentence-meaning':
        return <SentencePractice {...sentenceProps} initialMode="meaning" />;
      case 'sentence-random':
        return <RandomSentencePractice {...sentenceProps} />;
      case 'sentence-manage':
        return <SentenceManager {...sentenceManagerProps} />;
      case 'translate':
        return <Translate currentLevel={currentLevel} />;
      case 'statistics':
        return <StatisticsDashboard currentLevel={currentLevel} />;
      default:
        return <CheckVocabulary {...props} />;
    }
  }, [currentFunction, currentLevel, currentTopic, setCurrentTopic]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCtrlK: () => {
      // Focus vào search box nếu có
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    onEscape: () => {
      if (showShortcutsModal) {
        setShowShortcutsModal(false);
      }
    },
  });

  // Ctrl+/ or Cmd+/ để mở shortcuts modal
  useEffect(() => {
    const handleShortcutsModal = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleShortcutsModal);
    return () => {
      document.removeEventListener('keydown', handleShortcutsModal);
    };
  }, []);

  return (
    <div className="app">
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
              <img src="/logo.gif" alt="MikuHan Logo" className="app-logo" />
            </div>
            <h1>MikuHan</h1>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setShowSupportModal(true)}
              className="btn-support-header"
              title="Buying miku a Milkkkkkkkiiuu"
            >
              <span>🥛</span>
              <span className="support-text">Buying miku a Milkkkkkkkiiuu</span>
              <span>🥛</span>
            </button>
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
                    type="file" 
                    accept="image/*" 
                    onChange={handleBackgroundUpload} 
                    style={{ display: 'none' }} 
                  />
                  🖼️
                </label>
              )}
              
              <button
                onClick={toggleTheme}
                className="btn-theme-toggle"
                title={theme === 'light' ? 'Chuyển sang Dark Mode' : 'Chuyển sang Light Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
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
        {/* Desktop Sidebar - Ẩn trên mobile */}
        <aside className="sidebar desktop-sidebar">
          <Sidebar 
            currentFunction={currentFunction}
            expandedMenu={expandedMenu}
            onFunctionChange={handleFunctionChange}
            onToggleMenu={setExpandedMenu}
          />
        </aside>

        <main className="app-main">
          <Suspense fallback={<ComponentLoader />}>
            {renderFunction}
          </Suspense>
        </main>

        {/* Portal target for right sidebar (LearnedWordsPanel) */}
        <div id="right-sidebar-portal" />
      </div>

      {/* Bottom Navigation Bar - Chỉ hiện trên mobile */}
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
