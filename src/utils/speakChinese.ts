/**
 * Speak Chinese text (Mandarin zh-CN).
 * Uses a singleton Audio element to bypass Safari/Mobile restrictions.
 */

// Singleton Audio element
let singletonAudio: HTMLAudioElement | null = null;

// Audio context unlocking for Safari/Mobile
if (typeof window !== 'undefined') {
  singletonAudio = new Audio();
  
  // Unlocking trick: play silent sound on first interaction
  const unlock = () => {
    if (singletonAudio) {
      singletonAudio.play().catch(() => {});
      singletonAudio.pause();
    }
    window.removeEventListener('click', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('click', unlock);
  window.addEventListener('touchstart', unlock);
}

export const speakChinese = (text: string): void => {
  if (!text || !singletonAudio) return;

  // Stop current
  singletonAudio.pause();

  const encodedText = encodeURIComponent(text);
  const primaryUrl = `/api/tts?text=${encodedText}`;
  const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=zh-CN&client=tw-ob`;

  // Safari optimization: sync source setting
  singletonAudio.src = primaryUrl;
  
  const attemptPlay = async () => {
    try {
      await singletonAudio!.play();
    } catch (err) {
      console.warn('Primary TTS failed, trying fallback...', err);
      
      // Fallback 1: Google
      if (singletonAudio) {
        singletonAudio.src = fallbackUrl;
        try {
          await singletonAudio.play();
        } catch (fallbackErr) {
          console.error('All audio objects failed, using Web Speech API', fallbackErr);
          fallbackWebSpeech(text);
        }
      }
    }
  };

  attemptPlay();
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
