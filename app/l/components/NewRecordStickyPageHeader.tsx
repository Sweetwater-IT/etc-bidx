"use client";

import { ReactNode, useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NewRecordStickyPageHeaderProps {
  backLabel: string;
  onBack: () => void;
  onDone: () => void;
  leftContent?: ReactNode;
  additionalButtons?: ReactNode;
  // Autosave props
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  hasUnsavedChanges?: boolean;
}

export function NewRecordStickyPageHeader({
  backLabel,
  onBack,
  onDone,
  leftContent,
  additionalButtons,
  isSaving = false,
  lastSavedAt = null,
  hasUnsavedChanges = false,
}: NewRecordStickyPageHeaderProps) {
  const [secondCounter, setSecondCounter] = useState(0);
  const secondCounterRef = useRef(0);

  // Autosave counter logic (from quotes/create)
  useEffect(() => {
    const intervalId = setInterval(() => {
      secondCounterRef.current += 1;
      setSecondCounter(secondCounterRef.current);
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const getSaveStatusMessage = useCallback(() => {
    if (isSaving) return 'Saving...';
    if (!lastSavedAt) return hasUnsavedChanges ? 'Not saved' : '';
    const secondsAgo = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000);
    if (secondsAgo < 60) {
      return `Saved ${secondsAgo} second${secondsAgo !== 1 ? 's' : ''} ago`;
    } else if (secondsAgo < 3600) {
      const minutesAgo = Math.floor(secondsAgo / 60);
      return `Saved ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
    } else {
      const hoursAgo = Math.floor(secondsAgo / 3600);
      return `Saved ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
    }
  }, [isSaving, lastSavedAt, hasUnsavedChanges]);

  const saveStatusMessage = getSaveStatusMessage();
  const showStatusBadge = saveStatusMessage !== '';

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
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto">
          {showStatusBadge && (
            <Badge
              variant={hasUnsavedChanges && !isSaving ? "destructive" : "secondary"}
              className="text-xs"
            >
              {saveStatusMessage}
            </Badge>
          )}
          {additionalButtons}
          <Button
            onClick={onDone}
            className="gap-2 h-8"
          >
            Done
          </Button>
        </div>
      </div>
    </header>
  );
}