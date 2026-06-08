import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

function devTtsProxy() {
  return {
    name: 'dev-tts-proxy',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/tts')) return next()

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range')

        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          return res.end()
        }

        if (req.method !== 'GET') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          return res.end(JSON.stringify({ error: 'Chi ho tro GET' }))
        }

        const url = new URL(req.url, 'http://localhost')
        const text = url.searchParams.get('text')
        if (!text) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          return res.end(JSON.stringify({ error: 'Thieu tham so text' }))
        }

        const encodedText = encodeURIComponent(text)
        const range = req.headers.range as string | undefined

        const tryFetch = async (ttsUrl: string, init?: RequestInit) => {
          const r = await fetch(ttsUrl, init)
          if (!r.ok) throw new Error(String(r.status))
          const ab = await r.arrayBuffer()
          return Buffer.from(ab)
        }

        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=zh-CN&client=tw-ob`
        const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodedText}&le=zh`

        let buffer: Buffer
        try {
          buffer = await tryFetch(googleUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://translate.google.com/',
            },
          })
        } catch {
          try {
            buffer = await tryFetch(youdaoUrl)
          } catch {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            return res.end(JSON.stringify({ error: 'Tat ca nguon TTS deu that bai' }))
          }
        }

        const totalSize = buffer.length

        res.setHeader('Accept-Ranges', 'bytes')
        res.setHeader('Content-Type', 'audio/mpeg')
        res.setHeader('Cache-Control', 'no-store')

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-')
          const start = parseInt(parts[0], 10)
          const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1
          const safeStart = Number.isFinite(start) ? Math.max(0, start) : 0
          const safeEnd = Number.isFinite(end) ? Math.min(totalSize - 1, end) : totalSize - 1

          const chunk = buffer.slice(safeStart, safeEnd + 1)
          res.statusCode = 206
          res.setHeader('Content-Range', `bytes ${safeStart}-${safeEnd}/${totalSize}`)
          res.setHeader('Content-Length', String(chunk.length))
          return res.end(chunk)
        }

        res.statusCode = 200
        res.setHeader('Content-Length', String(totalSize))
        return res.end(buffer)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), devTtsProxy()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Tách vocabulary data thành chunk riêng
          if (id.includes('vocabulary.ts') && !id.includes('vocabularyStorage')) {
            return 'vocabulary-data';
          }
          // Tách vocabularyStorage thành chunk riêng
          if (id.includes('vocabularyStorage')) {
            return 'vocabulary-storage';
          }
          // Tách các utils lớn thành chunk riêng
          if (id.includes('utils/')) {
            return 'utils';
          }
          // Tách vendor libraries
          if (id.includes('node_modules')) {
            // Tách React và React DOM
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Tách các thư viện khác
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            return 'vendor';
          }
        },
      },
    },
    // Tăng giới hạn cảnh báo chunk size (vì vocabulary data rất lớn)
    chunkSizeWarningLimit: 600,
  },
})
