/**
 * Utility để lưu và quản lý câu đã sai
 */

import { Sentence } from '../data/sentences';

const STORAGE_KEY = 'hsk_sentence_wrong_answers';

export interface WrongSentence {
  sentence: Sentence;
  level: string;
  topic: string;
  wrongCount: number;
  correctCount: number;
  lastWrong: number; // timestamp
  lastCorrect: number; // timestamp
}

interface WrongSentencesByLevel {
  [level: string]: {
    [topic: string]: WrongSentence[];
  };
}

/**
 * Lấy tất cả câu sai từ localStorage
 */
export function getWrongSentences(): WrongSentencesByLevel {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading wrong sentences:', error);
  }
  return {};
}

/**
 * Lấy câu sai theo level và topic
 */
export function getWrongSentencesByLevelAndTopic(level: string, topic: string): WrongSentence[] {
  const allWrong = getWrongSentences();
  return allWrong[level]?.[topic] || [];
}

/**
 * Thêm câu vào danh sách sai
 */
export function addWrongSentence(level: string, topic: string, sentence: Sentence): void {
  const allWrong = getWrongSentences();
  if (!allWrong[level]) {
    allWrong[level] = {};
  }
  if (!allWrong[level][topic]) {
    allWrong[level][topic] = [];
  }

  const existingIndex = allWrong[level][topic].findIndex(
    ws => ws.sentence.chinese === sentence.chinese
  );

  const now = Date.now();

  if (existingIndex >= 0) {
    // Tăng số lần sai
    allWrong[level][topic][existingIndex].wrongCount++;
    allWrong[level][topic][existingIndex].lastWrong = now;
  } else {
    // Thêm mới
    allWrong[level][topic].push({
      sentence,
      level,
      topic,
      wrongCount: 1,
      correctCount: 0,
      lastWrong: now,
      lastCorrect: 0,
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allWrong));
  } catch (error) {
    console.error('Error saving wrong sentences:', error);
  }
}

/**
 * Đánh dấu câu đã đúng (tăng correctCount)
 */
export function markSentenceCorrect(level: string, topic: string, sentence: Sentence): boolean {
  const allWrong = getWrongSentences();
  if (!allWrong[level]?.[topic]) {
    return false;
  }

  const existingIndex = allWrong[level][topic].findIndex(
    ws => ws.sentence.chinese === sentence.chinese
  );

  if (existingIndex >= 0) {
    const now = Date.now();
    allWrong[level][topic][existingIndex].correctCount++;
    allWrong[level][topic][existingIndex].lastCorrect = now;

    // Nếu đã đúng 3 lần liên tiếp, xóa khỏi danh sách sai
    if (allWrong[level][topic][existingIndex].correctCount >= 3) {
      allWrong[level][topic].splice(existingIndex, 1);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allWrong));
      return true;
    } catch (error) {
      console.error('Error saving wrong sentences:', error);
      return false;
    }
  }

  return false;
}

/**
 * Xóa câu khỏi danh sách sai
 */
export function removeWrongSentence(level: string, topic: string, sentence: Sentence): void {
  const allWrong = getWrongSentences();
  if (!allWrong[level]?.[topic]) {
    return;
  }

  allWrong[level][topic] = allWrong[level][topic].filter(
    ws => ws.sentence.chinese !== sentence.chinese
  );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allWrong));
  } catch (error) {
    console.error('Error saving wrong sentences:', error);
  }
}

/**
 * Xóa tất cả câu sai
 */
export function clearAllWrongSentences(level?: string, topic?: string): void {
  if (level && topic) {
    const allWrong = getWrongSentences();
    if (allWrong[level]?.[topic]) {
      delete allWrong[level][topic];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allWrong));
      } catch (error) {
        console.error('Error saving wrong sentences:', error);
      }
    }
  } else if (level) {
    const allWrong = getWrongSentences();
    delete allWrong[level];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allWrong));
    } catch (error) {
      console.error('Error saving wrong sentences:', error);
    }
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing wrong sentences:', error);
    }
  }
}

/**
 * Kiểm tra câu có trong danh sách sai không
 */
export function isWrongSentence(level: string, topic: string, sentence: Sentence): boolean {
  const wrongSentences = getWrongSentencesByLevelAndTopic(level, topic);
  return wrongSentences.some(ws => ws.sentence.chinese === sentence.chinese);
}

