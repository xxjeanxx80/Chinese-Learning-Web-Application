/**
 * AccountMenu — the single header menu (hamburger on the right).
 * Holds the signed-in account, sync status, and the Pomodoro timer.
 */

import { useEffect, useState } from 'react';
import { onAuthChange, getAuthState, getCurrentUser, signOut } from '../../sync/auth';
import { onSyncStateChange, getSyncState, flush } from '../../sync/syncEngine';
import SyncStatus from '../SyncStatus';
import Pomodoro from '../Pomodoro/Pomodoro';
import { IconMenu } from '../Icons/Icons';
import './AccountMenu.css';

const SYNC_LABEL: Record<string, string> = {
  idle: 'Đã đồng bộ',
  syncing: 'Đang đồng bộ…',
  offline: 'Offline — sẽ gửi khi có mạng',
  error: 'Lỗi đồng bộ — sẽ thử lại',
  unauthenticated: 'Chưa đăng nhập',
};

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [authState, setAuthState] = useState(getAuthState());
  const [syncState, setSyncState] = useState(getSyncState());
  const [email, setEmail] = useState<string | null>(getCurrentUser()?.email ?? null);

  useEffect(() => onAuthChange((s, user) => {
    setAuthState(s);
    setEmail(user?.email ?? null);
  }), []);
  useEffect(() => onSyncStateChange(setSyncState), []);

  return (
    <div className="account-menu">
      <button
        className="btn-theme-toggle"
        aria-label="Mở menu tài khoản"
        title="Tài khoản"
        onClick={() => setOpen((v) => !v)}
      >
        <IconMenu />
      </button>

      <div className={`account-panel ${open ? 'open' : ''}`}>
          <div className="account-section">
            <div className="account-label">Tài khoản</div>
            {authState === 'signed-in' ? (
              <>
                <div className="account-email">{email}</div>
                <div className="account-sync">{SYNC_LABEL[syncState] ?? syncState}</div>
                <div className="account-row">
                  <button className="account-btn" onClick={() => void flush()}>Đồng bộ ngay</button>
                  <button className="account-btn account-btn-quiet" onClick={() => void signOut()}>Đăng xuất</button>
                </div>
              </>
            ) : (
              <SyncStatus hideButton />
            )}
          </div>

          <div className="account-section">
            <div className="account-label">Pomodoro</div>
            <Pomodoro />
          </div>
        </div>
      </div>
  );
}
