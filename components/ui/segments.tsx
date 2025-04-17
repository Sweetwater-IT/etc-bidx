import { useState } from "react"
import { Button } from "@/components/ui/button"

type SegmentsProps = {
  segments: {
    label: string
    value: string
  }[]
  onChange?: (value: string) => void
  value?: string
}

export function Segments({ segments, onChange, value }: SegmentsProps) {
  const [internalValue, setInternalValue] = useState(segments[0]?.value)
  
  // Use either the controlled value from props or the internal state
  const activeSegment = value !== undefined ? value : internalValue;

  const handleSegmentChange = (segmentValue: string) => {
    // Update internal state if not controlled
    if (value === undefined) {
      setInternalValue(segmentValue);
    }
    
    // Always call onChange if provided
    if (onChange) {
      onChange(segmentValue);
    }
  };

  return (
    <div className="inline-flex rounded-lg border p-1 bg-background">
      {segments.map((segment) => (
        <Button
          key={segment.value}
          variant={activeSegment === segment.value ? "default" : "ghost"}
          size="sm"
          className="rounded-md"
          onClick={() => handleSegmentChange(segment.value)}
        >
          {segment.label}
        </Button>
      ))}
    </div>
  )
} 