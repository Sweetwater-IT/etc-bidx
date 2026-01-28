"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
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
import Fuse from "fuse.js"
import type { IFuseOptions } from "fuse.js"
import { useDebounce } from "use-debounce"

interface Option {
  id: string | number
  label: string
  value: any
  subtitle?: string
}

interface ImprovedComboboxProps {
  options: Option[]
  value?: Option | null
  onChange: (option: Option | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  loading?: boolean
  disabled?: boolean
  className?: string
  recentItems?: Option[]
  onCreateNew?: () => void
  createNewText?: string
  fuseOptions?: Fuse.IFuseOptions<Option>
}

export function ImprovedCombobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No items found.",
  loading = false,
  disabled = false,
  className,
  recentItems = [],
  onCreateNew,
  createNewText = "+ Add new",
  fuseOptions = {
    keys: ["label", "subtitle"],
    threshold: 0.3,
    includeScore: true,
  },
}: ImprovedComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery] = useDebounce(searchQuery, 250)
  const liveRegionRef = useRef<HTMLDivElement>(null)

  // Create Fuse instance
  const fuse = useMemo(() => new Fuse(options, fuseOptions), [options, fuseOptions])

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return options
    }
    const results = fuse.search(debouncedQuery)
    return results.map(result => result.item)
  }, [debouncedQuery, fuse, options])

  // Separate recent items
  const recentFiltered = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return recentItems.filter(item => options.some(opt => opt.id === item.id))
    }
    return []
  }, [debouncedQuery, recentItems, options])

  // Update live region for screen readers
  useEffect(() => {
    if (liveRegionRef.current) {
      const count = filteredOptions.length + recentFiltered.length
      liveRegionRef.current.textContent = count > 0
        ? `${count} item${count === 1 ? '' : 's'} found`
        : "No items found"
    }
  }, [filteredOptions.length, recentFiltered.length])

  const handleSelect = (option: Option) => {
    onChange(option)
    setOpen(false)
    setSearchQuery("")
  }

  const handleClear = () => {
    onChange(null)
    setSearchQuery("")
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-describedby="combobox-live-region"
            className={cn("w-full justify-between", className)}
            disabled={disabled}
          >
            <span className="truncate">
              {value ? value.label : placeholder}
            </span>
            <div className="flex items-center gap-1">
              {value && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                />
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-[9999] w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              )}

              {!loading && (
                <>
                  {/* Recent items */}
                  {recentFiltered.length > 0 && (
                    <CommandGroup heading="Recent">
                      {recentFiltered.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.label}
                          onSelect={() => handleSelect(option)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value?.id === option.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            {option.subtitle && (
                              <span className="text-xs text-muted-foreground">
                                {option.subtitle}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* Search results */}
                  <CommandGroup>
                    {filteredOptions.length === 0 && debouncedQuery.trim() ? (
                      <CommandEmpty>
                        <div className="py-6 text-center">
                          <p className="text-sm text-muted-foreground mb-2">
                            No items match '{debouncedQuery}'
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Try a different search term
                          </p>
                        </div>
                      </CommandEmpty>
                    ) : (
                      <>
                        {onCreateNew && (
                          <CommandItem
                            onSelect={() => {
                              setOpen(false)
                              onCreateNew()
                            }}
                            className="font-medium text-primary cursor-pointer"
                          >
                            {createNewText}
                          </CommandItem>
                        )}
                        {filteredOptions.map((option) => (
                          <CommandItem
                            key={option.id}
                            value={option.label}
                            onSelect={() => handleSelect(option)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                value?.id === option.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              {option.subtitle && (
                                <span className="text-xs text-muted-foreground">
                                  {option.subtitle}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </>
                    )}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Live region for screen readers */}
      <div
        ref={liveRegionRef}
        id="combobox-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  )
}