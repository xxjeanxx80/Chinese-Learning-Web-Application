import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * TTS Proxy - Phát âm tiếng Trung Phổ thông (Mandarin zh-CN).
 * Proxy qua backend để tránh CORS/ad-blocker trên Brave và các browser khác.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://tieng-trung.vercel.app', // Domain production
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Chi ho tro GET' });
  }

  const text = req.query.text as string;
  if (!text) {
    return res.status(400).json({ error: 'Thieu tham so text' });
  }

  const encodedText = encodeURIComponent(text);

  // Try Google Translate TTS first (always Mandarin)
  const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=zh-CN&client=tw-ob`;

  try {
    const response = await fetch(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`Google TTS failed: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);
    const totalSize = buffer.length;

    // Handle Range header for iOS Safari
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      const chunksize = (end - start) + 1;
      const file = buffer.slice(start, end + 1);

      res.status(206).setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunksize.toString());
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(file);
    }

    res.status(200).setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', totalSize.toString());
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 1 day
    return res.send(buffer);
  } catch {
    // Fallback: Youdao Dictionary TTS (also Mandarin)
    try {
      const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodedText}&type=1`;
      const youdaoResponse = await fetch(youdaoUrl);

      if (!youdaoResponse.ok) {
        throw new Error(`Youdao TTS failed: ${youdaoResponse.status}`);
      }

      const audioBuffer = await youdaoResponse.arrayBuffer();
      const buffer = Buffer.from(audioBuffer);
      const totalSize = buffer.length;

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
        const chunksize = (end - start) + 1;
        const file = buffer.slice(start, end + 1);

        res.status(206).setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunksize.toString());
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(file);
      }

      res.status(200).setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', totalSize.toString());
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    } catch {
      return res.status(500).json({ error: 'Tat ca nguon TTS deu that bai' });
    }
  }
}
