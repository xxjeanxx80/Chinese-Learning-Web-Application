import React, { useState, useEffect } from 'react';
import { Vocabulary } from '../data/vocabulary';
import {
  getCustomVocabularies,
  addVocabulary,
  removeVocabulary,
  updateVocabulary,
  clearAllCustomVocabularies,
  exportCustomVocabularies,
  exportToExcelCustom,
  importCustomVocabularies,
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

  useEffect(() => {
    updateVocabList();
  }, [currentLevel, showDefault, customVocab]);

  const updateVocabList = () => {
    if (showDefault) {
      setAllVocab(getVocabulariesForLevel(currentLevel));
    } else {
      setAllVocab(getCustomVocabularies()[currentLevel] || []);
    }
  };

  const handleInputChange = (field: keyof Vocabulary, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
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
  };

  const handleEdit = (index: number) => {
    const customVocabList = getCustomVocabularies()[currentLevel] || [];
    if (customVocabList[index]) {
      setFormData(customVocabList[index]);
      setEditingIndex(index);
    }
  };

  const handleDelete = (index: number) => {
    if (window.confirm('Bạn có chắc muốn xóa từ vựng này?')) {
      removeVocabulary(currentLevel, index);
      setCustomVocab(getCustomVocabularies());
      window.dispatchEvent(new Event('vocabUpdated'));
      if (editingIndex === index) {
        setEditingIndex(null);
        setFormData({ chinese: '', pinyin: '', vietnamese: '' });
      }
    }
  };

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
    const data = exportCustomVocabularies();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hsk-custom-vocabularies-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const merge = importMode === 'merge';
      const result = importCustomVocabularies(content, merge);
      
      if (result.success) {
        setCustomVocab(getCustomVocabularies());
        window.dispatchEvent(new Event('vocabUpdated'));
        alert(result.message);
      } else {
        alert(result.message || 'Import thất bại! Vui lòng kiểm tra định dạng file JSON.');
      }
    };
    reader.readAsText(file);
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
                  💾 JSON - Từ tự thêm
                </button>
              </div>
            </div>
            <div className="export-section">
              <h4 className="export-title">📊 Xuất Excel</h4>
              <div className="export-excel-buttons">
                <button onClick={() => exportToExcelCustom()} className="btn-excel-custom">
                  📗 Excel - Từ tự thêm
                </button>
              </div>
            </div>
            <div className="import-section">
              <label className="btn-import">
                📤 Import JSON
                <input
                  type="file"
                  accept=".json"
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
                <div key={index} className={`vocab-item ${isCustom ? 'custom' : 'default'}`}>
                  <div className="vocab-content">
                    <div className="vocab-chinese">{vocab.chinese}</div>
                    <div className="vocab-pinyin">{vocab.pinyin}</div>
                    <div className="vocab-meaning">{vocab.vietnamese}</div>
                  </div>
                  {isCustom && (
                    <div className="vocab-actions">
                      <button
                        onClick={() => handleEdit(customIndex)}
                        className="btn-edit"
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(customIndex)}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyManager;

