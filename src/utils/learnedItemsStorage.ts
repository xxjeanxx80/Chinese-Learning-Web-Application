/**
 * Utility để lưu và quản lý từ vựng và câu đã học
 */

import { Vocabulary } from '../data/vocabulary';
import { Sentence } from '../data/sentences';

const LEARNED_VOCAB_KEY = 'hsk_learned_vocabularies';
const LEARNED_SENTENCES_KEY = 'hsk_learned_sentences';

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
  try {
    const stored = localStorage.getItem(LEARNED_VOCAB_KEY);
    if (stored) {
      const learned = JSON.parse(stored);
      // Migrate old data: thêm passedTests nếu chưa có
      Object.keys(learned).forEach(level => {
        Object.keys(learned[level] || {}).forEach(chinese => {
          const item = learned[level][chinese];
          if (!item.passedTests) {
            item.passedTests = {
              pinyin: false,
              writing: false,
              meaning: false,
            };
          }
        });
      });
      return learned;
    }
  } catch (error) {
    console.error('Error loading learned vocabularies:', error);
  }
  return {};
}

/**
 * Lấy câu đã học từ localStorage
 */
export function getLearnedSentences(): LearnedSentences {
  try {
    const stored = localStorage.getItem(LEARNED_SENTENCES_KEY);
    if (stored) {
      const learned = JSON.parse(stored);
      // Migrate old data: thêm passedTests nếu chưa có
      Object.keys(learned).forEach(level => {
        Object.keys(learned[level] || {}).forEach(chinese => {
          const item = learned[level][chinese];
          if (!item.passedTests) {
            item.passedTests = {
              pinyin: false,
              writing: false,
              meaning: false,
            };
          }
        });
      });
      return learned;
    }
  } catch (error) {
    console.error('Error loading learned sentences:', error);
  }
  return {};
}

/**
 * Lưu từ vựng đã học vào localStorage
 */
export function saveLearnedVocabularies(learned: LearnedVocabularies): void {
  try {
    localStorage.setItem(LEARNED_VOCAB_KEY, JSON.stringify(learned));
  } catch (error) {
    console.error('Error saving learned vocabularies:', error);
  }
}

/**
 * Lưu câu đã học vào localStorage
 */
export function saveLearnedSentences(learned: LearnedSentences): void {
  try {
    localStorage.setItem(LEARNED_SENTENCES_KEY, JSON.stringify(learned));
  } catch (error) {
    console.error('Error saving learned sentences:', error);
  }
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
  try {
    localStorage.removeItem(LEARNED_VOCAB_KEY);
    localStorage.removeItem(LEARNED_SENTENCES_KEY);
  } catch (error) {
    console.error('Error clearing learned items:', error);
  }
}

