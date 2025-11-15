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
 * Export từ vựng custom ra Excel (để sao lưu)
 * Format: A1=Chữ Hán, B1=Pinyin, C1=Nghĩa tiếng Việt
 */
export function exportCustomVocabularies(): void {
  try {
    const custom = getCustomVocabularies();
    
    // Tạo workbook
    const workbook = XLSX.utils.book_new();
    
    // Tạo sheet tổng hợp (tất cả từ vựng trong 1 sheet)
    const allData = [
      ['Chữ Hán', 'Pinyin', 'Nghĩa tiếng Việt'] // Header row
    ];
    
    const levels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5'];
    let hasData = false;
    
    levels.forEach((level) => {
      if (custom[level] && custom[level].length > 0) {
        hasData = true;
        custom[level].forEach(vocab => {
          allData.push([
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
        const result: CustomVocabularies = merge ? { ...currentCustom } : {
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
        
        if (!result[targetLevel]) {
          result[targetLevel] = [];
        }

        let totalAdded = 0;
        let totalErrors = 0;

        // Bỏ qua dòng header (dòng đầu tiên)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Format: A=Chữ Hán, B=Pinyin, C=Nghĩa tiếng Việt
          const chinese = String(row[0] || '').trim();
          const pinyin = String(row[1] || '').trim();
          const vietnamese = String(row[2] || '').trim();
          
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

          const vocab: Vocabulary = {
            chinese,
            pinyin,
            vietnamese
          };

          // Check duplicate
          const existingChinese = new Set(result[targetLevel].map(v => v.chinese));
          const existingPinyin = new Set(result[targetLevel].map(v => `${v.pinyin}|${v.vietnamese}`));

          const isDuplicate = existingChinese.has(vocab.chinese) || 
                             existingPinyin.has(`${vocab.pinyin}|${vocab.vietnamese}`);

          if (!isDuplicate) {
            result[targetLevel].push(vocab);
            existingChinese.add(vocab.chinese);
            existingPinyin.add(`${vocab.pinyin}|${vocab.vietnamese}`);
            totalAdded++;
          }
        }

        // Save result
        saveCustomVocabularies(result);

        const message = `Import thành công! Đã thêm ${totalAdded} từ vựng vào ${targetLevel.toUpperCase()}${totalErrors > 0 ? `, ${totalErrors} lỗi đã bỏ qua.` : '.'}`;
        resolve({ success: true, message, added: totalAdded, errors: totalErrors });
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

