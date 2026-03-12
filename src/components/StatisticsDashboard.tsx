import React, { useState, useEffect, useMemo } from 'react';
import { getStatistics, getStatisticsByPeriod, resetStatistics, Statistics } from '../utils/statisticsStorage';
import { getAllLearnedVocabularyCounts, getAllLearnedSentenceCounts, getTotalLearnedVocabularyCount, getTotalLearnedSentenceCount, clearLearnedItems } from '../utils/learnedItemsStorage';
import { getVocabulariesForLevel } from '../utils/vocabularyStorage';
import { getSentencesForLevel } from '../utils/sentenceStorage';
import './StatisticsDashboard.css';

interface StatisticsDashboardProps {
  currentLevel?: string;
}

const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ currentLevel: _currentLevel }) => {
  const [stats, setStats] = useState<Statistics>(getStatistics());
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    // Reload stats khi component mount
    const reloadStats = () => {
      const stats = getStatistics();
      // Cập nhật số từ/câu đã học từ learned items storage
      stats.wordsByLevel = getAllLearnedVocabularyCounts();
      stats.sentencesByLevel = getAllLearnedSentenceCounts();
      stats.totalWordsLearned = getTotalLearnedVocabularyCount();
      stats.totalSentencesLearned = getTotalLearnedSentenceCount();
      setStats(stats);
    };
    reloadStats();
    // Reload mỗi 2 giây để cập nhật realtime
    const interval = setInterval(reloadStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const dailyStats = useMemo(() => getStatisticsByPeriod(period), [period]);

  const handleReset = () => {
    resetStatistics();
    clearLearnedItems();
    const stats = getStatistics();
    stats.wordsByLevel = getAllLearnedVocabularyCounts();
    stats.sentencesByLevel = getAllLearnedSentenceCounts();
    stats.totalWordsLearned = getTotalLearnedVocabularyCount();
    stats.totalSentencesLearned = getTotalLearnedSentenceCount();
    setStats(stats);
    setShowResetConfirm(false);
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="statistics-dashboard">
      <div className="stats-header">
        <div className="stats-header-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <h2>Thống kê học tập</h2>
        </div>
        <button 
          onClick={() => setShowResetConfirm(true)}
          className="btn-reset-stats-new"
          title="Reset tất cả thống kê"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Làm mới
        </button>
      </div>

      {showResetConfirm && (
        <div className="reset-confirm-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="reset-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-warning">⚠️</div>
            <h3>Xác nhận xóa dữ liệu?</h3>
            <p>Tất cả tiến độ học tập và thống kê sẽ bị xóa vĩnh viễn.</p>
            <div className="reset-confirm-actions">
              <button onClick={() => setShowResetConfirm(false)} className="btn-confirm-no">Hủy</button>
              <button onClick={handleReset} className="btn-confirm-yes">Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid-main">
        <div className="stat-card-new streak">
          <div className="stat-icon-new">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          </div>
          <div className="stat-info-new">
            <span className="stat-label-new">Chuỗi hiện tại</span>
            <span className="stat-value-new">{stats.currentStreak} ngày</span>
          </div>
        </div>

        <div className="stat-card-new vocabulary">
          <div className="stat-icon-new">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div className="stat-info-new">
            <span className="stat-label-new">Từ đã học</span>
            <span className="stat-value-new">{stats.totalWordsLearned}</span>
          </div>
        </div>

        <div className="stat-card-new sentence">
          <div className="stat-icon-new">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div className="stat-info-new">
            <span className="stat-label-new">Câu đã học</span>
            <span className="stat-value-new">{stats.totalSentencesLearned || 0}</span>
          </div>
        </div>

        <div className="stat-card-new time">
          <div className="stat-icon-new">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="stat-info-new">
            <span className="stat-label-new">Thời gian học</span>
            <span className="stat-value-new">{formatTime(stats.totalTimeSpent)}</span>
          </div>
        </div>
      </div>

      <div className="stats-sections-grid">
        <section className="stats-section levels">
          <div className="section-header">
            <h3>Tiến độ HSK</h3>
          </div>
          <div className="level-compact-list">
            {['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'tuluyen'].map((level) => {
              const wordsCount = stats.wordsByLevel?.[level] || 0;
              const totalWords = getVocabulariesForLevel(level).length;
              const progress = totalWords > 0 ? Math.round((wordsCount / totalWords) * 100) : 0;
              
              if (totalWords === 0 && level !== 'tuluyen') return null;

              return (
                <div key={level} className="level-item-new">
                  <div className="level-info">
                    <span className="level-name">{level.toUpperCase()}</span>
                    <span className="level-count">{wordsCount}/{totalWords}</span>
                  </div>
                  <div className="level-progress-bg">
                    <div className="level-progress-fill" style={{ width: `${progress}%` }}>
                      {progress > 10 && <span className="progress-text">{progress}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="stats-section history">
          <div className="section-header">
            <h3>Lịch sử học tập</h3>
            <div className="period-pills">
              <button className={period === 'day' ? 'active' : ''} onClick={() => setPeriod('day')}>7 ngày</button>
              <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>30 ngày</button>
            </div>
          </div>
          
          <div className="history-list-new">
            {dailyStats.length === 0 ? (
              <div className="empty-state">Chưa có dữ liệu học tập</div>
            ) : (
              dailyStats.slice(0, 5).map((daily) => {
                const accuracy = daily.totalAttempts > 0
                  ? Math.round((daily.totalCorrect / daily.totalAttempts) * 100)
                  : 0;
                return (
                  <div key={daily.date} className="history-item-new">
                    <div className="history-date">{formatDate(daily.date)}</div>
                    <div className="history-metrics">
                      <div className="history-metric" title="Độ chính xác">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        {accuracy}%
                      </div>
                      <div className="history-metric" title="Thời gian">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {formatTime(daily.totalDuration)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
