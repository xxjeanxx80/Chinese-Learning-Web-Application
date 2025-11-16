import { Vocabulary } from '../data/vocabulary';
import { hskVocabulary } from '../data/vocabulary';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'hsk_custom_vocabularies';
const OVERRIDE_KEY = 'hsk_vocabulary_overrides';

export interface CustomVocabularies {
  [level: string]: Vocabulary[];
}

/**
 * Lấy từ vựng custom từ localStorage
 */
export function getCustomVocabularies(): CustomVocabularies {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading custom vocabularies:', error);
  }
  return {
    hsk1: [],
    hsk2: [],
    hsk3: [],
    hsk4: [],
    hsk5: []
  };
}

/**
 * Lưu từ vựng custom vào localStorage
 */
export function saveCustomVocabularies(vocabularies: CustomVocabularies): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vocabularies));
  } catch (error) {
    console.error('Error saving custom vocabularies:', error);
  }
}

/**
 * Thêm từ vựng mới vào level
 */
export function addVocabulary(level: string, vocabulary: Vocabulary): void {
  const custom = getCustomVocabularies();
  if (!custom[level]) {
    custom[level] = [];
  }
  
  // Kiểm tra trùng lặp
  const exists = custom[level].some(
    v => v.chinese === vocabulary.chinese || 
         (v.pinyin === vocabulary.pinyin && v.vietnamese === vocabulary.vietnamese)
  );
  
  if (!exists) {
    custom[level].push(vocabulary);
    saveCustomVocabularies(custom);
  }
}

/**
 * Xóa từ vựng khỏi level
 */
export function removeVocabulary(level: string, index: number): void {
  const custom = getCustomVocabularies();
  if (custom[level] && custom[level][index]) {
    custom[level].splice(index, 1);
    saveCustomVocabularies(custom);
  }
}

/**
 * Cập nhật từ vựng
 */
export function updateVocabulary(level: string, index: number, vocabulary: Vocabulary): void {
  const custom = getCustomVocabularies();
  if (custom[level] && custom[level][index]) {
    custom[level][index] = vocabulary;
    saveCustomVocabularies(custom);
  }
}

/**
 * Lấy từ vựng override từ localStorage
 */
export function getVocabularyOverrides(): CustomVocabularies {
  try {
    const stored = localStorage.getItem(OVERRIDE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading vocabulary overrides:', error);
  }
  return {
    hsk1: [],
    hsk2: [],
    hsk3: [],
    hsk4: [],
    hsk5: []
  };
}

/**
 * Lưu từ vựng override vào localStorage
 */
export function saveVocabularyOverrides(overrides: CustomVocabularies): void {
  try {
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error('Error saving vocabulary overrides:', error);
  }
}

/**
 * Lấy tất cả từ vựng (override > default > custom) cho một level
 * Ưu tiên: override > default > custom
 */
export function getVocabulariesForLevel(level: string): Vocabulary[] {
  const defaultVocab = hskVocabulary[level] || [];
  const overrideVocab = getVocabularyOverrides()[level] || [];
  const customVocab = getCustomVocabularies()[level] || [];
  
  // Tạo map để tránh duplicate
  const vocabMap = new Map<string, Vocabulary>();
  
  // Bước 1: Thêm default vocab
  defaultVocab.forEach(v => {
    vocabMap.set(v.chinese, v);
  });
  
  // Bước 2: Override với override vocab (ghi đè default nếu có)
  overrideVocab.forEach(v => {
    vocabMap.set(v.chinese, v);
  });
  
  // Bước 3: Thêm custom vocab (chỉ thêm nếu chưa có trong default/override)
  customVocab.forEach(v => {
    if (!vocabMap.has(v.chinese)) {
      vocabMap.set(v.chinese, v);
    }
  });
  
  return Array.from(vocabMap.values());
}

/**
 * Xóa tất cả từ vựng custom
 */
export function clearAllCustomVocabularies(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Xóa tất cả từ vựng (custom + overrides)
 */
export function clearAllVocabularies(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(OVERRIDE_KEY);
}

/**
 * Export từ vựng custom ra Excel cho một level cụ thể (để sao lưu)
 * Format: A1=HSK Level, B1=Chữ Hán, C1=Pinyin, D1=Nghĩa tiếng Việt
 * @param level Level HSK cần export (hsk1, hsk2, ...)
 * @param includeCustom Chỉ export từ tự thêm hay tất cả (default + custom)
 */
export function exportVocabulariesForLevel(level: string, includeCustom: boolean = false): void {
  try {
    const validLevels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5'];
    const targetLevel = level.toLowerCase();
    
    if (!validLevels.includes(targetLevel)) {
      alert(`Level ${level} không hợp lệ!`);
      return;
    }
    
    // Tạo workbook
    const workbook = XLSX.utils.book_new();
    
    // Lấy từ vựng
    let vocabularies: Vocabulary[] = [];
    if (includeCustom) {
      // Export tất cả (default + custom)
      vocabularies = getVocabulariesForLevel(targetLevel);
    } else {
      // Chỉ export từ tự thêm
      const custom = getCustomVocabularies();
      vocabularies = custom[targetLevel] || [];
    }
    
    // Tạo worksheet data
    const worksheetData = [
      ['HSK Level', 'Chữ Hán', 'Pinyin', 'Nghĩa tiếng Việt'] // Header
    ];
    
    // Extract level number (e.g., "hsk1" -> "1")
    const levelNum = targetLevel.replace(/hsk/i, '');
    
    // Thêm dữ liệu
    vocabularies.forEach(vocab => {
      worksheetData.push([
        levelNum,
        vocab.chinese || '',
        vocab.pinyin || '',
        vocab.vietnamese || ''
      ]);
    });
    
    // Tạo worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet['!cols'] = [
      { wch: 10 },  // HSK Level
      { wch: 15 },  // Chữ Hán
      { wch: 20 },  // Pinyin
      { wch: 30 }   // Nghĩa tiếng Việt
    ];
    
    const sheetName = targetLevel.toUpperCase();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Xuất file
    const exportType = includeCustom ? 'all' : 'custom';
    const fileName = `hsk-${targetLevel}-${exportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    if (vocabularies.length === 0) {
      console.warn(`Không có dữ liệu để export cho ${targetLevel.toUpperCase()}.`);
    }
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Lỗi khi xuất file Excel! Vui lòng thử lại.');
  }
}

/**
 * Export từ vựng custom ra Excel (để sao lưu) - TẤT CẢ LEVEL
 * Format: A1=Chữ Hán, B1=Pinyin, C1=Nghĩa tiếng Việt
 */
export function exportCustomVocabularies(): void {
  try {
    const custom = getCustomVocabularies();
    
    // Tạo workbook
    const workbook = XLSX.utils.book_new();
    
    // Tạo sheet tổng hợp (tất cả từ vựng trong 1 sheet)
    const allData = [
      ['HSK Level', 'Chữ Hán', 'Pinyin', 'Nghĩa tiếng Việt'] // Header row
    ];
    
    const levels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5'];
    let hasData = false;
    
    levels.forEach((level) => {
      if (custom[level] && custom[level].length > 0) {
        hasData = true;
        const levelNum = level.replace(/hsk/i, '');
        custom[level].forEach(vocab => {
          allData.push([
            levelNum,
            vocab.chinese || '',
            vocab.pinyin || '',
            vocab.vietnamese || ''
          ]);
        });
      }
    });
    
    // Luôn tạo worksheet, ngay cả khi không có dữ liệu
    const worksheet = XLSX.utils.aoa_to_sheet(allData);
    worksheet['!cols'] = [
      { wch: 10 },  // HSK Level
      { wch: 15 },  // Chữ Hán
      { wch: 20 },  // Pinyin
      { wch: 30 }   // Nghĩa tiếng Việt
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Từ vựng');
    
    // Xuất file
    const fileName = `hsk-custom-vocabularies-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    if (!hasData) {
      console.warn('Không có dữ liệu để export, nhưng file Excel đã được tạo với header.');
    }
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Lỗi khi xuất file Excel! Vui lòng thử lại.');
  }
}

/**
 * Export tất cả từ vựng (default + custom) ra JSON (để sao lưu)
 */
export function exportAllVocabularies(): string {
  const allVocab: CustomVocabularies = {
    hsk1: getVocabulariesForLevel('hsk1'),
    hsk2: getVocabulariesForLevel('hsk2'),
    hsk3: getVocabulariesForLevel('hsk3'),
    hsk4: getVocabulariesForLevel('hsk4'),
    hsk5: getVocabulariesForLevel('hsk5')
  };
  return JSON.stringify(allVocab, null, 2);
}

/**
 * Export từ vựng ra Excel (chỉ từ tự thêm)
 */
export function exportToExcelCustom(): void {
  const custom = getCustomVocabularies();
  
  // Tạo workbook
  const workbook = XLSX.utils.book_new();
  
  // Tạo sheet cho mỗi level có dữ liệu
  const levels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5'];
  levels.forEach((level) => {
    if (custom[level] && custom[level].length > 0) {
      // Tạo worksheet data
      const worksheetData = [
        ['Level', 'Chữ Hán', 'Pinyin', 'Nghĩa tiếng Việt'] // Header
      ];
      
      // Thêm dữ liệu
      custom[level].forEach(vocab => {
        worksheetData.push([
          level.toUpperCase(),
          vocab.chinese,
          vocab.pinyin,
          vocab.vietnamese
        ]);
      });
      
      // Tạo worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 8 },   // Level
        { wch: 15 },  // Chinese
        { wch: 20 },  // Pinyin
        { wch: 30 }   // Vietnamese
      ];
      
      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, level.toUpperCase());
    }
  });
  
  // Tạo sheet tổng hợp (tất cả từ vựng trong 1 sheet)
  const allData = [['Level', 'Chữ Hán', 'Pinyin', 'Nghĩa tiếng Việt']];
  levels.forEach((level) => {
    if (custom[level] && custom[level].length > 0) {
      custom[level].forEach(vocab => {
        allData.push([
          level.toUpperCase(),
          vocab.chinese,
          vocab.pinyin,
          vocab.vietnamese
        ]);
      });
    }
  });
  
  if (allData.length > 1) {
    const allWorksheet = XLSX.utils.aoa_to_sheet(allData);
    allWorksheet['!cols'] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 20 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(workbook, allWorksheet, 'Tất cả');
  }
  
  // Xuất file
  const fileName = `hsk-custom-vocabularies-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export tất cả từ vựng ra Excel (default + custom)
 */
export function exportToExcelAll(): void {
  // Tạo workbook
  const workbook = XLSX.utils.book_new();
  
  // Tạo sheet cho mỗi level
  const levels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5'];
  levels.forEach((level) => {
    const vocabularies = getVocabulariesForLevel(level);
    
    if (vocabularies.length > 0) {
      // Tạo worksheet data
      const worksheetData = [
        ['HSK Level', 'Chữ Hán', 'Pinyin', 'Nghĩa tiếng Việt', 'Loại'] // Header
      ];
      
      // Thêm dữ liệu
      const defaultVocab = hskVocabulary[level] || [];
      const overrideVocab = getVocabularyOverrides()[level] || [];
      const overrideVocabMap = new Map(overrideVocab.map(v => [v.chinese, v]));
      const defaultVocabMap = new Map(defaultVocab.map(v => [v.chinese, v]));
      
      // Extract level number from level string (e.g., "hsk1" -> "1")
      const levelNum = level.replace(/hsk/i, '');
      
      vocabularies.forEach(vocab => {
        const hasOverride = overrideVocabMap.has(vocab.chinese);
        const isDefault = defaultVocabMap.has(vocab.chinese);
        
        let type = 'Tự thêm';
        if (hasOverride) {
          type = 'Mặc định (đã chỉnh sửa)';
        } else if (isDefault) {
          type = 'Mặc định';
        }
        
        worksheetData.push([
          levelNum,
          vocab.chinese,
          vocab.pinyin,
          vocab.vietnamese,
          type
        ]);
      });
      
      // Tạo worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 10 },  // HSK Level
        { wch: 15 },  // Chinese
        { wch: 20 },  // Pinyin
        { wch: 30 },  // Vietnamese
        { wch: 12 }   // Type
      ];
      
      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, level.toUpperCase());
    }
  });
  
  // Tạo sheet tổng hợp
  const allData = [['HSK Level', 'Chữ Hán', 'Pinyin', 'Nghĩa tiếng Việt', 'Loại']];
  levels.forEach((level) => {
    const vocabularies = getVocabulariesForLevel(level);
    
    if (vocabularies.length > 0) {
      const defaultVocab = hskVocabulary[level] || [];
      const overrideVocab = getVocabularyOverrides()[level] || [];
      const overrideVocabMap = new Map(overrideVocab.map(v => [v.chinese, v]));
      const defaultVocabMap = new Map(defaultVocab.map(v => [v.chinese, v]));
      
      vocabularies.forEach(vocab => {
        const hasOverride = overrideVocabMap.has(vocab.chinese);
        const isDefault = defaultVocabMap.has(vocab.chinese);
        
        let type = 'Tự thêm';
        if (hasOverride) {
          type = 'Mặc định (đã chỉnh sửa)';
        } else if (isDefault) {
          type = 'Mặc định';
        }
        
        // Extract level number from level string (e.g., "hsk1" -> "1")
        const levelNum = level.replace(/hsk/i, '');
        
        allData.push([
          levelNum,
          vocab.chinese,
          vocab.pinyin,
          vocab.vietnamese,
          type
        ]);
      });
    }
  });
  
  if (allData.length > 1) {
    const allWorksheet = XLSX.utils.aoa_to_sheet(allData);
    allWorksheet['!cols'] = [
      { wch: 10 },  // HSK Level
      { wch: 15 },  // Chinese
      { wch: 20 },  // Pinyin
      { wch: 30 },  // Vietnamese
      { wch: 12 }   // Type
    ];
    XLSX.utils.book_append_sheet(workbook, allWorksheet, 'Tất cả');
  }
  
  // Xuất file
  const fileName = `hsk-all-vocabularies-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}


/**
 * Import từ vựng custom từ Excel (merge hoặc replace)
 * Format: A1=Chữ Hán, B1=Pinyin, C1=Nghĩa tiếng Việt
 * @param file Excel file
 * @param level Level HSK để import vào
 * @param merge true = merge với dữ liệu hiện có, false = thay thế hoàn toàn
 */
export function importCustomVocabulariesFromExcel(file: File, level: string, merge: boolean = true): Promise<{ success: boolean; message: string; added: number; errors: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Lấy sheet đầu tiên
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Chuyển đổi sang JSON (array of arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        
        if (jsonData.length < 2) {
          resolve({ 
            success: false, 
            message: 'File Excel không có dữ liệu! Vui lòng kiểm tra lại.', 
            added: 0, 
            errors: 0 
          });
          return;
        }

        const currentCustom = getCustomVocabularies();
        const currentOverrides = getVocabularyOverrides();
        
        const resultCustom: CustomVocabularies = merge ? { ...currentCustom } : {
          hsk1: [],
          hsk2: [],
          hsk3: [],
          hsk4: [],
          hsk5: []
        };
        
        const resultOverrides: CustomVocabularies = merge ? { ...currentOverrides } : {
          hsk1: [],
          hsk2: [],
          hsk3: [],
          hsk4: [],
          hsk5: []
        };

        const targetLevel = level.toLowerCase();
        const validLevels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5'];
        
        if (!validLevels.includes(targetLevel)) {
          resolve({ 
            success: false, 
            message: `Level ${level} không hợp lệ!`, 
            added: 0, 
            errors: 0 
          });
          return;
        }
        
        if (!resultCustom[targetLevel]) {
          resultCustom[targetLevel] = [];
        }
        
        if (!resultOverrides[targetLevel]) {
          resultOverrides[targetLevel] = [];
        }
        
        // Lấy danh sách từ mặc định để kiểm tra
        const defaultVocab = hskVocabulary[targetLevel] || [];
        const defaultVocabMap = new Map(defaultVocab.map(v => [v.chinese, v]));

        let totalAdded = 0;
        let totalUpdated = 0;
        let totalErrors = 0;

        // Phân tích header để xác định vị trí cột (hỗ trợ nhiều format)
        const headerRow = jsonData[0];
        const header = headerRow.map((h: any) => String(h || '').toLowerCase().trim());
        
        // Tìm vị trí các cột
        const levelIndex = header.findIndex(h => 
          (h.includes('hsk') && (h.includes('level') || h.includes('cấp'))) || 
          h === 'level' || h === 'hsk_level' || h === 'hsk'
        );
        const chineseIndex = header.findIndex(h => 
          h.includes('chữ hán') || h.includes('chinese') || h.includes('hanzi') || 
          h.includes('汉字') || h.includes('từ') || h === 'char' || h === 'character'
        );
        const pinyinIndex = header.findIndex(h => 
          h.includes('pinyin') || h.includes('拼音')
        );
        const vietnameseIndex = header.findIndex(h => 
          h.includes('tiếng việt') || h.includes('vietnamese') || h.includes('nghĩa') || 
          h.includes('meaning') || h.includes('translation') || h === 'vietnamese'
        );
        
        // Fallback: nếu không tìm thấy header, sử dụng vị trí mặc định
        const hasHeader = header.some(h => h.includes('hsk') || h.includes('level') || h.includes('chữ'));
        const startRow = hasHeader ? 1 : 0;
        
        // Bỏ qua dòng header (nếu có)
        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Lấy dữ liệu từ các cột (theo index hoặc vị trí mặc định)
          let hskLevelRaw = '';
          let chinese = '';
          let pinyin = '';
          let vietnamese = '';
          
          if (hasHeader && header.length > 0) {
            // Sử dụng header để xác định vị trí cột
            hskLevelRaw = levelIndex >= 0 ? String(row[levelIndex] || '').trim() : '';
            chinese = chineseIndex >= 0 ? String(row[chineseIndex] || '').trim() : String(row[0] || '').trim();
            pinyin = pinyinIndex >= 0 ? String(row[pinyinIndex] || '').trim() : String(row[1] || '').trim();
            vietnamese = vietnameseIndex >= 0 ? String(row[vietnameseIndex] || '').trim() : String(row[2] || '').trim();
          } else {
            // Format mặc định: A=HSK Level (optional), B=Chữ Hán, C=Pinyin, D=Nghĩa tiếng Việt
            hskLevelRaw = String(row[0] || '').trim();
            // Nếu cột đầu tiên là số (HSK level), thì shift sang phải
            const isLevelCol = /^\d+$/.test(hskLevelRaw);
            if (isLevelCol) {
              chinese = String(row[1] || '').trim();
              pinyin = String(row[2] || '').trim();
              vietnamese = String(row[3] || '').trim();
            } else {
              // Format cũ: A=Chữ Hán, B=Pinyin, C=Nghĩa tiếng Việt
              chinese = String(row[0] || '').trim();
              pinyin = String(row[1] || '').trim();
              vietnamese = String(row[2] || '').trim();
            }
          }
          
          // Bỏ qua dòng trống
          if (!chinese && !pinyin && !vietnamese) {
            continue;
          }
          
          // Validate
          if (!chinese || !pinyin || !vietnamese) {
            totalErrors++;
            console.warn(`Dòng ${i + 1} thiếu thông tin:`, row);
            continue;
          }

          // Xác định HSK level từ cột hoặc từ targetLevel
          let actualLevel = targetLevel;
          if (hskLevelRaw) {
            // Extract số từ level (ví dụ: "1", "HSK1", "hsk1", "HSK 1")
            const levelMatch = hskLevelRaw.toString().match(/\d+/);
            if (levelMatch) {
              const levelNum = parseInt(levelMatch[0]);
              if (levelNum >= 1 && levelNum <= 5) {
                actualLevel = `hsk${levelNum}`;
              }
            }
          }

          const vocab: Vocabulary = {
            chinese,
            pinyin,
            vietnamese
          };
          
          // Nếu level khác targetLevel, cần xử lý đúng level
          if (actualLevel !== targetLevel) {
            // Đảm bảo level này tồn tại trong resultCustom và resultOverrides
            if (!resultCustom[actualLevel]) {
              resultCustom[actualLevel] = [];
            }
            if (!resultOverrides[actualLevel]) {
              resultOverrides[actualLevel] = [];
            }
            
            // Kiểm tra xem từ này có trong default của actualLevel không
            const actualDefaultVocab = hskVocabulary[actualLevel] || [];
            const actualDefaultVocabMap = new Map(actualDefaultVocab.map(v => [v.chinese, v]));
            const isDefaultInActualLevel = actualDefaultVocabMap.has(vocab.chinese);
            
            if (isDefaultInActualLevel) {
              // Nếu có trong default của actualLevel, lưu vào override
              const existingOverride = resultOverrides[actualLevel].findIndex(v => v.chinese === vocab.chinese);
              if (existingOverride >= 0) {
                resultOverrides[actualLevel][existingOverride] = vocab;
                totalUpdated++;
              } else {
                resultOverrides[actualLevel].push(vocab);
                totalUpdated++;
              }
            } else {
              // Nếu không có trong default, lưu vào custom
              const existingCustomChinese = new Set(resultCustom[actualLevel].map(v => v.chinese));
              const existingCustomPinyin = new Set(resultCustom[actualLevel].map(v => `${v.pinyin}|${v.vietnamese}`));
              
              const isDuplicate = existingCustomChinese.has(vocab.chinese) || 
                                 existingCustomPinyin.has(`${vocab.pinyin}|${vocab.vietnamese}`);
              
              if (!isDuplicate) {
                resultCustom[actualLevel].push(vocab);
                existingCustomChinese.add(vocab.chinese);
                existingCustomPinyin.add(`${vocab.pinyin}|${vocab.vietnamese}`);
                totalAdded++;
              }
            }
            continue; // Skip phần xử lý cho targetLevel
          }
          
          // Xử lý bình thường cho targetLevel
          // Kiểm tra xem từ này có trong default không
          const isDefault = defaultVocabMap.has(vocab.chinese);
          
          if (isDefault) {
            // Nếu có trong default, lưu vào override (để ghi đè default)
            const existingOverride = resultOverrides[targetLevel].findIndex(v => v.chinese === vocab.chinese);
            if (existingOverride >= 0) {
              // Cập nhật override hiện có
              resultOverrides[targetLevel][existingOverride] = vocab;
              totalUpdated++;
            } else {
              // Thêm override mới
              resultOverrides[targetLevel].push(vocab);
              totalUpdated++;
            }
          } else {
            // Nếu không có trong default, lưu vào custom
            // Check duplicate trong custom
            const existingCustomChinese = new Set(resultCustom[targetLevel].map(v => v.chinese));
            const existingCustomPinyin = new Set(resultCustom[targetLevel].map(v => `${v.pinyin}|${v.vietnamese}`));

            const isDuplicate = existingCustomChinese.has(vocab.chinese) || 
                               existingCustomPinyin.has(`${vocab.pinyin}|${vocab.vietnamese}`);

            if (!isDuplicate) {
              resultCustom[targetLevel].push(vocab);
              existingCustomChinese.add(vocab.chinese);
              existingCustomPinyin.add(`${vocab.pinyin}|${vocab.vietnamese}`);
              totalAdded++;
            }
          }
        }

        // Save results
        saveCustomVocabularies(resultCustom);
        saveVocabularyOverrides(resultOverrides);

        const parts = [];
        if (totalAdded > 0) parts.push(`thêm ${totalAdded} từ mới`);
        if (totalUpdated > 0) parts.push(`cập nhật ${totalUpdated} từ mặc định`);
        const actionText = parts.length > 0 ? parts.join(', ') : 'không có thay đổi';
        
        // Nếu có HSK level trong file, có thể import vào nhiều level khác nhau
        const levelMsg = hasHeader && levelIndex >= 0 
          ? 'các level' 
          : targetLevel.toUpperCase();
        const message = `Import thành công! Đã ${actionText} vào ${levelMsg}${totalErrors > 0 ? `, ${totalErrors} lỗi đã bỏ qua.` : '.'}`;
        resolve({ success: true, message, added: totalAdded + totalUpdated, errors: totalErrors });
      } catch (error) {
        console.error('Error importing vocabularies from Excel:', error);
        resolve({ 
          success: false, 
          message: `Lỗi khi import: ${error instanceof Error ? error.message : 'Định dạng Excel không hợp lệ!'}`, 
          added: 0, 
          errors: 0 
        });
      }
    };
    
    reader.onerror = () => {
      resolve({ 
        success: false, 
        message: 'Lỗi khi đọc file! Vui lòng thử lại.', 
        added: 0, 
        errors: 0 
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
}
