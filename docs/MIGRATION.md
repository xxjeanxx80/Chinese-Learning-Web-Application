# MikuHan — Migration Guide (localStorage → Supabase)

## 0. Nguyên tắc

1. **Không sửa component.** Tất cả 8 file `*Storage.ts` giữ nguyên chữ ký hàm (sync). Chỉ đổi implementation bên trong.
2. **Component import không đổi** (`from '../../utils/vocabularyStorage'` vẫn đúng).
3. **Migration dữ liệu người dùng hiện tại là client-side**: lần chạy đầu sau deploy đọc localStorage cũ → IndexedDB → sync lên Supabase. Không cần migrate server-side.
4. **Phase 0 (IndexedDB) phải chạy trước Phase 1 (Supabase)** — mọi phase sau đứng trên Phase 0.

## 1. Phase 0 — Refactor storage sang IndexedDB

### 1.1. Cấu trúc thư mục mới

```
src/storage/
  db.ts            # IndexedDB wrapper (idb-keyval tự viết, không thêm dep)
  types.ts         # 7 entity + storage key enum
  index.ts         # API tương thích ngược (re-export cho *Storage.ts)
  syncQueue.ts     # outbox queue (append-only)
  migrate.ts       # localStorage → IndexedDB migration
```

### 1.2. Mapping localStorage → IndexedDB

| localStorage key | IndexedDB store | Entity |
|---|---|---|
| `hsk_custom_vocabularies` | `custom_vocab` | `CustomVocabulary` |
| `hsk_vocabulary_overrides` | `vocab_overrides` | `VocabularyOverride` |
| `hsk_custom_sentences` | `custom_sentences` | `CustomSentence` |
| `hsk_learned_vocabularies` | `learned_vocab` | `LearnedVocab` |
| `hsk_learned_sentences` | `learned_sentences` | `LearnedSentence` |
| `hsk_wrong_answers` | `wrong_vocab` | `WrongVocab` |
| `hsk_sentence_wrong_answers` | `wrong_sentences` | `WrongSentence` |
| `hsk_statistics` | `statistics` | `Statistics` |
| `hsk_session_*` | `session_progress` | `SessionProgress` |
| (preference nhẹ) | vẫn `localStorage` | `showPinyin*`, `custom_app_background` |

### 1.3. Chiến lược "API sync giữ nguyên"

Vì component gọi `getCustomVocabularies()` sync và dùng kết quả ngay, không thể trả Promise. Giải pháp:

- **Cache in-memory** trong `src/storage/index.ts`: IndexedDB load một lần khi app khởi động → lưu vào Map in-memory.
- `getX()` đọc từ cache (sync, 0ms).
- `saveX()` cập nhật cache + ghi IndexedDB async + push vào outbox.
- App startup: `await initStorage()` trong `main.tsx` trước `ReactDOM.createRoot` (hoặc Suspense). Nếu IndexedDB trống → migrate từ localStorage.

### 1.4. Migration localStorage → IndexedDB

`migrate.ts`:
```ts
export async function migrateFromLocalStorage() {
  const MIGRATED_KEY = 'hsk_migrated_to_idb_v1';
  if (localStorage.getItem(MIGRATED_KEY)) return;
  // đọc từng key, JSON.parse, ghi vào IndexedDB store tương ứng
  // sau khi verify count, xoá key cũ
  localStorage.setItem(MIGRATED_KEY, new Date().toISOString());
}
```

Idempotent: chạy nhiều lần không sao. Có version trong key để migrate lại nếu schema đổi.

### 1.5. Export/Import JSON (backup tay)

- `exportAllData()` → JSON chứa cả 7 store + version + timestamp.
- `importAllData(file, mode: 'merge'|'replace')`.
- Thêm nút "Sao lưu / Khôi phục" trong Settings hoặc Sidebar.
- Đây là feature marketing + safety net độc lập backend.

### 1.6. Verification Phase 0

- [ ] `npm run build` pass
- [ ] Mở app → IndexedDB có dữ liệu (DevTools → Application → IndexedDB)
- [ ] Thêm từ custom → reload → vẫn còn
- [ ] Migrate từ localStorage cũ không mất dữ liệu (test bằng cách import data cũ vào localStorage rồi reload)
- [ ] Export JSON → import lại → dữ liệu khớp
- [ ] Component không sửa import path

## 2. Phase 1 — Supabase Singapore

### 2.1. Tạo project

- Supabase Dashboard → New project → **Region: Southeast Asia (Singapore)** (`ap-southeast-1`).
- Region chỉ set được lúc tạo, không đổi sau → tạo đúng từ đầu.
- Free tier: 500MB DB / 1GB egress — dữ liệu app vài chục KB, dư cả năm.

### 2.2. Env vars (Vercel + `.env.local`)

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```
Chỉ anon key. `service_role` không bao giờ vào frontend.

### 2.3. SQL migration (`supabase/migrations/001_init.sql`)

Xem `docs/CHECKLIST.md` mục "SQL".

### 2.4. Auth

- Magic Link (email OTP) hoặc OTP điện thoại.
- Supabase JS SDK lưu token an toàn, refresh tự động.
- **Không tự code token trong localStorage.**

### 2.5. Client (`src/sync/`)

```
src/sync/
  supabase.ts       # createClient(url, anonKey)
  syncEngine.ts     # flush/pull/backoff/idempotency
  auth.ts           # signIn/signOut/session listener
```

### 2.6. Vercel config

- `vercel.json`: thêm `https://<ref>.supabase.co` vào `connect-src` của CSP.
- Đặt `"regions": ["sin1"]` cho project (Hobby cho 1 region) — để TTS function và mọi function sau này chạy gần DB.

### 2.7. Migration dữ liệu người dùng hiện tại

Không cần migrate server-side. Người dùng cũ mở app lần đầu sau deploy → client đọc IndexedDB cũ → sync lên Supabase dưới user mới.

## 3. Phase 2 — Tính năng chỉ làm được khi có server

- **Review Queue SRS** (SM-2 rút gọn): `srs_box` + `srs_due_at` → màn hình "Ôn hôm nay".
- **Streak server-side**: tính từ `study_events` + timezone `Asia/Ho_Chi_Minh` → đổi thiết bị không mất streak.
- **Nhật ký lỗi có lý do**: `meta` trong `study_events` lưu *sai ở đâu* → sinh "bài sửa" theo chủ đề.

## 4. Phase 3–4 — Moat khác biệt (không phụ thuộc backend)

- Hán-Việt bridge (offline, `pinyin-pro` + bảng gốc)
- Tone trainer (Web Audio pitch contour)
- PWA offline
- Text reader + deck chia sẻ

## 5. Rollback

Nếu Phase 1 lỗi, Phase 0 vẫn chạy (IndexedDB + export/import). Người dùng không mất dữ liệu. Chỉ cần tắt sync (env `VITE_SYNC_ENABLED=false`) → app quay về local-only.
