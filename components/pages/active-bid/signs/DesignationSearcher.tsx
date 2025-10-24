import { Button } from '@/components/ui/button';
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, Command } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { PrimarySign, SecondarySign, SignDesignation } from '@/types/MPTEquipment';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from "lucide-react";

type FlatRow =
  | { kind: 'designation'; designation: string; description: string; variantsCount: number }
  | { kind: 'variant'; designation: string; width: number; height: number; sheeting: string; description: string };

interface Props {
  localSign: PrimarySign | SecondarySign;
  setLocalSign: Dispatch<SetStateAction<PrimarySign | SecondarySign | undefined>>;
  onDesignationSelected?: (updatedSign: PrimarySign | SecondarySign) => void;
  designationData: any[];
  loading: boolean;
}

const DesignationSearcher = ({ localSign, setLocalSign, onDesignationSelected, designationData, loading }: Props) => {
  const [open, setOpen] = useState(false);
  const [filteredDesignations, setFilteredDesignations] = useState<SignDesignation[]>([]);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (designationData) {
      setFilteredDesignations(designationData)
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const filterDesignations = useCallback((searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setFilteredDesignations(designationData);
      return;
    }
    const q = searchTerm.toLowerCase();
    setFilteredDesignations(designationData.filter(d =>
      d.designation.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
    ));
  }, [designationData]);

  const flatRows = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    for (const d of filteredDesignations) {
      rows.push({
        kind: 'designation',
        designation: d.designation,
        description: d.description,
        variantsCount: d.variants.length
      });

      const uniqueDims = new Map<string, { width: number; height: number }>();
      for (const v of d.variants) {
        const key = `${v.width}x${v.height}`;
        if (!uniqueDims.has(key)) uniqueDims.set(key, { width: v.width, height: v.height });
      }

      for (const { width, height } of uniqueDims.values()) {
        rows.push({
          kind: 'variant',
          designation: d.designation,
          width,
          height,
          sheeting: '',
          description: d.description,
        });
      }
    }
    return rows;
  }, [filteredDesignations]);

  const handleSelectFromFlat = useCallback((row: FlatRow) => {
    const d = designationData.find(x => x.designation === row.designation);
    if (row.kind === 'designation') {
      if (!d) return;

      if (d.variants.length === 1) {
        const v = d.variants[0];
        const updated = {
          ...localSign,
          designation: d.designation,
          width: v.width,
          height: v.height,
          sheeting: 'HI' as any,
          description: d.description,
          quantity: 1,
          variants: d.variants
        };
        setLocalSign(updated);
        onDesignationSelected?.(updated);
        setOpen(false);
      } else {
        const updated = {
          ...localSign,
          designation: d.designation,
          description: d.description,
          variants: d.variants,
        };
        setLocalSign(updated);
        onDesignationSelected?.(updated);
      }
    } else {
      const updated = {
        ...localSign,
        designation: row.designation,
        width: row.width,
        height: row.height,
        sheeting: row.sheeting as any,
        description: row.description,
        variants: d.variants,
      } as any

      setLocalSign(updated);
      onDesignationSelected?.(updated);
      setOpen(false);
    }
  }, [designationData, localSign, onDesignationSelected]);

  const rowVirtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) =>
      flatRows[index].kind === 'designation' ? 48 : 30,
  });

  const handleDebouncedFilter = useCallback((value: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      filterDesignations(value);
    }, 400);
  }, [filterDesignations]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        rowVirtualizer.measure();
      }, 50);
    }
  }, [open, rowVirtualizer]);

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setFilteredDesignations(designationData);
      }
    }}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full sm:w-[300px] justify-between">
          <span className="truncate">{localSign.designation || "Select designation..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent id="designation-popover-description"
        className="w-[320px] p-0" align="start">
        {
          loading ?
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              <span>Loading...</span>
            </div>
            :
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search designation..."
                value={searchValue}
                onValueChange={(value) => {
                  setSearchValue(value);
                  handleDebouncedFilter(value);
                }}
              />
              <CommandEmpty>No designation found.</CommandEmpty>

              <div ref={parentRef} style={{ height: 340, overflow: 'auto', position: 'relative' }}>
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                  {rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const row = flatRows[virtualRow.index];
                    if (!row) return null;
                    return (
                      <div
                        key={virtualRow.index}
                        style={{
                          position: 'absolute',
                          top: virtualRow.start,
                          left: 0,
                          width: '100%',
                          paddingRight: 8,
                          boxSizing: 'border-box'
                        }}
                      >
                        {row.kind === 'designation' ? (
                          <CommandItem
                            value={row.designation}
                            onSelect={() => handleSelectFromFlat(row)}
                          >
                            <div className="flex items-center w-full">
                              <Check className={cn("mr-2 h-4 w-4", localSign.designation === row.designation ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col">
                                <span className="font-medium">{row.designation}</span>
                                {row.description && <span className="text-muted-foreground text-xs truncate max-w-[250px]">{row.description}</span>}
                              </div>
                            </div>
                          </CommandItem>
                        ) : (
                          <CommandItem
                            className="py-1 my-0 px-2"
                            value={`${row.designation}-${row.width}x${row.height}`}
                            onSelect={() => handleSelectFromFlat(row)}
                          >
                            <div className="flex items-center w-full pl-6">
                              <Check className={cn("mr-2 h-4 w-4", localSign.designation === row.designation && localSign.width === row.width && localSign.height === row.height ? "opacity-100" : "opacity-0")} />
                              <span className="text-sm">{row.width}” x {row.height}”</span>
                            </div>
                          </CommandItem>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Command>
        }
      </PopoverContent>
    </Popover>
  );
};

export default DesignationSearcher;
