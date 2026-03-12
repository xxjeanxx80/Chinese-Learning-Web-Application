/**
 * Speak Chinese text (Mandarin zh-CN).
 * Advanced implementation for iOS/Safari compatibility using DOM-based singleton and silent kickstart.
 */

// Silent 1-second MP3 clip to "kickstart" iOS audio session
const SILENT_KICKSTART = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA== ";

let globalAudio: HTMLAudioElement | null = null;
let isUnlocked = false;

// Initialization and Unlocking
if (typeof window !== 'undefined') {
  // Try to find the pre-defined audio tag in index.html
  const init = () => {
    globalAudio = document.getElementById('global-tts-player') as HTMLAudioElement;
    
    const unlock = () => {
      if (globalAudio && !isUnlocked) {
        // Kickstart with silence
        globalAudio.src = SILENT_KICKSTART;
        globalAudio.play().then(() => {
          isUnlocked = true;
          console.log('Audio logic unlocked for iOS');
        }).catch(() => {});
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
  };

  // Run init or wait for DOM
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
  }
  
  if (!globalAudio) {
    console.error('Could not find global-tts-player in DOM');
    fallbackWebSpeech(text);
    return;
  }

  const encodedText = encodeURIComponent(text);
  const primaryUrl = `/api/tts?text=${encodedText}`;
  const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=zh-CN&client=tw-ob`;

  // Stop any active sound
  globalAudio.pause();
  
  // CRITICAL: Set src and play in the same synchronous tick as the user gesture
  globalAudio.src = primaryUrl;
  
  const playPromise = globalAudio.play();
  
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn('Primary TTS failed or was blocked, trying fallback...', err);
      
      if (globalAudio) {
        globalAudio.src = fallbackUrl;
        globalAudio.play().catch((fallbackErr) => {
          console.error('All audio sources failed, using Web Speech API', fallbackErr);
          fallbackWebSpeech(text);
        });
      }
    });
  }
};

function fallbackWebSpeech(text: string): void {
  if (!window.speechSynthesis) return;

  // Synthesis also needs a user gesture sometimes, but usually works if called from a click handler
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.volume = 1;

    // Filter Mandarin voice
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
