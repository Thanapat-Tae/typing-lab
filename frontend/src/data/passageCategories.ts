import type { PassageLength } from "./passages";

/** Descriptive categories retained for the future Passages mode. */
export const passageLengthOptions: PassageLength[] = [
  "short",
  "medium",
  "long",
  "extra",
  "ultimate",
];

export const passageLengthLabels: Record<PassageLength, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
  extra: "Extra",
  ultimate: "Ultimate",
};

export const passageLengthWordRanges: Record<PassageLength, [number, number]> = {
  short: [20, 50],
  medium: [51, 120],
  long: [121, 250],
  extra: [251, 500],
  ultimate: [501, 800],
};
