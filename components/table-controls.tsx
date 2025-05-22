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
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  onFilterChange?: (filters: any) => void;
  onReset?: () => void;
  sortOptions: SortOption[];
  filterOptions?: FilterOption[];
  branchOptions?: { label: string; value: string }[];
  ownerOptions?: { label: string; value: string }[];
  countyOptions?: { label: string; value: string }[];
  estimatorOptions?: { label: string; value: string }[];
  activeSort?: { field: string; direction: 'asc' | 'desc' };
  activeFilters?: any;
  className?: string;
}

export function TableControls({
  onSortChange,
  onFilterChange,
  onReset,
  sortOptions,
  activeSort,
  activeFilters = {},
  className,
  showFilters,
  setShowFilters
}: Omit<TableControlsProps, 'filterOptions' | 'branchOptions' | 'ownerOptions' | 'countyOptions' | 'estimatorOptions'> & {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}) {
  
  // State for filter values
  const [branch, setBranch] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  const [county, setCounty] = useState<string>("");
  const [estimator, setEstimator] = useState<string>("");
  const [dateField, setDateField] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Initialize filter values from activeFilters
  useEffect(() => {
    if (activeFilters.branch && activeFilters.branch.length > 0) {
      setBranch(activeFilters.branch[0]);
    }
    if (activeFilters.owner && activeFilters.owner.length > 0) {
      setOwner(activeFilters.owner[0]);
    }
    if (activeFilters.county && activeFilters.county.length > 0) {
      setCounty(activeFilters.county[0]);
    }
    if (activeFilters.estimator && activeFilters.estimator.length > 0) {
      setEstimator(activeFilters.estimator[0]);
    }
    if (activeFilters.dateField && activeFilters.dateField.length > 0) {
      setDateField(activeFilters.dateField[0]);
    }
    if (activeFilters.dateFrom && activeFilters.dateFrom.length > 0) {
      setDateFrom(new Date(activeFilters.dateFrom[0]));
    }
    if (activeFilters.dateTo && activeFilters.dateTo.length > 0) {
      setDateTo(new Date(activeFilters.dateTo[0]));
    }
  }, [activeFilters]);
  
  // Apply filters function
  const applyFilters = () => {
    const filters: Record<string, string[]> = {};
    
    // Only add filters for values that aren't the 'all' placeholder
    if (branch && branch !== 'all') filters.branch = [branch];
    if (owner && owner !== 'all') filters.owner = [owner];
    if (county && county !== 'all') filters.county = [county];
    if (estimator && estimator !== 'all') filters.estimator = [estimator];
    
    // Only add date filters if a date field is selected and it's not 'none'
    if (dateField && dateField !== 'none' && (dateFrom || dateTo)) {
      filters.dateField = [dateField];
      if (dateFrom) filters.dateFrom = [dateFrom.toISOString()];
      if (dateTo) filters.dateTo = [dateTo.toISOString()];
    }
    
    if (onFilterChange) {
      onFilterChange(filters);
    }
  };
  
  // Reset filters function
  const resetFilters = () => {
    setBranch("");
    setOwner("");
    setCounty("");
    setEstimator("");
    setDateField("");
    setDateFrom(undefined);
    setDateTo(undefined);
    
    if (onReset) {
      onReset();
    }
  };
  
  const getIconForField = (field: string) => {
    switch (field) {
      case 'contractNumber':
        return <FileText className="mr-2 h-4 w-4" />;
      case 'lettingDate':
      case 'dueDate':
        return <CalendarDays className="mr-2 h-4 w-4" />;
      case 'owner':
        return <Building className="mr-2 h-4 w-4" />;
      case 'requestor':
        return <User className="mr-2 h-4 w-4" />;
      case 'county':
        return <MapPin className="mr-2 h-4 w-4" />;
      default:
        return null;
    }
  };

  // Check if any filters or sorts are active
  const hasActiveFilters = activeFilters && Object.keys(activeFilters).length > 0;
  const hasActiveSort = !!activeSort;
  const hasActiveControls = hasActiveFilters || hasActiveSort;
  
  return (
    <div className={cn("flex flex-col w-full", className)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {/* Reset Button - Only shown when filters or sorts are active */}
          {hasActiveControls && onReset && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={resetFilters}
            >
              <X className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          )}
          
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <ArrowDownUp className="h-4 w-4" />
                <span>Sort</span>
                {activeSort && (
                  <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    1
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    className="flex justify-between"
                    onClick={() => onSortChange(
                      option.value, 
                      activeSort?.field === option.value && activeSort?.direction === 'asc' 
                        ? 'desc' 
                        : 'asc'
                    )}
                  >
                    <span className="flex items-center">
                      {option.icon || getIconForField(option.value)}
                      {option.label}
                    </span>
                    {activeSort?.field === option.value && (
                      activeSort.direction === 'asc' 
                        ? <ArrowUpAZ className="h-4 w-4 ml-2" /> 
                        : <ArrowDownAZ className="h-4 w-4 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            {hasActiveFilters && (
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
  branchOptions = [],
  ownerOptions = [],
  countyOptions = [],
  estimatorOptions = [],
  onFilterChange,
  activeFilters = {},
  className
}: {
  showFilters: boolean;
  branchOptions?: { label: string; value: string }[];
  ownerOptions?: { label: string; value: string }[];
  countyOptions?: { label: string; value: string }[];
  estimatorOptions?: { label: string; value: string }[];
  onFilterChange?: (filters: Record<string, any>) => void;
  activeFilters?: Record<string, any>;
  className?: string;
}) {
  // State for filter values
  const [branch, setBranch] = useState<string>(activeFilters.branch || "");
  const [owner, setOwner] = useState<string>(activeFilters.owner || "");
  const [county, setCounty] = useState<string>(activeFilters.county || "");
  const [estimator, setEstimator] = useState<string>(activeFilters.estimator || "");
  const [dateField, setDateField] = useState<string>(activeFilters.dateField || "");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    activeFilters.dateFrom ? new Date(activeFilters.dateFrom) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    activeFilters.dateTo ? new Date(activeFilters.dateTo) : undefined
  );
  
  // Update filter states when activeFilters change
  useEffect(() => {
    setBranch(activeFilters.branch || "");
    setOwner(activeFilters.owner || "");
    setCounty(activeFilters.county || "");
    setEstimator(activeFilters.estimator || "");
    setDateField(activeFilters.dateField || "");
    setDateFrom(activeFilters.dateFrom ? new Date(activeFilters.dateFrom) : undefined);
    setDateTo(activeFilters.dateTo ? new Date(activeFilters.dateTo) : undefined);
  }, [activeFilters]);
  
  // Log filter values for debugging
  useEffect(() => {
    console.log('Current filter values:', { branch, owner, county, estimator, dateField, dateFrom, dateTo });
    console.log('Current activeFilters:', activeFilters);
  }, [branch, owner, county, estimator, dateField, dateFrom, dateTo, activeFilters]);

  // Apply filters function
  const applyFilters = useCallback(() => {
    if (!onFilterChange) return;
    
    // Start with a copy of the current activeFilters to preserve any filters not managed by this component
    const filters: Record<string, any> = { ...activeFilters };
    
    // Update or remove branch filter
    if (branch && branch !== "all") {
      filters.branch = branch;
    } else {
      delete filters.branch;
    }
    
    // Update or remove owner filter
    if (owner && owner !== "all") {
      filters.owner = owner;
    } else {
      delete filters.owner;
    }
    
    // Update or remove county filter
    if (county && county !== "all") {
      filters.county = county;
    } else {
      delete filters.county;
    }
    
    // Update or remove estimator filter
    if (estimator && estimator !== "all") {
      filters.estimator = estimator;
    } else {
      delete filters.estimator;
    }
    
    // Update or remove date filters
    if (dateField && dateField !== "none") {
      filters.dateField = dateField;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
    } else {
      delete filters.dateField;
      delete filters.dateFrom;
      delete filters.dateTo;
    }
    
    // Apply the combined filters
    onFilterChange(filters);
  }, [branch, owner, county, estimator, dateField, dateFrom, dateTo, onFilterChange, activeFilters]);
  
  if (!showFilters) return null;
  
  return (
    <div className={cn("flex flex-wrap justify-end gap-2 mb-4", className)}>
      {/* Branch Filter */}
      <div className="w-40 sm:w-44">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox" 
              className="w-full justify-between h-9">
              {branch ? branchOptions.find(opt => opt.value === branch)?.label || "All Branches" : "All Branches"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-0">
            <Command>
              <CommandInput placeholder="Search branches..." />
              <CommandEmpty>No branch found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                <CommandItem
                  key="all"
                  value="all"
                  onSelect={() => {
                    setBranch("all");
                    console.log('Branch selected: all');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      branch === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Branches
                </CommandItem>
                {branchOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      setBranch(option.value);
                      console.log('Branch selected:', option.value);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        branch === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Owner Filter */}
      <div className="w-40 sm:w-44">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox" 
              className="w-full justify-between h-9">
              {owner ? ownerOptions.find(opt => opt.value === owner)?.label || "All Owners" : "All Owners"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-0">
            <Command>
              <CommandInput placeholder="Search owners..." />
              <CommandEmpty>No owner found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                <CommandItem
                  key="all"
                  value="all"
                  onSelect={() => {
                    setOwner("all");
                    console.log('Owner selected: all');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      owner === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Owners
                </CommandItem>
                {ownerOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      setOwner(option.value);
                      console.log('Owner selected:', option.value);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        owner === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* County Filter */}
      <div className="w-40 sm:w-44">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox" 
              className="w-full justify-between h-9">
              {county ? countyOptions.find(opt => opt.value === county)?.label || "All Counties" : "All Counties"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-0">
            <Command>
              <CommandInput placeholder="Search counties..." />
              <CommandEmpty>No county found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                <CommandItem
                  key="all"
                  value="all"
                  onSelect={() => {
                    setCounty("all");
                    console.log('County selected: all');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      county === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Counties
                </CommandItem>
                {countyOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      setCounty(option.value);
                      console.log('County selected:', option.value);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        county === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Estimator Filter */}
      <div className="w-40 sm:w-44">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox" 
              className="w-full justify-between h-9">
              {estimator ? estimatorOptions.find(opt => opt.value === estimator)?.label || "All Estimators" : "All Estimators"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-0">
            <Command>
              <CommandInput placeholder="Search estimators..." />
              <CommandEmpty>No estimator found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                <CommandItem
                  key="all"
                  value="all"
                  onSelect={() => {
                    setEstimator("all");
                    console.log('Estimator selected: all');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      estimator === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Estimators
                </CommandItem>
                {estimatorOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      setEstimator(option.value);
                      console.log('Estimator selected:', option.value);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        estimator === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Date Field Filter */}
      <div className="w-40 sm:w-44">
        <Select value={dateField || "none"} onValueChange={setDateField}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="No Date Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Date Filter</SelectItem>
            <SelectItem value="lettingDate">Letting Date</SelectItem>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="createdAt">Created At</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Date Range Filters - Only shown if a date field is selected */}
      {dateField && dateField !== 'none' && (
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
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}
      
      {/* Apply Filters Button */}
      <div className="w-40 sm:w-44">
        <Button 
          variant="default" 
          className="h-9 w-full"
          onClick={() => {
            console.log('Apply Filters clicked');
            console.log('Applying filters:', { branch, owner, county, estimator, dateField, dateFrom, dateTo });
            applyFilters();
          }}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
