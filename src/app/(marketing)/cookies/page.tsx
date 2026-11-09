import { CookieIcon } from "lucide-react";
import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Ultimate Shopping Centre uses essential cookies and browser storage.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      document="cookies"
      title="Cookie Policy"
      icon={CookieIcon}
      summary="USC uses only essential cookies — to keep you signed in and remember your delivery location. No advertising or tracking cookies, ever."
    />
  );
}
