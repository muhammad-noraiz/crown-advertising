"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { LocationMediaCategory } from "@/lib/supabase/types";
import type { ShowcaseLocation, ShowcaseLocationStatus } from "@/lib/location-showcase-types";
import { locationCategoryLabels } from "@/lib/location-showcase-types";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "Booked", value: "booked" },
  { label: "Free soon", value: "expiring" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["value"];

interface Props {
  locations: ShowcaseLocation[];
  cities: readonly string[];
  usesFallbackData: boolean;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function statusTone(status: ShowcaseLocationStatus) {
  if (status === "available") return "border-lime-300/40 bg-lime-300/18 text-lime-50";
  if (status === "expiring") return "border-amber-200/40 bg-amber-300/18 text-amber-50";
  return "border-red-300/30 bg-red-500/18 text-red-50";
}

function statusLabel(location: ShowcaseLocation) {
  if (location.status === "available") return "Available";
  if (location.freeDateLabel) return `Free ${location.freeDateLabel}`;
  return "Booked";
}

function matchesStatus(location: ShowcaseLocation, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "booked") return location.status === "booked" || location.status === "expiring";
  return location.status === filter;
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="M10 3v8m0 0 3.5-3.5M10 11 6.5 7.5M4 15.5h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="M3.5 5.5h13v9h-13v-9Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4 6 6 5 6-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="M6.1 15.6 3 16.5l.9-3A6.9 6.9 0 1 1 6.1 15.6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7.7 6.7c.2-.3.4-.3.7-.2l.7.9c.1.2.1.4 0 .6l-.4.5c.5 1 1.3 1.8 2.4 2.3l.5-.5c.2-.1.4-.1.6 0l.9.6c.2.2.2.4.1.7-.3.8-.9 1.2-1.6 1.1-2.5-.3-5-2.8-5.3-5.3-.1-.7.3-1.3 1.4-1.7Z" fill="currentColor" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="M8.4 6.8 9.6 5.6a4 4 0 1 1 5.7 5.7l-1.2 1.2M11.6 13.2l-1.2 1.2a4 4 0 1 1-5.7-5.7l1.2-1.2M7.8 12.2l4.4-4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function LocationsShowcaseClient({ locations, cities, usesFallbackData }: Props) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("All");
  const [category, setCategory] = useState<LocationMediaCategory | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [copied, setCopied] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(locations.map((location) => location.category))),
    [locations],
  );

  const featuredLocation = useMemo(
    () => locations.find((location) => location.category === "digital") ?? locations[0],
    [locations],
  );
  const heroImage = locations.find((location) => location.slide === 3)?.image ?? locations[0]?.image ?? "/crown-assets/hero-billboard.jpg";
  const availableCount = locations.filter((location) => location.status === "available").length;
  const bookedCount = locations.length - availableCount;

  const filteredLocations = useMemo(() => {
    const needle = normalize(query);
    return locations.filter((location) => {
      const haystack = normalize(
        [
          location.name,
          location.city,
          location.section,
          location.size,
          location.from,
          location.toward,
          location.priceLabel,
          location.availabilityLabel,
          location.freeDateLabel,
        ]
          .filter(Boolean)
          .join(" "),
      );

      return (
        (!needle || haystack.includes(needle)) &&
        (city === "All" || location.city === city) &&
        (category === "all" || location.category === category) &&
        matchesStatus(location, status)
      );
    });
  }, [category, city, locations, query, status]);

  function getShareUrls() {
    if (typeof window === "undefined") {
      return { page: "/locations-showcase", ppt: "/api/locations-showcase/ppt" };
    }
    return {
      page: window.location.href.split("#")[0],
      ppt: `${window.location.origin}/api/locations-showcase/ppt`,
    };
  }

  function getShareText() {
    const urls = getShareUrls();
    return `Crown Advertising locations showcase: ${urls.page}\n\nDownload latest PPT: ${urls.ppt}`;
  }

  function openUrl(url: string, target = "_self") {
    const link = document.createElement("a");
    link.href = url;
    link.target = target;
    if (target !== "_self") link.rel = "noopener noreferrer";
    link.click();
  }

  function openEmail() {
    openUrl(`mailto:?subject=${encodeURIComponent("Crown Advertising Locations Showcase")}&body=${encodeURIComponent(getShareText())}`);
  }

  function openWhatsApp() {
    openUrl(`https://wa.me/?text=${encodeURIComponent(getShareText())}`, "_blank");
  }

  function openLocationEmail(location: ShowcaseLocation) {
    const page = getShareUrls().page;
    openUrl(`mailto:?subject=${encodeURIComponent(`Crown location: ${location.name}`)}&body=${encodeURIComponent(`${location.name} (${location.size})\n${location.city}\nFrom: ${location.from ?? "On route"}\nTowards: ${location.toward ?? "Prime traffic"}\nPrice: ${location.priceLabel ?? "On request"}\nStatus: ${location.availabilityLabel}\n\n${page}#${location.id}`)}`);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <section className="relative min-h-[88vh] overflow-hidden bg-[#0d100b] text-white">
        <Image
          src={heroImage}
          alt="Crown Advertising outdoor media location"
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(13,16,11,0.98)_0%,rgba(13,16,11,0.84)_48%,rgba(13,16,11,0.34)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-linear-to-t from-[#f4f0e7] to-transparent" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/crown-assets/logo.jpg" alt="Crown Advertising" width={112} height={45} className="h-11 w-auto rounded bg-white/12 p-1.5" />
            <span className="hidden text-xs font-black uppercase tracking-[0.24em] text-[#d4ea52] sm:block">Crown Advertising</span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            <a href="#catalog" className="text-sm font-semibold text-white/65 transition hover:text-white">Locations</a>
            <a href="#share" className="text-sm font-semibold text-white/65 transition hover:text-white">Share</a>
            <a href="/api/locations-showcase/ppt" className="inline-flex items-center gap-2 rounded-full bg-[#d4ea52] px-5 py-2.5 text-sm font-black text-[#0d100b] transition hover:-translate-y-0.5 hover:bg-white">
              <DownloadIcon />
              Generate PPT
            </a>
          </nav>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-28 pt-16 lg:grid-cols-[1fr_0.72fr] lg:px-8 lg:pt-24">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4ea52]/25 bg-[#d4ea52]/10 px-4 py-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4ea52]" />
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d4ea52]">
                {usesFallbackData ? "Seed-ready locations source" : "Live database inventory"}
              </span>
            </div>
            <h1 className="mt-7 max-w-4xl text-[clamp(2.7rem,6vw,5.8rem)] font-black leading-[0.94]">
              Outdoor Locations
              <br />
              Showcase
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-[1.8] text-white/68">
              Share Crown Advertising&apos;s outdoor, digital, bridge-panel, motorway, and toll plaza locations with pricing and live booked/available status.
            </p>
            <div className="mt-9 flex flex-wrap gap-3" id="share">
              <a href="/api/locations-showcase/ppt" className="inline-flex items-center gap-2 rounded-full bg-[#d4ea52] px-6 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-[#0d100b] shadow-[0_14px_36px_rgba(212,234,82,0.22)] transition hover:-translate-y-0.5 hover:bg-white">
                <DownloadIcon />
                Generate PPT
              </a>
              <button type="button" onClick={openEmail} className="inline-flex items-center gap-2 rounded-full border border-white/18 px-6 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-white transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/8">
                <MailIcon />
                Email
              </button>
              <button type="button" onClick={openWhatsApp} className="inline-flex items-center gap-2 rounded-full border border-white/18 px-6 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-white transition hover:-translate-y-0.5 hover:border-[#d4ea52]/55 hover:bg-[#d4ea52]/10">
                <WhatsAppIcon />
                WhatsApp
              </button>
              <button type="button" onClick={copyLink} className="inline-flex items-center gap-2 rounded-full border border-white/18 px-6 py-3.5 text-sm font-black uppercase tracking-[0.1em] text-white transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/8">
                <LinkIcon />
                {copied ? "Copied" : "Copy Link"}
              </button>
            </div>
          </div>

          {featuredLocation && (
            <div className="animate-float hidden lg:block">
              <div className="overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/8 p-3 shadow-[0_32px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.1rem] bg-[#161a12]">
                  <Image src={featuredLocation.image} alt={featuredLocation.name} fill sizes="38vw" className="object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-[#0d100b]/88 via-transparent to-transparent" />
                  <div className="absolute left-5 top-5 flex gap-2">
                    <span className="rounded-full bg-[#d4ea52] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#0d100b]">{featuredLocation.size}</span>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur ${statusTone(featuredLocation.status)}`}>
                      {statusLabel(featuredLocation)}
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d4ea52]">{locationCategoryLabels[featuredLocation.category]}</p>
                    <p className="mt-1 text-2xl font-black">{featuredLocation.name}</p>
                    <p className="mt-2 text-sm font-semibold text-white/62">{featuredLocation.priceLabel ?? "Price on request"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {[
                    [locations.length, "Locations"],
                    [availableCount, "Available"],
                    [bookedCount, "Booked"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-xl bg-white/[0.07] p-4 text-center">
                      <p className="text-2xl font-black text-white">{value}</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#d4ea52]/75">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="catalog" className="bg-[#f4f0e7] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="sticky top-0 z-30 -mx-5 border-y border-black/8 bg-[#f4f0e7]/92 px-5 py-4 backdrop-blur-xl lg:-mx-8 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#859317]">Locations inventory</p>
                  <h2 className="mt-1 text-2xl font-black text-[#0d100b]">{filteredLocations.length} matching locations</h2>
                </div>
                <label className="relative block lg:w-96">
                  <span className="sr-only">Search locations</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by road, city, direction, size..."
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 pr-10 text-sm font-semibold text-[#0d100b] outline-none transition focus:border-[#d4ea52] focus:ring-4 focus:ring-[#d4ea52]/20"
                  />
                  <svg aria-hidden="true" className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9280]" viewBox="0 0 20 20" fill="none">
                    <path d="m14 14 3 3M8.5 15a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </label>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {["All", ...cities].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCity(item)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                      city === item ? "bg-[#0d100b] text-white" : "border border-black/10 bg-white text-[#59614f] hover:border-[#d4ea52] hover:bg-[#d4ea52]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(["all", ...categories] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
                        category === item ? "bg-[#d4ea52] text-[#0d100b]" : "border border-black/10 bg-white text-[#59614f] hover:border-[#d4ea52]"
                      }`}
                    >
                      {item === "all" ? "All formats" : locationCategoryLabels[item]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {statusFilters.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStatus(item.value)}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
                        status === item.value ? "bg-[#0d100b] text-white" : "border border-black/10 bg-white text-[#59614f] hover:border-[#d4ea52]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredLocations.map((location, index) => (
              <article
                id={location.id}
                key={location.id}
                className="group overflow-hidden rounded-[1.2rem] border border-black/8 bg-white shadow-[0_10px_28px_rgba(13,16,11,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(13,16,11,0.12)]"
                style={{ animation: `rise 700ms cubic-bezier(0.22,1,0.36,1) ${Math.min(index, 9) * 45}ms both` }}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#0d100b]">
                  <Image src={location.image} alt={`${location.name} ${location.size}`} fill sizes="(min-width: 1280px) 30vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-linear-to-t from-[#0d100b]/88 via-transparent to-transparent" />
                  <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
                    <span className="rounded-full bg-[#d4ea52] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#0d100b]">
                      {location.size}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur ${statusTone(location.status)}`}>
                      {statusLabel(location)}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d4ea52]">{location.city}</p>
                    <h3 className="mt-1 text-xl font-black leading-tight text-white">{location.name}</h3>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#f1ead9] px-3 py-1 text-[11px] font-black text-[#64705a]">{locationCategoryLabels[location.category]}</span>
                    <span className="rounded-full bg-[#0d100b]/6 px-3 py-1 text-[11px] font-black text-[#64705a]">
                      {location.databaseId ? `Inventory #${location.databaseId}` : `Slide ${location.slide}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#f7f4ec] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a9720]">From</p>
                      <p className="mt-1 text-sm font-bold leading-snug text-[#1d2416]">{location.from ?? "On route"}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f7f4ec] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a9720]">Towards</p>
                      <p className="mt-1 text-sm font-bold leading-snug text-[#1d2416]">{location.toward ?? "Prime traffic"}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-black/8 bg-[#0d100b] p-4 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d4ea52]">Price</p>
                        <p className="mt-1 text-lg font-black">{location.priceLabel ?? "On request"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d4ea52]">Status</p>
                        <p className="mt-1 text-sm font-black">{location.availabilityLabel}</p>
                      </div>
                    </div>
                    {location.status !== "available" && location.freeDateLabel && (
                      <p className="rounded-xl bg-white/8 px-3 py-2 text-xs font-bold text-white/72">
                        Booked now. This location becomes free after {location.freeDateLabel}.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-black/8 pt-4">
                    <p className="text-xs font-bold text-[#64705a]">
                      {location.pricingBasis === "slot" ? "Digital slot pricing" : location.pricingBasis === "on_request" ? "Pricing on request" : "Monthly rental"}
                    </p>
                    <button type="button" onClick={() => openLocationEmail(location)} className="rounded-full border border-black/10 px-4 py-2 text-xs font-black text-[#0d100b] transition hover:border-[#d4ea52] hover:bg-[#d4ea52]">
                      Enquire
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredLocations.length === 0 && (
            <div className="mt-12 rounded-[1.2rem] border border-black/8 bg-white p-12 text-center">
              <p className="text-xl font-black text-[#0d100b]">No locations match these filters.</p>
              <button type="button" onClick={() => { setQuery(""); setCity("All"); setCategory("all"); setStatus("all"); }} className="mt-5 rounded-full bg-[#d4ea52] px-6 py-3 text-sm font-black text-[#0d100b]">
                Reset filters
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
