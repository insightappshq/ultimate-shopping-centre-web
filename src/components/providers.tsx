"use client";

import { ThemeProvider } from "next-themes";
import { CookieNotice } from "@/components/common/cookie-notice";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster position="top-center" richColors closeButton />
        <CookieNotice />
      </TooltipProvider>
    </ThemeProvider>
  );
}
