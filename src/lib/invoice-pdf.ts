import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";

export type InvoiceDocumentKind = "invoice" | "receipt";

export interface InvoicePdfData {
  kind: InvoiceDocumentKind;
  invoiceNo: string;
  issuedAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  amount: number;
  paidAmount: number;
  outstanding: number;
  client: {
    name: string;
    company: string | null;
    address: string | null;
  };
  location: {
    name: string;
    size: string;
    city: string;
    facingTowards: string | null;
    mediaCategory: string;
  };
  booking: {
    startDate: string;
    endDate: string;
    vendor: string | null;
  };
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const TABLE_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BLACK = rgb(0, 0, 0);
const SHADOW = rgb(0.72, 0.75, 0.79);
const BORDER = 0.9;

// Sr. #, Description, W, H, Starting, Ending, Days, Display, Amount
const COLUMNS = [32, 176, 28, 28, 56, 56, 32, 42, 65.28];

const MEDIA_LABELS: Record<string, string> = {
  static: "Static Panel",
  motorway: "Motorway Panel",
  digital: "Digital SMD",
  "bridge-panel": "Bridge Panel",
  "toll-plaza": "Toll Plaza Panel",
};

function cleanText(value: string | null | undefined): string {
  if (!value) return "-";
  return value
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[×✕✖]/g, "x")
    .replace(/[^\x20-\x7E]/g, "?");
}

function dateParts(value: string | null) {
  const match = value?.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? { year: match[1], month: match[2], day: match[3] } : null;
}

export function shortDate(value: string | null): string {
  const parts = dateParts(value);
  return parts ? `${parts.day}.${parts.month}.${parts.year.slice(2)}` : "-";
}

export function longDate(value: string | null): string {
  const parts = dateParts(value);
  return parts ? `${parts.day}.${parts.month}.${parts.year}` : "-";
}

/** Inclusive day count, the way display periods are billed (06.08 to 09.08 is 4 days). */
export function displayDays(start: string | null, end: string | null): string {
  if (!dateParts(start) || !dateParts(end)) return "-";
  const span = Date.parse(`${end!.slice(0, 10)}T00:00:00Z`) - Date.parse(`${start!.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(span)) return "-";
  return String(Math.max(1, Math.round(span / 86_400_000) + 1));
}

function money(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/** "60x15" splits into its own columns; anything else stays whole and spans both. */
export function sizeParts(size: string): [string, string | null] {
  // Matched on the raw value, not the cleaned one: sizes are stored with the
  // multiplication sign (60x40 as U+00D7), which cleanText would flatten before
  // the split could see it.
  const match = (size ?? "").match(/(\d+(?:\.\d+)?)\s*(?:[xX×✕✖*]|by)\s*(\d+(?:\.\d+)?)/);
  return match ? [match[1], match[2]] : [cleanText(size), null];
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = cleanText(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : ["-"];
}

type Align = "left" | "center";

/** One bordered grid cell with vertically centred text, shrunk so it can never bleed into its neighbours. */
function cell(page: PDFPage, x: number, y: number, width: number, height: number, options: {
  text?: string;
  font?: PDFFont;
  size?: number;
  align?: Align;
} = {}) {
  page.drawRectangle({ x, y, width, height, borderColor: BLACK, borderWidth: BORDER });
  const { text, font, align = "left" } = options;
  if (!text || !font) return;
  const value = cleanText(text);
  let size = options.size ?? 9;
  const available = width - 12;
  while (size > 5 && font.widthOfTextAtSize(value, size) > available) size -= 0.25;
  const textX = align === "center" ? x + (width - font.widthOfTextAtSize(value, size)) / 2 : x + 6;
  page.drawText(value, { x: textX, y: y + (height - size) / 2 + 1.5, size, font, color: BLACK });
}

function columnX(index: number): number {
  return MARGIN + COLUMNS.slice(0, index).reduce((total, width) => total + width, 0);
}

export async function createInvoicePdf(data: InvoicePdfData, logoBytes?: Uint8Array): Promise<Uint8Array> {
  const receipt = data.kind === "receipt";
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${receipt ? "Receipt" : "Invoice"} ${data.invoiceNo}`);
  pdf.setAuthor("Crown Advertising");
  pdf.setCreator("Crown Advertising Management Dashboard");

  const regular = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  let logo: PDFImage | null = null;
  if (logoBytes) {
    try {
      logo = await pdf.embedJpg(logoBytes);
    } catch {
      logo = null;
    }
  }

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  if (logo) {
    const width = 150;
    const height = width * (logo.height / logo.width);
    page.drawImage(logo, { x: PAGE_WIDTH - MARGIN - width - 40, y: y - height, width, height });
    y -= height;
  }

  // Client on the left, document reference on the right.
  y -= 80;
  const metaX = MARGIN + 335;
  const metaWidth = TABLE_WIDTH - 335;
  const metaRows: [string, string][] = [
    [cleanText(data.client.company ?? data.client.name).toUpperCase(), `${receipt ? "Receipt" : "Invoice"} No: ${cleanText(data.invoiceNo)}`],
    [`ADDRESS : ${cleanText(data.client.address ?? data.location.city)}`, `${receipt ? "Receipt" : "Invoice"} Date: ${longDate(data.issuedAt)}`],
  ];
  for (const [left, right] of metaRows) {
    y -= 24;
    cell(page, MARGIN, y, 300, 24, { text: left, font: bold, size: 11 });
    cell(page, MARGIN + 300, y, 35, 24);
    cell(page, metaX, y, metaWidth, 24, { text: right, font: bold, size: 10 });
  }

  // Title
  y -= 76;
  const title = receipt ? "RECEIPT" : "INVOICE";
  const titleX = MARGIN + (TABLE_WIDTH - bold.widthOfTextAtSize(title, 30)) / 2;
  page.drawText(title, { x: titleX + 1.6, y: y - 1.6, size: 30, font: bold, color: SHADOW });
  page.drawText(title, { x: titleX, y, size: 30, font: bold, color: BLACK });

  // Column headers: two banded rows so SIZE and Display Date can span their pairs.
  y -= 46;
  const headerHeight = 17;
  const spans: [number, string][] = [[0, "Sr. #"], [1, "Description"], [6, "Days"], [7, "Display"], [8, "Amount"]];
  for (const [index, label] of spans) {
    cell(page, columnX(index), y - headerHeight * 2, COLUMNS[index], headerHeight * 2, { text: label, font: bold, size: 9, align: index === 1 ? "left" : "center" });
  }
  cell(page, columnX(2), y - headerHeight, COLUMNS[2] + COLUMNS[3], headerHeight, { text: "SIZE", font: bold, size: 9, align: "center" });
  cell(page, columnX(4), y - headerHeight, COLUMNS[4] + COLUMNS[5], headerHeight, { text: "Display Date", font: bold, size: 9, align: "center" });
  const subHeaders = ["W", "H", "Starting", "Ending"];
  subHeaders.forEach((label, offset) => {
    cell(page, columnX(2 + offset), y - headerHeight * 2, COLUMNS[2 + offset], headerHeight, { text: label, font: bold, size: 9, align: "center" });
  });
  y -= headerHeight * 2;

  // Single line item: the booked display for this invoice.
  const media = MEDIA_LABELS[data.location.mediaCategory] ?? "";
  const description = ["Rent", media, cleanText(data.location.name), data.location.facingTowards ? `Facing ${cleanText(data.location.facingTowards)}` : ""]
    .filter(Boolean)
    .join(" ");
  const descriptionLines = wrapText(description, bold, 9.5, COLUMNS[1] - 12).slice(0, 3);
  const rowHeight = Math.max(34, descriptionLines.length * 13 + 14);
  const start = data.periodStart ?? data.booking.startDate;
  const end = data.periodEnd ?? data.booking.endDate;
  const [sizeWidth, sizeHeight] = sizeParts(data.location.size);
  const mergeSize = sizeHeight === null;
  const values = ["1", "", sizeWidth, sizeHeight ?? "", shortDate(start), shortDate(end), displayDays(start, end), cleanText(data.booking.vendor), money(data.amount)];

  y -= rowHeight;
  values.forEach((value, index) => {
    if (mergeSize && index === 3) return;
    const width = mergeSize && index === 2 ? COLUMNS[2] + COLUMNS[3] : COLUMNS[index];
    cell(page, columnX(index), y, width, rowHeight, { text: value, font: bold, size: 9.5, align: index === 1 ? "left" : "center" });
  });
  const firstLineY = y + rowHeight - (rowHeight - descriptionLines.length * 13) / 2 - 11;
  descriptionLines.forEach((line, index) => {
    page.drawText(line, { x: columnX(1) + 6, y: firstLineY - index * 13, size: 9.5, font: bold, color: BLACK });
  });

  // Spacer row, then the totals.
  y -= 16;
  COLUMNS.forEach((width, index) => cell(page, columnX(index), y, width, 16));

  const totals: [string, string][] = [["TOTAL", money(data.amount)]];
  if (receipt) {
    totals.push(["RECEIVED", money(data.paidAmount)]);
    if (data.outstanding > 0) totals.push(["BALANCE", money(data.outstanding)]);
  }
  for (const [label, value] of totals) {
    y -= 22;
    cell(page, columnX(6), y, COLUMNS[6] + COLUMNS[7], 22, { text: label, font: bold, size: 10 });
    cell(page, columnX(8), y, COLUMNS[8], 22, { text: value, font: bold, size: 10, align: "center" });
  }

  y -= 46;
  page.drawText("Best Regards", { x: MARGIN + 24, y, size: 10, font: regular, color: BLACK });
  page.drawText("Nasir Saeed", { x: MARGIN + 24, y: y - 42, size: 10, font: regular, color: BLACK });

  return pdf.save();
}
