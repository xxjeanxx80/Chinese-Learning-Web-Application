import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import './StrokeOrderModal.css';

interface StrokeOrderModalProps {
  character: string;
  onClose: () => void;
}

const StrokeOrderModal: React.FC<StrokeOrderModalProps> = ({ character, onClose }) => {
  const writerRef = useRef<HTMLDivElement>(null);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const writerInstance = useRef<HanziWriter | null>(null);

  const chars = character.split('').filter((c) => /[\u4e00-\u9fff]/.test(c));
  const currentChar = chars[currentCharIndex] || chars[0];

  useEffect(() => {
    if (!writerRef.current || !currentChar) return;

    // Clear previous writer
    if (writerRef.current) {
      writerRef.current.innerHTML = '';
    }

    // Detect theme colors from computed styles
    const writer = HanziWriter.create(writerRef.current!, currentChar, {
      width: 220,
      height: 220,
      padding: 10,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 300,
      strokeColor: '#333333', // Always use dark color on the white board
      radicalColor: '#007AFF',
      outlineColor: '#EEEEEE',
      drawingColor: '#007AFF',
      showOutline: true,
      showCharacter: true,
    });

    writerInstance.current = writer;

    return () => {
      writerInstance.current = null;
    };
  }, [currentChar]);

  const handleAnimate = () => {
    if (writerInstance.current && !isAnimating) {
      setIsAnimating(true);
      writerInstance.current.animateCharacter({
        onComplete: () => setIsAnimating(false),
      });
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!chars.length) return null;

  return (
    <div className="stroke-modal-overlay" onClick={handleOverlayClick}>
      <div className="stroke-modal">
        <button className="stroke-modal-close" onClick={onClose}>✕</button>
        
        <div className="stroke-modal-header">
          <h3>Thứ tự nét viết</h3>
          {chars.length > 1 && (
            <div className="char-tabs">
              {chars.map((c, i) => (
                <button
                  key={i}
                  className={`char-tab ${i === currentCharIndex ? 'active' : ''}`}
                  onClick={() => setCurrentCharIndex(i)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="stroke-writer-container" ref={writerRef} />

        <div className="stroke-modal-actions">
          <button
            className="stroke-btn animate"
            onClick={handleAnimate}
            disabled={isAnimating}
          >
            {isAnimating ? '⏳ Đang viết...' : '▶️ Xem nét viết'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrokeOrderModal;
