"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format, addDays } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

type Branch = 'WEST' | 'Turbotville' | 'Hatfield';
type Owner = 'PENNDOT' | 'TURNPIKE' | 'PRIVATE' | 'SEPTA';

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchOptions: { label: string; value: string }[];
  ownerOptions: { label: string; value: string }[];
  countyOptions: { label: string; value: string }[];
  estimatorOptions: { label: string; value: string }[];
  initialFilters?: any;
  onApplyFilters: (filters: any) => void;
  onResetFilters: () => void;
}

export function FilterDialog({
  open,
  onOpenChange,
  branchOptions,
  ownerOptions,
  countyOptions,
  estimatorOptions,
  initialFilters = {},
  onApplyFilters,
  onResetFilters,
}: FilterDialogProps) {
  // Local state for filters being edited
  const [branch, setBranch] = useState<string | undefined>(initialFilters.branch);
  const [owner, setOwner] = useState<string | undefined>(initialFilters.owner);
  const [county, setCounty] = useState<string | undefined>(initialFilters.county);
  const [estimator, setEstimator] = useState<string | undefined>(initialFilters.estimator);
  const [dateField, setDateField] = useState<string | undefined>(initialFilters.dateField || 'Letting Date');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(initialFilters.dateFrom);
  const [dateTo, setDateTo] = useState<Date | undefined>(initialFilters.dateTo);

  // Update local filters when initialFilters change (e.g., when reset externally)
  useEffect(() => {
    setBranch(initialFilters.branch);
    setOwner(initialFilters.owner);
    setCounty(initialFilters.county);
    setEstimator(initialFilters.estimator);
    setDateField(initialFilters.dateField || 'Letting Date');
    setDateFrom(initialFilters.dateFrom);
    setDateTo(initialFilters.dateTo);
  }, [initialFilters]);

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (branch) count++;
    if (owner) count++;
    if (county) count++;
    if (estimator) count++;
    if (dateFrom || dateTo) count++;
    return count;
  };

  // Handle apply button click
  const handleApply = () => {
    // Structure filters as arrays for each field as required by the API
    const filters = {
      ...(branch ? { branch: [branch] } : {}),
      ...(owner ? { owner: [owner] } : {}),
      ...(county ? { county: [county] } : {}),
      ...(estimator ? { estimator: [estimator] } : {}),
      // Date filters are handled separately
      ...(dateField && (dateFrom || dateTo) ? { dateField: [dateField] } : {}),
      ...(dateFrom ? { dateFrom: [dateFrom.toISOString()] } : {}),
      ...(dateTo ? { dateTo: [dateTo.toISOString()] } : {}),
    };
    console.log('Applying filters:', filters);
    onApplyFilters(filters);
    onOpenChange(false);
  };

  // Handle reset button click
  const handleReset = () => {
    setBranch(undefined);
    setOwner(undefined);
    setCounty(undefined);
    setEstimator(undefined);
    setDateField('Letting Date');
    setDateFrom(undefined);
    setDateTo(undefined);
    onResetFilters();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Options</DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Branch Selection */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Branch</h3>
            <RadioGroup
              value={branch}
              onValueChange={setBranch}
              className="flex flex-wrap gap-2"
            >
              {branchOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`branch-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`branch-${option.value}`}
                    className="flex cursor-pointer rounded-md border border-muted bg-popover px-3 py-2 text-sm font-medium ring-offset-background peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Owner Selection */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Owner</h3>
            <RadioGroup
              value={owner}
              onValueChange={setOwner}
              className="flex flex-wrap gap-2"
            >
              {ownerOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`owner-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`owner-${option.value}`}
                    className="flex cursor-pointer rounded-md border border-muted bg-popover px-3 py-2 text-sm font-medium ring-offset-background peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* County Selection */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">County</h3>
            <Select value={county} onValueChange={setCounty}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <Input
                  placeholder="Search counties..."
                  className="mb-2 sticky top-0 z-10 bg-popover"
                  onChange={(e) => {
                    // This would be implemented with filtering logic
                    // in a real implementation
                  }}
                />
                {countyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimator Selection */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Estimator</h3>
            <Select value={estimator} onValueChange={setEstimator}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select estimator" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <Input
                  placeholder="Search estimators..."
                  className="mb-2 sticky top-0 z-10 bg-popover"
                  onChange={(e) => {
                    // This would be implemented with filtering logic
                    // in a real implementation
                  }}
                />
                {estimatorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Filter by date range</h3>
            <Select value={dateField} onValueChange={setDateField}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select date field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Letting Date">Letting Date</SelectItem>
                <SelectItem value="Due Date">Due Date</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label>From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset filters
          </Button>
          <Button onClick={handleApply}>
            Apply filters ({getActiveFilterCount()})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
