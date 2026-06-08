import React from 'react';
import './BottomNavBar.css';

type FunctionType = 'vocabulary' | 'writing' | 'meaning' | 'random' | 'manage' | 'sentence-pinyin' | 'sentence-writing' | 'sentence-meaning' | 'sentence-random' | 'sentence-manage' | 'translate' | 'statistics';

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
        <span className="bottom-nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </span>
        <span className="bottom-nav-label">Học từ</span>
      </button>

      <button
        className={`bottom-nav-item ${currentFunction === 'sentence-pinyin' ? 'active' : ''}`}
        onClick={() => handleNavClick('sentence-pinyin')}
        title="Học câu"
      >
        <span className="bottom-nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </span>
        <span className="bottom-nav-label">Học câu</span>
      </button>

      <button
        className={`bottom-nav-item ${currentFunction === 'translate' ? 'active' : ''}`}
        onClick={() => handleNavClick('translate')}
        title="Dịch thuật"
      >
        <span className="bottom-nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </span>
        <span className="bottom-nav-label">Dịch</span>
      </button>

      <button
        className={`bottom-nav-item ${currentFunction === 'statistics' ? 'active' : ''}`}
        onClick={() => handleNavClick('statistics')}
        title="Thống kê"
      >
        <span className="bottom-nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </span>
        <span className="bottom-nav-label">Thống kê</span>
      </button>

    </nav>
  );
};

export default BottomNavBar;

