import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  onManualSave: () => void;
  isSaving: boolean;
}

export const SaveStatusIndicator = ({
  status,
  lastSavedAt,
  onManualSave,
  isSaving
}: SaveStatusIndicatorProps) => {
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    if (!lastSavedAt) {
      setTimeAgo("");
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastSavedAt.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSeconds < 60) {
        setTimeAgo("just now");
      } else if (diffMinutes < 60) {
        setTimeAgo(`${diffMinutes}m ago`);
      } else if (diffHours < 24) {
        setTimeAgo(`${diffHours}h ago`);
      } else {
        setTimeAgo(`${diffDays}d ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastSavedAt]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: "Saving...",
          variant: "secondary" as const,
          color: "text-muted-foreground"
        };
      case 'saved':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: timeAgo ? `Saved ${timeAgo}` : "Saved",
          variant: "default" as const,
          color: "text-green-600"
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: "Save failed",
          variant: "destructive" as const,
          color: "text-destructive"
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          text: timeAgo ? `Last saved ${timeAgo}` : "Not saved",
          variant: "outline" as const,
          color: "text-muted-foreground"
        };
    }
  };

  const { icon, text, variant, color } = getStatusDisplay();

  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant} className={`text-xs gap-1.5 ${color}`}>
        {icon}
        {text}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        onClick={onManualSave}
        disabled={isSaving}
        className="h-7 text-xs"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            Saving...
          </>
        ) : (
          "Save"
        )}
      </Button>
    </div>
  );
};