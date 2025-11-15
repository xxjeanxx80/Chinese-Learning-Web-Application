/**
 * Utility để lưu và quản lý từ vựng đã sai
 */

import { Vocabulary } from '../data/vocabulary';

const STORAGE_KEY = 'hsk_wrong_answers';

export interface WrongAnswer {
  vocabulary: Vocabulary;
  level: string;
  wrongCount: number;
  correctCount: number;
  lastWrong: number; // timestamp
  lastCorrect: number; // timestamp
}

interface WrongAnswersByLevel {
  [level: string]: WrongAnswer[];
}

/**
 * Lấy tất cả từ sai từ localStorage
 */
export function getWrongAnswers(): WrongAnswersByLevel {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading wrong answers:', error);
  }
  return {};
}

/**
 * Lấy từ sai theo level
 */
export function getWrongAnswersByLevel(level: string): WrongAnswer[] {
  const allWrong = getWrongAnswers();
  return allWrong[level] || [];
}

/**
 * Thêm từ vào danh sách sai
 */
export function addWrongAnswer(level: string, vocabulary: Vocabulary): void {
  const allWrong = getWrongAnswers();
  if (!allWrong[level]) {
    allWrong[level] = [];
  }

  const existingIndex = allWrong[level].findIndex(
    wa => wa.vocabulary.chinese === vocabulary.chinese
  );

  const now = Date.now();

  if (existingIndex >= 0) {
    // Tăng số lần sai
    allWrong[level][existingIndex].wrongCount++;
    allWrong[level][existingIndex].lastWrong = now;
  } else {
    // Thêm mới
    allWrong[level].push({
      vocabulary,
      level,
      wrongCount: 1,
      correctCount: 0,
      lastWrong: now,
      lastCorrect: 0,
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allWrong));
  } catch (error) {
    console.error('Error saving wrong answers:', error);
  }
}

/**
 * Đánh dấu từ đã đúng (tăng correctCount)
 */
export function markCorrect(level: string, vocabulary: Vocabulary): boolean {
  const allWrong = getWrongAnswers();
  if (!allWrong[level]) {
    return false;
  }

  const existingIndex = allWrong[level].findIndex(
    wa => wa.vocabulary.chinese === vocabulary.chinese
  );

  if (existingIndex >= 0) {
    const now = Date.now();
    allWrong[level][existingIndex].correctCount++;
    allWrong[level][existingIndex].lastCorrect = now;

    // Nếu đã đúng 3 lần liên tiếp, xóa khỏi danh sách sai
    if (allWrong[level][existingIndex].correctCount >= 3) {
      allWrong[level].splice(existingIndex, 1);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allWrong));
      return true;
    } catch (error) {
      console.error('Error saving wrong answers:', error);
      return false;
    }
  }

  return false;
}

/**
 * Xóa từ khỏi danh sách sai
 */
export function removeWrongAnswer(level: string, vocabulary: Vocabulary): void {
  const allWrong = getWrongAnswers();
  if (!allWrong[level]) {
    return;
  }

  allWrong[level] = allWrong[level].filter(
    wa => wa.vocabulary.chinese !== vocabulary.chinese
  );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allWrong));
  } catch (error) {
    console.error('Error saving wrong answers:', error);
  }
}

/**
 * Xóa tất cả từ sai
 */
export function clearAllWrongAnswers(level?: string): void {
  if (level) {
    const allWrong = getWrongAnswers();
    delete allWrong[level];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allWrong));
    } catch (error) {
      console.error('Error saving wrong answers:', error);
    }
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing wrong answers:', error);
    }
  }
}

/**
 * Kiểm tra từ có trong danh sách sai không
 */
export function isWrongAnswer(level: string, vocabulary: Vocabulary): boolean {
  const wrongAnswers = getWrongAnswersByLevel(level);
  return wrongAnswers.some(wa => wa.vocabulary.chinese === vocabulary.chinese);
}

