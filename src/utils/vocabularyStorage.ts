import { Vocabulary } from '../data/vocabulary';
import { hskVocabulary } from '../data/vocabulary';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'hsk_custom_vocabularies';

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
 * Lấy tất cả từ vựng (default + custom) cho một level
 */
export function getVocabulariesForLevel(level: string): Vocabulary[] {
  const defaultVocab = hskVocabulary[level] || [];
  const customVocab = getCustomVocabularies()[level] || [];
  return [...defaultVocab, ...customVocab];
}

/**
 * Xóa tất cả từ vựng custom
 */
export function clearAllCustomVocabularies(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export từ vựng custom ra JSON (để sao lưu)
 */
export function exportCustomVocabularies(): string {
  return JSON.stringify(getCustomVocabularies(), null, 2);
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
        ['Chữ Hán', 'Pinyin', 'Nghĩa tiếng Việt', 'Loại'] // Header
      ];
      
      // Thêm dữ liệu
      const defaultVocab = hskVocabulary[level] || [];
      vocabularies.forEach(vocab => {
        const isDefault = defaultVocab.some(
          v => v.chinese === vocab.chinese && 
               v.pinyin === vocab.pinyin && 
               v.vietnamese === vocab.vietnamese
        );
        worksheetData.push([
          vocab.chinese,
          vocab.pinyin,
          vocab.vietnamese,
          isDefault ? 'Mặc định' : 'Tự thêm'
        ]);
      });
      
      // Tạo worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      worksheet['!cols'] = [
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
  const allData = [['Level', 'Chữ Hán', 'Pinyin', 'Nghĩa tiếng Việt', 'Loại']];
  levels.forEach((level) => {
    const vocabularies = getVocabulariesForLevel(level);
    const defaultVocab = hskVocabulary[level] || [];
    
    if (vocabularies.length > 0) {
      vocabularies.forEach(vocab => {
        const isDefault = defaultVocab.some(
          v => v.chinese === vocab.chinese && 
               v.pinyin === vocab.pinyin && 
               v.vietnamese === vocab.vietnamese
        );
        allData.push([
          level.toUpperCase(),
          vocab.chinese,
          vocab.pinyin,
          vocab.vietnamese,
          isDefault ? 'Mặc định' : 'Tự thêm'
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
      { wch: 30 },
      { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, allWorksheet, 'Tất cả');
  }
  
  // Xuất file
  const fileName = `hsk-all-vocabularies-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Validate format từ vựng
 */
function validateVocabulary(vocab: any): vocab is Vocabulary {
  return (
    typeof vocab === 'object' &&
    vocab !== null &&
    typeof vocab.chinese === 'string' &&
    typeof vocab.pinyin === 'string' &&
    typeof vocab.vietnamese === 'string' &&
    vocab.chinese.trim() !== '' &&
    vocab.pinyin.trim() !== '' &&
    vocab.vietnamese.trim() !== ''
  );
}

/**
 * Import từ vựng custom từ JSON (merge hoặc replace)
 * @param jsonString JSON string
 * @param merge true = merge với dữ liệu hiện có, false = thay thế hoàn toàn
 */
export function importCustomVocabularies(jsonString: string, merge: boolean = true): { success: boolean; message: string; added: number; errors: number } {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate structure
    if (typeof data !== 'object' || data === null) {
      return { success: false, message: 'Dữ liệu không hợp lệ! File phải là object JSON.', added: 0, errors: 0 };
    }

    const currentCustom = getCustomVocabularies();
    const result: CustomVocabularies = merge ? { ...currentCustom } : {
      hsk1: [],
      hsk2: [],
      hsk3: [],
      hsk4: [],
      hsk5: []
    };

    let totalAdded = 0;
    let totalErrors = 0;
    const validLevels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5'];

    // Process each level
    for (const level of validLevels) {
      if (!data[level]) {
        if (!merge) {
          result[level] = [];
        }
        continue;
      }

      if (!Array.isArray(data[level])) {
        totalErrors++;
        console.warn(`Level ${level} không phải là array, bỏ qua.`);
        if (!merge) {
          result[level] = [];
        }
        continue;
      }

      // Initialize if needed
      if (!result[level]) {
        result[level] = [];
      }

      // Process vocabularies
      const existingChinese = new Set(result[level].map(v => v.chinese));
      const existingPinyin = new Set(result[level].map(v => `${v.pinyin}|${v.vietnamese}`));

      for (const vocab of data[level]) {
        if (!validateVocabulary(vocab)) {
          totalErrors++;
          console.warn(`Từ vựng không hợp lệ trong ${level}:`, vocab);
          continue;
        }

        // Check duplicate
        const normalizedVocab: Vocabulary = {
          chinese: vocab.chinese.trim(),
          pinyin: vocab.pinyin.trim(),
          vietnamese: vocab.vietnamese.trim()
        };

        const isDuplicate = existingChinese.has(normalizedVocab.chinese) || 
                           existingPinyin.has(`${normalizedVocab.pinyin}|${normalizedVocab.vietnamese}`);

        if (!isDuplicate) {
          result[level].push(normalizedVocab);
          existingChinese.add(normalizedVocab.chinese);
          existingPinyin.add(`${normalizedVocab.pinyin}|${normalizedVocab.vietnamese}`);
          totalAdded++;
        }
      }
    }

    // Save result
    saveCustomVocabularies(result);

    const message = `Import thành công! Đã thêm ${totalAdded} từ vựng${totalErrors > 0 ? `, ${totalErrors} lỗi đã bỏ qua.` : '.'}`;
    return { success: true, message, added: totalAdded, errors: totalErrors };
  } catch (error) {
    console.error('Error importing vocabularies:', error);
    return { 
      success: false, 
      message: `Lỗi khi import: ${error instanceof Error ? error.message : 'Định dạng JSON không hợp lệ!'}`, 
      added: 0, 
      errors: 0 
    };
  }
}

