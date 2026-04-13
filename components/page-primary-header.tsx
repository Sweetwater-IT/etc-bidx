import { ReactNode } from "react";

interface PagePrimaryHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  sticky?: boolean;
}

export function PagePrimaryHeader({
  icon,
  title,
  subtitle,
  actions,
  sticky = false,
}: PagePrimaryHeaderProps) {
  return (
    <header className={sticky ? "sticky top-11 z-30 shrink-0 border-b bg-card" : "shrink-0 border-b bg-card"}>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {icon && <div className="rounded-md bg-primary p-2 text-primary-foreground shadow-sm">{icon}</div>}
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-foreground truncate">
              {title}
            </h1>
            {subtitle ? (
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground min-w-0">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
