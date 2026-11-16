import assert from "node:assert/strict";
import test from "node:test";
import { calculateErrors } from "../src/utils/calculateAccuracy.ts";

test("errors use raw attempts, including a mistake that was later corrected", () => {
  // Ten attempts include one original mistake and its later correct replacement.
  assert.equal(calculateErrors(9, 10), 1);
});

test("errors are not inferred from rounded accuracy", () => {
  assert.equal(calculateErrors(2, 3), 1);
});

test("invalid attempt counts safely produce zero errors", () => {
  assert.equal(calculateErrors(4, 3), 0);
  assert.equal(calculateErrors(-1, 3), 0);
  assert.equal(calculateErrors(1.5, 3), 0);
});
