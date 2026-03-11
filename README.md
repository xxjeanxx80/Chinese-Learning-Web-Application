# App Học Tiếng Trung HSK

Ứng dụng web học tiếng Trung với 5 cấp độ HSK (HSK 1 - HSK 5), bao gồm nhiều chức năng luyện tập đa dạng.

## Tính năng

### 5 Cấp độ HSK
- **HSK 1**: Từ vựng cơ bản (25 từ)
- **HSK 2**: Từ vựng sơ cấp (25 từ)
- **HSK 3**: Từ vựng trung cấp (25 từ)
- **HSK 4**: Từ vựng trung cao cấp (25 từ)
- **HSK 5**: Từ vựng cao cấp (25 từ)

### 4 Chức năng luyện tập

1. **✅ Kiểm tra từ vựng**
   - Hiển thị từ tiếng Trung và nghĩa tiếng Việt
   - Yêu cầu nhập pinyin
   - Tự động kiểm tra và chấm điểm

2. **🃏 Flashcard**
   - Học từ vựng dạng thẻ
   - Click để lật thẻ xem nghĩa và pinyin
   - Theo dõi số từ đã học

3. **✍️ Luyện viết**
   - Hiển thị pinyin và nghĩa
   - Yêu cầu nhập chữ Hán hoặc chọn đáp án
   - Hai chế độ: nhập tay hoặc chọn đáp án

4. **🎲 Luyện tập ngẫu nhiên**
   - Trộn các loại câu hỏi: pinyin, chữ Hán, nghĩa
   - Tự động chuyển đổi giữa các dạng bài tập
   - Luyện tập tổng hợp toàn diện

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy ứng dụng ở chế độ development
npm run dev

# Build ứng dụng
npm run build

# Preview build
npm run preview
```

### Cấu hình DeepL (Dịch thuật)

DeepL chặn gọi trực tiếp từ browser (CORS), nên cần dùng proxy backend:

1. **Deploy lên Vercel**: Vào Project > Settings > Environment Variables, thêm biến `DEEPL_API_KEY` với API key của bạn (key `:fx` = free).
2. **Chạy local với DeepL**: Dùng `vercel dev` thay cho `npm run dev`, và tạo file `.env.local` với `DEEPL_API_KEY=...`.

## Import Từ Vựng

Thay vì nhập tay, bạn có thể import từ vựng từ CSV hoặc JSON:

### Import từ CSV (Dễ nhất) ⭐

1. Tạo file CSV với format:
```csv
level,chinese,pinyin,vietnamese
hsk1,你好,nǐ hǎo,xin chào
hsk1,再见,zài jiàn,tạm biệt
```

2. Chạy lệnh:
```bash
npm run import:csv data/your-file.csv
```

### Import từ JSON

1. Tạo file JSON theo template
2. Chạy lệnh:
```bash
npm run import:json data/your-file.json
```


**Nguồn dữ liệu gợi ý:**
- Copy từ bảng Excel/Google Sheets
- Tải từ các trang web HSK (HSK Academy, Laoshi.io)
- Sử dụng file CSV/JSON có sẵn trên mạng

## Công nghệ sử dụng

- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **CSS3** - Styling với gradient và animations

## Cấu trúc dự án

```
src/
├── components/          # Các components
│   ├── TabNavigation.tsx
│   ├── CheckVocabulary.tsx
│   ├── Flashcard.tsx
│   ├── PracticeWriting.tsx
│   └── RandomPractice.tsx
├── data/               # Dữ liệu từ vựng
│   └── vocabulary.ts
├── App.tsx            # Component chính
├── App.css
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## Sử dụng

1. Chọn cấp độ HSK (1-5) ở tab navigation
2. Chọn chức năng luyện tập mong muốn
3. Bắt đầu học và luyện tập!

## Ghi chú

- Tất cả từ vựng được normalize (chuyển về lowercase, loại bỏ khoảng trắng thừa) khi so sánh đáp án
- Pinyin có thể nhập với hoặc không có tone marks
- Hỗ trợ cả chế độ nhập tay và chọn đáp án cho một số bài tập

## Phát triển thêm

Có thể mở rộng thêm:
- Thêm nhiều từ vựng cho mỗi cấp độ
- Thêm âm thanh phát âm
- Lưu tiến độ học tập
- Thống kê chi tiết
- Chế độ luyện tập theo từ đã sai

