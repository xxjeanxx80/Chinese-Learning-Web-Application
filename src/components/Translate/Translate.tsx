import React, { useState, useCallback, useEffect } from 'react';
import './Translate.css';
import { addVocabulary } from '../../utils/vocabularyStorage';
import { addSentence } from '../../utils/sentenceStorage';
import { Vocabulary } from '../../data/vocabulary';
import { Sentence } from '../../data/sentences';
import { pinyin } from 'pinyin-pro';
import {
  DEEPL_PROXY_URL,
  DEEPL_LANG_MAP,
  TRANSLATION_PROVIDER_KEY,
  TRANSLATION_PROVIDERS,
  type TranslationProvider
} from '../../config/translation';

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
  const [translationProvider, setTranslationProvider] = useState<TranslationProvider>(() => {
    try {
      const saved = localStorage.getItem(TRANSLATION_PROVIDER_KEY);
      if (saved === 'libre') return 'deepl';
      if (saved && ['auto', 'deepl', 'google'].includes(saved)) {
        return saved as TranslationProvider;
      }
    } catch (_) {}
    return 'auto';
  });

  useEffect(() => {
    try {
      localStorage.setItem(TRANSLATION_PROVIDER_KEY, translationProvider);
    } catch (_) {}
  }, [translationProvider]);

  // Ham lay cache
  const getCache = useCallback((): Record<string, string> => {
    try {
      const cached = localStorage.getItem('translationCache');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.log('Không thể load translation cache');
    }
    return {};
  }, []);

  // Lưu vào cache với debounce và giới hạn kích thước
  // Ước tính: mỗi entry ~100-200 bytes (key + value)
  // 5000 entries = ~500KB - 1MB (an toàn)
  // Giới hạn: 1000 entries HOẶC 1.5MB để đảm bảo không lag
  const saveToCache = useCallback((key: string, value: string) => {
    try {
      // Lưu bất đồng bộ để không block UI
      setTimeout(() => {
        try {
          const cache = getCache();
          cache[key] = value;
          
          const entries = Object.entries(cache);
          const cacheString = JSON.stringify(cache);
          const cacheSize = new Blob([cacheString]).size; // Kích thước tính bằng bytes
          
          // Giới hạn: 1000 entries HOẶC 1.5MB (an toàn cho localStorage)
          const maxEntries = 1000;
          const maxSize = 1.5 * 1024 * 1024; // 1.5MB
          
          if (entries.length > maxEntries || cacheSize > maxSize) {
            // Xóa 30% entries cũ nhất (giữ lại 70% mới nhất)
            const keepCount = Math.floor(entries.length * 0.7);
            const newCache: Record<string, string> = {};
            entries.slice(-keepCount).forEach(([k, v]) => {
              newCache[k] = v as string;
            });
            const newCacheString = JSON.stringify(newCache);
            localStorage.setItem('translationCache', newCacheString);
            console.log(`Cache đã được dọn dẹp: ${entries.length} -> ${keepCount} entries`);
          } else {
            localStorage.setItem('translationCache', cacheString);
          }
        } catch (err) {
          // Nếu lỗi (có thể do quá lớn), xóa cache cũ và lưu lại
          console.log('Cache quá lớn, đang dọn dẹp...');
          try {
            const cache = getCache();
            const entries = Object.entries(cache);
            // Chỉ giữ lại 500 entries mới nhất (an toàn)
            const newCache: Record<string, string> = {};
            entries.slice(-500).forEach(([k, v]) => {
              newCache[k] = v as string;
            });
            newCache[key] = value; // Thêm entry mới
            localStorage.setItem('translationCache', JSON.stringify(newCache));
            console.log(`Cache đã được dọn dẹp về 500 entries`);
          } catch (cleanupErr) {
            console.log('Không thể lưu translation cache');
          }
        }
      }, 100); // Debounce 100ms để tránh lưu quá nhiều lần
    } catch (err) {
      console.log('Không thể lưu translation cache');
    }
  }, [getCache]);

  // Hàm lấy pinyin từ chữ Hán - sử dụng thư viện pinyin-pro
  const getPinyinFromChinese = useCallback(async (chinese: string): Promise<string> => {
    if (!chinese || !/[\u4e00-\u9fff]/.test(chinese)) {
      console.log('Không có chữ Hán trong:', chinese);
      return '';
    }

    console.log('Bắt đầu lấy pinyin cho:', chinese);
    setIsLoadingPinyin(true);
    
    try {
      // Sử dụng thư viện pinyin-pro đã cài đặt
      // pinyin-pro với type: 'all' sẽ trả về AllData[] (mảng chứa object với origin, pinyin, etc.)
      const pinyinResult: any = pinyin(chinese, {
        toneType: 'symbol', // Có dấu thanh điệu: nǐ hǎo
        type: 'all', // Trả về AllData[]
        multiple: false,
      });

      console.log('pinyin-pro result (type: all):', pinyinResult);

      // Xử lý kết quả: pinyinResult có thể là AllData[] hoặc string
      let cleanPinyin: string = '';
      
      if (Array.isArray(pinyinResult)) {
        // Nếu là mảng AllData[], extract pinyin từ mỗi item
        const pinyinParts: string[] = pinyinResult
          .map((item: any) => {
            // item có thể là AllData object hoặc string
            if (typeof item === 'string') {
              // Nếu là string, loại bỏ chữ Hán
              return item.replace(/[\u4e00-\u9fff]/g, '').trim();
            } else if (item && typeof item === 'object' && item.pinyin) {
              // Nếu là AllData object, lấy property pinyin
              return item.pinyin || '';
            }
            return '';
          })
          .filter((p: string) => p && /[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(p));
        
        cleanPinyin = pinyinParts.join(' ').trim();
      } else if (pinyinResult && typeof pinyinResult === 'string') {
        // Nếu là string, loại bỏ chữ Hán
        const pinyinString: string = pinyinResult;
        cleanPinyin = pinyinString
          .replace(/[\u4e00-\u9fff]/g, '') // Loại bỏ chữ Hán
          .replace(/[^\w\sāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, ' ') // Loại bỏ ký tự đặc biệt
          .replace(/\s+/g, ' ') // Chuẩn hóa khoảng trắng
          .trim();
      }
      
      if (cleanPinyin && /[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(cleanPinyin)) {
        setIsLoadingPinyin(false);
        console.log('Pinyin result:', cleanPinyin);
        return cleanPinyin;
      }
    } catch (err) {
      console.log('Lỗi khi lấy pinyin từ pinyin-pro:', err);
    }

    // Fallback: thử Google Translate API nếu thư viện không hoạt động
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh&tl=en&dt=t&dt=rm&q=${encodeURIComponent(chinese)}`,
        {
          method: 'GET',
          mode: 'cors',
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Thử lấy từ data[1] (romanization)
        if (data && Array.isArray(data) && data[1] && Array.isArray(data[1])) {
          const pinyinParts: string[] = [];
          for (const item of data[1]) {
            if (item && Array.isArray(item) && item[0]) {
              pinyinParts.push(item[0]);
            }
          }
          if (pinyinParts.length > 0) {
            const pinyinResult = pinyinParts.join(' ').trim();
            if (pinyinResult) {
              setIsLoadingPinyin(false);
              return pinyinResult;
            }
          }
        }
      }
    } catch (err) {
      console.log('Không thể lấy pinyin từ Google Translate');
    }

    setIsLoadingPinyin(false);
    return '';
  }, []);

  // Khi modal mở và có pendingChinese, tự động lấy pinyin
  useEffect(() => {
    if (showAddModal && pendingChinese && !pinyinInput) {
      console.log('useEffect: Lấy pinyin cho pendingChinese:', pendingChinese);
      getPinyinFromChinese(pendingChinese).then(pinyin => {
        if (pinyin) {
          console.log('useEffect: Đã lấy được pinyin:', pinyin);
          setPinyinInput(pinyin);
        }
        setPendingChinese('');
      });
    }
  }, [showAddModal, pendingChinese, pinyinInput, getPinyinFromChinese]);

  const translateText = useCallback(async () => {
    if (!sourceText.trim()) {
      setTargetText('');
      return;
    }

    setIsTranslating(true);
    setError(null);

    // Map language codes
    const langMap: Record<string, string> = {
      'zh': 'zh',
      'vi': 'vi',
      'en': 'en'
    };

    const sourceLangCode = langMap[sourceLang];
    const targetLangCode = langMap[targetLang];

    // Kiểm tra cache trước
    const cacheKey = `${sourceLangCode}|${targetLangCode}|${sourceText.trim()}`;
    const cache = getCache();
    if (cache[cacheKey]) {
      const cached = cache[cacheKey];
      setTargetText(cached);
      
      // Tự động lấy pinyin nếu kết quả là tiếng Trung
      if (targetLang === 'zh' && /[\u4e00-\u9fff]/.test(cached)) {
        getPinyinFromChinese(cached).then(pinyin => {
          if (pinyin) {
            setAutoPinyin(pinyin);
          }
        }).catch(() => {});
      } else {
        setAutoPinyin('');
      }
      
      setIsTranslating(false);
      return;
    }

    try {
      const translationPromises: Promise<string | null>[] = [];
      const provider = translationProvider;

      const addDeepL = () => {
        const deeplSource = DEEPL_LANG_MAP[sourceLangCode] || sourceLangCode.toUpperCase();
        const deeplTarget = DEEPL_LANG_MAP[targetLangCode] || targetLangCode.toUpperCase();
        translationPromises.push(
          fetch(DEEPL_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: sourceText.trim(),
              source_lang: deeplSource,
              target_lang: deeplTarget
            })
          })
            .then(async (res) => {
              const data = await res.json().catch(() => ({}));
              if (res.ok) {
                const translated = data?.translations?.[0]?.text?.trim();
                if (translated && translated !== sourceText.trim()) return translated;
              } else {
                throw new Error(data.note ? `${data.error}. ${data.note}` : (data.error || 'Lỗi DeepL API'));
              }
              throw new Error('Invalid response từ DeepL');
            })
            // Nếu auto thì ghim lỗi và trả về null để fallback, nếu là deepl thì quăng lỗi ra
            .catch((err) => {
              if (provider === 'deepl') throw err;
              return null;
            })
        );
      };

      const addGoogle = () => {
        translationPromises.push(
          fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLangCode}&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(sourceText)}`,
            { method: 'GET', mode: 'cors' }
          )
            .then(async (response) => {
              if (response.ok) {
                const data = await response.json();
                if (data && data[0] && Array.isArray(data[0])) {
                  const translated = data[0]
                    .map((item: any[]) => (item && item[0] ? item[0] : ''))
                    .filter((text: string) => text)
                    .join('');
                  if (translated && translated.trim()) return translated.trim();
                }
              }
              throw new Error('Invalid response');
            })
            .catch(() => null)
        );
      };

      if (provider === 'auto') {
        addDeepL();
        addGoogle();
      } else if (provider === 'deepl') {
        addDeepL();
      } else if (provider === 'google') {
        addGoogle();
      }

      const allPromises = translationPromises;
      const results = await Promise.allSettled(allPromises);
      
      // Tìm kết quả đầu tiên hợp lệ
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const translated = result.value;
          setTargetText(translated);
          
          // Lưu vào cache
          saveToCache(cacheKey, translated);
          
          // Tự động lấy pinyin nếu kết quả là tiếng Trung
          if (targetLang === 'zh' && /[\u4e00-\u9fff]/.test(translated)) {
            // Lấy pinyin trong background, không chặn UI
            getPinyinFromChinese(translated).then(pinyin => {
              if (pinyin) {
                setAutoPinyin(pinyin);
              }
            }).catch(() => {
              // Bỏ qua lỗi
            });
          } else {
            setAutoPinyin('');
          }
          
          setIsTranslating(false);
          return;
        }
      }

      // Nếu không có kết quả nào, throw error đầu tiên tìm thấy (nếu có)
      const rejectedPromise = results.find(r => r.status === 'rejected') as PromiseRejectedResult;
      if (rejectedPromise && rejectedPromise.reason) {
        throw new Error(rejectedPromise.reason.message || rejectedPromise.reason);
      }
      
      throw new Error('Không thể dịch văn bản này. Vui lòng thử lại.');
    } catch (err: any) {
      let msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi dịch';
      // Nếu Vite trả về HTML index yerine vì không tìm thấy đường dẫn /api
      if (msg.includes('Unexpected token') && msg.includes('<')) {
        msg = '⚠️ API DeepL yêu cầu Serverless Function. Tại máy cá nhân, hãy chạy lệnh "vercel dev" thay vì "npm run dev" để test, hoặc truy cập trên Vercel sau khi Deploy.';
      }
      setError(msg);
      setTargetText('');
    } finally {
      setIsTranslating(false);
    }
  }, [sourceText, sourceLang, targetLang, translationProvider]);

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
    setShowAddModal(false);
    setAddType(null);
    setPinyinInput('');
    setAutoPinyin('');
  };

  const handleClearCache = () => {
    if (window.confirm('Bạn có chắc muốn xóa cache dịch thuật? Điều này sẽ không ảnh hưởng đến từ vựng và câu đã lưu. Bạn sẽ cần dịch lại các câu đã dịch trước đó.')) {
      try {
        localStorage.removeItem('translationCache');
        alert('Đã xóa cache dịch thuật thành công!');
      } catch (err) {
        alert('Không thể xóa cache');
      }
    }
  };

  const handleAddToVocab = async () => {
    if (!targetText.trim() || !sourceText.trim()) {
      alert('Vui lòng dịch văn bản trước khi thêm vào từ vựng');
      return;
    }

    // Kiểm tra xem có tiếng Trung trong source hoặc target không
    const hasChinese = sourceLang === 'zh' || targetLang === 'zh';
    if (!hasChinese) {
      alert('Chỉ có thể thêm từ vựng tiếng Trung. Vui lòng dịch sang/ từ tiếng Trung.');
      return;
    }

    // Tự động lấy pinyin từ chữ Hán trước khi mở modal
    const chineseText = sourceLang === 'zh' ? sourceText : targetText;
    const expectedChinese = sourceLang === 'zh' ? sourceText.trim() : targetText.trim();
    
    console.log('handleAddToVocab - Checking autoPinyin:', { 
      autoPinyin, 
      chineseText: chineseText.trim(), 
      expectedChinese 
    });
    
    // Nếu đã có pinyin tự động, sử dụng luôn
    if (autoPinyin && chineseText.trim() === expectedChinese) {
      console.log('Sử dụng pinyin tự động:', autoPinyin);
      // Đảm bảo set state trước khi mở modal
      setPinyinInput(autoPinyin);
      setAddType('vocab');
      // Sử dụng setTimeout để đảm bảo state được update trước khi modal render
      setTimeout(() => {
        setShowAddModal(true);
      }, 0);
    } else {
      console.log('Lấy pinyin mới cho:', chineseText);
      setPinyinInput(''); // Reset trước
      setPendingChinese(chineseText); // Set pending để useEffect xử lý
      setAddType('vocab');
      setShowAddModal(true);
    }
  };

  const handleAddToSentence = async () => {
    if (!targetText.trim() || !sourceText.trim()) {
      alert('Vui lòng dịch văn bản trước khi thêm vào câu');
      return;
    }

    // Kiểm tra xem có tiếng Trung trong source hoặc target không
    const hasChinese = sourceLang === 'zh' || targetLang === 'zh';
    if (!hasChinese) {
      alert('Chỉ có thể thêm câu tiếng Trung. Vui lòng dịch sang/ từ tiếng Trung.');
      return;
    }

    // Tự động lấy pinyin từ chữ Hán trước khi mở modal
    const chineseText = sourceLang === 'zh' ? sourceText : targetText;
    const expectedChinese = sourceLang === 'zh' ? sourceText.trim() : targetText.trim();
    
    console.log('handleAddToSentence - Checking autoPinyin:', { 
      autoPinyin, 
      chineseText: chineseText.trim(), 
      expectedChinese 
    });
    
    // Nếu đã có pinyin tự động, sử dụng luôn
    if (autoPinyin && chineseText.trim() === expectedChinese) {
      console.log('Sử dụng pinyin tự động:', autoPinyin);
      // Đảm bảo set state trước khi mở modal
      setPinyinInput(autoPinyin);
      setAddType('sentence');
      // Sử dụng setTimeout để đảm bảo state được update trước khi modal render
      setTimeout(() => {
        setShowAddModal(true);
      }, 0);
    } else {
      console.log('Lấy pinyin mới cho:', chineseText);
      setPinyinInput(''); // Reset trước
      setPendingChinese(chineseText); // Set pending để useEffect xử lý
      setAddType('sentence');
      setShowAddModal(true);
    }
  };

  const handleConfirmAdd = () => {
    if (!targetText.trim() || !sourceText.trim()) {
      return;
    }

    if (!pinyinInput.trim()) {
      alert('Vui lòng nhập pinyin');
      return;
    }

    // Xác định chinese và vietnamese dựa trên ngôn ngữ
    let chinese: string;
    let vietnamese: string;

    if (sourceLang === 'zh') {
      // Dịch từ Trung sang Việt
      chinese = sourceText.trim();
      vietnamese = targetText.trim();
    } else if (targetLang === 'zh') {
      // Dịch từ Việt sang Trung
      chinese = targetText.trim();
      vietnamese = sourceText.trim();
    } else {
      alert('Cần có tiếng Trung trong bản dịch');
      return;
    }

    if (addType === 'vocab') {
      const vocab: Vocabulary = {
        chinese,
        pinyin: pinyinInput.trim(),
        vietnamese
      };

      addVocabulary(currentLevel, vocab);
      window.dispatchEvent(new Event('vocabUpdated'));
      alert('Đã thêm vào từ vựng thành công!');
      setShowAddModal(false);
      setAddType(null);
      setPinyinInput('');
    } else if (addType === 'sentence') {
      const sentence: Sentence = {
        chinese,
        pinyin: pinyinInput.trim(),
        vietnamese,
        category: selectedTopic
      };

      addSentence(currentLevel, selectedTopic, sentence);
      window.dispatchEvent(new Event('sentencesUpdated'));
      alert('Đã thêm vào câu thành công!');
      setShowAddModal(false);
      setAddType(null);
      setPinyinInput('');
    }
  };

  return (
    <div className="translate-container">
      <div className="translate-header">
        <div className="title-group">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <h2>Dịch thuật</h2>
        </div>
        <div className="translate-actions">
          <button 
            onClick={handleClearCache} 
            className="btn-clear-cache-glass"
            title="Xóa cache dịch thuật"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
            <span>Xóa cache</span>
          </button>
          <button 
            onClick={handleClear} 
            className="btn-clear-glass"
            title="Xóa tất cả"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            <span>Xóa</span>
          </button>
        </div>
      </div>

      <div className="translate-content">
        <div className="language-selectors">
          <div className="language-selector">
            <label>Từ:</label>
            <CustomDropdown 
              value={sourceLang} 
              onChange={setSourceLang}
              options={languages.map(l => ({ value: l.code, label: l.name }))}
              className="lang-dropdown"
            />
          </div>

          <button 
            onClick={handleSwapLanguages}
            className="btn-swap"
            title="Đổi ngôn ngữ"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4-4 4-4"/><path d="M3 17h18"/><path d="m17 3 4 4-4 4"/><path d="M21 7H3"/></svg>
          </button>

          <div className="language-selector">
            <label>Sang:</label>
            <CustomDropdown 
              value={targetLang} 
              onChange={setTargetLang}
              options={languages.map(l => ({ value: l.code, label: l.name }))}
              className="lang-dropdown"
            />
          </div>
        </div>

        <div className="provider-selector-row" style={{ marginTop: '20px' }}>
          <label className="provider-label">Nguồn dịch:</label>
          <CustomDropdown
            value={translationProvider}
            onChange={setTranslationProvider}
            options={TRANSLATION_PROVIDERS.map(p => ({ value: p.id, label: p.label }))}
            className="provider-dropdown"
          />
        </div>

        <div className="translate-boxes" style={{ marginTop: '30px' }}>
          <div className="translate-box source-box">
            <div className="box-header">
              <span className="box-label">
                {languages.find(l => l.code === sourceLang)?.name}
              </span>
              {sourceText && (
                <button 
                  onClick={() => handleCopy(sourceText)}
                  className="btn-copy-glass"
                  title="Sao chép"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              )}
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Nhập văn bản cần dịch..."
              className="translate-input"
              rows={10}
            />
            <div className="char-count">
              {sourceText.length} ký tự
            </div>
          </div>

          <div className="translate-box target-box">
            <div className="box-header">
              <span className="box-label">
                {languages.find(l => l.code === targetLang)?.name}
              </span>
              {targetText && (
                <button 
                  onClick={() => handleCopy(targetText)}
                  className="btn-copy-glass"
                  title="Sao chép"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              )}
            </div>
            <div className="translate-output">
              {isTranslating ? (
                <div className="translating-indicator">
                  <span className="spinner">⏳</span>
                  <span>Đang dịch...</span>
                </div>
              ) : error ? (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              ) : targetText ? (
                <div className="translated-text">{targetText}</div>
              ) : (
                <div className="placeholder-text">
                  Kết quả dịch sẽ hiển thị ở đây...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="translate-button-container">
          <button 
            onClick={translateText}
            disabled={!sourceText.trim() || isTranslating}
            className="btn-translate"
          >
            {isTranslating ? '⏳ Đang dịch...' : '🚀 Dịch'}
          </button>
        </div>

        {targetText && !isTranslating && !error && (
          <div className="add-to-list-container">
            <button 
              onClick={handleAddToVocab}
              className="btn-add-to-vocab"
              title="Thêm vào từ vựng"
            >
              📚 Thêm vào từ vựng
            </button>
            <button 
              onClick={handleAddToSentence}
              className="btn-add-to-sentence"
              title="Thêm vào câu"
            >
              💬 Thêm vào câu
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {addType === 'vocab' ? '📚 Thêm vào từ vựng' : '💬 Thêm vào câu'}
              </h3>
              <button 
                className="btn-clear-glass" 
                style={{ padding: '8px', minWidth: 'auto', borderRadius: '50%' }}
                onClick={() => setShowAddModal(false)}
              >
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
                <input
                  type="text"
                  value={pinyinInput}
                  onChange={(e) => setPinyinInput(e.target.value)}
                  placeholder={isLoadingPinyin ? "Đang lấy pinyin tự động..." : "VD: nǐ hǎo"}
                  disabled={isLoadingPinyin}
                  className="translate-input-compact"
                />
              </div>

              {addType === 'sentence' && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Chủ đề</label>
                  <CustomDropdown
                    options={topicOptions}
                    value={selectedTopic}
                    onChange={setSelectedTopic}
                    className="topic-selector-dropdown"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowAddModal(false)}
                className="btn-modal-cancel"
              >
                Hủy
              </button>
              <button 
                onClick={handleConfirmAdd}
                className="btn-modal-confirm"
                disabled={!pinyinInput.trim() || isLoadingPinyin}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Translate;


