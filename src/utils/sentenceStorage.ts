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
      ['Chữ Hán', 'Pinyin', 'Nghĩa tiếng Việt', 'Category'] // Header row
    ];
    
    levels.forEach((lvl) => {
      // Export câu mặc định nếu được yêu cầu
      if (includeDefault) {
        const allTopics = getTopicsForLevel(lvl);
        allTopics.forEach(topic => {
          // Lấy câu mặc định từ data gốc (không bao gồm custom)
          const defaultSentences = getSentencesByLevel(lvl).filter(s => s.category === topic);
          defaultSentences.forEach(sentence => {
            allData.push([
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
 * Format: A1=Chữ Hán, B1=Pinyin, C1=Nghĩa tiếng Việt, D1=Category
 * @param file Excel file
 * @param level Level HSK để import vào
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
        
        if (!result[targetLevel]) {
          result[targetLevel] = {};
        }

        let totalAdded = 0;
        let totalErrors = 0;
        const topicStats: Record<string, number> = {};

        // Bỏ qua dòng header (dòng đầu tiên)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Format: A=Chữ Hán, B=Pinyin, C=Nghĩa tiếng Việt, D=Category
          const chinese = String(row[0] || '').trim();
          const pinyin = String(row[1] || '').trim();
          const vietnamese = String(row[2] || '').trim();
          const category = String(row[3] || '').trim().toLowerCase();
          
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

          // Nếu không có category, mặc định là 'daily'
          const topic = category || 'daily';
          
          // Validate topic
          const validTopics = ['office', 'social', 'school', 'shopping', 'daily', 'travel', 'food', 'health'];
          if (!validTopics.includes(topic)) {
            totalErrors++;
            console.warn(`Dòng ${i + 1} có category không hợp lệ: ${topic}`, row);
            continue;
          }
          
          if (!result[targetLevel][topic]) {
            result[targetLevel][topic] = [];
          }

          const sentence: Sentence = {
            chinese,
            pinyin,
            vietnamese,
            category: topic
          };

          // Check duplicate
          const existingChinese = new Set(result[targetLevel][topic].map(s => s.chinese));
          const existingPinyin = new Set(result[targetLevel][topic].map(s => `${s.pinyin}|${s.vietnamese}`));

          const isDuplicate = existingChinese.has(sentence.chinese) || 
                             existingPinyin.has(`${sentence.pinyin}|${sentence.vietnamese}`);

          if (!isDuplicate) {
            result[targetLevel][topic].push(sentence);
            existingChinese.add(sentence.chinese);
            existingPinyin.add(`${sentence.pinyin}|${sentence.vietnamese}`);
            totalAdded++;
            topicStats[topic] = (topicStats[topic] || 0) + 1;
          }
        }

        // Save result
        saveCustomSentences(result);

        const topicList = Object.keys(topicStats).join(', ');
        const message = `Import thành công! Đã thêm ${totalAdded} câu vào ${targetLevel.toUpperCase()}${topicList ? ` (${topicList})` : ''}${totalErrors > 0 ? `, ${totalErrors} lỗi đã bỏ qua.` : '.'}`;
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
