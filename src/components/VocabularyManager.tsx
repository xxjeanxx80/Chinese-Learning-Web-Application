import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Vocabulary } from '../data/vocabulary';
import {
  getCustomVocabularies,
  addVocabulary,
  removeVocabulary,
  updateVocabulary,
  clearAllCustomVocabularies,
  exportCustomVocabularies,
  importCustomVocabulariesFromExcel,
  getVocabulariesForLevel
} from '../utils/vocabularyStorage';
import './VocabularyManager.css';

interface VocabularyManagerProps {
  currentLevel: string;
}

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
  }, [allVocabMemo]);

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

  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const handleExport = () => {
    exportCustomVocabularies();
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

  const customVocabList = getCustomVocabularies()[currentLevel] || [];

  return (
    <div className="vocabulary-manager">
      <div className="manager-header">
        <h2>📝 Quản lý từ vựng - {currentLevel.toUpperCase()}</h2>
        <div className="toggle-view">
          <label>
            <input
              type="checkbox"
              checked={showDefault}
              onChange={(e) => setShowDefault(e.target.checked)}
            />
            Hiển thị từ vựng mặc định
          </label>
        </div>
      </div>

      <div className="add-vocab-form">
        <h3>{editingIndex !== null ? '✏️ Sửa từ vựng' : '➕ Thêm từ vựng mới'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Chữ Hán:</label>
              <input
                type="text"
                value={formData.chinese}
                onChange={(e) => handleInputChange('chinese', e.target.value)}
                placeholder="VD: 你好"
                required
              />
            </div>
            <div className="form-group">
              <label>Pinyin:</label>
              <input
                type="text"
                value={formData.pinyin}
                onChange={(e) => handleInputChange('pinyin', e.target.value)}
                placeholder="VD: nǐ hǎo"
                required
              />
            </div>
            <div className="form-group">
              <label>Nghĩa tiếng Việt:</label>
              <input
                type="text"
                value={formData.vietnamese}
                onChange={(e) => handleInputChange('vietnamese', e.target.value)}
                placeholder="VD: xin chào"
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingIndex !== null ? '💾 Lưu thay đổi' : '➕ Thêm từ vựng'}
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
                ❌ Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="vocab-list-section">
        <div className="list-header">
          <h3>
            📚 Danh sách từ vựng 
            ({allVocab.length} từ - {customVocabList.length} từ tự thêm)
          </h3>
          <div className="list-actions">
            <div className="export-section">
              <h4 className="export-title">📥 Sao lưu (Backup)</h4>
              <div className="export-buttons">
                <button onClick={handleExport} className="btn-export">
                  📊 Excel - Từ tự thêm
                </button>
              </div>
              <p className="export-note">
                Format: A1=Chữ Hán, B1=Pinyin, C1=Nghĩa tiếng Việt
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
                Format: A1=Chữ Hán, B1=Pinyin, C1=Nghĩa tiếng Việt<br/>
                Mỗi dòng là 1 từ vựng
              </p>
            </div>
            {customVocabList.length > 0 && (
              <button onClick={handleClear} className="btn-danger">
                🗑️ Xóa tất cả từ tự thêm
              </button>
            )}
          </div>
        </div>

        {allVocab.length === 0 ? (
          <div className="empty-message">
            <p>Chưa có từ vựng nào. Hãy thêm từ vựng mới!</p>
          </div>
        ) : (
          <div className="vocab-list">
            {allVocab.map((vocab, index) => {
              const isCustom = index >= (showDefault ? allVocab.length - customVocabList.length : 0);
              const customIndex = isCustom ? index - (showDefault ? allVocab.length - customVocabList.length : 0) : -1;
              
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
        <div className="vocab-badge">Mặc định</div>
      )}
    </div>
  );
});

VocabItem.displayName = 'VocabItem';

export default memo(VocabularyManager);

