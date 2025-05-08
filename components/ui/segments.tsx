import { useState } from "react"
import { Button } from "@/components/ui/button"

type SegmentsProps = {
  segments: {
    label: string
    value: string
  }[]
  onChange?: (value: string) => void
  value?: string
  counts?: Record<string, number>
}

export function Segments({ segments, onChange, value, counts }: SegmentsProps) {
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
    <div className="inline-flex rounded-lg border p-1">
      {segments.map((segment) => (
        <Button
          key={segment.value}
          variant={activeSegment === segment.value ? "default" : "ghost"}
          size="sm"
          className={`rounded-md ${activeSegment === segment.value ? "bg-black text-white" : "bg-white text-black"}`}
          onClick={() => handleSegmentChange(segment.value)}
        >
          {segment.label}
        </Button>
      ))}
    </div>
  )
} 