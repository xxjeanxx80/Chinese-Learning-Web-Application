import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEEPL_URL = 'https://api-free.deepl.com/v2/translate';

/**
 * Proxy dich DeepL - tranh loi CORS khi goi truc tiep tu browser.
 * DeepL chan request tu frontend, nen phai goi qua backend.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chi ho tro POST' });
  }

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chua cau hinh DEEPL_API_KEY trong Environment Variables' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Body JSON khong hop le' });
    }
  }
  const { text, source_lang, target_lang } = body || {};
  if (!text || !target_lang) {
    return res.status(400).json({ error: 'Thieu text hoac target_lang' });
  }

  try {
    const response = await fetch(DEEPL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `DeepL-Auth-Key ${apiKey}`
      },
      body: JSON.stringify({
        text: Array.isArray(text) ? text : [String(text)],
        source_lang: source_lang || undefined,
        target_lang: String(target_lang)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'Loi DeepL API',
        ...data
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('DeepL proxy error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Loi ket noi DeepL'
    });
  }
}
