import React, { useState, useEffect, useCallback } from 'react';
import { getItemsToReview, reviewSRSItem, SRSItem } from '../utils/srsStorage';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { saveSessionProgress, loadSessionProgress } from '../utils/sessionProgressStorage';
import './SRSReview.css';

interface SRSReviewProps {
  level: string;
}

const SRSReview: React.FC<SRSReviewProps> = ({ level }) => {
  const [itemsToReview, setItemsToReview] = useState<SRSItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(() => 
    loadSessionProgress('srs_review', level, 'currentIndex', 0)
  );
  const [showAnswer, setShowAnswer] = useState(false);
  const [completedCount, setCompletedCount] = useState(() => 
    loadSessionProgress('srs_review', level, 'completedCount', 0)
  );

  useEffect(() => {
    loadItemsToReview();
  }, [level]);

  // Save session state
  useEffect(() => {
    saveSessionProgress('srs_review', level, 'currentIndex', currentIndex);
  }, [currentIndex, level]);

  useEffect(() => {
    saveSessionProgress('srs_review', level, 'completedCount', completedCount);
  }, [completedCount, level]);

  const loadItemsToReview = () => {
    const items = getItemsToReview(level);
    setItemsToReview(items);
    if (items.length > 0) {
      setCurrentIndex(0);
      setShowAnswer(false);
      setCompletedCount(0);
    }
  };

  const currentItem = itemsToReview[currentIndex];

  const handleReview = useCallback((quality: number) => {
    if (!currentItem) return;

    // Review với quality (0-5)
    reviewSRSItem(level, currentItem.vocabulary, quality);

    setCompletedCount(prev => prev + 1);

    // Chuyển sang item tiếp theo
    if (currentIndex < itemsToReview.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      // Hoàn thành review, load lại danh sách
      setTimeout(() => {
        loadItemsToReview();
      }, 500);
    }
  }, [currentItem, level, currentIndex, itemsToReview.length]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSpace: () => {
      if (currentItem && !showAnswer) {
        setShowAnswer(true);
      }
    },
    onEnter: () => {
      if (currentItem && showAnswer) {
        // Mặc định quality = 4 (đúng, dễ nhớ)
        handleReview(4);
      }
    },
    onArrowRight: () => {
      if (currentItem && showAnswer) {
        handleReview(4); // Mặc định quality = 4
      }
    },
    enabled: !!currentItem,
  });

  const getDaysUntilReview = (nextReview: number): number => {
    const now = Date.now();
    const diff = nextReview - now;
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  };

  if (!currentItem) {
    return (
      <div className="srs-review">
        <div className="srs-review-empty">
          <h2>🎉 Tuyệt vời!</h2>
          <p>Bạn đã hoàn thành tất cả các từ cần ôn tập.</p>
          {itemsToReview.length === 0 && (
            <div className="srs-stats">
              <p>Không có từ nào cần review vào lúc này.</p>
              <p className="srs-hint">Hãy tiếp tục học để thêm từ vào hệ thống SRS!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const daysUntil = getDaysUntilReview(currentItem.nextReview);

  return (
    <div className="srs-review">
      <div className="srs-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)' }}>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          🔄 Ôn tập SRS
        </h2>
        <div className="srs-progress">
          {completedCount} / {itemsToReview.length} từ đã review
        </div>
      </div>

      <div className="srs-card-container">
        <div className={`srs-card ${showAnswer ? 'flipped' : ''}`}>
          <div className="srs-card-front">
            <div className="srs-card-content">
              <div className="srs-card-question">
                <h3>Nhớ từ này?</h3>
                <div className="srs-vocab-display">
                  <div className="srs-chinese">{currentItem.vocabulary.chinese}</div>
                  <div className="srs-hint-text">Nhấn Space hoặc click để xem đáp án</div>
                </div>
              </div>
              <button
                className="srs-flip-button"
                onClick={() => setShowAnswer(true)}
              >
                Xem đáp án
              </button>
            </div>
          </div>

          <div className="srs-card-back">
            <div className="srs-card-content">
              <div className="srs-vocab-display">
                <div className="srs-chinese">{currentItem.vocabulary.chinese}</div>
                <div className="srs-pinyin">{currentItem.vocabulary.pinyin}</div>
                <div className="srs-meaning">{currentItem.vocabulary.vietnamese}</div>
              </div>

              <div className="srs-quality-selector">
                <h4>Bạn nhớ từ này như thế nào?</h4>
                <div className="quality-buttons">
                  <button
                    className="quality-btn quality-wrong"
                    onClick={() => handleReview(0)}
                    title="Sai hoàn toàn"
                  >
                    ❌ Sai
                  </button>
                  <button
                    className="quality-btn quality-hard"
                    onClick={() => handleReview(2)}
                    title="Khó nhớ"
                  >
                    😰 Khó
                  </button>
                  <button
                    className="quality-btn quality-normal"
                    onClick={() => handleReview(4)}
                    title="Dễ nhớ"
                  >
                    🙂 Đúng
                  </button>
                  <button
                    className="quality-btn quality-easy"
                    onClick={() => handleReview(5)}
                    title="Rất dễ"
                  >
                    😄 Dễ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="srs-info">
        <div className="srs-info-item">
          <span className="srs-info-label">Lần review:</span>
          <span className="srs-info-value">{currentItem.repetitions}</span>
        </div>
        <div className="srs-info-item">
          <span className="srs-info-label">Ease Factor:</span>
          <span className="srs-info-value">{currentItem.easeFactor}</span>
        </div>
        <div className="srs-info-item">
          <span className="srs-info-label">Interval:</span>
          <span className="srs-info-value">{currentItem.interval} ngày</span>
        </div>
        {daysUntil > 0 && (
          <div className="srs-info-item">
            <span className="srs-info-label">Review sau:</span>
            <span className="srs-info-value">{daysUntil} ngày</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SRSReview;

