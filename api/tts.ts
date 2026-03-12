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

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 1 day
    return res.send(Buffer.from(audioBuffer));
  } catch {
    // Fallback: Youdao Dictionary TTS (also Mandarin)
    try {
      const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodedText}&type=1`;
      const youdaoResponse = await fetch(youdaoUrl);

      if (!youdaoResponse.ok) {
        throw new Error(`Youdao TTS failed: ${youdaoResponse.status}`);
      }

      const audioBuffer = await youdaoResponse.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(audioBuffer));
    } catch {
      return res.status(500).json({ error: 'Tat ca nguon TTS deu that bai' });
    }
  }
}
