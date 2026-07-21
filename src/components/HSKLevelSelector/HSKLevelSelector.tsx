import type React from 'react';
import './HSKLevelSelector.css';

interface HSKLevelSelectorProps {
  currentLevel: string;
  onLevelChange: (level: string) => void;
}

const HSKLevelSelector: React.FC<HSKLevelSelectorProps> = ({ currentLevel, onLevelChange }) => {
  const levels = [
    { id: 'hsk1', label: 'HSK 1', color: '#4CAF50' },
    { id: 'hsk2', label: 'HSK 2', color: '#2196F3' },
    { id: 'hsk3', label: 'HSK 3', color: '#FF9800' },
    { id: 'hsk4', label: 'HSK 4', color: '#F44336' },
    { id: 'hsk5', label: 'HSK 5', color: '#9C27B0' },
    { id: 'tuluyen', label: 'Tự Luyện', color: '#607D8B' }
  ];

  return (
    <div className="hsk-level-list">
      {levels.map((level) => (
        <button
          key={level.id}
          className={`hsk-level-pill ${currentLevel === level.id ? 'active' : ''}`}
          onClick={() => onLevelChange(level.id)}
          style={{
            borderColor: level.color,
            '--level-color': level.color
          } as React.CSSProperties}
        >
          <span className="level-dot" style={{ backgroundColor: level.color }}></span>
          <span className="level-label">{level.label}</span>
        </button>
      ))}
    </div>
  );
};

export default HSKLevelSelector;

