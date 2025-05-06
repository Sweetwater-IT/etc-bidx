// AddSignControl.tsx
import React, { useState, useEffect } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { fetchSignDesignations } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { PrimarySign, SheetingType, SignDesignation } from "@/types/MPTEquipment";
import { processSignData } from "./process-sign-data";
import { generateUniqueId } from "./generate-stable-id";

interface AddSignControlProps {
  isAddingSign: boolean;
  setIsAddingSign: React.Dispatch<React.SetStateAction<boolean>>;
  currentPhase: number;
}

const AddSignControl = ({ 
  isAddingSign, 
  setIsAddingSign, 
  currentPhase 
}: AddSignControlProps) => {
  const { dispatch } = useEstimate();
  const [open, setOpen] = useState(false);
  const [designationData, setDesignationData] = useState<SignDesignation[]>([]);
  const [filteredDesignations, setFilteredDesignations] = useState<SignDesignation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all sign designations and dimensions at once
  useEffect(() => {
    const loadSignData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSignDesignations();
        if (data && Array.isArray(data) && data.length > 0) {
          // Process the nested data structure from the API
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
      } finally {
        setIsLoading(false);
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
    // Find the selected designation data
    const selectedDesignation = designationData.find(
      (d) => d.designation === designationValue
    );

    if (!selectedDesignation) {
      console.error("Selected designation not found");
      return;
    }

    // Create new sign with default values from the selected designation
    const defaultDimension =
      selectedDesignation.dimensions &&
      selectedDesignation.dimensions.length > 0
        ? selectedDesignation.dimensions[0]
        : { width: 0, height: 0 };

    const newSign: PrimarySign = {
      id: generateUniqueId(),
      designation: designationValue,
      width: defaultDimension.width,
      height: defaultDimension.height,
      sheeting: selectedDesignation.sheeting,
      quantity: 1,
      associatedStructure: "none",
      bLights: 0,
      covers: 0,
      isCustom: false,
      description: selectedDesignation.description,
    };

    // Add the new sign to the context
    dispatch({
      type: "ADD_MPT_SIGN",
      payload: {
        phaseNumber: currentPhase,
        sign: newSign,
      },
    });

    setOpen(false);
    setIsAddingSign(false);
  };

  // If not in adding mode, just return null or a button
  if (!isAddingSign) {
    return null;
  }

  return (
    <div className="w-full max-w-md">
      <Label className="text-sm font-medium mb-2 block">
        Designation {isLoading && "(Loading...)"}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            Select Designation
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Search designation..."
              onValueChange={filterDesignations}
            />
            <CommandList>
              <CommandEmpty>No designation found.</CommandEmpty>
              <CommandGroup>
                {isLoading ? (
                  <div className="py-6 text-center text-sm">
                    Loading...
                  </div>
                ) : (
                  filteredDesignations.map((item) => (
                    <CommandItem
                      key={item.designation}
                      value={item.designation}
                      onSelect={() =>
                        handleDesignationSelect(item.designation)
                      }
                    >
                      <div className="flex items-center">
                        <Check className="mr-2 h-4 w-4 opacity-0" />
                        <span className="font-medium">
                          {item.designation}
                        </span>
                        {item.description && (
                          <span className="ml-2 text-muted-foreground text-xs">
                            - {item.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default AddSignControl;