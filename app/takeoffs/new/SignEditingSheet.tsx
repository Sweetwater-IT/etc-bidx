import { Sheet, SheetContent, SheetHeader, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import Image from "next/image";
import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { useEstimate } from "@/contexts/EstimateContext";
import { fetchSignDesignations } from "@/lib/api-client";
import { PrimarySign, SecondarySign, SheetingType, EquipmentType, SignDesignation, structureMap, StructureKey } from '@/types/MPTEquipment';
import { processSignData } from '@/components/pages/active-bid/signs/process-sign-data';

interface Props {
    open: boolean;
    onOpenChange: Dispatch<SetStateAction<boolean>>;
    setParentLocalSign: Dispatch<SetStateAction<PrimarySign | SecondarySign | undefined>>
    mode: 'create' | 'edit';
    sign: PrimarySign | SecondarySign;
    currentPhase?: number;
    isTakeoff?: boolean;
}

// Type guard to check if sign is SecondarySign
const isSecondarySign = (sign: PrimarySign | SecondarySign): sign is SecondarySign => {
    return 'primarySignId' in sign;
};

const SignEditingSheet = ({ open, onOpenChange, mode, sign, setParentLocalSign, currentPhase = 0, isTakeoff = true }: Props) => {
    const { dispatch, mptRental } = useEstimate();
    const [localSign, setLocalSign] = useState<PrimarySign | SecondarySign>({ ...sign });
    const [designationData, setDesignationData] = useState<SignDesignation[]>([]);
    const [filteredDesignations, setFilteredDesignations] = useState<SignDesignation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [designationOpen, setDesignationOpen] = useState(false);
    const [isCustom, setIsCustom] = useState(sign.isCustom || false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const isSecondary = isSecondarySign(sign);
    
    // Get primary sign if this is a secondary sign
    const primarySign = isSecondary 
        ? mptRental.phases[currentPhase]?.signs.find(s => s.id === sign.primarySignId) as PrimarySign
        : null;

    // Get all available structure options from structureMap
    const getStructureOptions = () => {
        return Object.entries(structureMap).map(([key, value]) => ({
            value: key as StructureKey,
            label: value.displayName,
            baseEquipmentType: value.baseEquipmentType
        }));
    };

    // Helper function to get base equipment type from structure key
    const getBaseEquipmentType = (structureKey: StructureKey): EquipmentType | 'none' => {
        return structureMap[structureKey]?.baseEquipmentType || 'none';
    };

    // Handler for image upload
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        }
    };

    // Helper to get all secondary signs for a primary sign
    const getSecondarySignsForPrimary = (primarySignId: string): SecondarySign[] => {
        const desiredPhase = mptRental.phases[currentPhase];
        if (!desiredPhase) return [];
        
        return desiredPhase.signs.filter(
            (s): s is SecondarySign => 
                'primarySignId' in s && s.primarySignId === primarySignId
        );
    };

    // Helper to update all secondary sign quantities
    const updateSecondarySignQuantities = (primarySignId: string, newQuantity: number) => {
        const secondarySigns = getSecondarySignsForPrimary(primarySignId);
        
        secondarySigns.forEach((secondarySign) => {
            dispatch({
                type: "UPDATE_MPT_SIGN",
                payload: {
                    phase: currentPhase,
                    signId: secondarySign.id,
                    key: "quantity",
                    value: newQuantity,
                },
            });
        });
    };

    // Fetch sign designations data
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

        if (open) {
            loadSignData();
        }
    }, [open]);

    // Update local sign when prop changes
    useEffect(() => {
        setLocalSign({ ...sign });
        setIsCustom(sign.isCustom || false);
    }, [sign]);

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

    //this could be eventually moved to keyof PrimarySign | SecondarySign
    const handleSignUpdate = (field: string, value: any) => {
        const updatedSign = { ...localSign, [field]: value };
        setLocalSign(updatedSign);

        // Special handling for primary sign equipment-related fields
        if (!isSecondary && field === "associatedStructure") {
            handleStructureChange(value, (localSign as PrimarySign).associatedStructure);
        } else if (!isSecondary && field === "bLights") {
            handleBLightsChange(value);
        } else if (!isSecondary && field === "cover") {
            handleCoversChange(value);
        } else if (!isSecondary && field === "quantity") {
            handleQuantityChange(value);
        }
    };

    const handleStructureChange = (newStructure: StructureKey, oldStructure: StructureKey) => {
        if (isSecondary) return;

        // Get base equipment types for old and new structures
        const oldBaseType = getBaseEquipmentType(oldStructure);
        const newBaseType = getBaseEquipmentType(newStructure);

        // Update equipment quantities in the context
        if (oldBaseType !== "none") {
            dispatch({
                type: "ADD_MPT_ITEM_NOT_SIGN",
                payload: {
                    phaseNumber: currentPhase,
                    equipmentType: oldBaseType as EquipmentType,
                    equipmentProperty: "quantity",
                    value: 0, // Remove old structure
                },
            });
        }

        if (newBaseType !== "none") {
            dispatch({
                type: "ADD_MPT_ITEM_NOT_SIGN",
                payload: {
                    phaseNumber: currentPhase,
                    equipmentType: newBaseType as EquipmentType,
                    equipmentProperty: "quantity",
                    value: (localSign as PrimarySign).quantity, // Set quantity to match the sign
                },
            });
        }
    };

    const handleBLightsChange = (newValue: number) => {
        if (isSecondary) return;

        dispatch({
            type: "ADD_MPT_ITEM_NOT_SIGN",
            payload: {
                phaseNumber: currentPhase,
                equipmentType: "BLights" as EquipmentType,
                equipmentProperty: "quantity",
                value: newValue * (localSign as PrimarySign).quantity,
            },
        });
    };

    const handleCoversChange = (checked: boolean) => {
        if (isSecondary) return;

        dispatch({
            type: "ADD_MPT_ITEM_NOT_SIGN",
            payload: {
                phaseNumber: currentPhase,
                equipmentType: "covers" as EquipmentType,
                equipmentProperty: "quantity",
                value: checked ? (localSign as PrimarySign).quantity : 0,
            },
        });
    };

    const handleQuantityChange = (newValue: number) => {
        if (isSecondary) return;

        const primarySign = localSign as PrimarySign;
        const baseEquipmentType = getBaseEquipmentType(primarySign.associatedStructure);

        // Update equipment quantities for the new quantity
        if (baseEquipmentType !== "none") {
            dispatch({
                type: "ADD_MPT_ITEM_NOT_SIGN",
                payload: {
                    phaseNumber: currentPhase,
                    equipmentType: baseEquipmentType as EquipmentType,
                    equipmentProperty: "quantity",
                    value: newValue,
                },
            });
        }

        if (primarySign.bLights > 0) {
            dispatch({
                type: "ADD_MPT_ITEM_NOT_SIGN",
                payload: {
                    phaseNumber: currentPhase,
                    equipmentType: "BLights" as EquipmentType,
                    equipmentProperty: "quantity",
                    value: newValue * primarySign.bLights,
                },
            });
        }

        if (primarySign.cover) {
            dispatch({
                type: "ADD_MPT_ITEM_NOT_SIGN",
                payload: {
                    phaseNumber: currentPhase,
                    equipmentType: "covers" as EquipmentType,
                    equipmentProperty: "quantity",
                    value: newValue,
                },
            });
        }

        // Update all secondary sign quantities to match the new primary sign quantity
        updateSecondarySignQuantities(sign.id, newValue);
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
                        height,
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
        setLocalSign((prev) => ({
            ...prev,
            designation: designationValue,
            width: defaultDimension.width,
            height: defaultDimension.height,
            sheeting: selectedDesignation.sheeting,
            description: selectedDesignation.description,
        }));
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

    const handleSave = () => {
        // For secondary signs, make sure the quantity matches the primary sign
        let signToSave = localSign;
        if (isSecondary && primarySign) {
            signToSave = {
                ...localSign,
                quantity: primarySign.quantity
            };
        }

        // Update the sign in the context using UPDATE_MPT_SIGN
        Object.entries(signToSave).forEach(([key, value]) => {
            if (key !== "id" && key !== "primarySignId") {
                dispatch({
                    type: "UPDATE_MPT_SIGN",
                    payload: {
                        phase: currentPhase,
                        signId: sign.id,
                        key: key as keyof PrimarySign,
                        value,
                    },
                });
            }
        });
        setParentLocalSign(undefined)
        onOpenChange(false);
    };

    const handleCancel = () => {
        setLocalSign({ ...sign }); // Reset to original
        setIsCustom(sign.isCustom || false);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[400px] sm:w-[600px] flex flex-col p-0 overflow-y-auto"
            >
                <div className="flex flex-col gap-6 relative z-10 bg-background p-6">
                    <SheetHeader className="pb-4">
                        <SheetTitle>
                            {`${mode === 'create' ? 'Add' : 'Edit'} ${localSign.designation || 'Sign'} details`}
                        </SheetTitle>
                        {isSecondary && primarySign && (
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-md text-sm">
                                Secondary sign associated with primary sign: {primarySign.designation || "Unknown"}
                            </div>
                        )}
                    </SheetHeader>

                    <div className="space-y-6">
                        {/* Custom Sign Toggle */}
                        <div className="flex items-center gap-2">
                            <Switch
                                id="custom-sign"
                                checked={isCustom}
                                onCheckedChange={(checked) => {
                                    setIsCustom(checked);
                                    handleSignUpdate("isCustom", checked);
                                }}
                            />
                            <Label htmlFor="custom-sign">Custom Sign</Label>
                        </div>

                        {/* Designation Section */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <Label className="text-base font-semibold mb-2.5 block">
                                    Designation
                                </Label>
                                {isCustom ? (
                                    <div className="grid grid-cols-1 gap-4">
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
                                    <Popover open={designationOpen} onOpenChange={setDesignationOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between"
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
                                                <CommandEmpty>No designation found.</CommandEmpty>
                                                <CommandList>
                                                    <CommandGroup>
                                                        {filteredDesignations.map((item) => (
                                                            <CommandItem
                                                                key={item.designation}
                                                                value={item.designation}
                                                                onSelect={() => {
                                                                    handleDesignationSelect(item.designation);
                                                                    setDesignationOpen(false);
                                                                }}
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

                            {/* Image Upload */}
                            <label
                                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer bg-gray-50 group shrink-0"
                                title="Upload image"
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    tabIndex={-1}
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                {imagePreview ? (
                                    <Image
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover rounded"
                                        width={80}
                                        height={80}
                                    />
                                ) : (
                                    <>
                                        <Image
                                            src="/image_placeholder.svg"
                                            alt="No image"
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 opacity-80 group-hover:opacity-100"
                                        />
                                        <span className="text-xs text-gray-500">Upload</span>
                                    </>
                                )}
                            </label>
                        </div>

                        {/* Substrate (only for takeoff mode) */}
                        {isTakeoff && (
                            <div>
                                <Label className="text-base font-semibold mb-2.5 block">
                                    Substrate
                                </Label>
                                <Select
                                    value={localSign.substrate || "Aluminum"}
                                    onValueChange={(value) => handleSignUpdate("substrate", value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select substrate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Aluminum">Aluminum</SelectItem>
                                        <SelectItem value="Aluminum-Composite">
                                            Aluminum Composite
                                        </SelectItem>
                                        <SelectItem value="Plastic">Plastic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Dimensions and Core Properties */}
                        <div className="grid grid-cols-2 gap-4">
                            {isCustom ? (
                                <>
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Width</Label>
                                        <Input
                                            type="number"
                                            value={localSign.width || ""}
                                            onChange={(e) =>
                                                handleSignUpdate("width", parseFloat(e.target.value) || 0)
                                            }
                                            min={0}
                                            step="0.1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Height</Label>
                                        <Input
                                            type="number"
                                            value={localSign.height || ""}
                                            onChange={(e) =>
                                                handleSignUpdate("height", parseFloat(e.target.value) || 0)
                                            }
                                            min={0}
                                            step="0.1"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-2">
                                    <Label className="text-sm font-medium mb-2 block">Dimensions</Label>
                                    <Select
                                        value={
                                            localSign.width && localSign.height
                                                ? `${localSign.width}x${localSign.height}`
                                                : undefined
                                        }
                                        onValueChange={handleDimensionSelect}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select dimensions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getAvailableDimensions().map((dim, index) => (
                                                <SelectItem key={index} value={`${dim.width}x${dim.height}`}>
                                                    {dim.width} x {dim.height}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Sheeting</Label>
                                <Select
                                    value={localSign.sheeting || "HI"}
                                    onValueChange={(value) => handleSignUpdate("sheeting", value)}
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

                            <div>
                                <Label className="text-sm font-medium mb-2 block">Quantity</Label>
                                <Input
                                    type="number"
                                    value={isSecondary && primarySign ? primarySign.quantity : localSign.quantity || ""}
                                    onChange={(e) =>
                                        handleSignUpdate("quantity", parseInt(e.target.value) || 0)
                                    }
                                    min={0}
                                    className="w-full"
                                    disabled={isSecondary}
                                />
                            </div>
                        </div>

                        {/* Primary Sign Specific Fields */}
                        {!isSecondary && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Structure</Label>
                                        <Select
                                            value={(localSign as PrimarySign).associatedStructure || undefined}
                                            onValueChange={(value) =>
                                                handleSignUpdate("associatedStructure", value as StructureKey)
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select structure type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getStructureOptions().map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">
                                            B Light Quantity
                                        </Label>
                                        <Input
                                            type="number"
                                            value={(localSign as PrimarySign).bLights || ""}
                                            onChange={(e) =>
                                                handleSignUpdate("bLights", parseInt(e.target.value) || 0)
                                            }
                                            min={0}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                {/* B Light Color (only if takeoff and bLights > 0) */}
                                {isTakeoff && (localSign as PrimarySign).bLights > 0 && (
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">B Light Color</Label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose color" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="red">Red</SelectItem>
                                                <SelectItem value="yellow">Yellow</SelectItem>
                                                <SelectItem value="white">White</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Covers and Stiffener */}
                                <div className="grid grid-cols-2 gap-4">
                                    {isTakeoff ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    onCheckedChange={(checked) =>
                                                        handleSignUpdate("cover", checked)
                                                    }
                                                    checked={(localSign as PrimarySign).cover || false}
                                                    id="cover-checkbox"
                                                />
                                                <Label
                                                    htmlFor="cover-checkbox"
                                                    className="text-sm font-medium"
                                                >
                                                    Include cover
                                                </Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    onCheckedChange={(checked) => handleSignUpdate('stiffener', checked)}
                                                    checked={localSign.stiffener || false}
                                                    id="stiffener-checkbox"
                                                />
                                                <Label
                                                    htmlFor="stiffener-checkbox"
                                                    className="text-sm font-medium"
                                                >
                                                    Include stiffener
                                                </Label>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                onCheckedChange={(checked) =>
                                                    handleSignUpdate("cover", checked)
                                                }
                                                checked={(localSign as PrimarySign).cover || false}
                                                id="cover-checkbox-regular"
                                            />
                                            <Label
                                                htmlFor="cover-checkbox-regular"
                                                className="text-sm font-medium"
                                            >
                                                Include cover
                                            </Label>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={localSign.quantity < 1}>
                            Save Sign
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default SignEditingSheet;