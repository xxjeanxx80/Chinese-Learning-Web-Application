/**
 * Script import từ vựng từ file Excel ngonngu.xlsx
 * - Đọc file Excel từ public folder
 * - Xóa tất cả từ mặc định
 * - Import lại từ file ngonngu.xlsx vào vocabulary.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

interface Vocabulary {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

interface VocabularyByLevel {
  [level: string]: Vocabulary[];
}

/**
 * Rút gọn nghĩa tiếng Việt xuống dưới 5 từ (tùy chọn)
 */
function shortenVietnameseMeaning(meaning: string): string {
  if (!meaning) return '';
  
  let shortened = meaning.trim();
  
  // Loại bỏ các ký tự đặc biệt không cần thiết
  shortened = shortened
    .replace(/[\[\]{}""'']/g, '')
    .replace(/[;:]/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Tách các nghĩa khác nhau (phân tách bởi dấu phẩy, "/", "|", hoặc "hoặc")
  const separators = [',', '/', '|', ' hoặc ', ' hoặc', 'hoặc '];
  let parts: string[] = [shortened];
  
  for (const sep of separators) {
    const newParts: string[] = [];
    for (const part of parts) {
      newParts.push(...part.split(sep).map(p => p.trim()).filter(p => p));
    }
    parts = newParts;
  }
  
  // Lấy nghĩa đầu tiên
  let firstMeaning = parts[0] || shortened;
  
  // Loại bỏ các cụm từ trong ngoặc đơn
  firstMeaning = firstMeaning.replace(/\([^)]*\)/g, '').trim();
  
  // Giới hạn tối đa 5 từ
  const words = firstMeaning.split(/\s+/).filter(w => w.trim());
  if (words.length > 5) {
    firstMeaning = words.slice(0, 5).join(' ');
  }
  
  return firstMeaning.trim();
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
    
    // Chuyển đổi sang JSON (array of arrays)
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
    
    // Phân tích header để tìm vị trí cột
    const header = rows[0].map((h: any) => String(h).toLowerCase().trim());
    console.log('📋 Header:', header);
    
    // Tìm vị trí các cột (hỗ trợ nhiều tên gọi khác nhau)
    const levelIndex = header.findIndex(h => 
      (h.includes('hsk') && (h.includes('level') || h.includes('cấp') || h.includes('级别'))) || 
      h === 'level' || h === 'hsk_level' || h === 'hsk'
    );
    const chineseIndex = header.findIndex(h => 
      h.includes('chữ hán') || h.includes('chinese') || h.includes('hanzi') || h.includes('汉字') || 
      h.includes('từ') || h === 'char' || h === 'character'
    );
    const pinyinIndex = header.findIndex(h => 
      h.includes('pinyin') || h.includes('拼音')
    );
    const vietnameseIndex = header.findIndex(h => 
      h.includes('tiếng việt') || h.includes('vietnamese') || h.includes('nghĩa') || 
      h.includes('meaning') || h.includes('translation') || h === 'vietnamese' || h === 'vi'
    );
    
    console.log('📍 Column indices:', {
      level: levelIndex,
      chinese: chineseIndex,
      pinyin: pinyinIndex,
      vietnamese: vietnameseIndex
    });
    
    if (chineseIndex === -1 || pinyinIndex === -1) {
      throw new Error('Không tìm thấy cột Chữ Hán hoặc Pinyin! Vui lòng kiểm tra lại file Excel.');
    }
    
    if (vietnameseIndex === -1) {
      throw new Error('Không tìm thấy cột Nghĩa tiếng Việt! Vui lòng kiểm tra lại file Excel.');
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
      
      const hskLevelRaw = levelIndex >= 0 ? String(row[levelIndex] || '').trim() : '';
      const chinese = String(row[chineseIndex] || '').trim();
      const pinyin = String(row[pinyinIndex] || '').trim();
      const vietnameseRaw = String(row[vietnameseIndex] || '').trim();
      
      // Bỏ qua dòng trống
      if (!chinese && !pinyin && !vietnameseRaw) {
        continue;
      }
      
      totalRows++;
      
      // Validate
      if (!chinese || !pinyin || !vietnameseRaw) {
        skippedRows++;
        console.warn(`⚠️  Dòng ${i + 1} thiếu thông tin:`, { chinese, pinyin, vietnamese: vietnameseRaw });
        continue;
      }
      
      // Sử dụng nghĩa gốc (hoặc có thể rút gọn nếu cần)
      const vietnamese = vietnameseRaw; // Hoặc: shortenVietnameseMeaning(vietnameseRaw);
      
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
      
      // Nếu không tìm thấy level hợp lệ, bỏ qua
      if (!level) {
        skippedRows++;
        console.warn(`⚠️  Dòng ${i + 1} không có HSK level hợp lệ:`, { chinese, hskLevel: hskLevelRaw });
        continue;
      }
      
      const vocab: Vocabulary = {
        chinese,
        pinyin,
        vietnamese
      };
      
      vocabularyByLevel[level].push(vocab);
    }
    
    console.log(`\n📊 Thống kê import:`);
    console.log(`  - Tổng dòng: ${totalRows}`);
    console.log(`  - Đã bỏ qua: ${skippedRows}`);
    console.log(`  - Import thành công: ${totalRows - skippedRows}`);
    
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
function main(): void {
  try {
    const excelPath = path.join(__dirname, '../public/ngonngu.xlsx');
    const outputPath = path.join(__dirname, '../src/data/vocabulary.ts');
    
    console.log('📂 Đang đọc file Excel:', excelPath);
    
    if (!fs.existsSync(excelPath)) {
      console.error(`❌ File không tồn tại: ${excelPath}`);
      console.log('\n💡 Vui lòng đảm bảo file ngonngu.xlsx có trong thư mục public/');
      process.exit(1);
    }
    
    // Đọc và parse Excel
    const vocabularyByLevel = readExcelFile(excelPath);
    
    // Generate vocabulary.ts (xóa tất cả và thêm lại)
    generateVocabularyTS(vocabularyByLevel, outputPath);
    
    console.log('\n🎉 Import thành công!');
    console.log('📝 File vocabulary.ts đã được cập nhật với dữ liệu từ ngonngu.xlsx');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

// Chạy script
main();

