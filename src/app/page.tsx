import Image from "next/image";
import ScrollReveal from "./components/ScrollReveal";
import AnimatedCounter from "./components/AnimatedCounter";
import MobileNav from "./components/MobileNav";

const contact = {
  phone: "+92-321-4462775",
  email: "ceo.sarfraz@gmail.com",
  address: "Suit # 19/20, 2nd Floor, Hassan Center, 134-Ferozepur Road, Lahore",
};

const services = [
  {
    title: "Digital Flex Printing",
    copy: "Vibrant front-lit and back-lit banners built for maximum street visibility.",
  },
  {
    title: "Outdoor Digital Services",
    copy: "Modern digital outdoor placements with durable, high-impact visual execution.",
  },
  {
    title: "Shop Fascia",
    copy: "Front-lit and back-lit retail signboards that make storefronts impossible to miss.",
  },
  {
    title: "In-Store Branding",
    copy: "Displays, stands, racks, and retail visuals that improve the customer journey.",
  },
  {
    title: "B2B Marketing",
    copy: "Campaign planning that connects your brand with business audiences and buyers.",
  },
  {
    title: "Billboard Services",
    copy: "Location planning, production, placement, and campaign execution across major routes.",
  },
];

const strengths = [
  ["Trusted Advertising", "Established in 2006 with quality indoor and outdoor media services."],
  ["Professional Staff", "Experienced teams focused on reliable execution and client needs."],
  ["Fair Prices", "Competitive, transparent pricing for high-quality campaign delivery."],
  ["24/7 Support", "Responsive assistance for active campaigns and urgent requirements."],
];

const projectGroups = [
  {
    id: "lahore",
    name: "Lahore",
    kicker: "City coverage",
    description:
      "High-traffic billboard and route-side campaigns across Lahore's commercial corridors.",
    images: [
      ["lahore-01.jpg", "Innovative Ad Campaign", "City-wide exposure through high-impact billboard placement."],
      ["lahore-02.jpg", "Strategic Ad Placement", "Targeting audiences across main roads and commuting routes."],
      ["lahore-03.jpg", "Dynamic Visual Ads", "Outdoor visibility designed for brand recall and engagement."],
    ],
  },
  {
    id: "sheikhupura",
    name: "Sheikhupura",
    kicker: "Industrial route media",
    description:
      "Billboard placements on key Sheikhupura roads and motorway-adjacent traffic points.",
    images: [
      ["sheikhupura-01.jpg", "Local Business Spotlight", "Community-focused advertising for regional visibility."],
      ["sheikhupura-02.jpg", "High-Impact Event Advertising", "Roadside media that supports launches and event campaigns."],
      ["sheikhupura-03.jpg", "Brand Development Roadmap", "Strategic outdoor placements for repeat exposure."],
    ],
  },
  {
    id: "faisalabad",
    name: "Faisalabad",
    kicker: "Retail and textile city reach",
    description:
      "Campaigns positioned around Faisalabad's road networks, markets, and brand-sensitive locations.",
    images: [
      ["faisalabad-01.jpg", "Social Marketing Strategy", "Broad-audience outdoor campaigns for consumer attention."],
      ["faisalabad-02.jpg", "Lifestyle Branding", "Aspirational visuals placed around active city routes."],
      ["faisalabad-03.jpg", "Cultural Celebrations", "Themed outdoor advertising that resonates locally."],
    ],
  },
  {
    id: "gujranwala",
    name: "Gujranwala",
    kicker: "Urban visibility",
    description:
      "Strong outdoor coverage around city arteries, commercial points, and commuter movement.",
    images: [
      ["gujranwala-01.jpg", "Innovative Ad Campaign", "Impactful billboard advertising for maximum city-wide exposure."],
      ["gujranwala-02.jpg", "Creative Branding Campaigns", "Distinct campaign visuals that strengthen business identity."],
      ["gujranwala-03.jpg", "Targeted Audience Engagement", "High-traffic placements for focused audience reach."],
    ],
  },
  {
    id: "sialkot",
    name: "Sialkot",
    kicker: "Export city campaigns",
    description:
      "Outdoor media for business districts, retail zones, and route-based brand awareness in Sialkot.",
    images: [
      ["sialkot-01.jpg", "Targeted Visibility", "Audience-specific messaging in active commercial areas."],
      ["sialkot-02.jpg", "Creative Branding Campaigns", "Large-format media for stronger brand identity."],
      ["sialkot-03.jpg", "Digital Marketing Solutions", "Integrated visibility for business growth and awareness."],
    ],
  },
  {
    id: "rawalpindi",
    name: "Rawalpindi",
    kicker: "Twin-city access",
    description:
      "Billboard campaigns around high-movement Rawalpindi roads and regional access points.",
    images: [
      ["rawalpindi-01.jpg", "Creative Branding Campaigns", "Consistent outdoor visibility for local and regional brands."],
      ["rawalpindi-02.jpg", "Creative Branding Campaigns", "Repeated exposure through route-side placement."],
      ["rawalpindi-03.jpg", "Creative Branding Campaigns", "Outdoor media that keeps brands visible in daily traffic."],
    ],
  },
  {
    id: "multan",
    name: "Multan",
    kicker: "Southern Punjab reach",
    description:
      "Strategic placements across Multan's entry routes, main roads, and active consumer zones.",
    images: [
      ["multan-01.jpg", "Digital Marketing Solutions", "Full-range brand visibility for business growth."],
      ["multan-02.jpg", "Creative Branding Campaigns", "Campaign visuals that build recall across city routes."],
      ["multan-03.jpg", "Digital Marketing Solutions", "Outdoor presence for city-wide business visibility."],
      ["multan-04.jpg", "High-Impact Billboards", "Brand awareness through strategically positioned media."],
    ],
  },
  {
    id: "toll-plazas",
    name: "Toll Plazas",
    kicker: "Highway audience capture",
    description:
      "Gateway and toll plaza media for repeat exposure across intercity travel and commercial movement.",
    images: [
      ["toll-01.jpg", "Target Audience Refinement", "Focused reach across high-potential route traffic."],
      ["toll-02.jpg", "Consumer Behavior Analysis", "Audience patterns converted into better media placement."],
      ["toll-03.jpg", "Predictive Market Trends", "Seasonal campaigns built for highway visibility."],
      ["toll-04.jpg", "Creative Visual Storytelling", "Outdoor visuals that make the brand message memorable."],
      ["toll-05.jpg", "High-Impact Billboard Visibility", "Large-format visibility across toll routes."],
      ["toll-06.jpg", "Targeted Audience Engagement", "Tailored messaging for intercity commuters."],
      ["toll-07.jpg", "Consumer Behavior Analysis", "Campaign visibility around recurring travel routes."],
      ["toll-08.jpg", "Predictive Market Trends", "Brand recall through seasonal highway media."],
      ["toll-09.jpg", "Creative Visual Storytelling", "Visual campaigns designed for moving audiences."],
      ["toll-10.jpg", "Targeted Audience Engagement", "Route-based placement for specific demographics."],
      ["toll-11.jpg", "Target Audience Refinement", "Focused highway coverage for stronger campaign performance."],
    ],
  },
];

const workflowSteps = [
  "Campaign Planning",
  "Media Buying",
  "Design & Production",
  "Installation",
  "Support & Reporting",
];

const presenceStats = [
  "30 Resources",
  "3 Offices",
  "Nationwide Coverage",
  "Logistic Support",
  "Warehouse Facilities",
];

const mapPins = [
  { city: "Peshawar", x: 271.1, y: 173.7 },
  { city: "Islamabad", x: 307.2, y: 181.6 },
  { city: "Faisalabad", x: 309.3, y: 234.5 },
  { city: "Lahore", x: 338.2, y: 232.8 },
  { city: "Quetta", x: 163.3, y: 264.6 },
  { city: "Multan", x: 271.1, y: 265.1 },
  { city: "Karachi", x: 163.9, y: 390.7 },
];

const pakistanMapPath =
  "M 376.7 116.1 L 375.3 125.9 L 381.1 131.3 L 390.3 129.1 L 401.2 150.7 L 371.9 162.1 L 336.5 155.9 L 327.8 158.9 L 324.5 164.7 L 329.5 168.9 L 327.8 173.4 L 336.2 175.0 L 328.9 180.4 L 333.5 186.1 L 329.8 193.6 L 337.1 197.9 L 338.0 203.3 L 346.0 201.8 L 346.1 210.3 L 354.0 210.4 L 362.0 215.3 L 342.6 226.0 L 344.4 234.3 L 341.7 241.0 L 345.4 243.2 L 326.2 260.0 L 328.4 264.4 L 314.8 270.6 L 304.4 291.4 L 290.8 298.1 L 279.4 317.2 L 254.7 323.3 L 247.6 315.9 L 243.1 316.0 L 223.9 337.0 L 223.2 346.2 L 238.7 351.1 L 236.5 364.1 L 240.9 370.6 L 250.5 371.4 L 260.4 401.5 L 252.9 405.6 L 247.3 401.0 L 234.3 407.1 L 205.3 403.2 L 204.7 411.9 L 191.3 413.3 L 191.1 418.3 L 187.9 412.5 L 187.9 416.5 L 184.1 413.1 L 179.0 415.8 L 179.3 412.6 L 175.2 413.6 L 176.5 409.4 L 171.0 406.6 L 172.5 402.9 L 167.4 396.0 L 169.9 393.3 L 155.7 391.2 L 157.6 383.1 L 149.1 372.5 L 142.4 376.1 L 148.1 374.2 L 152.0 377.9 L 110.4 379.7 L 108.3 383.4 L 93.9 376.7 L 94.2 379.2 L 82.6 378.7 L 80.9 382.8 L 57.9 381.1 L 54.4 385.3 L 48.8 382.2 L 39.0 386.8 L 40.2 382.9 L 35.6 382.6 L 41.4 358.3 L 51.7 355.1 L 55.3 350.3 L 72.4 348.8 L 76.7 337.2 L 73.3 333.8 L 63.0 333.6 L 63.4 310.4 L 42.8 303.4 L 18.0 272.2 L 56.7 282.9 L 82.6 280.8 L 94.8 283.4 L 104.1 279.1 L 117.3 279.8 L 144.8 272.8 L 148.2 269.9 L 145.4 267.5 L 148.9 247.0 L 156.7 240.5 L 182.0 237.3 L 177.4 232.6 L 190.9 225.6 L 203.6 226.8 L 206.6 230.9 L 218.3 223.0 L 216.8 210.5 L 221.4 206.0 L 222.8 197.1 L 241.9 190.2 L 231.9 173.7 L 247.3 175.5 L 260.1 172.8 L 261.5 165.6 L 257.6 161.5 L 273.8 145.9 L 269.7 131.6 L 262.6 125.6 L 273.1 115.8 L 277.2 117.3 L 295.7 107.2 L 330.6 107.4 L 345.4 101.7 L 350.4 105.2 L 361.8 105.0 L 363.7 109.6 L 370.7 109.6 L 376.7 116.1 Z";

const clients = [
  { name: "Graana",         logo: "/client-logos/graana.png" },
  { name: "Fauji Foods",    logo: "/client-logos/fauji-foods.png" },
  { name: "Haleeb",         logo: "/client-logos/haleeb.png" },
  { name: "PriceOye",       logo: "/client-logos/priceoye.png" },
  { name: "Outfitters",     logo: "/client-logos/outfitters.png" },
  { name: "Agency21",       logo: "/client-logos/agency21.png" },
  { name: "Zameen",         logo: "/client-logos/zameen.png" },
  { name: "Total PARCO",    logo: "/client-logos/total.png" },
  { name: "National Foods", logo: "/client-logos/national-foods.png" },
  { name: "Master",         logo: "/client-logos/master.png" },
  { name: "Top Food",       logo: "/client-logos/top-food.png" },
  { name: "Brite",          logo: "/client-logos/brite.png" },
  { name: "Kausar",         logo: "/client-logos/kausar.png" },
  { name: "Rivaj",          logo: "/client-logos/rivaj.png" },
  { name: "Al-Hilal",       logo: "/client-logos/al-hilal.png" },
  { name: "Landmark",       logo: "/client-logos/landmark.png" },
  { name: "Menu",           logo: "/client-logos/menu.png" },
  { name: "Fast",           logo: "/client-logos/fast.png" },
  { name: "Care",           logo: "/client-logos/care.png" },
  { name: "Eagle",          logo: "/client-logos/eagle.png" },
  { name: "Rainbow",        logo: "/client-logos/rainbow.png" },
  { name: "Ramza",          logo: "/client-logos/ramza.png" },
  { name: "Crystal",        logo: "/client-logos/crystal.png" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f4ec] text-[#0d100b]">

      {/* ─── NAVBAR ──────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[#0d100b]/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#home" className="flex items-center gap-3">
            <Image
              src="/crown-assets/logo.jpg"
              alt="Crown Advertising"
              width={96}
              height={39}
              className="h-10 w-auto rounded bg-white/10 p-1"
              priority
            />
            <span className="hidden text-sm font-black uppercase tracking-[0.22em] text-[#d4ea52] sm:inline">
              Crown Advertising
            </span>
          </a>
          <nav className="hidden items-center gap-8 lg:flex">
            {[
              ["About", "#about"],
              ["Services", "#services"],
              ["Work", "#work"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="relative text-sm font-semibold text-white/60 transition-colors duration-200 hover:text-white after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-[#d4ea52] after:transition-[width] after:duration-300 hover:after:w-full"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href={`tel:${contact.phone}`}
              className="hidden rounded-full bg-[#d4ea52] px-5 py-2.5 text-sm font-black text-[#0d100b] shadow-[0_8px_24px_rgba(212,234,82,0.28)] transition hover:-translate-y-0.5 hover:bg-white sm:block"
            >
              Get a Quote
            </a>
            <MobileNav phone={contact.phone} />
          </div>
        </div>
      </header>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section id="home" className="relative min-h-screen bg-[#0d100b] pt-24 text-white">
        <Image
          src="/crown-assets/hero-billboard.jpg"
          alt="Outdoor billboard advertising by Crown Advertising"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.32]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(13,16,11,0.98)_0%,rgba(13,16,11,0.80)_48%,rgba(13,16,11,0.22)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_75%_15%,rgba(212,234,82,0.15),transparent)]" />
        <div className="absolute bottom-0 inset-x-0 h-56 bg-linear-to-t from-[#f7f4ec] to-transparent" />

        <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-16 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#d4ea52]/25 bg-[#d4ea52]/10 px-4 py-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4ea52]" />
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d4ea52]">
                Indoor &amp; Outdoor Media Since 2006
              </span>
            </div>
            <h1 className="mt-8 text-[clamp(2.8rem,6vw,5.6rem)] font-black leading-[0.93] tracking-tight">
              Turn high-traffic
              <br />
              locations into
              <br />
              <span className="text-[#d4ea52]">brand growth.</span>
            </h1>
            <p className="mt-7 max-w-130 text-lg leading-[1.75] text-white/65">
              Crown Advertising helps Pakistani brands plan, produce, and place memorable outdoor, retail, and B2B advertising campaigns across the country.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#work" className="rounded-full bg-[#d4ea52] px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#0d100b] shadow-[0_12px_36px_rgba(212,234,82,0.28)] transition hover:-translate-y-0.5 hover:bg-white">
                Explore Projects
              </a>
              <a href="#services" className="rounded-full border border-white/20 px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/8">
                View Services
              </a>
            </div>
            <div className="mt-12 flex flex-wrap gap-8 border-t border-white/10 pt-8">
              {[
                ["18+", "Years Experience"],
                ["8", "Cities Covered"],
                ["360°", "Media Solutions"],
              ].map(([num, label]) => (
                <div key={label} className="flex items-baseline gap-2">
                  <AnimatedCounter value={num} className="text-3xl font-black text-[#d4ea52]" />
                  <span className="text-sm text-white/50">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-float hidden lg:block">
            <div className="rounded-4xl border border-white/10 bg-white/6 p-3 shadow-[0_40px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="overflow-hidden rounded-3xl">
                <div className="relative aspect-4/3">
                  <Image
                    src="/crown-assets/project-lahore.jpg"
                    alt="Crown Advertising billboard project Lahore"
                    fill
                    sizes="40vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#0d100b]/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4ea52]">Featured Project</p>
                    <p className="mt-1 text-base font-black text-white leading-tight">Lahore City Campaigns</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3">
                {[
                  ["30+", "Resources"],
                  ["3", "Offices"],
                  ["NTN", "Registered"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl bg-white/[0.07] p-3 text-center">
                    <p className="text-xl font-black text-white">{value}</p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#d4ea52]/75">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-20 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Scroll</span>
          <div className="h-8 w-px animate-bounce rounded-full bg-linear-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ─── STRENGTHS BAR ───────────────────────────────────────── */}
      <section className="relative z-10 -mt-10 px-5 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="grid gap-3 rounded-[1.8rem] border border-black/7 bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.07)] md:grid-cols-2 lg:grid-cols-4">
              {strengths.map(([title, copy]) => (
                <article key={title} className="group rounded-[1.3rem] bg-[#f8f5ed] p-6 transition-colors duration-300 hover:bg-[#0d100b] hover:text-white">
                  <div className="h-1.5 w-10 rounded-full bg-[#d4ea52] transition-[width] duration-300 group-hover:w-16" />
                  <h2 className="mt-5 text-lg font-black">{title}</h2>
                  <p className="mt-2.5 text-sm leading-[1.65] text-[#64705a] transition-colors group-hover:text-white/60">{copy}</p>
                </article>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── ABOUT ───────────────────────────────────────────────── */}
      <section id="about" className="mx-auto max-w-7xl px-5 py-32 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <ScrollReveal direction="left">
            <div className="relative">
              <div className="relative aspect-3/4 overflow-hidden rounded-4xl bg-[#0d100b] shadow-[0_32px_72px_rgba(0,0,0,0.14)]">
                <Image
                  src="/crown-assets/hero-billboard.jpg"
                  alt="Crown Advertising billboard"
                  fill
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover transition duration-700 hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-6 -right-4 max-w-64 rounded-3xl bg-[#0d100b] p-6 shadow-[0_24px_48px_rgba(0,0,0,0.28)] sm:-right-8">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d4ea52]">NTN 2666456-9</p>
                <p className="mt-3 text-xl font-black leading-tight text-white">Empowering brands since May 31st, 2006.</p>
              </div>
              <div
                className="absolute -left-6 -top-6 -z-10 h-32 w-32 opacity-25"
                style={{ backgroundImage: "radial-gradient(circle, #0d100b 1.5px, transparent 1.5px)", backgroundSize: "14px 14px" }}
              />
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={100}>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#8a9720]">About Crown Advertising</p>
            <h2 className="mt-5 text-[clamp(2rem,3.5vw,3.2rem)] font-black leading-[1.05]">
              Complete advertising solutions under one roof.
            </h2>
            <div className="mt-4 h-1 w-14 rounded-full bg-[#d4ea52]" />
            <p className="mt-6 text-lg leading-[1.8] text-[#5a6152]">
              Crown Advertising is one of Pakistan&apos;s leading advertising companies, delivering top-tier indoor and outdoor media services designed to maximize brand visibility and growth.
            </p>
            <p className="mt-4 text-lg leading-[1.8] text-[#5a6152]">
              With a passion for innovation and deep understanding of the advertising landscape, the team helps brands make a stronger impact, reach audiences effectively, and grow with confidence.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["Comprehensive Solutions", "From media buying to multimedia campaigns, complex work becomes clear and manageable."],
                ["Experienced Professionals", "Decades of practical execution help campaigns launch with precision and creativity."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-[1.2rem] border border-black/7 bg-white p-6 shadow-sm">
                  <div className="mb-4 h-8 w-8 rounded-xl bg-[#d4ea52]" />
                  <h3 className="text-base font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-[1.7] text-[#5a6152]">{copy}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── SERVICES ────────────────────────────────────────────── */}
      <section id="services" className="bg-[#0d100b] px-5 py-32 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.26em] text-[#d4ea52]">Services</p>
                <h2 className="mt-5 text-[clamp(2.2rem,4vw,3.8rem)] font-black leading-[1.04]">
                  Media services that make brands visible.
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-[1.8] text-white/58">
                Strategy, production, placement, and support for campaigns that need to show up clearly across stores, roads, and city routes.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <ScrollReveal key={service.title} delay={index * 65}>
                <article className="group relative min-h-55 overflow-hidden rounded-3xl border border-white/8 bg-[#161a12] p-8 transition-colors duration-300 hover:bg-[#d4ea52]">
                  <p className="text-xs font-black text-[#d4ea52] transition-colors duration-300 group-hover:text-[#6a7b10]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <div className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 group-hover:bg-[#0d100b]/12 group-hover:text-[#0d100b] text-white/0">
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                      <path d="M3 13L13 3M13 3H6M13 3v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="mt-10 text-xl font-black leading-tight transition-colors duration-300 group-hover:text-[#0d100b]">{service.title}</h3>
                  <p className="mt-3 text-sm leading-[1.7] text-white/52 transition-colors duration-300 group-hover:text-[#2a3013]">{service.copy}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROCESS ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-32 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#8a9720]">How We Work</p>
            <h2 className="mx-auto mt-5 max-w-2xl text-[clamp(2rem,3.5vw,3rem)] font-black leading-[1.1]">
              From idea to installed campaign, the process stays practical.
            </h2>
          </div>
        </ScrollReveal>
        <div className="relative mt-16">
          <div className="absolute left-[10%] right-[10%] top-8 hidden h-px bg-linear-to-r from-transparent via-black/10 to-transparent lg:block" />
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {workflowSteps.map((item, index) => (
              <ScrollReveal key={item} delay={index * 80}>
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d4ea52] text-xl font-black text-[#0d100b] shadow-[0_8px_24px_rgba(212,234,82,0.36)]">
                    {index + 1}
                  </div>
                  <p className="mt-5 text-base font-black leading-tight">{item}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WORK / PROJECTS ─────────────────────────────────────── */}
      <section id="work" className="bg-[#f7f4ec] px-5 py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">

          {/* Section header */}
          <ScrollReveal>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.26em] text-[#8a9720]">Our Projects</p>
                <h2 className="mt-4 text-[clamp(2.2rem,4vw,3.5rem)] font-black leading-[1.04]">
                  Billboard work across<br className="hidden sm:block" /> cities &amp; toll plazas.
                </h2>
              </div>
              {/* City jump-links */}
              <div className="flex flex-wrap gap-2">
                {projectGroups.map((group, i) => (
                  <a
                    key={group.id}
                    href={`#${group.id}`}
                    className="group flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black text-[#5a6152] transition-all duration-200 hover:border-[#d4ea52] hover:bg-[#d4ea52] hover:text-[#0d100b]"
                  >
                    <span className="text-[9px] font-black text-[#8a9720] group-hover:text-[#0d100b]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {group.name}
                  </a>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* City groups */}
          <div className="mt-24 space-y-28">
            {projectGroups.map((group, groupIndex) => (
              <section id={group.id} key={group.id} className="scroll-mt-28">

                {/* City header row */}
                <ScrollReveal>
                  <div className="mb-10 grid grid-cols-[auto_1fr] items-start gap-6 lg:grid-cols-[auto_1fr_auto]">
                    {/* Index number */}
                    <span className="mt-1 text-[clamp(3rem,5vw,5rem)] font-black leading-none text-[#e8e3d8]">
                      {String(groupIndex + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a9720]">{group.kicker}</p>
                      <h3 className="mt-1 text-[clamp(2rem,3.5vw,3.2rem)] font-black leading-tight">{group.name}</h3>
                    </div>
                    <p className="col-span-2 max-w-md text-sm leading-[1.8] text-[#6b7560] lg:col-span-1 lg:max-w-xs lg:pt-1 lg:text-right">
                      {group.description}
                    </p>
                  </div>
                  <div className="h-px w-full bg-black/[0.07]" />
                </ScrollReveal>

                {/* Image grid — first image is featured full-width, rest in 3-col */}
                <div className="mt-8 space-y-3">
                  {/* Feature image */}
                  <ScrollReveal delay={0}>
                    <article className="group relative overflow-hidden rounded-2xl bg-[#0d100b]" style={{ aspectRatio: "21/8" }}>
                      <Image
                        src={`/project-gallery/${group.images[0][0]}`}
                        alt={`${group.name} — ${group.images[0][1]}`}
                        fill
                        sizes="(min-width: 1024px) 90vw, 100vw"
                        className="object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-75"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[#0d100b]/80 via-[#0d100b]/20 to-transparent p-6 lg:p-8">
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#d4ea52]">{group.name}</p>
                        <p className="mt-1 text-lg font-black text-white lg:text-xl">{group.images[0][1]}</p>
                        <p className="mt-1 text-sm text-white/60">{group.images[0][2]}</p>
                      </div>
                    </article>
                  </ScrollReveal>

                  {/* Supporting images */}
                  {group.images.length > 1 && (
                    <div className={`grid gap-3 ${group.images.slice(1).length === 1 ? "" : group.images.slice(1).length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                      {group.images.slice(1).map(([file, title, copy], idx) => (
                        <ScrollReveal key={`${group.id}-${file}`} delay={(idx + 1) * 60}>
                          <article className="group relative overflow-hidden rounded-2xl bg-[#0d100b]" style={{ aspectRatio: "4/3" }}>
                            <Image
                              src={`/project-gallery/${file}`}
                              alt={`${group.name} — ${title}`}
                              fill
                              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                              className="object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-70"
                            />
                            <div className="absolute inset-x-0 bottom-0 translate-y-1 bg-linear-to-t from-[#0d100b]/85 via-[#0d100b]/25 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
                              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#d4ea52]">{group.name}</p>
                              <p className="mt-0.5 text-sm font-black leading-tight text-white">{title}</p>
                              <p className="mt-1 max-h-0 overflow-hidden text-xs leading-[1.6] text-white/60 transition-[max-height] duration-500 group-hover:max-h-16">
                                {copy}
                              </p>
                            </div>
                          </article>
                        </ScrollReveal>
                      ))}
                    </div>
                  )}
                </div>

              </section>
            ))}
          </div>

        </div>
      </section>

      {/* ─── PRESENCE / MAP ──────────────────────────────────────── */}
      <section className="px-5 py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="overflow-hidden rounded-[2.4rem] border border-black/8 bg-white p-4 shadow-[0_24px_64px_rgba(0,0,0,0.07)]">
              <div className="relative overflow-hidden rounded-[1.9rem] bg-[#f5f0e1]">
                <div className="absolute -left-20 -top-10 h-72 w-72 rotate-12 rounded-[4rem] bg-[#d4ea52]/10" />
                <div className="absolute -right-12 bottom-0 h-56 w-56 rotate-45 rounded-[3rem] bg-[#0d100b]/5" />
                <div className="relative grid gap-8 p-8 lg:grid-cols-[0.45fr_0.55fr] lg:p-12">
                  <div className="flex flex-col justify-between gap-8">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.26em] text-[#8a9720]">Our Presence</p>
                      <h2 className="mt-5 text-[clamp(2rem,3.5vw,3rem)] font-black leading-[1.05]">
                        Nationwide reach with support on the ground.
                      </h2>
                      <p className="mt-5 text-base leading-[1.8] text-[#5a6152]">
                        Crown Advertising supports campaigns through offices, resources, logistics, and coverage across major Pakistani cities and routes.
                      </p>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {presenceStats.map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl border border-black/7 bg-white px-4 py-3">
                          <span className="h-2 w-2 rounded-full bg-[#d4ea52]" />
                          <span className="text-sm font-black text-[#1e2815]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-[1fr_0.38fr]">
                    <div className="relative min-h-110 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#d4ea52_0%,#b5cd22_55%,#7f9418_100%)] shadow-inner">
                      <div className="absolute -left-10 bottom-16 h-44 w-44 rotate-45 rounded-2xl bg-[#0d100b]/9" />
                      <div className="absolute -right-10 top-0 h-44 w-44 rotate-45 rounded-2xl bg-white/20" />
                      <svg aria-label="Pakistan availability map" viewBox="0 0 420 520" className="absolute inset-0 h-full w-full">
                        <path d={pakistanMapPath} fill="rgba(255,255,255,0.12)" stroke="#182011" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                        {mapPins.map((pin, index) => (
                          <g key={pin.city}>
                            <circle cx={pin.x} cy={pin.y} r="13" fill="#0d100b" stroke="rgba(255,255,255,0.85)" strokeWidth="5" />
                            <text x={pin.x} y={pin.y + 4} fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">{index + 1}</text>
                          </g>
                        ))}
                      </svg>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-1">
                      {mapPins.map((pin, index) => (
                        <div key={pin.city} className="flex items-center gap-2.5 rounded-2xl border border-black/7 bg-white px-3 py-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0d100b] text-[11px] font-black text-white">{index + 1}</span>
                          <span className="text-sm font-black text-[#1e2815]">{pin.city}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── CLIENTS ─────────────────────────────────────────────── */}
      <section className="bg-[#0d100b] py-28 text-white">
        <ScrollReveal>
          <div className="mx-auto max-w-7xl px-5 text-center lg:px-8">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#8a9720]">Our Clients</p>
            <h2 className="mx-auto mt-5 max-w-3xl text-[clamp(2.2rem,4vw,3.5rem)] font-black leading-[1.05]">
              Brands across Pakistan trust Crown Advertising for visibility.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-[1.8] text-white/55">
              From real estate and retail to food, FMCG, and services, our work supports brands that need to be seen in the right places.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative mt-16 space-y-4 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-linear-to-r from-[#0d100b] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-linear-to-l from-[#0d100b] to-transparent" />
          {[clients, [...clients].reverse()].map((row, rowIndex) => (
            <div key={rowIndex} className={`flex w-max gap-4 ${rowIndex === 0 ? "animate-marquee" : "animate-marquee-reverse"}`}>
              {[...row, ...row].map((client, index) => (
                <div key={`${client.name}-${rowIndex}-${index}`} className="flex min-w-52 items-center gap-3.5 rounded-2xl border border-white/7 bg-white/5 px-5 py-4 transition hover:border-[#d4ea52]/35 hover:bg-white/9">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1.5">
                    <Image src={client.logo} alt={`${client.name} logo`} width={40} height={40} className="h-9 w-9 object-contain" />
                  </div>
                  <div>
                    <p className="text-sm font-black">{client.name}</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#d4ea52]/60">Pakistan</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CEO QUOTE ───────────────────────────────────────────── */}
      <section className="bg-[#0d100b] px-5 pb-32 pt-12 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="grid gap-10 rounded-4xl border border-white/7 bg-white/4 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-12">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.26em] text-[#d4ea52]">CEO Message</p>
                <h2 className="mt-5 text-[clamp(2rem,3vw,2.8rem)] font-black leading-[1.08]">
                  We&apos;re passionate about making your brand shine.
                </h2>
              </div>
              <figure>
                <div className="mb-3 text-[5rem] font-black leading-none text-[#d4ea52]/80">&ldquo;</div>
                <blockquote className="text-lg leading-[1.9] text-white/70">
                  At Crown Advertising, our vision is to make your brand shine brightly in the crowded marketplace. We are passionate about crafting unique and memorable advertising campaigns that capture the essence of your brand and connect with your audience on a deeper level.
                </blockquote>
                <figcaption className="mt-8 border-t border-white/8 pt-6">
                  <p className="text-xl font-black text-white">Sarfraz Ahmad</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#d4ea52]">CEO, Crown Advertising</p>
                </figcaption>
              </figure>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── CTA BANNER ──────────────────────────────────────────── */}
      <section className="bg-[#d4ea52] px-5 py-24 lg:px-8">
        <ScrollReveal>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-[clamp(2.4rem,5vw,4rem)] font-black leading-[1.04] text-[#0d100b]">
              Ready to make your brand impossible to miss?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-[1.8] text-[#2a3013]">
              Let&apos;s build a campaign that gets your brand in front of the right audience across Pakistan&apos;s busiest routes and retail locations.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a href={`tel:${contact.phone}`} className="rounded-full bg-[#0d100b] px-8 py-4 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_12px_36px_rgba(13,16,11,0.28)] transition hover:-translate-y-0.5 hover:bg-[#1e2815]">
                Call Us Now
              </a>
              <a href={`mailto:${contact.email}`} className="rounded-full border-2 border-[#0d100b]/20 px-8 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#0d100b] transition hover:-translate-y-0.5 hover:border-[#0d100b] hover:bg-[#0d100b]/[0.07]">
                Send an Email
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer id="contact" className="bg-[#f7f4ec] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 rounded-4xl border border-black/7 bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] lg:grid-cols-[1.1fr_1fr_0.75fr] lg:p-12">
            <div>
              <Image src="/crown-assets/logo.jpg" alt="Crown Advertising logo" width={150} height={61} className="h-auto w-36 rounded bg-[#f7f3e8] p-2" />
              <p className="mt-6 max-w-sm text-base leading-[1.8] text-[#5a6152]">
                Quality indoor and outdoor media services for brands that want stronger visibility across Pakistan.
              </p>
              <div className="mt-8 flex gap-3">
                <a href={`tel:${contact.phone}`} aria-label="Call us" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-[#f8f5ed] text-[#5a6152] transition hover:border-[#d4ea52] hover:bg-[#d4ea52] hover:text-[#0d100b]">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </a>
                <a href={`mailto:${contact.email}`} aria-label="Email us" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-[#f8f5ed] text-[#5a6152] transition hover:border-[#d4ea52] hover:bg-[#d4ea52] hover:text-[#0d100b]">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">Our Office</h2>
              <div className="mt-3 h-0.5 w-8 rounded-full bg-[#d4ea52]" />
              <p className="mt-5 leading-[1.8] text-[#5a6152]">{contact.address}</p>
              <a href={`tel:${contact.phone}`} className="mt-5 block text-2xl font-black transition hover:text-[#8a9720]">{contact.phone}</a>
              <a href={`mailto:${contact.email}`} className="mt-2 block text-sm font-bold text-[#8a9720] transition hover:text-[#0d100b]">{contact.email}</a>
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">Business Hours</h2>
              <div className="mt-3 h-0.5 w-8 rounded-full bg-[#d4ea52]" />
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-sm text-[#5a6152]">Monday – Saturday</p>
                  <p className="font-black">09:00 am – 07:00 pm</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a6152]">Sunday</p>
                  <p className="font-black">Closed</p>
                </div>
              </div>
              <div className="mt-8 rounded-2xl bg-[#f8f5ed] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a9720]">NTN</p>
                <p className="mt-1 text-base font-black">2666456-9</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-3 px-2 text-sm text-[#8a9720] sm:flex-row">
            <p>© {new Date().getFullYear()} Crown Advertising. All rights reserved.</p>
            <p>Lahore, Pakistan</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
