/**
 * Utility để lưu và quản lý từ vựng đã sai
 */

import { Vocabulary } from '../data/vocabulary';

import { readSingleton, writeSingleton, STORES } from '../storage';

const EMPTY_WRONG = {};

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
  return readSingleton<WrongAnswersByLevel>(STORES.WRONG_VOCAB, EMPTY_WRONG);
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

  void writeSingleton(STORES.WRONG_VOCAB, allWrong);
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

    void writeSingleton(STORES.WRONG_VOCAB, allWrong);
    return true;
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

  void writeSingleton(STORES.WRONG_VOCAB, allWrong);
}

/**
 * Xóa tất cả từ sai
 */
export function clearAllWrongAnswers(level?: string): void {
  if (!level) {
    void writeSingleton(STORES.WRONG_VOCAB, {});
    return;
  }
  const allWrong = getWrongAnswers();
  delete allWrong[level];
  void writeSingleton(STORES.WRONG_VOCAB, allWrong);
}

/**
 * Kiểm tra từ có trong danh sách sai không
 */
export function isWrongAnswer(level: string, vocabulary: Vocabulary): boolean {
  const wrongAnswers = getWrongAnswersByLevel(level);
  return wrongAnswers.some(wa => wa.vocabulary.chinese === vocabulary.chinese);
}

