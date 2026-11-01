import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { initStorage, setFlushHook } from './storage'
import { startSyncEngine, scheduleFlush } from './sync/syncEngine'
import { initAuth } from './sync/auth'

// Initialize IndexedDB-backed storage before first render (local-first).
// Falls back to localStorage migration on first run.
initStorage()
  .catch((e) => console.error('Storage init failed, falling back to localStorage:', e))
  .finally(() => {
    // Wire local writes -> debounced server flush (no circular import).
    setFlushHook(() => scheduleFlush())

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </React.StrictMode>,
    )

    // Auth + sync run in the background; they never block the UI.
    void initAuth().then(() => startSyncEngine())
  })
