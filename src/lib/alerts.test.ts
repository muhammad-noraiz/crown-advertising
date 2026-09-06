import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAlerts, daysUntil, type DocumentAlertRow, type InvoiceAlertRow } from "./alerts.ts";

const today = new Date("2026-09-06T18:30:00.000Z");

function doc(id: number, valid_until: string | null): DocumentAlertRow {
  return {
    id,
    location_id: 1,
    file_name: `doc-${id}.pdf`,
    document_type: "noc",
    valid_until,
    locations: { name: "Kalma Chowk" },
  };
}

function invoice(id: number, due_date: string, paid = 0): InvoiceAlertRow {
  return {
    id,
    invoice_no: `INV-${id}`,
    due_date,
    amount: 100000,
    paid_amount: paid,
    status: "PENDING",
    bookings: { id: id * 10, client_name: "K.N'S", location_id: 1, locations: { name: "Kalma Chowk" } },
  };
}

test("the day count ignores the time of day on either side", () => {
  assert.equal(daysUntil("2026-09-06", today), 0);
  assert.equal(daysUntil("2026-09-13", today), 7);
  assert.equal(daysUntil("2026-09-14", today), 8);
  assert.equal(daysUntil("2026-09-05", today), -1);
});

test("the window is a week, inclusive, and expired items stay in the feed", () => {
  const alerts = buildAlerts(
    [doc(1, "2026-09-13"), doc(2, "2026-09-14"), doc(3, "2026-08-01"), doc(4, null)],
    [],
    today
  );
  assert.deepEqual(alerts.map((alert) => alert.id), [3, 1]);
  assert.equal(alerts[0].severity, "overdue");
  assert.equal(alerts[1].severity, "due-soon");
});

test("settled and cancelled invoices raise nothing", () => {
  const rows = [
    invoice(1, "2026-09-08"),
    invoice(2, "2026-09-08", 100000),
    { ...invoice(3, "2026-09-08"), status: "CANCELLED" as const },
  ];
  const alerts = buildAlerts([], rows, today);
  assert.deepEqual(alerts.map((alert) => alert.id), [1]);
});

test("part-paid invoices alert on the remaining balance", () => {
  const [alert] = buildAlerts([], [invoice(1, "2026-09-02", 40000)], today);
  assert.equal(alert.kind === "invoice" && alert.outstanding, 60000);
  assert.equal(alert.daysLeft, -4);
});

test("documents and invoices share one feed ordered by urgency", () => {
  const alerts = buildAlerts([doc(1, "2026-09-10")], [invoice(2, "2026-09-07")], today);
  assert.deepEqual(alerts.map((alert) => alert.kind), ["invoice", "document"]);
});
