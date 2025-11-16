/**
 * CVDICT Lookup Module
 * Từ điển Hán Việt CVDICT từ https://github.com/ph0ngp/CVDICT
 * Format CC-CEDICT: Traditional [Simplified] /pinyin/ Vietnamese meaning
 */

import * as fs from 'fs';
import * as path from 'path';

interface CVDICEntry {
  traditional: string;
  simplified: string;
  pinyin: string;
  vietnamese: string;
}

let cvdictCache: Map<string, CVDICEntry[]> | null = null;

/**
 * Parse một dòng CVDICT
 * Format CC-CEDICT: Traditional Simplified [pinyin] /Vietnamese meaning 1/Vietnamese meaning 2/...
 * Ví dụ: 一 一 [yi1] /một/đơn/một cái/
 * Ví dụ: 好 好 [hao3] /tốt/thích hợp; đúng/
 */
function parseCVDICLine(line: string): CVDICEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }
  
  // Format: Traditional Simplified [pinyin] /Vietnamese meaning 1/Vietnamese meaning 2/...
  // Ví dụ: 一 一 [yi1] /một/đơn/một cái/
  // Ví dụ: 好 好 [hao3] /tốt/thích hợp; đúng/
  
  // Tìm pattern: Traditional Simplified [pinyin] /meanings/
  // Lưu ý: Traditional và Simplified có thể có nhiều khoảng trắng, cần match chính xác
  // Ví dụ: "弟弟 弟弟 [di4 di5] /em trai/LT:.../"
  const match = trimmed.match(/^(.+?)\s+(.+?)\s+\[([^\]]+)\]\s+\/(.+)\//);
  
  if (match) {
    const traditional = match[1].trim();
    const simplified = match[2].trim();
    const pinyin = match[3].trim();
    let vietnameseAll = match[4].trim();
    
    // Loại bỏ các phần không phải nghĩa chính (như "LT:", "variant:", etc.)
    // Lấy nghĩa đầu tiên trước các marker đặc biệt
    if (vietnameseAll.includes('/')) {
      vietnameseAll = vietnameseAll.split('/')[0].trim();
    }
    
    // Loại bỏ các marker đặc biệt
    if (vietnameseAll.includes('LT:')) {
      vietnameseAll = vietnameseAll.split('LT:')[0].trim();
    }
    if (vietnameseAll.includes('variant:')) {
      vietnameseAll = vietnameseAll.split('variant:')[0].trim();
    }
    if (vietnameseAll.includes('also:')) {
      vietnameseAll = vietnameseAll.split('also:')[0].trim();
    }
    
    // Lấy nghĩa đầu tiên (các nghĩa cách nhau bằng ; hoặc ,)
    let firstMeaning = vietnameseAll;
    
    if (firstMeaning.includes(';')) {
      firstMeaning = firstMeaning.split(';')[0].trim();
    }
    
    if (firstMeaning.includes(',')) {
      firstMeaning = firstMeaning.split(',')[0].trim();
    }
    
    // Bỏ qua nếu nghĩa rỗng hoặc quá ngắn (có thể là marker)
    if (!firstMeaning || firstMeaning.length < 1) {
      return null;
    }
    
    return {
      traditional,
      simplified,
      pinyin,
      vietnamese: firstMeaning.trim()
    };
  }
  
  return null;
}

/**
 * Load CVDICT từ file local trong public folder
 */
function loadCVDICT(): Map<string, CVDICEntry[]> {
  if (cvdictCache) {
    return cvdictCache;
  }
  
  console.log('📚 Đang đọc CVDICT từ file local...');
  
  try {
    // Đường dẫn đến file CVDICT.u8 trong public folder
    const cvdictPath = path.join(__dirname, '../public/CVDICT.u8');
    
    if (!fs.existsSync(cvdictPath)) {
      throw new Error(`Không tìm thấy file CVDICT.u8 tại: ${cvdictPath}`);
    }
    
    const text = fs.readFileSync(cvdictPath, 'utf-8');
    const lines = text.split('\n');
    
    const dictionary = new Map<string, CVDICEntry[]>();
    
    for (const line of lines) {
      const entry = parseCVDICLine(line);
      if (entry) {
        // Lưu theo cả traditional và simplified
        if (!dictionary.has(entry.traditional)) {
          dictionary.set(entry.traditional, []);
        }
        dictionary.get(entry.traditional)!.push(entry);
        
        if (entry.simplified !== entry.traditional) {
          if (!dictionary.has(entry.simplified)) {
            dictionary.set(entry.simplified, []);
          }
          dictionary.get(entry.simplified)!.push(entry);
        }
      }
    }
    
    cvdictCache = dictionary;
    console.log(`   ✅ Đã đọc ${dictionary.size} từ trong CVDICT\n`);
    
    return dictionary;
  } catch (error) {
    console.error('   ❌ Lỗi khi đọc CVDICT:', error);
    throw error;
  }
}

/**
 * Tra cứu từ trong CVDICT theo chữ Hán
 */
export function lookupCVDICT(chinese: string): string | null {
  try {
    const dictionary = loadCVDICT();
    const entries = dictionary.get(chinese);
    
    if (entries && entries.length > 0) {
      // Lấy nghĩa đầu tiên
      return entries[0].vietnamese;
    }
    
    return null;
  } catch (error) {
    console.warn(`   ⚠️  Lỗi khi tra CVDICT cho "${chinese}":`, error);
    return null;
  }
}

/**
 * Tra cứu hàng loạt từ trong CVDICT
 */
export function lookupCVDICTBatch(chineseWords: string[]): Map<string, string> {
  const results = new Map<string, string>();
  
  try {
    const dictionary = loadCVDICT();
    
    for (const word of chineseWords) {
      const entries = dictionary.get(word);
      if (entries && entries.length > 0) {
        results.set(word, entries[0].vietnamese);
      }
    }
    
    return results;
  } catch (error) {
    console.warn('   ⚠️  Lỗi khi tra CVDICT batch:', error);
    return results;
  }
}

