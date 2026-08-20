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
        "flex min-h-full w-full min-w-0 flex-1 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        maxWidthClassName,
        className,
      )}
    >
      {hasHeaderContent ? (
        <header className={cn("flex flex-col items-start justify-between gap-4 sm:flex-row", headerClassName)}>
          <div className="min-w-0 space-y-2">
            {eyebrow ? (
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
            ) : null}
            {title ? <h1 className="break-words text-2xl font-black tracking-tight sm:text-3xl">{title}</h1> : null}
            {description ? <p className="max-w-3xl text-sm text-foreground/75">{description}</p> : null}
          </div>

          {actions ? <div className="flex w-full items-center gap-3 [&>*]:w-full sm:w-auto sm:[&>*]:w-auto">{actions}</div> : null}
        </header>
      ) : null}

      {children}
    </main>
  );
}
