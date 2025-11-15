/**
 * Utility để lưu và quản lý Spaced Repetition System (SRS)
 * Sử dụng thuật toán SM-2 (SuperMemo 2)
 */

import { Vocabulary } from '../data/vocabulary';

const STORAGE_KEY = 'hsk_srs_data';

export interface SRSItem {
  vocabulary: Vocabulary;
  level: string;
  easeFactor: number; // Ease factor (EF), bắt đầu từ 2.5
  interval: number; // Ngày cho lần review tiếp theo
  repetitions: number; // Số lần đã review đúng liên tiếp
  nextReview: number; // Timestamp cho lần review tiếp theo
  lastReview: number; // Timestamp của lần review gần nhất
}

interface SRSDataByLevel {
  [level: string]: SRSItem[];
}

/**
 * Lấy SRS data từ localStorage
 */
export function getSRSData(): SRSDataByLevel {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading SRS data:', error);
  }
  return {};
}

/**
 * Lưu SRS data vào localStorage
 */
export function saveSRSData(data: SRSDataByLevel): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving SRS data:', error);
  }
}

/**
 * Thêm từ vào SRS hoặc cập nhật nếu đã có
 */
export function addToSRS(level: string, vocabulary: Vocabulary): void {
  const data = getSRSData();
  if (!data[level]) {
    data[level] = [];
  }
  
  const existingIndex = data[level].findIndex(
    item => item.vocabulary.chinese === vocabulary.chinese
  );
  
  const now = Date.now();
  
  if (existingIndex >= 0) {
    // Đã có trong SRS, không cần thêm lại
    return;
  }
  
  // Thêm mới vào SRS
  const newItem: SRSItem = {
    vocabulary,
    level,
    easeFactor: 2.5, // Ease factor mặc định
    interval: 1, // Lần đầu review sau 1 ngày
    repetitions: 0,
    nextReview: now + 24 * 60 * 60 * 1000, // 1 ngày sau
    lastReview: now,
  };
  
  data[level].push(newItem);
  saveSRSData(data);
}

/**
 * Review một từ với quality (0-5)
 * Quality: 0-2 = sai, 3-5 = đúng (với độ khó khác nhau)
 * Sử dụng thuật toán SM-2
 */
export function reviewSRSItem(
  level: string,
  vocabulary: Vocabulary,
  quality: number // 0-5
): SRSItem | null {
  const data = getSRSData();
  if (!data[level]) {
    return null;
  }
  
  const itemIndex = data[level].findIndex(
    item => item.vocabulary.chinese === vocabulary.chinese
  );
  
  if (itemIndex < 0) {
    // Nếu chưa có trong SRS, thêm vào
    addToSRS(level, vocabulary);
    return reviewSRSItem(level, vocabulary, quality);
  }
  
  const item = data[level][itemIndex];
  const now = Date.now();
  
  // Thuật toán SM-2
  let newEaseFactor = item.easeFactor;
  let newInterval = item.interval;
  let newRepetitions = item.repetitions;
  
  if (quality >= 3) {
    // Đúng
    if (item.repetitions === 0) {
      newInterval = 1;
    } else if (item.repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(item.interval * item.easeFactor);
    }
    newRepetitions = item.repetitions + 1;
  } else {
    // Sai
    newRepetitions = 0;
    newInterval = 1;
  }
  
  // Cập nhật ease factor
  newEaseFactor = item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor); // Tối thiểu 1.3
  
  // Cập nhật item
  item.easeFactor = Math.round(newEaseFactor * 100) / 100;
  item.interval = newInterval;
  item.repetitions = newRepetitions;
  item.lastReview = now;
  item.nextReview = now + newInterval * 24 * 60 * 60 * 1000; // Ngày * milliseconds
  
  saveSRSData(data);
  return item;
}

/**
 * Lấy từ cần review (nextReview <= now)
 */
export function getItemsToReview(level: string): SRSItem[] {
  const data = getSRSData();
  if (!data[level]) {
    return [];
  }
  
  const now = Date.now();
  return data[level].filter(item => item.nextReview <= now);
}

/**
 * Lấy tất cả từ trong SRS theo level
 */
export function getAllSRSItems(level: string): SRSItem[] {
  const data = getSRSData();
  return data[level] || [];
}

/**
 * Xóa từ khỏi SRS
 */
export function removeFromSRS(level: string, vocabulary: Vocabulary): void {
  const data = getSRSData();
  if (!data[level]) {
    return;
  }
  
  data[level] = data[level].filter(
    item => item.vocabulary.chinese !== vocabulary.chinese
  );
  
  saveSRSData(data);
}

/**
 * Reset SRS data
 */
export function resetSRSData(level?: string): void {
  if (level) {
    const data = getSRSData();
    delete data[level];
    saveSRSData(data);
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing SRS data:', error);
    }
  }
}

