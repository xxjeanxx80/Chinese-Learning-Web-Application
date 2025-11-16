import { useState, lazy, Suspense, useMemo, useCallback, useEffect } from 'react';
import './App.css';
import HSKLevelSelector from './components/HSKLevelSelector';
import TopicSelector from './components/TopicSelector';
import { useTheme } from './contexts/ThemeContext';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import SupportModal from './components/SupportModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import MobileDrawer from './components/MobileDrawer';
import BottomNavBar from './components/BottomNavBar';
import { Analytics } from '@vercel/analytics/react';

// Lazy load components để giảm bundle size ban đầu
const CheckVocabulary = lazy(() => import('./components/CheckVocabulary'));
const Flashcard = lazy(() => import('./components/Flashcard'));
const PracticeWriting = lazy(() => import('./components/PracticeWriting'));
const PracticeMeaning = lazy(() => import('./components/PracticeMeaning'));
const RandomPractice = lazy(() => import('./components/RandomPractice'));
const VocabularyManager = lazy(() => import('./components/VocabularyManager'));
const SentencePractice = lazy(() => import('./components/SentencePractice'));
const SentenceManager = lazy(() => import('./components/SentenceManager'));
const RandomSentencePractice = lazy(() => import('./components/RandomSentencePractice'));
const Translate = lazy(() => import('./components/Translate'));
const StatisticsDashboard = lazy(() => import('./components/StatisticsDashboard'));
const SRSReview = lazy(() => import('./components/SRSReview'));

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

type FunctionType = 'vocabulary' | 'flashcard' | 'writing' | 'meaning' | 'random' | 'manage' | 'sentence-pinyin' | 'sentence-flashcard' | 'sentence-writing' | 'sentence-meaning' | 'sentence-random' | 'sentence-manage' | 'translate' | 'statistics' | 'srs';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [currentLevel, setCurrentLevel] = useState<string>('hsk1');
  const [currentFunction, setCurrentFunction] = useState<FunctionType>('vocabulary');
  const [expandedMenu, setExpandedMenu] = useState<'vocab' | 'sentence' | null>('vocab');
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Xóa tất cả dữ liệu localStorage khi app load
  useEffect(() => {
    // Xóa tất cả keys liên quan đến từ vựng, câu và dịch thuật
    const keysToRemove = [
      'hsk_custom_vocabularies',
      'hsk_vocabulary_overrides',
      'hsk_custom_sentences',
      'translationCache',
      'hsk_learned_vocabularies',
      'hsk_learned_sentences',
      'hsk_wrong_answers',
      'hsk_statistics',
      'hsk_srs_data'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing ${key}:`, error);
      }
    });
    
    console.log('✅ Đã xóa tất cả dữ liệu localStorage');
  }, []);

  // Tự động chọn "Tất cả chủ đề" khi chuyển sang sentence mode
  useEffect(() => {
    const isSentenceMode = currentFunction.startsWith('sentence-');
    if (isSentenceMode) {
      // Mặc định chọn "Tất cả chủ đề" (empty string)
      if (!currentTopic) {
        setCurrentTopic('');
      }
    }
  }, [currentFunction, currentLevel, currentTopic]);

  const handleFunctionChange = useCallback((func: FunctionType) => {
    setCurrentFunction(func);
    // Tự động mở menu tương ứng
    if (func === 'vocabulary' || func === 'flashcard' || func === 'writing' || func === 'meaning' || func === 'random' || func === 'manage') {
      setExpandedMenu('vocab');
    } else if (func === 'sentence-pinyin' || func === 'sentence-flashcard' || func === 'sentence-writing' || func === 'sentence-meaning' || func === 'sentence-random' || func === 'sentence-manage') {
      setExpandedMenu('sentence');
    } else if (func === 'translate' || func === 'statistics' || func === 'srs') {
      setExpandedMenu(null);
    }
    // Đóng drawer khi chọn function trên mobile
    setIsMobileDrawerOpen(false);
  }, []);

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
      case 'flashcard':
        return <Flashcard {...props} />;
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
      case 'sentence-flashcard':
        return <SentencePractice {...sentenceProps} initialMode="flashcard" />;
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
            case 'srs':
              return <SRSReview level={currentLevel} />;
            default:
              return <CheckVocabulary {...props} />;
          }
  }, [currentFunction, currentLevel, currentTopic]);


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
            <h1>🦆 德爱芳</h1>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setShowSupportModal(true)}
              className="btn-support-header"
              title="Ủng hộ dự án"
            >
              <span>☕</span>
              <span className="support-text">Mời tôi một cốc cà phê</span>
              <span>❤️</span>
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
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={isMobileDrawerOpen} 
        onClose={() => setIsMobileDrawerOpen(false)}
      >
        <div className="sidebar-section">
          <h3 className="sidebar-title">Chức năng</h3>
          <nav className="sidebar-menu">
              {/* Học từ */}
              <div className="menu-group">
                <button
                  className="menu-group-header"
                  onClick={() => setExpandedMenu(expandedMenu === 'vocab' ? null : 'vocab')}
                >
                  <span className="menu-icon">📚</span>
                  <span className="menu-text">Học từ</span>
                  <span className="menu-arrow">{expandedMenu === 'vocab' ? '▼' : '▶'}</span>
                </button>
                {expandedMenu === 'vocab' && (
                  <div className="menu-submenu">
                    <button 
                      className={`menu-item ${currentFunction === 'vocabulary' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('vocabulary')}
                    >
                      <span className="menu-icon">📝</span>
                      <span className="menu-text">Viết Pinyin</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'flashcard' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('flashcard')}
                    >
                      <span className="menu-icon">🃏</span>
                      <span className="menu-text">Flashcard</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'writing' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('writing')}
                    >
                      <span className="menu-icon">✍️</span>
                      <span className="menu-text">Viết Hán Tự</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'meaning' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('meaning')}
                    >
                      <span className="menu-icon">💭</span>
                      <span className="menu-text">Viết Nghĩa</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'random' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('random')}
                    >
                      <span className="menu-icon">🎲</span>
                      <span className="menu-text">Luyện tập ngẫu nhiên</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'manage' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('manage')}
                    >
                      <span className="menu-icon">📝</span>
                      <span className="menu-text">Quản lý từ vựng</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Học câu */}
              <div className="menu-group">
                <button
                  className="menu-group-header"
                  onClick={() => setExpandedMenu(expandedMenu === 'sentence' ? null : 'sentence')}
                >
                  <span className="menu-icon">💬</span>
                  <span className="menu-text">Học câu</span>
                  <span className="menu-arrow">{expandedMenu === 'sentence' ? '▼' : '▶'}</span>
                </button>
                {expandedMenu === 'sentence' && (
                  <div className="menu-submenu">
                    <button 
                      className={`menu-item ${currentFunction === 'sentence-pinyin' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence-pinyin')}
                    >
                      <span className="menu-icon">📝</span>
                      <span className="menu-text">Viết Pinyin</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'sentence-flashcard' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence-flashcard')}
                    >
                      <span className="menu-icon">🃏</span>
                      <span className="menu-text">Flashcard</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'sentence-writing' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence-writing')}
                    >
                      <span className="menu-icon">✍️</span>
                      <span className="menu-text">Viết Hán Tự</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'sentence-meaning' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence-meaning')}
                    >
                      <span className="menu-icon">💭</span>
                      <span className="menu-text">Viết Nghĩa</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'sentence-random' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence-random')}
                    >
                      <span className="menu-icon">🎲</span>
                      <span className="menu-text">Luyện tập ngẫu nhiên</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'sentence-manage' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence-manage')}
                    >
                      <span className="menu-icon">📝</span>
                      <span className="menu-text">Quản lý câu</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dịch thuật & Tiện ích */}
              <div className="menu-group">
                <button
                  className={`menu-item menu-item-standalone ${currentFunction === 'translate' ? 'active' : ''}`}
                  onClick={() => handleFunctionChange('translate')}
                >
                  <span className="menu-icon">🌐</span>
                  <span className="menu-text">Dịch thuật</span>
                </button>
                <button
                  className={`menu-item menu-item-standalone ${currentFunction === 'statistics' ? 'active' : ''}`}
                  onClick={() => handleFunctionChange('statistics')}
                >
                  <span className="menu-icon">📊</span>
                  <span className="menu-text">Thống kê</span>
                </button>
                <button
                  className={`menu-item menu-item-standalone ${currentFunction === 'srs' ? 'active' : ''}`}
                  onClick={() => handleFunctionChange('srs')}
                >
                  <span className="menu-icon">🔄</span>
                  <span className="menu-text">SRS Review</span>
                </button>
              </div>
            </nav>
          </div>
      </MobileDrawer>

      <div className="app-layout">
        {/* Desktop Sidebar - Ẩn trên mobile */}
        <aside className="sidebar desktop-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Chức năng</h3>
            <nav className="sidebar-menu">
              {/* Học từ */}
              <div className="menu-group">
                <button
                  className="menu-group-header"
                  onClick={() => setExpandedMenu(expandedMenu === 'vocab' ? null : 'vocab')}
                >
                  <span className="menu-icon">📚</span>
                  <span className="menu-text">Học từ</span>
                  <span className="menu-arrow">{expandedMenu === 'vocab' ? '▼' : '▶'}</span>
                </button>
                {expandedMenu === 'vocab' && (
                  <div className="menu-submenu">
                    <button 
                      className={`menu-item ${currentFunction === 'vocabulary' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('vocabulary')}
                    >
                      <span className="menu-icon">📝</span>
                      <span className="menu-text">Viết Pinyin</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'flashcard' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('flashcard')}
                    >
                      <span className="menu-icon">🃏</span>
                      <span className="menu-text">Flashcard</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'writing' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('writing')}
                    >
                      <span className="menu-icon">✍️</span>
                      <span className="menu-text">Viết Hán Tự</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'meaning' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('meaning')}
                    >
                      <span className="menu-icon">💭</span>
                      <span className="menu-text">Viết Nghĩa</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'random' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('random')}
                    >
                      <span className="menu-icon">🎲</span>
                      <span className="menu-text">Luyện tập ngẫu nhiên</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'manage' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('manage')}
                    >
                      <span className="menu-icon">📝</span>
                      <span className="menu-text">Quản lý từ vựng</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Học câu */}
              <div className="menu-group">
                <button
                  className="menu-group-header"
                  onClick={() => setExpandedMenu(expandedMenu === 'sentence' ? null : 'sentence')}
                >
                  <span className="menu-icon">💬</span>
                  <span className="menu-text">Học câu</span>
                  <span className="menu-arrow">{expandedMenu === 'sentence' ? '▼' : '▶'}</span>
                </button>
                {expandedMenu === 'sentence' && (
                  <div className="menu-submenu">
                    <button 
                      className={`menu-item ${currentFunction === 'sentence-pinyin' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence-pinyin')}
                    >
                      <span className="menu-icon">📝</span>
                      <span className="menu-text">Viết Pinyin</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'sentence-flashcard' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence-flashcard')}
                    >
                      <span className="menu-icon">🃏</span>
                      <span className="menu-text">Flashcard</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'sentence-writing' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence-writing')}
                    >
                      <span className="menu-icon">✍️</span>
                      <span className="menu-text">Viết Hán Tự</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'sentence-meaning' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence-meaning')}
                    >
                      <span className="menu-icon">💭</span>
                      <span className="menu-text">Viết Nghĩa</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'sentence-random' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence-random')}
                    >
                      <span className="menu-icon">🎲</span>
                      <span className="menu-text">Luyện tập ngẫu nhiên</span>
                    </button>
                    <button 
                      className={`menu-item ${currentFunction === 'sentence-manage' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence-manage')}
                    >
                      <span className="menu-icon">📝</span>
                      <span className="menu-text">Quản lý câu</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dịch thuật & Tiện ích */}
              <div className="menu-group">
                <button
                  className={`menu-item menu-item-standalone ${currentFunction === 'translate' ? 'active' : ''}`}
                  onClick={() => handleFunctionChange('translate')}
                >
                  <span className="menu-icon">🌐</span>
                  <span className="menu-text">Dịch thuật</span>
                </button>
                <button
                  className={`menu-item menu-item-standalone ${currentFunction === 'statistics' ? 'active' : ''}`}
                  onClick={() => handleFunctionChange('statistics')}
                >
                  <span className="menu-icon">📊</span>
                  <span className="menu-text">Thống kê</span>
                </button>
                <button
                  className={`menu-item menu-item-standalone ${currentFunction === 'srs' ? 'active' : ''}`}
                  onClick={() => handleFunctionChange('srs')}
                >
                  <span className="menu-icon">🔄</span>
                  <span className="menu-text">SRS Review</span>
                </button>
              </div>

            </nav>
          </div>
        </aside>

        <main className="app-main">
          <Suspense fallback={<ComponentLoader />}>
            {renderFunction}
          </Suspense>
        </main>
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
