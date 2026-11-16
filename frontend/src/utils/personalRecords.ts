import type { PassageLength } from "../data/passages";

export const PERSONAL_RECORDS_STORAGE_KEY =
  "typing-lab:personal-records:v1";
const personalRecordsSchemaVersion = 1;

export type PersonalRecordConfiguration =
  | {
      mode: "words";
      wordCount: number;
      strict: boolean;
    }
  | {
      mode: "timer";
      durationSeconds: number;
      strict: boolean;
    }
  | {
      mode: "passage";
      passageId: string;
      passageLength: PassageLength;
      passageLabel: string;
      strict: boolean;
    };

export interface PersonalRecordResult {
  wpm: number;
  accuracy: number;
  words: number;
  characters: number;
  elapsedSeconds: number;
  errors: number;
  completedAt: string;
}

export interface PersonalRecord extends PersonalRecordResult {
  key: string;
  configuration: PersonalRecordConfiguration;
}

export interface PersonalRecordUpdate {
  records: PersonalRecord[];
  isNewPersonalBest: boolean;
  changed: boolean;
}

export interface PersonalRecordStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const passageLengths = new Set<PassageLength>([
  "short",
  "medium",
  "long",
  "extra",
  "ultimate",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidConfiguration(
  value: unknown,
): value is PersonalRecordConfiguration {
  if (!isPlainObject(value) || typeof value.strict !== "boolean") return false;

  if (value.mode === "words") {
    return (
      Number.isSafeInteger(value.wordCount) &&
      Number(value.wordCount) > 0 &&
      Number(value.wordCount) <= 800
    );
  }

  if (value.mode === "timer") {
    return (
      Number.isSafeInteger(value.durationSeconds) &&
      Number(value.durationSeconds) > 0
    );
  }

  if (value.mode === "passage") {
    return (
      typeof value.passageId === "string" &&
      value.passageId.trim().length > 0 &&
      value.passageId.length <= 160 &&
      passageLengths.has(value.passageLength as PassageLength) &&
      typeof value.passageLabel === "string" &&
      value.passageLabel.trim().length > 0 &&
      value.passageLabel.length <= 240
    );
  }

  return false;
}

export function getPersonalRecordKey(
  configuration: PersonalRecordConfiguration,
): string | null {
  if (!isValidConfiguration(configuration)) return null;

  const strictSegment = configuration.strict ? "strict" : "standard";
  switch (configuration.mode) {
    case "words":
      return `words:${configuration.wordCount}:${strictSegment}`;
    case "timer":
      return `timer:${configuration.durationSeconds}:${strictSegment}`;
    case "passage":
      return `passage:${configuration.passageLength}:${encodeURIComponent(configuration.passageId)}:${strictSegment}`;
  }
}

function isValidResult(value: unknown): value is PersonalRecordResult {
  if (!isPlainObject(value)) return false;

  return (
    typeof value.wpm === "number" &&
    Number.isFinite(value.wpm) &&
    value.wpm >= 0 &&
    typeof value.accuracy === "number" &&
    Number.isFinite(value.accuracy) &&
    value.accuracy >= 0 &&
    value.accuracy <= 100 &&
    Number.isSafeInteger(value.words) &&
    Number(value.words) >= 0 &&
    Number.isSafeInteger(value.characters) &&
    Number(value.characters) >= 0 &&
    typeof value.elapsedSeconds === "number" &&
    Number.isFinite(value.elapsedSeconds) &&
    value.elapsedSeconds >= 0 &&
    Number.isSafeInteger(value.errors) &&
    Number(value.errors) >= 0 &&
    typeof value.completedAt === "string" &&
    Number.isFinite(Date.parse(value.completedAt))
  );
}

function isValidPersonalRecord(value: unknown): value is PersonalRecord {
  if (!isPlainObject(value) || typeof value.key !== "string") return false;
  if (!isValidConfiguration(value.configuration) || !isValidResult(value)) {
    return false;
  }

  return value.key === getPersonalRecordKey(value.configuration);
}

function sortRecords(records: PersonalRecord[]): PersonalRecord[] {
  return records.sort((left, right) => left.key.localeCompare(right.key));
}

function getDefaultStorage(): PersonalRecordStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadPersonalRecords(
  storage: PersonalRecordStorage | null = getDefaultStorage(),
): PersonalRecord[] {
  if (!storage) return [];

  try {
    const serialized = storage.getItem(PERSONAL_RECORDS_STORAGE_KEY);
    if (!serialized) return [];

    const parsed: unknown = JSON.parse(serialized);
    if (
      !isPlainObject(parsed) ||
      parsed.version !== personalRecordsSchemaVersion ||
      !Array.isArray(parsed.records)
    ) {
      return [];
    }

    const recordsByKey = new Map<string, PersonalRecord>();
    for (const candidate of parsed.records) {
      if (!isValidPersonalRecord(candidate)) continue;

      const existing = recordsByKey.get(candidate.key);
      if (!existing || candidate.wpm > existing.wpm) {
        recordsByKey.set(candidate.key, candidate);
      }
    }

    return sortRecords([...recordsByKey.values()]);
  } catch {
    return [];
  }
}

export function savePersonalRecords(
  records: readonly PersonalRecord[],
  storage: PersonalRecordStorage | null = getDefaultStorage(),
): boolean {
  if (!storage) return false;

  try {
    const validRecords = records.filter(isValidPersonalRecord);
    storage.setItem(
      PERSONAL_RECORDS_STORAGE_KEY,
      JSON.stringify({
        version: personalRecordsSchemaVersion,
        records: validRecords,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function updatePersonalRecord(
  records: readonly PersonalRecord[],
  configuration: PersonalRecordConfiguration,
  result: PersonalRecordResult,
): PersonalRecordUpdate {
  const key = getPersonalRecordKey(configuration);
  if (!key || !isValidResult(result)) {
    return { records: [...records], isNewPersonalBest: false, changed: false };
  }

  const existing = records.find((record) => record.key === key);
  if (existing && result.wpm <= existing.wpm) {
    return { records: [...records], isNewPersonalBest: false, changed: false };
  }

  const nextRecord: PersonalRecord = { key, configuration, ...result };
  return {
    records: sortRecords([
      ...records.filter((record) => record.key !== key),
      nextRecord,
    ]),
    isNewPersonalBest: true,
    changed: true,
  };
}

export function shouldRecordCompletedAttempt(
  isComplete: boolean,
  attemptId: number,
  lastRecordedAttemptId: number | null,
): boolean {
  return (
    isComplete &&
    Number.isSafeInteger(attemptId) &&
    attemptId >= 0 &&
    attemptId !== lastRecordedAttemptId
  );
}
