"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

interface TakeoffViewCardProps {
  title: string;
  icon?: ReactNode;
  badge?: string | number;
  children: ReactNode;
  className?: string;
}

export function TakeoffViewCard({
  title,
  icon,
  badge,
  children,
  className = ""
}: TakeoffViewCardProps) {
  return (
    <div className={`rounded-lg border bg-card shadow-sm ${className}`}>
      <div className="px-5 py-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            {icon}
            {title}
          </h2>
          {badge && (
            <Badge variant="secondary" className="text-[10px]">
              {typeof badge === 'number' ? `${badge} ${title.toLowerCase()}` : badge}
            </Badge>
          )}
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}