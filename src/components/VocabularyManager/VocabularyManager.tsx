import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Vocabulary } from '../../data/vocabulary';
import {
  getCustomVocabularies,
  addVocabulary,
  removeVocabulary,
  updateVocabulary,
  clearAllCustomVocabularies,
  clearAllVocabularies,
  exportVocabulariesForLevel,
  importCustomVocabulariesFromExcel,
  getVocabulariesForLevel
} from '../../utils/vocabularyStorage';
import './VocabularyManager.css';

interface VocabularyManagerProps {
  currentLevel: string;
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
  CheckCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  )
};

const VocabularyManager: React.FC<VocabularyManagerProps> = ({ currentLevel }) => {
  const [customVocab, setCustomVocab] = useState(getCustomVocabularies());
  const [allVocab, setAllVocab] = useState<Vocabulary[]>([]);
  const [formData, setFormData] = useState<Vocabulary>({
    chinese: '',
    pinyin: '',
    vietnamese: ''
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showDefault, setShowDefault] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 50;

  // Memoize danh sách từ vựng để tránh tính toán lại không cần thiết
  const allVocabMemo = useMemo(() => {
    if (showDefault) {
      return getVocabulariesForLevel(currentLevel);
    } else {
      return getCustomVocabularies()[currentLevel] || [];
    }
  }, [currentLevel, showDefault, customVocab]);

  useEffect(() => {
    setAllVocab(allVocabMemo);
    setCurrentPage(1); // Reset về trang 1 khi danh sách thay đổi
  }, [allVocabMemo]);

  // Listen for vocabulary updates
  useEffect(() => {
    const handleVocabUpdate = () => {
      setCustomVocab(getCustomVocabularies());
    };
    
    window.addEventListener('vocabUpdated', handleVocabUpdate);
    
    return () => {
      window.removeEventListener('vocabUpdated', handleVocabUpdate);
    };
  }, []);

  const handleInputChange = useCallback((field: keyof Vocabulary, value: string) => {
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

    if (editingIndex !== null) {
      // Cập nhật từ vựng
      updateVocabulary(currentLevel, editingIndex, formData);
      setEditingIndex(null);
    } else {
      // Thêm từ vựng mới
      addVocabulary(currentLevel, formData);
    }

    // Reset form
    setFormData({ chinese: '', pinyin: '', vietnamese: '' });
    setCustomVocab(getCustomVocabularies());
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('vocabUpdated'));
  }, [formData, editingIndex, currentLevel]);

  const handleEdit = useCallback((index: number) => {
    const customVocabList = getCustomVocabularies()[currentLevel] || [];
    if (customVocabList[index]) {
      setFormData(customVocabList[index]);
      setEditingIndex(index);
    }
  }, [currentLevel]);

  const handleDelete = useCallback((index: number) => {
    if (window.confirm('Bạn có chắc muốn xóa từ vựng này?')) {
      removeVocabulary(currentLevel, index);
      setCustomVocab(getCustomVocabularies());
      window.dispatchEvent(new Event('vocabUpdated'));
      if (editingIndex === index) {
        setEditingIndex(null);
        setFormData({ chinese: '', pinyin: '', vietnamese: '' });
      }
    }
  }, [currentLevel, editingIndex]);

  const handleClear = () => {
    if (window.confirm('Bạn có chắc muốn xóa TẤT CẢ từ vựng tự thêm? Hành động này không thể hoàn tác!')) {
      clearAllCustomVocabularies();
      setCustomVocab(getCustomVocabularies());
      window.dispatchEvent(new Event('vocabUpdated'));
      setEditingIndex(null);
      setFormData({ chinese: '', pinyin: '', vietnamese: '' });
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc muốn xóa TẤT CẢ từ vựng tự thêm và từ đã chỉnh sửa?\n\nLưu ý: Từ mặc định (trong code) không thể xóa, chỉ có thể xóa:\n- Từ vựng tự thêm\n- Từ mặc định đã chỉnh sửa (sẽ trở về bản gốc)\n\nHành động này không thể hoàn tác!')) {
      try {
        clearAllVocabularies();
        const newCustomVocab = getCustomVocabularies();
        setCustomVocab(newCustomVocab);
        setEditingIndex(null);
        setFormData({ chinese: '', pinyin: '', vietnamese: '' });
        // Force re-render by dispatching event
        window.dispatchEvent(new Event('vocabUpdated'));
        // Force component update
        setTimeout(() => {
          setCustomVocab(getCustomVocabularies());
          alert('Đã xóa tất cả từ vựng tự thêm và từ đã chỉnh sửa!\n\nTừ mặc định vẫn hiển thị vì chúng được lưu trong code.');
        }, 100);
      } catch (error) {
        console.error('Error clearing all vocabularies:', error);
        alert('Lỗi khi xóa từ vựng! Vui lòng thử lại.');
      }
    }
  };

  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const handleExport = () => {
    // Export chỉ từ tự thêm của level hiện tại
    exportVocabulariesForLevel(currentLevel, false);
  };
  
  const handleExportAll = () => {
    // Export tất cả (default + custom) của level hiện tại
    exportVocabulariesForLevel(currentLevel, true);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const merge = importMode === 'merge';
    const result = await importCustomVocabulariesFromExcel(file, currentLevel, merge);
    
    if (result.success) {
      setCustomVocab(getCustomVocabularies());
      window.dispatchEvent(new Event('vocabUpdated'));
      alert(result.message);
    } else {
      alert(result.message || 'Import thất bại! Vui lòng kiểm tra định dạng file Excel.');
    }
    
    e.target.value = ''; // Reset input
  };

  const customVocabList = useMemo(() => {
    return getCustomVocabularies()[currentLevel] || [];
  }, [currentLevel, customVocab]);

  // Lọc từ vựng theo search query
  const filteredVocab = useMemo(() => {
    if (!searchQuery.trim()) {
      return allVocab;
    }
    const query = searchQuery.toLowerCase().trim();
    return allVocab.filter(vocab => 
      vocab.chinese.toLowerCase().includes(query) ||
      vocab.pinyin.toLowerCase().includes(query) ||
      vocab.vietnamese.toLowerCase().includes(query)
    );
  }, [allVocab, searchQuery]);

  // Tính toán pagination
  const totalPages = Math.ceil(filteredVocab.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVocab = filteredVocab.slice(startIndex, endIndex);

  return (
    <div className="vocabulary-manager">
      <div className="manager-header">
        <div className="manager-title-group">
          <Icons.CheckCircle />
          <h2>Quản lý từ vựng - {currentLevel.toUpperCase()}</h2>
        </div>
        
        <div className="header-actions">
          <div className="toggle-view">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={showDefault}
                onChange={(e) => setShowDefault(e.target.checked)}
              />
              <span className="checkmark"></span>
              Hiển thị từ vựng mặc định
            </label>
          </div>
          
          <div className="header-export-import">
            <div className="export-buttons-group">
              <button 
                onClick={handleExport} 
                className="btn-export-compact"
                title="Sao lưu chỉ từ vựng tự thêm"
              >
                <Icons.Download />
                <span className="btn-text">Sao lưu</span>
                <span className="btn-subtext">(Tự thêm)</span>
              </button>
              <button 
                onClick={handleExportAll} 
                className="btn-export-compact"
                title="Sao lưu tất cả từ vựng"
              >
                <Icons.Download />
                <span className="btn-text">Sao lưu</span>
                <span className="btn-subtext">(Tất cả)</span>
              </button>
            </div>
            
            <div className="import-compact-wrapper">
              <label className="btn-import-compact">
                <Icons.Upload />
                <span className="btn-text">Import Excel</span>
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
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  />
                  <span className="radio-mark"></span>
                  Gộp
                </label>
                <label className="radio-container mini">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                  />
                  <span className="radio-mark"></span>
                  Thay
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="add-vocab-form">
        <div className="form-header">
          {editingIndex !== null ? <Icons.Edit /> : <Icons.Plus />}
          <h3>{editingIndex !== null ? 'Sửa từ vựng' : 'Thêm từ vựng mới'}</h3>
        </div>
        
        <div className="form-hint">
          <div className="hint-icon">
            <Icons.CheckCircle />
          </div>
          <p>Bạn có thể thêm từ vựng tự động bằng cách sử dụng mục <strong>Dịch thuật</strong> ở menu bên trái. Sau khi dịch, click nút "📚 Thêm vào từ vựng" để thêm nhanh.</p>
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
                  placeholder="VD: 你好"
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
                  placeholder="VD: nǐ hǎo"
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
                  placeholder="VD: xin chào"
                  required
                />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingIndex !== null ? (
                <>
                  <Icons.Save />
                  <span>Lưu thay đổi</span>
                </>
              ) : (
                <>
                  <Icons.Plus />
                  <span>Thêm từ vựng</span>
                </>
              )}
            </button>
            {editingIndex !== null && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingIndex(null);
                  setFormData({ chinese: '', pinyin: '', vietnamese: '' });
                }}
              >
                <Icons.X />
                <span>Hủy</span>
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="vocab-list-section">
        <div className="list-header">
          <div className="list-title-group">
            <Icons.CheckCircle />
            <h3>
              Danh sách từ vựng 
              <span className="count-badge">
                {filteredVocab.length} từ ({customVocabList.length} tự thêm)
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
                  title="Xóa tìm kiếm"
                >
                  <Icons.X />
                </button>
              )}
            </div>
            
            <div className="list-header-buttons">
              {customVocabList.length > 0 && (
                <button onClick={handleClear} className="btn-danger">
                  <Icons.Trash />
                  <span>Xóa từ tự thêm</span>
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  handleClearAll();
                }}
                className="btn-danger"
                title="Xóa tất cả từ vựng tự thêm và đã chỉnh sửa"
              >
                <Icons.Trash />
                <span>Xóa trắng</span>
              </button>
            </div>
          </div>
        </div>

        {filteredVocab.length === 0 ? (
          <div className="empty-message">
            <div className="empty-icon">📂</div>
            <p>
              {searchQuery 
                ? `Không tìm thấy từ vựng nào với từ khóa "${searchQuery}"` 
                : 'Chưa có từ vựng nào. Hãy thêm từ vựng mới!'}
            </p>
          </div>
        ) : (
          <>
            <div className="vocab-list">
              {paginatedVocab.map((vocab, localIndex) => {
                const index = startIndex + localIndex;
                const originalIndex = allVocab.findIndex(
                  v => v.chinese === vocab.chinese && 
                       v.pinyin === vocab.pinyin && 
                       v.vietnamese === vocab.vietnamese
                );
                const isCustom = originalIndex >= (showDefault ? allVocab.length - customVocabList.length : 0);
                const customIndex = isCustom ? originalIndex - (showDefault ? allVocab.length - customVocabList.length : 0) : -1;
                
                return (
                  <VocabItem
                    key={`${vocab.chinese}-${index}`}
                    vocab={vocab}
                    isCustom={isCustom}
                    customIndex={customIndex}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
                  <Icons.X /> <span>Trang trước</span>
                </button>
                <div className="pagination-info">
                  <span className="current-page">{currentPage}</span>
                  <span className="separator">/</span>
                  <span className="total-pages">{totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  <span>Trang sau</span> <Icons.X />
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
const VocabItem = memo<{
  vocab: Vocabulary;
  isCustom: boolean;
  customIndex: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}>(({ vocab, isCustom, customIndex, onEdit, onDelete }) => {
  return (
    <div className={`vocab-item ${isCustom ? 'custom' : 'default'}`}>
      <div className="vocab-content">
        <div className="vocab-chinese">{vocab.chinese}</div>
        <div className="vocab-pinyin">{vocab.pinyin}</div>
        <div className="vocab-meaning">{vocab.vietnamese}</div>
      </div>
      {isCustom && (
        <div className="vocab-actions">
          <button
            onClick={() => onEdit(customIndex)}
            className="btn-edit"
            title="Sửa"
          >
            <Icons.Edit />
          </button>
          <button
            onClick={() => onDelete(customIndex)}
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

VocabItem.displayName = 'VocabItem';

export default memo(VocabularyManager);

