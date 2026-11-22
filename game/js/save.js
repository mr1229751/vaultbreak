// save.js — VAULTBREAK progress in localStorage: which vaults are unlocked,
// the best haul and fastest clean run per vault, and the sound preference.
// Everything degrades to in-memory defaults when storage is unavailable.

const SAVE_KEY = 'vaultbreak-save-v1';

const defaultSave = {
  unlocked: 1, // number of levels available on the select screen
  best: {}, // levelId -> { loot, time, stars }
  muted: false,
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...defaultSave };
    const parsed = JSON.parse(raw);
    return {
      unlocked: Math.max(1, parsed.unlocked | 0),
      best: parsed.best && typeof parsed.best === 'object' ? parsed.best : {},
      muted: !!parsed.muted,
    };
  } catch {
    return { ...defaultSave };
  }
}

export function storeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Private mode or quota: the run simply is not remembered.
  }
}

export function recordResult(save, levelId, levelCount, result) {
  const prev = save.best[levelId];
  if (!prev || result.loot > prev.loot || (result.loot === prev.loot && result.time < prev.time)) {
    save.best[levelId] = { loot: result.loot, time: Math.round(result.time), stars: result.stars };
  }
  const next = Math.min(levelCount, Math.max(save.unlocked, levelIndexOf(levelId) + 2));
  save.unlocked = next;
  storeSave(save);
}

function levelIndexOf(levelId) {
  return Number(String(levelId).replace(/\D/g, '')) - 1;
}

export function setMuted(save, muted) {
  save.muted = muted;
  storeSave(save);
}
