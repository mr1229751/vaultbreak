// audio.js — VAULTBREAK sound: a tiny WebAudio synth, no audio files.
// Short envelopes for UI clicks, loot chimes, footsteps, the alarm sting when
// the meter spikes and the getaway arpeggio. The context is created lazily on
// the first user gesture, and every call is silent while muted.

let ctx = null;
let muted = false;

export function setAudioMuted(value) {
  muted = !!value;
}

export function isAudioMuted() {
  return muted;
}

function ensureContext() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freqA, freqB, seconds, type, gainPeak, when = 0) {
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqA, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqB), t0 + seconds);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.05);
}

export function sfxClick() {
  tone(660, 520, 0.06, 'square', 0.05);
}

export function sfxStep() {
  tone(140, 90, 0.045, 'triangle', 0.03);
}

export function sfxLoot(big = false) {
  tone(big ? 880 : 620, big ? 1320 : 840, 0.12, 'sine', 0.09);
  tone(big ? 1320 : 930, big ? 1760 : 1240, 0.16, 'sine', 0.07, 0.07);
}

export function sfxVent() {
  tone(220, 660, 0.18, 'sawtooth', 0.04);
}

export function sfxSmoke() {
  tone(300, 60, 0.3, 'sawtooth', 0.05);
}

export function sfxSpotted() {
  tone(220, 220, 0.14, 'square', 0.1);
  tone(220, 220, 0.14, 'square', 0.1, 0.18);
}

export function sfxCaught() {
  tone(392, 392, 0.16, 'square', 0.12);
  tone(311, 311, 0.16, 'square', 0.12, 0.17);
  tone(233, 110, 0.5, 'square', 0.13, 0.34);
}

export function sfxVictory() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((n, i) => tone(n, n, 0.22, 'triangle', 0.1, i * 0.11));
}

export function sfxUnlock() {
  tone(440, 880, 0.2, 'sine', 0.08);
}
