import React, { useState, useCallback, useEffect } from 'react';
import './Translate.css';
import { addVocabulary } from '../../utils/vocabularyStorage';
import { addSentence } from '../../utils/sentenceStorage';
import { pinyin } from 'pinyin-pro';
import { TRANSLATION_CACHE_KEY } from '../../config/translation';

type Language = 'zh' | 'vi' | 'en';

interface LanguageOption {
  code: Language;
  name: string;
}

interface TranslateProps {
  currentLevel?: string;
}

const languages: LanguageOption[] = [
  { code: 'zh', name: 'Tiếng Trung' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'Tiếng Anh' }
];

const topicOptions = [
  { value: 'office', label: 'Giao tiếp công sở' },
  { value: 'social', label: 'Giao tiếp xã hội' },
  { value: 'school', label: 'Giao tiếp trường lớp' },
  { value: 'shopping', label: 'Giao tiếp mua bán' },
  { value: 'daily', label: 'Giao tiếp hàng ngày' },
  { value: 'travel', label: 'Du lịch' },
  { value: 'food', label: 'Ẩm thực' },
  { value: 'health', label: 'Sức khỏe' }
];

interface CustomDropdownProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: any) => void;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    if (isOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`custom-dropdown ${className} ${isOpen ? 'is-open' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOption?.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      {isOpen && (
        <div className="dropdown-menu">
          {options.map(opt => (
            <div 
              key={opt.value} 
              className={`dropdown-item ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Translate: React.FC<TranslateProps> = ({ currentLevel = 'hsk1' }) => {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLang, setSourceLang] = useState<Language>('vi');
  const [targetLang, setTargetLang] = useState<Language>('zh');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'vocab' | 'sentence' | null>(null);
  const [pinyinInput, setPinyinInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('daily');
  const [isLoadingPinyin, setIsLoadingPinyin] = useState(false);
  const [autoPinyin, setAutoPinyin] = useState<string>('');
  const [pendingChinese, setPendingChinese] = useState<string>('');

  // Cache helpers
  const getCache = useCallback((): Record<string, string> => {
    try {
      const cached = localStorage.getItem(TRANSLATION_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }, []);

  const saveToCache = useCallback((key: string, value: string) => {
    setTimeout(() => {
      try {
        const cache = getCache();
        cache[key] = value;
        const entries = Object.entries(cache);
        const cacheString = JSON.stringify(cache);
        const cacheSize = new Blob([cacheString]).size;
        if (entries.length > 1000 || cacheSize > 1.5 * 1024 * 1024) {
          const keepCount = Math.floor(entries.length * 0.7);
          const newCache: Record<string, string> = {};
          entries.slice(-keepCount).forEach(([k, v]) => { newCache[k] = v; });
          localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(newCache));
        } else {
          localStorage.setItem(TRANSLATION_CACHE_KEY, cacheString);
        }
      } catch {
        try {
          const cache = getCache();
          cache[key] = value;
          const entries = Object.entries(cache);
          const newCache: Record<string, string> = {};
          entries.slice(-500).forEach(([k, v]) => { newCache[k] = v; });
          localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(newCache));
        } catch {}
      }
    }, 100);
  }, [getCache]);

  // Lấy pinyin từ chữ Hán
  const getPinyinFromChinese = useCallback(async (chinese: string): Promise<string> => {
    if (!chinese || !/[\u4e00-\u9fff]/.test(chinese)) return '';
    setIsLoadingPinyin(true);
    
    try {
      const pinyinResult: any = pinyin(chinese, { toneType: 'symbol', type: 'all', multiple: false });
      let cleanPinyin = '';
      if (Array.isArray(pinyinResult)) {
        const parts: string[] = pinyinResult
          .map((item: any) => {
            if (typeof item === 'string') return item.replace(/[\u4e00-\u9fff]/g, '').trim();
            if (item?.pinyin) return item.pinyin;
            return '';
          })
          .filter((p: string) => p && /[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(p));
        cleanPinyin = parts.join(' ').trim();
      } else if (typeof pinyinResult === 'string') {
        cleanPinyin = pinyinResult.replace(/[\u4e00-\u9fff]/g, '').replace(/[^\w\sāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, ' ').replace(/\s+/g, ' ').trim();
      }
      if (cleanPinyin && /[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(cleanPinyin)) {
        setIsLoadingPinyin(false);
        return cleanPinyin;
      }
    } catch {}

    // Fallback Google Translate romanization
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh&tl=en&dt=t&dt=rm&q=${encodeURIComponent(chinese)}`, { method: 'GET', mode: 'cors' });
      if (res.ok) {
        const data = await res.json();
        if (data?.[1] && Array.isArray(data[1])) {
          const parts: string[] = [];
          for (const item of data[1]) {
            if (item?.[0]) parts.push(item[0]);
          }
          if (parts.length > 0) {
            setIsLoadingPinyin(false);
            return parts.join(' ').trim();
          }
        }
      }
    } catch {}

    setIsLoadingPinyin(false);
    return '';
  }, []);

  // Auto pinyin when modal opens
  useEffect(() => {
    if (showAddModal && pendingChinese && !pinyinInput) {
      getPinyinFromChinese(pendingChinese).then(p => { if (p) setPinyinInput(p); setPendingChinese(''); });
    }
  }, [showAddModal, pendingChinese, pinyinInput, getPinyinFromChinese]);

  // Dịch bằng Google Translate
  const translateText = useCallback(async () => {
    if (!sourceText.trim()) {
      setTargetText('');
      return;
    }

    setIsTranslating(true);
    setError(null);

    const sl = sourceLang === 'zh' ? 'zh' : sourceLang === 'vi' ? 'vi' : 'en';
    const tl = targetLang === 'zh' ? 'zh' : targetLang === 'vi' ? 'vi' : 'en';
    const cacheKey = `${sl}|${tl}|${sourceText.trim()}`;

    // Check cache
    const cache = getCache();
    if (cache[cacheKey]) {
      setTargetText(cache[cacheKey]);
      if (targetLang === 'zh' && /[\u4e00-\u9fff]/.test(cache[cacheKey])) {
        getPinyinFromChinese(cache[cacheKey]).then(p => { if (p) setAutoPinyin(p); }).catch(() => {});
      } else {
        setAutoPinyin('');
      }
      setIsTranslating(false);
      return;
    }

    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(sourceText)}`,
        { method: 'GET', mode: 'cors' }
      );

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const data = await res.json();
      if (data?.[0] && Array.isArray(data[0])) {
        const translated = data[0]
          .map((item: any[]) => item?.[0] || '')
          .filter((text: string) => text)
          .join('');
        const result = translated.trim();
        if (result) {
          setTargetText(result);
          saveToCache(cacheKey, result);
          if (targetLang === 'zh' && /[\u4e00-\u9fff]/.test(result)) {
            getPinyinFromChinese(result).then(p => { if (p) setAutoPinyin(p); }).catch(() => {});
          } else {
            setAutoPinyin('');
          }
          setIsTranslating(false);
          return;
        }
      }
      throw new Error('Không thể dịch văn bản này');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Lỗi khi dịch');
      setTargetText('');
    } finally {
      setIsTranslating(false);
    }
  }, [sourceText, sourceLang, targetLang, getPinyinFromChinese, getCache, saveToCache]);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleClear = () => {
    setSourceText('');
    setTargetText('');
    setError(null);
    setAutoPinyin('');
    setShowAddModal(false);
    setAddType(null);
    setPinyinInput('');
  };

  const handleClearCache = () => {
    if (window.confirm('Bạn có chắc muốn xóa cache dịch thuật?')) {
      try {
        localStorage.removeItem(TRANSLATION_CACHE_KEY);
        alert('Đã xóa cache dịch thuật!');
      } catch {
        alert('Không thể xóa cache');
      }
    }
  };

  const openAddModal = (type: 'vocab' | 'sentence') => {
    if (!targetText.trim() || !sourceText.trim()) {
      alert('Vui lòng dịch văn bản trước');
      return;
    }
    const hasChinese = sourceLang === 'zh' || targetLang === 'zh';
    if (!hasChinese) {
      alert('Chỉ có thể thêm từ vựng/câu tiếng Trung');
      return;
    }

    const chineseText = sourceLang === 'zh' ? sourceText : targetText;
    const expectedChinese = sourceLang === 'zh' ? sourceText.trim() : targetText.trim();

    if (autoPinyin && chineseText.trim() === expectedChinese) {
      setPinyinInput(autoPinyin);
      setAddType(type);
      setTimeout(() => setShowAddModal(true), 0);
    } else {
      setPinyinInput('');
      setPendingChinese(chineseText);
      setAddType(type);
      setShowAddModal(true);
    }
  };

  const handleConfirmAdd = () => {
    if (!targetText.trim() || !sourceText.trim()) return;
    if (!pinyinInput.trim()) {
      alert('Vui lòng nhập pinyin');
      return;
    }

    let chinese: string, vietnamese: string;
    if (sourceLang === 'zh') {
      chinese = sourceText.trim();
      vietnamese = targetText.trim();
    } else if (targetLang === 'zh') {
      chinese = targetText.trim();
      vietnamese = sourceText.trim();
    } else {
      alert('Cần có tiếng Trung trong bản dịch');
      return;
    }

    if (addType === 'vocab') {
      addVocabulary(currentLevel, { chinese, pinyin: pinyinInput.trim(), vietnamese });
      window.dispatchEvent(new Event('vocabUpdated'));
      alert('Đã thêm vào từ vựng!');
    } else {
      addSentence(currentLevel, selectedTopic, { chinese, pinyin: pinyinInput.trim(), vietnamese, category: selectedTopic });
      window.dispatchEvent(new Event('sentencesUpdated'));
      alert('Đã thêm vào câu!');
    }
    setShowAddModal(false);
    setAddType(null);
    setPinyinInput('');
  };

  return (
    <div className="translate-container">
      <div className="translate-header">
        <div className="title-group">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <h2>Dịch thuật</h2>
        </div>
        <div className="translate-actions">
          <button onClick={handleClearCache} className="btn-clear-cache-glass" title="Xóa cache dịch thuật">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
            <span>Xóa cache</span>
          </button>
          <button onClick={handleClear} className="btn-clear-glass" title="Xóa tất cả">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            <span>Xóa</span>
          </button>
        </div>
      </div>

      <div className="translate-content">
        <div className="language-selectors">
          <div className="language-selector">
            <label>Từ:</label>
            <CustomDropdown value={sourceLang} onChange={setSourceLang} options={languages.map(l => ({ value: l.code, label: l.name }))} className="lang-dropdown" />
          </div>
          <button onClick={handleSwapLanguages} className="btn-swap" title="Đổi ngôn ngữ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4-4 4-4"/><path d="M3 17h18"/><path d="m17 3 4 4-4 4"/><path d="M21 7H3"/></svg>
          </button>
          <div className="language-selector">
            <label>Sang:</label>
            <CustomDropdown value={targetLang} onChange={setTargetLang} options={languages.map(l => ({ value: l.code, label: l.name }))} className="lang-dropdown" />
          </div>
        </div>

        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', opacity: 0.6 }}>
          Sử dụng Google Translate
        </div>

        <div className="translate-boxes" style={{ marginTop: '20px' }}>
          <div className="translate-box source-box">
            <div className="box-header">
              <span className="box-label">{languages.find(l => l.code === sourceLang)?.name}</span>
              {sourceText && (
                <button onClick={() => handleCopy(sourceText)} className="btn-copy-glass" title="Sao chép">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              )}
            </div>
            <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Nhập văn bản cần dịch..." className="translate-input" rows={10} />
            <div className="char-count">{sourceText.length} ký tự</div>
          </div>

          <div className="translate-box target-box">
            <div className="box-header">
              <span className="box-label">{languages.find(l => l.code === targetLang)?.name}</span>
              {targetText && (
                <button onClick={() => handleCopy(targetText)} className="btn-copy-glass" title="Sao chép">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              )}
            </div>
            <div className="translate-output">
              {isTranslating ? (
                <div className="translating-indicator"><span className="spinner">⏳</span><span>Đang dịch...</span></div>
              ) : error ? (
                <div className="error-message">⚠️ {error}</div>
              ) : targetText ? (
                <div className="translated-text">{targetText}</div>
              ) : (
                <div className="placeholder-text">Kết quả dịch sẽ hiển thị ở đây...</div>
              )}
            </div>
          </div>
        </div>

        <div className="translate-button-container">
          <button onClick={translateText} disabled={!sourceText.trim() || isTranslating} className="btn-translate">
            {isTranslating ? '⏳ Đang dịch...' : '🚀 Dịch'}
          </button>
        </div>

        {targetText && !isTranslating && !error && (
          <div className="add-to-list-container">
            <button onClick={() => openAddModal('vocab')} className="btn-add-to-vocab" title="Thêm vào từ vựng">📚 Thêm vào từ vựng</button>
            <button onClick={() => openAddModal('sentence')} className="btn-add-to-sentence" title="Thêm vào câu">💬 Thêm vào câu</button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{addType === 'vocab' ? '📚 Thêm vào từ vựng' : '💬 Thêm vào câu'}</h3>
              <button className="btn-clear-glass" style={{ padding: '8px', minWidth: 'auto', borderRadius: '50%' }} onClick={() => setShowAddModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-preview-card" style={{ background: 'rgba(0,0,0,0.03)', padding: '20px', borderRadius: 'var(--apple-radius-lg)', marginBottom: '24px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Chữ Hán</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '4px' }}>{sourceLang === 'zh' ? sourceText : targetText}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Nghĩa Việt</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '4px' }}>{sourceLang === 'zh' ? targetText : sourceText}</div>
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Pinyin {isLoadingPinyin && <span className="spinner-small" style={{ marginLeft: '8px' }}>⏳</span>}</label>
                <input type="text" value={pinyinInput} onChange={(e) => setPinyinInput(e.target.value)} placeholder={isLoadingPinyin ? "Đang lấy pinyin tự động..." : "VD: nǐ hǎo"} disabled={isLoadingPinyin} className="translate-input-compact" />
              </div>
              {addType === 'sentence' && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Chủ đề</label>
                  <CustomDropdown options={topicOptions} value={selectedTopic} onChange={setSelectedTopic} className="topic-selector-dropdown" />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="btn-modal-cancel">Hủy</button>
              <button onClick={handleConfirmAdd} className="btn-modal-confirm" disabled={!pinyinInput.trim() || isLoadingPinyin}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Translate;