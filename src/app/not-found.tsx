import { CompassIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-1 flex-col py-8">
      <Logo />
      <div className="flex flex-1 items-center justify-center py-16">
        <EmptyState
          icon={CompassIcon}
          title="Page not found"
          description="The page you're looking for doesn't exist or has moved."
          className="w-full max-w-lg"
        >
          <Button asChild size="xl">
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild size="xl" variant="outline">
            <Link href="/search">Search products</Link>
          </Button>
        </EmptyState>
      </div>
    </div>
  );
}
