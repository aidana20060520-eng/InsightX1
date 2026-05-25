"use client";

import React from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { FloatingAssistant } from "@/components/assistant/floating-assistant";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 ml-[260px] flex flex-col overflow-hidden transition-all duration-300">
          <Navbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        <FloatingAssistant />
      </div>
    </ThemeProvider>
  );
}
