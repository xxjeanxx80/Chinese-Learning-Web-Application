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
    'office': 'Công sở',
    'social': 'Xã hội',
    'school': 'Trường lớp',
    'shopping': 'Mua bán',
    'daily': 'Hàng ngày',
    'travel': 'Du lịch',
    'food': 'Ẩm thực',
    'health': 'Sức khỏe'
  };
  return topicMap[topic] || topic;
};

const TopicSelector: React.FC<TopicSelectorProps> = ({ currentLevel, currentTopic, onTopicChange }) => {
  const topics = getTopicsForLevel(currentLevel);

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="topic-level-list">
      <button
        className={`topic-level-pill ${!currentTopic ? 'active' : ''}`}
        onClick={() => onTopicChange('')}
      >
        <span className="topic-dot"></span>
        <span className="topic-label">Tất cả chủ đề</span>
      </button>
      {topics.map((topic) => (
        <button
          key={topic}
          className={`topic-level-pill ${currentTopic === topic ? 'active' : ''}`}
          onClick={() => onTopicChange(topic)}
        >
          <span className="topic-dot"></span>
          <span className="topic-label">{getTopicName(topic)}</span>
        </button>
      ))}
    </div>
  );
};

export default TopicSelector;

