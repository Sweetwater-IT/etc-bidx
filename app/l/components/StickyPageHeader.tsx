"use client";

import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickyPageHeaderProps {
  backLabel: string;
  onBack: () => void;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

export function StickyPageHeader({
  backLabel,
  onBack,
  leftContent,
  rightContent,
}: StickyPageHeaderProps) {
  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2 h-8 px-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
          {leftContent ? <div className="min-w-0 flex-1">{leftContent}</div> : null}
        </div>
        {rightContent ? (
          <div className="flex items-center gap-2 shrink-0 overflow-x-auto">
            {rightContent}
          </div>
        ) : null}
      </div>
    </header>
  );
}
