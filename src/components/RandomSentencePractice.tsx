import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sentence } from '../data/sentences';
import { getSentencesForLevelAndTopic } from '../utils/sentenceStorage';
import { markSentenceLearned } from '../utils/learnedItemsStorage';
import { addStudySession } from '../utils/statisticsStorage';
import './RandomSentencePractice.css';

interface RandomSentencePracticeProps {
  level: string;
  currentTopic: string;
  onTopicChange: (topic: string) => void;
}

type PracticeType = 'pinyin' | 'writing' | 'meaning';

interface PracticeQuestion {
  sentence: Sentence;
  type: PracticeType;
  question: string;
  answer: string;
}

const RandomSentencePractice: React.FC<RandomSentencePracticeProps> = ({ level, currentTopic }) => {
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  // Lưu trạng thái đúng/sai cho từng câu: Map<chinese, boolean>
  // Mỗi câu chỉ được tính 1 lần (đúng nếu có ít nhất 1 câu đúng)
  const [sentenceResults, setSentenceResults] = useState<Map<string, boolean>>(new Map());
  const [options, setOptions] = useState<string[]>([]);
  const [showPinyin, setShowPinyin] = useState(() => {
    const saved = localStorage.getItem('showPinyinRandomSentence');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const sessionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    localStorage.setItem('showPinyinRandomSentence', JSON.stringify(showPinyin));
    // Nếu đang có câu hỏi, thì cập nhật lại câu hỏi để thay đổi text câu hỏi (hiện/ẩn pinyin)
    if (currentQuestion) {
      // Giữ nguyên câu hiện tại, chỉ tạo lại question text
      const randomSentence = currentQuestion.sentence;
      const randomType = currentQuestion.type;
      let question: PracticeQuestion;

      const isPinyinVisible = showPinyin;

      switch (randomType) {
        case 'pinyin':
          question = {
            sentence: randomSentence,
            type: 'pinyin',
            question: `Câu "${randomSentence.chinese}" có nghĩa là "${randomSentence.vietnamese}". Nhập pinyin:`,
            answer: randomSentence.pinyin.toLowerCase().trim()
          };
          break;
        case 'writing':
          question = {
            sentence: randomSentence,
            type: 'writing',
            question: isPinyinVisible
              ? `Pinyin "${randomSentence.pinyin}" có nghĩa là "${randomSentence.vietnamese}". Nhập câu Hán:`
              : `Câu có nghĩa là "${randomSentence.vietnamese}". Nhập câu Hán:`,
            answer: randomSentence.chinese
          };
          break;
        case 'meaning':
          question = {
            sentence: randomSentence,
            type: 'meaning',
            question: isPinyinVisible
              ? `Câu "${randomSentence.chinese}" (${randomSentence.pinyin}) có nghĩa là gì?`
              : `Câu "${randomSentence.chinese}" có nghĩa là gì?`,
            answer: randomSentence.vietnamese.toLowerCase().trim()
          };
          break;
        default:
          return;
      }
      setCurrentQuestion(question);
    }
  }, [showPinyin]);

  useEffect(() => {
    if (currentTopic) {
      const sentences = getSentencesForLevelAndTopic(level, currentTopic);
      if (sentences.length > 0) {
        generateQuestion();
      }
    }
  }, [level, currentTopic]);

  // Reload when sentences change
  useEffect(() => {
    const handleSentencesUpdate = () => {
      if (currentTopic) {
        const sentences = getSentencesForLevelAndTopic(level, currentTopic);
        if (sentences.length > 0) {
          generateQuestion();
        }
      }
    };
    
    const handleResetProgress = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === 'scores' || customEvent.detail?.type === 'all') {
        setSentenceResults(new Map());
      }
    };
    
    window.addEventListener('storage', handleSentencesUpdate);
    window.addEventListener('sentencesUpdated', handleSentencesUpdate);
    window.addEventListener('resetProgress', handleResetProgress);
    
    return () => {
      window.removeEventListener('storage', handleSentencesUpdate);
      window.removeEventListener('sentencesUpdated', handleSentencesUpdate);
      window.removeEventListener('resetProgress', handleResetProgress);
    };
  }, [level, currentTopic]);

  const generateQuestion = () => {
    if (!currentTopic) return;
    
    const sentences = getSentencesForLevelAndTopic(level, currentTopic);
    if (sentences.length === 0) {
      setCurrentQuestion(null);
      return;
    }

    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
    const types: PracticeType[] = ['pinyin', 'writing', 'meaning'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    let question: PracticeQuestion;

    const savedShowPinyin = localStorage.getItem('showPinyinRandomSentence');
    const isPinyinVisible = savedShowPinyin !== null ? JSON.parse(savedShowPinyin) : true;

    switch (randomType) {
      case 'pinyin':
        question = {
          sentence: randomSentence,
          type: 'pinyin',
          question: `Câu "${randomSentence.chinese}" có nghĩa là "${randomSentence.vietnamese}". Nhập pinyin:`,
          answer: randomSentence.pinyin.toLowerCase().trim()
        };
        break;
      case 'writing':
        question = {
          sentence: randomSentence,
          type: 'writing',
          question: isPinyinVisible
            ? `Pinyin "${randomSentence.pinyin}" có nghĩa là "${randomSentence.vietnamese}". Nhập câu Hán:`
            : `Câu có nghĩa là "${randomSentence.vietnamese}". Nhập câu Hán:`,
          answer: randomSentence.chinese
        };
        // Generate options for multiple choice
        const wrongSentences = sentences
          .filter(s => s.chinese !== randomSentence.chinese)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(s => s.chinese);
        setOptions([randomSentence.chinese, ...wrongSentences].sort(() => Math.random() - 0.5));
        break;
      case 'meaning':
        question = {
          sentence: randomSentence,
          type: 'meaning',
          question: isPinyinVisible
            ? `Câu "${randomSentence.chinese}" (${randomSentence.pinyin}) có nghĩa là gì?`
            : `Câu "${randomSentence.chinese}" có nghĩa là gì?`,
          answer: randomSentence.vietnamese.toLowerCase().trim()
        };
        // Generate options
        const wrongMeanings = sentences
          .filter(s => s.vietnamese !== randomSentence.vietnamese)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(s => s.vietnamese);
        setOptions([randomSentence.vietnamese, ...wrongMeanings].sort(() => Math.random() - 0.5));
        break;
      default:
        return;
    }

    setCurrentQuestion(question);
    setUserAnswer('');
    setShowResult(false);
  };

  const normalizeAnswer = (answer: string): string => {
    return answer.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  const handleCheck = (answer?: string) => {
    if (!currentQuestion) return;

    const answerToCheck = answer || userAnswer;
    if (!answerToCheck.trim()) return;

    let correct = false;

    if (currentQuestion.type === 'pinyin') {
      correct = normalizeAnswer(answerToCheck) === normalizeAnswer(currentQuestion.answer);
    } else if (currentQuestion.type === 'writing') {
      correct = answerToCheck.trim() === currentQuestion.answer;
    } else {
      correct = normalizeAnswer(answerToCheck) === normalizeAnswer(currentQuestion.answer);
    }

    setIsCorrect(correct);
    setShowResult(true);
    if (answer) setUserAnswer(answer);
    
    // Lưu kết quả cho câu này (theo chinese để tránh trùng lặp)
    const sentenceKey = currentQuestion.sentence.chinese;
    setSentenceResults(prev => {
      const newMap = new Map(prev);
      // Nếu câu này chưa có kết quả, hoặc kết quả trước là sai và bây giờ đúng, thì cập nhật
      if (!newMap.has(sentenceKey) || (!newMap.get(sentenceKey) && correct)) {
        newMap.set(sentenceKey, correct);
      }
      return newMap;
    });

    // Đánh dấu câu đã học (test type từ currentQuestion.type)
    if (currentTopic) {
      markSentenceLearned(level, currentTopic, currentQuestion.sentence, currentQuestion.type, correct);
    }

    // Statistics tracking
    const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    addStudySession(level, correct ? 1 : 0, 1, duration, `sentence-random-${currentQuestion.type}`);
    sessionStartTime.current = Date.now();
  };

  // Tính điểm dựa trên tổng số câu
  const score = useMemo(() => {
    if (!currentTopic) return { correct: 0, total: 0 };
    const sentences = getSentencesForLevelAndTopic(level, currentTopic);
    const total = sentences.length;
    const correct = Array.from(sentenceResults.values()).filter(r => r === true).length;
    return { correct, total };
  }, [level, currentTopic, sentenceResults]);

  const handleNext = () => {
    generateQuestion();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentQuestion && currentQuestion.type !== 'writing') {
      handleCheck();
    }
  };

  if (!currentTopic) {
    return <div className="random-sentence-practice-empty">Vui lòng chọn chủ đề ở trên</div>;
  }

  if (!currentQuestion) {
    return <div className="random-sentence-practice-empty">Không có câu nào cho chủ đề này</div>;
  }

  return (
    <div className="random-sentence-practice">
      <div className="practice-header">
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
        <div className="practice-controls">
          <div className="question-type">
            {currentQuestion.type === 'pinyin' && '📝 Viết Pinyin'}
            {currentQuestion.type === 'writing' && '✍️ Viết Hán Tự'}
            {currentQuestion.type === 'meaning' && '💭 Kiểm tra Nghĩa'}
          </div>
          <button
            className={`pinyin-toggle ${!showPinyin ? 'off' : ''}`}
            onClick={() => setShowPinyin(!showPinyin)}
            title={showPinyin ? "Ẩn Pinyin" : "Hiện Pinyin"}
          >
            {showPinyin ? '👁️ Pinyin' : '🙈 Pinyin'}
          </button>
        </div>
      </div>

      <div className="question-display">
        <p className="question-text">{currentQuestion.question}</p>
      </div>

      {currentQuestion.type === 'writing' || currentQuestion.type === 'meaning' ? (
        <div className="options-section">
          <div className="options-grid">
            {options.map((option, idx) => (
              <button
                key={idx}
                className={`option-button ${showResult && option === currentQuestion.answer ? 'correct-option' : ''} ${showResult && userAnswer === option && option !== currentQuestion.answer ? 'wrong-option' : ''}`}
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
            placeholder="Nhập đáp án..."
            disabled={showResult}
          />
          {!showResult && (
            <button className="check-button" onClick={() => handleCheck()}>
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
              Đáp án đúng:{' '}
              {currentQuestion.type === 'meaning' ? (
                <strong>{currentQuestion.sentence.vietnamese}</strong>
              ) : (
                <strong>
                  {currentQuestion.sentence.chinese} ({currentQuestion.sentence.pinyin})
                </strong>
              )}
            </div>
          </div>
          <button className="next-button" onClick={handleNext} autoFocus>
            Câu tiếp theo
          </button>
        </div>
      )}
    </div>
  );
};

export default RandomSentencePractice;

