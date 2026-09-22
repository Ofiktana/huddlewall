export const NOTE_COLORS = ['#FFD93D', '#FF6F91', '#2EC4B6', '#4CC9F0', '#A78BFA', '#FF9F1C'];

export const STATE_KEY = 'huddleWallState_v1';
export const IDENTITY_KEY = 'huddleWallIdentities_v1';
export const SESSION_KEY = 'huddleWallSession_v1';

export function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function nowISO() {
  return new Date().toISOString();
}

export function timeAgo(iso, now = Date.now()) {
  const seconds = Math.max(1, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return seconds + 's ago';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  return days + 'd ago';
}

export function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
