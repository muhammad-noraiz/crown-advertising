"use client";

import { useState, useEffect } from "react";

const navLinks = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
];

export default function MobileNav({ phone }: { phone: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.25 rounded-xl lg:hidden"
      >
        <span
          className={`block h-0.5 w-5 origin-center rounded-full bg-white transition-all duration-300 ${open ? "translate-y-1.75 rotate-45" : ""}`}
        />
        <span
          className={`block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${open ? "scale-x-0 opacity-0" : ""}`}
        />
        <span
          className={`block h-0.5 w-5 origin-center rounded-full bg-white transition-all duration-300 ${open ? "-translate-y-1.75 -rotate-45" : ""}`}
        />
      </button>

      <div
        className={`fixed inset-0 z-40 transition-all duration-500 lg:hidden ${open ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        <div
          className="absolute inset-0 bg-[#0d100b]/96 backdrop-blur-2xl"
          onClick={() => setOpen(false)}
        />
        <nav
          className={`relative flex h-full flex-col items-center justify-center gap-7 transition-transform duration-500 ${open ? "translate-y-0" : "translate-y-6"}`}
        >
          {navLinks.map(({ href, label }, i) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${i * 60 + 80}ms` : "0ms" }}
              className={`text-4xl font-black text-white transition-all duration-300 hover:text-[#d4ea52] ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              {label}
            </a>
          ))}
          <a
            href={`tel:${phone}`}
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? "320ms" : "0ms" }}
            className={`mt-4 rounded-full bg-[#d4ea52] px-8 py-4 text-base font-black text-[#0d100b] transition-all duration-300 ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
          >
            Get a Quote
          </a>
        </nav>
      </div>
    </>
  );
}
