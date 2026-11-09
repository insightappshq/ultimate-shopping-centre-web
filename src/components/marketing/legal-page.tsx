import { CalendarIcon, type LucideIcon } from "lucide-react";
import { headingsOf, Markdown } from "@/components/common/markdown";
import { legalConfig } from "@/config/site";
import { getLegalDocument, type LegalDocument } from "@/lib/legal";

export async function LegalPage({
  document,
  title,
  summary,
  icon: Icon,
}: {
  document: LegalDocument;
  title: string;
  summary: string;
  icon: LucideIcon;
}) {
  const source = await getLegalDocument(document);
  const toc = headingsOf(source);

  return (
    <div className="bg-gradient-to-b from-secondary/50 via-background to-background">
      <div className="container-page py-12 sm:py-16">
        <header className="max-w-3xl">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Icon className="size-6" aria-hidden />
          </span>
          <h1 className="mt-6 text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{summary}</p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarIcon className="size-4" aria-hidden /> Last updated {legalConfig.lastUpdated}
          </p>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">On this page</p>
              <ol className="space-y-1.5 border-l text-sm">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="-ml-px block border-l border-transparent pl-4 text-muted-foreground transition hover:border-primary hover:text-foreground"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
          <article className="min-w-0 rounded-3xl border bg-card p-6 shadow-card sm:p-10">
            <Markdown source={source} />
          </article>
        </div>
      </div>
    </div>
  );
}
