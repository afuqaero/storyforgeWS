/** Browser export size guard. Shared by the UI and automated tests.
 * All sizes use decimal bytes (WhatsApp-oriented 32,000,000 limit).
 */
export const SAFE_BYTES = 31_500_000;
export const HARD_BYTES = 32_000_000;
export const STATUS_RATES = Object.freeze([8200, 8000, 7800, 7600, 7400]);
export function planParts(duration, seconds = 30) {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(seconds) || seconds < 5 || seconds > 30)
    throw new Error('Invalid video length or segment duration.');
  const count = Math.ceil((duration - 1e-6) / seconds);
  if (count > 100) throw new Error('Too many clips for browser memory; use the desktop converter.');
  return Array.from({ length: count }, (_, index) => ({
    index, start: index * seconds, length: Math.min(seconds, duration - index * seconds)
  })).filter(p => p.length > 1e-4);
}
export function nextSegmentSeconds(current, measuredBytes) {
  if (!Number.isFinite(measuredBytes) || measuredBytes <= 0) throw new Error('Invalid output size.');
  if (measuredBytes <= SAFE_BYTES) return current;
  // Use a 10% safety margin; shorter clips rather than lowering CRF/detail quality.
  const proportional = Math.floor(current * SAFE_BYTES / measuredBytes * 0.9);
  return Math.max(5, Math.min(current - 1, proportional));
}
export function allClipsSafe(clips) {
  return clips.length > 0 && clips.every(c => c.data.byteLength <= SAFE_BYTES && c.data.byteLength < HARD_BYTES);
}
