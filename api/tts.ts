export const config = {
  runtime: "edge",
};

/**
 * TTS proxy for Mandarin (zh-CN). Runs on the Vercel Edge Network.
 * Baidu blocks the edge network, so try Google, then Youdao, then Baidu.
 * The browser cannot call any of these directly: all three lack CORS headers.
 */
export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  const url = new URL(req.url);
  const text = url.searchParams.get("text");

  if (!text) {
    return new Response(JSON.stringify({ error: "Missing text parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encodedText = encodeURIComponent(text);
  const sources: { url: string; headers?: Record<string, string> }[] = [
    {
      url: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=zh-CN&client=tw-ob`,
      headers: { "Referer": "https://translate.google.com/" },
    },
    { url: `https://dict.youdao.com/dictvoice?audio=${encodedText}&le=zh` },
    {
      url: `https://fanyi.baidu.com/gettts?lan=zh&text=${encodedText}&spd=5&source=web`,
      headers: { "Referer": "https://fanyi.baidu.com/" },
    },
  ];

  const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        headers: { "User-Agent": ua, ...source.headers },
      });
      if (!response.ok || !response.body) continue;
      return new Response(response.body, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch {
      // This source failed; try the next one.
    }
  }

  return new Response(JSON.stringify({ error: "All TTS sources failed" }), {
    status: 502,
    headers: { "Content-Type": "application/json" },
  });
}
