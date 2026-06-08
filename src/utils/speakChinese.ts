/**
 * Speak Chinese text (Mandarin zh-CN).
 * Advanced implementation with proxy + direct client-side fallback + Web Speech fallback.
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

// Chaining audio playback sequentially
function playAudioSource(sources: string[], text: string, index: number = 0) {
  if (index >= sources.length) {
    console.warn('All TTS endpoints failed, falling back to Web Speech API.');
    fallbackWebSpeech(text);
    return;
  }

  if (!globalAudio) {
    globalAudio = document.getElementById('global-tts-player') as HTMLAudioElement;
    if (!globalAudio) {
      fallbackWebSpeech(text);
      return;
    }
  }

  globalAudio.pause();
  globalAudio.currentTime = 0;
  
  // Use current source
  globalAudio.src = sources[index];
  globalAudio.load();
  
  const playPromise = globalAudio.play();
  
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn(`TTS source [${index}] failed:`, sources[index], err);
      // Try next source
      playAudioSource(sources, text, index + 1);
    });
  }
}

export const speakChinese = (text: string): void => {
  if (!text) return;
  
  const encodedText = encodeURIComponent(text);
  
  const sources = [
    `/api/tts?text=${encodedText}`, // Primary: Vercel Proxy
    `https://dict.youdao.com/dictvoice?audio=${encodedText}&le=zh`, // Fallback 1: Direct Youdao (audio tag bypasses CORS)
    `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=zh-CN&client=tw-ob` // Fallback 2: Direct Google (audio tag bypasses CORS)
  ];

  playAudioSource(sources, text, 0);
};

function fallbackWebSpeech(text: string): void {
  if (!window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
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
