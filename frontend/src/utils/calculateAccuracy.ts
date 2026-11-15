/**
 * Returns the percentage of character-entry attempts that matched the expected
 * character. Empty or invalid attempt counts safely produce zero accuracy.
 */
export function calculateAccuracy(
  correctAttempts: number,
  totalAttempts: number,
): number {
  if (
    !Number.isInteger(correctAttempts) ||
    !Number.isInteger(totalAttempts) ||
    correctAttempts < 0 ||
    totalAttempts < 0 ||
    correctAttempts > totalAttempts ||
    totalAttempts === 0
  ) {
    return 0;
  }

  return (correctAttempts / totalAttempts) * 100;
}
