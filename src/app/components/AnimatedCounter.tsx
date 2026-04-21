"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: string; // e.g. "18+", "360°", "8"
  className?: string;
}

export default function AnimatedCounter({ value, className = "" }: Props) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;

          const numMatch = value.match(/(\d+)/);
          if (!numMatch) {
            setDisplay(value);
            return;
          }

          const target = parseInt(numMatch[1], 10);
          const suffix = value.replace(/\d+/, "");
          const duration = 1400;
          const fps = 45;
          const totalSteps = Math.round((duration / 1000) * fps);
          let step = 0;

          const tick = setInterval(() => {
            step++;
            const progress = step / totalSteps;
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            setDisplay(current + suffix);
            if (step >= totalSteps) {
              setDisplay(value);
              clearInterval(tick);
            }
          }, 1000 / fps);

          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
