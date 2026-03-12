import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Vocabulary } from '../data/vocabulary';
import { getVocabulariesForLevel } from '../utils/vocabularyStorage';
import { markVocabularyLearned } from '../utils/learnedItemsStorage';
import { addStudySession } from '../utils/statisticsStorage';
import { saveSessionProgress, loadSessionProgress } from '../utils/sessionProgressStorage';
import { speakChinese } from '../utils/speakChinese';
import StrokeOrderModal from './StrokeOrderModal';
import LearnedWordsPanel from './LearnedWordsPanel';
import './RandomPractice.css';
import './SpeakButton.css';

interface RandomPracticeProps {
  level: string;
}

type PracticeType = 'pinyin' | 'writing' | 'meaning';

interface PracticeQuestion {
  word: Vocabulary;
  type: PracticeType;
  question: string;
  answer: string;
}

const RandomPractice: React.FC<RandomPracticeProps> = ({ level }) => {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>(getVocabulariesForLevel(level));
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  // Lưu trạng thái đúng/sai cho từng từ vựng: Map<chinese, boolean>
  // Mỗi từ vựng chỉ được tính 1 lần (đúng nếu có ít nhất 1 câu đúng)
  const [wordResults, setWordResults] = useState<Map<string, boolean>>(() => 
    loadSessionProgress('vocabulary_random', level, 'results', new Map())
  );
  const [options, setOptions] = useState<string[]>([]);
  const [showPinyin, setShowPinyin] = useState(() => {
    const saved = localStorage.getItem('showPinyinRandom');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const sessionStartTime = useRef<number>(Date.now());

  // Save progress when wordResults changes
  useEffect(() => {
    saveSessionProgress('vocabulary_random', level, 'results', wordResults);
  }, [wordResults, level]);

  useEffect(() => {
    const updatedVocab = getVocabulariesForLevel(level);
    setVocabularies(updatedVocab);
    if (updatedVocab.length > 0) {
      generateQuestion();
    }
  }, [level]);

  useEffect(() => {
    localStorage.setItem('showPinyinRandom', JSON.stringify(showPinyin));
    // Nếu đang có câu hỏi, thì cập nhật lại câu hỏi để thay đổi text câu hỏi (hiện/ẩn pinyin)
    if (currentQuestion) {
      // Giữ nguyên từ vựng hiện tại, chỉ tạo lại question text
      const randomWord = currentQuestion.word;
      const randomType = currentQuestion.type;
      let question: PracticeQuestion;

      const isPinyinVisible = showPinyin;

      switch (randomType) {
        case 'pinyin':
          question = {
            word: randomWord,
            type: 'pinyin',
            question: `Chữ "${randomWord.chinese}" có nghĩa là "${randomWord.vietnamese}". Nhập pinyin:`,
            answer: randomWord.pinyin.toLowerCase().trim()
          };
          break;
        case 'writing':
          question = {
            word: randomWord,
            type: 'writing',
            question: isPinyinVisible 
              ? `Pinyin "${randomWord.pinyin}" có nghĩa là "${randomWord.vietnamese}". Nhập chữ Hán:`
              : `Từ có nghĩa là "${randomWord.vietnamese}". Nhập chữ Hán:`,
            answer: randomWord.chinese
          };
          break;
        case 'meaning':
          question = {
            word: randomWord,
            type: 'meaning',
            question: isPinyinVisible
              ? `Chữ "${randomWord.chinese}" (${randomWord.pinyin}) có nghĩa là gì?`
              : `Chữ "${randomWord.chinese}" có nghĩa là gì?`,
            answer: randomWord.vietnamese.toLowerCase().trim()
          };
          break;
        default:
          return;
      }
      setCurrentQuestion(question);
    }
  }, [showPinyin]);

  // Reload when vocabularies change
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedVocab = getVocabulariesForLevel(level);
      setVocabularies(updatedVocab);
      if (updatedVocab.length > 0) {
        generateQuestion();
      }
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

  const generateQuestion = () => {
    const currentVocab = getVocabulariesForLevel(level);
    if (currentVocab.length === 0) {
      setVocabularies(currentVocab);
      return;
    }

    const randomWord = currentVocab[Math.floor(Math.random() * currentVocab.length)];
    const types: PracticeType[] = ['pinyin', 'writing', 'meaning'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    let question: PracticeQuestion;

    const savedShowPinyin = localStorage.getItem('showPinyinRandom');
    const isPinyinVisible = savedShowPinyin !== null ? JSON.parse(savedShowPinyin) : true;

    switch (randomType) {
      case 'pinyin':
        question = {
          word: randomWord,
          type: 'pinyin',
          question: `Chữ "${randomWord.chinese}" có nghĩa là "${randomWord.vietnamese}". Nhập pinyin:`,
          answer: randomWord.pinyin.toLowerCase().trim()
        };
        break;
      case 'writing':
        question = {
          word: randomWord,
          type: 'writing',
          question: isPinyinVisible 
            ? `Pinyin "${randomWord.pinyin}" có nghĩa là "${randomWord.vietnamese}". Nhập chữ Hán:`
            : `Từ có nghĩa là "${randomWord.vietnamese}". Nhập chữ Hán:`,
          answer: randomWord.chinese
        };
        // Generate options for multiple choice
        const wrongWords = currentVocab
          .filter(w => w.chinese !== randomWord.chinese)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w.chinese);
        setOptions([randomWord.chinese, ...wrongWords].sort(() => Math.random() - 0.5));
        break;
      case 'meaning':
        question = {
          word: randomWord,
          type: 'meaning',
          question: isPinyinVisible
            ? `Chữ "${randomWord.chinese}" (${randomWord.pinyin}) có nghĩa là gì?`
            : `Chữ "${randomWord.chinese}" có nghĩa là gì?`,
          answer: randomWord.vietnamese.toLowerCase().trim()
        };
        // Generate options
        const wrongMeanings = currentVocab
          .filter(w => w.vietnamese !== randomWord.vietnamese)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w.vietnamese);
        setOptions([randomWord.vietnamese, ...wrongMeanings].sort(() => Math.random() - 0.5));
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
    
    // Lưu kết quả cho từ vựng này (theo chinese để tránh trùng lặp)
    const wordKey = currentQuestion.word.chinese;
    setWordResults(prev => {
      const newMap = new Map(prev);
      // Nếu từ này chưa có kết quả, hoặc kết quả trước là sai và bây giờ đúng, thì cập nhật
      if (!newMap.has(wordKey) || (!newMap.get(wordKey) && correct)) {
        newMap.set(wordKey, correct);
      }
      return newMap;
    });

    // Đánh dấu từ vựng đã học (test type từ currentQuestion.type)
    markVocabularyLearned(level, currentQuestion.word, currentQuestion.type, correct);

    // Statistics tracking
    const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    addStudySession(level, correct ? 1 : 0, 1, duration, `vocabulary-random-${currentQuestion.type}`);
    sessionStartTime.current = Date.now();
  };

  // Tính điểm dựa trên tổng số từ vựng
  const score = useMemo(() => {
    const total = vocabularies.length;
    const correct = Array.from(wordResults.values()).filter(r => r === true).length;
    return { correct, total };
  }, [vocabularies.length, wordResults]);

  const handleNext = () => {
    generateQuestion();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentQuestion && currentQuestion.type !== 'writing') {
      handleCheck();
    }
  };

  const [strokeChar, setStrokeChar] = useState<string | null>(null);

  if (!currentQuestion) {
    return <div className="random-practice-empty">Không có từ vựng cho cấp độ này</div>;
  }

  return (
    <>
    <div className="random-practice">
      <div className="practice-header">
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
        <div className="practice-controls">
          <div className="question-type">
            {currentQuestion.type === 'pinyin' && '📝 Kiểm tra Pinyin'}
            {currentQuestion.type === 'writing' && '✍️ Kiểm tra Chữ Hán'}
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
        <button
          className="speak-button"
          onClick={() => speakChinese(currentQuestion.word.chinese)}
          title="Phát âm"
        >
          🔊
        </button>
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
          <div className="answer-details">
            <div className="correct-answer">
              {!isCorrect && (
                <div className="user-wrong">
                  Của bạn: <strong>{userAnswer}</strong>
                </div>
              )}
              <div className="actual-correct">
                Đáp án đúng: <strong>{currentQuestion.answer}</strong>
              </div>
            </div>
            {currentQuestion.type === 'pinyin' && (
              <div className="word-info">
                Chữ: <strong>{currentQuestion.word.chinese}</strong> | 
                Nghĩa: <strong>{currentQuestion.word.vietnamese}</strong>
              </div>
            )}
            {currentQuestion.type === 'writing' && (
              <div className="word-info">
                Pinyin: <strong>{currentQuestion.word.pinyin}</strong> | 
                Nghĩa: <strong>{currentQuestion.word.vietnamese}</strong>
              </div>
            )}
            {currentQuestion.type === 'meaning' && (
              <div className="word-info">
                Chữ: <strong>{currentQuestion.word.chinese}</strong> | 
                Pinyin: <strong>{currentQuestion.word.pinyin}</strong>
              </div>
            )}
          </div>
          <button className="next-button" onClick={handleNext} autoFocus>
            Câu tiếp theo
          </button>
        </div>
      )}
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

export default RandomPractice;
