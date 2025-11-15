import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onEnter?: () => void;
  onSpace?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEscape?: () => void;
  onCtrlK?: () => void;
  enabled?: boolean;
  target?: HTMLElement | null;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  const {
    onEnter,
    onSpace,
    onArrowLeft,
    onArrowRight,
    onEscape,
    onCtrlK,
    enabled = true,
    target = null
  } = config;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Bỏ qua nếu đang nhập text trong input/textarea
      const targetElement = event.target as HTMLElement;
      if (
        targetElement?.tagName === 'INPUT' ||
        targetElement?.tagName === 'TEXTAREA' ||
        targetElement?.isContentEditable
      ) {
        // Chỉ xử lý Escape và Ctrl+K khi đang ở trong input
        if (event.key === 'Escape' && onEscape) {
          event.preventDefault();
          onEscape();
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'k' && onCtrlK) {
          event.preventDefault();
          onCtrlK();
        }
        return;
      }

      switch (event.key) {
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case ' ':
          if (onSpace) {
            event.preventDefault();
            onSpace();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        default:
          // Ctrl+K hoặc Cmd+K
          if ((event.ctrlKey || event.metaKey) && event.key === 'k' && onCtrlK) {
            event.preventDefault();
            onCtrlK();
          }
          break;
      }
    },
    [enabled, onEnter, onSpace, onArrowLeft, onArrowRight, onEscape, onCtrlK]
  );

  useEffect(() => {
    const element = target || document;
    if (enabled) {
      const listener = (event: Event) => {
        if (event instanceof KeyboardEvent) {
          handleKeyDown(event);
        }
      };
      element.addEventListener('keydown', listener);
      return () => {
        element.removeEventListener('keydown', listener);
      };
    }
  }, [enabled, handleKeyDown, target]);
};

