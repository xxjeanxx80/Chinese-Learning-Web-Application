import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Vocabulary } from '../../data/vocabulary';
import { getVocabulariesForLevel } from '../../utils/vocabularyStorage';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { addWrongAnswer, markCorrect } from '../../utils/wrongAnswersStorage';
import { markVocabularyLearned } from '../../utils/learnedItemsStorage';
import { addStudySession } from '../../utils/statisticsStorage';
import { saveSessionProgress, loadSessionProgress } from '../../utils/sessionProgressStorage';
import { speakChinese } from '../../utils/speakChinese';
import StrokeOrderModal from '../StrokeOrderModal';
import LearnedWordsPanel from '../LearnedWordsPanel';
import './CheckVocabulary.css';
import '../SpeakButton.css';

interface CheckVocabularyProps {
  level: string;
}

const CheckVocabulary: React.FC<CheckVocabularyProps> = ({ level }) => {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>(getVocabulariesForLevel(level));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  // Lưu trạng thái đúng/sai cho từng từ vựng: Map<chinese, boolean>
  const [wordResults, setWordResults] = useState<Map<string, boolean>>(() => 
    loadSessionProgress('vocabulary_check', level, 'results', new Map())
  );
  const [isCorrect, setIsCorrect] = useState(false);

  // Memoize currentWord để tránh tính toán lại
  const currentWord = useMemo(() => vocabularies[currentIndex], [vocabularies, currentIndex]);
  
  // Save progress when wordResults changes
  useEffect(() => {
    saveSessionProgress('vocabulary_check', level, 'results', wordResults);
  }, [wordResults, level]);
  
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
        setWordResults(new Map());
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

  const sessionStartTime = React.useRef<number>(Date.now());

  const handleCheck = useCallback(() => {
    if (!userAnswer.trim() || !currentWord) return;
    
    const normalizedUser = normalizePinyin(userAnswer);
    const normalizedCorrect = normalizePinyin(currentWord.pinyin);
    
    const correct = normalizedUser === normalizedCorrect;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Lưu kết quả cho từ vựng này
    setWordResults(prev => {
      const newMap = new Map(prev);
      newMap.set(currentWord.chinese, correct);
      return newMap;
    });
    
    // Lưu vào wrong answers nếu sai, hoặc đánh dấu đúng nếu đúng
    if (correct) {
      markCorrect(level, currentWord);
    } else {
      addWrongAnswer(level, currentWord);
    }

    // Đánh dấu từ vựng đã học (test pinyin)
    markVocabularyLearned(level, currentWord, 'pinyin', correct);

    // Statistics tracking
    const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    addStudySession(level, correct ? 1 : 0, 1, duration, 'vocabulary-check');
    sessionStartTime.current = Date.now();
  }, [userAnswer, currentWord, currentIndex, level, normalizePinyin]);

  // Tính điểm dựa trên tổng số từ vựng
  const score = useMemo(() => {
    const total = vocabularies.length;
    const correct = Array.from(wordResults.values()).filter(r => r === true).length;
    return { correct, total };
  }, [vocabularies.length, wordResults]);

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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onEnter: () => {
      if (showResult) {
        handleNext();
      } else {
        handleCheck();
      }
    },
    onArrowRight: () => {
      if (showResult) {
        handleNext();
      }
    },
    enabled: !showResult || true, // Always enabled
  });

  const [strokeChar, setStrokeChar] = useState<string | null>(null);

  if (!currentWord) {
    return <div className="check-vocab-empty">Không có từ vựng cho cấp độ này</div>;
  }

  return (
    <>
    <div className="check-vocab">
      <div className="score-display">
        <span>Từ đã học được: {score.correct}/{score.total}</span>
        {score.total > 0 && (
          <span className="percentage">
            ({Math.round((score.correct / score.total) * 100)}%)
          </span>
        )}
        {wordResults.size > 0 && (
          <span className="progress-info">
            (Đã làm: {wordResults.size}/{score.total})
          </span>
        )}
      </div>

      <div className="word-display">
            <button
              className="speak-button"
              onClick={() => speakChinese(currentWord.chinese)}
              title="Phát âm"
            >
              🔊
            </button>
            <div className="chinese-char" onClick={() => setStrokeChar(currentWord.chinese)} style={{cursor: 'pointer'}} title="Xem nét viết">
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
            />
            
            {!showResult && (
              <button className="check-button" onClick={handleCheck}>
                Kiểm tra
              </button>
            )}

            {showResult && (
              <div className={`result-section ${isCorrect ? 'is-correct' : 'is-incorrect'}`}>
                <div className="correct-answer">
                  {!isCorrect && (
                    <div className="user-wrong">
                      Của bạn: <strong>{userAnswer}</strong>
                    </div>
                  )}
                  <div className="actual-correct">
                    Đáp án đúng: <strong>{currentWord.pinyin}</strong>
                  </div>
                </div>
                <button className="next-button" onClick={handleNext} autoFocus>
                  Từ tiếp theo
                </button>
              </div>
            )}
      </div>
    </div>

    <LearnedWordsPanel
      level={level}
      vocabularies={vocabularies}
      wordResults={wordResults}
    />

    {strokeChar && (
      <StrokeOrderModal
        character={strokeChar}
        onClose={() => setStrokeChar(null)}
      />
    )}
    </>
  );
};

export default memo(CheckVocabulary);
