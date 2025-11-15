import { useState, useEffect, useMemo } from 'react';
import type React from 'react';
import { getSentencesForLevelAndTopic, getSentencesForLevel } from '../utils/sentenceStorage';
import './SentencePractice.css';

interface SentencePracticeProps {
  level: string;
  currentTopic: string;
  onTopicChange: (topic: string) => void;
  initialMode?: 'flashcard' | 'pinyin' | 'meaning' | 'writing';
}

const SentencePractice: React.FC<SentencePracticeProps> = ({ level, currentTopic, initialMode = 'pinyin' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'flashcard' | 'pinyin' | 'meaning' | 'writing'>(initialMode);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  // Lưu trạng thái đúng/sai cho từng câu: Map<index, boolean>
  const [sentenceResults, setSentenceResults] = useState<Map<number, boolean>>(new Map());
  // Lưu các câu đã xem (cho flashcard mode)
  const [seenSentences, setSeenSentences] = useState<Set<number>>(new Set());
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<string[]>([]);


  const sentences = useMemo(() => {
    if (currentTopic) {
      return getSentencesForLevelAndTopic(level, currentTopic);
    } else {
      // Nếu không chọn topic (Tất cả chủ đề), lấy tất cả câu của level
      return getSentencesForLevel(level);
    }
  }, [level, currentTopic]);
  
  const currentSentence = sentences.length > 0 ? sentences[currentIndex] : null;

  // Update practiceMode when initialMode prop changes
  useEffect(() => {
    setPracticeMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const updatedSentences = currentTopic 
      ? getSentencesForLevelAndTopic(level, currentTopic)
      : getSentencesForLevel(level);
      
    if (updatedSentences.length > 0) {
      const randomIndex = practiceMode === 'flashcard' ? 0 : Math.floor(Math.random() * updatedSentences.length);
      setCurrentIndex(randomIndex);
      setIsFlipped(false);
      setUserAnswer('');
      setShowResult(false);
      setSentenceResults(new Map()); // Reset kết quả khi đổi topic/level
      setSeenSentences(new Set()); // Reset seen sentences khi đổi topic/level
      if (practiceMode === 'writing') {
        generateOptions(randomIndex, updatedSentences);
      }
    } else {
      setCurrentIndex(0);
    }
  }, [level, currentTopic, practiceMode]);

  // Reload when sentences change
  useEffect(() => {
    const handleSentencesUpdate = () => {
      const updatedSentences = currentTopic 
        ? getSentencesForLevelAndTopic(level, currentTopic)
        : getSentencesForLevel(level);
        
      if (updatedSentences.length > 0) {
        const randomIndex = Math.floor(Math.random() * updatedSentences.length);
        setCurrentIndex(randomIndex);
        setIsFlipped(false);
        setUserAnswer('');
        setShowResult(false);
      }
    };
    
    window.addEventListener('sentencesUpdated', handleSentencesUpdate);
    window.addEventListener('storage', handleSentencesUpdate);
    
    return () => {
      window.removeEventListener('sentencesUpdated', handleSentencesUpdate);
      window.removeEventListener('storage', handleSentencesUpdate);
    };
  }, [level, currentTopic]);

  useEffect(() => {
    const handleResetProgress = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === 'scores' || customEvent.detail?.type === 'all') {
        setSentenceResults(new Map());
      }
      if (customEvent.detail?.type === 'flashcard' || customEvent.detail?.type === 'all') {
        setSeenSentences(new Set());
      }
    };
    
    window.addEventListener('resetProgress', handleResetProgress);
    
    return () => {
      window.removeEventListener('resetProgress', handleResetProgress);
    };
  }, []);

  // Track seen sentences in flashcard mode
  useEffect(() => {
    if (practiceMode === 'flashcard' && currentSentence) {
      setSeenSentences(prev => new Set([...prev, currentIndex]));
    }
  }, [currentIndex, currentSentence, practiceMode]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(sentences.length - 1);
    }
    setIsFlipped(false);
  };

  const handleCardSelect = (index: number) => {
    setCurrentIndex(index);
    setIsFlipped(false);
  };

  const generateOptions = (correctIndex: number, sentenceList: typeof sentences) => {
    const correctSentence = sentenceList[correctIndex];
    const wrongSentences = sentenceList
      .filter((_, idx) => idx !== correctIndex)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(s => s.chinese);
    
    const allOptions = [correctSentence.chinese, ...wrongSentences].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  };

  const handleNext = () => {
    if (practiceMode === 'flashcard') {
      // Navigate sequentially in flashcard mode
      if (currentIndex < sentences.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
      setIsFlipped(false);
    } else {
      // Random navigation for other modes
      if (currentTopic) {
        const updatedSentences = getSentencesForLevelAndTopic(level, currentTopic);
        if (updatedSentences.length > 0) {
          const randomIndex = Math.floor(Math.random() * updatedSentences.length);
          setCurrentIndex(randomIndex);
          setIsFlipped(false);
          setUserAnswer('');
          setShowResult(false);
          if (practiceMode === 'writing') {
            generateOptions(randomIndex, updatedSentences);
          }
        }
      }
    }
  };


  const normalizeAnswer = (answer: string): string => {
    return answer.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  const handleCheck = (answer?: string) => {
    if (!currentSentence) return;

    let correct = false;
    const answerToCheck = answer || userAnswer;
    
    if (practiceMode === 'pinyin') {
      if (!answerToCheck.trim()) return;
      correct = normalizeAnswer(answerToCheck) === normalizeAnswer(currentSentence.pinyin);
    } else if (practiceMode === 'meaning') {
      if (!answerToCheck.trim()) return;
      correct = normalizeAnswer(answerToCheck) === normalizeAnswer(currentSentence.vietnamese);
    } else if (practiceMode === 'writing') {
      if (!answerToCheck.trim()) return;
      correct = answerToCheck.trim() === currentSentence.chinese;
    }

    setIsCorrect(correct);
    setShowResult(true);
    if (answer) setUserAnswer(answer);
    // Lưu kết quả cho câu này
    setSentenceResults(prev => {
      const newMap = new Map(prev);
      newMap.set(currentIndex, correct);
      return newMap;
    });
  };

  const handleTypeCheck = () => {
    if (practiceMode === 'writing' && !userAnswer.trim()) return;
    handleCheck();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && practiceMode !== 'flashcard') {
      if (practiceMode === 'writing' && !showOptions) {
        handleTypeCheck();
      } else if (practiceMode !== 'writing') {
        handleCheck();
      }
    }
  };

  // Tính điểm dựa trên tổng số câu
  const score = useMemo(() => {
    const total = sentences.length;
    const correct = Array.from(sentenceResults.values()).filter(r => r === true).length;
    return { correct, total };
  }, [sentences.length, sentenceResults]);

  if (!currentSentence) {
    return <div className="sentence-practice-empty">Không có câu nào cho chủ đề này</div>;
  }

  return (
    <div className="sentence-practice">
      {practiceMode !== 'flashcard' && (
        <div className="score-display">
          <span>Điểm: {score.correct}/{score.total}</span>
          {score.total > 0 && (
            <span className="percentage">
              ({Math.round((score.correct / score.total) * 100)}%)
            </span>
          )}
          {sentenceResults.size > 0 && (
            <span className="progress-info">
              (Đã làm: {sentenceResults.size}/{score.total})
            </span>
          )}
        </div>
      )}

      <div className="sentence-content">
        {practiceMode === 'flashcard' ? (
          <div className="flashcard-container">
            <div className="progress-info">
              <span>Đã học: {seenSentences.size}/{sentences.length}</span>
              <span>Câu số: {currentIndex + 1}/{sentences.length}</span>
            </div>

            <div 
              className={`sentence-flashcard ${isFlipped ? 'flipped' : ''}`}
              onClick={handleFlip}
            >
              <div className="flashcard-front">
                <div className="sentence-chinese">
                  <h2>{currentSentence.chinese}</h2>
                </div>
                <div className="flashcard-hint">
                  <p>Click để xem đáp án</p>
                </div>
              </div>
              <div className="flashcard-back">
                <div className="sentence-pinyin">
                  <p>{currentSentence.pinyin}</p>
                </div>
                <div className="sentence-vietnamese">
                  <p>{currentSentence.vietnamese}</p>
                </div>
              </div>
            </div>

            <div className="flashcard-controls">
              <button onClick={handlePrevious} className="control-button">
                ← Trước
              </button>
              <button onClick={handleFlip} className="control-button flip-button">
                {isFlipped ? '🔄 Ẩn' : '🔄 Xem'}
              </button>
              <button onClick={handleNext} className="control-button">
                Sau →
              </button>
            </div>

            <div className="flashcard-list">
              <h3>Danh sách câu ({sentences.length} câu)</h3>
              <div className="cards-grid">
                {sentences.map((sentence, index) => (
                  <div
                    key={index}
                    className={`card-item ${index === currentIndex ? 'active' : ''} ${seenSentences.has(index) ? 'seen' : ''}`}
                    onClick={() => handleCardSelect(index)}
                    title={`${sentence.chinese} - ${sentence.vietnamese}`}
                  >
                    <div className="card-number">{index + 1}</div>
                    <div className="card-chinese">{sentence.chinese}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : practiceMode === 'writing' ? (
          <div className="practice-container">
            <div className="practice-mode-selector">
              <button
                className={!showOptions ? 'active' : ''}
                onClick={() => setShowOptions(false)}
              >
                ⌨️ Viết Hán Tự
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
                <h2>{currentSentence.pinyin}</h2>
              </div>
              <div className="meaning-display">
                <p>{currentSentence.vietnamese}</p>
              </div>
              <div className="instruction">
                {showOptions ? 'Chọn câu Hán đúng:' : 'Nhập câu Hán:'}
              </div>
            </div>

            {showOptions ? (
              <div className="options-section">
                <div className="options-grid">
                  {options.map((option, idx) => (
                    <button
                      key={idx}
                      className={`option-button ${showResult && option === currentSentence.chinese ? 'correct-option' : ''} ${showResult && userAnswer === option && option !== currentSentence.chinese ? 'wrong-option' : ''}`}
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
                <div>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập câu Hán..."
                    disabled={showResult}
                    autoFocus
                  />
                  {!showResult && (
                    <button className="check-button" onClick={handleTypeCheck}>
                      Kiểm tra
                    </button>
                  )}
                </div>
              </div>
            )}

            {showResult && (
              <div className="result-section">
                <div className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {isCorrect ? '✓ Đúng rồi!' : '✗ Sai rồi!'}
                </div>
                <div className="correct-answer">
                  Đáp án đúng: <strong>{currentSentence.chinese}</strong>
                </div>
                <button className="next-button" onClick={handleNext} autoFocus>
                  Câu tiếp theo
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="practice-container">
            <div className="sentence-display">
              <div className="sentence-chinese">
                <h2>{currentSentence.chinese}</h2>
              </div>
              {practiceMode === 'pinyin' && (
                <div className="sentence-vietnamese-hint">
                  <p>Nghĩa: {currentSentence.vietnamese}</p>
                </div>
              )}
              {practiceMode === 'meaning' && (
                <div className="sentence-pinyin-hint">
                  <p>Pinyin: {currentSentence.pinyin}</p>
                </div>
              )}
            </div>

            <div className="input-section">
              <label>
                {practiceMode === 'pinyin' ? 'Nhập pinyin:' : 'Nhập nghĩa tiếng Việt:'}
              </label>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={practiceMode === 'pinyin' ? 'Ví dụ: nǐ hǎo' : 'Nhập nghĩa...'}
                disabled={showResult}
                autoFocus
              />
              
              {!showResult && (
                <button className="check-button" onClick={() => handleCheck()}>
                  Kiểm tra
                </button>
              )}

              {showResult && (
                <div className="result-section">
                  <div className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? '✓ Đúng rồi!' : '✗ Sai rồi!'}
                  </div>
                  <div className="answer-details">
                    <div className="correct-answer">
                      {practiceMode === 'pinyin' ? (
                        <>
                          Pinyin đúng: <strong>{currentSentence.pinyin}</strong>
                        </>
                      ) : (
                        <>
                          Nghĩa đúng: <strong>{currentSentence.vietnamese}</strong>
                        </>
                      )}
                    </div>
                    <div className="full-sentence">
                      <p><strong>{currentSentence.chinese}</strong></p>
                      <p>{currentSentence.pinyin}</p>
                      <p>{currentSentence.vietnamese}</p>
                    </div>
                  </div>
                  <button className="next-button" onClick={handleNext} autoFocus>
                    Câu tiếp theo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SentencePractice;

