/**
 * Utility để reset tiến độ học tập
 */

/**
 * Reset tất cả điểm số và tiến độ
 */
export function resetAllProgress(): void {
  // Dispatch event để các component reset state
  window.dispatchEvent(new CustomEvent('resetProgress', { 
    detail: { type: 'all' } 
  }));
}

/**
 * Reset điểm số của các bài tập
 */
export function resetScores(): void {
  window.dispatchEvent(new CustomEvent('resetProgress', { 
    detail: { type: 'scores' } 
  }));
}

/**
 * Reset flashcard progress (từ đã học)
 */
export function resetFlashcardProgress(): void {
  window.dispatchEvent(new CustomEvent('resetProgress', { 
    detail: { type: 'flashcard' } 
  }));
}

