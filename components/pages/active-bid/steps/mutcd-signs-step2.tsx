"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSignDesignations } from "@/lib/api-client";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Trash2, Plus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrimarySign, SecondarySign, SheetingType } from "@/types/MPTEquipment";
import { Step } from "@/types/IStep";
import { useEstimate } from "@/contexts/EstimateContext";

const step: Step = {
  id: "step-2",
  name: "MUTCD Signs",
  description: "Select and configure MUTCD signs",
  fields: [],
};

// Type definitions for processed sign data
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

const MutcdSignsStep2 = ({
  currentStep,
  setCurrentStep,
}: {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { mptRental, dispatch } = useEstimate();
  const currentPhase = 0; // Use first phase for now

  // Safely get the signs array with error handling
  const getSafeSignsArray = () => {
    try {
      if (!mptRental) return [];
      if (!mptRental.phases) return [];
      if (mptRental.phases.length === 0) return [];
      if (!mptRental.phases[0]) return [];
      if (!mptRental.phases[0].signs) return [];
      return mptRental.phases[0].signs || [];
    } catch (error) {
      console.error("Error getting signs array:", error);
      return [];
    }
  };

  const [signs, setSigns] = useState<(PrimarySign | SecondarySign)[]>(
    getSafeSignsArray()
  );
  const [open, setOpen] = useState(false);
  const [isAddingSign, setIsAddingSign] = useState(signs.length === 0);
  const [designationData, setDesignationData] = useState<SignDesignation[]>([]);
  const [filteredDesignations, setFilteredDesignations] = useState<
    SignDesignation[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all sign designations and dimensions at once
  useEffect(() => {
    const loadSignData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSignDesignations();
        if (data && Array.isArray(data) && data.length > 0) {
          // Process the nested data structure from the API
          const processedData = processSignData(data);
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

  // Safe process sign data function with error handling
  const processSignData = (apiData: any[]) => {
    if (!Array.isArray(apiData)) {
      console.error("API data is not an array");
      return [];
    }

    const processedData: SignDesignation[] = [];

    try {
      apiData.forEach((item) => {
        if (!item) return;

        // Validate that necessary properties exist
        if (!item.sign_designations || !item.sign_dimensions) return;

        const designation = item.sign_designations.designation;
        if (!designation) return;

        const description = item.sign_designations.description || "";
        const sheeting =
          (item.sign_designations.sheeting as SheetingType) || "DG";

        let width: number;
        let height: number;

        try {
          width = parseFloat(item.sign_dimensions.width);
          height = parseFloat(item.sign_dimensions.height);

          // Skip if dimensions are invalid
          if (isNaN(width) || isNaN(height)) return;
        } catch (e) {
          return; // Skip this item if dimensions can't be parsed
        }

        // Find if this designation already exists in our processed data
        const existingIndex = processedData.findIndex(
          (d) => d.designation === designation
        );

        if (existingIndex >= 0) {
          // Add the dimension to the existing designation
          processedData[existingIndex].dimensions.push({ width, height });
        } else {
          // Create a new designation entry
          processedData.push({
            designation,
            description,
            sheeting,
            dimensions: [{ width, height }],
          });
        }
      });

      // Sort dimensions within each designation for consistent display
      processedData.forEach((designation) => {
        if (!designation.dimensions) designation.dimensions = [];

        designation.dimensions.sort((a, b) => {
          // Sort first by width, then by height
          if (a.width !== b.width) {
            return a.width - b.width;
          }
          return a.height - b.height;
        });
      });

      return processedData;
    } catch (error) {
      console.error("Error processing sign data:", error);
      return [];
    }
  };

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

  // Generate a stable ID based on timestamp and counter
  const generateStableId = (() => {
    let counter = 0;
    return () => {
      counter += 1;
      return `sign-${Date.now()}-${counter}`;
    };
  })();

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
      id: generateStableId(),
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

    // Add the sign to the list
    const updatedSigns = [...signs, newSign];
    setSigns(updatedSigns);

    // Update context when a new sign is added
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

  const handleSignUpdate = (
    id: string,
    field: keyof PrimarySign | keyof SecondarySign | "dimensionSelection",
    value: any
  ) => {
    // Special handling for dimension selection
    if (field === "dimensionSelection" && typeof value === "string") {
      try {
        // Parse dimensions from format "width x height"
        const dimensionParts = value.split("x");
        if (dimensionParts.length === 2) {
          const width = parseFloat(dimensionParts[0].trim());
          const height = parseFloat(dimensionParts[1].trim());

          if (!isNaN(width) && !isNaN(height)) {
            // Update both width and height at once
            const updatedSigns = signs.map((sign) => {
              if (sign.id === id) {
                return { ...sign, width, height };
              }
              return sign;
            });

            setSigns(updatedSigns);

            // Update context for both dimensions
            dispatch({
              type: "UPDATE_MPT_SIGN",
              payload: {
                phase: currentPhase,
                signId: id,
                key: "width",
                value: width,
              },
            });

            dispatch({
              type: "UPDATE_MPT_SIGN",
              payload: {
                phase: currentPhase,
                signId: id,
                key: "height",
                value: height,
              },
            });
          } else {
            console.error("Failed to parse dimension values:", dimensionParts);
          }
        } else {
          console.error("Invalid dimension format:", value);
        }
      } catch (error) {
        console.error("Error handling dimension selection:", error);
      }
      return;
    }

    try {
      // Regular field update
      const updatedSigns = signs.map((sign) =>
        sign.id === id ? { ...sign, [field]: value } : sign
      );

      setSigns(updatedSigns);

      if (field !== "dimensionSelection") {
        dispatch({
          type: "UPDATE_MPT_SIGN",
          payload: {
            phase: currentPhase,
            signId: id,
            key: field,
            value: value,
          },
        });
      }
    } catch (error) {
      console.error("Error updating sign:", error);
    }

    // If designation changed, update other related fields
    if (field === "designation") {
      try {
        const selectedDesignation = designationData.find(
          (d) => d.designation === value
        );
        if (selectedDesignation) {
          // If there's only one dimension option, set it automatically
          if (
            selectedDesignation.dimensions &&
            selectedDesignation.dimensions.length === 1
          ) {
            const { width, height } = selectedDesignation.dimensions[0];

            // Update local state
            const updatedWithDimensions = signs.map((sign) =>
              sign.id === id
                ? {
                    ...sign,
                    width,
                    height,
                    sheeting: selectedDesignation.sheeting,
                    description: selectedDesignation.description,
                  }
                : sign
            );
            setSigns(updatedWithDimensions);

            // Update context for each field
            dispatch({
              type: "UPDATE_MPT_SIGN",
              payload: {
                phase: currentPhase,
                signId: id,
                key: "width",
                value: width,
              },
            });

            dispatch({
              type: "UPDATE_MPT_SIGN",
              payload: {
                phase: currentPhase,
                signId: id,
                key: "height",
                value: height,
              },
            });

            dispatch({
              type: "UPDATE_MPT_SIGN",
              payload: {
                phase: currentPhase,
                signId: id,
                key: "sheeting",
                value: selectedDesignation.sheeting,
              },
            });

            dispatch({
              type: "UPDATE_MPT_SIGN",
              payload: {
                phase: currentPhase,
                signId: id,
                key: "description",
                value: selectedDesignation.description,
              },
            });
          } else {
            // If multiple dimensions, update just the sheeting and description
            const updatedWithExtra = signs.map((sign) =>
              sign.id === id
                ? {
                    ...sign,
                    sheeting: selectedDesignation.sheeting,
                    description: selectedDesignation.description,
                  }
                : sign
            );
            setSigns(updatedWithExtra);

            dispatch({
              type: "UPDATE_MPT_SIGN",
              payload: {
                phase: currentPhase,
                signId: id,
                key: "sheeting",
                value: selectedDesignation.sheeting,
              },
            });

            dispatch({
              type: "UPDATE_MPT_SIGN",
              payload: {
                phase: currentPhase,
                signId: id,
                key: "description",
                value: selectedDesignation.description,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error updating sign after designation change:", error);
      }
    }
  };

  const handleSignSave = (id: string) => {
    try {
      setSigns(
        signs.map((sign) =>
          sign.id === id ? { ...sign, isConfiguring: false } : sign
        )
      );
      setIsAddingSign(true);
    } catch (error) {
      console.error("Error saving sign:", error);
    }
  };

  const handleSignDelete = (id: string) => {
    try {
      // Find if any secondary signs need to be deleted
      const isPrimarySign = signs.find((s) => s.id === id);
      const isSecondary = isPrimarySign && "primarySignId" in isPrimarySign;

      // For primary signs, also delete associated secondary signs
      if (isPrimarySign && !isSecondary) {
        const secondarySigns = signs.filter(
          (s) => "primarySignId" in s && s.primarySignId === id
        );

        // Delete secondary signs from context
        secondarySigns.forEach((secondarySign) => {
          dispatch({
            type: "DELETE_MPT_SIGN",
            payload: secondarySign.id,
          });
        });
      }

      // Update signs state
      const updatedSigns = isSecondary
        ? signs.filter((sign) => sign.id !== id)
        : signs.filter((sign) => {
            // For primary signs, also filter out the secondary signs
            if (sign.id === id) return false;
            if ("primarySignId" in sign && sign.primarySignId === id)
              return false;
            return true;
          });

      setSigns(updatedSigns);

      // Update context when a sign is deleted
      dispatch({
        type: "DELETE_MPT_SIGN",
        payload: id,
      });

      if (signs.length === 1) {
        setIsAddingSign(true);
      }
    } catch (error) {
      console.error("Error deleting sign:", error);
    }
  };

  const handleEditSign = (id: string) => {
    try {
      setSigns(
        signs.map((sign) =>
          sign.id === id ? { ...sign, isConfiguring: true } : sign
        )
      );
      setIsAddingSign(false);
    } catch (error) {
      console.error("Error editing sign:", error);
    }
  };

  const handleNext = () => {
    setCurrentStep(3);
  };

  // Get available dimensions for a sign - safely
  const getAvailableDimensions = (sign: PrimarySign | SecondarySign) => {
    try {
      if (!sign || !sign.designation) return [];

      const designationInfo = designationData.find(
        (d) => d.designation === sign.designation
      );
      return (designationInfo?.dimensions || []).filter(
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

  // Add a secondary sign to a primary sign
  const handleAddSecondarySign = (primarySignId: string) => {
    try {
      // Find the primary sign
      const primarySign = signs.find((s) => s.id === primarySignId) as
        | PrimarySign
        | undefined;

      if (!primarySign || "primarySignId" in primarySign) {
        console.error("Cannot add a secondary sign to a non-primary sign");
        return;
      }

      // Create a new secondary sign
      const newSecondarySign: SecondarySign = {
        id: generateStableId(),
        primarySignId: primarySignId,
        designation: "",
        width: 0,
        height: 0,
        quantity: primarySign.quantity, // Inherit quantity from primary
        sheeting: primarySign.sheeting || "HI", // Inherit sheeting from primary
        isCustom: false,
        description: "",
      };

      // Add the new sign to the list
      const updatedSigns = [...signs, newSecondarySign];
      setSigns(updatedSigns);

      // Update context with the new secondary sign
      dispatch({
        type: "ADD_MPT_SIGN",
        payload: {
          phaseNumber: currentPhase,
          sign: newSecondarySign,
        },
      });
    } catch (error) {
      console.error("Error adding secondary sign:", error);
    }
  };

  // Safe check if a sign is primary
  const isPrimarySign = (
    sign: PrimarySign | SecondarySign
  ): sign is PrimarySign => {
    return !("primarySignId" in sign);
  };

  return (
    <div>
      <div className="relative">
        <button
          onClick={() => setCurrentStep(2)}
          className={cn(
            "group flex w-full items-start gap-4 py-4 text-left",
            currentStep === 2 ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm",
              2 <= currentStep
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground bg-background"
            )}
          >
            2
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-base font-medium">{step.name}</div>
            <div className="text-sm text-muted-foreground">
              {step.description}
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {currentStep === 2 && (
          <div className="mt-2 mb-6 ml-12">
            <div className="space-y-6">
              {/* Signs List */}
              {signs.map((sign: any) => {
                const dimensions = getAvailableDimensions(sign);
                const hasDimensionOptions = dimensions.length > 1;
                const primary = isPrimarySign(sign);

                return (
                  <div
                    key={sign.id}
                    className={cn(
                      "rounded-lg border bg-card text-card-foreground shadow-sm p-4",
                      !primary ? "border-blue-200" : ""
                    )}
                  >
                    <div className="space-y-8">
                      {/* Secondary Sign Indicator */}
                      {!primary && (
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-md mb-4">
                          <p className="text-sm">
                            This is a secondary sign associated with a primary
                            sign.
                          </p>
                        </div>
                      )}

                      <div className="w-full">
                        <Label className="text-base font-semibold mb-2.5 block">
                          Designation
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full sm:w-[300px] justify-between"
                            >
                              {sign.designation || "Select designation..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[300px] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput
                                placeholder="Search designation..."
                                onValueChange={filterDesignations}
                              />
                              <CommandEmpty>No designation found.</CommandEmpty>
                              <CommandList>
                                <CommandGroup>
                                  {filteredDesignations.map((item) => (
                                    <CommandItem
                                      key={item.designation}
                                      value={item.designation}
                                      onSelect={() =>
                                        handleSignUpdate(
                                          sign.id,
                                          "designation",
                                          item.designation
                                        )
                                      }
                                    >
                                      <div className="flex items-center">
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            sign.designation ===
                                              item.designation
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
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
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-2">
                          <Label className="text-sm font-medium mb-2 block">
                            Dimensions
                          </Label>
                          <Select
                            value={
                              sign.width && sign.height
                                ? `${sign.width}x${sign.height}`
                                : undefined
                            }
                            onValueChange={(value) =>
                              handleSignUpdate(
                                sign.id,
                                "dimensionSelection",
                                value
                              )
                            }
                          >
                            <SelectTrigger className="w-full sm:w-[200px]">
                              <SelectValue placeholder="Select dimensions" />
                            </SelectTrigger>
                            <SelectContent>
                              {dimensions.map((dim, index) => (
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

                        <div className="flex-2">
                          <Label className="text-sm font-medium mb-2 block">
                            Sheeting
                          </Label>
                          <Select
                            value={sign.sheeting || "HI"}
                            onValueChange={(value) =>
                              handleSignUpdate(sign.id, "sheeting", value)
                            }
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
                            value={sign.quantity || ""}
                            onChange={(e) =>
                              handleSignUpdate(
                                sign.id,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={0}
                            className="w-full"
                            disabled={!primary} // Secondary signs inherit quantity
                          />
                        </div>

                        <div className="flex-2">
                          <Label className="text-sm font-medium mb-2 block">
                            Structure
                          </Label>
                          <Select
                            value={sign.associatedStructure || "none"}
                            onValueChange={(value) =>
                              handleSignUpdate(
                                sign.id,
                                "associatedStructure",
                                value
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fourFootTypeIII">
                                Four Foot Type III
                              </SelectItem>
                              <SelectItem value="hStand">H Stand</SelectItem>
                              <SelectItem value="post">Post</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1">
                          <Label className="text-sm font-medium mb-2 block">
                            B Lights
                          </Label>
                          <Input
                            type="number"
                            value={sign.bLights || ""}
                            onChange={(e) =>
                              handleSignUpdate(
                                sign.id,
                                "bLights",
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={0}
                            className="w-full"
                          />
                        </div>

                        <div className="flex-1">
                          <Label className="text-sm font-medium mb-2 block">
                            Covers
                          </Label>
                          <Input
                            type="number"
                            value={sign.covers || ""}
                            onChange={(e) =>
                              handleSignUpdate(
                                sign.id,
                                "covers",
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={0}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                      <Button
                        variant="outline"
                        onClick={() => handleSignDelete(sign.id)}
                      >
                        Cancel
                      </Button>
                      {/* {primary && (
                        <Button
                          variant="outline"
                          onClick={() => handleAddSecondarySign(sign.id)}
                        >
                          Add Secondary
                        </Button>
                      )} */}
                      <Button onClick={() => handleSignSave(sign.id)}>
                        Save Sign
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Add Sign Button or Initial Designation Input */}
              {isAddingSign && (
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
              )}

              {!isAddingSign && signs.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setIsAddingSign(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Sign
                </Button>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button onClick={handleNext}>Next</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MutcdSignsStep2;
