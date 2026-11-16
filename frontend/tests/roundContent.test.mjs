import assert from "node:assert/strict";
import test from "node:test";
import { getRoundContentUpdate } from "../src/utils/roundContent.ts";

function createOptions(overrides = {}) {
  const generatedCounts = [];
  const selectedLengths = [];
  const options = {
    contentAction: "generate",
    mode: "normal",
    wordCount: 25,
    timerBatchSize: 50,
    passageLength: "medium",
    generateWords: (count) => {
      generatedCounts.push(count);
      return Array.from({ length: count }, (_, index) => `word-${index}`);
    },
    selectPassage: (length) => {
      selectedLengths.push(length);
      return { id: `passage-${length}`, workTitle: "A work" };
    },
    ...overrides,
  };

  return { options, generatedCounts, selectedLengths };
}

test("Retry preserves current round content without generating replacements", () => {
  const { options, generatedCounts, selectedLengths } = createOptions({
    contentAction: "preserve",
    mode: "timer",
  });

  assert.equal(getRoundContentUpdate(options), null);
  assert.deepEqual(generatedCounts, []);
  assert.deepEqual(selectedLengths, []);
});

test("New Words round generates exactly the selected word count and clears timer content", () => {
  const { options, generatedCounts } = createOptions({ mode: "normal" });
  const update = getRoundContentUpdate(options);

  assert.equal(update?.normalWords?.length, 25);
  assert.deepEqual(update?.timerWords, []);
  assert.deepEqual(generatedCounts, [25]);
});

test("New Timer round generates one initial batch", () => {
  const { options, generatedCounts } = createOptions({ mode: "timer" });
  const update = getRoundContentUpdate(options);

  assert.equal(update?.timerWords?.length, 50);
  assert.deepEqual(generatedCounts, [50]);
});

test("New Passage round selects with the current length and preserves attribution", () => {
  const { options, generatedCounts, selectedLengths } = createOptions({
    mode: "passage",
  });
  const update = getRoundContentUpdate(options);

  assert.deepEqual(update?.selectedPassage, {
    id: "passage-medium",
    workTitle: "A work",
  });
  assert.deepEqual(update?.timerWords, []);
  assert.deepEqual(selectedLengths, ["medium"]);
  assert.deepEqual(generatedCounts, []);
});
