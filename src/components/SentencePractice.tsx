import { useState, useEffect } from 'react';
import type React from 'react';
import { Sentence } from '../data/sentences';
import { getSentencesForLevelAndTopic, getTopicsForLevel } from '../utils/sentenceStorage';
import './SentencePractice.css';

interface SentencePracticeProps {
  level: string;
}

const SentencePractice: React.FC<SentencePracticeProps> = ({ level }) => {
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPinyin, setShowPinyin] = useState(false);
  const [showVietnamese, setShowVietnamese] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'flashcard' | 'pinyin' | 'meaning'>('flashcard');
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const topics = getTopicsForLevel(level);
  
  // Tự động chọn topic đầu tiên nếu chưa chọn
  useEffect(() => {
    if (topics.length > 0 && !currentTopic) {
      setCurrentTopic(topics[0]);
    }
  }, [level, topics, currentTopic]);

  const sentences = currentTopic ? getSentencesForLevelAndTopic(level, currentTopic) : [];
  const currentSentence = sentences.length > 0 ? sentences[currentIndex] : null;

  useEffect(() => {
    if (currentTopic) {
      const updatedSentences = getSentencesForLevelAndTopic(level, currentTopic);
      if (updatedSentences.length > 0) {
        const randomIndex = Math.floor(Math.random() * updatedSentences.length);
        setCurrentIndex(randomIndex);
        setShowPinyin(false);
        setShowVietnamese(false);
        setIsFlipped(false);
        setUserAnswer('');
        setShowResult(false);
      } else {
        setCurrentIndex(0);
      }
    }
  }, [level, currentTopic]);

  // Reload when sentences change
  useEffect(() => {
    const handleSentencesUpdate = () => {
      if (currentTopic) {
        const updatedSentences = getSentencesForLevelAndTopic(level, currentTopic);
        if (updatedSentences.length > 0) {
          const randomIndex = Math.floor(Math.random() * updatedSentences.length);
          setCurrentIndex(randomIndex);
          setShowPinyin(false);
          setShowVietnamese(false);
          setIsFlipped(false);
          setUserAnswer('');
          setShowResult(false);
        }
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
        setScore({ correct: 0, total: 0 });
      }
    };
    
    window.addEventListener('resetProgress', handleResetProgress);
    
    return () => {
      window.removeEventListener('resetProgress', handleResetProgress);
    };
  }, []);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentTopic) {
      const updatedSentences = getSentencesForLevelAndTopic(level, currentTopic);
      if (updatedSentences.length > 0) {
        const randomIndex = Math.floor(Math.random() * updatedSentences.length);
        setCurrentIndex(randomIndex);
        setShowPinyin(false);
        setShowVietnamese(false);
        setIsFlipped(false);
        setUserAnswer('');
        setShowResult(false);
      }
    }
  };

  const getTopicName = (topic: string): string => {
    const topicNames: Record<string, string> = {
      office: 'Giao tiếp công sở',
      social: 'Giao tiếp xã hội',
      school: 'Giao tiếp trường lớp',
      shopping: 'Giao tiếp mua bán',
      daily: 'Giao tiếp hàng ngày',
      travel: 'Du lịch',
      food: 'Ẩm thực',
      health: 'Sức khỏe'
    };
    return topicNames[topic] || topic;
  };

  const normalizeAnswer = (answer: string): string => {
    return answer.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  const handleCheck = () => {
    if (!userAnswer.trim()) return;

    let correct = false;
    if (practiceMode === 'pinyin') {
      correct = normalizeAnswer(userAnswer) === normalizeAnswer(currentSentence.pinyin);
    } else if (practiceMode === 'meaning') {
      correct = normalizeAnswer(userAnswer) === normalizeAnswer(currentSentence.vietnamese);
    }

    setIsCorrect(correct);
    setShowResult(true);
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && practiceMode !== 'flashcard') {
      handleCheck();
    }
  };

  if (!currentSentence && topics.length === 0) {
    return <div className="sentence-practice-empty">Không có câu nào cho cấp độ này</div>;
  }

  if (!currentSentence) {
    return <div className="sentence-practice-empty">Không có câu nào cho chủ đề này</div>;
  }

  return (
    <div className="sentence-practice">
      <div className="sentence-header">
        <div className="topic-selector">
          <label>Chủ đề:</label>
          <select 
            value={currentTopic} 
            onChange={(e) => setCurrentTopic(e.target.value)}
            className="topic-select"
          >
            {topics.map(topic => (
              <option key={topic} value={topic}>
                {getTopicName(topic)}
              </option>
            ))}
          </select>
        </div>

        <div className="mode-selector">
          <label>Chế độ:</label>
          <div className="mode-buttons">
            <button
              className={practiceMode === 'flashcard' ? 'active' : ''}
              onClick={() => {
                setPracticeMode('flashcard');
                setShowResult(false);
                setUserAnswer('');
              }}
            >
              🃏 Flashcard
            </button>
            <button
              className={practiceMode === 'pinyin' ? 'active' : ''}
              onClick={() => {
                setPracticeMode('pinyin');
                setShowResult(false);
                setUserAnswer('');
              }}
            >
              📝 Luyện Pinyin
            </button>
            <button
              className={practiceMode === 'meaning' ? 'active' : ''}
              onClick={() => {
                setPracticeMode('meaning');
                setShowResult(false);
                setUserAnswer('');
              }}
            >
              💭 Luyện Nghĩa
            </button>
          </div>
        </div>

        <div className="score-display">
          <span>Điểm: {score.correct}/{score.total}</span>
          {score.total > 0 && (
            <span className="percentage">
              ({Math.round((score.correct / score.total) * 100)}%)
            </span>
          )}
        </div>
      </div>

      <div className="sentence-content">
        {practiceMode === 'flashcard' ? (
          <div className="flashcard-container">
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
            <button className="next-button" onClick={handleNext}>
              Câu tiếp theo
            </button>
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
                placeholder={practiceMode === 'pinyin' ? 'Nhập pinyin...' : 'Nhập nghĩa...'}
                disabled={showResult}
                autoFocus
              />
              {!showResult && (
                <button className="check-button" onClick={handleCheck}>
                  Kiểm tra
                </button>
              )}
            </div>

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
        )}
      </div>

      <div className="sentence-info">
        <p>Câu {currentIndex + 1} / {sentences.length} - {level.toUpperCase()} - {currentTopic ? getTopicName(currentTopic) : ''}</p>
      </div>
    </div>
  );
};

export default SentencePractice;

