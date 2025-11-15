/**
 * Utility để lưu và quản lý thống kê học tập
 */

const STORAGE_KEY = 'hsk_statistics';

export interface StudySession {
  date: string; // YYYY-MM-DD
  level: string;
  correct: number;
  total: number;
  duration: number; // seconds
  function: string; // vocabulary, flashcard, writing, etc.
}

export interface DailyStats {
  date: string;
  totalCorrect: number;
  totalAttempts: number;
  totalDuration: number; // seconds
  sessions: StudySession[];
}

export interface Statistics {
  dailyStats: DailyStats[];
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  totalWordsLearned: number;
  totalSentencesLearned: number;
  totalTimeSpent: number; // seconds
  accuracyByLevel: { [level: string]: { correct: number; total: number } };
  wordsByLevel: { [level: string]: number }; // Số từ đã học theo level
  sentencesByLevel: { [level: string]: number }; // Số câu đã học theo level
}

/**
 * Lấy thống kê từ localStorage
 */
export function getStatistics(): Statistics {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
  return {
    dailyStats: [],
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    totalWordsLearned: 0,
    totalSentencesLearned: 0,
    totalTimeSpent: 0,
    accuracyByLevel: {},
    wordsByLevel: {},
    sentencesByLevel: {},
  };
}

/**
 * Lưu thống kê vào localStorage
 */
export function saveStatistics(stats: Statistics): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving statistics:', error);
  }
}

/**
 * Thêm một session học tập
 */
export function addStudySession(
  level: string,
  correct: number,
  total: number,
  duration: number,
  functionType: string
): void {
  const stats = getStatistics();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Tìm hoặc tạo daily stats cho hôm nay
  let dailyStat = stats.dailyStats.find(ds => ds.date === today);
  if (!dailyStat) {
    dailyStat = {
      date: today,
      totalCorrect: 0,
      totalAttempts: 0,
      totalDuration: 0,
      sessions: [],
    };
    stats.dailyStats.push(dailyStat);
  }
  
  // Thêm session
  const session: StudySession = {
    date: today,
    level,
    correct,
    total,
    duration,
    function: functionType,
  };
  dailyStat.sessions.push(session);
  dailyStat.totalCorrect += correct;
  dailyStat.totalAttempts += total;
  dailyStat.totalDuration += duration;
  
  // Cập nhật accuracy by level
  if (!stats.accuracyByLevel[level]) {
    stats.accuracyByLevel[level] = { correct: 0, total: 0 };
  }
  stats.accuracyByLevel[level].correct += correct;
  stats.accuracyByLevel[level].total += total;
  
  // Cập nhật streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (stats.lastStudyDate === today) {
    // Đã học hôm nay rồi, không cần update streak
  } else if (stats.lastStudyDate === yesterdayStr) {
    // Tiếp tục streak
    stats.currentStreak++;
  } else if (stats.lastStudyDate === null || stats.lastStudyDate < yesterdayStr) {
    // Bắt đầu streak mới
    stats.currentStreak = 1;
  }
  
  stats.lastStudyDate = today;
  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }
  
  // Cập nhật tổng thời gian
  stats.totalTimeSpent += duration;
  
  // Cập nhật tổng từ đã học - sẽ được cập nhật trong StatisticsDashboard component
  // để tránh circular dependency
  saveStatistics(stats);
}

/**
 * Reset tất cả thống kê
 */
export function resetStatistics(): void {
  const emptyStats: Statistics = {
    dailyStats: [],
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    totalWordsLearned: 0,
    totalSentencesLearned: 0,
    totalTimeSpent: 0,
    accuracyByLevel: {},
    wordsByLevel: {},
    sentencesByLevel: {},
  };
  saveStatistics(emptyStats);
}

/**
 * Lấy thống kê theo ngày/tuần/tháng
 */
export function getStatisticsByPeriod(period: 'day' | 'week' | 'month'): DailyStats[] {
  const stats = getStatistics();
  const now = new Date();
  let cutoffDate: Date;
  
  switch (period) {
    case 'day':
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'week':
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      break;
    case 'month':
      cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
  }
  
  return stats.dailyStats.filter(ds => {
    const date = new Date(ds.date);
    return date >= cutoffDate;
  });
}

