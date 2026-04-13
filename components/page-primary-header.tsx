import { ReactNode } from "react";

interface PagePrimaryHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PagePrimaryHeader({
  icon,
  title,
  subtitle,
  actions,
}: PagePrimaryHeaderProps) {
  return (
    <header className="shrink-0 border-b bg-card">
      <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <div className="p-1.5 rounded bg-primary">{icon}</div>}
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-foreground leading-none truncate">
              {title}
            </h1>
            {subtitle ? (
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 min-w-0">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
