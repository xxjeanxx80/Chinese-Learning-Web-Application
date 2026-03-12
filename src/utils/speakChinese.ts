/**
 * Speak Chinese text (Mandarin zh-CN).
 * Uses the /api/tts proxy for reliable cross-browser TTS.
 * Falls back to Web Speech API if the proxy is unavailable.
 */

let currentAudio: HTMLAudioElement | null = null;

export const speakChinese = (text: string): void => {
  if (!text) return;

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // Use our own API proxy (bypasses CORS/ad-blocker, always Mandarin)
  const encodedText = encodeURIComponent(text);
  const url = `/api/tts?text=${encodedText}`;

  // Safari optimization: Create and play immediately if possible
  const audio = new Audio(url);
  currentAudio = audio;

  // We don't wrap this in an async function immediately to keep the stack trace short
  audio.play().catch(async (err) => {
    console.warn('Primary audio playback failed, trying Google fallback...', err);
    
    // Fallback: try Google Translate directly
    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=zh-CN&client=tw-ob`;
    const fallbackAudio = new Audio(googleUrl);
    currentAudio = fallbackAudio;
    
    try {
      await fallbackAudio.play();
    } catch (fallbackErr) {
      console.error('All audio sources failed, using Web Speech API', fallbackErr);
      fallbackWebSpeech(text);
    }
  });
};

function fallbackWebSpeech(text: string): void {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Strict Mandarin voice - avoid Cantonese/HK/TW
  const voices = window.speechSynthesis.getVoices();
  const mandarinVoice = voices.find(
    (v) =>
      v.lang === 'zh-CN' &&
      !v.name.toLowerCase().includes('cantonese') &&
      !v.name.toLowerCase().includes('hong kong') &&
      !v.name.toLowerCase().includes('hk')
  );

  if (mandarinVoice) {
    utterance.voice = mandarinVoice;
  }

  window.speechSynthesis.speak(utterance);
}
