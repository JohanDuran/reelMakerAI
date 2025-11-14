// Cross-platform ID generator. Uses crypto.randomUUID when available, falls back to
// a secure random UUIDv4 using crypto.getRandomValues, and finally Math.random.
export function generateId(prefix = ''): string {
  const uid = (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function')
    ? (crypto as any).randomUUID()
    : fallbackUUID();
  return prefix ? `${prefix}${uid}` : uid;
}

function fallbackUUID(): string {
  // Prefer Web Crypto API getRandomValues when available
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).getRandomValues === 'function') {
      const buf = new Uint8Array(16);
      (crypto as any).getRandomValues(buf);
      // Per RFC4122 v4
      buf[6] = (buf[6] & 0x0f) | 0x40;
      buf[8] = (buf[8] & 0x3f) | 0x80;
      const hex = Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.substring(0,8)}-${hex.substring(8,12)}-${hex.substring(12,16)}-${hex.substring(16,20)}-${hex.substring(20,32)}`;
    }
  } catch (e) {
    // ignore and fall back to Math.random below
  }
  // Last-resort fallback (less secure)
  let d = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
