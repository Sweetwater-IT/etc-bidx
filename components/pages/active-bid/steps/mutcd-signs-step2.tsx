"use client";
import { FormData } from "@/types/IFormData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSignDesignations, fetchSignDimensions } from '@/lib/api-client';
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
import { PrimarySign, SecondarySign } from "@/types/MPTEquipment";
import { Step } from "@/types/IStep";

const step : Step = {
  id: "step-2",
  name: "MUTCD Signs",
  description: "Select and configure MUTCD signs",
  fields: []
};


const MutcdSignsStep2 = ({
  currentStep,
  setCurrentStep,
  formData,
  setFormData,
}: {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) => {
  const [signs, setSigns] = useState<(PrimarySign | SecondarySign)[]>(formData.mptRental.phases[0].signs);
  const [open, setOpen] = useState(false);
  const [isAddingSign, setIsAddingSign] = useState(formData.mptRental.phases[0].signs.length === 0);
  const [designations, setDesignations] = useState<any[]>([]);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dimensionsMap, setDimensionsMap] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch initial sign designations from the database
  useEffect(() => {
    const loadInitialDesignations = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSignDesignations();
        if (data && data.length > 0) {
          setDesignations(data);
        }
      } catch (error) {
        console.error('Error fetching sign designations:', error);
        // Fall back to the hardcoded designations
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialDesignations();
  }, []);
  
  // Function to search for sign designations
  const searchDesignations = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      // If search term is too short, load initial designations
      const data = await fetchSignDesignations();
      if (data && data.length > 0) {
        setDesignations(data);
      }
      return;
    }
    
    setIsLoadingDesignations(true);
    try {
      const data = await fetchSignDesignations(searchTerm);
      if (data && data.length > 0) {
        setDesignations(data);
      }
    } catch (error) {
      console.error('Error searching sign designations:', error);
    } finally {
      setIsLoadingDesignations(false);
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

  const handleDesignationSelect = async (currentValue: string) => {
    // Find the selected designation to get its ID
    const selectedDesignation = designations.find(d => d.value === currentValue);
    
    if (!selectedDesignation) {
      console.error('Selected designation not found');
      return;
    }
    
    // Create new sign with default values
    const newSign: PrimarySign = {
      id: generateStableId(),
      designation: currentValue,
      width: 0,
      height: 0,
      sheeting: 'DG',  // Default sheeting
      quantity: 1,
      associatedStructure: 'none',
      bLights: 0,
      covers: 0,
      isCustom: false,
      description: ''
    };
    
    // Add the sign to the list
    const updatedSigns = [...signs, newSign];
    setSigns(updatedSigns);
    
    // Update form data when a new sign is added
    setFormData((prev: any) => ({
      ...prev,
      signs: updatedSigns.map((sign) => ({ ...sign, isConfiguring: undefined })),
    }));
    
    // Fetch dimensions for this designation
    try {
      const dimensionsData = await fetchSignDimensions(selectedDesignation.id);
      
      // Update dimensions map
      setDimensionsMap(prev => ({
        ...prev,
        [currentValue]: dimensionsData
      }));
      
      if (dimensionsData && dimensionsData.length > 0) {
        // Update the sign with the first dimension
        const signIndex = updatedSigns.findIndex(s => s.id === newSign.id);
        if (signIndex !== -1) {
          const updatedSign = {...updatedSigns[signIndex]};
          updatedSign.width = dimensionsData[0].value;
          
          const newSigns = [...updatedSigns];
          newSigns[signIndex] = updatedSign;
          setSigns(newSigns);
          
          // Update form data with the updated dimension
          setFormData((prev: any) => ({
            ...prev,
            signs: newSigns.map((sign) => ({ ...sign, isConfiguring: undefined })),
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching dimensions:', error);
    }
    
    setOpen(false);
    setIsAddingSign(false);
  };

  const handleSignUpdate = (id: string, field: keyof PrimarySign | keyof SecondarySign, value: any) => {
    const updatedSigns = signs.map((sign) => 
      sign.id === id ? { ...sign, [field]: value } : sign
    );
    
    setSigns(updatedSigns);
    
    // Update form data when a sign field is updated
    setFormData((prev: any) => ({
      ...prev,
      signs: updatedSigns.map((sign) => ({ ...sign, isConfiguring: undefined })),
    }));
  };

  const handleSignSave = (id: string) => {
    setSigns(
      signs.map((sign) =>
        sign.id === id ? { ...sign, isConfiguring: false } : sign
      )
    );
    setIsAddingSign(true);
    // Update form data
    setFormData((prev: any) => ({
      ...prev,
      signs: signs.map((sign) => ({ ...sign, isConfiguring: undefined })),
    }));
  };

  const handleSignDelete = (id: string) => {
    const updatedSigns = signs.filter((sign) => sign.id !== id);
    setSigns(updatedSigns);
    
    // Update form data when a sign is deleted
    setFormData((prev: any) => ({
      ...prev,
      signs: updatedSigns.map((sign) => ({ ...sign, isConfiguring: undefined })),
    }));
    
    if (signs.length === 1) {
      setIsAddingSign(true);
    }
  };

  const handleEditSign = (id: string) => {
    setSigns(
      signs.map((sign) =>
        sign.id === id ? { ...sign, isConfiguring: true } : sign
      )
    );
    setIsAddingSign(false);
  };

  const handleNext = () => {

    // Update form data with signs before proceeding
    // Ensure all required fields are defined to match the FormData.SignData interface
    setFormData(prev => ({
      ...prev,
      signs: signs.map(sign => ({
        id: sign.id,
        designation: sign.designation,
        dimensions: sign.width || '',
        sheeting: sign.sheeting || '',
        quantity: sign.quantity || 0
        // Omit isConfiguring and other optional properties that aren't in the FormData.SignData interface
      }))
    }));
    
    setCurrentStep(3);
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
              {signs.map((sign) => (
                <div
                  key={sign.id}
                  className={cn(
                    "rounded-lg border bg-card text-card-foreground shadow-sm p-4"
                  )}
                >
                  {true ? (
                    <div className="space-y-8">
                      {/* Designation Selection */}
                      <div className="w-full">
                        <Label className="text-base font-semibold mb-2.5 block">
                          Designation
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-[200px] justify-between"
                            >
                              {sign.designation || "Select designation..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search designation..." />
                              <CommandEmpty>No designation found.</CommandEmpty>
                              <CommandList>
                                <CommandGroup>
                                  {designations.map((d) => (
                                    <CommandItem
                                      key={d.value}
                                      value={d.value}
                                      onSelect={async () => {
                                        // Update designation
                                        handleSignUpdate(sign.id, "designation", d.value);
                                        
                                        // Find the selected designation to get its ID
                                        const selectedDesignation = designations.find(des => des.value === d.value);
                                        
                                        if (selectedDesignation) {
                                          // Fetch dimensions for this designation if not already in cache
                                          if (!dimensionsMap[d.value]) {
                                            try {
                                              const dimensionsData = await fetchSignDimensions(selectedDesignation.id);
                                              
                                              // Update dimensions map
                                              setDimensionsMap(prev => ({
                                                ...prev,
                                                [d.value]: dimensionsData
                                              }));
                                              
                                              // Set default dimension if available and not already set
                                              if (dimensionsData && dimensionsData.length > 0 && !sign.width) {
                                                handleSignUpdate(sign.id, "width", dimensionsData[0].value);
                                              }
                                            } catch (error) {
                                              console.error('Error fetching dimensions:', error);
                                            }
                                          } else if (dimensionsMap[d.value].length > 0 && !sign.width) {
                                            // Use cached dimensions
                                            handleSignUpdate(sign.id, "width", dimensionsMap[d.value][0].value);
                                          }
                                        }
                                        
                                        // Set default sheeting if not already set
                                        if (!sign.sheeting) {
                                          handleSignUpdate(sign.id, "sheeting", "DG");
                                        }
                                        
                                        // Set default quantity if not already set
                                        if (!sign.quantity) {
                                          handleSignUpdate(sign.id, "quantity", 1);
                                        }
                                      }}
                                    >
                                      <div className="flex items-center">
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            sign.designation === d.value
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {d.label}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Other Fields in a single line */}
                      {/* <div className="flex flex-row gap-4 w-full">
                        <div className="col-span-2 flex-2">
                          <Label className="text-sm font-medium mb-2 block">Dimensions</Label>
                          <Select
                            value={sign.dimensions}
                            onValueChange={(value) =>
                              handleSignUpdate(sign.id, "dimensions", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select dimensions" />
                            </SelectTrigger>
                            <SelectContent>
                              {dimensionsMap[sign.designation] ? (
                                dimensionsMap[sign.designation].map((dim) => (
                                  <SelectItem key={dim.id} value={dim.value}>
                                    {dim.value}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading">Loading dimensions...</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-2">
                          <Label className="text-sm font-medium mb-2 block">Sheeting</Label>
                          <Select
                            value={sign.sheeting}
                            onValueChange={(value) =>
                              handleSignUpdate(sign.id, "sheeting", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {sheetingOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm font-medium mb-2 block">Quantity</Label>
                          <Input
                            type="number"
                            value={sign.quantity || ""}
                            onChange={(e) =>
                              handleSignUpdate(
                                sign.id,
                                "quantity",
                                parseInt(e.target.value)
                              )
                            }
                            min={0}
                            className="w-full"
                          />
                        </div>
                        <div className="flex-2">
                          <Label className="text-sm font-medium mb-2 block">Structure</Label>
                          <Select
                            value={sign.structure}
                            onValueChange={(value) =>
                              handleSignUpdate(sign.id, "structure", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              {structureOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm font-medium mb-2 block">B Lights</Label>
                          <Input
                            type="number"
                            value={sign.bLights || ""}
                            onChange={(e) =>
                              handleSignUpdate(
                                sign.id,
                                "bLights",
                                parseInt(e.target.value)
                              )
                            }
                            min={0}
                            className="w-full"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm font-medium mb-2 block">Covers</Label>
                          <Input
                            type="number"
                            value={sign.covers || ""}
                            onChange={(e) =>
                              handleSignUpdate(
                                sign.id,
                                "covers",
                                parseInt(e.target.value)
                              )
                            }
                            min={0}
                            className="w-full"
                          />
                        </div>
                      </div> */}

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 pt-6">
                        <Button
                          variant="outline"
                          onClick={() => handleSignDelete(sign.id)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={() => handleSignSave(sign.id)}>
                          Save Sign
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="font-medium">{sign.designation}</div>
                        <div className="text-sm text-muted-foreground">
                          {sign.width} x {sign.height} • {sign.sheeting} • Qty:{" "}
                          {sign.quantity}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSign(sign.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSignDelete(sign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Sign Button or Initial Designation Input */}
              {isAddingSign && (
                <div className="w-full max-w-sm">
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
                          onValueChange={(value) => searchDesignations(value)}
                        />
                        <CommandList>
                          <CommandEmpty>No designation found.</CommandEmpty>
                          <CommandGroup>
                            {isLoading ? (
                              <div className="py-6 text-center text-sm">Loading...</div>
                            ) : (
                              designations.map((designation) => (
                                <CommandItem
                                  key={designation.value}
                                  onSelect={() => handleDesignationSelect(designation.value)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      "opacity-0"
                                    )}
                                  />
                                  {designation.label}
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
                <Button onClick={handleNext}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MutcdSignsStep2;
