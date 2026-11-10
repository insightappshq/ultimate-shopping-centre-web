import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <Icon className="mb-4 size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <h2 className="text-xl">{title}</h2>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}
