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

type FunctionType = 'vocabulary' | 'writing' | 'meaning' | 'random' | 'manage' | 'sentence-pinyin' | 'sentence-writing' | 'sentence-meaning' | 'sentence-random' | 'sentence-manage' | 'translate' | 'statistics' | 'srs';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [currentLevel, setCurrentLevel] = useState<string>('hsk1');
  const [currentFunction, setCurrentFunction] = useState<FunctionType>('vocabulary');
  const [expandedMenu, setExpandedMenu] = useState<'vocab' | 'sentence' | null>('vocab');
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  // Custom Background
  const [customBackground, setCustomBackground] = useState<string | null>(() => {
    return localStorage.getItem('custom_app_background');
  });

  // Áp dụng background
  useEffect(() => {
    if (customBackground) {
      document.body.style.backgroundImage = `url(${customBackground})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.animation = 'none'; // Tắt animation liquidBg để ảnh đứng im
    } else {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.animation = '';
    }
  }, [customBackground]);

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Giới hạn size < 5MB để tránh quất đầy LocalStorage
      if (file.size > 5 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh nhỏ hơn 5MB để đảm bảo hiệu năng!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomBackground(base64String);
        try {
          localStorage.setItem('custom_app_background', base64String);
        } catch (error) {
          console.error('LocalStorage quota exceeded:', error);
          alert('Ảnh này có độ phân giải quá cao không thể lưu lại cho lần sau. Tuy vậy nền vẫn sẽ được áp dụng tạm thời.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCustomBackground = () => {
    setCustomBackground(null);
    localStorage.removeItem('custom_app_background');
  };

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
    if (func === 'vocabulary' || func === 'writing' || func === 'meaning' || func === 'random' || func === 'manage') {
      setExpandedMenu('vocab');
    } else if (func === 'sentence-pinyin' || func === 'sentence-writing' || func === 'sentence-meaning' || func === 'sentence-random' || func === 'sentence-manage') {
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
