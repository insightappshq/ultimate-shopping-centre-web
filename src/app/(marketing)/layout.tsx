import { SiteFooter } from "@/components/layout/site-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <MarketingHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter className="mt-0 pb-0 md:pb-0" />
    </>
  );
}
