/**
 * Utility để lưu và quản lý câu đã sai
 */

import { Sentence } from '../data/sentences';
import { readSingleton, writeSingleton, STORES } from '../storage';

const EMPTY_WRONG_SENTENCES = {};

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
  return readSingleton<WrongSentencesByLevel>(STORES.WRONG_SENTENCES, EMPTY_WRONG_SENTENCES);
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

  void writeSingleton(STORES.WRONG_SENTENCES, allWrong);
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

    void writeSingleton(STORES.WRONG_SENTENCES, allWrong);
    return true;
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

  void writeSingleton(STORES.WRONG_SENTENCES, allWrong);
}

/**
 * Xóa tất cả câu sai
 */
export function clearAllWrongSentences(level?: string, topic?: string): void {
  const allWrong = getWrongSentences();
  if (level && topic) {
    if (allWrong[level]?.[topic]) {
      delete allWrong[level][topic];
    }
  } else if (level) {
    delete allWrong[level];
  }
  void writeSingleton(STORES.WRONG_SENTENCES, allWrong);
}

/**
 * Kiểm tra câu có trong danh sách sai không
 */
export function isWrongSentence(level: string, topic: string, sentence: Sentence): boolean {
  const wrongSentences = getWrongSentencesByLevelAndTopic(level, topic);
  return wrongSentences.some(ws => ws.sentence.chinese === sentence.chinese);
}

