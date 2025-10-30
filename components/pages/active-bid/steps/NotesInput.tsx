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
    <div className="text-md leading-relaxed">
      {parts.map((part, i) => {
        const match = part.match(/^\[(.*?)\]$/)
        if (match) {
          return (
            <span key={i} className="inline-block align-baseline">
              <AutoWidthInput
                value={
                  match[1].toLowerCase().includes("enter") ||
                    match[1].toLowerCase().includes("insert")
                    ? "0"
                    : match[1]
                }
                onChange={(val) => handleInputChange(i, val)}
              />
            </span>
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
    <div className="relative inline-flex items-center mr-[2px]">
      <span
        ref={spanRef}
        className="absolute opacity-0 whitespace-pre text-md px-2 pointer-events-none"
      >
        {value || " "}
      </span>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm h-[35px] min-w-[50px] px-2 text-gray-500 shadow-md border border-gray-300 rounded-md"
        style={{ width }}
      />
    </div>
  )
}

export default NotesInputs
