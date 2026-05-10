import fs from "node:fs";
import path from "node:path";
import pptxgen from "pptxgenjs";
import { getShowcaseLocations, summarizeShowcaseLocations, type ShowcaseSummary } from "@/lib/location-showcase";
import type { ShowcaseLocation, ShowcaseLocationStatus } from "@/lib/location-showcase-types";
import { locationCategoryLabels } from "@/lib/location-showcase-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const colors = {
  ink: "0D100B",
  muted: "5A6152",
  paper: "F7F4EC",
  lime: "D4EA52",
  line: "E7E0D0",
  white: "FFFFFF",
  amber: "F7C948",
  red: "E35D5B",
  green: "8CC63E",
};

type PptxInstance = InstanceType<typeof pptxgen>;
type PptxSlide = ReturnType<PptxInstance["addSlide"]>;

function publicImagePath(publicPath: string) {
  return path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
}

function resolveImagePath(src: string | null | undefined) {
  if (!src) return publicImagePath("/crown-assets/hero-billboard.jpg");
  if (src.startsWith("http")) return src;
  const localPath = publicImagePath(src);
  return fs.existsSync(localPath) ? localPath : publicImagePath("/crown-assets/hero-billboard.jpg");
}

function routeLine(location: ShowcaseLocation) {
  const route = [location.from, location.toward].filter(Boolean).join(" -> ");
  return route || location.details || "Prime traffic route";
}

function statusColors(status: ShowcaseLocationStatus) {
  if (status === "available") return { fill: colors.green, text: colors.ink };
  if (status === "expiring") return { fill: colors.amber, text: colors.ink };
  return { fill: colors.red, text: colors.white };
}

function statusText(location: ShowcaseLocation) {
  if (location.status === "available") return "Available now";
  if (location.freeDateLabel) return `Free after ${location.freeDateLabel}`;
  return "Booked";
}

function addFooter(slide: PptxSlide, slideNo: number) {
  slide.addText("Crown Advertising", {
    x: 0.52,
    y: 7.1,
    w: 3,
    h: 0.18,
    fontFace: "Aptos",
    fontSize: 7,
    bold: true,
    color: colors.muted,
    margin: 0,
  });
  slide.addText(String(slideNo).padStart(2, "0"), {
    x: 12.2,
    y: 7.06,
    w: 0.55,
    h: 0.22,
    fontFace: "Aptos",
    fontSize: 8,
    bold: true,
    color: colors.muted,
    align: "right",
    margin: 0,
  });
}

function addPill(slide: PptxSlide, text: string, x: number, y: number, w: number, fill = colors.lime, color = colors.ink) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h: 0.32,
    rectRadius: 0.08,
    fill: { color: fill },
    line: { color: fill },
  });
  slide.addText(text, {
    x: x + 0.11,
    y: y + 0.085,
    w: w - 0.22,
    h: 0.12,
    fontFace: "Aptos",
    fontSize: 6.8,
    bold: true,
    color,
    align: "center",
    margin: 0,
    fit: "shrink",
  });
}

function addMetric(slide: PptxSlide, value: string, label: string, x: number, y: number, dark = false) {
  slide.addText(value, {
    x,
    y,
    w: 1.35,
    h: 0.36,
    fontFace: "Aptos Display",
    fontSize: 22,
    bold: true,
    color: dark ? colors.white : colors.ink,
    margin: 0,
    fit: "shrink",
  });
  slide.addText(label, {
    x,
    y: y + 0.42,
    w: 1.5,
    h: 0.17,
    fontFace: "Aptos",
    fontSize: 7,
    bold: true,
    color: dark ? "BFC8B6" : colors.muted,
    margin: 0,
    fit: "shrink",
  });
}

function addCoverSlide(pptx: PptxInstance, locations: ShowcaseLocation[], summary: ShowcaseSummary) {
  const hero = locations[0];
  const slide = pptx.addSlide();
  slide.background = { color: colors.ink };
  slide.addImage({
    path: resolveImagePath(hero?.image),
    x: 6.55,
    y: 0,
    w: 6.78,
    h: SLIDE_H,
    sizing: { type: "cover", w: 6.78, h: SLIDE_H },
  });
  slide.addShape("rect", {
    x: 5.2,
    y: 0,
    w: 3.5,
    h: SLIDE_H,
    fill: { color: colors.ink, transparency: 12 },
    line: { color: colors.ink, transparency: 100 },
  });
  slide.addImage({ path: resolveImagePath("/crown-assets/logo.jpg"), x: 0.7, y: 0.62, w: 1.68, h: 0.68 });
  addPill(slide, summary.usesFallbackData ? "Seed-ready showcase" : "Live database showcase", 0.7, 1.72, 2.28);
  slide.addText("Outdoor\nLocations\nShowcase", {
    x: 0.68,
    y: 2.28,
    w: 5.45,
    h: 2.1,
    fontFace: "Aptos Display",
    fontSize: 42,
    bold: true,
    color: colors.white,
    margin: 0,
    breakLine: false,
    fit: "shrink",
  });
  slide.addText("Client portfolio with pricing, format mix, and booked/available status for Crown Advertising inventory.", {
    x: 0.74,
    y: 4.72,
    w: 4.95,
    h: 0.58,
    fontFace: "Aptos",
    fontSize: 12,
    color: "DADFD0",
    margin: 0,
    fit: "shrink",
  });

  addMetric(slide, `${summary.total}`, "locations", 0.74, 5.82, true);
  addMetric(slide, `${summary.available}`, "available now", 2.28, 5.82, true);
  addMetric(slide, `${summary.booked}`, "booked", 3.98, 5.82, true);
}

function addSummarySlide(pptx: PptxInstance, locations: ShowcaseLocation[], summary: ShowcaseSummary) {
  const slide = pptx.addSlide();
  slide.background = { color: colors.paper };
  slide.addText("Inventory Snapshot", {
    x: 0.58,
    y: 0.48,
    w: 4.6,
    h: 0.35,
    fontFace: "Aptos Display",
    fontSize: 27,
    bold: true,
    color: colors.ink,
    margin: 0,
  });
  slide.addText(summary.usesFallbackData ? "Prepared from the seed source extracted from the provided PPT." : "Prepared from live Crown Advertising database records.", {
    x: 0.6,
    y: 0.92,
    w: 6.6,
    h: 0.18,
    fontFace: "Aptos",
    fontSize: 8,
    color: colors.muted,
    margin: 0,
  });

  [
    [`${summary.total}`, "total locations"],
    [`${summary.available}`, "available now"],
    [`${summary.booked}`, "currently booked"],
    [`${summary.expiring}`, "free within 7 days"],
  ].forEach(([value, label], index) => {
    const x = 0.65 + index * 1.65;
    slide.addShape("roundRect", {
      x,
      y: 1.45,
      w: 1.42,
      h: 0.92,
      rectRadius: 0.12,
      fill: { color: index === 1 ? colors.lime : colors.white },
      line: { color: colors.line },
    });
    slide.addText(value, { x: x + 0.18, y: 1.61, w: 0.9, h: 0.28, fontFace: "Aptos Display", fontSize: 19, bold: true, color: colors.ink, margin: 0 });
    slide.addText(label, { x: x + 0.18, y: 1.98, w: 1.0, h: 0.16, fontFace: "Aptos", fontSize: 6.6, bold: true, color: colors.muted, margin: 0, fit: "shrink" });
  });

  const cityCounts = summary.cities.map((city) => ({
    city,
    count: locations.filter((location) => location.city === city).length,
  }));
  const maxCityCount = Math.max(1, ...cityCounts.map((item) => item.count));

  slide.addText("City Coverage", { x: 0.65, y: 2.94, w: 2, h: 0.22, fontFace: "Aptos", fontSize: 10, bold: true, color: colors.ink, margin: 0 });
  cityCounts.slice(0, 8).forEach(({ city, count }, index) => {
    const y = 3.32 + index * 0.36;
    slide.addText(city, { x: 0.65, y: y - 0.02, w: 1.4, h: 0.15, fontFace: "Aptos", fontSize: 7, bold: true, color: colors.muted, margin: 0, fit: "shrink" });
    slide.addShape("rect", {
      x: 2.18,
      y: y + 0.03,
      w: Math.max(0.18, (count / maxCityCount) * 3.25),
      h: 0.1,
      fill: { color: colors.lime },
      line: { color: colors.lime },
    });
    slide.addText(String(count), { x: 5.6, y: y - 0.04, w: 0.35, h: 0.15, fontFace: "Aptos", fontSize: 7, bold: true, color: colors.ink, align: "right", margin: 0 });
  });

  const categoryCounts = summary.categories.map((category) => ({
    label: locationCategoryLabels[category],
    count: locations.filter((location) => location.category === category).length,
  }));
  const maxCategoryCount = Math.max(1, ...categoryCounts.map((item) => item.count));

  slide.addShape("roundRect", {
    x: 7.2,
    y: 1.45,
    w: 5.28,
    h: 4.82,
    rectRadius: 0.18,
    fill: { color: colors.ink },
    line: { color: colors.ink },
  });
  slide.addText("Format Mix", { x: 7.65, y: 1.88, w: 2.2, h: 0.25, fontFace: "Aptos Display", fontSize: 18, bold: true, color: colors.white, margin: 0 });
  categoryCounts.forEach(({ label, count }, index) => {
    const y = 2.55 + index * 0.62;
    slide.addText(label, { x: 7.65, y: y - 0.04, w: 2.1, h: 0.16, fontFace: "Aptos", fontSize: 7.4, bold: true, color: "DDE5D2", margin: 0 });
    slide.addShape("rect", {
      x: 9.85,
      y: y + 0.02,
      w: Math.max(0.3, (count / maxCategoryCount) * 1.85),
      h: 0.16,
      fill: { color: colors.lime },
      line: { color: colors.lime },
    });
    slide.addText(String(count), { x: 11.95, y: y - 0.03, w: 0.35, h: 0.16, fontFace: "Aptos", fontSize: 7.4, bold: true, color: colors.white, align: "right", margin: 0 });
  });
  addFooter(slide, 2);
}

function addCityDividerSlide(pptx: PptxInstance, city: string, cityLocations: ShowcaseLocation[], slideNo: number) {
  const slide = pptx.addSlide();
  slide.background = { color: colors.ink };
  slide.addImage({
    path: resolveImagePath(cityLocations[0]?.image),
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    sizing: { type: "cover", w: SLIDE_W, h: SLIDE_H },
  });
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: colors.ink, transparency: 23 },
    line: { color: colors.ink, transparency: 100 },
  });
  addPill(slide, `${cityLocations.length} locations`, 0.72, 1.4, 1.62);
  slide.addText(city, {
    x: 0.7,
    y: 2.06,
    w: 8.2,
    h: 1.1,
    fontFace: "Aptos Display",
    fontSize: city.length > 14 ? 46 : 58,
    bold: true,
    color: colors.white,
    margin: 0,
    fit: "shrink",
  });
  slide.addText("Selected inventory, route direction, pricing, and availability status.", {
    x: 0.76,
    y: 3.35,
    w: 5.7,
    h: 0.3,
    fontFace: "Aptos",
    fontSize: 12,
    color: "DADFD0",
    margin: 0,
  });
  addFooter(slide, slideNo);
}

function addFact(slide: PptxSlide, label: string, value: string, x: number, y: number, w = 2.28) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h: 0.72,
    rectRadius: 0.12,
    fill: { color: "F4F0E7" },
    line: { color: colors.line },
  });
  slide.addText(label, {
    x: x + 0.16,
    y: y + 0.13,
    w: w - 0.32,
    h: 0.12,
    fontFace: "Aptos",
    fontSize: 6.2,
    bold: true,
    color: "8A9720",
    margin: 0,
  });
  slide.addText(value, {
    x: x + 0.16,
    y: y + 0.35,
    w: w - 0.32,
    h: 0.18,
    fontFace: "Aptos",
    fontSize: 8,
    bold: true,
    color: colors.ink,
    margin: 0,
    fit: "shrink",
  });
}

function addLocationSlide(pptx: PptxInstance, location: ShowcaseLocation, slideNo: number, index: number, total: number) {
  const slide = pptx.addSlide();
  slide.background = { color: colors.paper };
  slide.addImage({
    path: resolveImagePath(location.image),
    x: 0,
    y: 0,
    w: 8.35,
    h: SLIDE_H,
    sizing: { type: "cover", w: 8.35, h: SLIDE_H },
  });
  slide.addShape("rect", {
    x: 0,
    y: 5.35,
    w: 8.35,
    h: 2.15,
    fill: { color: colors.ink, transparency: 4 },
    line: { color: colors.ink, transparency: 100 },
  });
  slide.addText(location.city, {
    x: 0.56,
    y: 5.76,
    w: 2.2,
    h: 0.16,
    fontFace: "Aptos",
    fontSize: 7,
    bold: true,
    color: colors.lime,
    margin: 0,
  });
  slide.addText(location.name, {
    x: 0.54,
    y: 6.02,
    w: 6.7,
    h: 0.52,
    fontFace: "Aptos Display",
    fontSize: location.name.length > 46 ? 18 : 24,
    bold: true,
    color: colors.white,
    margin: 0,
    fit: "shrink",
  });
  slide.addText(routeLine(location), {
    x: 0.56,
    y: 6.62,
    w: 6.5,
    h: 0.2,
    fontFace: "Aptos",
    fontSize: 8.5,
    color: "DDE5D2",
    margin: 0,
    fit: "shrink",
  });

  const status = statusColors(location.status);
  addPill(slide, location.size, 0.55, 0.45, 1.12);
  addPill(slide, statusText(location), 1.82, 0.45, 2.18, status.fill, status.text);

  slide.addText(String(index + 1).padStart(2, "0"), {
    x: 9.05,
    y: 0.58,
    w: 0.62,
    h: 0.32,
    fontFace: "Aptos Display",
    fontSize: 20,
    bold: true,
    color: colors.lime,
    margin: 0,
  });
  slide.addText(`of ${total}`, {
    x: 9.72,
    y: 0.68,
    w: 0.55,
    h: 0.16,
    fontFace: "Aptos",
    fontSize: 7,
    bold: true,
    color: colors.muted,
    margin: 0,
  });
  slide.addText(location.name, {
    x: 9.05,
    y: 1.22,
    w: 3.35,
    h: 0.68,
    fontFace: "Aptos Display",
    fontSize: location.name.length > 42 ? 18 : 22,
    bold: true,
    color: colors.ink,
    margin: 0,
    fit: "shrink",
  });
  slide.addText(locationCategoryLabels[location.category], {
    x: 9.08,
    y: 2.0,
    w: 2.3,
    h: 0.17,
    fontFace: "Aptos",
    fontSize: 7.4,
    bold: true,
    color: "8A9720",
    margin: 0,
  });

  slide.addShape("roundRect", {
    x: 9.0,
    y: 2.52,
    w: 3.52,
    h: 1.02,
    rectRadius: 0.14,
    fill: { color: colors.ink },
    line: { color: colors.ink },
  });
  slide.addText("Price", { x: 9.25, y: 2.8, w: 0.7, h: 0.13, fontFace: "Aptos", fontSize: 6.5, bold: true, color: colors.lime, margin: 0 });
  slide.addText(location.priceLabel ?? "On request", {
    x: 9.25,
    y: 3.03,
    w: 2.75,
    h: 0.24,
    fontFace: "Aptos Display",
    fontSize: 16,
    bold: true,
    color: colors.white,
    margin: 0,
    fit: "shrink",
  });

  addFact(slide, "STATUS", location.availabilityLabel, 9.0, 3.88, 3.52);
  addFact(slide, "FROM", location.from ?? "On route", 9.0, 4.8, 1.68);
  addFact(slide, "TOWARDS", location.toward ?? "Prime traffic", 10.84, 4.8, 1.68);
  addFact(slide, "FORMAT", locationCategoryLabels[location.category], 9.0, 5.72, 1.68);
  addFact(slide, "SIZE", location.size, 10.84, 5.72, 1.68);

  addFooter(slide, slideNo);
}

export async function GET() {
  const locations = await getShowcaseLocations();
  const summary = summarizeShowcaseLocations(locations);
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Crown Advertising";
  pptx.company = "Crown Advertising";
  pptx.subject = "Public client outdoor locations showcase";
  pptx.title = "Crown Advertising Outdoor Locations Showcase";
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
  };

  addCoverSlide(pptx, locations, summary);
  addSummarySlide(pptx, locations, summary);

  let slideNo = 3;
  for (const city of summary.cities) {
    const cityLocations = locations.filter((location) => location.city === city);
    addCityDividerSlide(pptx, city, cityLocations, slideNo);
    slideNo += 1;

    cityLocations.forEach((location, index) => {
      addLocationSlide(pptx, location, slideNo, index, cityLocations.length);
      slideNo += 1;
    });
  }

  const content = await pptx.write({ outputType: "nodebuffer", compression: true });
  const body = Buffer.isBuffer(content) ? content : Buffer.from(content as ArrayBuffer);
  const arrayBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": 'attachment; filename="crown-advertising-locations-showcase.pptx"',
      "Cache-Control": "no-store",
    },
  });
}
