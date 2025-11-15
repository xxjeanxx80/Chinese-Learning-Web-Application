import * as fs from 'fs';
import * as path from 'path';

/**
 * Script mẫu để fetch từ vựng từ API
 * Bạn có thể chỉnh sửa để phù hợp với API thực tế
 */

interface Vocabulary {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

interface VocabularyByLevel {
  [key: string]: Vocabulary[];
}

/**
 * Ví dụ: Fetch từ API công khai
 * Thay đổi URL và logic parse dữ liệu theo API bạn sử dụng
 */
async function fetchFromAPI(): Promise<VocabularyByLevel> {
  const vocabularyByLevel: VocabularyByLevel = {
    hsk1: [],
    hsk2: [],
    hsk3: [],
    hsk4: [],
    hsk5: []
  };

  // TODO: Thay đổi URL API thực tế
  const apiUrls = {
    hsk1: 'https://api.example.com/hsk1',
    hsk2: 'https://api.example.com/hsk2',
    // ... thêm các level khác
  };

  try {
    for (const [level, url] of Object.entries(apiUrls)) {
      console.log(`📡 Đang fetch ${level} từ ${url}...`);
      
      // Ví dụ với fetch (Node.js 18+ có fetch native)
      // Nếu dùng Node.js cũ hơn, cần install: npm install node-fetch
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // TODO: Parse dữ liệu theo format API trả về
      // Ví dụ:
      // vocabularyByLevel[level] = data.map(item => ({
      //   chinese: item.character,
      //   pinyin: item.pinyin,
      //   vietnamese: item.meaning
      // }));

      console.log(`  ✓ Đã lấy ${vocabularyByLevel[level].length} từ cho ${level}`);
    }
  } catch (error) {
    console.error('❌ Lỗi khi fetch từ API:', error);
    throw error;
  }

  return vocabularyByLevel;
}

/**
 * Lưu dữ liệu vào file CSV để có thể chỉnh sửa sau
 */
function saveToCSV(data: VocabularyByLevel, outputPath: string): void {
  let csvContent = 'level,chinese,pinyin,vietnamese\n';
  
  for (const [level, words] of Object.entries(data)) {
    words.forEach(word => {
      csvContent += `${level},"${word.chinese}","${word.pinyin}","${word.vietnamese}"\n`;
    });
  }

  fs.writeFileSync(outputPath, csvContent, 'utf-8');
  console.log(`\n💾 Đã lưu vào CSV: ${outputPath}`);
}

/**
 * Generate TypeScript file
 */
function generateTypeScript(data: VocabularyByLevel, outputPath: string): void {
  let tsContent = `export interface Vocabulary {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

`;

  for (const [level, words] of Object.entries(data)) {
    tsContent += `export const ${level}: Vocabulary[] = [\n`;
    words.forEach((word) => {
      tsContent += `  { chinese: "${word.chinese}", pinyin: "${word.pinyin}", vietnamese: "${word.vietnamese}" },\n`;
    });
    tsContent += `];\n\n`;
  }

  tsContent += `export const hskVocabulary: Record<string, Vocabulary[]> = {\n`;
  Object.keys(data).forEach((level) => {
    tsContent += `  ${level},\n`;
  });
  tsContent += `};\n`;

  fs.writeFileSync(outputPath, tsContent, 'utf-8');
  console.log(`📝 Đã cập nhật TypeScript: ${outputPath}`);
}

// Main function
async function main() {
  try {
    console.log('🚀 Bắt đầu fetch từ API...\n');
    
    const data = await fetchFromAPI();
    
    // Lưu vào CSV
    const csvPath = path.join(__dirname, '../data/vocabulary-from-api.csv');
    saveToCSV(data, csvPath);
    
    // Generate TypeScript
    const tsPath = path.join(__dirname, '../src/data/vocabulary.ts');
    generateTypeScript(data, tsPath);
    
    // Thống kê
    console.log('\n📊 Thống kê:');
    Object.entries(data).forEach(([level, words]) => {
      console.log(`  ${level}: ${words.length} từ`);
    });
    
    console.log('\n✅ Hoàn thành!');
  } catch (error) {
    console.error('\n❌ Lỗi:', error);
    console.log('\n💡 Hướng dẫn:');
    console.log('  1. Chỉnh sửa URL API trong file này');
    console.log('  2. Điều chỉnh logic parse dữ liệu theo format API trả về');
    console.log('  3. Chạy lại: npm run fetch:api (cần thêm vào package.json)');
    process.exit(1);
  }
}

// Chạy nếu được gọi trực tiếp
// Lưu ý: Script này là mẫu, cần chỉnh sửa theo API thực tế
// Để sử dụng, uncomment dòng dưới và chỉnh sửa logic fetch:
// main().catch(console.error);

