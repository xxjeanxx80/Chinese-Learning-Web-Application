import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

interface VocabularyRow {
  level: string;
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

interface Vocabulary {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

interface VocabularyByLevel {
  [key: string]: Vocabulary[];
}

function importFromCSV(csvFilePath: string): void {
  try {
    // Đọc file CSV
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Parse CSV
    const records: VocabularyRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Nhóm theo level
    const vocabularyByLevel: VocabularyByLevel = {
      hsk1: [],
      hsk2: [],
      hsk3: [],
      hsk4: [],
      hsk5: []
    };

    records.forEach((row) => {
      const level = row.level.toLowerCase().trim();
      if (vocabularyByLevel[level]) {
        vocabularyByLevel[level].push({
          chinese: row.chinese.trim(),
          pinyin: row.pinyin.trim(),
          vietnamese: row.vietnamese.trim()
        });
      } else {
        console.warn(`⚠️  Cấp độ "${level}" không hợp lệ. Bỏ qua: ${row.chinese}`);
      }
    });

    // Tạo nội dung TypeScript
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
        tsContent += `  { chinese: "${word.chinese}", pinyin: "${word.pinyin}", vietnamese: "${word.vietnamese}" },\n`;
      });
      tsContent += `];\n\n`;
    }

    // Generate hskVocabulary object
    tsContent += `export const hskVocabulary: Record<string, Vocabulary[]> = {\n`;
    Object.keys(vocabularyByLevel).forEach((level) => {
      tsContent += `  ${level},\n`;
    });
    tsContent += `};\n`;

    // Ghi vào file vocabulary.ts
    const outputPath = path.join(__dirname, '../src/data/vocabulary.ts');
    fs.writeFileSync(outputPath, tsContent, 'utf-8');

    // Thống kê
    console.log('✅ Import thành công!');
    console.log('\n📊 Thống kê:');
    Object.entries(vocabularyByLevel).forEach(([level, words]) => {
      console.log(`  ${level}: ${words.length} từ`);
    });
    console.log(`\n📝 File đã được cập nhật: ${outputPath}`);

  } catch (error) {
    console.error('❌ Lỗi khi import CSV:', error);
    process.exit(1);
  }
}

// Lấy file CSV từ tham số dòng lệnh hoặc sử dụng file mặc định
const csvFile = process.argv[2] || path.join(__dirname, '../data/vocabulary-template.csv');

if (!fs.existsSync(csvFile)) {
  console.error(`❌ File không tồn tại: ${csvFile}`);
  console.log('\n💡 Cách sử dụng:');
  console.log('  npm run import:csv <đường-dẫn-file.csv>');
  console.log('  Hoặc đặt file CSV vào: data/vocabulary-template.csv');
  process.exit(1);
}

console.log(`📂 Đang import từ: ${csvFile}\n`);
importFromCSV(csvFile);

