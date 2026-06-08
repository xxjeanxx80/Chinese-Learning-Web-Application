export const config = {
  runtime: 'edge',
};

/**
 * TTS Proxy - Phát âm tiếng Trung Phổ thông (Mandarin zh-CN).
 * Chạy trên Vercel Edge Network để tối đa tốc độ và không bị crash Node.js Buffer.
 */
export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }

  const url = new URL(req.url);
  const text = url.searchParams.get('text');
  
  if (!text) {
    return new Response(JSON.stringify({ error: 'Missing text parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encodedText = encodeURIComponent(text);
  const baiduUrl = `https://fanyi.baidu.com/gettts?lan=zh&text=${encodedText}&spd=5&source=web`;

  try {
    const response = await fetch(baiduUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://fanyi.baidu.com/'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Baidu TTS request failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Proxy the audio stream directly to the client
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Proxy crashed', message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
