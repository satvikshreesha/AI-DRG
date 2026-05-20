/** Tiny unique-id helper that works in all browsers (avoids crypto.randomUUID for older Safari). */
export function uid(prefix = "id"): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}_${time}${rand}`;
}
