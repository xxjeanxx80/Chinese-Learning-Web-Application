import type { VercelRequest, VercelResponse } from '@vercel/node';

// Force Node.js runtime (NOT Edge)
export const config = {
  runtime: 'nodejs',
};

/**
 * TTS Proxy - Phát âm tiếng Trung Phổ thông (Mandarin zh-CN).
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

  const text = req.query.text as string;
  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  const encodedText = encodeURIComponent(text);

  // Source 1: Google Translate TTS
  const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=zh-CN&client=tw-ob`;
  // Source 2: Youdao Dictionary TTS  
  const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodedText}&le=zh`;

  const sources = [
    { name: 'Google', url: googleUrl, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Referer': 'https://translate.google.com/' } },
    { name: 'Youdao', url: youdaoUrl, headers: {} },
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source.url, { headers: source.headers });

      if (!response.ok) {
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length < 100) {
        continue;
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
    } catch (err) {
      // Try next source
      continue;
    }
  }

  return res.status(502).json({ error: 'All TTS sources failed' });
}
