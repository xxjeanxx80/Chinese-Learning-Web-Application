/**
 * Speak Chinese text (Mandarin zh-CN).
 * - Gọi trực tiếp Baidu Fanyi TTS từ client (nhanh nhất, 1 hop).
 * - Fallback qua Vercel proxy nếu client bị chặn.
 * - Preload: fetch ngay khi hiển thị từ, phát tức thì khi click.
 * - Cache blob URL để phát lại không cần request mạng.
 */

const SILENT_KICKSTART = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

let globalAudio: HTMLAudioElement | null = null;
let isUnlocked = false;
let isUnlocking = false;

// Cache: text -> blob URL
const audioCache = new Map<string, string>();
// Set các text đang được fetch, tránh fetch trùng lặp
const pendingFetches = new Set<string>();

// Initialization và Unlock audio context
if (typeof window !== 'undefined') {
  const init = () => {
    globalAudio = document.getElementById('global-tts-player') as HTMLAudioElement;

    const unlock = () => {
      if (isUnlocked || isUnlocking) return;
      isUnlocking = true;

      const audio = new Audio(SILENT_KICKSTART);
      audio.muted = true;
      audio.volume = 0;

      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          audio.pause();
          audio.currentTime = 0;
          isUnlocked = true;
          isUnlocking = false;
          window.removeEventListener('click', unlock);
          window.removeEventListener('touchstart', unlock);
        }).catch(() => {
          isUnlocking = false;
        });
      } else {
        isUnlocking = false;
      }
    };

    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

/**
 * Lấy URL Baidu TTS. Ưu tiên gọi thẳng từ client để nhanh nhất.
 * Fallback qua Vercel proxy nếu bị chặn.
 */
function getBaiduTtsUrl(text: string): { url: string; isDirect: boolean } {
  const encodedText = encodeURIComponent(text);

  // Ưu tiên gọi thẳng Baidu (1 hop, nhanh hơn proxy 2 hop)
  return {
    url: `https://fanyi.baidu.com/gettts?lan=zh&text=${encodedText}&spd=5&source=web`,
    isDirect: true
  };
}

/**
 * Fetch audio từ URL và trả về blob URL.
 */
async function fetchAudioBlob(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://fanyi.baidu.com/'
    }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return URL.createObjectURL(await response.blob());
}

/**
 * Fetch và cache audio cho text.
 * Dùng chung cho cả preload và speak.
 */
async function fetchAndCacheAudio(text: string): Promise<string | null> {
  // Kiểm tra cache trước
  if (audioCache.has(text)) {
    return audioCache.get(text)!;
  }

  // Tránh fetch trùng lặp
  if (pendingFetches.has(text)) {
    // Chờ một chút rồi thử lại (đang có fetch khác chạy)
    await new Promise(r => setTimeout(r, 50));
    if (audioCache.has(text)) return audioCache.get(text)!;
    return null;
  }

  pendingFetches.add(text);

  try {
    // Thử gọi thẳng Baidu từ client (1 hop, nhanh nhất)
    const { url } = getBaiduTtsUrl(text);
    let blobUrl: string;
    
    try {
      blobUrl = await fetchAudioBlob(url);
    } catch (directErr) {
      // Fallback qua Vercel proxy nếu client bị chặn
      const encodedText = encodeURIComponent(text);
      const proxyUrl = `/api/tts?text=${encodedText}`;
      blobUrl = await fetchAudioBlob(proxyUrl);
    }

    audioCache.set(text, blobUrl);

    // Giới hạn cache: tối đa 200 entries
    if (audioCache.size > 200) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) {
        const oldUrl = audioCache.get(firstKey);
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        audioCache.delete(firstKey);
      }
    }

    return blobUrl;
  } catch (err) {
    console.warn('TTS fetch failed:', err);
    return null;
  } finally {
    pendingFetches.delete(text);
  }
}

function playAudioFromUrl(url: string): void {
  if (!globalAudio) return;

  globalAudio.pause();
  globalAudio.currentTime = 0;
  globalAudio.playbackRate = 0.85;
  globalAudio.src = url;

  const playPromise = globalAudio.play();

  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn('Audio play failed:', err);
    });
  }
}

/**
 * Preload audio trong background. Gọi ngay khi từ/câu hiển thị.
 * Khi user click speak, audio đã sẵn sàng trong cache.
 */
export function preloadChineseAudio(text: string): void {
  if (!text) return;
  if (audioCache.has(text)) return;
  if (pendingFetches.has(text)) return;

  // Fire and forget - fetch trong background
  fetchAndCacheAudio(text).catch(() => {});
}

/**
 * Phát âm tiếng Trung.
 * Nếu đã cached/preloaded: phát ngay lập tức.
 * Nếu chưa: fetch rồi phát (sẽ có độ trễ lần đầu).
 */
export const speakChinese = (text: string): void => {
  if (!text) return;

  if (!globalAudio) {
    globalAudio = document.getElementById('global-tts-player') as HTMLAudioElement;
    if (!globalAudio) {
      fallbackWebSpeech(text);
      return;
    }
  }

  // Nếu đã có trong cache, phát ngay lập tức
  const cached = audioCache.get(text);
  if (cached) {
    playAudioFromUrl(cached);
    return;
  }

  // Chưa có cache, fetch và phát
  fetchAndCacheAudio(text).then((blobUrl) => {
    if (blobUrl) {
      playAudioFromUrl(blobUrl);
    } else {
      fallbackWebSpeech(text);
    }
  });
};

function fallbackWebSpeech(text: string): void {
  if (!window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const mandarinVoice = voices.find(
      (v) =>
        v.lang === 'zh-CN' &&
        !v.name.toLowerCase().includes('cantonese') &&
        !v.name.toLowerCase().includes('hong kong')
    );

    if (mandarinVoice) {
      utterance.voice = mandarinVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Web Speech API failed:', err);
  }
}