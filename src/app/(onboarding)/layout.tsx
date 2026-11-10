import { LogOutIcon } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="container-page flex h-16 items-center justify-between">
        <Logo href="/home" />
        <form action={signOutAction}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOutIcon data-icon="inline-start" /> Sign out
          </Button>
        </form>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:pt-12">{children}</main>
    </div>
  );
}
