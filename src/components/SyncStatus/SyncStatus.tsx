/**
 * SyncStatus — header control for account + sync state.
 *
 * Shows: signed-out (login button), syncing, synced, offline, or error.
 * Login uses Supabase magic-link (email OTP). No password is ever handled here.
 */

import { useEffect, useState } from 'react';
import { sendMagicLink, signOut, onAuthChange, getAuthState } from '../../sync/auth';
import { onSyncStateChange, getSyncState, flush } from '../../sync/syncEngine';
import './SyncStatus.css';

export default function SyncStatus() {
  const [authState, setAuthState] = useState(getAuthState());
  const [syncState, setSyncState] = useState(getSyncState());
  const [email, setEmail] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => onAuthChange((s) => setAuthState(s)), []);
  useEffect(() => onSyncStateChange((s) => setSyncState(s)), []);

  const handleLogin = async () => {
    if (!email.trim()) return;
    setMessage('Đang gửi...');
    const res = await sendMagicLink(email.trim());
    setMessage(res.message);
    if (res.ok) setShowLogin(false);
  };

  const label =
    syncState === 'syncing' ? '⏳'
    : syncState === 'offline' ? '📴'
    : syncState === 'error' ? '⚠️'
    : authState === 'signed-in' ? '☁️'
    : '☁️';

  const title =
    syncState === 'syncing' ? 'Đang đồng bộ...'
    : syncState === 'offline' ? 'Offline — dữ liệu sẽ gửi khi có mạng'
    : syncState === 'error' ? 'Lỗi đồng bộ — sẽ thử lại'
    : authState === 'signed-in' ? 'Đã đăng nhập — dữ liệu đồng bộ đám mây'
    : 'Đăng nhập để đồng bộ dữ liệu giữa các thiết bị';

  return (
    <div className="sync-status-wrap">
      <button
        className={`btn-theme-toggle sync-status-btn sync-${syncState} ${authState === 'signed-in' ? 'sync-authed' : ''}`}
        title={title}
        aria-label={title}
        onClick={() => {
          if (authState === 'signed-in') {
            void flush();
          } else {
            setShowLogin((v) => !v);
          }
        }}
      >
        {label}
      </button>

      {authState === 'signed-in' && (
        <button
          className="btn-theme-toggle sync-signout"
          title="Đăng xuất"
          onClick={() => void signOut()}
        >
          ⏻
        </button>
      )}

      {showLogin && authState !== 'signed-in' && (
        <div className="sync-login-popover">
          <div className="sync-login-title">Đăng nhập để đồng bộ</div>
          <div className="sync-login-hint">
            Nhập email — Supabase sẽ gửi link đăng nhập. Không cần mật khẩu.
          </div>
          <input
            type="email"
            className="sync-login-input"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleLogin();
            }}
          />
          <div className="sync-login-actions">
            <button className="sync-login-btn" onClick={() => void handleLogin()}>
              Gửi link đăng nhập
            </button>
            <button className="sync-login-cancel" onClick={() => setShowLogin(false)}>
              Đóng
            </button>
          </div>
          {message && <div className="sync-login-msg">{message}</div>}
        </div>
      )}
    </div>
  );
}
