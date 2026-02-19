import { Sheet, SheetContent, SheetHeader, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Check, ChevronsUpDown } from "lucide-react";
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
import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { useEstimate } from "@/contexts/EstimateContext";
import { fetchSignDesignations } from "@/lib/api-client";
import { PrimarySign, SecondarySign, SheetingType, EquipmentType, SignDesignation, structureMap, DisplayStructures, AssociatedStructures, PataKit, PtsKit, SignsApiResponse } from '@/types/MPTEquipment';
import { processSignData } from '@/components/pages/active-bid/signs/process-sign-data';
import { generateUniqueId } from '@/components/pages/active-bid/signs/generate-stable-id';
import { Separator } from '@/components/ui/separator';

interface Props {
    open: boolean;
    onOpenChange: Dispatch<SetStateAction<boolean>>;
    mode: 'create' | 'edit';
    sign: PrimarySign | SecondarySign;
    currentPhase?: number;
    isTakeoff?: boolean;
    isSignOrder?: boolean;
}

// Type guard to check if sign is SecondarySign
const isSecondarySign = (sign: PrimarySign | SecondarySign): sign is SecondarySign => {
    return 'primarySignId' in sign;
};

const SignEditingSheet = ({ open, onOpenChange, mode, sign, currentPhase = 0, isTakeoff = true, isSignOrder }: Props) => {
    const { dispatch, mptRental } = useEstimate();
    const [localSign, setLocalSign] = useState<PrimarySign | SecondarySign>({ ...sign });
    const [apiData, setApiData] = useState<SignsApiResponse | null>(null);
    const [filteredSigns, setFilteredSigns] = useState<SignDesignation[]>([]);
    const [filteredPataKits, setFilteredPataKits] = useState<PataKit[]>([]);
    const [filteredPtsKits, setFilteredPtsKits] = useState<PtsKit[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [designationOpen, setDesignationOpen] = useState(false);
    const [isCustom, setIsCustom] = useState(sign.isCustom || false);
    const [kitStepperOpen, setKitStepperOpen] = useState(false);
    const [selectedKit, setSelectedKit] = useState<PataKit | PtsKit | null>(null);
    const [kitSignConfigurations, setKitSignConfigurations] = useState<any[]>([]);

    const isSecondary = isSecondarySign(sign);
    // Get primary sign if this is a secondary sign
    const primarySign = isSecondary
        ? mptRental.phases[currentPhase]?.signs.find(s => s.id === sign.primarySignId) as PrimarySign
        : null;

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

    // Helper to get current equipment quantity for a specific type
    const getCurrentEquipmentQuantity = (equipmentType: EquipmentType): number => {
        const currentPhaseData = mptRental.phases[currentPhase];
        return currentPhaseData.standardEquipment[equipmentType]?.quantity || 0;
    };

    // Helper to update equipment quantity
    const updateEquipmentQuantity = (equipmentType: EquipmentType, newQuantity: number) => {
        dispatch({
            type: "ADD_MPT_ITEM_NOT_SIGN",
            payload: {
                phaseNumber: currentPhase,
                equipmentType: equipmentType,
                equipmentProperty: "quantity",
                value: newQuantity,
            },
        });
    };

    // Fetch sign designations data
    useEffect(() => {
        const loadSignData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/signs');
                const data = await response.json();

                if (data.success && data.data) {
                    setApiData(data.data);
                    setFilteredSigns(data.data.signs || []);
                    setFilteredPataKits(data.data.pataKits || []);
                    setFilteredPtsKits(data.data.ptsKits || []);
                } else {
                    console.warn("No sign data returned from API");
                    setApiData({ signs: [], pataKits: [], ptsKits: [] });
                    setFilteredSigns([]);
                    setFilteredPataKits([]);
                    setFilteredPtsKits([]);
                }
            } catch (error) {
                console.error("Error fetching sign data:", error);
                setApiData({ signs: [], pataKits: [], ptsKits: [] });
                setFilteredSigns([]);
                setFilteredPataKits([]);
                setFilteredPtsKits([]);
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
        if (!apiData) {
            setFilteredSigns([]);
            setFilteredPataKits([]);
            setFilteredPtsKits([]);
            return;
        }

        if (!searchTerm || searchTerm.length < 2) {
            setFilteredSigns(apiData.signs || []);
            setFilteredPataKits(apiData.pataKits || []);
            setFilteredPtsKits(apiData.ptsKits || []);
            return;
        }

        const query = searchTerm.toLowerCase();

        try {
            // Filter signs
            const filteredSigns = (apiData.signs || []).filter(sign =>
                sign.designation.toLowerCase().includes(query) ||
                sign.description.toLowerCase().includes(query)
            );

            // Filter kits that contain signs matching the query
            const signDesignations = new Set(filteredSigns.map(s => s.designation));

            const filteredPataKits = (apiData.pataKits || []).filter(kit =>
                kit.contents.some(content => signDesignations.has(content.sign_designation)) ||
                kit.code.toLowerCase().includes(query) ||
                kit.description.toLowerCase().includes(query)
            );

            const filteredPtsKits = (apiData.ptsKits || []).filter(kit =>
                kit.contents.some(content => signDesignations.has(content.sign_designation)) ||
                kit.code.toLowerCase().includes(query) ||
                kit.description.toLowerCase().includes(query)
            );

            setFilteredSigns(filteredSigns);
            setFilteredPataKits(filteredPataKits);
            setFilteredPtsKits(filteredPtsKits);
        } catch (error) {
            console.error("Error filtering designations:", error);
            setFilteredSigns([]);
            setFilteredPataKits([]);
            setFilteredPtsKits([]);
        }
    };

    const handleSignUpdate = (field: keyof PrimarySign, value: any) => {
        const previousSign = { ...localSign };
        const updatedSign = { ...localSign, [field]: value };

        // Special handling for equipment-related fields (only for primary signs)
        if (!isSecondary) {
            if (field === 'displayStructure') {
                const newStructure = structureMap[value];
                (updatedSign as PrimarySign).associatedStructure = newStructure;
                handleStructureChange(newStructure, (previousSign as PrimarySign).associatedStructure, updatedSign.quantity);
            } else if (field === "bLights") {
                handleBLightsChange(value, updatedSign.quantity);
            } else if (field === "quantity") {
                handleQuantityChange(value, (previousSign as PrimarySign).quantity, updatedSign as PrimarySign);
            } else if (field === "cover") {
                handleCoversChange(value, updatedSign.quantity);
            }
        }

        setLocalSign(updatedSign);
    };

    const handleStructureChange = (
        newStructure: AssociatedStructures,
        oldStructure: AssociatedStructures,
        signQuantity: number
    ) => {
        // Handle old structure: decrement by the sign quantity
        if (oldStructure !== 'none') {
            const currentOldQuantity = getCurrentEquipmentQuantity(oldStructure);
            const newOldQuantity = Math.max(0, currentOldQuantity - signQuantity);
            updateEquipmentQuantity(oldStructure, newOldQuantity);
        }

        // Handle new structure: increment by the sign quantity
        if (newStructure !== 'none') {
            const currentNewQuantity = getCurrentEquipmentQuantity(newStructure);
            const newNewQuantity = currentNewQuantity + signQuantity;
            updateEquipmentQuantity(newStructure, newNewQuantity);
        }
    };

    const handleBLightsChange = (newBLightsPerSign: number, signQuantity: number) => {
        const totalBLights = newBLightsPerSign * signQuantity;
        updateEquipmentQuantity("BLights" as EquipmentType, totalBLights);
    };

    const handleCoversChange = (checked: boolean, signQuantity: number) => {
        const coversQuantity = checked ? getCurrentEquipmentQuantity('covers') + signQuantity : getCurrentEquipmentQuantity('covers') - signQuantity;
        updateEquipmentQuantity("covers" as EquipmentType, coversQuantity);
    };

    const handleQuantityChange = (newQuantity: number, oldQuantity: number, updatedSign: PrimarySign) => {
        const quantityDiff = newQuantity - oldQuantity;

        // Update associated structure quantities
        if (updatedSign.associatedStructure !== 'none') {
            const currentStructureQuantity = getCurrentEquipmentQuantity(updatedSign.associatedStructure);
            const newStructureQuantity = currentStructureQuantity + quantityDiff;
            updateEquipmentQuantity(updatedSign.associatedStructure, Math.max(0, newStructureQuantity));
        }

        // Update B-Lights quantities
        if (updatedSign.bLights > 0) {
            const totalBLights = updatedSign.bLights * newQuantity;
            updateEquipmentQuantity("BLights" as EquipmentType, totalBLights);
        }

        // Update covers quantities
        if (updatedSign.cover) {
            updateEquipmentQuantity("covers" as EquipmentType, newQuantity);
        }

        // Update all secondary sign quantities to match the new primary sign quantity
        updateSecondarySignQuantities(sign.id, newQuantity);
    };

    const handleDimensionSelect = (value: string) => {
        try {
            // Parse dimensions from format "widthxheight" (no spaces)
            const dimensionParts = value.split("x");
            if (dimensionParts.length === 2) {
                const width = parseFloat(dimensionParts[0]);
                const height = parseFloat(dimensionParts[1]);

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
        const selectedDesignation = filteredSigns.find(
            (d) => d.designation === designationValue
        );

        if (!selectedDesignation) {
            console.error("Selected designation not found");
            return;
        }

        // Get default dimension from the selected designation
        const shouldAutoSetDimensions = selectedDesignation.dimensions && selectedDesignation.dimensions.length === 1;

        const defaultDimension = shouldAutoSetDimensions
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

    const handleKitSelect = (kit: PataKit | PtsKit, kitType: 'pata' | 'pts') => {
        setSelectedKit(kit);

        // Initialize configurations for each sign in the kit
        const configurations = kit.contents.map(content => {
            // Find the sign data for this designation
            const signData = apiData?.signs.find(s => s.designation === content.sign_designation);

            return {
                designation: content.sign_designation,
                quantity: content.quantity,
                width: signData?.dimensions[0]?.width || 0,
                height: signData?.dimensions[0]?.height || 0,
                sheeting: signData?.sheeting || 'DG',
                substrate: 'Plastic' as const,
                associatedStructure: 'none' as const,
                displayStructure: 'LOOSE' as const,
                bLights: 0,
                cover: false,
                stiffener: false,
                description: signData?.description || '',
                isCustom: false,
            };
        });

        setKitSignConfigurations(configurations);
        setKitStepperOpen(true);
    };

    const handleKitStepperComplete = () => {
        if (!selectedKit || !kitSignConfigurations.length) return;

        // Create all signs from the kit configurations
        kitSignConfigurations.forEach(config => {
            const newSign: PrimarySign = {
                id: generateUniqueId(),
                designation: config.designation,
                width: config.width,
                height: config.height,
                quantity: config.quantity,
                sheeting: config.sheeting,
                associatedStructure: config.associatedStructure,
                displayStructure: config.displayStructure,
                bLights: config.bLights,
                cover: config.cover,
                isCustom: config.isCustom,
                bLightsColor: undefined,
                description: config.description,
                substrate: config.substrate,
                stiffener: config.stiffener,
            };

            dispatch({
                type: 'ADD_MPT_SIGN',
                payload: {
                    phaseNumber: currentPhase,
                    sign: newSign,
                },
            });
        });

        // Close the modal and reset
        setKitStepperOpen(false);
        setSelectedKit(null);
        setKitSignConfigurations([]);
        onOpenChange(false);
    };

    // Get available dimensions for the selected designation
    const getAvailableDimensions = () => {
        try {
            if (!localSign || !localSign.designation) return [];

            const designationInfo = filteredSigns.find(
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
        onOpenChange(false);
    };

    const handleCancel = () => {
        setIsCustom(sign.isCustom || false);
        onOpenChange(false);
    };

    return (
        <>
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[400px] sm:w-[600px] flex flex-col p-0 overflow-y-auto"
            >
                <div className="flex flex-col gap-2 relative z-10 bg-background">
                    <SheetHeader className="pb-4 p-6">
                        <SheetTitle>
                            {`${mode === 'create' ? 'Add' : 'Edit'} ${isCustom ? 'Custom sign' : (localSign.designation || 'Sign')} details`}
                        </SheetTitle>
                        {isSecondary && primarySign && (
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-md text-sm">
                                Secondary sign associated with primary sign: {primarySign.designation || "Unknown"}
                            </div>
                        )}
                    </SheetHeader>
                    <Separator className="w-full -mt-2" />
                </div>
                <div className="space-y-6 p-6">
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
                    <div>
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
                                        disabled={Object.hasOwn(localSign, 'associatedStructure')}
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
                                            {/* MUTCD SIGNS Section */}
                                            {filteredSigns.length > 0 && (
                                                <CommandGroup heading="MUTCD SIGNS">
                                                    {filteredSigns.map((item) => (
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
                                            )}

                                            {/* PATA Kits Section */}
                                            {filteredPataKits.length > 0 && (
                                                <CommandGroup heading="PATA Kits">
                                                    {filteredPataKits.map((kit) => (
                                                        <CommandItem
                                                            key={kit.id}
                                                            value={`pata-${kit.id}`}
                                                            onSelect={() => {
                                                                handleKitSelect(kit, 'pata');
                                                                setDesignationOpen(false);
                                                            }}
                                                        >
                                                            <div className="flex items-center w-full">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">
                                                                        {kit.code}
                                                                    </span>
                                                                    {kit.description && (
                                                                        <span className="text-muted-foreground text-xs truncate max-w-[200px]">
                                                                            {kit.description}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}

                                            {/* PTS Kits Section */}
                                            {filteredPtsKits.length > 0 && (
                                                <CommandGroup heading="PTS Kits">
                                                    {filteredPtsKits.map((kit) => (
                                                        <CommandItem
                                                            key={kit.id}
                                                            value={`pts-${kit.id}`}
                                                            onSelect={() => {
                                                                handleKitSelect(kit, 'pts');
                                                                setDesignationOpen(false);
                                                            }}
                                                        >
                                                            <div className="flex items-center w-full">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">
                                                                        {kit.code}
                                                                    </span>
                                                                    {kit.description && (
                                                                        <span className="text-muted-foreground text-xs truncate max-w-[200px]">
                                                                            {kit.description}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>

                    {/* Substrate (only for takeoff mode) */}
                    {isTakeoff && (
                        <div>
                            <Label className="text-base font-semibold mb-2.5 block">
                                Substrate
                            </Label>
                            <Select
                                value={localSign.substrate}
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
                                    {isSignOrder && (
                                        <>
                                            <SelectItem value="Roll Up">Roll Up</SelectItem>
                                            <SelectItem value="Face">Face</SelectItem>
                                        </>
                                    )}
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
                                        (localSign.width && localSign.height && localSign.width > 0 && localSign.height > 0)
                                            ? `${localSign.width}x${localSign.height}`
                                            : ""
                                    }
                                    onValueChange={handleDimensionSelect}
                                    disabled={getAvailableDimensions().length === 1}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select dimensions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getAvailableDimensions().map((dim, index) => (
                                            <SelectItem key={index} value={`${dim.width}x${dim.height}`}>
                                                {dim.width}&quot; &times; {dim.height}&quot;
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
                                    <SelectItem value="FYG">FYG</SelectItem>
                                    <SelectItem value="TYPEXI">Type XI</SelectItem>
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
                                        value={(localSign as PrimarySign).displayStructure}
                                        onValueChange={(value: DisplayStructures) => handleSignUpdate('displayStructure', value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Choose structure" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="4&apos; T-III RIGHT">4&apos; T-III RIGHT</SelectItem>
                                            <SelectItem value="4&apos; T-III LEFT">4&apos; T-III LEFT</SelectItem>
                                            <SelectItem value="6&apos; T-III RIGHT">6&apos; T-III RIGHT</SelectItem>
                                            <SelectItem value="6&apos; T-III LEFT">6&apos; T-III LEFT</SelectItem>
                                            <SelectItem value="H-FOOT">H-FOOT</SelectItem>
                                            <SelectItem value="8&apos; POST">8&apos; POST</SelectItem>
                                            <SelectItem value="10&apos; POST">10&apos; POST</SelectItem>
                                            <SelectItem value="12&apos; POST">12&apos; POST</SelectItem>
                                            <SelectItem value="14&apos; POST">14&apos; POST</SelectItem>
                                            <SelectItem value="LOOSE">LOOSE</SelectItem>
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
                                    <Select value={localSign.bLightsColor} onValueChange={(value) => handleSignUpdate('bLightsColor', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose color" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Red">Red</SelectItem>
                                            <SelectItem value="Yellow">Yellow</SelectItem>
                                            <SelectItem value="White">White</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Covers and Stiffener */}
                            <div className="grid grid-cols-2 gap-4">
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
                                {isTakeoff && (
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
                                )}
                            </div>
                        </>
                    )}
                </div>
                {/* Action Buttons */}
                {(localSign.quantity < 1 || localSign.width < 1 || localSign.height < 1) && <div className="px-6 py-2 flex items-center text-sm gap-2 text-muted-foreground bg-amber-200">
                    <AlertCircle size={14} />
                    <span>
                        Please fill out all necessary fields before saving.
                    </span>
                </div>}
                <div className="flex justify-end space-x-3 pt-4 px-6 border-t">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={(localSign.quantity < 1 || localSign.width < 1 || localSign.height < 1)}>
                        Save Sign
                    </Button>
                </div>

            </SheetContent>
        </Sheet>,

        {/* Kit Stepper Modal */}
        <Sheet open={kitStepperOpen} onOpenChange={setKitStepperOpen}>
            <SheetContent
                side="right"
                className="w-[800px] flex flex-col p-0 overflow-y-auto"
            >
                <div className="flex flex-col gap-2 relative z-10 bg-background">
                    <SheetHeader className="pb-4 p-6">
                        <SheetTitle>
                            Configure {selectedKit?.code} Kit Signs
                        </SheetTitle>
                        <p className="text-sm text-muted-foreground">
                            Configure each sign in the kit with your preferred settings.
                        </p>
                    </SheetHeader>
                    <Separator className="w-full -mt-2" />
                </div>

                <div className="space-y-6 p-6 flex-1">
                    {kitSignConfigurations.map((config, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    Sign {index + 1}: {config.designation}
                                </h3>
                                <span className="text-sm text-muted-foreground">
                                    Quantity: {config.quantity}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Structure</Label>
                                    <Select
                                        value={config.displayStructure}
                                        onValueChange={(value) => {
                                            const updatedConfigs = [...kitSignConfigurations];
                                            updatedConfigs[index] = {
                                                ...config,
                                                displayStructure: value,
                                                associatedStructure: structureMap[value]
                                            };
                                            setKitSignConfigurations(updatedConfigs);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Choose structure" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="4' T-III RIGHT">4' T-III RIGHT</SelectItem>
                                            <SelectItem value="4' T-III LEFT">4' T-III LEFT</SelectItem>
                                            <SelectItem value="6' T-III RIGHT">6' T-III RIGHT</SelectItem>
                                            <SelectItem value="6' T-III LEFT">6' T-III LEFT</SelectItem>
                                            <SelectItem value="H-FOOT">H-FOOT</SelectItem>
                                            <SelectItem value="8' POST">8' POST</SelectItem>
                                            <SelectItem value="10' POST">10' POST</SelectItem>
                                            <SelectItem value="12' POST">12' POST</SelectItem>
                                            <SelectItem value="14' POST">14' POST</SelectItem>
                                            <SelectItem value="LOOSE">LOOSE</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Substrate</Label>
                                    <Select
                                        value={config.substrate}
                                        onValueChange={(value) => {
                                            const updatedConfigs = [...kitSignConfigurations];
                                            updatedConfigs[index] = { ...config, substrate: value };
                                            setKitSignConfigurations(updatedConfigs);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select substrate" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Aluminum">Aluminum</SelectItem>
                                            <SelectItem value="Aluminum-Composite">Aluminum Composite</SelectItem>
                                            <SelectItem value="Plastic">Plastic</SelectItem>
                                            {isSignOrder && (
                                                <>
                                                    <SelectItem value="Roll Up">Roll Up</SelectItem>
                                                    <SelectItem value="Face">Face</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Sheeting</Label>
                                    <Select
                                        value={config.sheeting}
                                        onValueChange={(value) => {
                                            const updatedConfigs = [...kitSignConfigurations];
                                            updatedConfigs[index] = { ...config, sheeting: value };
                                            setKitSignConfigurations(updatedConfigs);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HI">HI</SelectItem>
                                            <SelectItem value="DG">DG</SelectItem>
                                            <SelectItem value="FYG">FYG</SelectItem>
                                            <SelectItem value="TYPEXI">Type XI</SelectItem>
                                            <SelectItem value="Special">Special</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={config.cover}
                                        onCheckedChange={(checked) => {
                                            const updatedConfigs = [...kitSignConfigurations];
                                            updatedConfigs[index] = { ...config, cover: checked };
                                            setKitSignConfigurations(updatedConfigs);
                                        }}
                                        id={`cover-${index}`}
                                    />
                                    <Label htmlFor={`cover-${index}`} className="text-sm font-medium">
                                        Include cover
                                    </Label>
                                </div>

                                {isTakeoff && (
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={config.stiffener}
                                            onCheckedChange={(checked) => {
                                                const updatedConfigs = [...kitSignConfigurations];
                                                updatedConfigs[index] = { ...config, stiffener: checked };
                                                setKitSignConfigurations(updatedConfigs);
                                            }}
                                            id={`stiffener-${index}`}
                                        />
                                        <Label htmlFor={`stiffener-${index}`} className="text-sm font-medium">
                                            Include stiffener
                                        </Label>
                                    </div>
                                )}
                            </div>

                            <div className="text-sm text-muted-foreground">
                                Dimensions: {config.width}" &times; {config.height}"
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end space-x-3 pt-4 px-6 border-t">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setKitStepperOpen(false);
                            setSelectedKit(null);
                            setKitSignConfigurations([]);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleKitStepperComplete}>
                        Add All Signs to Order
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
        </>
    );
};

export default SignEditingSheet;
