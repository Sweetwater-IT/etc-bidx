"use client";

import { useState } from "react";
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
  ArrowDownAZ, 
  ArrowUpAZ, 
  ArrowDownUp, 
  CalendarDays, 
  Filter, 
  SlidersHorizontal,
  FileText,
  Building,
  User,
  MapPin,
  X
} from "lucide-react";
import { FilterDialog } from "@/components/filter-dialog";
import { cn } from "@/lib/utils";

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
  filterOptions = [],
  branchOptions = [],
  ownerOptions = [],
  countyOptions = [],
  estimatorOptions = [],
  activeSort,
  activeFilters = {},
  className
}: TableControlsProps) {
  // State for filter dialog
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
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
    <div className={cn("flex items-center gap-2", className)}>
      {/* Reset Button - Only shown when filters or sorts are active */}
      {hasActiveControls && onReset && (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={onReset}
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
        onClick={() => setFilterDialogOpen(true)}
      >
        <Filter className="h-4 w-4" />
        <span>Filter</span>
        {hasActiveFilters && (
          <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
            {Object.keys(activeFilters).length}
          </span>
        )}
      </Button>
      
      {/* Filter Dialog */}
      <FilterDialog 
        open={filterDialogOpen} 
        onOpenChange={setFilterDialogOpen}
        branchOptions={branchOptions}
        ownerOptions={ownerOptions}
        countyOptions={countyOptions}
        estimatorOptions={estimatorOptions}
        onApplyFilters={(filters) => {
          if (onFilterChange) {
            onFilterChange(filters);
          }
          setFilterDialogOpen(false);
        }}
        onResetFilters={() => {
          if (onReset) {
            onReset();
          }
          setFilterDialogOpen(false);
        }}
        initialFilters={activeFilters}
      />
    </div>
  );
}
