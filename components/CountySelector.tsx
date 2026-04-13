"use client"

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
  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[var(--radix-popover-trigger-width)] p-0", contentClassName)}
        avoidCollisions={false}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandList className="max-h-80 overflow-y-auto" data-testid="county-selector-list">
            <CommandGroup>
              {counties.map(county => (
                <CommandItem
                  key={county.id}
                  value={county.name}
                  onSelect={() => onSelect(String(county.id))}
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
