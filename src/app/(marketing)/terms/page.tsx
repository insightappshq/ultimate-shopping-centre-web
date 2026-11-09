import { ScrollTextIcon } from "lucide-react";
import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Ultimate Shopping Centre's price-comparison service.",
};

export default function TermsPage() {
  return (
    <LegalPage
      document="terms"
      title="Terms of Service"
      icon={ScrollTextIcon}
      summary="The rules for using USC: what the service does and doesn't do, how prices from shopping platforms work, and your rights and responsibilities."
    />
  );
}
