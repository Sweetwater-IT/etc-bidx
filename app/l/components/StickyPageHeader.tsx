"use client";

import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickyPageHeaderProps {
  backLabel: string;
  onBack: () => void;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  showBackButton?: boolean;
}

export function StickyPageHeader({
  backLabel,
  onBack,
  leftContent,
  rightContent,
  showBackButton = true,
}: StickyPageHeaderProps) {
  return (
    <header className="sticky top-11 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showBackButton ? (
            <Button
              variant="ghost"
              onClick={onBack}
              className="gap-2 h-8 px-2 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Button>
          ) : null}
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
