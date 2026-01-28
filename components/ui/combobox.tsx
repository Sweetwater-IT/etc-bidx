"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
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

export interface ComboboxItem {
  value: string
  label: string
  [key: string]: any
}

interface ComboboxProps {
  items: ComboboxItem[]
  defaultValue?: ComboboxItem | null
  children: React.ReactNode
}

interface ComboboxTriggerProps {
  render: (props: { open: boolean }) => React.ReactNode
  children?: React.ReactNode
}

interface ComboboxContentProps {
  children: React.ReactNode
}

interface ComboboxInputProps {
  placeholder?: string
  showTrigger?: boolean
  showClear?: boolean
}

interface ComboboxEmptyProps {
  children: React.ReactNode
}

interface ComboboxListProps {
  children: (item: ComboboxItem) => React.ReactNode
}

interface ComboboxItemProps {
  key: string | number
  value: ComboboxItem
  children: React.ReactNode
  onSelect?: (item: ComboboxItem) => void
}

interface ComboboxValueProps {
  children?: React.ReactNode
}

// Context for sharing state between components
const ComboboxContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  value: ComboboxItem | null
  setValue: (value: ComboboxItem | null) => void
  items: ComboboxItem[]
} | null>(null)

const Combobox = ({ items, defaultValue, children }: ComboboxProps) => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<ComboboxItem | null>(defaultValue || null)

  // Update internal value when defaultValue changes
  React.useEffect(() => {
    setValue(defaultValue || null)
  }, [defaultValue])

  return (
    <ComboboxContext.Provider value={{ open, setOpen, value, setValue, items }}>
      {children}
    </ComboboxContext.Provider>
  )
}

const ComboboxTrigger = ({ render, children }: ComboboxTriggerProps) => {
  const context = React.useContext(ComboboxContext)
  if (!context) throw new Error("ComboboxTrigger must be used within Combobox")

  return (
    <Popover open={context.open} onOpenChange={context.setOpen}>
      <PopoverTrigger asChild>
        {render({ open: context.open })}
      </PopoverTrigger>
      {children}
    </Popover>
  )
}

const ComboboxContent = ({ children }: ComboboxContentProps) => {
  return <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">{children}</PopoverContent>
}

const ComboboxInput = ({ placeholder, showTrigger = true, showClear = false }: ComboboxInputProps) => {
  const context = React.useContext(ComboboxContext)
  if (!context) throw new Error("ComboboxInput must be used within Combobox")

  const handleClear = () => {
    context.setValue(null)
  }

  if (showTrigger) {
    return (
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={context.open}
        className="w-full justify-between"
      >
        <span className="truncate">
          {context.value ? context.value.label : placeholder || "Select..."}
        </span>
        <div className="flex items-center gap-1">
          {showClear && context.value && (
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
    )
  }

  return (
    <Command>
      <CommandInput placeholder={placeholder || "Search..."} />
    </Command>
  )
}

const ComboboxEmpty = ({ children }: ComboboxEmptyProps) => {
  return <CommandEmpty>{children}</CommandEmpty>
}

const ComboboxList = ({ children }: ComboboxListProps) => {
  const context = React.useContext(ComboboxContext)
  if (!context) throw new Error("ComboboxList must be used within Combobox")

  return (
    <CommandList>
      <CommandGroup>
        {context.items.map((item) => children(item))}
      </CommandGroup>
    </CommandList>
  )
}

const ComboboxItem = ({ value, children, onSelect }: ComboboxItemProps) => {
  const context = React.useContext(ComboboxContext)
  if (!context) throw new Error("ComboboxItem must be used within Combobox")

  const isSelected = context.value?.value === value.value

  return (
    <CommandItem
      value={value.label}
      onSelect={() => {
        if (onSelect) {
          onSelect(value)
        } else {
          context.setValue(value)
        }
        context.setOpen(false)
      }}
    >
      <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
      {children}
    </CommandItem>
  )
}

const ComboboxValue = ({ children }: ComboboxValueProps) => {
  const context = React.useContext(ComboboxContext)
  if (!context) throw new Error("ComboboxValue must be used within Combobox")

  return <>{context.value ? context.value.label : children}</>
}

export {
  Combobox,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxInput,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  ComboboxValue,
}