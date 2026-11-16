import { LENGTH_RANGES, type PassageLength } from "./passages";

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

export const passageLengthWordRanges = LENGTH_RANGES;
