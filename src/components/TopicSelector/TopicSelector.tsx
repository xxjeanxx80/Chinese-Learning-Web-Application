import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import { getTopicsForLevel } from '../../utils/sentenceStorage';
import './TopicSelector.css';

interface TopicSelectorProps {
  currentLevel: string;
  currentTopic: string;
  onTopicChange: (topic: string) => void;
}

const getTopicName = (topic: string): string => {
  const topicMap: { [key: string]: string } = {
    'office': 'Giao tiếp công sở',
    'social': 'Giao tiếp xã hội',
    'school': 'Giao tiếp trường lớp',
    'shopping': 'Giao tiếp mua bán',
    'daily': 'Giao tiếp hàng ngày',
    'travel': 'Du lịch',
    'food': 'Ẩm thực',
    'health': 'Sức khỏe'
  };
  return topicMap[topic] || topic;
};

const TopicSelector: React.FC<TopicSelectorProps> = ({ currentLevel, currentTopic, onTopicChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const topics = getTopicsForLevel(currentLevel);

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

  const handleTopicSelect = (topic: string) => {
    onTopicChange(topic);
    setIsOpen(false);
  };

  if (topics.length === 0) {
    return null;
  }

  const currentTopicName = currentTopic ? getTopicName(currentTopic) : 'Tất cả chủ đề';

  return (
    <div className="topic-selector-wrapper" ref={dropdownRef}>
      <button
        className="topic-selector-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="topic-selector-icon">📂</span>
        <span className="topic-selector-label">{currentTopicName}</span>
        <span className="topic-selector-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="topic-dropdown-menu">
          <button
            className={`topic-dropdown-item ${!currentTopic ? 'active' : ''}`}
            onClick={() => handleTopicSelect('')}
          >
            <span className="topic-dropdown-icon">📚</span>
            <span className="topic-dropdown-label">Tất cả chủ đề</span>
            {!currentTopic && (
              <span className="topic-dropdown-check">✓</span>
            )}
          </button>
          {topics.map((topic) => (
            <button
              key={topic}
              className={`topic-dropdown-item ${currentTopic === topic ? 'active' : ''}`}
              onClick={() => handleTopicSelect(topic)}
            >
              <span className="topic-dropdown-icon">📂</span>
              <span className="topic-dropdown-label">{getTopicName(topic)}</span>
              {currentTopic === topic && (
                <span className="topic-dropdown-check">✓</span>
              )}
            </button>
          ))}
          
        </div>
      )}
    </div>
  );
};

export default TopicSelector;

