/**
 * Utility để lưu và quản lý từ vựng và câu đã học
 */

import { Vocabulary } from '../data/vocabulary';
import { Sentence } from '../data/sentences';
import { readSingleton, writeSingleton, STORES } from '../storage';
import { reviewSrsItem, ensureSrsItem } from '../srs/srsEngine';

const EMPTY_LEARNED = {};

export type PracticeType = 'pinyin' | 'writing' | 'meaning';

export interface LearnedVocabularies {
  [level: string]: {
    [chinese: string]: {
      vocabulary: Vocabulary;
      firstLearned: number; // timestamp
      lastPracticed: number; // timestamp
      practiceCount: number;
      correctCount: number;
      passedTests: {
        pinyin: boolean;
        writing: boolean;
        meaning: boolean;
      };
    };
  };
}

export interface LearnedSentences {
  [level: string]: {
    [chinese: string]: {
      sentence: Sentence;
      topic: string;
      firstLearned: number; // timestamp
      lastPracticed: number; // timestamp
      practiceCount: number;
      correctCount: number;
      passedTests: {
        pinyin: boolean;
        writing: boolean;
        meaning: boolean;
      };
    };
  };
}

/**
 * Lấy từ vựng đã học từ localStorage
 */
export function getLearnedVocabularies(): LearnedVocabularies {
  const learned = readSingleton<LearnedVocabularies>(STORES.LEARNED_VOCAB, EMPTY_LEARNED);
  // A corrupted sync once stored non-item values (the string 'singleton')
  // inside this blob. Drop anything that is not a learned-item object, and
  // backfill passedTests for items saved before that field existed.
  let dirty = false;
  Object.keys(learned).forEach((level) => {
    const group = learned[level];
    if (!group || typeof group !== 'object') {
      delete learned[level];
      dirty = true;
      return;
    }
    Object.keys(group).forEach((chinese) => {
      const item = group[chinese];
      if (!item || typeof item !== 'object') {
        delete group[chinese];
        dirty = true;
        return;
      }
      if (!item.passedTests) {
        item.passedTests = { pinyin: false, writing: false, meaning: false };
        dirty = true;
      }
    });
  });
  // Persist the cleaned blob so the bad values are not synced back to the server.
  if (dirty) saveLearnedVocabularies(learned);
  return learned;
}

/**
 * Lấy câu đã học từ localStorage
 */
export function getLearnedSentences(): LearnedSentences {
  const learned = readSingleton<LearnedSentences>(STORES.LEARNED_SENTENCES, EMPTY_LEARNED);
  let dirty = false;
  Object.keys(learned).forEach((level) => {
    const group = learned[level];
    if (!group || typeof group !== 'object') {
      delete learned[level];
      dirty = true;
      return;
    }
    Object.keys(group).forEach((chinese) => {
      const item = group[chinese];
      if (!item || typeof item !== 'object') {
        delete group[chinese];
        dirty = true;
        return;
      }
      if (!item.passedTests) {
        item.passedTests = { pinyin: false, writing: false, meaning: false };
        dirty = true;
      }
    });
  });
  if (dirty) saveLearnedSentences(learned);
  return learned;
}

/**
 * Lưu từ vựng đã học vào localStorage
 */
export function saveLearnedVocabularies(learned: LearnedVocabularies): void {
  void writeSingleton(STORES.LEARNED_VOCAB, learned);
}

/**
 * Lưu câu đã học vào localStorage
 */
export function saveLearnedSentences(learned: LearnedSentences): void {
  void writeSingleton(STORES.LEARNED_SENTENCES, learned);
}

/**
 * Đánh dấu từ vựng đã học
 * @param practiceType - Loại test: 'pinyin', 'writing', hoặc 'meaning'
 * @param isCorrect - True nếu trả lời đúng
 */
export function markVocabularyLearned(
  level: string,
  vocabulary: Vocabulary,
  practiceType: PracticeType,
  isCorrect: boolean = true
): void {
  const learned = getLearnedVocabularies();
  if (!learned[level]) {
    learned[level] = {};
  }

  const now = Date.now();
  const chinese = vocabulary.chinese;

  if (!isCorrect && !learned[level][chinese]) {
    window.dispatchEvent(new CustomEvent('learnedItemsUpdated', { 
      detail: { type: 'vocabulary', level, chinese, practiceType, isCorrect } 
    }));
    return;
  }

  if (learned[level][chinese]) {
    // Đã có, cập nhật
    const item = learned[level][chinese];
    item.lastPracticed = now;
    item.practiceCount++;
    if (isCorrect) {
      item.correctCount++;
      // Đánh dấu test này đã vượt qua
      item.passedTests[practiceType] = true;
    } else {
      // Nếu sai, reset test này
      item.passedTests[practiceType] = false;
    }
  } else {
    // Mới học
    learned[level][chinese] = {
      vocabulary,
      firstLearned: now,
      lastPracticed: now,
      practiceCount: 1,
      correctCount: isCorrect ? 1 : 0,
      passedTests: {
        pinyin: false,
        writing: false,
        meaning: false,
        [practiceType]: isCorrect, // Chỉ đánh dấu test hiện tại nếu đúng
      },
    };
  }

  saveLearnedVocabularies(learned);

  // Schedule the item for spaced repetition.
  ensureSrsItem('vocab', chinese);
  reviewSrsItem('vocab', chinese, isCorrect);

  // Dispatch event for UI synchronization
  window.dispatchEvent(new CustomEvent('learnedItemsUpdated', {
    detail: { type: 'vocabulary', level, chinese, practiceType, isCorrect }
  }));
}

/**
 * Đánh dấu câu đã học
 * @param practiceType - Loại test: 'pinyin', 'writing', hoặc 'meaning'
 * @param isCorrect - True nếu trả lời đúng
 */
export function markSentenceLearned(
  level: string,
  topic: string,
  sentence: Sentence,
  practiceType: PracticeType,
  isCorrect: boolean = true
): void {
  const learned = getLearnedSentences();
  if (!learned[level]) {
    learned[level] = {};
  }

  const now = Date.now();
  const chinese = sentence.chinese;

  if (!isCorrect && !learned[level][chinese]) {
    window.dispatchEvent(new CustomEvent('learnedItemsUpdated', { 
      detail: { type: 'sentence', level, topic, chinese, practiceType, isCorrect } 
    }));
    return;
  }

  if (learned[level][chinese]) {
    // Đã có, cập nhật
    const item = learned[level][chinese];
    item.lastPracticed = now;
    item.practiceCount++;
    if (isCorrect) {
      item.correctCount++;
      // Đánh dấu test này đã vượt qua
      item.passedTests[practiceType] = true;
    } else {
      // Nếu sai, reset test này
      item.passedTests[practiceType] = false;
    }
  } else {
    // Mới học
    learned[level][chinese] = {
      sentence,
      topic: topic || sentence.category || 'daily',
      firstLearned: now,
      lastPracticed: now,
      practiceCount: 1,
      correctCount: isCorrect ? 1 : 0,
      passedTests: {
        pinyin: false,
        writing: false,
        meaning: false,
        [practiceType]: isCorrect, // Chỉ đánh dấu test hiện tại nếu đúng
      },
    };
  }

  saveLearnedSentences(learned);

  // Schedule the item for spaced repetition.
  ensureSrsItem('sentence', chinese);
  reviewSrsItem('sentence', chinese, isCorrect);

  // Dispatch event for UI synchronization
  window.dispatchEvent(new CustomEvent('learnedItemsUpdated', {
    detail: { type: 'sentence', level, topic, chinese, practiceType, isCorrect }
  }));
}

/**
 * Kiểm tra xem từ vựng đã vượt qua cả 3 bài test chưa
 */
export function isItemMastered(passedTests: { pinyin: boolean; writing: boolean; meaning: boolean }): boolean {
  return passedTests.pinyin && passedTests.writing && passedTests.meaning;
}

/**
 * Kiểm tra xem từ vựng đã vượt qua cả 3 bài test chưa
 */
function hasPassedAllTests(passedTests: { pinyin: boolean; writing: boolean; meaning: boolean }): boolean {
  return isItemMastered(passedTests);
}

/**
 * Lấy số từ vựng đã học theo level (chỉ tính những từ đã vượt qua cả 3 bài test)
 */
export function getLearnedVocabularyCount(level: string): number {
  const learned = getLearnedVocabularies();
  if (!learned[level]) return 0;
  
  return Object.values(learned[level]).filter(item => 
    hasPassedAllTests(item.passedTests)
  ).length;
}

/**
 * Lấy số câu đã học theo level (chỉ tính những câu đã vượt qua cả 3 bài test)
 */
export function getLearnedSentenceCount(level: string): number {
  const learned = getLearnedSentences();
  if (!learned[level]) return 0;
  
  return Object.values(learned[level]).filter(item => 
    hasPassedAllTests(item.passedTests)
  ).length;
}

/**
 * Lấy tất cả số từ vựng đã học (chỉ tính những từ đã vượt qua cả 3 bài test)
 */
export function getAllLearnedVocabularyCounts(): { [level: string]: number } {
  const learned = getLearnedVocabularies();
  const counts: { [level: string]: number } = {};
  Object.keys(learned).forEach(level => {
    counts[level] = Object.values(learned[level]).filter(item => 
      hasPassedAllTests(item.passedTests)
    ).length;
  });
  return counts;
}

/**
 * Lấy tất cả số câu đã học (chỉ tính những câu đã vượt qua cả 3 bài test)
 */
export function getAllLearnedSentenceCounts(): { [level: string]: number } {
  const learned = getLearnedSentences();
  const counts: { [level: string]: number } = {};
  Object.keys(learned).forEach(level => {
    counts[level] = Object.values(learned[level]).filter(item => 
      hasPassedAllTests(item.passedTests)
    ).length;
  });
  return counts;
}

/**
 * Lấy tổng số từ vựng đã học
 */
export function getTotalLearnedVocabularyCount(): number {
  const counts = getAllLearnedVocabularyCounts();
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

/**
 * Lấy tổng số câu đã học
 */
export function getTotalLearnedSentenceCount(): number {
  const counts = getAllLearnedSentenceCounts();
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

/**
 * Xóa tất cả dữ liệu đã học
 */
export function clearLearnedItems(): void {
  saveLearnedVocabularies({});
  saveLearnedSentences({});
}

