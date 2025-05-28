// secondary-sign-form.tsx
import React, { useState, useEffect } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { fetchSignDesignations } from "@/lib/api-client";
import { PrimarySign, SecondarySign, SheetingType, SignDesignation } from "@/types/MPTEquipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { processSignData } from "./process-sign-data";

interface SecondarySignFormProps {
  sign: SecondarySign;
  primarySign: PrimarySign;
  currentPhase: number;
  setIsConfiguring: React.Dispatch<React.SetStateAction<boolean>>;
  isTakeoff?: boolean
}

const SecondarySignForm = ({
  sign,
  primarySign,
  currentPhase,
  setIsConfiguring,
  isTakeoff
}: SecondarySignFormProps) => {
  const { dispatch } = useEstimate();
  const [localSign, setLocalSign] = useState<SecondarySign>({ ...sign });
  const [designationData, setDesignationData] = useState<SignDesignation[]>([]);
  const [filteredDesignations, setFilteredDesignations] = useState<SignDesignation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(sign.isCustom || false);

  // Fetch all sign designations and dimensions
  useEffect(() => {
    const loadSignData = async () => {
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    loadSignData();
  }, []);

  // Filter designations based on search term
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

  const handleSignUpdate = (
    field: keyof SecondarySign,
    value: any
  ) => {
    setLocalSign(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDimensionSelect = (value: string) => {
    try {
      // Parse dimensions from format "width x height"
      const dimensionParts = value.split("x");
      if (dimensionParts.length === 2) {
        const width = parseFloat(dimensionParts[0].trim());
        const height = parseFloat(dimensionParts[1].trim());

        if (!isNaN(width) && !isNaN(height)) {
          setLocalSign({
            ...localSign,
            width,
            height
          });
        }
      }
    } catch (error) {
      console.error("Error handling dimension selection:", error);
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

    // Get default dimension from the selected designation
    const defaultDimension =
      selectedDesignation.dimensions &&
        selectedDesignation.dimensions.length > 0
        ? selectedDesignation.dimensions[0]
        : { width: 0, height: 0 };

    // Update the local sign with designation-related fields
    setLocalSign(prev => ({
      ...prev,
      designation: designationValue,
      width: defaultDimension.width,
      height: defaultDimension.height,
      sheeting: selectedDesignation.sheeting,
      description: selectedDesignation.description
    }));
  };

  const handleSignSave = () => {
    // Make sure the quantity matches the primary sign
    const signToSave = {
      ...localSign,
      quantity: primarySign.quantity
    };

    // Update each field of the secondary sign using UPDATE_MPT_SIGN
    Object.entries(signToSave).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'primarySignId') {
        dispatch({
          type: "UPDATE_MPT_SIGN",
          payload: {
            phase: currentPhase,
            signId: sign.id,
            key: key as keyof PrimarySign,
            value
          }
        });
      }
    });

    setIsConfiguring(false);
  };

  const handleCancel = () => {
    setIsConfiguring(false);
  };

  // Get available dimensions for the selected designation
  const getAvailableDimensions = () => {
    try {
      if (!localSign || !localSign.designation) return [];

      const designationInfo = designationData.find(
        (d) => d.designation === localSign.designation
      );

      if (!designationInfo) return [];

      return (designationInfo.dimensions || []).filter(
        (dim) =>
          typeof dim.width === "number" &&
          !isNaN(dim.width) &&
          typeof dim.height === "number" &&
          !isNaN(dim.height)
      );
    } catch (error) {
      console.error("Error getting available dimensions:", error);
      return [];
    }
  };

  return (
    <div className="space-y-8">
      {/* Secondary Sign Indicator */}
      <div className="p-2 bg-blue-50 text-blue-600 rounded-md mb-4">
        <p className="text-sm">
          Secondary sign associated with primary sign: {primarySign.designation || "Unknown"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="custom-sign-secondary"
          checked={isCustom}
          onCheckedChange={(checked) => {
            setIsCustom(checked);
            handleSignUpdate("isCustom", checked);
          }}
        />
        <Label htmlFor="custom-sign-secondary">Custom Sign</Label>
      </div>

      <div className="w-full flex">
        <div className="w-1/2">
          <Label className="text-base font-semibold mb-2.5 block">
            Designation
          </Label>
          {isCustom ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Designation Code
                </Label>
                <Input
                  value={localSign.designation || ""}
                  onChange={(e) =>
                    handleSignUpdate("designation", e.target.value)
                  }
                  placeholder="Enter custom designation"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Description
                </Label>
                <Input
                  value={localSign.description || ""}
                  onChange={(e) =>
                    handleSignUpdate("description", e.target.value)
                  }
                  placeholder="Enter description"
                />
              </div>
            </div>
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full sm:w-[300px] justify-between"
                >
                  <span className="truncate">
                    {localSign.designation || "Select designation..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search designation..."
                    onValueChange={filterDesignations}
                  />
                  <CommandEmpty>
                    No designation found.
                  </CommandEmpty>
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
                                localSign.designation === item.designation
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.designation}
                              </span>
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
          )}
        </div>
        {isTakeoff && <div className="w-1/2">
          <Label className="text-base font-semibold mb-2.5 block">
            Substrate
          </Label>
          <Select value={sign.substrate}
            onValueChange={(value) => dispatch({ type: 'UPDATE_MPT_SIGN', payload: { signId: sign.id, key: 'substrate', phase: currentPhase, value } })}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select substrate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='aluminum'>Aluminum</SelectItem>
              <SelectItem value='aluminum-composite'>Aluminum Composite</SelectItem>
              <SelectItem value='plastic'>Plastic</SelectItem>
            </SelectContent>
          </Select>
        </div>}
      </div>

      <div className="flex items-center gap-4">
        {isCustom ? (
          <>
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">
                Width
              </Label>
              <Input
                type="number"
                value={localSign.width || ""}
                onChange={(e) => handleSignUpdate(
                  "width",
                  parseFloat(e.target.value) || 0
                )}
                min={0}
                step="0.1"
              />
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">
                Height
              </Label>
              <Input
                type="number"
                value={localSign.height || ""}
                onChange={(e) => handleSignUpdate(
                  "height",
                  parseFloat(e.target.value) || 0
                )}
                min={0}
                step="0.1"
              />
            </div>
          </>
        ) : (
          <div className="flex-2">
            <Label className="text-sm font-medium mb-2 block">
              Dimensions
            </Label>
            <Select
              value={
                localSign.width && localSign.height
                  ? `${localSign.width}x${localSign.height}`
                  : undefined
              }
              onValueChange={handleDimensionSelect}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select dimensions" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableDimensions().map((dim, index) => (
                  <SelectItem
                    key={index}
                    value={`${dim.width}x${dim.height}`}
                  >
                    {dim.width} x {dim.height}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex-2">
          <Label className="text-sm font-medium mb-2 block">
            Sheeting
          </Label>
          <Select
            value={localSign.sheeting || "HI"}
            onValueChange={(value) =>
              handleSignUpdate("sheeting", value)
            }
            disabled={!localSign.isCustom}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HI">HI</SelectItem>
              <SelectItem value="DG">DG</SelectItem>
              <SelectItem value="Special">Special</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">
            Quantity
          </Label>
          <Input
            type="number"
            value={primarySign.quantity || ""}
            disabled={true}
            className="w-full opacity-70"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button onClick={handleSignSave}>
          Save Sign
        </Button>
      </div>
    </div>
  );
};

export default SecondarySignForm;