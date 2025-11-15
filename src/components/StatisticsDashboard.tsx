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
    if (window.confirm('Bạn có chắc muốn reset tất cả thống kê? Hành động này không thể hoàn tác!')) {
      resetStatistics();
      clearLearnedItems();
      const stats = getStatistics();
      stats.wordsByLevel = getAllLearnedVocabularyCounts();
      stats.sentencesByLevel = getAllLearnedSentenceCounts();
      stats.totalWordsLearned = getTotalLearnedVocabularyCount();
      stats.totalSentencesLearned = getTotalLearnedSentenceCount();
      setStats(stats);
      setShowResetConfirm(false);
    }
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
        <h2>📊 Bảng Thống Kê Học Tập</h2>
        <button 
          onClick={() => setShowResetConfirm(true)}
          className="btn-reset-stats"
          title="Reset tất cả thống kê"
        >
          🔄 Reset
        </button>
      </div>

      {showResetConfirm && (
        <div className="reset-confirm-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="reset-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Xác nhận Reset</h3>
            <p>Bạn có chắc muốn reset tất cả thống kê? Hành động này không thể hoàn tác!</p>
            <div className="reset-confirm-actions">
              <button onClick={handleReset} className="btn-confirm-yes">Có, Reset</button>
              <button onClick={() => setShowResetConfirm(false)} className="btn-confirm-no">Hủy</button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-label">Streak Hiện Tại</div>
            <div className="stat-value">{stats.currentStreak}</div>
            <div className="stat-sublabel">ngày liên tiếp</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-label">Streak Dài Nhất</div>
            <div className="stat-value">{stats.longestStreak}</div>
            <div className="stat-sublabel">ngày</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-label">Từ Đã Học</div>
            <div className="stat-value">{stats.totalWordsLearned}</div>
            <div className="stat-sublabel">từ vựng</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-label">Câu Đã Học</div>
            <div className="stat-value">{stats.totalSentencesLearned || 0}</div>
            <div className="stat-sublabel">câu</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-label">Thời Gian</div>
            <div className="stat-value">{formatTime(stats.totalTimeSpent)}</div>
            <div className="stat-sublabel">tổng cộng</div>
          </div>
        </div>
      </div>

      <div className="stats-details">
        <div className="stats-period-selector">
          <button
            className={period === 'day' ? 'active' : ''}
            onClick={() => setPeriod('day')}
          >
            7 Ngày
          </button>
          <button
            className={period === 'week' ? 'active' : ''}
            onClick={() => setPeriod('week')}
          >
            30 Ngày
          </button>
          <button
            className={period === 'month' ? 'active' : ''}
            onClick={() => setPeriod('month')}
          >
            6 Tháng
          </button>
        </div>

        <div className="stats-by-level">
          <h3>Thống Kê Theo HSK Level</h3>
          <div className="level-stats-grid">
            {['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5'].map((level) => {
              const wordsCount = stats.wordsByLevel?.[level] || 0;
              const sentencesCount = stats.sentencesByLevel?.[level] || 0;
              
              // Tính tổng số từ/câu trong level
              const totalWords = getVocabulariesForLevel(level).length;
              const totalSentences = getSentencesForLevel(level).length;
              
              // Độ chính xác = số từ/câu đã học (vượt qua 3 test) / tổng số từ/câu
              const wordsAccuracy = totalWords > 0 ? Math.round((wordsCount / totalWords) * 100) : 0;
              const sentencesAccuracy = totalSentences > 0 ? Math.round((sentencesCount / totalSentences) * 100) : 0;
              
              return (
                <div key={level} className="level-stat-card">
                  <div className="level-stat-header">
                    <h4>{level.toUpperCase()}</h4>
                  </div>
                  <div className="level-stat-content">
                    <div className="level-stat-item">
                      <span className="level-stat-label">📚 Từ đã học:</span>
                      <span className="level-stat-value">{wordsCount}/{totalWords} từ</span>
                      {totalWords > 0 && (
                        <>
                          <div className="level-accuracy-bar-container">
                            <div
                              className="level-accuracy-bar"
                              style={{ width: `${wordsAccuracy}%` }}
                            />
                          </div>
                          <div className="level-accuracy-details">
                            {wordsAccuracy}% ({wordsCount} đã vượt qua 3 bài test)
                          </div>
                        </>
                      )}
                    </div>
                    <div className="level-stat-item">
                      <span className="level-stat-label">📝 Câu đã học:</span>
                      <span className="level-stat-value">{sentencesCount}/{totalSentences} câu</span>
                      {totalSentences > 0 && (
                        <>
                          <div className="level-accuracy-bar-container">
                            <div
                              className="level-accuracy-bar"
                              style={{ width: `${sentencesAccuracy}%` }}
                            />
                          </div>
                          <div className="level-accuracy-details">
                            {sentencesAccuracy}% ({sentencesCount} đã vượt qua 3 bài test)
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        <div className="stats-daily">
          <h3>Thống Kê Theo Ngày</h3>
          {dailyStats.length === 0 ? (
            <div className="empty-stats">Chưa có dữ liệu cho khoảng thời gian này</div>
          ) : (
            <div className="daily-stats-list">
              {dailyStats.map((daily) => {
                const dailyAccuracy = daily.totalAttempts > 0
                  ? Math.round((daily.totalCorrect / daily.totalAttempts) * 100)
                  : 0;
                return (
                  <div key={daily.date} className="daily-stat-item">
                    <div className="daily-date">{formatDate(daily.date)}</div>
                    <div className="daily-stats">
                      <div className="daily-stat">
                        <span className="daily-stat-label">Đúng:</span>
                        <span className="daily-stat-value">{daily.totalCorrect}/{daily.totalAttempts}</span>
                      </div>
                      <div className="daily-stat">
                        <span className="daily-stat-label">Độ chính xác:</span>
                        <span className="daily-stat-value">{dailyAccuracy}%</span>
                      </div>
                      <div className="daily-stat">
                        <span className="daily-stat-label">Thời gian:</span>
                        <span className="daily-stat-value">{formatTime(daily.totalDuration)}</span>
                      </div>
                      <div className="daily-stat">
                        <span className="daily-stat-label">Sessions:</span>
                        <span className="daily-stat-value">{daily.sessions.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;

