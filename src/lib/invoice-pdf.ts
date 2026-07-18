import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";

export type InvoiceDocumentKind = "invoice" | "receipt";

export interface InvoicePdfPayment {
  amount: number;
  paymentDate: string;
  reference: string | null;
}

export interface InvoicePdfData {
  kind: InvoiceDocumentKind;
  invoiceNo: string;
  issuedAt: string;
  dueDate: string;
  periodStart: string | null;
  periodEnd: string | null;
  amount: number;
  paidAmount: number;
  outstanding: number;
  invoiceStatus: string;
  notes: string | null;
  client: {
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  location: {
    name: string;
    size: string;
    city: string;
    address: string | null;
  };
  booking: {
    startDate: string;
    endDate: string;
    duration: string;
    lockingRef: string | null;
    salePerson: string | null;
  };
  payments: InvoicePdfPayment[];
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 44;
const NAVY = rgb(0.043, 0.075, 0.137);
const NAVY_SOFT = rgb(0.075, 0.114, 0.196);
const AMBER = rgb(0.984, 0.749, 0.141);
const AMBER_PALE = rgb(1, 0.984, 0.91);
const EMERALD = rgb(0.023, 0.588, 0.412);
const EMERALD_PALE = rgb(0.925, 0.992, 0.961);
const SLATE = rgb(0.278, 0.333, 0.412);
const MUTED = rgb(0.475, 0.525, 0.604);
const LINE = rgb(0.886, 0.91, 0.941);
const PAPER = rgb(0.985, 0.99, 0.997);
const WHITE = rgb(1, 1, 1);

function cleanText(value: string | null | undefined): string {
  if (!value) return "-";
  return value
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, "?");
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function money(value: number): string {
  return `PKR ${Math.round(value).toLocaleString("en-PK")}`;
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

function drawLabel(page: PDFPage, text: string, x: number, y: number, font: PDFFont) {
  page.drawText(cleanText(text).toUpperCase(), { x, y, size: 7.5, font, color: MUTED });
}

function drawWrapped(page: PDFPage, text: string, x: number, y: number, maxWidth: number, font: PDFFont, size = 9.5, color = SLATE, maxLines = 3) {
  const lines = wrapText(text, font, size, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => page.drawText(line, { x, y: y - index * (size + 3), size, font, color }));
  return y - lines.length * (size + 3);
}

function drawLogo(page: PDFPage, logo: PDFImage | null) {
  if (!logo) return;
  const width = 112;
  const height = width * (logo.height / logo.width);
  page.drawRectangle({ x: MARGIN, y: PAGE_HEIGHT - 91, width, height, color: WHITE });
  page.drawImage(logo, { x: MARGIN + 3, y: PAGE_HEIGHT - 88, width: width - 6, height: height - 4 });
}

export async function createInvoicePdf(data: InvoicePdfData, logoBytes?: Uint8Array): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${data.kind === "receipt" ? "Payment Receipt" : "Invoice"} ${data.invoiceNo}`);
  pdf.setAuthor("Crown Advertising");
  pdf.setSubject(data.kind === "receipt" ? "Confirmed payment receipt" : "Payment request invoice");
  pdf.setCreator("Crown Advertising Management Dashboard");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let logo: PDFImage | null = null;
  if (logoBytes) {
    try {
      logo = await pdf.embedJpg(logoBytes);
    } catch {
      logo = null;
    }
  }

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: PAPER });
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 126, width: PAGE_WIDTH, height: 126, color: NAVY });
  page.drawRectangle({ x: PAGE_WIDTH - 190, y: PAGE_HEIGHT - 126, width: 190, height: 126, color: NAVY_SOFT });
  page.drawRectangle({ x: PAGE_WIDTH - 9, y: PAGE_HEIGHT - 126, width: 9, height: 126, color: AMBER });
  drawLogo(page, logo);

  const documentTitle = data.kind === "receipt" ? "PAYMENT RECEIPT" : "PAYMENT REQUEST";
  const documentSubline = data.kind === "receipt" ? "Confirmed payment record" : "Invoice for advertising services";
  page.drawText(documentTitle, { x: 342, y: PAGE_HEIGHT - 54, size: 17, font: bold, color: WHITE });
  page.drawText(documentSubline, { x: 342, y: PAGE_HEIGHT - 73, size: 8.5, font: regular, color: rgb(0.72, 0.77, 0.84) });
  page.drawText(cleanText(data.invoiceNo), { x: 342, y: PAGE_HEIGHT - 99, size: 11, font: bold, color: AMBER });

  let y = PAGE_HEIGHT - 154;
  const leftWidth = 245;
  const rightX = 318;
  drawLabel(page, "Issued by", MARGIN, y, bold);
  drawLabel(page, "Bill to", rightX, y, bold);
  y -= 18;
  page.drawText("Crown Advertising", { x: MARGIN, y, size: 12.5, font: bold, color: NAVY });
  page.drawText(cleanText(data.client.name), { x: rightX, y, size: 12.5, font: bold, color: NAVY });
  y -= 17;
  drawWrapped(page, "Suit # 19/20, 2nd Floor, Hassan Center, 134-Ferozepur Road, Lahore", MARGIN, y, leftWidth, regular, 8.5, SLATE, 2);
  drawWrapped(page, data.client.company ?? data.client.address ?? "Client account", rightX, y, 230, regular, 8.5, SLATE, 2);
  y -= 31;
  page.drawText("+92-321-4462775  |  ceo.sarfraz@gmail.com", { x: MARGIN, y, size: 8, font: regular, color: MUTED });
  const clientContact = [data.client.email, data.client.phone].filter(Boolean).join("  |  ") || "Contact details not provided";
  drawWrapped(page, clientContact, rightX, y, 230, regular, 8, MUTED, 2);
  y -= 18;
  page.drawText("NTN 2666456-9", { x: MARGIN, y, size: 8, font: bold, color: MUTED });

  y -= 30;
  page.drawRectangle({ x: MARGIN, y: y - 112, width: PAGE_WIDTH - MARGIN * 2, height: 122, color: WHITE, borderColor: LINE, borderWidth: 0.8 });
  page.drawRectangle({ x: MARGIN, y: y - 112, width: 4, height: 122, color: AMBER });
  drawLabel(page, "Campaign details", MARGIN + 18, y - 16, bold);
  const campaignY = y - 39;
  const columns = [MARGIN + 18, MARGIN + 184, MARGIN + 345];
  const details = [
    ["Location", `${data.location.name} - ${data.location.city}`],
    ["Media size", data.location.size],
    ["Service period", data.periodStart && data.periodEnd ? `${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}` : `${formatDate(data.booking.startDate)} - ${formatDate(data.booking.endDate)}`],
  ];
  details.forEach(([label, value], index) => {
    drawLabel(page, label, columns[index], campaignY, bold);
    drawWrapped(page, value, columns[index], campaignY - 17, index === 0 ? 145 : 140, bold, 9, NAVY, 2);
  });
  drawLabel(page, "Due date", MARGIN + 18, campaignY - 47, bold);
  page.drawText(formatDate(data.dueDate), { x: MARGIN + 18, y: campaignY - 64, size: 9, font: bold, color: data.outstanding > 0 ? rgb(0.76, 0.31, 0.05) : EMERALD });
  drawLabel(page, "Booking duration", MARGIN + 184, campaignY - 47, bold);
  page.drawText(cleanText(data.booking.duration), { x: MARGIN + 184, y: campaignY - 64, size: 9, font: bold, color: NAVY });
  drawLabel(page, "Campaign reference", MARGIN + 345, campaignY - 47, bold);
  page.drawText(cleanText(data.booking.lockingRef ?? data.invoiceNo), { x: MARGIN + 345, y: campaignY - 64, size: 9, font: bold, color: NAVY });

  y -= 144;
  drawLabel(page, data.kind === "receipt" ? "Payment summary" : "Invoice summary", MARGIN, y, bold);
  y -= 15;
  const tableWidth = PAGE_WIDTH - MARGIN * 2;
  page.drawRectangle({ x: MARGIN, y: y - 30, width: tableWidth, height: 30, color: NAVY });
  page.drawText("DESCRIPTION", { x: MARGIN + 14, y: y - 19, size: 7.5, font: bold, color: WHITE });
  page.drawText("AMOUNT", { x: PAGE_WIDTH - MARGIN - 94, y: y - 19, size: 7.5, font: bold, color: WHITE });
  y -= 30;
  const rows = data.kind === "receipt"
    ? [
        ["Invoice value", money(data.amount), false],
        ["Payment confirmed", money(data.paidAmount), true],
        ["Balance remaining", money(data.outstanding), false],
      ] as const
    : [
        ["Advertising services", money(data.amount), false],
        ["Payments received", money(data.paidAmount), true],
        ["Amount due", money(data.outstanding), false],
      ] as const;
  rows.forEach(([label, value, positive], index) => {
    const isTotal = index === rows.length - 1;
    const fill = isTotal ? (data.kind === "receipt" ? EMERALD_PALE : AMBER_PALE) : WHITE;
    page.drawRectangle({ x: MARGIN, y: y - 34, width: tableWidth, height: 34, color: fill, borderColor: LINE, borderWidth: 0.5 });
    page.drawText(label, { x: MARGIN + 14, y: y - 21, size: isTotal ? 10 : 9, font: isTotal ? bold : regular, color: NAVY });
    page.drawText(value, { x: PAGE_WIDTH - MARGIN - 108, y: y - 21, size: isTotal ? 10.5 : 9.5, font: bold, color: positive ? EMERALD : isTotal && data.kind === "invoice" ? rgb(0.76, 0.31, 0.05) : NAVY });
    y -= 34;
  });

  if (data.kind === "receipt") {
    y -= 22;
    drawLabel(page, "Confirmed payment activity", MARGIN, y, bold);
    y -= 15;
    const payments = data.payments.slice(0, 5);
    if (payments.length === 0) {
      page.drawText(`Payment confirmed on ${formatDate(data.issuedAt)}.`, { x: MARGIN, y: y - 14, size: 9, font: regular, color: SLATE });
      y -= 28;
    } else {
      payments.forEach((payment) => {
        page.drawRectangle({ x: MARGIN, y: y - 28, width: tableWidth, height: 28, color: WHITE, borderColor: LINE, borderWidth: 0.5 });
        page.drawText(formatDate(payment.paymentDate), { x: MARGIN + 12, y: y - 18, size: 8.5, font: bold, color: NAVY });
        page.drawText(money(payment.amount), { x: MARGIN + 145, y: y - 18, size: 8.5, font: bold, color: EMERALD });
        page.drawText(cleanText(payment.reference ?? "No reference supplied"), { x: MARGIN + 285, y: y - 18, size: 8.2, font: regular, color: SLATE });
        y -= 28;
      });
    }
  } else {
    y -= 23;
    page.drawRectangle({ x: MARGIN, y: y - 57, width: tableWidth, height: 57, color: AMBER_PALE, borderColor: rgb(0.96, 0.8, 0.36), borderWidth: 0.7 });
    page.drawText("PAYMENT NOTE", { x: MARGIN + 14, y: y - 18, size: 7.5, font: bold, color: rgb(0.65, 0.35, 0.02) });
    drawWrapped(page, "Please pay using the agreed payment channel and share the transfer, cheque or receipt reference with Crown Advertising for confirmation.", MARGIN + 14, y - 37, tableWidth - 28, regular, 8.5, SLATE, 2);
    y -= 57;
  }

  if (data.notes && y > 115) {
    y -= 20;
    drawLabel(page, "Notes", MARGIN, y, bold);
    drawWrapped(page, data.notes, MARGIN, y - 17, tableWidth, regular, 8.5, SLATE, 2);
  }

  page.drawLine({ start: { x: MARGIN, y: 60 }, end: { x: PAGE_WIDTH - MARGIN, y: 60 }, thickness: 0.8, color: LINE });
  page.drawText(data.kind === "receipt" ? "This document confirms the payment recorded against the invoice above." : "Thank you for choosing Crown Advertising.", { x: MARGIN, y: 42, size: 7.7, font: regular, color: MUTED });
  page.drawText("Generated securely from Crown Advertising Management", { x: PAGE_WIDTH - MARGIN - 205, y: 42, size: 7.2, font: regular, color: MUTED });

  return pdf.save();
}
