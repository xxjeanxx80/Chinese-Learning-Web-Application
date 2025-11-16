import { Sentence, getSentencesByLevel } from '../data/sentences';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'hsk_custom_sentences';

// Cấu trúc: level -> topic -> sentences[]
export interface CustomSentences {
  [level: string]: {
    [topic: string]: Sentence[];
  };
}

/**
 * Lấy câu custom từ localStorage
 */
export function getCustomSentences(): CustomSentences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading custom sentences:', error);
  }
  return {
    hsk1: {},
    hsk2: {},
    hsk3: {},
    hsk4: {},
    hsk5: {}
  };
}

/**
 * Lưu câu custom vào localStorage
 */
export function saveCustomSentences(sentences: CustomSentences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sentences));
  } catch (error) {
    console.error('Error saving custom sentences:', error);
  }
}

/**
 * Thêm câu mới vào level và topic
 */
export function addSentence(level: string, topic: string, sentence: Sentence): void {
  const custom = getCustomSentences();
  if (!custom[level]) {
    custom[level] = {};
  }
  if (!custom[level][topic]) {
    custom[level][topic] = [];
  }
  
  // Đảm bảo sentence có category
  const sentenceWithCategory: Sentence = {
    ...sentence,
    category: topic
  };
  
  // Kiểm tra trùng lặp
  const exists = custom[level][topic].some(
    s => s.chinese === sentenceWithCategory.chinese || 
         (s.pinyin === sentenceWithCategory.pinyin && s.vietnamese === sentenceWithCategory.vietnamese)
  );
  
  if (!exists) {
    custom[level][topic].push(sentenceWithCategory);
    saveCustomSentences(custom);
  }
}

/**
 * Xóa câu khỏi level và topic
 */
export function removeSentence(level: string, topic: string, index: number): void {
  const custom = getCustomSentences();
  if (custom[level] && custom[level][topic] && custom[level][topic][index]) {
    custom[level][topic].splice(index, 1);
    // Xóa topic nếu không còn câu nào
    if (custom[level][topic].length === 0) {
      delete custom[level][topic];
    }
    saveCustomSentences(custom);
  }
}

/**
 * Cập nhật câu
 */
export function updateSentence(level: string, topic: string, index: number, sentence: Sentence): void {
  const custom = getCustomSentences();
  if (custom[level] && custom[level][topic] && custom[level][topic][index]) {
    custom[level][topic][index] = {
      ...sentence,
      category: topic
    };
    saveCustomSentences(custom);
  }
}

/**
 * Lấy tất cả câu (default + custom) cho một level và topic
 */
export function getSentencesForLevelAndTopic(level: string, topic: string): Sentence[] {
  // Lấy câu mặc định từ data
  const defaultSentences = getSentencesByLevel(level).filter(s => s.category === topic);
  
  // Lấy câu custom
  const customSentences = getCustomSentences()[level]?.[topic] || [];
  
  return [...defaultSentences, ...customSentences];
}

/**
 * Lấy tất cả câu (default + custom) cho một level (tất cả topic)
 */
export function getSentencesForLevel(level: string): Sentence[] {
  const defaultSentences = getSentencesByLevel(level);
  const custom = getCustomSentences()[level] || {};
  
  const customSentences: Sentence[] = [];
  Object.values(custom).forEach(topicSentences => {
    customSentences.push(...topicSentences);
  });
  
  return [...defaultSentences, ...customSentences];
}

/**
 * Lấy danh sách topic có trong level
 */
export function getTopicsForLevel(level: string): string[] {
  const defaultSentences = getSentencesByLevel(level);
  const topics = new Set<string>();
  
  defaultSentences.forEach(s => {
    if (s.category) {
      topics.add(s.category);
    }
  });
  
  const custom = getCustomSentences()[level] || {};
  Object.keys(custom).forEach(topic => {
    topics.add(topic);
  });
  
  return Array.from(topics).sort();
}

/**
 * Xóa tất cả câu custom
 */
export function clearAllCustomSentences(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export câu custom ra Excel (để sao lưu)
 * Format: A1=Chữ Hán, B1=Pinyin, C1=Nghĩa tiếng Việt, D1=Category
 * @param includeDefault Nếu true, export cả câu mặc định
 * @param level Nếu có, chỉ export level đó
 */
export function exportCustomSentences(includeDefault: boolean = false, level?: string): void {
  try {
    const custom = getCustomSentences();
    
    // Tạo workbook
    const workbook = XLSX.utils.book_new();
    
    const levels = level ? [level] : ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5'];
    
    // Tạo sheet tổng hợp
    const allData = [
      ['HSK Level', 'Chữ Hán', 'Pinyin', 'Nghĩa tiếng Việt', 'Category'] // Header row
    ];
    
    levels.forEach((lvl) => {
      // Extract level number (e.g., "hsk1" -> "1")
      const levelNum = lvl.replace(/hsk/i, '');
      
      // Export câu mặc định nếu được yêu cầu
      if (includeDefault) {
        const allTopics = getTopicsForLevel(lvl);
        allTopics.forEach(topic => {
          // Lấy câu mặc định từ data gốc (không bao gồm custom)
          const defaultSentences = getSentencesByLevel(lvl).filter(s => s.category === topic);
          defaultSentences.forEach(sentence => {
            allData.push([
              levelNum,
              sentence.chinese || '',
              sentence.pinyin || '',
              sentence.vietnamese || '',
              sentence.category || topic || ''
            ]);
          });
        });
      }
      
      // Export câu custom
      const levelData = custom[lvl] || {};
      Object.entries(levelData).forEach(([topic, sentences]) => {
        sentences.forEach(sentence => {
          allData.push([
            levelNum,
            sentence.chinese || '',
            sentence.pinyin || '',
            sentence.vietnamese || '',
            sentence.category || topic || ''
          ]);
        });
      });
    });
    
    // Luôn tạo worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(allData);
    worksheet['!cols'] = [
      { wch: 10 },  // HSK Level
      { wch: 30 },  // Chữ Hán
      { wch: 30 },  // Pinyin
      { wch: 40 },  // Nghĩa tiếng Việt
      { wch: 15 }   // Category
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, includeDefault ? 'Tất cả câu' : 'Câu tự thêm');
    
    // Xuất file
    const fileName = `hsk-sentences-${includeDefault ? 'all' : 'custom'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Lỗi khi xuất file Excel! Vui lòng thử lại.');
  }
}

/**
 * Import câu custom từ Excel (merge hoặc replace)
 * Format hỗ trợ 2 cách:
 * 1. Format mới: A1=HSK Level, B1=Chữ Hán, C1=Pinyin, D1=Nghĩa tiếng Việt, E1=Category (tự động phân loại theo HSK Level)
 * 2. Format cũ: A1=Chữ Hán, B1=Pinyin, C1=Nghĩa tiếng Việt, D1=Category (import vào level chỉ định)
 * @param file Excel file
 * @param level Level HSK để import vào (nếu file không có cột HSK Level)
 * @param merge true = merge với dữ liệu hiện có, false = thay thế hoàn toàn
 */
export function importCustomSentencesFromExcel(file: File, level: string, merge: boolean = true): Promise<{ success: boolean; message: string; added: number; errors: number }> {
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
        const categoryIndex = header.findIndex(h => 
          h.includes('category') || h.includes('chủ đề') || h.includes('topic') || 
          h.includes('loại') || h === 'category'
        );
        
        // Fallback: nếu không tìm thấy header, sử dụng vị trí mặc định
        const hasHeader = header.some(h => h.includes('hsk') || h.includes('level') || h.includes('chữ') || h.includes('category'));
        const startRow = hasHeader ? 1 : 0;

        const currentCustom = getCustomSentences();
        const result: CustomSentences = merge ? { ...currentCustom } : {
          hsk1: {},
          hsk2: {},
          hsk3: {},
          hsk4: {},
          hsk5: {}
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

        let totalAdded = 0;
        let totalErrors = 0;
        const topicStats: Record<string, number> = {};

        // Bỏ qua dòng header (nếu có)
        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Lấy dữ liệu từ các cột (theo index hoặc vị trí mặc định)
          let hskLevelRaw = '';
          let chinese = '';
          let pinyin = '';
          let vietnamese = '';
          let category = '';
          
          if (hasHeader && header.length > 0) {
            // Sử dụng header để xác định vị trí cột
            hskLevelRaw = levelIndex >= 0 ? String(row[levelIndex] || '').trim() : '';
            chinese = chineseIndex >= 0 ? String(row[chineseIndex] || '').trim() : String(row[0] || '').trim();
            pinyin = pinyinIndex >= 0 ? String(row[pinyinIndex] || '').trim() : String(row[1] || '').trim();
            vietnamese = vietnameseIndex >= 0 ? String(row[vietnameseIndex] || '').trim() : String(row[2] || '').trim();
            category = categoryIndex >= 0 ? String(row[categoryIndex] || '').trim().toLowerCase() : String(row[3] || '').trim().toLowerCase();
          } else {
            // Format mặc định: A=HSK Level (optional), B=Chữ Hán, C=Pinyin, D=Nghĩa tiếng Việt, E=Category
            hskLevelRaw = String(row[0] || '').trim();
            // Nếu cột đầu tiên là số (HSK level), thì shift sang phải
            const isLevelCol = /^\d+$/.test(hskLevelRaw);
            if (isLevelCol) {
              chinese = String(row[1] || '').trim();
              pinyin = String(row[2] || '').trim();
              vietnamese = String(row[3] || '').trim();
              category = String(row[4] || '').trim().toLowerCase();
            } else {
              // Format cũ: A=Chữ Hán, B=Pinyin, C=Nghĩa tiếng Việt, D=Category
              chinese = String(row[0] || '').trim();
              pinyin = String(row[1] || '').trim();
              vietnamese = String(row[2] || '').trim();
              category = String(row[3] || '').trim().toLowerCase();
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

          // Nếu level khác targetLevel, cần xử lý đúng level
          if (actualLevel !== targetLevel) {
            // Đảm bảo level này tồn tại trong result
            if (!result[actualLevel]) {
              result[actualLevel] = {};
            }
          }
          
          // Đảm bảo targetLevel hoặc actualLevel tồn tại
          const finalLevel = actualLevel !== targetLevel ? actualLevel : targetLevel;
          if (!result[finalLevel]) {
            result[finalLevel] = {};
          }

          // Nếu không có category, mặc định là 'daily'
          const topic = category || 'daily';
          
          // Validate topic
          const validTopics = ['office', 'social', 'school', 'shopping', 'daily', 'travel', 'food', 'health'];
          if (!validTopics.includes(topic)) {
            totalErrors++;
            console.warn(`Dòng ${i + 1} có category không hợp lệ: ${topic}`, row);
            continue;
          }
          
          if (!result[finalLevel][topic]) {
            result[finalLevel][topic] = [];
          }

          const sentence: Sentence = {
            chinese,
            pinyin,
            vietnamese,
            category: topic
          };

          // Check duplicate - chỉ check chữ Hán trong cùng level và topic
          const existingChinese = new Set(result[finalLevel][topic].map(s => s.chinese));
          const isDuplicate = existingChinese.has(sentence.chinese);

          if (!isDuplicate) {
            result[finalLevel][topic].push(sentence);
            existingChinese.add(sentence.chinese);
            totalAdded++;
            topicStats[topic] = (topicStats[topic] || 0) + 1;
          }
        }

        // Save result
        saveCustomSentences(result);

        // Nếu có HSK level trong file, có thể import vào nhiều level khác nhau
        const levelMsg = hasHeader && levelIndex >= 0 
          ? 'các level' 
          : targetLevel.toUpperCase();
        const topicList = Object.keys(topicStats).join(', ');
        const message = `Import thành công! Đã thêm ${totalAdded} câu vào ${levelMsg}${topicList ? ` (${topicList})` : ''}${totalErrors > 0 ? `, ${totalErrors} lỗi đã bỏ qua.` : '.'}`;
        resolve({ success: true, message, added: totalAdded, errors: totalErrors });
      } catch (error) {
        console.error('Error importing sentences from Excel:', error);
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
