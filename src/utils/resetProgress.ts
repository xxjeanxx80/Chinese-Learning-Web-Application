import { clearAllSessionProgress, clearSessionProgressByCategory } from './sessionProgressStorage';

/**
 * Reset tất cả điểm số và tiến độ
 */
export function resetAllProgress(): void {
  // Clear localStorage
  clearAllSessionProgress();
  
  // Dispatch event để các component reset state
  window.dispatchEvent(new CustomEvent('resetProgress', { 
    detail: { type: 'all' } 
  }));
}

/**
 * Reset điểm số của các bài tập
 */
export function resetScores(): void {
  clearSessionProgressByCategory('scores');
  
  window.dispatchEvent(new CustomEvent('resetProgress', { 
    detail: { type: 'scores' } 
  }));
}

/**
 * Reset flashcard progress (từ đã học)
 */
export function resetFlashcardProgress(): void {
  clearSessionProgressByCategory('flashcard');
  
  window.dispatchEvent(new CustomEvent('resetProgress', { 
    detail: { type: 'flashcard' } 
  }));
}

