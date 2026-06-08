import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';

/**
 * TTS Proxy - Phát âm tiếng Trung Phổ thông (Mandarin zh-CN).
 * Sử dụng Google Translate TTS để đảm bảo phát âm chuẩn (Không dùng Youdao vì lỗi âm "er").
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  try {
    const text = req.query.text as string;
    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    const encodedText = encodeURIComponent(text);

    // Source: Baidu Fanyi TTS (Phát âm chuẩn, không bị block IP Vercel như Google)
    const baiduUrl = `https://fanyi.baidu.com/gettts?lan=zh&text=${encodedText}&spd=5&source=web`;

    const response = await fetch(baiduUrl, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
        'Referer': 'https://fanyi.baidu.com/' 
      } 
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Baidu TTS request failed' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 100) {
      return res.status(502).json({ error: 'Baidu TTS returned empty buffer' });
    }

    const totalSize = buffer.length;

    // Handle Range header for iOS Safari
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      const chunksize = end - start + 1;
      const file = buffer.slice(start, end + 1);

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunksize.toString());
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(file);
    }

    res.status(200);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', totalSize.toString());
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ 
      error: 'TTS source failed completely',
      message: err.message,
      stack: err.stack 
    });
  }
}
