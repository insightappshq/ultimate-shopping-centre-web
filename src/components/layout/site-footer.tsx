import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { PlatformLogo } from "@/components/brand/platform-logo";
import { PLATFORM_LIST } from "@/config/platforms";
import { categories, siteConfig } from "@/config/site";
import { searchHref } from "@/lib/routes";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-card pb-20 md:pb-0">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-heading font-bold">{siteConfig.name}</span>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">{siteConfig.description}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PLATFORM_LIST.map((p) => (
              <PlatformLogo key={p.id} platform={p.id} size="md" />
            ))}
          </div>
        </div>
        <FooterColumn title="Shop">
          {categories.slice(0, 5).map((c) => (
            <FooterLink key={c.label} href={searchHref(c.query)}>
              {c.label}
            </FooterLink>
          ))}
        </FooterColumn>
        <FooterColumn title="Your account">
          <FooterLink href="/account">Account</FooterLink>
          <FooterLink href="/cart">Cart</FooterLink>
          <FooterLink href="/wishlist">Wishlist</FooterLink>
          <FooterLink href="/login">Sign in</FooterLink>
        </FooterColumn>
        <FooterColumn title="Platforms">
          {PLATFORM_LIST.map((p) => (
            <FooterLink key={p.id} href={p.homepage} external>
              {p.name}
            </FooterLink>
          ))}
        </FooterColumn>
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {siteConfig.name}. Prices are fetched live and may change on the platform at checkout.</p>
          <p>
            Brand names and logos belong to their respective owners. USC is not affiliated with the listed platforms.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, external, children }: { href: string; external?: boolean; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground transition hover:text-foreground"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </Link>
    </li>
  );
}
