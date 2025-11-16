/**
 * Script import từ vựng từ file Excel new_hsk_chars.xlsx
 * Format: Thứ tự, Chữ Hán, Pinyin, Tiếng Anh, HSK Level
 * - Sử dụng HSK Level để phân loại từ
 * - Tự động dịch nghĩa tiếng Anh sang tiếng Việt
 * - Kiểm tra và bỏ qua những từ không dịch được
 * - Cập nhật vocabulary.ts theo cấu trúc mới
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { lookupCVDICT, lookupCVDICTBatch } from './cvdict-lookup';

interface Vocabulary {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

interface VocabularyByLevel {
  [level: string]: Vocabulary[];
}

interface ExcelRow {
  order?: number | string;
  chinese?: string;
  pinyin?: string;
  english?: string;
  hskLevel?: number | string;
}

// Dictionary dịch cơ bản từ tiếng Anh sang tiếng Việt (copy từ auto-import-hsk1.ts)
const translationDict: Record<string, string> = {
  // Số đếm
  'one': 'một', 'two': 'hai', 'three': 'ba', 'four': 'bốn', 'five': 'năm',
  'six': 'sáu', 'seven': 'bảy', 'eight': 'tám', 'nine': 'chín', 'ten': 'mười',
  
  // Gia đình
  'father': 'bố', '(informal) father': 'bố', 'mother': 'mẹ', 'son': 'con trai',
  'daughter': 'con gái', 'brother': 'anh/em trai', 'older brother': 'anh trai',
  'brother (elder)': 'anh trai', 'elder brother': 'anh trai', 'younger brother': 'em trai',
  'sister': 'chị/em gái', 'older sister': 'chị gái', 'younger sister': 'em gái',
  
  // Động từ cơ bản
  'to be': 'là', 'not': 'không', 'to have': 'có', 'to do': 'làm', 'to go': 'đi',
  'to come': 'đến', 'to see': 'thấy', 'to look': 'nhìn', 'to see, to look': 'nhìn, thấy',
  'to hear': 'nghe', 'to listen': 'nghe', 'to listen, to hear': 'nghe', 'to speak': 'nói',
  'to say': 'nói', 'to say, to speak': 'nói', 'to eat': 'ăn', 'to drink': 'uống',
  'to sleep': 'ngủ', 'to live': 'sống', 'to work': 'làm việc', 'to learn': 'học',
  'to study': 'học', 'to study, to learn': 'học', 'to read': 'đọc', 'to write': 'viết',
  'to buy': 'mua', 'buy': 'mua', 'purchase': 'mua', 'to sell': 'bán', 'sell': 'bán',
  'to sit': 'ngồi', 'to stand': 'đứng', 'to thank': 'cảm ơn', 'to live, to stay': 'sống, ở',
  
  // Danh từ thời gian
  'year': 'năm', 'month': 'tháng', 'day': 'ngày', 'today': 'hôm nay',
  'yesterday': 'hôm qua', 'tomorrow': 'ngày mai', 'morning': 'buổi sáng',
  'noon': 'buổi trưa', 'afternoon': 'buổi chiều', 'evening': 'buổi tối',
  'night': 'đêm', 'week': 'tuần', 'hour': 'giờ', 'minute': 'phút',
  'now': 'bây giờ', 'time': 'thời gian',
  
  // Danh từ địa điểm
  'home': 'nhà', 'school': 'trường học', 'hospital': 'bệnh viện', 'restaurant': 'nhà hàng',
  'store': 'cửa hàng', 'shop': 'cửa hàng', 'office': 'văn phòng', 'company': 'công ty',
  'place': 'nơi', 'room': 'phòng', 'table': 'bàn', 'chair': 'ghế', 'door': 'cửa',
  'window': 'cửa sổ', 'book': 'sách',
  
  // Màu sắc
  'red': 'đỏ', 'green': 'lục, xanh lá', 'blue': 'xanh dương', 'yellow': 'vàng',
  'white': 'trắng', 'black': 'đen',
  
  // Tính từ
  'big': 'lớn', 'small': 'nhỏ', 'good': 'tốt', 'bad': 'xấu', 'new': 'mới',
  'old': 'cũ', 'long': 'dài', 'short': 'ngắn', 'high': 'cao', 'low': 'thấp',
  'fast': 'nhanh', 'quick': 'nhanh', 'quickly': 'nhanh', 'slow': 'chậm', 'slowly': 'chậm',
  'far': 'xa', 'distant': 'xa', 'far away': 'xa', 'far from': 'xa', 'near': 'gần',
  'close': 'gần', 'nearby': 'gần', 'many': 'nhiều', 'much': 'nhiều', 'many, much': 'nhiều',
  'some': 'một số', 'few': 'ít', 'all': 'tất cả', 'all, both': 'tất cả, cả hai',
  
  // Đại từ
  'i': 'tôi', 'me': 'tôi', 'you': 'bạn', 'he': 'anh ấy', 'she': 'cô ấy',
  'we': 'chúng tôi', 'they': 'họ', 'this': 'này', 'that': 'kia', 'here': 'đây',
  'there': 'đó', 'where': 'ở đâu', 'who': 'ai', 'what': 'cái gì', 'how': 'như thế nào',
  'how much': 'bao nhiêu', 'how many': 'bao nhiêu',
  
  // Khác
  'yes': 'có, đúng', 'no': 'không', 'hello': 'xin chào', 'goodbye': 'tạm biệt',
  'please': 'xin mời, làm ơn', 'thanks': 'cảm ơn', 'thank you': 'cảm ơn',
  'you\'re welcome': 'không có gì', 'sorry': 'xin lỗi', 'excuse me': 'xin lỗi',
  'of': 'của', 'at': 'ở', 'in': 'trong', 'on': 'trên', 'and': 'và', 'or': 'hoặc',
  'but': 'nhưng', 'thing': 'đồ vật', 'person': 'người', 'people': 'người',
  'child': 'trẻ con', 'student': 'học sinh', 'teacher': 'giáo viên', 'doctor': 'bác sĩ',
  'friend': 'bạn', 'food': 'thức ăn', 'water': 'nước', 'tea': 'trà', 'rice': 'cơm',
  'clothes': 'quần áo', 'money': 'tiền', 'car': 'xe hơi', 'taxi': 'taxi',
  'airplane': 'máy bay', 'plane': 'máy bay', 'phone': 'điện thoại', 'telephone': 'điện thoại',
  'computer': 'máy tính', 'television': 'ti vi', 'tv': 'ti vi', 'movie': 'phim',
  'film': 'phim', 'cinema': 'phim', 'motion picture': 'phim', 'cup': 'cốc',
  'dish': 'món ăn', 'dish (type of food)': 'món ăn', 'pen': 'bút', 'paper': 'giấy',
  'letter': 'chữ, thư', 'word': 'từ', 'language': 'ngôn ngữ', 'Chinese': 'tiếng Trung',
  'China': 'Trung Quốc', 'Beijing': 'Bắc Kinh',
  
  // Xử lý các trường hợp đặc biệt
  '(negative prefix)': 'không', '(located) at': 'ở, tại',
  'to make a telephone call': 'gọi điện thoại',
  'roots or stems of plants': 'cái (dùng cho sách)', 'point': 'điểm',
  'unworthy': 'xin lỗi', 'how?': 'như thế nào?', 'variant of 怎麼|怎么[zěn me]': 'như thế nào',
  '(noun suffix)': 'từ bổ nghĩa', 'noun suffix': 'từ bổ nghĩa', 'suffix': 'từ bổ nghĩa',
  'boy': 'con trai', 'girl': 'con gái'
};

/**
 * Làm phẳng (normalize) kết quả dịch
 */
function normalizeTranslation(text: string): string {
  if (!text) return text;
  
  let normalized = text.trim();
  normalized = normalized
    .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ()\.?]/g, '')
    .replace(/[\[\]{}""'']/g, '')
    .replace(/[;:]/g, '')
    .replace(/,+/g, ',')
    .replace(/\s+-+\s+/g, ' ')
    .replace(/^-+\s+|\s+-+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalized;
}

/**
 * Kiểm tra xem text có phải tiếng Anh không
 */
function isEnglish(text: string): boolean {
  if (!text) return false;
  
  const trimmed = text.trim();
  if (!trimmed) return false;
  
  // Kiểm tra có chứa ký tự tiếng Việt không
  const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i;
  if (vietnameseChars.test(trimmed)) {
    return false;
  }
  
  // Kiểm tra có chứa chữ Hán không
  const chineseChars = /[\u4e00-\u9fff]/;
  if (chineseChars.test(trimmed)) {
    return false;
  }
  
  // Loại trừ các từ tiếng Việt thông dụng đã chuyển sang Latin
  const vietnameseWordsInLatin = /\b(phim|quan|quen|dong|dong|viet|nam|con|trai|gai|anh|chi|em|me|bo|cha|ba|nhanh|mua|ban|xa|gan|toi|ban|ho|day|do|day|kia|nay|nua|nua|xa|gan|to|nho|tot|xau|moi|cu|dai|ngan|cao|thap|nhieu|it|tat|ca|mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi|an|uong|ngu|lam|hoc|doc|viet|di|den|thay|nhin|nghe|noi|mua|ban|ngoi|dung|cam|on|song|o|tai|trong|tren|duoi|truoc|sau|ben|giua|ngoai|day|nhu|the|nao|bao|nhieu|khi|nao|ai|gi|o|dau)\b/i;
  if (vietnameseWordsInLatin.test(trimmed)) {
    return false;
  }
  
  const englishPattern = /^[a-z\s()\-\.,'!?;:0-9]+$/i;
  return englishPattern.test(trimmed);
}

/**
 * Dịch nghĩa tiếng Anh sang tiếng Việt
 */
async function translateToVietnamese(english: string, chinese?: string, retryCount: number = 0): Promise<string> {
  const lower = english.toLowerCase().trim();
  
  // Kiểm tra dictionary trước
  if (translationDict[lower]) {
    return translationDict[lower];
  }
  
  // Kiểm tra các pattern phổ biến
  if (lower.startsWith('to ')) {
    const verb = lower.substring(3);
    if (translationDict[verb]) {
      return translationDict[verb];
    }
  }
  
  // Xử lý các pattern có ngoặc
  if (lower.includes('(') && lower.includes(')')) {
    const main = lower.split('(')[0].trim();
    if (translationDict[main]) {
      return translationDict[main];
    }
  }
  
  // Dùng Translate API
  let translatedResult = english;
  
  try {
    const cleanText = english.replace(/\([^)]*\)/g, '').trim();
    if (!cleanText) {
      return english;
    }
    
    // Google Translate API
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(cleanText)}`,
        { method: 'GET', mode: 'cors' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data[0])) {
          const translated = data[0]
            .map((item: any) => item && item[0] ? item[0] : '')
            .filter((text: string) => text)
            .join('')
            .trim();
          
          if (translated && translated !== cleanText) {
            translatedResult = normalizeTranslation(translated);
          }
        }
      }
    } catch (error) {
      // Tiếp tục thử API khác
    }
    
    // Fallback: MyMemory API
    if (isEnglish(translatedResult) && retryCount < 2) {
      try {
        const fallbackResponse = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|vi`
        );
        
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          if (data?.responseData?.translatedText) {
            const translated = data.responseData.translatedText.trim();
            if (translated && translated.toLowerCase() !== cleanText.toLowerCase()) {
              translatedResult = normalizeTranslation(translated);
            }
          }
        }
      } catch (error) {
        // Bỏ qua lỗi
      }
    }
    
    // Retry nếu vẫn là tiếng Anh
    if (isEnglish(translatedResult) && retryCount < 2) {
      const moreCleanText = cleanText.replace(/[()\-.,'!?;:]/g, ' ').trim();
      if (moreCleanText && moreCleanText !== cleanText) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return translateToVietnamese(moreCleanText, chinese, retryCount + 1);
      }
    }
  } catch (error) {
    // Nếu API lỗi, tiếp tục với CVDICT
  }
  
  // Nếu API không dịch được, dùng CVDICT lookup
  if (isEnglish(translatedResult) && chinese) {
    try {
      const cvdictMeaning = lookupCVDICT(chinese);
      if (cvdictMeaning && cvdictMeaning.trim() && !isEnglish(cvdictMeaning)) {
        return normalizeTranslation(cvdictMeaning.trim());
      }
    } catch (error) {
      // CVDICT không load được
    }
  }
  
  return normalizeTranslation(translatedResult);
}

/**
 * Dịch hàng loạt
 */
async function translateBatch(
  words: Vocabulary[],
  batchSize: number = 10,
  delayMs: number = 500
): Promise<Vocabulary[]> {
  const results: Vocabulary[] = [];
  const wordsNeedingCVDICT: Vocabulary[] = [];
  
  console.log('🌐 Đang dịch bằng Translate API (Google Translate + MyMemory)...');
  
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    
    console.log(`   Đang dịch batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(words.length / batchSize)}...`);
    
    const batchPromises = batch.map(async (word) => {
      const needsTranslation = !word.vietnamese || isEnglish(word.vietnamese);
      
      if (needsTranslation) {
        const original = word.vietnamese || '';
        let translated = await translateToVietnamese(original, word.chinese, 0);
        
        if (isEnglish(translated) && original !== translated) {
          await new Promise(resolve => setTimeout(resolve, 300));
          translated = await translateToVietnamese(translated, word.chinese, 1);
        }
        
        if (!isEnglish(translated) && translated !== original) {
          return { ...word, vietnamese: translated };
        } else {
          wordsNeedingCVDICT.push(word);
          return null;
        }
      } else {
        return word;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    for (const result of batchResults) {
      if (result) {
        results.push(result);
      }
    }
    
    if (i + batchSize < words.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Dùng CVDICT cho các từ không dịch được bằng API
  if (wordsNeedingCVDICT.length > 0) {
    console.log(`\n📖 Đang tra cứu CVDICT cho ${wordsNeedingCVDICT.length} từ chưa dịch...`);
    
    const chineseWords = wordsNeedingCVDICT.map(w => w.chinese);
    const cvdictResults = lookupCVDICTBatch(chineseWords);
    console.log(`   ✅ Tìm thấy ${cvdictResults.size}/${chineseWords.length} từ trong CVDICT\n`);
    
    for (const word of wordsNeedingCVDICT) {
      const original = word.vietnamese || '';
      let translated = original;
      
      if (cvdictResults.has(word.chinese)) {
        translated = cvdictResults.get(word.chinese)!;
      } else {
        const cvdictMeaning = lookupCVDICT(word.chinese);
        if (cvdictMeaning && !isEnglish(cvdictMeaning)) {
          translated = cvdictMeaning;
        }
      }
      
      const normalizedTranslated = normalizeTranslation(translated);
      
      if (isEnglish(normalizedTranslated)) {
        console.warn(`   ⚠️  Không dịch được: "${word.chinese}" (${original})`);
      }
      
      results.push({ ...word, vietnamese: normalizedTranslated });
    }
  }
  
  return results;
}

/**
 * Đọc file Excel và parse dữ liệu
 */
function readExcelFile(excelPath: string): VocabularyByLevel {
  try {
    // Đọc file Excel
    const workbook = XLSX.readFile(excelPath);
    
    // Lấy sheet đầu tiên
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Chuyển đổi sang JSON (array of objects với header)
    const rows = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '' 
    }) as any[][];
    
    if (rows.length < 2) {
      console.warn('⚠️  File Excel không có dữ liệu hoặc chỉ có header');
      return {
        hsk1: [],
        hsk2: [],
        hsk3: [],
        hsk4: [],
        hsk5: []
      };
    }
    
    // Phân tích header để tìm vị trí các cột
    const header = rows[0].map((h: any) => String(h).toLowerCase().trim());
    console.log('📋 Header:', header);
    
    // Tìm vị trí các cột (hỗ trợ nhiều tên gọi khác nhau)
    const orderIndex = header.findIndex(h => 
      h.includes('thứ tự') || h.includes('order') || h === 'id' || h.includes('stt')
    );
    const chineseIndex = header.findIndex(h => 
      h.includes('chữ hán') || h.includes('chinese') || h.includes('hanzi') || h.includes('汉字') || 
      h.includes('từ') || h === 'char' || h === 'character'
    );
    const pinyinIndex = header.findIndex(h => 
      h.includes('pinyin') || h.includes('拼音')
    );
    const englishIndex = header.findIndex(h => 
      h.includes('tiếng anh') || h.includes('english') || h.includes('nghĩa') || 
      h.includes('meaning') || h === 'translation'
    );
    const levelIndex = header.findIndex(h => 
      (h.includes('hsk') && (h.includes('level') || h.includes('cấp') || h.includes('级别'))) || 
      h === 'level' || h === 'hsk_level' || h === 'hsk'
    );
    
    console.log('📍 Column indices:', {
      order: orderIndex,
      chinese: chineseIndex,
      pinyin: pinyinIndex,
      english: englishIndex,
      level: levelIndex
    });
    
    if (chineseIndex === -1 || pinyinIndex === -1) {
      throw new Error('Không tìm thấy cột Chữ Hán hoặc Pinyin! Vui lòng kiểm tra lại file Excel.');
    }
    
    // Phân loại từ vựng theo HSK level
    const vocabularyByLevel: VocabularyByLevel = {
      hsk1: [],
      hsk2: [],
      hsk3: [],
      hsk4: [],
      hsk5: []
    };
    
    let totalRows = 0;
    let skippedRows = 0;
    
    // Bỏ qua header, bắt đầu từ dòng 2
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      const chinese = String(row[chineseIndex] || '').trim();
      const pinyin = String(row[pinyinIndex] || '').trim();
      const english = englishIndex >= 0 ? String(row[englishIndex] || '').trim() : '';
      const hskLevelRaw = levelIndex >= 0 ? String(row[levelIndex] || '').trim() : '';
      
      // Bỏ qua dòng trống
      if (!chinese && !pinyin) {
        continue;
      }
      
      totalRows++;
      
      // Validate
      if (!chinese || !pinyin) {
        skippedRows++;
        console.warn(`⚠️  Dòng ${i + 1} thiếu thông tin:`, { chinese, pinyin });
        continue;
      }
      
      // Xác định HSK level
      let level: string | null = null;
      
      if (hskLevelRaw) {
        // Extract số từ level (ví dụ: "1", "HSK1", "hsk1", "HSK 1")
        const levelMatch = hskLevelRaw.match(/\d+/);
        if (levelMatch) {
          const levelNum = parseInt(levelMatch[0]);
          if (levelNum >= 1 && levelNum <= 5) {
            level = `hsk${levelNum}`;
          }
        }
      }
      
      // Nếu không tìm thấy level trong cột, có thể xử lý theo logic khác
      // Hiện tại, bỏ qua các từ không có level
      if (!level) {
        skippedRows++;
        console.warn(`⚠️  Dòng ${i + 1} không có HSK level hợp lệ:`, { chinese, hskLevel: hskLevelRaw });
        continue;
      }
      
      const vocab: Vocabulary = {
        chinese,
        pinyin,
        vietnamese: english || '' // Tạm thời dùng tiếng Anh, sẽ dịch sau
      };
      
      vocabularyByLevel[level].push(vocab);
    }
    
    console.log(`\n📊 Thống kê đọc Excel:`);
    console.log(`  - Tổng dòng: ${totalRows}`);
    console.log(`  - Đã bỏ qua: ${skippedRows}`);
    console.log(`  - Đã đọc thành công: ${totalRows - skippedRows}`);
    
    return vocabularyByLevel;
  } catch (error) {
    console.error('❌ Lỗi khi đọc file Excel:', error);
    throw error;
  }
}

/**
 * Tạo file vocabulary.ts từ dữ liệu đã phân loại
 */
function generateVocabularyTS(vocabularyByLevel: VocabularyByLevel, outputPath: string): void {
  let tsContent = `export interface Vocabulary {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

`;

  // Generate code cho từng level
  for (const [level, words] of Object.entries(vocabularyByLevel)) {
    tsContent += `export const ${level}: Vocabulary[] = [\n`;
    words.forEach((word) => {
      // Escape các ký tự đặc biệt trong string
      const chinese = word.chinese.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const pinyin = word.pinyin.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const vietnamese = word.vietnamese.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      
      tsContent += `  { chinese: "${chinese}", pinyin: "${pinyin}", vietnamese: "${vietnamese}" },\n`;
    });
    tsContent += `];\n\n`;
  }

  // Generate hskVocabulary object
  tsContent += `export const hskVocabulary: Record<string, Vocabulary[]> = {\n`;
  Object.keys(vocabularyByLevel).forEach((level) => {
    tsContent += `  ${level},\n`;
  });
  tsContent += `};\n`;

  // Ghi vào file
  fs.writeFileSync(outputPath, tsContent, 'utf-8');
  
  // Thống kê
  console.log('\n✅ Đã cập nhật vocabulary.ts!');
  console.log('\n📊 Thống kê từ vựng theo level:');
  Object.entries(vocabularyByLevel).forEach(([level, words]) => {
    console.log(`  - ${level.toUpperCase()}: ${words.length} từ`);
  });
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    const excelPath = path.join(__dirname, '../public/new_hsk_chars.xlsx');
    const outputPath = path.join(__dirname, '../src/data/vocabulary.ts');
    
    console.log('📂 Đang đọc file Excel:', excelPath);
    
    if (!fs.existsSync(excelPath)) {
      console.error(`❌ File không tồn tại: ${excelPath}`);
      console.log('\n💡 Vui lòng đảm bảo file new_hsk_chars.xlsx có trong thư mục public/');
      process.exit(1);
    }
    
    // Đọc và parse Excel
    const vocabularyByLevelRaw = readExcelFile(excelPath);
    
    // Dịch tất cả từ tiếng Anh sang tiếng Việt
    console.log('\n🔄 Đang dịch từ tiếng Anh sang tiếng Việt...\n');
    const vocabularyByLevel: VocabularyByLevel = {
      hsk1: [],
      hsk2: [],
      hsk3: [],
      hsk4: [],
      hsk5: []
    };
    
    for (const [level, words] of Object.entries(vocabularyByLevelRaw)) {
      if (words.length > 0) {
        console.log(`📝 Đang dịch ${level.toUpperCase()} (${words.length} từ)...`);
        
        // Dịch batch
        const translatedWords = await translateBatch(words);
        
        // Lọc ra những từ đã dịch sang tiếng Việt (bỏ qua những từ vẫn là tiếng Anh)
        const validWords = translatedWords.filter(word => {
          if (!word.vietnamese || word.vietnamese.trim() === '') {
            return false; // Bỏ qua nếu không có nghĩa
          }
          
          const normalized = normalizeTranslation(word.vietnamese);
          const stillEnglish = isEnglish(normalized);
          
          if (stillEnglish) {
            console.warn(`   ⚠️  Bỏ qua "${word.chinese}" - không dịch được (${word.vietnamese})`);
            return false; // Bỏ qua nếu vẫn là tiếng Anh sau khi dịch
          }
          
          return true; // Giữ lại nếu đã dịch sang tiếng Việt
        });
        
        vocabularyByLevel[level] = validWords;
        console.log(`   ✅ ${level.toUpperCase()}: ${validWords.length}/${words.length} từ đã dịch thành công\n`);
      }
    }
    
    // Generate vocabulary.ts
    generateVocabularyTS(vocabularyByLevel, outputPath);
    
    // Thống kê cuối cùng
    console.log('\n📊 Thống kê cuối cùng:');
    let totalTranslated = 0;
    let totalDiscarded = 0;
    for (const [level, words] of Object.entries(vocabularyByLevel)) {
      const originalCount = vocabularyByLevelRaw[level]?.length || 0;
      const translatedCount = words.length;
      const discardedCount = originalCount - translatedCount;
      totalTranslated += translatedCount;
      totalDiscarded += discardedCount;
      console.log(`  - ${level.toUpperCase()}: ${translatedCount}/${originalCount} từ (bỏ ${discardedCount} từ không dịch được)`);
    }
    console.log(`\n  Tổng: ${totalTranslated} từ đã dịch, ${totalDiscarded} từ đã bỏ qua`);
    
    console.log('\n🎉 Import thành công!');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

// Chạy script
main();

