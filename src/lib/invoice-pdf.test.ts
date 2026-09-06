import { test } from "node:test";
import assert from "node:assert/strict";
import { displayDays, longDate, shortDate, sizeParts } from "./invoice-pdf.ts";

test("dates render in the invoice's dd.mm format from dates and timestamps alike", () => {
  assert.equal(shortDate("2026-08-06"), "06.08.26");
  assert.equal(longDate("2026-08-18T11:13:36.123Z"), "18.08.2026");
  assert.equal(shortDate(null), "-");
  assert.equal(shortDate("not a date"), "-");
});

test("display days count both the first and the last day", () => {
  assert.equal(displayDays("2026-08-06", "2026-08-09"), "4");
  assert.equal(displayDays("2026-08-06", "2026-08-06"), "1");
  assert.equal(displayDays("2026-08-06", "2026-09-05"), "31");
  assert.equal(displayDays("2026-08-06", null), "-");
});

test("size splits into W and H, or stays whole when it is free text", () => {
  assert.deepEqual(sizeParts("60x15"), ["60", "15"]);
  assert.deepEqual(sizeParts("160 X 30"), ["160", "30"]);
  assert.deepEqual(sizeParts("Custom banner"), ["Custom banner", null]);
});

test("the multiplication sign every stored size actually uses still splits", () => {
  // Production stores 60x40 as "60\u00d7 40" — cleanText used to flatten it to "60?40".
  assert.deepEqual(sizeParts("60\u00d740"), ["60", "40"]);
  assert.deepEqual(sizeParts("60 \u00d7 20"), ["60", "20"]);
  assert.deepEqual(sizeParts("12.5\u00d76"), ["12.5", "6"]);
});
