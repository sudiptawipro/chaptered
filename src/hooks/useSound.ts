/**
 * useSound — tiny Web Audio API hook for in-app sounds.
 * No external files needed; everything is synthesised.
 * Respects user preference: if theme === 'light' (day mode)
 * we still play sounds unless they've been disabled.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

type SoundType =
  | 'complete'     // ✅ homework / task done
  | 'pop'          // 🎈 quick-add open / modal open
  | 'whoosh'       // 🌬 navigation / swipe
  | 'success'      // 🎉 streak milestone / exam saved
  | 'tick'         // ⏱ timer tick
  | 'mood'         // 😊 mood logged
  | 'delete'       // 🗑 item deleted
  | 'save';        // 💾 saved

export function playSound(type: SoundType) {
  // Silently bail in SSR or if AudioContext not supported
  if (typeof window === 'undefined' || !('AudioContext' in window || 'webkitAudioContext' in window)) return;

  // Respect user sound preference stored in localStorage
  if (localStorage.getItem('chaptered-sounds') === 'off') return;

  try {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();

    switch (type) {
      case 'complete': playComplete(ac); break;
      case 'pop':      playPop(ac); break;
      case 'whoosh':   playWhoosh(ac); break;
      case 'success':  playSuccess(ac); break;
      case 'tick':     playTick(ac); break;
      case 'mood':     playMood(ac); break;
      case 'delete':   playDelete(ac); break;
      case 'save':     playSave(ac); break;
    }
  } catch {
    // Never crash the app over a sound
  }
}

/** Short satisfying "ding" — homework done */
function playComplete(ac: AudioContext) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1320, ac.currentTime + 0.08);
  gain.gain.setValueAtTime(0.18, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.35);
}

/** Soft pop — modal open / button tap */
function playPop(ac: AudioContext) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.1);
  gain.gain.setValueAtTime(0.12, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.12);
}

/** Airy whoosh */
function playWhoosh(ac: AudioContext) {
  const bufferSize = ac.sampleRate * 0.15;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1800, ac.currentTime);
  filter.frequency.exponentialRampToValueAtTime(400, ac.currentTime + 0.15);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.15, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  source.start(ac.currentTime);
}

/** Upward 3-note fanfare — success / exam saved */
function playSuccess(ac: AudioContext) {
  const notes = [523, 659, 784]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'triangle';
    const t = ac.currentTime + i * 0.1;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

/** Quick metronome tick */
function playTick(ac: AudioContext) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(1200, ac.currentTime);
  gain.gain.setValueAtTime(0.06, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.04);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.04);
}

/** Warm chime — mood logged */
function playMood(ac: AudioContext) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, ac.currentTime);
  gain.gain.setValueAtTime(0.14, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.5);
}

/** Soft thud — delete */
function playDelete(ac: AudioContext) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.15);
  gain.gain.setValueAtTime(0.12, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.15);
}

/** Quick double-beep — saved */
function playSave(ac: AudioContext) {
  [0, 0.08].forEach(delay => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1047, ac.currentTime + delay);
    gain.gain.setValueAtTime(0.1, ac.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.1);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + 0.1);
  });
}
