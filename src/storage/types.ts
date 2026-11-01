/**
 * Storage types — entity definitions for IndexedDB-backed storage.
 * These mirror the shapes previously stored in localStorage, so migration
 * is a 1:1 copy. Field names/types are UNCHANGED to keep component code intact.
 */

import { Vocabulary } from '../data/vocabulary';
import { Sentence } from '../data/sentences';

// ---------- Vocabulary ----------
export interface CustomVocabularies {
  [level: string]: Vocabulary[];
}

export interface VocabularyOverride {
  level: string;
  chinese: string;
  vocabulary: Vocabulary;
}

// ---------- Sentences ----------
export interface CustomSentences {
  [level: string]: {
    [topic: string]: Sentence[];
  };
}

// ---------- Learned items ----------
export type PracticeType = 'pinyin' | 'writing' | 'meaning';

export interface LearnedVocabItem {
  vocabulary: Vocabulary;
  firstLearned: number;
  lastPracticed: number;
  practiceCount: number;
  correctCount: number;
  passedTests: { pinyin: boolean; writing: boolean; meaning: boolean };
}

export interface LearnedVocabularies {
  [level: string]: { [chinese: string]: LearnedVocabItem };
}

export interface LearnedSentenceItem {
  sentence: Sentence;
  topic: string;
  firstLearned: number;
  lastPracticed: number;
  practiceCount: number;
  correctCount: number;
  passedTests: { pinyin: boolean; writing: boolean; meaning: boolean };
}

export interface LearnedSentences {
  [level: string]: { [chinese: string]: LearnedSentenceItem };
}

// ---------- Wrong answers ----------
export interface WrongAnswer {
  vocabulary: Vocabulary;
  level: string;
  wrongCount: number;
  correctCount: number;
  lastWrong: number;
  lastCorrect: number;
}

export interface WrongAnswersByLevel {
  [level: string]: WrongAnswer[];
}

export interface WrongSentence {
  sentence: Sentence;
  level: string;
  topic: string;
  wrongCount: number;
  correctCount: number;
  lastWrong: number;
  lastCorrect: number;
}

export interface WrongSentencesByLevel {
  [level: string]: { [topic: string]: WrongSentence[] };
}

// ---------- Statistics ----------
export interface StudySession {
  date: string;
  level: string;
  correct: number;
  total: number;
  duration: number;
  function: string;
}

export interface DailyStats {
  date: string;
  totalCorrect: number;
  totalAttempts: number;
  totalDuration: number;
  sessions: StudySession[];
}

export interface Statistics {
  dailyStats: DailyStats[];
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  totalWordsLearned: number;
  totalSentencesLearned: number;
  totalTimeSpent: number;
  accuracyByLevel: { [level: string]: { correct: number; total: number } };
  wordsByLevel: { [level: string]: number };
  sentencesByLevel: { [level: string]: number };
}

// ---------- Session progress ----------
export interface SessionProgress {
  mode: string;
  level: string;
  subKey: string;
  data: any;
}

// ---------- Storage key enum ----------
export const STORES = {
  CUSTOM_VOCAB: 'custom_vocab',
  VOCAB_OVERRIDES: 'vocab_overrides',
  CUSTOM_SENTENCES: 'custom_sentences',
  LEARNED_VOCAB: 'learned_vocab',
  LEARNED_SENTENCES: 'learned_sentences',
  WRONG_VOCAB: 'wrong_vocab',
  WRONG_SENTENCES: 'wrong_sentences',
  STATISTICS: 'statistics',
  SESSION_PROGRESS: 'session_progress',
  SETTINGS: 'settings',
  SRS_STATE: 'srs_state',
  OUTBOX: 'outbox',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

export const DB_NAME = 'mikuhan-storage';
export const DB_VERSION = 1;
export const MIGRATED_KEY = 'hsk_migrated_to_idb_v1';
export const SCHEMA_VERSION = 1;
