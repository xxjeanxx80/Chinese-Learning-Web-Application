import React from 'react';
import './TabNavigation.css';

interface TabNavigationProps {
  currentLevel: string;
  onLevelChange: (level: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ currentLevel, onLevelChange }) => {
  const levels = [
    { id: 'hsk1', label: 'HSK 1', shortLabel: '1', color: '#4CAF50' },
    { id: 'hsk2', label: 'HSK 2', shortLabel: '2', color: '#2196F3' },
    { id: 'hsk3', label: 'HSK 3', shortLabel: '3', color: '#FF9800' },
    { id: 'hsk4', label: 'HSK 4', shortLabel: '4', color: '#F44336' },
    { id: 'hsk5', label: 'HSK 5', shortLabel: '5', color: '#9C27B0' },
    { id: 'tuluyen', label: 'Tu Luyen', shortLabel: 'TL', color: '#607D8B' }
  ];

  return (
    <div className="tab-navigation">
      {levels.map((level) => (
        <button
          key={level.id}
          className={`tab-button ${currentLevel === level.id ? 'active' : ''}`}
          onClick={() => onLevelChange(level.id)}
          style={{
            borderColor: level.color,
            backgroundColor: currentLevel === level.id ? level.color : 'transparent',
            color: currentLevel === level.id ? 'white' : level.color
          }}
          title={level.label} /* Tooltip với full label trên mobile */
        >
          <span className="tab-label-full">{level.label}</span>
          <span className="tab-label-short">{level.shortLabel}</span>
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
