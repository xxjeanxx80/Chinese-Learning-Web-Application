import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import './HSKLevelSelector.css';

interface HSKLevelSelectorProps {
  currentLevel: string;
  onLevelChange: (level: string) => void;
}

const HSKLevelSelector: React.FC<HSKLevelSelectorProps> = ({ currentLevel, onLevelChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const levels = [
    { id: 'hsk1', label: 'HSK 1', color: '#4CAF50', icon: '🟢' },
    { id: 'hsk2', label: 'HSK 2', color: '#2196F3', icon: '🔵' },
    { id: 'hsk3', label: 'HSK 3', color: '#FF9800', icon: '🟠' },
    { id: 'hsk4', label: 'HSK 4', color: '#F44336', icon: '🔴' },
    { id: 'hsk5', label: 'HSK 5', color: '#9C27B0', icon: '🟣' },
    { id: 'tuluyen', label: 'Tu Luyen', color: '#607D8B', icon: '●' }
  ];

  const currentLevelData = levels.find(l => l.id === currentLevel) || levels[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLevelSelect = (levelId: string) => {
    onLevelChange(levelId);
    setIsOpen(false);
  };

  return (
    <div className="hsk-level-selector" ref={dropdownRef}>
      <button
        className="hsk-level-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ borderColor: currentLevelData.color }}
      >
        <span className="hsk-level-icon">{currentLevelData.icon}</span>
        <span className="hsk-level-label">{currentLevelData.label}</span>
        <span className="hsk-level-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="hsk-mega-menu">
          <div className="mega-menu-header">
            <h3>Chọn cấp độ HSK</h3>
          </div>
          <div className="mega-menu-grid">
            {levels.map((level) => (
              <button
                key={level.id}
                className={`mega-menu-item ${currentLevel === level.id ? 'active' : ''}`}
                onClick={() => handleLevelSelect(level.id)}
                style={{
                  borderColor: level.color,
                  backgroundColor: currentLevel === level.id ? level.color : 'transparent',
                  color: currentLevel === level.id ? 'white' : level.color
                }}
              >
                <span className="mega-menu-icon">{level.icon}</span>
                <span className="mega-menu-label">{level.label}</span>
                {currentLevel === level.id && (
                  <span className="mega-menu-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HSKLevelSelector;

