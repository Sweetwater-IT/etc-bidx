"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewRecordStickyPageHeaderProps {
  backLabel: string;
  onBack: () => void;
  onDone: () => void;
  leftContent?: ReactNode;
  additionalButtons?: ReactNode;
  doneLabel?: string;
  saveStatusLabel?: string;
  // Autosave props
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  hasUnsavedChanges?: boolean;
  firstSave?: boolean;
}

export function NewRecordStickyPageHeader({
  backLabel,
  onBack,
  onDone,
  leftContent,
  additionalButtons,
  doneLabel = "Save",
  saveStatusLabel = "Draft",
  isSaving = false,
  lastSavedAt = null,
  hasUnsavedChanges = false,
  firstSave = false,
}: NewRecordStickyPageHeaderProps) {
  const [secondCounter, setSecondCounter] = useState(0);

  useEffect(() => {
    if (!firstSave || !lastSavedAt) {
      setSecondCounter(0);
      return;
    }

    const syncCounter = () => {
      const secondsSinceSave = Math.max(
        1,
        Math.floor((Date.now() - lastSavedAt.getTime()) / 1000)
      );
      setSecondCounter(secondsSinceSave);
    };

    syncCounter();
    const intervalId = setInterval(syncCounter, 1000);

    return () => clearInterval(intervalId);
  }, [firstSave, lastSavedAt]);

  const getSaveStatusMessage = useCallback(() => {
    if (isSaving) return 'Saving...';
    if (!firstSave) return '';

    if (secondCounter < 60) {
      return `${saveStatusLabel} saved ${secondCounter} second${secondCounter !== 1 ? 's' : ''} ago`;
    } else if (secondCounter < 3600) {
      const minutesAgo = Math.floor(secondCounter / 60);
      return `${saveStatusLabel} saved ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
    } else {
      const hoursAgo = Math.floor(secondCounter / 3600);
      return `${saveStatusLabel} saved ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
    }
  }, [isSaving, firstSave, secondCounter, saveStatusLabel]);

  const saveStatusMessage = getSaveStatusMessage();
  const showStatusText = saveStatusMessage !== '';

  return (
    <header className="sticky top-11 z-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
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
          {showStatusText && (
            <div className="text-sm text-muted-foreground">
              {saveStatusMessage}
            </div>
          )}
          {additionalButtons}
          <Button
            onClick={onDone}
            className="gap-2 h-8"
          >
            {doneLabel}
          </Button>
        </div>
      </div>
    </header>
  );
}
