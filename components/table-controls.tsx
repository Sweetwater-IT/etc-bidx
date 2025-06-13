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
  // onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  onFilterChange?: (filters: any) => void;
  onReset?: () => void;
  // sortOptions: SortOption[];
  filterOptions?: FilterOption[];
  branchOptions?: { label: string; value: string }[];
  ownerOptions?: { label: string; value: string }[];
  countyOptions?: { label: string; value: string }[];
  estimatorOptions?: { label: string; value: string }[];
  // activeSort?: { field: string; direction: 'asc' | 'desc' };
  activeFilters?: any;
  className?: string;
  setShowFilters?: (show: boolean) => void
  showFilters?: boolean
}

export function TableControls({
  // onSortChange,
  onFilterChange,
  onReset,
  // sortOptions,
  // activeSort,
  activeFilters = {},
  className,
  showFilters,
  setShowFilters
}: Omit<TableControlsProps, 'filterOptions' | 'branchOptions' | 'ownerOptions' | 'countyOptions' | 'estimatorOptions'>) {

  // State for filter values
  const [branch, setBranch] = useState<string>(activeFilters?.branch?.[0] || "all");
  const [owner, setOwner] = useState<string>(activeFilters?.owner?.[0] || "all");
  const [county, setCounty] = useState<string>(activeFilters?.county?.[0] || "all");
  const [estimator, setEstimator] = useState<string>(activeFilters?.estimator?.[0] || "all");
  const [dateField, setDateField] = useState<string>(activeFilters?.dateField?.[0] || "none");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    activeFilters?.dateFrom ? new Date(activeFilters.dateFrom[0]) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    activeFilters?.dateTo ? new Date(activeFilters.dateTo[0]) : undefined
  );

  // Update filter states when activeFilters change
  useEffect(() => {
    setBranch(activeFilters?.branch?.[0] || "all");
    setOwner(activeFilters?.owner?.[0] || "all");
    setCounty(activeFilters?.county?.[0] || "all");
    setEstimator(activeFilters?.estimator?.[0] || "all");
    setDateField(activeFilters?.dateField?.[0] || "none");
    setDateFrom(activeFilters?.dateFrom ? new Date(activeFilters.dateFrom[0]) : undefined);
    setDateTo(activeFilters?.dateTo ? new Date(activeFilters.dateTo[0]) : undefined);
  }, [activeFilters]);

  // Apply filters function
  const applyFilters = useCallback(() => {
    if (!onFilterChange) return;
    
    // Start with a copy of the current activeFilters to preserve any filters not managed by this component
    const filters: Record<string, any> = { ...activeFilters };
    
    // Update or remove branch filter
    if (branch && branch !== "all") {
      filters.branch = [branch];
    } else {
      delete filters.branch;
    }
    
    // Update or remove owner filter
    if (owner && owner !== "all") {
      filters.owner = [owner];
    } else {
      delete filters.owner;
    }
    
    // Update or remove county filter
    if (county && county !== "all") {
      filters.county = [county];
    } else {
      delete filters.county;
    }
    
    // Update or remove estimator filter
    if (estimator && estimator !== "all") {
      filters.estimator = [estimator];
    } else {
      delete filters.estimator;
    }
    
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
    
    // Log the filters being applied
    console.log('Applying filters:', filters);
    
    // Apply the combined filters
    onFilterChange(filters);
  }, [branch, owner, county, estimator, dateField, dateFrom, dateTo, onFilterChange, activeFilters]);

  // Reset filters function
  const resetFilters = () => {
    setBranch("all");
    setOwner("all");
    setCounty("all");
    setEstimator("all");
    setDateField("none");
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
  // const hasActiveSort = !!activeSort;
  const hasActiveControls = hasActiveFilters;

  // Force re-render when activeFilters changes
  useEffect(() => {
    console.log('Active filters changed:', activeFilters);
  }, [activeFilters]);

  return (
    <div className={cn("flex flex-col w-full", className)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {/* Reset Button - Only shown when filters or sorts are active
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
          )} */}

          {/* Sort Dropdown */}
          {/* <DropdownMenu>
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
          </DropdownMenu> */}

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
  branchOptions = [],
  ownerOptions = [],
  countyOptions = [],
  estimatorOptions = [],
  contractorOptions = [],
  projectStatusOptions = [],
  billingStatusOptions = [],
  onFilterChange,
  activeFilters = {},
  className
}: {
  showFilters: boolean;
  branchOptions?: { label: string; value: string }[];
  ownerOptions?: { label: string; value: string }[];
  countyOptions?: { label: string; value: string }[];
  estimatorOptions?: { label: string; value: string }[];
  contractorOptions?: { label: string; value: string }[];
  projectStatusOptions?: { label: string; value: string }[];
  billingStatusOptions?: { label: string; value: string }[];
  onFilterChange?: (filters: Record<string, any>) => void;
  activeFilters?: Record<string, any>;
  className?: string;
}) {
  // State for filter values
  const [branch, setBranch] = useState<string>(activeFilters?.branch?.[0] || "all");
  const [owner, setOwner] = useState<string>(activeFilters?.owner?.[0] || "all");
  const [county, setCounty] = useState<string>(activeFilters?.county?.[0] || "all");
  const [estimator, setEstimator] = useState<string>(activeFilters?.estimator?.[0] || "all");
  const [contractor, setContractor] = useState<string>(activeFilters?.contractor?.[0] || "all");
  const [projectStatus, setProjectStatus] = useState<string>(activeFilters?.projectStatus?.[0] || "all");
  const [billingStatus, setBillingStatus] = useState<string>(activeFilters?.billingStatus?.[0] || "all");
  const [dateField, setDateField] = useState<string>(activeFilters?.dateField?.[0] || "none");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    activeFilters?.dateFrom ? new Date(activeFilters.dateFrom[0]) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    activeFilters?.dateTo ? new Date(activeFilters.dateTo[0]) : undefined
  );

  // Update filter states when activeFilters change
  useEffect(() => {
    setBranch(activeFilters?.branch?.[0] || "all");
    setOwner(activeFilters?.owner?.[0] || "all");
    setCounty(activeFilters?.county?.[0] || "all");
    setEstimator(activeFilters?.estimator?.[0] || "all");
    setContractor(activeFilters?.contractor?.[0] || "all");
    setProjectStatus(activeFilters?.projectStatus?.[0] || "all");
    setBillingStatus(activeFilters?.billingStatus?.[0] || "all");
    setDateField(activeFilters?.dateField?.[0] || "none");
    setDateFrom(activeFilters?.dateFrom ? new Date(activeFilters.dateFrom[0]) : undefined);
    setDateTo(activeFilters?.dateTo ? new Date(activeFilters.dateTo[0]) : undefined);
  }, [activeFilters]);

  // Apply filters function
  const applyFilters = useCallback(() => {
    if (!onFilterChange) return;
    
    // Start with a copy of the current activeFilters to preserve any filters not managed by this component
    const filters: Record<string, any> = { ...activeFilters };
    
    // Update or remove branch filter
    if (branch && branch !== "all") {
      filters.branch = [branch];
    } else {
      delete filters.branch;
    }
    
    // Update or remove owner filter
    if (owner && owner !== "all") {
      filters.owner = [owner];
    } else {
      delete filters.owner;
    }
    
    // Update or remove county filter
    if (county && county !== "all") {
      filters.county = [county];
    } else {
      delete filters.county;
    }
    
    // Update or remove estimator filter
    if (estimator && estimator !== "all") {
      filters.estimator = [estimator];
    } else {
      delete filters.estimator;
    }

    // Update or remove contractor filter
    if (contractor && contractor !== "all") {
      filters.contractor = [contractor];
    } else {
      delete filters.contractor;
    }

    // Update or remove project status filter
    if (projectStatus && projectStatus !== "all") {
      filters.projectStatus = [projectStatus];
    } else {
      delete filters.projectStatus;
    }

    // Update or remove billing status filter
    if (billingStatus && billingStatus !== "all") {
      filters.billingStatus = [billingStatus];
    } else {
      delete filters.billingStatus;
    }
    
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
    
    // Log the filters being applied
    console.log('Applying filters:', filters);
    
    // Apply the combined filters
    onFilterChange(filters);
  }, [branch, owner, county, estimator, contractor, projectStatus, billingStatus, dateField, dateFrom, dateTo, onFilterChange, activeFilters]);

  // Log filter values for debugging
  useEffect(() => {
    console.log('Current filter values:', { branch, owner, county, estimator, contractor, projectStatus, billingStatus, dateField, dateFrom, dateTo });
    console.log('Current activeFilters:', activeFilters);
  }, [branch, owner, county, estimator, contractor, projectStatus, billingStatus, dateField, dateFrom, dateTo, activeFilters]);

  if (!showFilters) return null;

  return (
    <div className={cn("flex flex-wrap justify-end gap-2 mb-4", className)}>
      {/* Branch Filter */}
      {branchOptions && branchOptions.length > 0 && (
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
                <div className="p-2 border-t">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      console.log('Apply Branch Filter clicked');
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
      )}

      {/* Owner Filter */}
      {ownerOptions && ownerOptions.length > 0 && (
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
                <div className="p-2 border-t">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      console.log('Apply Owner Filter clicked');
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
      )}

      {/* County Filter */}
      {countyOptions && countyOptions.length > 0 && (
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
                <div className="p-2 border-t">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      console.log('Apply County Filter clicked');
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
      )}

      {/* Estimator Filter */}
      {estimatorOptions && estimatorOptions.length > 0 && (
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
                <div className="p-2 border-t">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      console.log('Apply Estimator Filter clicked');
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
      )}

      {/* Contractor Filter */}
      {contractorOptions && contractorOptions.length > 0 && (
        <div className="w-40 sm:w-44">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between h-9">
                {contractor ? contractorOptions.find(opt => opt.value === contractor)?.label || "All Contractors" : "All Contractors"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-0">
              <Command>
                <CommandInput placeholder="Search contractors..." />
                <CommandEmpty>No contractor found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  <CommandItem
                    key="all"
                    value="all"
                    onSelect={() => {
                      setContractor("all");
                      console.log('Contractor selected: all');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        contractor === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Contractors
                  </CommandItem>
                  {contractorOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        setContractor(option.value);
                        console.log('Contractor selected:', option.value);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          contractor === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <div className="p-2 border-t">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      console.log('Apply Contractor Filter clicked');
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
      )}

      {/* Project Status Filter */}
      {projectStatusOptions && projectStatusOptions.length > 0 && (
        <div className="w-40 sm:w-44">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between h-9">
                {projectStatus ? projectStatusOptions.find(opt => opt.value === projectStatus)?.label || "All Project Statuses" : "All Project Statuses"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-0">
              <Command>
                <CommandInput placeholder="Search project statuses..." />
                <CommandEmpty>No project status found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  <CommandItem
                    key="all"
                    value="all"
                    onSelect={() => {
                      setProjectStatus("all");
                      console.log('Project Status selected: all');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        projectStatus === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Project Statuses
                  </CommandItem>
                  {projectStatusOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        setProjectStatus(option.value);
                        console.log('Project Status selected:', option.value);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          projectStatus === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <div className="p-2 border-t">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      console.log('Apply Project Status Filter clicked');
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
      )}

      {/* Billing Status Filter */}
      {billingStatusOptions && billingStatusOptions.length > 0 && (
        <div className="w-40 sm:w-44">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between h-9">
                {billingStatus ? billingStatusOptions.find(opt => opt.value === billingStatus)?.label || "All Billing Statuses" : "All Billing Statuses"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-0">
              <Command>
                <CommandInput placeholder="Search billing statuses..." />
                <CommandEmpty>No billing status found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  <CommandItem
                    key="all"
                    value="all"
                    onSelect={() => {
                      setBillingStatus("all");
                      console.log('Billing Status selected: all');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        billingStatus === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Billing Statuses
                  </CommandItem>
                  {billingStatusOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        setBillingStatus(option.value);
                        console.log('Billing Status selected:', option.value);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          billingStatus === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <div className="p-2 border-t">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      console.log('Apply Billing Status Filter clicked');
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
      )}

      {/* Date Field Filter - Always show this as it's a special case */}
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
              setBranch("all");
              setOwner("all");
              setCounty("all");
              setEstimator("all");
              setContractor("all");
              setProjectStatus("all");
              setBillingStatus("all");
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
