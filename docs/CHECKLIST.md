# MikuHan — Implementation Checklist

> Tick từng mục. Mỗi phase phải build pass trước khi sang phase sau.

## Phase A — Tài liệu (DONE)

- [x] `docs/ARCHITECTURE.md` — kiến trúc + data model + security
- [x] `docs/MIGRATION.md` — migration guide
- [x] `docs/CHECKLIST.md` — checklist này

## Phase B0 — IndexedDB foundation

- [x] Tạo `src/storage/types.ts` với 7 entity + storage key enum
- [x] Tạo `src/storage/db.ts` (IndexedDB wrapper, không thêm dep)
- [x] Tạo `src/storage/index.ts` với cache in-memory + API sync giữ nguyên
- [x] `src/main.tsx` gọi `await initStorage()` trước render
- [x] `npm run build` pass

## Phase B1 — Outbox + migration

- [x] `src/storage/syncQueue.ts` (append-only outbox)
- [x] `src/storage/migrate.ts` (localStorage → IndexedDB, idempotent, versioned)
- [x] Verify migration không mất dữ liệu (logic đúng; test manual trước deploy)

## Phase B2 — Migrate 8 file *Storage.ts

- [x] `vocabularyStorage.ts`
- [x] `sentenceStorage.ts`
- [x] `learnedItemsStorage.ts`
- [x] `wrongAnswersStorage.ts`
- [x] `sentenceWrongAnswersStorage.ts`
- [x] `statisticsStorage.ts`
- [x] `sessionProgressStorage.ts`
- [x] Preference nhẹ giữ localStorage (`showPinyin*`, `custom_app_background`)
- [x] `npm run build` pass, không unused locals

## Phase B3 — Export/Import JSON

- [x] `src/storage/backup.ts` (version + timestamp + 7 store)
- [x] UI nút "Sao lưu / Khôi phục" trong header (💾 / 📂)
- [x] Giữ nguyên Excel export hiện tại

## Phase B4 — Verify Phase 0

- [x] `npm run build` pass
- [ ] IndexedDB có dữ liệu (DevTools) — test manual
- [ ] Thêm từ custom → reload → vẫn còn — test manual
- [ ] Migrate từ localStorage cũ không mất — test manual
- [x] Export → Import → dữ liệu khớp (logic đúng; test manual)
- [x] Component import path không đổi

## Phase C1 — Supabase client

- [x] Tạo project Supabase SG (`dljszyawfaeumfdxuqmc`) — region **Southeast Asia (Singapore)**
- [x] `.env.local` + Vercel env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publishable key)
- [x] `src/sync/supabase.ts` (createClient)
- [x] `src/sync/auth.ts` (Magic Link + session listener)
- [x] UI login/logout (`src/components/SyncStatus/`)

## Phase C2 — SQL migration

- [x] `supabase/migrations/001_init.sql`
- [x] Bảng `learning_items` (LWW theo `updated_at`, `deleted` thắng)
- [x] Bảng `study_events` (append-only, dedup theo client id)
- [x] Bảng `custom_content` (LWW)
- [x] Bảng `user_settings`
- [x] RLS bật trên mọi bảng có `user_id`
- [x] Policy `own rows` cho mỗi bảng
- [x] RPC `apply_ops(p_ops jsonb)` idempotent + LWW
- [x] Index `(user_id, updated_at)` cho pull delta
- [x] **Đã apply lên DB Singapore** (`supabase db push` thành công)

## Phase C3 — SyncEngine

- [x] `src/sync/syncEngine.ts` (flush/pull/backoff/idempotency)
- [x] `src/sync/applyRemote.ts` (merge server → local, LWW)
- [x] Flush trigger: `online`, `visibilitychange`, 5s idle, mỗi 30s
- [x] Retry exponential backoff 2s→4s→8s→30s, giữ queue khi fail
- [x] Không `await` DB trước khi update UI
- [x] Test SQL: idempotency ✓, LWW ✓, event dedup ✓, RLS cross-user isolation ✓

## Phase C4 — Deploy config

- [x] `vercel.json`: thêm `https://dljszyawfaeumfdxuqmc.supabase.co` + `wss://` vào `connect-src`
- [x] `vercel.json`: `"regions": ["sin1"]`
- [x] `npm run build` pass
- [ ] Deploy preview → test end-to-end từ VN
- [ ] Measure RTT thực tế (target < 130ms cho 1 round-trip ghi)
- [ ] Thêm env vars vào Vercel dashboard (project hiện chưa có)

## Phase D — Tính năng mới (sau C)

- [x] Review Queue SRS (`srs_box` + `srs_due_at`) — màn "Ôn hôm nay", SM-2 rút gọn box 0–5
- [x] Streak server-side (timezone `Asia/Ho_Chi_Minh`) — `get_streak()` + `study_day_summary()`, test SQL pass
- [ ] Nhật ký lỗi có lý do (`meta` trong `study_events`)
- [x] Hán-Việt bridge (offline) — `src/data/hanViet.ts`, hiện trên thẻ ôn từ vựng
- [ ] Tone trainer (Web Audio)
- [ ] PWA offline
- [ ] Text reader + deck chia sẻ

## Security checklist (mọi phase)

- [ ] Chỉ `anon` key trong frontend
- [ ] `service_role` không bao giờ vào client
- [ ] RLS bật mọi bảng có `user_id`
- [ ] Validate payload trong RPC (whitelist `kind`, giới hạn độ dài)
- [ ] Rate limit endpoint ghi
- [ ] Auth token do Supabase SDK quản lý, không tự code localStorage
- [ ] Export JSON có cảnh báo khi share
- [ ] Không lưu PII trong bảng học
- [ ] CSP `connect-src` cho Supabase
- [ ] Giữ `Strict-Transport-Security`

## Rollback

- Nếu Phase C lỗi: set `VITE_SYNC_ENABLED=false` → app quay local-only (Phase 0 vẫn chạy)
- Dữ liệu người dùng không mất (IndexedDB + export/import)
