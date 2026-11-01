/**
 * SyncStatus — header control for account + sync state.
 *
 * Shows: signed-out (login button), syncing, synced, offline, or error.
 * Login uses Supabase magic-link (email OTP). No password is ever handled here.
 */

import { useEffect, useState } from 'react';
import { sendMagicLink, verifyEmailCode, signOut, onAuthChange, getAuthState } from '../../sync/auth';
import { onSyncStateChange, getSyncState, flush } from '../../sync/syncEngine';
import { IconHourglass, IconCloudOff, IconAlert, IconCloud, IconPower } from '../Icons/Icons';
import './SyncStatus.css';

export default function SyncStatus({ hideButton = false }: { hideButton?: boolean }) {
  const [authState, setAuthState] = useState(getAuthState());
  const [syncState, setSyncState] = useState(getSyncState());
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => onAuthChange((s) => setAuthState(s)), []);
  useEffect(() => onSyncStateChange((s) => setSyncState(s)), []);

  const handleLogin = async () => {
    if (!email.trim()) return;
    setMessage('Đang gửi...');
    const res = await sendMagicLink(email.trim());
    setMessage(res.message);
  };

  const handleCode = async () => {
    if (!email.trim() || !code.trim()) return;
    setMessage('Đang kiểm tra mã...');
    const res = await verifyEmailCode(email.trim(), code.trim());
    setMessage(res.message);
    if (res.ok) setShowLogin(false);
  };

  const label =
    syncState === 'syncing' ? <IconHourglass />
    : syncState === 'offline' ? <IconCloudOff />
    : syncState === 'error' ? <IconAlert />
    : <IconCloud />;

  const title =
    syncState === 'syncing' ? 'Đang đồng bộ...'
    : syncState === 'offline' ? 'Offline — dữ liệu sẽ gửi khi có mạng'
    : syncState === 'error' ? 'Lỗi đồng bộ — sẽ thử lại'
    : authState === 'signed-in' ? 'Đã đăng nhập — dữ liệu đồng bộ đám mây'
    : 'Đăng nhập để đồng bộ dữ liệu giữa các thiết bị';

  return (
    <div className="sync-status-wrap">
      {!hideButton && (
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
      )}

      {authState === 'signed-in' && !hideButton && (
        <button
          className="btn-theme-toggle sync-signout"
          title="Đăng xuất"
          onClick={() => void signOut()}
        >
          <IconPower />
        </button>
      )}

      {(showLogin || hideButton) && authState !== 'signed-in' && (
        <div className="sync-login-popover">
          <div className="sync-login-title">Đăng nhập để đồng bộ</div>
          <div className="sync-login-hint">
            Nhập email để nhận mã. Nếu mail đã có trong hộp thư, nhập mã 8 số bên dưới — không cần gửi lại.
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
              Gửi mã đăng nhập
            </button>
            <button className="sync-login-cancel" onClick={() => setShowLogin(false)}>
              Đóng
            </button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            className="sync-login-input"
            placeholder="Mã 8 số trong email"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCode();
            }}
          />
          <div className="sync-login-actions">
            <button className="sync-login-btn" onClick={() => void handleCode()}>
              Đăng nhập bằng mã
            </button>
          </div>
          {message && <div className="sync-login-msg">{message}</div>}
        </div>
      )}
    </div>
  );
}
