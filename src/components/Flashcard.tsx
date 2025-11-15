import React, { useState, useEffect } from 'react';
import { Vocabulary } from '../data/vocabulary';
import { getVocabulariesForLevel } from '../utils/vocabularyStorage';
import './Flashcard.css';

interface FlashcardProps {
  level: string;
}

const Flashcard: React.FC<FlashcardProps> = ({ level }) => {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>(getVocabulariesForLevel(level));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [seenWords, setSeenWords] = useState<Set<number>>(new Set());

  const currentWord = vocabularies[currentIndex];

  useEffect(() => {
    const updatedVocab = getVocabulariesForLevel(level);
    setVocabularies(updatedVocab);
    if (updatedVocab.length > 0) {
      const randomIndex = Math.floor(Math.random() * updatedVocab.length);
      setCurrentIndex(randomIndex);
      setIsFlipped(false);
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
      if (customEvent.detail?.type === 'flashcard' || customEvent.detail?.type === 'all') {
        setSeenWords(new Set());
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

  useEffect(() => {
    if (currentWord) {
      setSeenWords(prev => new Set([...prev, currentIndex]));
    }
  }, [currentIndex, currentWord]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    const randomIndex = Math.floor(Math.random() * vocabularies.length);
    setCurrentIndex(randomIndex);
    setIsFlipped(false);
  };

  const handlePrevious = () => {
    const randomIndex = Math.floor(Math.random() * vocabularies.length);
    setCurrentIndex(randomIndex);
    setIsFlipped(false);
  };

  if (!currentWord) {
    return <div className="flashcard-empty">Không có từ vựng cho cấp độ này</div>;
  }

  return (
    <div className="flashcard-container">
      <div className="progress-info">
        <span>Đã học: {seenWords.size}/{vocabularies.length}</span>
        <span>Thẻ số: {currentIndex + 1}/{vocabularies.length}</span>
      </div>

      <div 
        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
        onClick={handleFlip}
      >
        <div className="flashcard-front">
          <div className="card-content">
            <h2>{currentWord.chinese}</h2>
            <p className="hint">Click để xem nghĩa</p>
          </div>
        </div>
        <div className="flashcard-back">
          <div className="card-content">
            <h2>{currentWord.chinese}</h2>
            <div className="pinyin">{currentWord.pinyin}</div>
            <div className="meaning">{currentWord.vietnamese}</div>
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
    </div>
  );
};

export default Flashcard;
