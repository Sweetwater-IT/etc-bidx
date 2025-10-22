import { Button } from '@/components/ui/button';
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, Command } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { fetchSignDesignations } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { PrimarySign, SecondarySign, SignDesignation } from '@/types/MPTEquipment';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { processSignData } from './process-sign-data';
import { useVirtualizer } from '@tanstack/react-virtual';

type FlatRow =
  | { kind: 'designation'; designation: string; description: string; variantsCount: number }
  | { kind: 'variant'; designation: string; width: number; height: number; sheeting: string; description: string };

interface Props {
  localSign: PrimarySign | SecondarySign;
  setLocalSign: Dispatch<SetStateAction<PrimarySign | SecondarySign | undefined>>;
  onDesignationSelected?: (updatedSign: PrimarySign | SecondarySign) => void;
}

const DesignationSearcher = ({ localSign, setLocalSign, onDesignationSelected }: Props) => {
  const [open, setOpen] = useState(false);
  const [designationData, setDesignationData] = useState<SignDesignation[]>([]);
  const [filteredDesignations, setFilteredDesignations] = useState<SignDesignation[]>([]);
  const parentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadSignData = async () => {
      try {
        const data = await fetchSignDesignations();
        if (data && Array.isArray(data) && data.length > 0) {
          const processedData = await processSignData(data);
          setDesignationData(processedData);
          setFilteredDesignations(processedData);
        } else {
          setDesignationData([]);
          setFilteredDesignations([]);
        }
      } catch (error) {
        console.error("Error fetching sign data:", error);
        setDesignationData([]);
        setFilteredDesignations([]);
      }
    };
    loadSignData();
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
      rows.push({ kind: 'designation', designation: d.designation, description: d.description, variantsCount: d.variants.length });
      if (d.variants && d.variants.length > 1) {
        for (const v of d.variants) {
          rows.push({
            kind: 'variant',
            designation: d.designation,
            width: v.width,
            height: v.height,
            sheeting: v.sheeting,
            description: d.description
          });
        }
      }
    }
    return rows;
  }, [filteredDesignations]);

  const handleSelectFromFlat = useCallback((row: FlatRow) => {
    if (row.kind === 'designation') {
      const d = designationData.find(x => x.designation === row.designation);
      if (!d) return;
      if (d.variants.length === 1) {
        const v = d.variants[0];
        const updated = {
          ...localSign,
          designation: d.designation,
          width: v.width,
          height: v.height,
          sheeting: v.sheeting || 'DG',
          description: d.description
        };
        setLocalSign(updated);
        onDesignationSelected?.(updated);
        setOpen(false);
      } else {
      }
    } else {
      const updated = {
        ...localSign,
        designation: row.designation,
        width: row.width,
        height: row.height,
        sheeting: row.sheeting as any,
        description: row.description
      } as PrimarySign | SecondarySign;

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full sm:w-[300px] justify-between">
          <span className="truncate">{localSign.designation || "Select designation..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search designation..." onValueChange={filterDesignations} />
          <CommandEmpty>No designation found.</CommandEmpty>

          <div ref={parentRef} style={{ height: 340, overflow: 'auto', position: 'relative' }}>
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const row = flatRows[virtualRow.index];
                if (!row) return null;
                return (
                  <div
                    key={virtualRow.index}
                    ref={el => el && rowVirtualizer.measureElement(el) || undefined}
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

                        value={`${row.designation}-${row.width}x${row.height}-${row.sheeting}`}
                        onSelect={() => handleSelectFromFlat(row)}
                      >
                        <div className="flex items-center w-full pl-6">
                          <Check className={cn("mr-2 h-4 w-4", localSign.designation === row.designation && localSign.width === row.width && localSign.height === row.height ? "opacity-100" : "opacity-0")} />
                          <span className="text-sm">{row.width} x {row.height} — {row.sheeting}</span>
                        </div>
                      </CommandItem>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DesignationSearcher;
