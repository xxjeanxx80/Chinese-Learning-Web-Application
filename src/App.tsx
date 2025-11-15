import { useState } from 'react';
import './App.css';
import TabNavigation from './components/TabNavigation';
import CheckVocabulary from './components/CheckVocabulary';
import Flashcard from './components/Flashcard';
import PracticeWriting from './components/PracticeWriting';
import RandomPractice from './components/RandomPractice';
import VocabularyManager from './components/VocabularyManager';
import { resetScores, resetFlashcardProgress } from './utils/resetProgress';

type FunctionType = 'vocabulary' | 'flashcard' | 'writing' | 'random' | 'manage';

function App() {
  const [currentLevel, setCurrentLevel] = useState<string>('hsk1');
  const [currentFunction, setCurrentFunction] = useState<FunctionType>('vocabulary');

  const renderFunction = () => {
    switch (currentFunction) {
      case 'vocabulary':
        return <CheckVocabulary level={currentLevel} />;
      case 'flashcard':
        return <Flashcard level={currentLevel} />;
      case 'writing':
        return <PracticeWriting level={currentLevel} />;
      case 'random':
        return <RandomPractice level={currentLevel} />;
      case 'manage':
        return <VocabularyManager currentLevel={currentLevel} />;
      default:
        return <CheckVocabulary level={currentLevel} />;
    }
  };

  const handleResetScores = () => {
    if (window.confirm('Bạn có chắc muốn reset tất cả điểm số? Điểm sẽ về 0/0.')) {
      resetScores();
    }
  };

  const handleResetFlashcard = () => {
    if (window.confirm('Bạn có chắc muốn reset tiến độ flashcard? Số từ đã học sẽ về 0.')) {
      resetFlashcardProgress();
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📚 App Học Tiếng Trung HSK</h1>
            <p>Chọn cấp độ và chức năng để bắt đầu học</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={handleResetScores}
              className="btn-reset"
              title="Reset điểm số"
            >
              🔄 Reset điểm
            </button>
            <button 
              onClick={handleResetFlashcard}
              className="btn-reset"
              title="Reset flashcard đã học"
            >
              🔄 Reset flashcard
            </button>
          </div>
        </div>
      </header>

      <TabNavigation 
        currentLevel={currentLevel} 
        onLevelChange={setCurrentLevel} 
      />

      <div className="function-selector">
        <button 
          className={currentFunction === 'vocabulary' ? 'active' : ''}
          onClick={() => setCurrentFunction('vocabulary')}
        >
          ✅ Kiểm tra từ vựng
        </button>
        <button 
          className={currentFunction === 'flashcard' ? 'active' : ''}
          onClick={() => setCurrentFunction('flashcard')}
        >
          🃏 Flashcard
        </button>
        <button 
          className={currentFunction === 'writing' ? 'active' : ''}
          onClick={() => setCurrentFunction('writing')}
        >
          ✍️ Luyện viết
        </button>
        <button 
          className={currentFunction === 'random' ? 'active' : ''}
          onClick={() => setCurrentFunction('random')}
        >
          🎲 Luyện tập ngẫu nhiên
        </button>
        <button 
          className={currentFunction === 'manage' ? 'active' : ''}
          onClick={() => setCurrentFunction('manage')}
        >
          📝 Quản lý từ vựng
        </button>
      </div>

      <main className="app-main">
        {renderFunction()}
      </main>
    </div>
  );
}

export default App;
