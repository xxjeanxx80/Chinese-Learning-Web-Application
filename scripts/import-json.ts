import * as fs from 'fs';
import * as path from 'path';

interface Vocabulary {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

interface VocabularyByLevel {
  [key: string]: Vocabulary[];
}

function importFromJSON(jsonFilePath: string): void {
  try {
    // Đọc file JSON
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf-8');
    const vocabularyByLevel: VocabularyByLevel = JSON.parse(jsonContent);

    // Validate và chuẩn hóa dữ liệu
    const validLevels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5'];
    const normalizedData: VocabularyByLevel = {
      hsk1: [],
      hsk2: [],
      hsk3: [],
      hsk4: [],
      hsk5: []
    };

    for (const [level, words] of Object.entries(vocabularyByLevel)) {
      const normalizedLevel = level.toLowerCase().trim();
      if (validLevels.includes(normalizedLevel)) {
        normalizedData[normalizedLevel] = words.map(word => ({
          chinese: word.chinese.trim(),
          pinyin: word.pinyin.trim(),
          vietnamese: word.vietnamese.trim()
        }));
      } else {
        console.warn(`⚠️  Cấp độ "${level}" không hợp lệ. Bỏ qua.`);
      }
    }

    // Tạo nội dung TypeScript
    let tsContent = `export interface Vocabulary {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

`;

    // Generate code cho từng level
    for (const [level, words] of Object.entries(normalizedData)) {
      tsContent += `export const ${level}: Vocabulary[] = [\n`;
      words.forEach((word) => {
        tsContent += `  { chinese: "${word.chinese}", pinyin: "${word.pinyin}", vietnamese: "${word.vietnamese}" },\n`;
      });
      tsContent += `];\n\n`;
    }

    // Generate hskVocabulary object
    tsContent += `export const hskVocabulary: Record<string, Vocabulary[]> = {\n`;
    Object.keys(normalizedData).forEach((level) => {
      tsContent += `  ${level},\n`;
    });
    tsContent += `};\n`;

    // Ghi vào file vocabulary.ts
    const outputPath = path.join(__dirname, '../src/data/vocabulary.ts');
    fs.writeFileSync(outputPath, tsContent, 'utf-8');

    // Thống kê
    console.log('✅ Import thành công!');
    console.log('\n📊 Thống kê:');
    Object.entries(normalizedData).forEach(([level, words]) => {
      console.log(`  ${level}: ${words.length} từ`);
    });
    console.log(`\n📝 File đã được cập nhật: ${outputPath}`);

  } catch (error) {
    console.error('❌ Lỗi khi import JSON:', error);
    process.exit(1);
  }
}

// Lấy file JSON từ tham số dòng lệnh hoặc sử dụng file mặc định
const jsonFile = process.argv[2] || path.join(__dirname, '../data/vocabulary-template.json');

if (!fs.existsSync(jsonFile)) {
  console.error(`❌ File không tồn tại: ${jsonFile}`);
  console.log('\n💡 Cách sử dụng:');
  console.log('  npm run import:json <đường-dẫn-file.json>');
  console.log('  Hoặc đặt file JSON vào: data/vocabulary-template.json');
  process.exit(1);
}

console.log(`📂 Đang import từ: ${jsonFile}\n`);
importFromJSON(jsonFile);

