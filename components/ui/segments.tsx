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
  variant?: "default" | "job-list"
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
        variant === "job-list" && "items-center gap-1 rounded-md bg-card p-0.5"
      )}
    >
      {segments.map((segment) => (
        <Button
          key={segment.value}
          variant={activeSegment === segment.value ? "default" : "ghost"}
          size="sm"
          className={cn(
            "rounded-md",
            variant === "job-list"
              ? activeSegment === segment.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              : activeSegment === segment.value
                ? "bg-black text-white"
                : "bg-white text-black"
          )}
          onClick={() => handleSegmentChange(segment.value)}
        >
          {segment.label} ({counts?.[segment.value] || 0})
        </Button>
      ))}
    </div>
  )
} 
