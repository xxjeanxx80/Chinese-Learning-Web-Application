import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

import { speakChinese } from '../../utils/speakChinese';
import { getLearnedVocabularies, getLearnedSentences } from '../../utils/learnedItemsStorage';
import { getWrongAnswersByLevel } from '../../utils/wrongAnswersStorage';
import { getWrongSentences } from '../../utils/sentenceWrongAnswersStorage';
import StrokeOrderModal from '../StrokeOrderModal';
import './LearnedWordsPanel.css';

// Inline SVG icons for clean look
const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const SpeakerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  </svg>
);

const PenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
    <path d="M2 2l7.586 7.586"></path>
    <circle cx="11" cy="11" r="2"></circle>
  </svg>
);

interface LearnedWordsPanelProps {
  level: string;
  itemType?: 'vocabulary' | 'sentence';
  vocabularies: any[]; // Vocabulary[] or Sentence[]
  wordResults: Map<string, boolean>; // Session results
  title?: string;
  isInline?: boolean;
}

const LearnedWordsPanel: React.FC<LearnedWordsPanelProps> = ({ 
  level, 
  itemType = 'vocabulary',
  vocabularies, 
  wordResults, 
  title,
  isInline = false
}) => {
  const [strokeChar, setStrokeChar] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(!isInline);
  const [activeTab, setActiveTab] = useState<'learned' | 'wrong'>('learned');
  const [globalLearned, setGlobalLearned] = useState(() => 
    itemType === 'vocabulary' ? getLearnedVocabularies() : getLearnedSentences()
  );
  const [globalWrong, setGlobalWrong] = useState(() => 
    itemType === 'vocabulary' ? getWrongAnswersByLevel(level) : Object.values(getWrongSentences()[level] || {}).flat()
  );

  // Listen for updates from any practice component
  useEffect(() => {
    const handleUpdate = () => {
      setGlobalLearned(itemType === 'vocabulary' ? getLearnedVocabularies() : getLearnedSentences());
      setGlobalWrong(itemType === 'vocabulary' ? getWrongAnswersByLevel(level) : Object.values(getWrongSentences()[level] || {}).flat());
    };
    
    window.addEventListener('learnedItemsUpdated', handleUpdate);
    window.addEventListener('vocabUpdated', handleUpdate); // For manual manager updates
    
    return () => {
      window.removeEventListener('learnedItemsUpdated', handleUpdate);
      window.removeEventListener('vocabUpdated', handleUpdate);
    };
  }, [level, itemType]);

  // Filter and prepare items
  const { learnedList, wrongList } = useMemo(() => {
    const levelLearned = (globalLearned as any)[level] || {};
    const resultLearned: any[] = [];
    const resultWrong: any[] = [];
    
    vocabularies.forEach((item, index) => {
      const chinese = item.chinese;
      const isSessionTrue = wordResults.has(chinese) && wordResults.get(chinese) === true;
      const isSessionFalse = wordResults.has(chinese) && wordResults.get(chinese) === false;
      const storedLearned = levelLearned[chinese];
      const storedWrong = globalWrong.find((w: any) => (w.vocabulary?.chinese || w.sentence?.chinese) === chinese);

      const masteryObj = storedLearned?.passedTests || { pinyin: false, writing: false, meaning: false };

      if (isSessionFalse) {
        resultWrong.push({ key: index, item, isSession: true, mastery: masteryObj });
      } else if (isSessionTrue) {
        resultLearned.push({ key: index, item, isSession: true, mastery: masteryObj });
      } else if (storedWrong) {
        resultWrong.push({ key: index, item, isSession: false, mastery: masteryObj });
      } else if (storedLearned) {
        resultLearned.push({ key: index, item, isSession: false, mastery: masteryObj });
      }
    });

    const sortFn = (a: any, b: any) => {
      if (a.isSession && !b.isSession) return -1;
      if (!a.isSession && b.isSession) return 1;
      return a.key - b.key;
    };

    return {
      learnedList: resultLearned.sort(sortFn),
      wrongList: resultWrong.sort(sortFn)
    };
  }, [globalLearned, globalWrong, level, vocabularies, wordResults]);

  const displayItems = activeTab === 'learned' ? learnedList : wrongList;

  const toggleExpand = (key: number) => {
    setExpandedIndex(expandedIndex === key ? null : key);
  };

  if (!isInline) {
    const portalTarget = document.getElementById('right-sidebar-portal');
    if (!portalTarget) return null;
  }

  const PanelContent = (
    <aside className={`learned-panel ${isInline ? 'is-inline' : ''} ${isInline && !isOpen ? 'is-collapsed' : ''}`}>
      <div 
        className={`learned-panel-header ${isInline ? 'mobile-menu-link' : ''}`} 
        onClick={() => isInline && setIsOpen(!isOpen)} 
        style={{ cursor: isInline ? 'pointer' : 'default' }}
      >
        <div className="learned-panel-title">
          <span className="menu-icon"><BookIcon /></span>
          <span className="menu-text">{title || (itemType === 'vocabulary' ? "Từ vựng" : "Câu")}</span>
        </div>
        <div className="learned-panel-meta">
          {isInline && (
            <span className="menu-arrow" style={{ opacity: 1 }}>
              <svg 
                className={`learned-chevron ${isOpen ? 'rotated' : ''}`} 
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          )}
        </div>
      </div>

      {(!isInline || isOpen) && (
        <>
          <div className="learned-panel-tabs">
            <button 
              className={`learned-tab ${activeTab === 'learned' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setActiveTab('learned'); setExpandedIndex(null); }}
            >
              Đã thuộc <span className="learned-count">{learnedList.length}</span>
            </button>
            <button 
              className={`learned-tab ${activeTab === 'wrong' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setActiveTab('wrong'); setExpandedIndex(null); }}
            >
              Chưa thuộc <span className="learned-count wrong">{wrongList.length}</span>
            </button>
          </div>
          <div className={`learned-panel-list ${isInline ? 'mobile-menu-submenu' : ''}`}>
        {displayItems.length === 0 ? (
          <div className="learned-empty">
            <div className="learned-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                <line x1="9" y1="10" x2="15" y2="10"></line>
              </svg>
            </div>
            <p>Chưa có mục nào</p>
            <p className="learned-empty-hint">
              {activeTab === 'learned' ? 'Trả lời đúng để thêm vào đây' : 'Từ vựng trả lời sai sẽ nằm ở đây'}
            </p>
          </div>
        ) : (
          displayItems.map(({ key, item, isSession, mastery }) => (
            <div
              key={key}
              className={`learned-item ${expandedIndex === key ? 'expanded' : ''} ${isSession ? 'is-session' : ''} ${activeTab === 'wrong' ? 'wrong-item' : ''}`}
            >
              <div className="learned-item-main" onClick={() => toggleExpand(key)}>
                {isSession && <div className={`session-indicator ${activeTab === 'wrong' ? 'wrong' : ''}`} title="Vừa học trong phiên này" />}
                <span className="learned-chinese">{item.chinese}</span>
                <span className="learned-pinyin">{item.pinyin}</span>
                
                <div className="mastery-indicators">
                  <div className={`mastery-badge ${mastery.pinyin ? 'active' : ''}`} title="Pinyin">P</div>
                  <div className={`mastery-badge ${mastery.writing ? 'active' : ''}`} title="Viết">W</div>
                  <div className={`mastery-badge ${mastery.meaning ? 'active' : ''}`} title="Nghĩa">M</div>
                </div>

                <svg className="learned-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {expandedIndex === key && (
                <div className="learned-item-detail">
                  <div className="learned-meaning">
                    <span className="detail-label">Nghĩa:</span>
                    <span>{item.vietnamese}</span>
                  </div>
                  <div className="learned-actions">
                    <button
                      className="learned-action-btn"
                      onClick={(e) => { e.stopPropagation(); speakChinese(item.chinese); }}
                      title="Phát âm"
                    >
                      <SpeakerIcon />
                    </button>
                    <button
                      className="learned-action-btn"
                      onClick={(e) => { e.stopPropagation(); setStrokeChar(item.chinese); }}
                      title="Xem nét viết"
                    >
                      <PenIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        </div>
        </>
      )}
    </aside>
  );

  return (
    <>
      {isInline ? (
        PanelContent
      ) : (
        createPortal(PanelContent, document.getElementById('right-sidebar-portal')!)
      )}

      {/* StrokeOrderModal rendered OUTSIDE the portal to avoid being clipped */}
      {strokeChar && (
        <StrokeOrderModal
          character={strokeChar}
          onClose={() => setStrokeChar(null)}
        />
      )}
    </>
  );
};

export default LearnedWordsPanel;

