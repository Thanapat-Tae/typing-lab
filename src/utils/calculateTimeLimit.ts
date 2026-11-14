export function calculateTimeLimit(passage: string, targetWpm = 25): number {
  if (targetWpm <= 0 || !Number.isFinite(targetWpm)) {
    throw new Error("Target WPM must be a positive finite number");
  }

  if (passage.length === 0) return 0;

  return Math.ceil((passage.length / 5 / targetWpm) * 60);
}
