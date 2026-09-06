import { test } from "node:test";
import assert from "node:assert/strict";
import { buildInvoiceSchedule, sequenceInvoiceNumber } from "./invoices.ts";

test("a manual number continues across the schedule instead of gaining suffixes", () => {
  assert.equal(sequenceInvoiceNumber("CR - AD 187", 0), "CR - AD 187");
  assert.equal(sequenceInvoiceNumber("CR - AD 187", 1), "CR - AD 188");
  assert.equal(sequenceInvoiceNumber("CR - AD 187", 12), "CR - AD 199");
});

test("zero padding is preserved and allowed to grow", () => {
  assert.equal(sequenceInvoiceNumber("INV-007", 1), "INV-008");
  assert.equal(sequenceInvoiceNumber("INV-098", 5), "INV-103");
  assert.equal(sequenceInvoiceNumber("INV-998", 5), "INV-1003");
});

test("the last digit run is the one incremented, and trailing text survives", () => {
  assert.equal(sequenceInvoiceNumber("INV-2026-007", 1), "INV-2026-008");
  assert.equal(sequenceInvoiceNumber("2026/A", 1), "2027/A");
});

test("a number with no digits falls back to numbered suffixes", () => {
  assert.equal(sequenceInvoiceNumber("CR-AD", 0), "CR-AD");
  assert.equal(sequenceInvoiceNumber("CR-AD", 1), "CR-AD-002");
});

const monthlyBooking = {
  id: 42,
  amount: 300000,
  billing_type: "monthly" as const,
  start_date: "2026-01-01",
  end_date: "2026-04-01",
};

test("a manual base numbers every generated invoice in sequence", () => {
  const numbers = buildInvoiceSchedule(monthlyBooking, "CR - AD 187").map((row) => row.invoice_no);
  assert.deepEqual(numbers, ["CR - AD 187", "CR - AD 188", "CR - AD 189"]);
});

test("no manual base keeps the existing automatic numbering", () => {
  const numbers = buildInvoiceSchedule(monthlyBooking).map((row) => row.invoice_no);
  assert.deepEqual(numbers, ["INV-42-001", "INV-42-002", "INV-42-003"]);
  assert.deepEqual(buildInvoiceSchedule(monthlyBooking, "   ").map((row) => row.invoice_no), numbers);
});

test("an end-of-term booking uses the manual number as-is", () => {
  const rows = buildInvoiceSchedule({ ...monthlyBooking, billing_type: "end_of_term" }, "CR - AD 187");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].invoice_no, "CR - AD 187");
});

test("the schedule still splits the full amount regardless of numbering", () => {
  const rows = buildInvoiceSchedule(monthlyBooking, "CR - AD 187");
  assert.equal(rows.reduce((sum, row) => sum + row.amount, 0), 300000);
});
