import type { AccountReport } from "@/lib/account-report";

type WorkbookCell = string | number | null;

function xmlEscape(value: WorkbookCell): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cell(value: WorkbookCell, styleId?: string): string {
  const type = typeof value === "number" ? "Number" : "String";
  const style = styleId ? ` ss:StyleID="${styleId}"` : "";
  return `<Cell${style}><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`;
}

function row(values: WorkbookCell[], styleId?: string): string {
  return `<Row>${values.map((value) => cell(value, styleId)).join("")}</Row>`;
}

function worksheet(name: string, rows: string[], widths: number[]): string {
  return `
    <Worksheet ss:Name="${xmlEscape(name)}">
      <Table>
        ${widths.map((width) => `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`).join("")}
        ${rows.join("\n")}
      </Table>
      <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
        <FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane>
        <Selected/>
      </WorksheetOptions>
    </Worksheet>`;
}

function currency(value: number): number {
  return Math.round(value * 100) / 100;
}

function statusForInvoice(status: string, dueDate: string, paid: number, amount: number): string {
  if (status === "CANCELLED") return "Cancelled";
  if (paid >= amount) return "Paid";
  if (dueDate < new Date().toISOString().slice(0, 10)) return "Overdue";
  if (paid > 0) return "Partial";
  return "Pending";
}

export function buildAccountsWorkbook(report: AccountReport): string {
  const locationById = new Map(report.locations.map((location) => [location.id, location]));
  const bookingById = new Map(report.bookings.map((booking) => [booking.id, booking]));
  const invoiceById = new Map(report.periodInvoices.map((invoice) => [invoice.id, invoice]));

  const summaryRows = [
    row(["Crown Advertising — Accounts Report"], "Title"),
    row(["Selected period", report.rangeLabel]),
    row(["Comparison period", report.compareLabel ?? "Not enabled"]),
    row([]),
    row(["Metric", "Selected period (PKR)", "Comparison (PKR)", "Change (%)"], "Header"),
    ...([
      ["Booked sales", report.metrics.bookedSales, report.comparison?.bookedSales ?? null],
      ["Invoiced sales", report.metrics.invoicedSales, report.comparison?.invoicedSales ?? null],
      ["Cash received", report.metrics.cashReceived, report.comparison?.cashReceived ?? null],
      ["Expenses", report.metrics.expenses, report.comparison?.expenses ?? null],
      ["Net cash", report.metrics.netCash, report.comparison?.netCash ?? null],
      ["Crown net", report.metrics.crownNet, report.comparison?.crownNet ?? null],
      ["Period invoice outstanding", report.metrics.outstanding, report.comparison?.outstanding ?? null],
    ] as Array<[string, number, number | null]>).map(([label, current, comparison]) => {
      const change = comparison === null || comparison === 0 ? null : ((current - comparison) / Math.abs(comparison)) * 100;
      return row([label, currency(current), comparison === null ? null : currency(comparison), change === null ? null : currency(change)], "Currency");
    }),
    row([]),
    row(["Current receivables", "PKR"], "Header"),
    row(["Total outstanding", currency(report.receivableTotals.outstanding)], "Currency"),
    row(["Overdue", currency(report.receivableTotals.overdue)], "Currency"),
    row(["Due within 30 days", currency(report.receivableTotals.dueSoon)], "Currency"),
    row(["Open invoices", report.receivableTotals.openInvoices]),
  ];

  const salesRows = [
    row(["Booking ID", "Booked on", "Client", "Location", "City", "Contract start", "Contract end", "Billing plan", "Sales person", "Contract value (PKR)"], "Header"),
    ...report.periodBookings.map((booking) => {
      const location = locationById.get(booking.location_id);
      return row([
        booking.id,
        booking.created_at.slice(0, 10),
        booking.client_name,
        location?.name ?? "Unknown",
        location?.city ?? "",
        booking.start_date.slice(0, 10),
        booking.end_date.slice(0, 10),
        booking.billing_type === "monthly" ? "Monthly rent" : "Combined at end",
        booking.sale_person ?? "",
        currency(booking.amount),
      ]);
    }),
  ];

  const invoiceRows = [
    row(["Invoice", "Due date", "Client", "Location", "Period start", "Period end", "Amount (PKR)", "Paid (PKR)", "Outstanding (PKR)", "Status", "Payment reference"], "Header"),
    ...report.periodInvoices.map((invoice) => {
      const booking = bookingById.get(invoice.booking_id);
      const location = booking ? locationById.get(booking.location_id) : null;
      return row([
        invoice.invoice_no,
        invoice.due_date,
        booking?.client_name ?? "Unknown",
        location?.name ?? "Unknown",
        invoice.period_start ?? "",
        invoice.period_end ?? "",
        currency(invoice.amount),
        currency(invoice.paid_amount),
        currency(Math.max(0, invoice.amount - invoice.paid_amount)),
        statusForInvoice(invoice.status, invoice.due_date, invoice.paid_amount, invoice.amount),
        invoice.payment_reference ?? "",
      ]);
    }),
  ];

  const paymentRows = [
    row(["Payment date", "Invoice", "Client", "Location", "Amount received (PKR)", "Reference", "Notes"], "Header"),
    ...report.periodPayments.map((payment) => {
      const invoice = invoiceById.get(payment.invoice_id)
        ?? report.receivables.find((row) => row.invoice.id === payment.invoice_id)?.invoice;
      const booking = invoice ? bookingById.get(invoice.booking_id) : null;
      const location = booking ? locationById.get(booking.location_id) : null;
      return row([
        payment.payment_date,
        invoice?.invoice_no ?? payment.invoice_id,
        booking?.client_name ?? "Unknown",
        location?.name ?? "Unknown",
        currency(payment.amount),
        payment.payment_reference ?? "",
        payment.notes ?? "",
      ]);
    }),
  ];

  const expenseRows = [
    row(["Effective date", "Location", "Expense type", "Description", "Recurring", "Amount (PKR)"], "Header"),
    ...report.effectiveExpenses.map(({ expense, occurrenceDate }) => row([
      occurrenceDate,
      locationById.get(expense.location_id)?.name ?? "Unknown",
      expense.expense_type.replaceAll("_", " "),
      expense.description ?? "",
      expense.is_recurring ? "Yes" : "No",
      currency(expense.amount),
    ])),
  ];

  const locationRows = [
    row(["Location", "City", "Active bookings", "Booked sales (PKR)", "Invoiced (PKR)", "Cash received (PKR)", "Expenses (PKR)", "Net cash (PKR)", "Outstanding (PKR)", "Partner share (%)", "Crown net (PKR)"], "Header"),
    ...report.locationPerformance.map((performance) => row([
      performance.location.name,
      performance.location.city,
      performance.activeBookings,
      currency(performance.bookedSales),
      currency(performance.invoicedSales),
      currency(performance.cashReceived),
      currency(performance.expenses),
      currency(performance.netCash),
      currency(performance.outstanding),
      currency(performance.partnerPercentage),
      currency(performance.crownNet),
    ])),
  ];

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>Crown Advertising</Author>
    <Title>Accounts Report ${xmlEscape(report.rangeLabel)}</Title>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/><Font ss:FontName="Aptos" ss:Size="10"/></Style>
    <Style ss:ID="Title"><Font ss:FontName="Aptos Display" ss:Size="18" ss:Bold="1" ss:Color="#111827"/></Style>
    <Style ss:ID="Header"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Aptos" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#111827" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Currency"><NumberFormat ss:Format="#,##0.00"/></Style>
  </Styles>
  ${worksheet("Summary", summaryRows, [210, 130, 130, 100])}
  ${worksheet("Sales", salesRows, [65, 90, 150, 210, 90, 90, 90, 115, 110, 120])}
  ${worksheet("Invoices", invoiceRows, [100, 90, 150, 210, 90, 90, 110, 110, 120, 80, 140])}
  ${worksheet("Payments", paymentRows, [90, 100, 150, 210, 130, 140, 180])}
  ${worksheet("Expenses", expenseRows, [90, 210, 150, 220, 75, 110])}
  ${worksheet("Location Performance", locationRows, [220, 90, 90, 125, 115, 125, 110, 110, 120, 100, 110])}
</Workbook>`;
}
