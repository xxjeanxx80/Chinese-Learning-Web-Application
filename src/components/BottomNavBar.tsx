import React from 'react';
import './BottomNavBar.css';

type FunctionType = 'vocabulary' | 'flashcard' | 'writing' | 'meaning' | 'random' | 'manage' | 'sentence-pinyin' | 'sentence-flashcard' | 'sentence-writing' | 'sentence-meaning' | 'sentence-random' | 'sentence-manage' | 'translate' | 'statistics' | 'srs';

interface BottomNavBarProps {
  currentFunction: FunctionType;
  onFunctionChange: (func: FunctionType) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentFunction, onFunctionChange }) => {
  const handleNavClick = (func: FunctionType) => {
    onFunctionChange(func);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="bottom-nav-bar">
      <button
        className={`bottom-nav-item ${currentFunction === 'vocabulary' ? 'active' : ''}`}
        onClick={() => handleNavClick('vocabulary')}
        title="Học từ - Viết Pinyin"
      >
        <span className="bottom-nav-icon">📝</span>
        <span className="bottom-nav-label">Học từ</span>
      </button>

      <button
        className={`bottom-nav-item ${currentFunction === 'sentence-pinyin' ? 'active' : ''}`}
        onClick={() => handleNavClick('sentence-pinyin')}
        title="Học câu"
      >
        <span className="bottom-nav-icon">💬</span>
        <span className="bottom-nav-label">Học câu</span>
      </button>

      <button
        className={`bottom-nav-item ${currentFunction === 'translate' ? 'active' : ''}`}
        onClick={() => handleNavClick('translate')}
        title="Dịch thuật"
      >
        <span className="bottom-nav-icon">🌐</span>
        <span className="bottom-nav-label">Dịch</span>
      </button>

      <button
        className={`bottom-nav-item ${currentFunction === 'statistics' ? 'active' : ''}`}
        onClick={() => handleNavClick('statistics')}
        title="Thống kê"
      >
        <span className="bottom-nav-icon">📊</span>
        <span className="bottom-nav-label">Thống kê</span>
      </button>

      <button
        className={`bottom-nav-item ${currentFunction === 'srs' ? 'active' : ''}`}
        onClick={() => handleNavClick('srs')}
        title="SRS Review"
      >
        <span className="bottom-nav-icon">🔄</span>
        <span className="bottom-nav-label">SRS</span>
      </button>
    </nav>
  );
};

export default BottomNavBar;

