'use client'
import { Input } from "@/components/ui/input"
import { useEffect, useRef, useState } from "react"

const NotesInputs = ({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) => {
  const parts = value.split(/(\[.*?\])/g)

  const handleInputChange = (index: number, newVal: string) => {
    const updated = parts
      .map((part, i) => (i === index ? `[${newVal}]` : part))
      .join("")
    onChange(updated)
  }

  return (
    <div className="flex flex-wrap items-baseline gap-1 text-sm leading-relaxed">
      {parts.map((part, i) => {
        const match = part.match(/^\[(.*?)\]$/)
        if (match) {
          return (
            <AutoWidthInput
              key={i}
              value={match[1]}
              onChange={(val) => handleInputChange(i, val)}
            />
          )
        }
        return (
          <span key={i} className="whitespace-pre-wrap">
            {part}
          </span>
        )
      })}
    </div>
  )
}

const AutoWidthInput = ({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) => {
  const spanRef = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState(40)

  useEffect(() => {
    if (spanRef.current) {
      const newWidth = Math.max(spanRef.current.offsetWidth + 16, 40)
      setWidth(newWidth)
    }
  }, [value])

  return (
    <div className="relative inline-block">
      <span
        ref={spanRef}
        className="absolute opacity-0 whitespace-pre text-sm px-2"
      >
        {value || " "}
      </span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="inline-block text-sm shadow-md"
        style={{ width }}
      />
    </div>
  )
}

export default NotesInputs
