"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowDownUp,
  Filter,
  X,
  Check,
  ChevronsUpDown,
  CalendarDays,
  SlidersHorizontal,
  FileText,
  Building,
  User,
  MapPin,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

export type SortOption = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

export type FilterOption = {
  label: string;
  field: string;
  options: { label: string; value: string }[];
};

interface TableControlsProps {
  onFilterChange?: (filters: any) => void;
  onReset?: () => void;
  filterOptions?: FilterOption[];
  activeFilters?: any;
  className?: string;
  setShowFilters?: (show: boolean) => void
  showFilters?: boolean
}

export function TableControls({
  onFilterChange,
  onReset,
  filterOptions = [],
  activeFilters = {},
  className,
  showFilters,
  setShowFilters
}: TableControlsProps) {

  // Check if any filters are active
  const hasActiveFilters = activeFilters && Object.keys(activeFilters).length > 0;

  return (
    <div className={cn("flex flex-col w-full", className)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1"
            onClick={() => setShowFilters ? setShowFilters(!showFilters) : console.log('Set show filters not set')}
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            {Object.keys(activeFilters).length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                {Object.keys(activeFilters).length}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Separate component for filter dropdowns
export function FilterDropdowns({
  showFilters,
  filterOptions = [],
  onFilterChange,
  activeFilters = {},
  className
}: {
  showFilters: boolean;
  filterOptions?: FilterOption[];
  onFilterChange?: (filters: Record<string, any>) => void;
  activeFilters?: Record<string, any>;
  className?: string;
}) {
  // State for filter values - dynamically created based on filterOptions
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [dateField, setDateField] = useState<string>(activeFilters?.dateField?.[0] || "none");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    activeFilters?.dateFrom ? new Date(activeFilters.dateFrom[0]) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    activeFilters?.dateTo ? new Date(activeFilters.dateTo[0]) : undefined
  );

  // Initialize filter values from activeFilters
  useEffect(() => {
    const newFilterValues: Record<string, string> = {};
    filterOptions.forEach(option => {
      newFilterValues[option.field] = activeFilters?.[option.field]?.[0] || "all";
    });
    setFilterValues(newFilterValues);
    
    setDateField(activeFilters?.dateField?.[0] || "none");
    setDateFrom(activeFilters?.dateFrom ? new Date(activeFilters.dateFrom[0]) : undefined);
    setDateTo(activeFilters?.dateTo ? new Date(activeFilters.dateTo[0]) : undefined);
  }, [activeFilters, filterOptions]);

  // Apply filters function
  const applyFilters = useCallback(() => {
    if (!onFilterChange) return;
    
    const filters: Record<string, any> = { ...activeFilters };
    
    // Apply each filter option
    filterOptions.forEach(option => {
      const value = filterValues[option.field];
      if (value && value !== "all") {
        filters[option.field] = [value];
      } else {
        delete filters[option.field];
      }
    });
    
    // Update or remove date filters
    if (dateField && dateField !== "none") {
      filters.dateField = [dateField];
      if (dateFrom) filters.dateFrom = [dateFrom.toISOString().split('T')[0]];
      if (dateTo) filters.dateTo = [dateTo.toISOString().split('T')[0]];
    } else {
      delete filters.dateField;
      delete filters.dateFrom;
      delete filters.dateTo;
    }
    
    console.log('Applying filters:', filters);
    onFilterChange(filters);
  }, [filterValues, dateField, dateFrom, dateTo, onFilterChange, activeFilters, filterOptions]);

  // Update individual filter value
  const updateFilterValue = useCallback((field: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Simple pluralization function
  const pluralize = (word: string): string => {
    const lastChar = word.toLowerCase().slice(-1);
    const vowels = ['a', 'e', 'i', 'o', 'u', 'r'];
    return vowels.includes(lastChar) ? `${word}s` : `${word}es`;
  };

  if (!showFilters) return null;

  return (
    <div className={cn("flex flex-wrap justify-end gap-2 mb-4", className)}>
      {/* Dynamic Filter Options */}
      {filterOptions.map((option) => (
        <div key={option.field} className="w-40 sm:w-44">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between h-9 truncate">
                {filterValues[option.field] && filterValues[option.field] !== "all" 
                  ? option.options.find(opt => opt.value === filterValues[option.field])?.label || `All ${pluralize(option.label)}`
                  : `All ${pluralize(option.label)}`}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-0">
              <Command>
                <CommandInput placeholder={`Search ${pluralize(option.label.toLowerCase())}...`} />
                <CommandEmpty>No {option.label.toLowerCase()} found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  <CommandItem
                    key="all"
                    value="all"
                    onSelect={() => {
                      updateFilterValue(option.field, "all");
                      console.log(`${option.label} selected: all`);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filterValues[option.field] === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All {pluralize(option.label)}
                  </CommandItem>
                  {option.options.map((optionItem) => (
                    <CommandItem
                      key={optionItem.value}
                      value={optionItem.label}
                      onSelect={() => {
                        updateFilterValue(option.field, optionItem.value);
                        console.log(`${option.label} selected:`, optionItem.value);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filterValues[option.field] === optionItem.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {optionItem.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <div className="p-2 border-t">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      console.log(`Apply ${option.label} Filter clicked`);
                      applyFilters();
                    }}
                  >
                    Apply Filter
                  </Button>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      ))}

      {/* Date Field Filter - Only show Created At for sign orders */}
      <div className="w-40 sm:w-44">
        <Select value={dateField || "none"} onValueChange={setDateField}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="No Date Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Date Filter</SelectItem>
            <SelectItem value="created_at">Created At</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filters - Only shown if a date field is selected */}
      {dateField && dateField !== "none" && (
        <>
          {/* From Date */}
          <div className="w-40 sm:w-44">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : <span>From Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
                <div className="p-2 border-t">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      console.log('Apply Date From Filter clicked');
                      applyFilters();
                    }}
                  >
                    Apply Filter
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="w-40 sm:w-44">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : <span>To Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
                <div className="p-2 border-t">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      console.log('Apply Date To Filter clicked');
                      applyFilters();
                    }}
                  >
                    Apply Filter
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

      {/* Clear Filters Button - Only show if there are any active filters */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="w-30 sm:w-20">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1 border-none text-grey hover:bg-[#f5f5f5]"
            onClick={() => {
              // Reset all local state
              const resetValues: Record<string, string> = {};
              filterOptions.forEach(option => {
                resetValues[option.field] = "all";
              });
              setFilterValues(resetValues);
              setDateField("none");
              setDateFrom(undefined);
              setDateTo(undefined);

              // Create empty filters object to clear all filters
              const emptyFilters: Record<string, any> = {};
              
              // Apply the empty filters
              if (onFilterChange) {
                console.log('Clearing all filters');
                onFilterChange(emptyFilters);
              }
            }}
          >
            <span>Clear All</span>
          </Button>
        </div>
      )}
    </div>
  );
}