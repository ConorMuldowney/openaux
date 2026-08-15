import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StandardPageLayoutProps = {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  maxWidthClassName?: string;
};

export function StandardPageLayout({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  maxWidthClassName,
}: StandardPageLayoutProps) {
  const hasHeaderContent = Boolean(eyebrow || title || description || actions);

  return (
    <main
      className={cn(
        "flex min-h-full w-full flex-1 flex-col gap-4 px-6 py-8",
        maxWidthClassName,
        className,
      )}
    >
      {hasHeaderContent ? (
        <header className={cn("flex flex-wrap items-start justify-between gap-4", headerClassName)}>
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
            ) : null}
            {title ? <h1 className="text-3xl font-black tracking-tight">{title}</h1> : null}
            {description ? <p className="max-w-3xl text-sm text-foreground/75">{description}</p> : null}
          </div>

          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </header>
      ) : null}

      {children}
    </main>
  );
}
