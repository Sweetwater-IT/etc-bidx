"use client";

import { FormData } from "@/app/active-bid/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
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

const step = {
  id: "step-2",
  name: "MUTCD Signs",
  description: "Select and configure MUTCD signs",
};

const designations = [
  {
    value: "D10-1A",
    label: "D10-1A",
    dimensions: ["12.0 x 36.0", "24.0 x 48.0"],
  },
  {
    value: "D10-2",
    label: "D10-2",
    dimensions: ["12.0 x 24.0", "18.0 x 36.0"],
  },
  { value: "D10-3", label: "D10-3", dimensions: ["12.0 x 36.0"] },
];

const sheetingOptions = ["DG", "HI"];
const structureOptions = ["None", "Square Post", "U-Channel"];

interface SignData {
  id: string;
  designation: string;
  dimensions?: string;
  sheeting?: string;
  quantity?: number;
  structure?: string;
  bLights?: number;
  covers?: number;
  isConfiguring?: boolean;
  secondarySigns?: SignData[];
}

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
  const [signs, setSigns] = useState<SignData[]>(formData.signs as SignData[] || []);
  const [open, setOpen] = useState(false);
  const [isAddingSign, setIsAddingSign] = useState(signs.length === 0);

  const handleDesignationSelect = (currentValue: string) => {
    const newSign: SignData = {
      id: Math.random().toString(36).substr(2, 9),
      designation: currentValue,
      isConfiguring: true,
    };
    setSigns([...signs, newSign]);
    setOpen(false);
    setIsAddingSign(false);
  };

  const handleSignUpdate = (id: string, field: keyof SignData, value: any) => {
    setSigns(
      signs.map((sign) => (sign.id === id ? { ...sign, [field]: value } : sign))
    );
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
    setSigns(signs.filter((sign) => sign.id !== id));
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
                    "rounded-lg border bg-card text-card-foreground shadow-sm",
                    sign.isConfiguring ? "p-6" : "p-4"
                  )}
                >
                  {sign.isConfiguring ? (
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
                                      onSelect={() =>
                                        handleSignUpdate(
                                          sign.id,
                                          "designation",
                                          d.value
                                        )
                                      }
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
                      <div className="flex flex-row gap-4 w-full">
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
                              {designations
                                .find((d) => d.value === sign.designation)
                                ?.dimensions.map((dim) => (
                                  <SelectItem key={dim} value={dim}>
                                    {dim}
                                  </SelectItem>
                                ))}
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
                      </div>

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
                          {sign.dimensions} • {sign.sheeting} • Qty:{" "}
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
                    Designation
                  </Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        Select designation...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search designation..." />
                        <CommandEmpty>No designation found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {designations.map((designation) => (
                              <CommandItem
                                key={designation.value}
                                value={designation.value}
                                onSelect={() =>
                                  handleDesignationSelect(designation.value)
                                }
                              >
                                <div className="flex items-center">
                                  <Check
                                    className={cn("mr-2 h-4 w-4", "opacity-0")}
                                  />
                                  {designation.label}
                                </div>
                              </CommandItem>
                            ))}
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
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={
                    signs.length === 0 || signs.some((s) => s.isConfiguring)
                  }
                >
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
