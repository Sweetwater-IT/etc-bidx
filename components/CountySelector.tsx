"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { restorePointerEvents } from "@/lib/pointer-events-fix"
import { cn } from "@/lib/utils"

export interface CountyOption {
  id: string | number
  name: string
}

interface CountySelectorProps {
  counties: CountyOption[]
  value: string
  onSelect: (countyId: string) => void
  disabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  contentClassName?: string
}

export function CountySelector({
  counties,
  value,
  onSelect,
  disabled = false,
  placeholder = "Select county...",
  searchPlaceholder = "Search county...",
  emptyMessage = "No county found.",
  className,
  contentClassName,
}: CountySelectorProps) {
  const [open, setOpen] = useState(false)
  const interactionLogRef = useRef({ wheel: false, scroll: false, touch: false })

  useEffect(() => {
    if (!open) {
      interactionLogRef.current = { wheel: false, scroll: false, touch: false }
    }
  }, [open])

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        restorePointerEvents()
      }}
      modal={false}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("z-[70] w-[var(--radix-popover-trigger-width)] p-0", contentClassName)}
        avoidCollisions={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          restorePointerEvents()
        }}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandList
            className="max-h-80 overflow-y-auto overflow-x-hidden overscroll-contain"
            data-testid="county-selector-list"
            onWheelCapture={(event) => {
              event.stopPropagation()
              restorePointerEvents()
              interactionLogRef.current.wheel = true
            }}
            onScrollCapture={(event) => {
              event.stopPropagation()
              interactionLogRef.current.scroll = true
            }}
            onTouchMoveCapture={(event) => {
              event.stopPropagation()
              restorePointerEvents()
              interactionLogRef.current.touch = true
            }}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <CommandGroup>
              {counties.map((county) => (
                <CommandItem
                  key={county.id}
                  value={county.name}
                  onPointerDownCapture={() => {
                    restorePointerEvents()
                  }}
                  onSelect={() => {
                    restorePointerEvents()
                    onSelect(String(county.id))
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === county.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {county.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
