import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * TTS Proxy - Phát âm tiếng Trung Phổ thông (Mandarin zh-CN).
 * Proxy luồng âm thanh trực tiếp từ Baidu Fanyi để lách mọi giới hạn.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET supported' });
  }

  const text = req.query.text as string;
  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  const encodedText = encodeURIComponent(text);
  const baiduUrl = `https://fanyi.baidu.com/gettts?lan=zh&text=${encodedText}&spd=5&source=web`;

  try {
    // Dynamic require để tránh lỗi "module not found" lúc Vercel khởi tạo Serverless Function
    const https = require('https');

    https.get(baiduUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://fanyi.baidu.com/'
      }
    }, (proxyRes: any) => {
      res.status(proxyRes.statusCode || 200);
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'audio/mpeg');
      
      if (proxyRes.headers['content-length']) {
        res.setHeader('Content-Length', proxyRes.headers['content-length']);
      }
      
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      // Stream trực tiếp audio data về cho client (không cần dùng Buffer hay ArrayBuffer)
      proxyRes.pipe(res);
    }).on('error', (err: any) => {
      return res.status(500).json({ error: 'Proxy stream error', details: err.message });
    });
  } catch (err: any) {
    return res.status(500).json({ 
      error: 'Proxy initialization failed',
      message: err.message 
    });
  }
}
