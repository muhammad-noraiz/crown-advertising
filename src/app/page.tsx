import Image from "next/image";
import ScrollReveal from "./components/ScrollReveal";
import AnimatedCounter from "./components/AnimatedCounter";
import MobileNav from "./components/MobileNav";
import { landingLocationCategories, landingLocations } from "@/lib/landing-locations";

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

const workflowSteps = [
  "Campaign Planning",
  "Media Buying",
  "Design & Production",
  "Installation",
  "Support & Reporting",
];

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
    <main className="landing-shell min-h-screen overflow-x-hidden bg-[#f7f4ec] text-[#0d100b]">

      {/* ─── NAVBAR ──────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[#0d100b]/82 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[92rem] items-center justify-between px-5 py-4 lg:px-8">
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
              ["Locations", "#locations"],
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
      <section id="home" className="hero-stage relative isolate min-h-[800px] overflow-hidden bg-[#0d100b] pt-24 text-white lg:min-h-screen">
        <Image
          src={landingLocations[0].image}
          alt="DHA Exit Cantt outdoor advertising placement in Lahore"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25 saturate-[0.7]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(92deg,rgba(13,16,11,1)_0%,rgba(13,16,11,0.93)_46%,rgba(13,16,11,0.48)_100%)]" />
        <div className="route-grid absolute inset-0 opacity-25" />
        <div aria-hidden="true" className="hero-wordmark absolute -right-[0.08em] top-[8%] select-none text-[clamp(12rem,30vw,34rem)] font-black leading-none text-white/[0.025]">
          OOH
        </div>
        <div className="absolute left-[5vw] top-36 hidden h-[55vh] w-px bg-linear-to-b from-[#d4ea52] via-[#d4ea52]/25 to-transparent 2xl:block" />

        <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] max-w-[92rem] items-center gap-16 px-5 py-16 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 xl:gap-24">
          <div className="animate-rise relative z-10">
            <div className="inline-flex items-center gap-3 border-l-2 border-[#d4ea52] pl-4">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#d4ea52] shadow-[0_0_0_6px_rgba(212,234,82,0.1)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.32em] text-[#d4ea52]">
                Pakistan&apos;s outdoor media partner since 2006
              </span>
            </div>

            <h1 className="mt-10 max-w-5xl text-[clamp(3.4rem,7vw,7.4rem)] font-black leading-[0.84] tracking-[-0.055em]">
              Own the road.
              <span className="mt-2 block text-[#d4ea52]">Stay in mind.</span>
            </h1>
            <p className="mt-8 max-w-2xl border-l border-white/15 pl-5 text-base leading-[1.85] text-white/62 sm:text-lg">
              Crown helps brands stay visible across Pakistan through strategic outdoor media, bold production, and dependable multi-city campaign execution.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#locations" className="group inline-flex items-center gap-4 rounded-full bg-[#d4ea52] px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#0d100b] shadow-[0_14px_40px_rgba(212,234,82,0.22)] transition duration-300 hover:-translate-y-1 hover:bg-white">
                Explore featured inventory
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0d100b] text-white transition group-hover:rotate-45">
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                    <path d="M3 13 13 3m0 0H6m7 0v7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                </span>
              </a>
              <a href="#contact" className="rounded-full border border-white/18 px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition duration-300 hover:-translate-y-1 hover:border-[#d4ea52] hover:text-[#d4ea52]">
                Start a campaign
              </a>
            </div>

            <div className="mt-14 grid max-w-2xl grid-cols-3 border-y border-white/10 py-5">
              {[
                ["18+", "Years building visibility"],
                ["31", "Lahore sites featured"],
                ["2", "Media formats"],
              ].map(([num, label], index) => (
                <div key={label} className={index === 0 ? "pr-4" : "border-l border-white/10 px-4"}>
                  <AnimatedCounter value={num} className="block text-3xl font-black leading-none text-[#d4ea52] sm:text-4xl" />
                  <span className="mt-2 block max-w-28 text-[9px] font-bold uppercase leading-[1.5] tracking-[0.16em] text-white/38">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-float relative hidden lg:block">
            <div className="absolute -left-10 top-16 z-20 -rotate-6 bg-[#d4ea52] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#0d100b] shadow-xl">
              Latest media deck · 27.06.26
            </div>
            <div className="relative rotate-[1.5deg] border border-white/12 bg-[#151912] p-3 shadow-[0_50px_100px_rgba(0,0,0,0.52)] transition duration-500 hover:rotate-0">
              <div className="relative aspect-[5/4] overflow-hidden bg-[#20251b]">
                <Image
                  src={landingLocations[0].image}
                  alt="DHA Exit Cantt Crown Advertising placement"
                  fill
                  sizes="45vw"
                  className="object-cover transition duration-1000 hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0d100b]/88 via-transparent to-transparent" />
                <span className="absolute right-5 top-4 text-7xl font-black leading-none text-white/18">03</span>
                <div className="absolute inset-x-6 bottom-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#d4ea52]">Featured placement · Lahore</p>
                  <p className="mt-2 text-2xl font-black leading-none">DHA Exit Cantt</p>
                  <div className="mt-4 flex items-center gap-3 text-xs font-bold text-white/55">
                    <span>DHA Main Boulevard</span>
                    <span className="text-[#d4ea52]">→</span>
                    <span>Cavalry Ground</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-white/8 px-3 py-4">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#d4ea52]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/52">60x40 premium static OOH</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d4ea52]">LHR / 01</span>
              </div>
            </div>
            <div className="absolute -bottom-7 -right-7 -z-10 h-full w-full border border-[#d4ea52]/25" />
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-[#0d100b] bg-[#d4ea52] py-3.5 text-[#0d100b]">
        <div className="campaign-ticker flex w-max items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center">
              {["OOH Static Media", "Bridge Panels", "Featured City: Lahore", "31 Premium Placements", "Multi-City Planning", "Installation & Support"].map((item) => (
                <span key={item + copy} className="flex items-center whitespace-nowrap text-[11px] font-black uppercase tracking-[0.2em]">
                  <span className="mx-6 h-1.5 w-1.5 rotate-45 bg-[#0d100b]" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── STRENGTHS BAR ───────────────────────────────────────── */}
      <section className="relative z-10 bg-[#f7f4ec] px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-[92rem]">
          <ScrollReveal>
            <div className="grid border-y border-black/10 md:grid-cols-2 lg:grid-cols-4">
              {strengths.map(([title, copy], index) => (
                <article key={title} className="group relative overflow-hidden border-black/10 px-2 py-8 md:px-7 lg:border-r lg:last:border-r-0">
                  <span className="absolute right-4 top-3 text-6xl font-black leading-none text-black/[0.035] transition duration-500 group-hover:text-[#d4ea52]/35">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="h-1 w-8 bg-[#d4ea52] transition-[width] duration-300 group-hover:w-16" />
                  <h2 className="mt-6 text-lg font-black">{title}</h2>
                  <p className="mt-2.5 max-w-xs text-sm leading-[1.7] text-[#64705a]">{copy}</p>
                </article>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── ABOUT ───────────────────────────────────────────────── */}
      <section id="about" className="relative overflow-hidden px-5 py-28 lg:px-8 lg:py-36">
        <div aria-hidden="true" className="absolute -right-10 top-10 select-none text-[clamp(9rem,20vw,20rem)] font-black leading-none text-black/[0.025]">2006</div>
        <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <ScrollReveal direction="left">
            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2.4rem] bg-[#0d100b] shadow-[0_32px_72px_rgba(0,0,0,0.14)]">
                <Image
                  src={landingLocations[23].image}
                  alt="Askari 9 Cantt bridge-panel advertising placement"
                  fill
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover transition duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0d100b]/50 via-transparent to-transparent" />
                <div className="absolute bottom-7 left-7 text-white">
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#d4ea52]">Built for moving audiences</p>
                  <p className="mt-2 max-w-72 text-2xl font-black leading-[1.05]">Large-format impact at street level.</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-4 max-w-64 rounded-3xl border border-white/8 bg-[#0d100b] p-6 shadow-[0_24px_48px_rgba(0,0,0,0.28)] sm:-right-8">
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
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-[#8a9720]" />
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#8a9720]">About Crown Advertising</p>
            </div>
            <h2 className="mt-6 text-[clamp(2.4rem,4vw,4rem)] font-black leading-[0.98] tracking-[-0.035em]">
              Strategy, craft and media placement—under one roof.
            </h2>
            <p className="mt-8 text-lg leading-[1.85] text-[#5a6152]">
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
      <section id="services" className="relative overflow-hidden bg-[#0d100b] px-5 py-32 text-white lg:px-8">
        <div className="route-grid absolute inset-0 opacity-15" />
        <div aria-hidden="true" className="absolute -right-10 top-10 select-none text-[18rem] font-black leading-none text-white/[0.025]">06</div>
        <div className="relative mx-auto max-w-[92rem]">
          <ScrollReveal>
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.26em] text-[#d4ea52]">Services</p>
                <h2 className="mt-5 text-[clamp(2.7rem,5vw,5rem)] font-black leading-[0.94] tracking-[-0.04em]">
                  Visibility is<br />a full-stack job.
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-[1.8] text-white/58">
                Strategy, production, placement, and support for campaigns that need to show up clearly across stores, roads, and major city routes.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-16 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => (
              <ScrollReveal key={service.title} delay={index * 65} className={index === 0 || index === 5 ? "lg:col-span-2" : ""}>
                <article className="group relative min-h-64 overflow-hidden border border-white/10 bg-[#151912] p-8 transition-all duration-300 hover:border-[#d4ea52] hover:bg-[#d4ea52] lg:min-h-72">
                  <p className="text-xs font-black tracking-[0.2em] text-[#d4ea52] transition-colors duration-300 group-hover:text-[#52600d]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <div className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/0 text-white/0 transition-all duration-300 group-hover:rotate-45 group-hover:border-[#0d100b]/20 group-hover:text-[#0d100b]">
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                      <path d="M3 13L13 3M13 3H6M13 3v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="absolute bottom-8 left-8 right-8">
                    <h3 className={(index === 0 || index === 5 ? "text-3xl" : "text-xl") + " font-black leading-[1.02] transition-colors duration-300 group-hover:text-[#0d100b]"}>{service.title}</h3>
                    <p className="mt-3 max-w-lg text-sm leading-[1.7] text-white/52 transition-colors duration-300 group-hover:text-[#2a3013]">{service.copy}</p>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROCESS ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#d4ea52] px-5 py-24 text-[#0d100b] lg:px-8 lg:py-32">
        <div aria-hidden="true" className="absolute -bottom-28 -right-10 select-none text-[22rem] font-black leading-none text-[#0d100b]/[0.045]">05</div>
        <div className="route-grid-dark absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-[92rem]">
          <ScrollReveal>
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em]">How we work</p>
                <h2 className="mt-5 text-[clamp(2.7rem,5vw,5.4rem)] font-black leading-[0.9] tracking-[-0.045em]">
                  One team.<br />Five clear moves.
                </h2>
              </div>
              <p className="max-w-xl border-l border-[#0d100b]/20 pl-6 text-lg leading-[1.8] text-[#303817] lg:ml-auto">
                From the first route recommendation to the final installation, every stage stays visible, practical, and focused on campaign impact.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {workflowSteps.map((item, index) => (
              <ScrollReveal key={item} delay={index * 70} className="h-full">
                <div className={"group relative h-full min-h-52 overflow-hidden border border-[#0d100b] p-6 transition duration-300 hover:-translate-y-2 " + (index === 2 ? "bg-[#f7f4ec]" : "bg-[#0d100b] text-white")}>
                  <span className={"text-6xl font-black leading-none " + (index === 2 ? "text-[#0d100b]/10" : "text-white/10")}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className={"mb-4 block h-1 w-9 transition-[width] duration-300 group-hover:w-16 " + (index === 2 ? "bg-[#0d100b]" : "bg-[#d4ea52]")} />
                    <p className="text-lg font-black leading-tight">{item}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LOCATIONS ───────────────────────────────────────────── */}
      <section id="locations" className="relative scroll-mt-20 overflow-hidden bg-[#ede8dc] px-5 py-24 lg:px-8 lg:py-32">
        <div className="route-grid-dark absolute inset-0 opacity-[0.035]" />
        <div className="relative mx-auto max-w-[92rem]">
          <ScrollReveal>
            <div className="relative overflow-hidden bg-[#0d100b] px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
              <div aria-hidden="true" className="absolute -right-5 -top-20 select-none text-[18rem] font-black leading-none text-white/[0.035]">31</div>
              <div className="absolute bottom-0 right-[24%] top-0 hidden w-px rotate-[18deg] bg-[#d4ea52]/30 lg:block" />
              <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                <div>
                  <div className="flex items-center gap-4">
                    <span className="h-px w-12 bg-[#d4ea52]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4ea52]">Featured Inventory · Lahore</p>
                  </div>
                  <h2 className="mt-7 max-w-4xl text-[clamp(2.8rem,5.5vw,6rem)] font-black leading-[0.88] tracking-[-0.05em]">
                    Prime routes.<br /><span className="text-[#d4ea52]">Serious visibility.</span>
                  </h2>
                </div>
                <div className="lg:pb-2">
                  <p className="max-w-xl text-base leading-[1.8] text-white/58">
                    Crown operates across multiple cities. This 27 June 2026 release deliberately spotlights Lahore—one of Pakistan&apos;s largest and most important media markets—with 31 featured static billboards and bridge panels.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-2">
                    {landingLocationCategories.map((category) => (
                      <a
                        key={category.id}
                        href={"#" + category.id}
                        className="rounded-full border border-white/14 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:border-[#d4ea52] hover:bg-[#d4ea52] hover:text-[#0d100b]"
                      >
                        {category.shortLabel}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <div className="mt-24 space-y-28">
            {landingLocationCategories.map((category, categoryIndex) => {
              const locations = landingLocations.filter((location) => location.category === category.id);

              return (
                <section id={category.id} key={category.id} className="scroll-mt-28">
                  <ScrollReveal>
                    <div className="mb-10 flex flex-col gap-5 border-b border-black/12 pb-6 sm:flex-row sm:items-end sm:justify-between">
                      <div className="flex items-start gap-5">
                        <span className="text-6xl font-black leading-none text-[#0d100b]/10">
                          {String(categoryIndex + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8a9720]">
                            Lahore collection
                          </p>
                          <h3 className="mt-1 text-[clamp(2rem,3vw,3rem)] font-black leading-none tracking-[-0.03em]">
                            {category.label}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8a9720]">
                        {locations.length} placements
                      </p>
                    </div>
                  </ScrollReveal>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {locations.map((location, index) => (
                      <ScrollReveal key={location.id} delay={(index % 3) * 60} className={index % 7 === 0 ? "xl:col-span-2" : ""}>
                        <article className="location-card group h-full overflow-hidden rounded-[1.7rem] border border-black/10 bg-[#f8f5ed] shadow-[0_14px_40px_rgba(13,16,11,0.05)] transition duration-500 hover:-translate-y-1.5 hover:border-black/20 hover:shadow-[0_24px_60px_rgba(13,16,11,0.12)]">
                          <div className={"relative overflow-hidden bg-[#0d100b] " + (index % 7 === 0 ? "aspect-[16/8]" : "aspect-[16/10]")}>
                            <Image
                              src={location.image}
                              alt={location.name + " outdoor advertising placement in Lahore"}
                              fill
                              sizes="(min-width: 1280px) 30vw, (min-width: 768px) 50vw, 100vw"
                              className="object-cover transition duration-1000 group-hover:scale-[1.055]"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-[#0d100b]/75 via-transparent to-transparent" />
                            <span className="absolute right-4 top-3 text-6xl font-black leading-none text-white/18">
                              {String(location.slide).padStart(2, "0")}
                            </span>
                            <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                              <span className="rounded-full bg-[#d4ea52] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0d100b]">
                                Lahore
                              </span>
                              <span className="rounded-full border border-white/20 bg-[#0d100b]/72 px-3 py-1.5 text-xs font-black text-white backdrop-blur-md">
                                {location.size}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col p-6 lg:p-7">
                            <div className="flex items-center gap-3">
                              <span className="h-px w-7 bg-[#8a9720]" />
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8a9720]">
                                Placement {String(location.slide).padStart(2, "0")}
                              </p>
                            </div>
                            <h4 className={(index % 7 === 0 ? "text-2xl lg:text-3xl" : "text-xl") + " mt-3 font-black leading-[1.05] tracking-[-0.02em] text-[#0d100b]"}>
                              {location.name}
                            </h4>

                            {location.toward ? (
                              <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-black/10 pt-5">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8a9720]">From</p>
                                  <p className="mt-1 text-xs font-bold leading-snug text-[#30372b]">{location.from}</p>
                                </div>
                                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-[#8a9720]">
                                  <path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                                </svg>
                                <div className="text-right">
                                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8a9720]">Toward</p>
                                  <p className="mt-1 text-xs font-bold leading-snug text-[#30372b]">{location.toward}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-6 border-t border-black/10 pt-5">
                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8a9720]">Facing</p>
                                <p className="mt-1 text-xs font-bold leading-snug text-[#30372b]">{location.from}</p>
                              </div>
                            )}

                          </div>
                        </article>
                      </ScrollReveal>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CLIENTS ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0d100b] py-28 text-white">
        <div className="route-grid absolute inset-0 opacity-10" />
        <ScrollReveal>
          <div className="relative mx-auto grid max-w-[92rem] gap-8 px-5 lg:grid-cols-[1fr_0.65fr] lg:items-end lg:px-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d4ea52]">Our Clients</p>
              <h2 className="mt-5 max-w-4xl text-[clamp(2.6rem,5vw,5rem)] font-black leading-[0.92] tracking-[-0.045em]">
                Built with brands<br />that need to be seen.
              </h2>
            </div>
            <p className="max-w-xl border-l border-white/12 pl-6 text-base leading-[1.8] text-white/55 lg:ml-auto">
              From real estate and retail to food, FMCG, and services, our work supports brands that need attention in the right places.
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
      <section className="bg-[#0d100b] px-5 pb-32 pt-10 text-white lg:px-8">
        <div className="mx-auto max-w-[92rem]">
          <ScrollReveal>
            <div className="relative grid gap-10 overflow-hidden border-y border-white/10 py-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:py-20">
              <span aria-hidden="true" className="absolute -right-2 -top-16 text-[18rem] font-black leading-none text-[#d4ea52]/[0.055]">“</span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.26em] text-[#d4ea52]">CEO Message</p>
                <h2 className="mt-5 max-w-md text-[clamp(2.4rem,4vw,4rem)] font-black leading-[0.98] tracking-[-0.035em]">
                  We&apos;re passionate about making your brand shine.
                </h2>
              </div>
              <figure className="relative z-10">
                <blockquote className="text-lg leading-[1.9] text-white/68 lg:text-xl">
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
      <section className="relative overflow-hidden bg-[#d4ea52] px-5 py-24 lg:px-8 lg:py-32">
        <div aria-hidden="true" className="absolute -bottom-36 -left-16 h-96 w-96 rounded-full border-[80px] border-[#0d100b]/5" />
        <div aria-hidden="true" className="absolute -right-20 top-0 text-[18rem] font-black leading-none text-[#0d100b]/[0.045]">GO</div>
        <ScrollReveal>
          <div className="relative mx-auto max-w-5xl text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#52600d]">Your next campaign starts here</p>
            <h2 className="mt-6 text-[clamp(3rem,6.5vw,6.5rem)] font-black leading-[0.88] tracking-[-0.055em] text-[#0d100b]">
              Make every city<br />remember your name.
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
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">Lahore Office</h2>
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
            <p>Based in Lahore · Campaigns across Pakistan</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
