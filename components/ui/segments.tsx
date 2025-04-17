import { useState } from "react"
import { Button } from "@/components/ui/button"

type SegmentsProps = {
  segments: {
    label: string
    value: string
  }[]
}

export function Segments({ segments }: SegmentsProps) {
  const [activeSegment, setActiveSegment] = useState(segments[0]?.value)

  return (
    <div className="inline-flex rounded-lg border p-1 bg-background">
      {segments.map((segment) => (
        <Button
          key={segment.value}
          variant={activeSegment === segment.value ? "default" : "ghost"}
          size="sm"
          className="rounded-md"
          onClick={() => setActiveSegment(segment.value)}
        >
          {segment.label}
        </Button>
      ))}
    </div>
  )
} 