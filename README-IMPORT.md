# Hướng dẫn Import Từ Vựng

Tài liệu này hướng dẫn các cách import từ vựng vào ứng dụng mà không cần nhập tay.

## 📋 Các phương pháp

### 1. Import từ CSV (Dễ nhất) ⭐

**Ưu điểm:**
- Dễ dàng copy-paste từ Excel/Google Sheets
- Có thể chỉnh sửa trực tiếp trong file CSV
- Hỗ trợ nhiều từ vựng cùng lúc

**Cách sử dụng:**

1. Tạo/chỉnh sửa file CSV theo format:
```csv
level,chinese,pinyin,vietnamese
hsk1,你好,nǐ hǎo,xin chào
hsk1,再见,zài jiàn,tạm biệt
hsk2,学校,xué xiào,trường học
```

2. Chạy lệnh:
```bash
# Sử dụng file mặc định
npm run import:csv

# Hoặc chỉ định file CSV
npm run import:csv data/my-vocabulary.csv
```

**Template:** Xem file `data/vocabulary-template.csv`

---

### 2. Import từ JSON

**Ưu điểm:**
- Format chuẩn, dễ parse
- Hỗ trợ comment (với JSON5)
- Có thể validate cấu trúc

**Cách sử dụng:**

1. Tạo file JSON theo format:
```json
{
  "hsk1": [
    {
      "chinese": "你好",
      "pinyin": "nǐ hǎo",
      "vietnamese": "xin chào"
    }
  ],
  "hsk2": [...]
}
```

2. Chạy lệnh:
```bash
npm run import:json data/my-vocabulary.json
```

**Template:** Xem file `data/vocabulary-template.json`

---

### 3. Lấy từ nguồn online

#### Option A: Copy từ trang web → CSV

**Các trang web hữu ích:**
- [HSK Academy](https://www.hskacademy.com/) - Có danh sách đầy đủ HSK 1-6
- [Laoshi.io](https://laoshi.io/hsk/vocabulary) - Từ vựng HSK có sẵn
- [Từ điển tam ngữ 5099 từ vựng HSK](https://www.hsk.vn/) - Có tiếng Việt

**Cách làm:**
1. Copy bảng từ vựng từ trang web (Ctrl+C)
2. Paste vào Excel/Google Sheets
3. Chỉnh sửa cột cho đúng format: `level,chinese,pinyin,vietnamese`
4. Xuất ra CSV
5. Chạy `npm run import:csv`

#### Option B: Sử dụng API (cần lập trình)

1. Mở file `scripts/fetch-from-api.ts`
2. Chỉnh sửa URL API và logic parse dữ liệu
3. Chạy script (cần thêm command vào package.json)

**Ví dụ API miễn phí:**
- [Chinese Character API](https://github.com/pwxcoo/chinese-xinhua) (GitHub)
- [Hanzii API](https://hanzii.net/api) (có thể cần API key)

---

### 4. Tạo file CSV từ Excel/Google Sheets

**Bước 1:** Tạo bảng trong Excel với 4 cột:
| level | chinese | pinyin | vietnamese |
|-------|---------|--------|------------|
| hsk1  | 你好    | nǐ hǎo | xin chào   |
| hsk1  | 再见    | zài jiàn | tạm biệt |

**Bước 2:** Lưu file dưới dạng CSV (UTF-8)
- Excel: File → Save As → CSV UTF-8
- Google Sheets: File → Download → CSV

**Bước 3:** Copy file vào thư mục `data/` và chạy:
```bash
npm run import:csv data/your-file.csv
```

---

## 📝 Format dữ liệu

### CSV Format
```csv
level,chinese,pinyin,vietnamese
hsk1,你好,nǐ hǎo,xin chào
hsk2,学校,xué xiào,trường học
```

**Lưu ý:**
- Level phải là: `hsk1`, `hsk2`, `hsk3`, `hsk4`, hoặc `hsk5`
- Có thể có dấu phẩy trong nội dung (sẽ được bao trong quotes)
- Encoding phải là UTF-8

### JSON Format
```json
{
  "hsk1": [
    {
      "chinese": "你好",
      "pinyin": "nǐ hǎo",
      "vietnamese": "xin chào"
    }
  ],
  "hsk2": [...]
}
```

---

## 🔄 Workflow đề xuất

1. **Tìm nguồn dữ liệu** → Copy từ trang web hoặc tải file có sẵn
2. **Chuẩn bị file CSV** → Copy vào Excel, chỉnh format
3. **Import** → Chạy `npm run import:csv`
4. **Kiểm tra** → Chạy app và test từ vựng
5. **Cập nhật** → Chỉnh sửa CSV và import lại khi cần

---

## 💡 Tips

- ✅ **Luôn backup** file `src/data/vocabulary.ts` trước khi import mới
- ✅ **Test với ít từ trước** để đảm bảo format đúng
- ✅ **Sử dụng CSV** cho số lượng lớn (dễ chỉnh sửa trong Excel)
- ✅ **Sử dụng JSON** cho dữ liệu có cấu trúc phức tạp hơn

---

## ❓ Troubleshooting

**Lỗi: File không tồn tại**
→ Kiểm tra đường dẫn file, đảm bảo file có extension `.csv` hoặc `.json`

**Lỗi: Parse CSV**
→ Kiểm tra encoding UTF-8, đảm bảo dòng đầu là header đúng

**Lỗi: Level không hợp lệ**
→ Level phải là `hsk1`, `hsk2`, `hsk3`, `hsk4`, hoặc `hsk5` (viết thường)

**Từ vựng không hiện trong app**
→ Kiểm tra lại format trong file đã import, có thể cần restart dev server

---

## 📚 Tài liệu tham khảo

- [HSK Official Word Lists](http://www.chinesetest.cn/)
- [HSK Vocabulary Lists](https://www.hsk.academy/)
- Template files trong thư mục `data/`

