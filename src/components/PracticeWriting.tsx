import React, { useState, useEffect } from 'react';
import { Vocabulary } from '../data/vocabulary';
import { getVocabulariesForLevel } from '../utils/vocabularyStorage';
import './PracticeWriting.css';

interface PracticeWritingProps {
  level: string;
}

const PracticeWriting: React.FC<PracticeWritingProps> = ({ level }) => {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>(getVocabulariesForLevel(level));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  const currentWord = vocabularies[currentIndex];

  useEffect(() => {
    const updatedVocab = getVocabulariesForLevel(level);
    setVocabularies(updatedVocab);
    if (updatedVocab.length > 0) {
      const randomIndex = Math.floor(Math.random() * updatedVocab.length);
      setCurrentIndex(randomIndex);
      setUserAnswer('');
      setShowResult(false);
      generateOptions(randomIndex, updatedVocab);
    }
  }, [level]);

  // Reload when vocabularies change
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedVocab = getVocabulariesForLevel(level);
      setVocabularies(updatedVocab);
    };
    
    const handleResetProgress = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === 'scores' || customEvent.detail?.type === 'all') {
        setScore({ correct: 0, total: 0 });
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('vocabUpdated', handleStorageChange);
    window.addEventListener('resetProgress', handleResetProgress);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('vocabUpdated', handleStorageChange);
      window.removeEventListener('resetProgress', handleResetProgress);
    };
  }, [level]);

  const generateOptions = (correctIndex: number, vocabList: Vocabulary[]) => {
    const correctWord = vocabList[correctIndex];
    const wrongWords = vocabList
      .filter((_, idx) => idx !== correctIndex)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.chinese);
    
    const allOptions = [correctWord.chinese, ...wrongWords].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  };

  const handleCheck = (answer: string) => {
    const correct = answer === currentWord.chinese;
    setIsCorrect(correct);
    setUserAnswer(answer);
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const handleTypeCheck = () => {
    if (!userAnswer.trim()) return;
    const correct = userAnswer.trim() === currentWord.chinese;
    setIsCorrect(correct);
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const handleNext = () => {
    const randomIndex = Math.floor(Math.random() * vocabularies.length);
    setCurrentIndex(randomIndex);
    setUserAnswer('');
    setShowResult(false);
    generateOptions(randomIndex, vocabularies);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showOptions) {
      handleTypeCheck();
    }
  };

  if (!currentWord) {
    return <div className="practice-writing-empty">Không có từ vựng cho cấp độ này</div>;
  }

  return (
    <div className="practice-writing">
      <div className="score-display">
        <span>Điểm: {score.correct}/{score.total}</span>
        {score.total > 0 && (
          <span className="percentage">
            ({Math.round((score.correct / score.total) * 100)}%)
          </span>
        )}
      </div>

      <div className="practice-mode-selector">
        <button
          className={!showOptions ? 'active' : ''}
          onClick={() => setShowOptions(false)}
        >
          ⌨️ Nhập chữ
        </button>
        <button
          className={showOptions ? 'active' : ''}
          onClick={() => setShowOptions(true)}
        >
          🎯 Chọn đáp án
        </button>
      </div>

      <div className="question-display">
        <div className="pinyin-display">
          <h2>{currentWord.pinyin}</h2>
        </div>
        <div className="meaning-display">
          <p>{currentWord.vietnamese}</p>
        </div>
        <div className="instruction">
          {showOptions ? 'Chọn chữ Hán đúng:' : 'Nhập chữ Hán:'}
        </div>
      </div>

      {showOptions ? (
        <div className="options-section">
          <div className="options-grid">
            {options.map((option, idx) => (
              <button
                key={idx}
                className={`option-button ${showResult && option === currentWord.chinese ? 'correct-option' : ''} ${showResult && userAnswer === option && option !== currentWord.chinese ? 'wrong-option' : ''}`}
                onClick={() => !showResult && handleCheck(option)}
                disabled={showResult}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="input-section">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập chữ Hán..."
            disabled={showResult}
            autoFocus
          />
          {!showResult && (
            <button className="check-button" onClick={handleTypeCheck}>
              Kiểm tra
            </button>
          )}
        </div>
      )}

      {showResult && (
        <div className="result-section">
          <div className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? '✓ Đúng rồi!' : '✗ Sai rồi!'}
          </div>
          <div className="correct-answer">
            Đáp án đúng: <strong>{currentWord.chinese}</strong>
          </div>
          <button className="next-button" onClick={handleNext} autoFocus>
            Câu tiếp theo
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeWriting;
