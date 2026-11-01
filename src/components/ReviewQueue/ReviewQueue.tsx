/**
 * ReviewQueue — "Ôn hôm nay" screen.
 *
 * Pulls items due according to the SRS schedule and runs a fast
 * recall drill (chinese -> meaning). Answering reschedules the item.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getVocabulariesForLevel } from '../../utils/vocabularyStorage';
import { getSentencesForLevel } from '../../utils/sentenceStorage';
import {
  getDueItems,
  reviewSrsItem,
  getDueCount,
  type SrsItem,
} from '../../srs/srsEngine';
import { markVocabularyLearned } from '../../utils/learnedItemsStorage';
import { speakChinese, preloadChineseAudio } from '../../utils/speakChinese';
import { hanVietOf } from '../../data/hanViet';
import './ReviewQueue.css';

interface ReviewQueueProps {
  level: string;
}

interface Card {
  srs: SrsItem;
  chinese: string;
  pinyin: string;
  vietnamese: string;
  isSentence: boolean;
}

const ReviewQueue: React.FC<ReviewQueueProps> = ({ level }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionDone, setSessionDone] = useState(0);
  const [started, setStarted] = useState(false);
  const [dueNow, setDueNow] = useState(0);

  const buildCards = useCallback((): Card[] => {
    const due = getDueItems();
    const vocabMap = new Map<string, { chinese: string; pinyin: string; vietnamese: string }>();
    getVocabulariesForLevel(level).forEach((v) => vocabMap.set(v.chinese, v));

    const sentenceMap = new Map<string, { chinese: string; pinyin: string; vietnamese: string }>();
    getSentencesForLevel(level).forEach((s) =>
      sentenceMap.set(s.chinese.replace(/[.。?？！!]/g, ''), s)
    );

    const result: Card[] = [];
    due.forEach((item) => {
      if (item.kind === 'vocab') {
        const v = vocabMap.get(item.refId);
        if (v) {
          result.push({ srs: item, ...v, isSentence: false });
          return;
        }
      }
      const s = sentenceMap.get(item.refId);
      if (s) {
        result.push({ srs: item, ...s, isSentence: true });
      }
    });
    return result;
  }, [level]);

  useEffect(() => {
    setDueNow(getDueCount());
    if (!started) return;
    const next = buildCards();
    setCards(next);
    setIndex(0);
    setRevealed(false);
  }, [buildCards, started]);

  const current = cards[index];

  useEffect(() => {
    if (current?.chinese) preloadChineseAudio(current.chinese);
  }, [current]);

  const handleReveal = () => setRevealed(true);

  const handleAnswer = (correct: boolean) => {
    if (!current) return;

    // Reschedule the item.
    reviewSrsItem(current.srs.kind, current.srs.refId, correct);

    // Keep the existing learning trackers in sync.
    if (!current.isSentence) {
      markVocabularyLearned(
        level,
        { chinese: current.chinese, pinyin: current.pinyin, vietnamese: current.vietnamese },
        'meaning',
        correct
      );
    }

    setSessionCorrect((c) => c + (correct ? 1 : 0));
    setSessionDone((d) => d + 1);

    // Next card.
    if (index + 1 < cards.length) {
      setIndex((i) => i + 1);
      setRevealed(false);
    } else {
      const remaining = buildCards();
      setDueNow(getDueCount());
      if (remaining.length > 0) {
        setCards(remaining);
        setIndex(0);
        setRevealed(false);
      } else {
        setCards([]);
      }
    }
  };

  const accuracy = useMemo(() => {
    if (sessionDone === 0) return 0;
    return Math.round((sessionCorrect / sessionDone) * 100);
  }, [sessionCorrect, sessionDone]);

  // ---------- Not started ----------
  if (!started) {
    return (
      <div className="review-queue">
        <div className="review-start-card">
          <div className="review-start-icon">📅</div>
          <h2>Ôn hôm nay</h2>
          <p className="review-due-count">
            {dueNow > 0 ? (
              <>Có <strong>{dueNow}</strong> thẻ đến hạn ôn.</>
            ) : (
              <>Chưa có thẻ đến hạn. Học thêm từ/câu mới để lập lịch ôn.</>
            )}
          </p>
          <p className="review-hint">
            Ôn đúng lịch giúp bạn nhớ lâu hơn và giảm thời gian học mỗi ngày.
          </p>
          <button
            className="review-start-btn"
            onClick={() => {
              setCards(buildCards());
              setIndex(0);
              setRevealed(false);
              setSessionCorrect(0);
              setSessionDone(0);
              setStarted(true);
            }}
            disabled={dueNow === 0}
          >
            {dueNow > 0 ? `Bắt đầu ôn ${dueNow} thẻ` : 'Chưa có thẻ đến hạn'}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Finished ----------
  if (!current) {
    return (
      <div className="review-queue">
        <div className="review-start-card">
          <div className="review-start-icon">🎉</div>
          <h2>Đã ôn xong!</h2>
          <p className="review-due-count">
            Trả lời đúng <strong>{sessionCorrect}</strong>/{sessionDone}
            {sessionDone > 0 && ` (${accuracy}%)`}
          </p>
          <p className="review-hint">
            {getDueCount() > 0
              ? `Còn ${getDueCount()} thẻ đến hạn — ôn tiếp nhé.`
              : 'Hẹn gặp lại vào lần ôn tiếp theo!'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="review-start-btn" onClick={() => {
              setCards(buildCards());
              setIndex(0);
              setRevealed(false);
            }} disabled={getDueCount() === 0}>
              Ôn tiếp
            </button>
            <button
              className="review-secondary-btn"
              onClick={() => {
                setStarted(false);
                setDueNow(getDueCount());
              }}
            >
              Về tổng quan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Active card ----------
  return (
    <div className="review-queue">
      <div className="review-progress">
        <span>Ôn {sessionDone + 1}/{cards.length}</span>
        <span className="review-progress-accuracy">
          Đúng: {sessionCorrect} {sessionDone > 0 && `(${accuracy}%)`}
        </span>
      </div>

      <div className="review-card">
        <button
          className="speak-button review-speak"
          onClick={() => speakChinese(current.chinese)}
          title="Phát âm"
        >
          🔊
        </button>

        <div className="review-chinese">{current.chinese}</div>

        {!revealed ? (
          <>
            <div className="review-question">Nghĩa tiếng Việt là gì?</div>
            <button className="review-reveal-btn" onClick={handleReveal}>
              Hiện đáp án
            </button>
          </>
        ) : (
          <>
            <div className="review-answer">
              <div className="review-answer-pinyin">{current.pinyin}</div>
              {!current.isSentence && (
                <div className="review-answer-hanviet" title="Âm Hán-Việt từng chữ">
                  {hanVietOf(current.chinese)}
                </div>
              )}
              <div className="review-answer-vi">{current.vietnamese}</div>
            </div>
            <div className="review-actions">
              <button
                className="review-btn review-btn-wrong"
                onClick={() => handleAnswer(false)}
              >
                Sai
              </button>
              <button
                className="review-btn review-btn-correct"
                onClick={() => handleAnswer(true)}
              >
                Đúng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewQueue;
