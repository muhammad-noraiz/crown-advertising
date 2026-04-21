"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("is-visible"), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -56px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const translateClass =
    direction === "up"
      ? "translate-y-8"
      : direction === "left"
        ? "-translate-x-8"
        : direction === "right"
          ? "translate-x-8"
          : "";

  return (
    <div
      ref={ref}
      className={`opacity-0 ${translateClass} transition-[opacity,transform] duration-700 ease-out [&.is-visible]:translate-x-0 [&.is-visible]:translate-y-0 [&.is-visible]:opacity-100 ${className}`}
    >
      {children}
    </div>
  );
}
