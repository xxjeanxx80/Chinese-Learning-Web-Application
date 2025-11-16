import React, { useEffect } from 'react';
import './KeyboardShortcutsModal.css';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Enter', description: 'Kiểm tra đáp án / Câu tiếp theo' },
    { key: '← →', description: 'Trước / Sau (Previous / Next)' },
    { key: 'Esc', description: 'Đóng modal / Hủy' },
    { key: 'Ctrl/Cmd + K', description: 'Focus vào ô tìm kiếm' },
    { key: 'Ctrl/Cmd + /', description: 'Mở bảng phím tắt này' },
  ];

  return (
    <div className="keyboard-shortcuts-modal-overlay" onClick={onClose}>
      <div className="keyboard-shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-shortcuts-header">
          <h2>⌨️ Phím tắt (Keyboard Shortcuts)</h2>
          <button className="keyboard-shortcuts-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <div className="keyboard-shortcuts-content">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="keyboard-shortcut-item">
              <div className="keyboard-shortcut-key">
                {shortcut.key.split(' ').map((k, i) => (
                  <kbd key={i}>{k}</kbd>
                ))}
              </div>
              <div className="keyboard-shortcut-description">{shortcut.description}</div>
            </div>
          ))}
        </div>
        <div className="keyboard-shortcuts-footer">
          <button className="keyboard-shortcuts-btn-close" onClick={onClose}>
            Đóng (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;

