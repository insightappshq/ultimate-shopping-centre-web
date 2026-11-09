import { Suspense } from "react";
import { MobileCartCount } from "@/components/layout/header-actions";
import { MobileTabBar, MobileTabBarView } from "@/components/layout/mobile-tab-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

async function MobileNav() {
  const cartCount = await MobileCartCount();
  return <MobileTabBar cartCount={cartCount} />;
}

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <Suspense fallback={<MobileTabBarView />}>
        <MobileNav />
      </Suspense>
    </>
  );
}
