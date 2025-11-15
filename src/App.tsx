import { useState, lazy, Suspense, useMemo, useCallback } from 'react';
import './App.css';
import HSKLevelSelector from './components/HSKLevelSelector';
import { resetScores, resetFlashcardProgress } from './utils/resetProgress';

// Lazy load components để giảm bundle size ban đầu
const CheckVocabulary = lazy(() => import('./components/CheckVocabulary'));
const Flashcard = lazy(() => import('./components/Flashcard'));
const PracticeWriting = lazy(() => import('./components/PracticeWriting'));
const RandomPractice = lazy(() => import('./components/RandomPractice'));
const VocabularyManager = lazy(() => import('./components/VocabularyManager'));
const SentencePractice = lazy(() => import('./components/SentencePractice'));
const SentenceManager = lazy(() => import('./components/SentenceManager'));

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

type FunctionType = 'vocabulary' | 'flashcard' | 'writing' | 'random' | 'manage' | 'sentence' | 'sentence-manage';

function App() {
  const [currentLevel, setCurrentLevel] = useState<string>('hsk1');
  const [currentFunction, setCurrentFunction] = useState<FunctionType>('vocabulary');
  const [expandedMenu, setExpandedMenu] = useState<'vocab' | 'sentence' | null>('vocab');

  const handleFunctionChange = useCallback((func: FunctionType) => {
    setCurrentFunction(func);
    // Tự động mở menu tương ứng
    if (func === 'vocabulary' || func === 'flashcard' || func === 'writing' || func === 'random' || func === 'manage') {
      setExpandedMenu('vocab');
    } else if (func === 'sentence' || func === 'sentence-manage') {
      setExpandedMenu('sentence');
    }
  }, []);

  const renderFunction = useMemo(() => {
    const props = { level: currentLevel };
    const managerProps = { currentLevel };
    
    switch (currentFunction) {
      case 'vocabulary':
        return <CheckVocabulary {...props} />;
      case 'flashcard':
        return <Flashcard {...props} />;
      case 'writing':
        return <PracticeWriting {...props} />;
      case 'random':
        return <RandomPractice {...props} />;
      case 'manage':
        return <VocabularyManager {...managerProps} />;
      case 'sentence':
        return <SentencePractice {...props} />;
      case 'sentence-manage':
        return <SentenceManager {...managerProps} />;
      default:
        return <CheckVocabulary {...props} />;
    }
  }, [currentFunction, currentLevel]);

  const handleResetScores = useCallback(() => {
    if (window.confirm('Bạn có chắc muốn reset tất cả điểm số? Điểm sẽ về 0/0.')) {
      resetScores();
    }
  }, []);

  const handleResetFlashcard = useCallback(() => {
    if (window.confirm('Bạn có chắc muốn reset tiến độ flashcard? Số từ đã học sẽ về 0.')) {
      resetFlashcardProgress();
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🦆 Tiếng Trung dễ với DUCK</h1>
          </div>
          <div className="header-actions">
            <HSKLevelSelector 
              currentLevel={currentLevel}
              onLevelChange={setCurrentLevel}
            />
            <div className="reset-buttons-group">
              <button 
                onClick={handleResetScores}
                className="btn-reset btn-reset-score"
                title="Reset điểm số về 0/0"
              >
                <span className="reset-icon">📊</span>
                <span className="reset-text">Reset Điểm</span>
              </button>
              <button 
                onClick={handleResetFlashcard}
                className="btn-reset btn-reset-flashcard"
                title="Reset tiến độ flashcard đã học"
              >
                <span className="reset-icon">🃏</span>
                <span className="reset-text">Reset Flash card</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
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
                      <span className="menu-icon">✅</span>
                      <span className="menu-text">Kiểm tra từ vựng</span>
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
                      <span className="menu-text">Luyện viết</span>
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
                      className={`menu-item ${currentFunction === 'sentence' ? 'active' : ''}`}
                      onClick={() => handleFunctionChange('sentence')}
                    >
                      <span className="menu-icon">💬</span>
                      <span className="menu-text">Học câu tiếng Trung</span>
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
            </nav>
          </div>
        </aside>

        <main className="app-main">
          <Suspense fallback={<ComponentLoader />}>
            {renderFunction}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
