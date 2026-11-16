import assert from "node:assert/strict";
import test from "node:test";
import {
  PERSONAL_RECORDS_STORAGE_KEY,
  getPersonalRecordKey,
  loadPersonalRecords,
  savePersonalRecords,
  shouldRecordCompletedAttempt,
  updatePersonalRecord,
} from "../src/utils/personalRecords.ts";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

const wordsConfiguration = {
  mode: "words",
  wordCount: 50,
  strict: false,
};

function createResult(overrides = {}) {
  return {
    wpm: 80,
    accuracy: 98,
    words: 50,
    characters: 301,
    elapsedSeconds: 30,
    errors: 2,
    completedAt: "2026-11-16T12:00:00.000Z",
    ...overrides,
  };
}

test("the first completed result establishes a personal record", () => {
  const update = updatePersonalRecord(
    [],
    wordsConfiguration,
    createResult(),
  );

  assert.equal(update.isNewPersonalBest, true);
  assert.equal(update.changed, true);
  assert.equal(update.records.length, 1);
  assert.equal(update.records[0].wpm, 80);
  assert.equal(update.records[0].accuracy, 98);
  assert.equal(update.records[0].errors, 2);
});

test("a higher WPM replaces the complete saved result", () => {
  const first = updatePersonalRecord(
    [],
    wordsConfiguration,
    createResult(),
  );
  const improved = updatePersonalRecord(
    first.records,
    wordsConfiguration,
    createResult({
      wpm: 81,
      accuracy: 97,
      completedAt: "2026-11-17T12:00:00.000Z",
    }),
  );

  assert.equal(improved.isNewPersonalBest, true);
  assert.equal(improved.records[0].wpm, 81);
  assert.equal(improved.records[0].accuracy, 97);
  assert.equal(improved.records[0].completedAt, "2026-11-17T12:00:00.000Z");
});

test("lower and equal WPM keep the existing record unchanged", () => {
  const first = updatePersonalRecord(
    [],
    wordsConfiguration,
    createResult(),
  );

  for (const wpm of [79, 80]) {
    const update = updatePersonalRecord(
      first.records,
      wordsConfiguration,
      createResult({ wpm, accuracy: 100 }),
    );
    assert.equal(update.isNewPersonalBest, false);
    assert.equal(update.changed, false);
    assert.deepEqual(update.records, first.records);
  }
});

test("typed keys separate modes, settings, passage IDs, and Strict", () => {
  const keys = [
    getPersonalRecordKey(wordsConfiguration),
    getPersonalRecordKey({ ...wordsConfiguration, wordCount: 25 }),
    getPersonalRecordKey({ ...wordsConfiguration, strict: true }),
    getPersonalRecordKey({ mode: "timer", durationSeconds: 60, strict: false }),
    getPersonalRecordKey({ mode: "timer", durationSeconds: 120, strict: false }),
    getPersonalRecordKey({
      mode: "passage",
      passageId: "lit-short-001",
      passageLength: "short",
      passageLabel: "A Tale of Two Cities",
      strict: false,
    }),
    getPersonalRecordKey({
      mode: "passage",
      passageId: "lit-short-002",
      passageLength: "short",
      passageLabel: "Another work",
      strict: false,
    }),
  ];

  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.every((key) => key !== null));
});

test("completed Retry attempts remain eligible to improve a record", () => {
  const first = updatePersonalRecord(
    [],
    wordsConfiguration,
    createResult({ wpm: 80 }),
  );
  assert.equal(shouldRecordCompletedAttempt(true, 2, 1), true);

  const retry = updatePersonalRecord(
    first.records,
    wordsConfiguration,
    createResult({ wpm: 84 }),
  );

  assert.equal(retry.isNewPersonalBest, true);
  assert.equal(retry.records[0].wpm, 84);
});

test("incomplete and duplicate completion attempts are rejected", () => {
  assert.equal(shouldRecordCompletedAttempt(false, 4, null), false);
  assert.equal(shouldRecordCompletedAttempt(true, 4, null), true);
  assert.equal(shouldRecordCompletedAttempt(true, 4, 4), false);
  assert.equal(shouldRecordCompletedAttempt(true, 5, 4), true);
});

test("records persist and reload from versioned local storage", () => {
  const storage = createMemoryStorage();
  const update = updatePersonalRecord(
    [],
    wordsConfiguration,
    createResult(),
  );

  assert.equal(savePersonalRecords(update.records, storage), true);
  const stored = JSON.parse(storage.getItem(PERSONAL_RECORDS_STORAGE_KEY));
  assert.equal(stored.version, 1);
  assert.deepEqual(loadPersonalRecords(storage), update.records);
});

test("malformed and unsupported storage data is ignored safely", () => {
  const storage = createMemoryStorage();
  storage.setItem(PERSONAL_RECORDS_STORAGE_KEY, "{invalid json");
  assert.deepEqual(loadPersonalRecords(storage), []);

  storage.setItem(
    PERSONAL_RECORDS_STORAGE_KEY,
    JSON.stringify({ version: 99, records: [] }),
  );
  assert.deepEqual(loadPersonalRecords(storage), []);

  const valid = updatePersonalRecord(
    [],
    wordsConfiguration,
    createResult(),
  ).records[0];
  storage.setItem(
    PERSONAL_RECORDS_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      records: [valid, { key: "not-valid", wpm: "fast" }],
    }),
  );
  assert.deepEqual(loadPersonalRecords(storage), [valid]);
});

test("unavailable and throwing storage fails gracefully", () => {
  const throwingStorage = {
    getItem() {
      throw new Error("storage unavailable");
    },
    setItem() {
      throw new Error("quota exceeded");
    },
  };

  assert.deepEqual(loadPersonalRecords(null), []);
  assert.deepEqual(loadPersonalRecords(throwingStorage), []);
  assert.equal(savePersonalRecords([], null), false);
  assert.equal(savePersonalRecords([], throwingStorage), false);
});
