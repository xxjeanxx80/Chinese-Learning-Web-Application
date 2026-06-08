/**
 * Speak Chinese text (Mandarin zh-CN).
 * Fast implementation using Baidu Fanyi TTS directly.
 * - Bypasses Brave's Google tracker block.
 * - Bypasses Brave's lack of built-in Web Speech voices.
 * - Accurate Mandarin pronunciation (fixes Youdao's "er" bug).
 */

const SILENT_KICKSTART = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

let globalAudio: HTMLAudioElement | null = null;
let isUnlocked = false;
let isUnlocking = false;

// Initialization and Unlocking
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

export const speakChinese = (text: string): void => {
  if (!text) return;
  
  if (!globalAudio) {
    globalAudio = document.getElementById('global-tts-player') as HTMLAudioElement;
    if (!globalAudio) {
      fallbackWebSpeech(text);
      return;
    }
  }

  const encodedText = encodeURIComponent(text);
  
  // Dùng Baidu Fanyi TTS (Nguồn gốc nội địa Trung, phát âm chuẩn 100%, không bị Brave chặn như Google)
  // URL format: lan=zh (tiếng Trung), spd=5 (tốc độ chuẩn, có thể để nguyên rồi dùng playbackRate)
  const baiduUrl = `https://fanyi.baidu.com/gettts?lan=zh&text=${encodedText}&spd=5&source=web`;

  globalAudio.pause();
  globalAudio.currentTime = 0;
  
  // Giảm tốc độ đọc xuống 85% để dễ nghe hơn
  globalAudio.playbackRate = 0.85;
  globalAudio.src = baiduUrl;
  globalAudio.load();
  
  const playPromise = globalAudio.play();
  
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn('Baidu TTS failed, falling back to Web Speech API.', err);
      fallbackWebSpeech(text);
    });
  }
};

function fallbackWebSpeech(text: string): void {
  if (!window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    // Web speech rate (0.1 to 10). 0.8 is slightly slower than normal.
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
