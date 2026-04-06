import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SegmentsProps = {
  segments: {
    label: string
    value: string
  }[]
  onChange?: (value: string) => void
  value?: string
  counts?: Record<string, number>
  variant?: "default" | "job-list" | "productivity"
}

export function Segments({ segments, onChange, value, counts, variant = "default" }: SegmentsProps) {
  const [internalValue, setInternalValue] = useState(segments[0]?.value)
  
  const activeSegment = value !== undefined ? value : internalValue;

  const handleSegmentChange = (segmentValue: string) => {
    if (value === undefined) {
      setInternalValue(segmentValue);
    }
    
    if (onChange) {
      onChange(segmentValue);
    }
  };

  return (
    <div
      className={cn(
        "inline-flex rounded-lg border p-1",
        variant === "job-list" && "items-center gap-1 rounded-md bg-card p-0.5",
        variant === "productivity" && "items-center gap-1 rounded-lg border bg-card p-0.5"
      )}
    >
      {segments.map((segment) => (
        <Button
          key={segment.value}
          variant={activeSegment === segment.value ? "default" : "ghost"}
          size="sm"
          className={cn(
            "rounded-md",
            variant === "productivity"
              ? activeSegment === segment.value
                ? "border border-primary/20 bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-sm hover:bg-primary/90"
                : "border border-transparent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:bg-primary/10 hover:text-primary"
              : variant === "job-list"
              ? activeSegment === segment.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              : activeSegment === segment.value
                ? "bg-black text-white"
                : "bg-white text-black"
          )}
          onClick={() => handleSegmentChange(segment.value)}
        >
          {variant === "productivity"
            ? `${segment.label} (${counts?.[segment.value] || 0})`
            : `${segment.label} (${counts?.[segment.value] || 0})`}
        </Button>
      ))}
    </div>
  )
} 
