import { Button } from '@/components/ui/button';
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { fetchSignDesignations } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { PrimarySign, SecondarySign, SheetingType } from '@/types/MPTEquipment';
import { Command } from 'cmdk';
import { Check, ChevronsUpDown } from 'lucide-react';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { processSignData } from './process-sign-data';

interface SignDesignation {
  designation: string;
  description: string;
  sheeting: SheetingType;
  dimensions: SignDimension[];
}

interface SignDimension {
  width: number;
  height: number;
}

interface Props {
  localSign: PrimarySign | SecondarySign;
  setLocalSign: Dispatch<SetStateAction<PrimarySign | SecondarySign | undefined>>;
  onDesignationSelected?: (updatedSign: PrimarySign | SecondarySign) => void;
}

const DesignationSearcher = ({ localSign, setLocalSign, onDesignationSelected }: Props) => {
  const [open, setOpen] = useState(false);
  const [designationData, setDesignationData] = useState<SignDesignation[]>([]);
  const [filteredDesignations, setFilteredDesignations] = useState<SignDesignation[]>([]);

  useEffect(() => {
    const loadSignData = async () => {
      try {
        const data = await fetchSignDesignations();
        if (data && Array.isArray(data) && data.length > 0) {
          const processedData = await processSignData(data);
          setDesignationData(processedData);
          setFilteredDesignations(processedData);
        } else {
          console.warn("No sign data returned from API or invalid format");
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

  const filterDesignations = (searchTerm: string) => {
    if (!Array.isArray(designationData)) {
      setFilteredDesignations([]);
      return;
    }

    if (!searchTerm || searchTerm.length < 2) {
      setFilteredDesignations(designationData);
      return;
    }

    try {
      const filtered = designationData.filter(
        (item) =>
          item.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDesignations(filtered);
    } catch (error) {
      console.error("Error filtering designations:", error);
      setFilteredDesignations([]);
    }
  };

  const handleDesignationSelect = (designationValue: string) => {
    const selectedDesignation = designationData.find((d) => d.designation === designationValue);

    if (!selectedDesignation) {
      console.error("Selected designation not found");
      return;
    }

    const updatedSign = {
      ...localSign,
      designation: designationValue,
      width: selectedDesignation.dimensions.length === 1 ? selectedDesignation.dimensions[0].width : 0,
      height: selectedDesignation.dimensions.length === 1 ? selectedDesignation.dimensions[0].height : 0,
      sheeting: selectedDesignation.sheeting,
      description: selectedDesignation.description,
    };

    setLocalSign(updatedSign);

    if (onDesignationSelected) {
      onDesignationSelected(updatedSign);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full sm:w-[300px] justify-between">
          <span className="truncate">{localSign.designation || "Select designation..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search designation..." onValueChange={filterDesignations} />
          <CommandEmpty>No designation found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {filteredDesignations.map((item) => (
                <CommandItem
                  key={item.designation}
                  value={item.designation}
                  onSelect={() => handleDesignationSelect(item.designation)}
                >
                  <div className="flex items-center w-full">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        localSign.designation === item.designation ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.designation}</span>
                      {item.description && (
                        <span className="text-muted-foreground text-xs truncate max-w-[200px]">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DesignationSearcher;
