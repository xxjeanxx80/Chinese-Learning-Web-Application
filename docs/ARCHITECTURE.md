# MikuHan — Local-First + Delta Sync Architecture

## 0. TL;DR

- **Vercel chỉ serve file tĩnh.** Dữ liệu học đi **thẳng** browser → Supabase Singapore, **không qua Vercel**.
- **Local-first**: UI đọc/ghi từ IndexedDB trong 0ms; sync chạy nền, không bao giờ chặn UI.
- **Per-item LWW** (last-write-wins theo `updated_at`), append-only cho event thống kê.
- **Security**: anon key public là an toàn vì RLS chặn ở tầng DB; `service_role` không bao giờ vào client.

## 1. Vì sao delay hiện tại

```
Hiện tại:  VN → Vercel Edge (iad1, Mỹ) → DB (Asia) → browser VN   ≈ 400–700ms/round-trip
```

Hai chặng vật lý cộng dồn. Dữ liệu học rất nhỏ (vài chục KB), nhưng người dùng phải **chờ DB trả lời trước khi render**.

Đo RTT thật từ VN (2026-11-01):

| Đích | TCP handshake |
|---|---|
| AWS Singapore (`ap-southeast-1`) | **83ms** |
| Cloudflare | 90ms |
| AWS Tokyo | 118ms |
| AWS US-East (Vercel `iad1`) | **257ms** |

Singapore nhanh hơn US-East ~3×.

## 2. Kiến trúc mục tiêu

```
┌── Browser VN ─────────────────────────────────────────┐
│  UI render ← IndexedDB (đọc tức thì, 0ms)             │
│  Ghi thao tác → IndexedDB + outbox queue (0ms)        │
│  SyncEngine: batch 50 ops → POST khi idle/online      │
└──────────┬──────────────────────────────┬─────────────┘
           │ (A) file tĩnh                │ (B) dữ liệu
           ▼                              ▼
   Vercel CDN (edge VN)          Supabase Singapore
   ~30ms, cache                  ~100-130ms, chạy nền
                                 └─ PostgREST + RLS + Auth
```

- **(A)** Vercel chỉ trả JS/CSS/HTML. CDN edge gần VN. Không đụng DB.
- **(B)** Request đi thẳng browser → `https://<ref>.supabase.co`. Vercel không nằm trên đường này.

## 3. Data model

### 3.1. Bảng

```sql
learning_items(id, user_id, kind, ref_id, status, srs_box, srs_due_at,
               wrong_count, updated_at, deleted)      -- LWW theo updated_at
study_events(id, user_id, ts, kind, level, correct, duration_ms, meta) -- append-only
custom_content(user_id, kind, payload jsonb, updated_at)  -- vocab/câu custom
user_settings(user_id, key, value, updated_at)
```

### 3.2. Conflict policy

- `learning_items` cùng `(user_id, kind, ref_id)` → lấy `updated_at` mới hơn. `deleted` luôn thắng.
- `study_events` chỉ append, không bao giờ conflict.
- `custom_content` LWW theo `updated_at`.

### 3.3. Giao thức sync (2 endpoint)

- `GET /rest/v1/learning_items?select=...&updated_at=gt.<cursor>` → delta tải về
- `POST /rest/v1/rpc/apply_ops` → batch 50 ops, mỗi op có `op_id` để **idempotent**

### 3.4. Client flow

1. UI ghi → IndexedDB + outbox (0ms)
2. SyncEngine flush: gom queue → `apply_ops` → xoá khỏi outbox nếu OK
3. Trigger: `online` event, `visibilitychange`, sau 5s idle, mỗi 30s
4. Retry: exponential backoff 2s→4s→8s→30s, giữ queue khi fail
5. Pull delta khi mở app / resume
6. **Không bao giờ `await` DB trước khi update UI**

## 4. Security model

- **Anon key public là an toàn** vì RLS chặn ở tầng DB, không phải app.
- `service_role` key tuyệt đối không vào client.
- Auth: Magic Link / OTP. Supabase SDK lưu token an toàn, refresh tự động. **Không tự code token localStorage**.
- Validate payload trong RPC: whitelist `kind`, giới hạn độ dài string, chặn `status` lạ.
- Rate limit endpoint ghi để chống spam.
- Export JSON chứa dữ liệu học → cảnh báo rõ khi share.
- Không lưu PII (email/tên) vào bảng học — chỉ cần `user_id`.
- CSP: thêm `connect-src` cho Supabase; giữ `Strict-Transport-Security` sẵn có.

## 5. Phân chia trách nhiệm

| Lớp | Vị trí | Trách nhiệm |
|---|---|---|
| UI | Browser | Render, input, event dispatch |
| IndexedDB | Browser | Source of truth cho UI, outbox queue |
| SyncEngine | Browser | Flush/pull/backoff, idempotency |
| Supabase (PostgREST + RLS + Auth) | Singapore | Source of truth dài hạn, bảo mật |
| Vercel CDN | Edge global | Serve file tĩnh |
| Vercel Functions (TTS) | `sin1` | TTS proxy (edge, gần DB) |

## 6. Quyết định đã chốt

- Backend: **Supabase (Singapore)** — không phải Cloudflare D1 (vì phải tự viết auth, rủi ro cao hơn).
- Storage frontend: **IndexedDB + event bus**, giữ API synchronous hiện tại để component không phải sửa.
- Conflict: LWW theo `updated_at`, append-only cho event.
- Auth: Magic Link / OTP, token do Supabase SDK quản lý.
- Offline: IndexedDB + outbox drain khi online lại (PWA Phase 4).

## 7. Không làm (out of scope)

- Realtime collaboration (Supabase Realtime) — chỉ dùng nếu cần.
- Multi-region read replica — free tier không hỗ trợ.
- Server-side render — app là SPA, giữ nguyên.
