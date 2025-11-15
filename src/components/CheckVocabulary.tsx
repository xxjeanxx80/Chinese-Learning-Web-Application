import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Vocabulary } from '../data/vocabulary';
import { getVocabulariesForLevel } from '../utils/vocabularyStorage';
import './CheckVocabulary.css';

interface CheckVocabularyProps {
  level: string;
}

const CheckVocabulary: React.FC<CheckVocabularyProps> = ({ level }) => {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>(getVocabulariesForLevel(level));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isCorrect, setIsCorrect] = useState(false);

  // Memoize currentWord để tránh tính toán lại
  const currentWord = useMemo(() => vocabularies[currentIndex], [vocabularies, currentIndex]);
  
  useEffect(() => {
    const updatedVocab = getVocabulariesForLevel(level);
    setVocabularies(updatedVocab);
    if (updatedVocab.length > 0) {
      const randomIndex = Math.floor(Math.random() * updatedVocab.length);
      setCurrentIndex(randomIndex);
      setUserAnswer('');
      setShowResult(false);
    }
  }, [level]);

  // Reload when vocabularies change (from localStorage)
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

  const normalizePinyin = useCallback((pinyin: string): string => {
    return pinyin.toLowerCase().trim().replace(/\s+/g, ' ');
  }, []);

  const handleCheck = useCallback(() => {
    if (!userAnswer.trim() || !currentWord) return;
    
    const normalizedUser = normalizePinyin(userAnswer);
    const normalizedCorrect = normalizePinyin(currentWord.pinyin);
    
    const correct = normalizedUser === normalizedCorrect;
    setIsCorrect(correct);
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));
  }, [userAnswer, currentWord, normalizePinyin]);

  const handleNext = useCallback(() => {
    if (vocabularies.length === 0) return;
    const randomIndex = Math.floor(Math.random() * vocabularies.length);
    setCurrentIndex(randomIndex);
    setUserAnswer('');
    setShowResult(false);
  }, [vocabularies.length]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showResult) {
        handleNext();
      } else {
        handleCheck();
      }
    }
  };

  if (!currentWord) {
    return <div className="check-vocab-empty">Không có từ vựng cho cấp độ này</div>;
  }

  return (
    <div className="check-vocab">
      <div className="score-display">
        <span>Điểm: {score.correct}/{score.total}</span>
        {score.total > 0 && (
          <span className="percentage">
            ({Math.round((score.correct / score.total) * 100)}%)
          </span>
        )}
      </div>

      <div className="word-display">
        <div className="chinese-char">
          <h2>{currentWord.chinese}</h2>
        </div>
        <div className="vietnamese-meaning">
          <p>{currentWord.vietnamese}</p>
        </div>
      </div>

      <div className="input-section">
        <label>Nhập pinyin:</label>
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ví dụ: nǐ hǎo"
          disabled={showResult}
          autoFocus
        />
        
        {!showResult && (
          <button className="check-button" onClick={handleCheck}>
            Kiểm tra
          </button>
        )}

        {showResult && (
          <div className="result-section">
            <div className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? '✓ Đúng rồi!' : '✗ Sai rồi!'}
            </div>
            <div className="correct-answer">
              Đáp án đúng: <strong>{currentWord.pinyin}</strong>
            </div>
            <button className="next-button" onClick={handleNext} autoFocus>
              Từ tiếp theo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CheckVocabulary);
