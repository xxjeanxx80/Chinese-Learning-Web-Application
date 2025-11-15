import React, { useEffect } from 'react';
import './MobileDrawer.css';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, children }) => {
  // Đóng drawer khi nhấn ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Ngăn scroll body khi drawer mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Chỉ render overlay và drawer trên mobile, và chỉ khi drawer mở hoặc đang trong quá trình transition
  return (
    <>
      {/* Overlay - chỉ hiện khi drawer mở */}
      {isOpen && (
        <div 
          className={`mobile-drawer-overlay ${isOpen ? 'active' : ''}`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Drawer - luôn render nhưng ẩn khi đóng */}
      <aside className={`mobile-drawer ${isOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <h2>Menu</h2>
          <button 
            className="mobile-drawer-close"
            onClick={onClose}
            aria-label="Đóng menu"
          >
            ✕
          </button>
        </div>
        <div className="mobile-drawer-content">
          {children}
        </div>
      </aside>
    </>
  );
};

export default MobileDrawer;

