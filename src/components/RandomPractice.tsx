import React, { useState, useEffect } from 'react';
import { Vocabulary } from '../data/vocabulary';
import { getVocabulariesForLevel } from '../utils/vocabularyStorage';
import './RandomPractice.css';

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
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    const updatedVocab = getVocabulariesForLevel(level);
    setVocabularies(updatedVocab);
    if (updatedVocab.length > 0) {
      generateQuestion();
    }
  }, [level]);

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
          question: `Pinyin "${randomWord.pinyin}" có nghĩa là "${randomWord.vietnamese}". Nhập chữ Hán:`,
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
          question: `Chữ "${randomWord.chinese}" (${randomWord.pinyin}) có nghĩa là gì?`,
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
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const handleNext = () => {
    generateQuestion();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentQuestion && currentQuestion.type !== 'writing') {
      handleCheck();
    }
  };

  if (!currentQuestion) {
    return <div className="random-practice-empty">Không có từ vựng cho cấp độ này</div>;
  }

  return (
    <div className="random-practice">
      <div className="practice-header">
        <div className="score-display">
          <span>Điểm: {score.correct}/{score.total}</span>
          {score.total > 0 && (
            <span className="percentage">
              ({Math.round((score.correct / score.total) * 100)}%)
            </span>
          )}
        </div>
        <div className="question-type">
          {currentQuestion.type === 'pinyin' && '📝 Kiểm tra Pinyin'}
          {currentQuestion.type === 'writing' && '✍️ Kiểm tra Chữ Hán'}
          {currentQuestion.type === 'meaning' && '💭 Kiểm tra Nghĩa'}
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
            autoFocus
          />
          {!showResult && (
            <button className="check-button" onClick={() => handleCheck()}>
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
          <div className="answer-details">
            <div className="correct-answer">
              Đáp án đúng: <strong>{currentQuestion.answer}</strong>
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
  );
};

export default RandomPractice;
