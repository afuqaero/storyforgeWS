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
export function allClipsSafe(clips) {
  return clips.length > 0 && clips.every(c => c.data.byteLength <= SAFE_BYTES && c.data.byteLength < HARD_BYTES);
}

// Prefer the decoder's container duration to stale or unsupported browser metadata.
export function resolveDuration(browserDuration, sourceInfo, videoDuration) {
  const match = sourceInfo.match(/Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/);
  const duration = Number.isFinite(videoDuration) && videoDuration > 0 ? videoDuration
    : match ? Number(match[1])*3600 + Number(match[2])*60 + Number(match[3]) : browserDuration;
  if (!Number.isFinite(duration) || duration <= 0)
    throw new Error('Could not determine video duration. Try another MP4 or the desktop converter.');
  if (duration > 180) throw new Error('This browser build currently limits videos to 3 minutes to avoid memory crashes.');
  return duration;
}
// Output-side duration also bounds frames produced by frame-rate conversion.
export function clipTimingArgs(clip) {
  if (!Number.isFinite(clip.length) || clip.length <= 0 || clip.length > 30)
    throw new Error('Invalid output duration. Each part must be at most 30 seconds.');
  return ['-t', String(clip.length)];
}
