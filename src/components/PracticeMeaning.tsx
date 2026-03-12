import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Vocabulary } from '../data/vocabulary';
import { getVocabulariesForLevel } from '../utils/vocabularyStorage';
import { markVocabularyLearned } from '../utils/learnedItemsStorage';
import { addStudySession } from '../utils/statisticsStorage';
import { speakChinese } from '../utils/speakChinese';
import './PracticeMeaning.css';
import './SpeakButton.css';

interface PracticeMeaningProps {
  level: string;
}

const PracticeMeaning: React.FC<PracticeMeaningProps> = ({ level }) => {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>(getVocabulariesForLevel(level));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  // Lưu trạng thái đúng/sai cho từng từ vựng: Map<index, boolean>
  const [wordResults, setWordResults] = useState<Map<number, boolean>>(new Map());
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [showPinyin, setShowPinyin] = useState(() => {
    const saved = localStorage.getItem('showPinyinMeaning');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const currentWord = vocabularies[currentIndex];

  useEffect(() => {
    localStorage.setItem('showPinyinMeaning', JSON.stringify(showPinyin));
  }, [showPinyin]);

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

  const generateOptions = (correctIndex: number, vocabList: Vocabulary[]) => {
    const correctWord = vocabList[correctIndex];
    const wrongMeanings = vocabList
      .filter((_, idx) => idx !== correctIndex)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.vietnamese);
    
    const allOptions = [correctWord.vietnamese, ...wrongMeanings].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  };

  const normalizeAnswer = (answer: string): string => {
    return answer.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  const sessionStartTime = useRef<number>(Date.now());

  const handleCheck = (answer: string) => {
    if (!currentWord) return;
    const correct = normalizeAnswer(answer) === normalizeAnswer(currentWord.vietnamese);
    
    setIsCorrect(correct);
    setUserAnswer(answer);
    setShowResult(true);
    // Lưu kết quả cho từ vựng này
    setWordResults(prev => {
      const newMap = new Map(prev);
      newMap.set(currentIndex, correct);
      return newMap;
    });

    // Đánh dấu từ vựng đã học (test meaning)
    markVocabularyLearned(level, currentWord, 'meaning', correct);

    // Statistics tracking
    const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    addStudySession(level, correct ? 1 : 0, 1, duration, 'vocabulary-meaning');
    sessionStartTime.current = Date.now();
  };

  const handleTypeCheck = () => {
    if (!userAnswer.trim() || !currentWord) return;
    const correct = normalizeAnswer(userAnswer) === normalizeAnswer(currentWord.vietnamese);
    
    setIsCorrect(correct);
    setShowResult(true);
    // Lưu kết quả cho từ vựng này
    setWordResults(prev => {
      const newMap = new Map(prev);
      newMap.set(currentIndex, correct);
      return newMap;
    });

    // Đánh dấu từ vựng đã học (test meaning)
    markVocabularyLearned(level, currentWord, 'meaning', correct);

    // Statistics tracking
    const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    addStudySession(level, correct ? 1 : 0, 1, duration, 'vocabulary-meaning');
    sessionStartTime.current = Date.now();
  };

  // Tính điểm dựa trên tổng số từ vựng
  const score = useMemo(() => {
    const total = vocabularies.length;
    const correct = Array.from(wordResults.values()).filter(r => r === true).length;
    return { correct, total };
  }, [vocabularies.length, wordResults]);

  const handleNext = () => {
    const randomIndex = Math.floor(Math.random() * vocabularies.length);
    setCurrentIndex(randomIndex);
    setUserAnswer('');
    setShowResult(false);
    if (vocabularies.length > 0) {
      generateOptions(randomIndex, vocabularies);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showOptions) {
      handleTypeCheck();
    }
  };

  if (!currentWord) {
    return <div className="practice-meaning-empty">Không có từ vựng cho cấp độ này</div>;
  }

  return (
    <div className="practice-meaning">
      <div className="score-display">
        <span>Điểm: {score.correct}/{score.total}</span>
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

      <div className="practice-mode-selector">
        <button
          className={!showOptions ? 'active' : ''}
          onClick={() => setShowOptions(false)}
        >
          ⌨️ Nhập nghĩa
        </button>
        <button
          className={showOptions ? 'active' : ''}
          onClick={() => setShowOptions(true)}
        >
          🎯 Chọn đáp án
        </button>
        <button
          className={`pinyin-toggle ${!showPinyin ? 'off' : ''}`}
          onClick={() => setShowPinyin(!showPinyin)}
          title={showPinyin ? "Ẩn Pinyin" : "Hiện Pinyin"}
        >
          {showPinyin ? '👁️ Pinyin' : '🙈 Pinyin'}
        </button>
      </div>

      <div className="question-display">
        <button
          className="speak-button"
          onClick={() => speakChinese(currentWord.chinese)}
          title="Phát âm"
        >
          🔊
        </button>
        <div className="chinese-display">
          <h2>{currentWord.chinese}</h2>
        </div>
        {showPinyin && (
          <div className="pinyin-hint">
            <p>Pinyin: {currentWord.pinyin}</p>
          </div>
        )}
        <div className="instruction">
          {showOptions ? 'Chọn nghĩa đúng:' : 'Nhập nghĩa tiếng Việt:'}
        </div>
      </div>

      {showOptions ? (
        <div className="options-section">
          <div className="options-grid">
            {options.map((option, idx) => {
              const isCorrectOption = normalizeAnswer(option) === normalizeAnswer(currentWord.vietnamese);
              const isWrongOption = showResult && userAnswer === option && !isCorrectOption;
              
              return (
                <button
                  key={idx}
                  className={`option-button ${showResult && isCorrectOption ? 'correct-option' : ''} ${isWrongOption ? 'wrong-option' : ''}`}
                  onClick={() => !showResult && handleCheck(option)}
                  disabled={showResult}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="input-section">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập nghĩa tiếng Việt..."
            disabled={showResult}
          />
          {!showResult && (
            <button className="check-button" onClick={handleTypeCheck}>
              Kiểm tra
            </button>
          )}
        </div>
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
              Đáp án đúng: <strong>{currentWord.vietnamese}</strong>
            </div>
          </div>
          <div className="word-info">
            Chữ: <strong>{currentWord.chinese}</strong> | 
            Pinyin: <strong>{currentWord.pinyin}</strong>
          </div>
          <button className="next-button" onClick={handleNext} autoFocus>
            Từ tiếp theo
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeMeaning;

