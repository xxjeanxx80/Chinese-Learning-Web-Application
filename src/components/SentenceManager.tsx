import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Sentence } from '../data/sentences';
import {
  getCustomSentences,
  addSentence,
  removeSentence,
  updateSentence,
  clearAllCustomSentences,
  exportCustomSentences,
  importCustomSentencesFromExcel,
  getSentencesForLevelAndTopic,
  getTopicsForLevel
} from '../utils/sentenceStorage';
import './SentenceManager.css';

interface SentenceManagerProps {
  currentLevel: string;
}

const SentenceManager: React.FC<SentenceManagerProps> = ({ currentLevel }) => {
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [customSentences, setCustomSentences] = useState(getCustomSentences());
  const [allSentences, setAllSentences] = useState<Sentence[]>([]);
  const [formData, setFormData] = useState<Sentence>({
    chinese: '',
    pinyin: '',
    vietnamese: '',
    category: ''
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTopic, setEditingTopic] = useState<string>('');
  const [showDefault, setShowDefault] = useState(true);

  const topics = getTopicsForLevel(currentLevel);
  const availableTopics = ['office', 'social', 'school', 'shopping', 'daily', 'travel', 'food', 'health'];

  // Memoize danh sách câu để tránh tính toán lại không cần thiết
  const allSentencesMemo = useMemo(() => {
    // Nếu không chọn topic, hiển thị tất cả câu của tất cả topic
    if (!currentTopic) {
      if (showDefault) {
        // Lấy tất cả câu mặc định của tất cả topic
        const allTopics = getTopicsForLevel(currentLevel);
        const allSentences: Sentence[] = [];
        allTopics.forEach(topic => {
          const topicSentences = getSentencesForLevelAndTopic(currentLevel, topic);
          allSentences.push(...topicSentences);
        });
        return allSentences;
      } else {
        // Lấy tất cả câu custom của tất cả topic
        const custom = getCustomSentences()[currentLevel] || {};
        const allSentences: Sentence[] = [];
        Object.values(custom).forEach(topicSentences => {
          allSentences.push(...topicSentences);
        });
        return allSentences;
      }
    }
    
    // Nếu có chọn topic, chỉ hiển thị câu của topic đó
    if (showDefault) {
      return getSentencesForLevelAndTopic(currentLevel, currentTopic);
    } else {
      return getCustomSentences()[currentLevel]?.[currentTopic] || [];
    }
  }, [currentLevel, currentTopic, showDefault, customSentences]);

  useEffect(() => {
    setAllSentences(allSentencesMemo);
  }, [allSentencesMemo]);

  const handleInputChange = useCallback((field: keyof Sentence, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.chinese.trim() || !formData.pinyin.trim() || !formData.vietnamese.trim()) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    if (!formData.category || !formData.category.trim()) {
      alert('Vui lòng chọn Category (chủ đề)!');
      return;
    }

    const topic = formData.category.trim().toLowerCase();

    if (editingIndex !== null && editingTopic) {
      // Cập nhật câu
      updateSentence(currentLevel, editingTopic, editingIndex, formData);
      setEditingIndex(null);
      setEditingTopic('');
    } else {
      // Thêm câu mới
      addSentence(currentLevel, topic, formData);
      
      // Nếu category khác với currentTopic, tự động chuyển sang topic đó để hiển thị câu vừa thêm
      if (topic !== currentTopic) {
        setCurrentTopic(topic);
      }
    }

    // Reset form
    setFormData({ chinese: '', pinyin: '', vietnamese: '', category: currentTopic || '' });
    setCustomSentences(getCustomSentences());
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('sentencesUpdated'));
  }, [formData, editingIndex, editingTopic, currentLevel, currentTopic]);

  const handleEdit = useCallback((index: number, topic?: string) => {
    // Nếu không có currentTopic, cần truyền topic vào
    const editTopic = topic || currentTopic;
    if (!editTopic) return;
    const customSentenceList = getCustomSentences()[currentLevel]?.[editTopic] || [];
    if (customSentenceList[index]) {
      setFormData(customSentenceList[index]);
      setEditingIndex(index);
      setEditingTopic(editTopic);
      // Tự động chuyển sang topic của câu đang edit
      if (!currentTopic || currentTopic !== editTopic) {
        setCurrentTopic(editTopic);
      }
    }
  }, [currentLevel, currentTopic]);

  const handleDelete = useCallback((index: number, topic?: string) => {
    // Nếu không có currentTopic, cần truyền topic vào
    const deleteTopic = topic || currentTopic;
    if (!deleteTopic) return;
    if (window.confirm('Bạn có chắc muốn xóa câu này?')) {
      removeSentence(currentLevel, deleteTopic, index);
      setCustomSentences(getCustomSentences());
      window.dispatchEvent(new Event('sentencesUpdated'));
      if (editingIndex === index && editingTopic === deleteTopic) {
        setEditingIndex(null);
        setEditingTopic('');
        setFormData({ chinese: '', pinyin: '', vietnamese: '', category: deleteTopic });
      }
    }
  }, [currentLevel, currentTopic, editingIndex, editingTopic]);

  const handleClear = () => {
    if (window.confirm('Bạn có chắc muốn xóa TẤT CẢ câu tự thêm? Hành động này không thể hoàn tác!')) {
      clearAllCustomSentences();
      setCustomSentences(getCustomSentences());
      window.dispatchEvent(new Event('sentencesUpdated'));
      setEditingIndex(null);
      setEditingTopic('');
      setFormData({ chinese: '', pinyin: '', vietnamese: '', category: currentTopic || '' });
    }
  };

  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const getTopicName = (topic: string): string => {
    const topicNames: Record<string, string> = {
      office: 'Giao tiếp công sở',
      social: 'Giao tiếp xã hội',
      school: 'Giao tiếp trường lớp',
      shopping: 'Giao tiếp mua bán',
      daily: 'Giao tiếp hàng ngày',
      travel: 'Du lịch',
      food: 'Ẩm thực',
      health: 'Sức khỏe'
    };
    return topicNames[topic] || topic;
  };

  const handleExport = useCallback(() => {
    // Nếu đang hiển thị câu mặc định và không chọn topic (hiển thị tất cả), export cả default và custom
    // Nếu chỉ hiển thị custom, chỉ export custom
    const shouldIncludeDefault = showDefault && !currentTopic;
    exportCustomSentences(shouldIncludeDefault, currentLevel);
  }, [showDefault, currentTopic, currentLevel]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const merge = importMode === 'merge';
    const result = await importCustomSentencesFromExcel(file, currentLevel, merge);
    
    if (result.success) {
      setCustomSentences(getCustomSentences());
      window.dispatchEvent(new Event('sentencesUpdated'));
      alert(result.message);
    } else {
      alert(result.message || 'Import thất bại! Vui lòng kiểm tra định dạng file Excel.');
    }
    
    e.target.value = ''; // Reset input
  };

  // Tính số câu custom: nếu không chọn topic thì tính tổng tất cả, nếu có chọn thì chỉ tính topic đó
  const customSentenceList = useMemo(() => {
    const custom = getCustomSentences()[currentLevel] || {};
    if (!currentTopic) {
      // Tính tổng tất cả câu custom của tất cả topic
      let total = 0;
      Object.values(custom).forEach(topicSentences => {
        total += topicSentences.length;
      });
      return total;
    } else {
      return custom[currentTopic]?.length || 0;
    }
  }, [currentLevel, currentTopic, customSentences]);

  return (
    <div className="sentence-manager">
      <div className="manager-header">
        <h2>💬 Quản lý câu tiếng Trung - {currentLevel.toUpperCase()}</h2>
        <div className="toggle-view">
          <label>
            <input
              type="checkbox"
              checked={showDefault}
              onChange={(e) => setShowDefault(e.target.checked)}
            />
            Hiển thị câu mặc định
          </label>
        </div>
      </div>

      <div className="topic-selector-section">
        <label>Chủ đề:</label>
        <select 
          value={currentTopic} 
          onChange={(e) => {
            const selectedTopic = e.target.value;
            setCurrentTopic(selectedTopic);
            setFormData({ chinese: '', pinyin: '', vietnamese: '', category: selectedTopic });
            setEditingIndex(null);
            setEditingTopic('');
          }}
          className="topic-select"
        >
          <option value="">-- Chọn chủ đề --</option>
          {topics.map(topic => (
            <option key={topic} value={topic}>
              {getTopicName(topic)}
            </option>
          ))}
        </select>
      </div>

      <div className="add-sentence-form">
        <h3>{editingIndex !== null ? '✏️ Sửa câu' : '➕ Thêm câu mới'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Chữ Hán:</label>
              <input
                type="text"
                value={formData.chinese}
                onChange={(e) => handleInputChange('chinese', e.target.value)}
                placeholder="VD: 你好，我是新来的员工。"
                required
              />
            </div>
            <div className="form-group">
              <label>Pinyin:</label>
              <input
                type="text"
                value={formData.pinyin}
                onChange={(e) => handleInputChange('pinyin', e.target.value)}
                placeholder="VD: nǐ hǎo, wǒ shì xīn lái de yuán gōng"
                required
              />
            </div>
            <div className="form-group">
              <label>Nghĩa tiếng Việt:</label>
              <input
                type="text"
                value={formData.vietnamese}
                onChange={(e) => handleInputChange('vietnamese', e.target.value)}
                placeholder="VD: Xin chào, tôi là nhân viên mới."
                required
              />
            </div>
            <div className="form-group">
              <label>Category (Chủ đề):</label>
              <select
                value={formData.category || currentTopic}
                onChange={(e) => handleInputChange('category', e.target.value)}
                required
                className="category-select"
              >
                <option value="">-- Chọn chủ đề --</option>
                {availableTopics.map(topic => (
                  <option key={topic} value={topic}>
                    {getTopicName(topic)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingIndex !== null ? '💾 Lưu thay đổi' : '➕ Thêm câu'}
            </button>
            {editingIndex !== null && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingIndex(null);
                  setEditingTopic('');
                  setFormData({ chinese: '', pinyin: '', vietnamese: '', category: currentTopic || '' });
                }}
              >
                ❌ Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="sentence-list-section">
        <div className="list-header">
          <h3>
            📚 Danh sách câu
            {currentTopic ? (
              <> ({allSentences.length} câu - {customSentenceList} câu tự thêm)</>
            ) : (
              <> ({allSentences.length} câu - {customSentenceList} câu tự thêm từ tất cả chủ đề)</>
            )}
          </h3>
          <div className="list-actions">
            <div className="export-section">
              <h4 className="export-title">📥 Sao lưu (Backup)</h4>
              <div className="export-buttons">
                <button onClick={handleExport} className="btn-export">
                  📊 Excel - Câu tự thêm
                </button>
              </div>
              <p className="export-note">
                Format: A1=Chữ Hán, B1=Pinyin, C1=Nghĩa tiếng Việt, D1=Category
              </p>
            </div>
            <div className="import-section">
              <h4 className="import-title">📤 Import Excel</h4>
              <label className="btn-import">
                Chọn file Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </label>
              <div className="import-mode-selector">
                <label>
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  />
                  Merge (Gộp)
                </label>
                <label>
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  />
                  Replace (Thay thế)
                </label>
              </div>
              <p className="import-note">
                Format: A1=Chữ Hán, B1=Pinyin, C1=Nghĩa tiếng Việt, D1=Category<br/>
                Mỗi dòng là 1 câu. Category dùng để phân loại topic.
              </p>
            </div>
            {customSentenceList > 0 && (
              <button onClick={handleClear} className="btn-danger">
                🗑️ Xóa tất cả câu tự thêm
              </button>
            )}
          </div>
        </div>

        {allSentences.length === 0 ? (
          <div className="empty-message">
            <p>Chưa có câu nào. Hãy thêm câu mới!</p>
          </div>
        ) : (
          <div className="sentence-list">
            {allSentences.map((sentence, index) => {
              // Tính toán isCustom và customIndex
              let isCustom = false;
              let customIndex = -1;
              const sentenceTopic = sentence.category || '';
              
              if (currentTopic) {
                // Nếu có chọn topic, logic như cũ
                const customList = getCustomSentences()[currentLevel]?.[currentTopic] || [];
                isCustom = index >= (showDefault ? allSentences.length - customList.length : 0);
                customIndex = isCustom ? index - (showDefault ? allSentences.length - customList.length : 0) : -1;
              } else {
                // Nếu không chọn topic, kiểm tra xem câu này có phải custom không
                const custom = getCustomSentences()[currentLevel] || {};
                if (sentenceTopic && custom[sentenceTopic]) {
                  const topicCustomList = custom[sentenceTopic];
                  const foundIndex = topicCustomList.findIndex(
                    s => s.chinese === sentence.chinese && 
                         s.pinyin === sentence.pinyin && 
                         s.vietnamese === sentence.vietnamese
                  );
                  if (foundIndex !== -1) {
                    isCustom = true;
                    customIndex = foundIndex;
                  }
                }
              }
              
              return (
                <SentenceItem
                  key={`${sentence.chinese}-${index}-${sentenceTopic}`}
                  sentence={sentence}
                  isCustom={isCustom}
                  customIndex={customIndex}
                  sentenceTopic={sentenceTopic}
                  onEdit={(idx) => handleEdit(idx, sentenceTopic)}
                  onDelete={(idx) => handleDelete(idx, sentenceTopic)}
                  getTopicName={getTopicName}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize item component để tránh re-render không cần thiết
const SentenceItem = memo<{
  sentence: Sentence;
  isCustom: boolean;
  customIndex: number;
  sentenceTopic: string;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  getTopicName: (topic: string) => string;
}>(({ sentence, isCustom, customIndex, sentenceTopic, onEdit, onDelete, getTopicName }) => {
  return (
    <div className={`sentence-item ${isCustom ? 'custom' : 'default'}`}>
      <div className="sentence-content">
        <div className="sentence-chinese">{sentence.chinese}</div>
        <div className="sentence-pinyin">{sentence.pinyin}</div>
        <div className="sentence-meaning">{sentence.vietnamese}</div>
        {sentence.category && (
          <div className="sentence-category">
            <span className="category-badge">{getTopicName(sentence.category)}</span>
          </div>
        )}
      </div>
      {isCustom && (
        <div className="sentence-actions">
          <button
            onClick={() => onEdit(customIndex)}
            className="btn-edit"
            title="Sửa"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(customIndex)}
            className="btn-delete"
            title="Xóa"
          >
            🗑️
          </button>
        </div>
      )}
      {!isCustom && (
        <div className="sentence-badge">Mặc định</div>
      )}
    </div>
  );
});

SentenceItem.displayName = 'SentenceItem';

export default memo(SentenceManager);

