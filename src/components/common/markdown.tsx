import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function textOf(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textOf).join("");
  return "";
}

/** Renders trusted, repo-authored Markdown (GFM tables, lists, anchors). */
export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-usc max-w-none prose-headings:scroll-mt-24 prose-headings:font-heading prose-headings:tracking-tight prose-h2:mt-12 prose-h2:border-t prose-h2:pt-8 prose-h2:text-2xl prose-h3:text-lg prose-a:font-medium prose-a:underline-offset-4 prose-table:text-sm prose-th:text-left",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
          h3: ({ children }) => <h3 id={slugify(textOf(children))}>{children}</h3>,
          table: ({ children }) => (
            <div className="not-prose my-6 overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-sm [&_td]:border-t [&_td]:px-4 [&_td]:py-2.5 [&_td]:align-top [&_td]:text-muted-foreground [&_th]:bg-muted/60 [&_th]:px-4 [&_th]:py-2.5 [&_th]:font-semibold">
                {children}
              </table>
            </div>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

export function headingsOf(source: string): { id: string; title: string }[] {
  return [...source.matchAll(/^##\s+(.+)$/gm)].map((match) => ({ id: slugify(match[1]), title: match[1].trim() }));
}
