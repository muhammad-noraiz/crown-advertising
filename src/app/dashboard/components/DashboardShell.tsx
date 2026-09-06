"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import type { ManagementAccess } from "@/lib/permissions";

interface Props {
  children: React.ReactNode;
  access: ManagementAccess | null;
  alertCount: number;
}

export function DashboardShell({ children, access, alertCount }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedCollapsed = localStorage.getItem("sidebar-collapsed") === "true";
      const storedDark = localStorage.getItem("theme-dark") === "true";
      setCollapsed(storedCollapsed);
      setDark(storedDark);
      if (storedDark) document.documentElement.classList.add("dark");
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme-dark", String(next));
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar
        collapsed={collapsed && mounted}
        onToggle={toggleCollapsed}
        dark={dark}
        onToggleDark={toggleDark}
        access={access}
        alertCount={alertCount}
      />
      <main
        className="transition-[padding-left] duration-300"
        style={{ paddingLeft: collapsed && mounted ? "4rem" : "16rem" }}
      >
        <div className="p-8 dashboard-main">{children}</div>
      </main>
    </div>
  );
}
