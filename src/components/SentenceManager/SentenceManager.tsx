import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Sentence } from '../../data/sentences';
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
} from '../../utils/sentenceStorage';
import './SentenceManager.css';

interface SentenceManagerProps {
  currentLevel: string;
  currentTopic: string;
  onTopicChange: (topic: string) => void;
}

// SVG Icons
const Icons = {
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  ),
  Save: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  ),
  X: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  Upload: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  MessageCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  ),
  Info: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
  BookOpen: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  )
};

const SentenceManager: React.FC<SentenceManagerProps> = ({ currentLevel, currentTopic, onTopicChange }) => {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 50;

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
    setCurrentPage(1); // Reset về trang 1 khi danh sách thay đổi
  }, [allSentencesMemo]);

  // Lọc câu theo search query
  const filteredSentences = useMemo(() => {
    if (!searchQuery.trim()) {
      return allSentences;
    }
    const query = searchQuery.toLowerCase().trim();
    return allSentences.filter(sentence => 
      sentence.chinese.toLowerCase().includes(query) ||
      sentence.pinyin.toLowerCase().includes(query) ||
      sentence.vietnamese.toLowerCase().includes(query) ||
      (sentence.category && sentence.category.toLowerCase().includes(query))
    );
  }, [allSentences, searchQuery]);

  // Tính toán pagination
  const totalPages = Math.ceil(filteredSentences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSentences = filteredSentences.slice(startIndex, endIndex);

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
      
    }

    // Reset form
    setFormData({ chinese: '', pinyin: '', vietnamese: '', category: currentTopic || '' });
    setCustomSentences(getCustomSentences());
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('sentencesUpdated'));
    
    // Nếu category khác với currentTopic, tự động chuyển sang topic đó để hiển thị câu vừa thêm
    if (topic !== currentTopic) {
      onTopicChange(topic);
    }
  }, [formData, editingIndex, editingTopic, currentLevel, currentTopic, onTopicChange]);

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
        onTopicChange(editTopic);
      }
    }
  }, [currentLevel, currentTopic, onTopicChange]);

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
  const customSentenceCount = useMemo(() => {
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
        <div className="manager-title-group">
          <Icons.MessageCircle />
          <h2>Quản lý câu - {currentLevel.toUpperCase()}</h2>
        </div>
        <div className="header-actions">
          <div className="toggle-view">
            <label className="checkbox-container">
              Dòng mặc định
              <input
                type="checkbox"
                checked={showDefault}
                onChange={(e) => setShowDefault(e.target.checked)}
              />
              <span className="checkmark"></span>
            </label>
          </div>
          <div className="header-export-import">
            <button 
              onClick={handleExport} 
              className="btn-export-compact"
              title="Sao lưu vào Excel"
            >
              <Icons.Download />
              <span className="btn-text">Xuất Excel</span>
            </button>
            <div className="import-compact-wrapper">
              <label className="btn-import-compact" title="Nhập từ Excel">
                <Icons.Upload />
                <span className="btn-text">Nhập Excel</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </label>
              <div className="import-mode-compact">
                <label className="radio-container mini">
                  <input
                    type="radio"
                    name="sentenceImportMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  />
                  <span className="radio-mark"></span>
                  <span>Gộp</span>
                </label>
                <label className="radio-container mini">
                  <input
                    type="radio"
                    name="sentenceImportMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  />
                  <span className="radio-mark"></span>
                  <span>Thay</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="add-sentence-form">
        <div className="form-header">
          {editingIndex !== null ? <Icons.Edit /> : <Icons.Plus />}
          <h3>{editingIndex !== null ? 'Sửa câu' : 'Thêm câu mới'}</h3>
        </div>
        <div className="form-hint">
          <div className="hint-icon">
            <Icons.Info />
          </div>
          <p>Bạn có thể thêm câu tự động bằng cách sử dụng mục <strong>Dịch thuật</strong> ở menu bên trái. Sau khi dịch, click nút "Thêm vào câu" để thêm nhanh.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Chữ Hán:</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={formData.chinese}
                  onChange={(e) => handleInputChange('chinese', e.target.value)}
                  placeholder="VD: 你好，我是新来的员工。"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Pinyin:</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={formData.pinyin}
                  onChange={(e) => handleInputChange('pinyin', e.target.value)}
                  placeholder="VD: nǐ hǎo, wǒ shì xīn lái de yuán gōng"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Nghĩa tiếng Việt:</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={formData.vietnamese}
                  onChange={(e) => handleInputChange('vietnamese', e.target.value)}
                  placeholder="VD: Xin chào, tôi là nhân viên mới."
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Chủ đề (Category):</label>
              <div className="input-wrapper">
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
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingIndex !== null ? <Icons.Save /> : <Icons.Plus />}
              <span>{editingIndex !== null ? 'Lưu thay đổi' : 'Thêm câu'}</span>
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
                <Icons.X />
                <span>Hủy</span>
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="sentence-list-section">
        <div className="list-header">
          <div className="list-title-group">
            <Icons.BookOpen />
            <h3>
              Danh sách câu
              <span className="count-badge">
                {filteredSentences.length} câu ({customSentenceCount} tự thêm)
              </span>
            </h3>
          </div>
          <div className="list-header-actions">
            <div className="search-box">
              <div className="search-icon">
                <Icons.Search />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm chữ Hán, pinyin, nghĩa..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="btn-clear-search"
                >
                  <Icons.X />
                </button>
              )}
            </div>
            <div className="list-header-buttons">
              {customSentenceCount > 0 && (
                <button onClick={handleClear} className="btn-danger">
                  <Icons.Trash />
                  <span>Xóa hết câu tự thêm</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredSentences.length === 0 ? (
          <div className="empty-message">
            <div className="empty-icon">
              <Icons.Search />
            </div>
            <p>
              {searchQuery 
                ? `Không tìm thấy câu nào với từ khóa "${searchQuery}"` 
                : 'Chưa có câu nào trong danh sách này.'}
            </p>
          </div>
        ) : (
          <>
            <div className="sentence-list">
              {paginatedSentences.map((sentence, localIndex) => {
                const index = startIndex + localIndex;
                let isCustom = false;
                let customIndex = -1;
                const sentenceTopic = sentence.category || '';
                
                if (currentTopic) {
                  const customList = getCustomSentences()[currentLevel]?.[currentTopic] || [];
                  const originalIndex = allSentences.findIndex(
                    s => s.chinese === sentence.chinese && 
                         s.pinyin === sentence.pinyin && 
                         s.vietnamese === sentence.vietnamese
                  );
                  if (originalIndex !== -1) {
                    isCustom = originalIndex >= (showDefault ? allSentences.length - customList.length : 0);
                    customIndex = isCustom ? originalIndex - (showDefault ? allSentences.length - customList.length : 0) : -1;
                  }
                } else {
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
                    localIndex={customIndex}
                    onEdit={(idx) => handleEdit(idx, sentenceTopic)}
                    onDelete={(idx) => handleDelete(idx, sentenceTopic)}
                    getTopicName={getTopicName}
                  />
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  <Icons.X />
                  <span>Trước</span>
                </button>
                <div className="pagination-info">
                  <span className="current-page">{currentPage}</span>
                  <span className="separator">/</span>
                  <span>{totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  <span>Sau</span>
                  <Icons.X />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Memoize item component để tránh re-render không cần thiết
const SentenceItem = memo<{
  sentence: Sentence;
  isCustom: boolean;
  localIndex: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  getTopicName: (topic: string) => string;
}>(({ sentence, isCustom, localIndex, onEdit, onDelete, getTopicName }) => {
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
      {isCustom && (localIndex !== -1) && (
        <div className="sentence-actions">
          <button
            onClick={() => onEdit(localIndex)}
            className="btn-edit"
            title="Sửa"
          >
            <Icons.Edit />
          </button>
          <button
            onClick={() => onDelete(localIndex)}
            className="btn-delete"
            title="Xóa"
          >
            <Icons.Trash />
          </button>
        </div>
      )}
    </div>
  );
});

SentenceItem.displayName = 'SentenceItem';

export default memo(SentenceManager);

