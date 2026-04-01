import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Check, ChevronsUpDown, Search, Plus, Package } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { useSignRuntime } from "@/hooks/use-sign-runtime";
import { fetchSignDesignations } from "@/lib/api-client";
import { PrimarySign, SecondarySign, SheetingType, EquipmentType, SignDesignation, structureMap, DisplayStructures, AssociatedStructures, PataKit, PtsKit, SignsApiResponse } from '@/types/MPTEquipment';
import { processSignData } from '@/components/pages/active-bid/signs/process-sign-data';
import { generateUniqueId } from '@/components/pages/active-bid/signs/generate-stable-id';
import { Separator } from '@/components/ui/separator';
import { QuantityInput } from '@/components/ui/quantity-input';
import { logSignOrderDebug } from '@/lib/log-sign-order-debug';

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

const SIGN_ORDER_STRUCTURE_OPTIONS: DisplayStructures[] = [
    "4' T-III RIGHT",
    "4' T-III LEFT",
    "6' T-III RIGHT",
    "6' T-III LEFT",
    "H-FOOT",
    "8' POST",
    "10' POST",
    "12' POST",
    "14' POST",
    "LOOSE",
];

const SIGN_ORDER_SHEETING_OPTIONS = ["HI", "DG", "FYG", "TYPEXI", "Special"] as const;
const SIGN_ORDER_SUBSTRATE_OPTIONS = ["Aluminum", "Aluminum-Composite", "Plastic", "Roll Up", "Face"] as const;
const SIGN_ORDER_B_LIGHT_OPTIONS = [
    { quantity: 1, color: 'White' as const, label: '1 White' },
    { quantity: 1, color: 'Yellow' as const, label: '1 Yellow' },
    { quantity: 1, color: 'Red' as const, label: '1 Red' },
    { quantity: 2, color: 'White' as const, label: '2 White' },
    { quantity: 2, color: 'Yellow' as const, label: '2 Yellow' },
    { quantity: 2, color: 'Red' as const, label: '2 Red' },
] as const;

const SignEditingSheet = ({ open, onOpenChange, mode, sign, currentPhase = 0, isTakeoff = true, isSignOrder }: Props) => {
    const { dispatch, mptRental } = useSignRuntime();
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
    const [signOrderStep, setSignOrderStep] = useState<'designation' | 'dimension' | 'configuration'>('designation');
    const [activePickerTab, setActivePickerTab] = useState<'mutcd' | 'pata' | 'pts'>('mutcd');
    const [mutcdSearch, setMutcdSearch] = useState('');
    const [pataSearch, setPataSearch] = useState('');
    const [ptsSearch, setPtsSearch] = useState('');

    const isSecondary = isSecondarySign(sign);
    const isSignOrderFlow = Boolean(isSignOrder && !isSecondary);
    const isSignOrderConfigOnly = Boolean(isSignOrder && !isSecondary && !isCustom);
    const showSubstrateField = Boolean(isTakeoff || isSignOrder);
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

    useEffect(() => {
        if (!open) {
            return;
        }

        if (!isSignOrderFlow) {
            setSignOrderStep('configuration');
            return;
        }

        const hasCompleteSelection = Boolean(sign.designation && sign.width > 0 && sign.height > 0);
        const hasDesignation = Boolean(sign.designation);

        if (mode === 'edit' || sign.isCustom || hasCompleteSelection) {
            setSignOrderStep('configuration');
        } else if (hasDesignation) {
            setSignOrderStep('dimension');
        } else {
            setSignOrderStep('designation');
        }
    }, [isSignOrderFlow, mode, open, sign]);

    useEffect(() => {
        logSignOrderDebug('sign_configuration_modal_state', {
            open,
            mode,
            currentPhase,
            signId: localSign?.id ?? null,
            designation: localSign?.designation ?? null,
            width: localSign?.width ?? null,
            height: localSign?.height ?? null,
            quantity: localSign?.quantity ?? null,
            displayStructure: 'displayStructure' in localSign ? localSign.displayStructure ?? null : null,
            substrate: localSign?.substrate ?? null,
            sheeting: localSign?.sheeting ?? null,
        });
    }, [
        currentPhase,
        localSign?.designation,
        localSign?.height,
        localSign?.id,
        localSign?.quantity,
        localSign?.sheeting,
        localSign?.substrate,
        localSign?.width,
        mode,
        open,
        'displayStructure' in localSign ? localSign.displayStructure : null,
    ]);

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

    const filterKits = (searchTerm: string, kitType: 'pata' | 'pts') => {
        if (kitType === 'pata') {
            const allPataKits = apiData?.pataKits || [];
            if (!searchTerm.trim()) {
                setFilteredPataKits(allPataKits);
                return;
            }

            const query = searchTerm.toLowerCase();
            const filteredPata = allPataKits.filter((kit) =>
                kit.code.toLowerCase().includes(query) ||
                (kit.description || '').toLowerCase().includes(query) ||
                kit.contents.some((content) => content.sign_designation.toLowerCase().includes(query))
            );

            setFilteredPataKits(filteredPata);
        } else {
            const allPtsKits = apiData?.ptsKits || [];
            if (!searchTerm.trim()) {
                setFilteredPtsKits(allPtsKits);
                return;
            }

            const query = searchTerm.toLowerCase();
            const filteredPts = allPtsKits.filter((kit) =>
                kit.code.toLowerCase().includes(query) ||
                (kit.description || '').toLowerCase().includes(query) ||
                kit.contents.some((content) => content.sign_designation.toLowerCase().includes(query))
            );

            setFilteredPtsKits(filteredPts);
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

    const handleSignOrderDesignationSelect = (designation: SignDesignation) => {
        logSignOrderDebug('sign_order_step_designation_selected', {
            currentPhase,
            signId: localSign?.id ?? null,
            designation: designation.designation,
            dimensions: designation.dimensions?.length ?? 0,
        });

        const nextBase = {
            ...localSign,
            designation: designation.designation,
            sheeting: designation.sheeting,
            description: designation.description,
            isCustom: false,
        };

        if (designation.dimensions?.length === 1) {
            const [dimension] = designation.dimensions;
            setLocalSign({
                ...nextBase,
                width: dimension.width,
                height: dimension.height,
            });
            setSignOrderStep('configuration');
            return;
        }

        setLocalSign({
            ...nextBase,
            width: 0,
            height: 0,
        });
        setSignOrderStep('dimension');
    };

    const handleSignOrderDimensionPicked = (width: number, height: number) => {
        logSignOrderDebug('sign_order_step_dimension_selected', {
            currentPhase,
            signId: localSign?.id ?? null,
            designation: localSign?.designation ?? null,
            width,
            height,
        });
        setLocalSign((prev) => ({
            ...prev,
            width,
            height,
        }));
        setSignOrderStep('configuration');
    };

    const handleSignOrderBLightSelect = (quantity: 1 | 2, color: 'White' | 'Yellow' | 'Red') => {
        const isSelected = (localSign as PrimarySign).bLights === quantity && localSign.bLightsColor === color;

        handleSignUpdate("bLights", isSelected ? 0 : quantity);
        handleSignUpdate("bLightsColor", isSelected ? undefined : color);
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

    const selectedDesignationInfo = filteredSigns.find(
        (d) => d.designation === localSign.designation
    );
    const availableDimensions = getAvailableDimensions();

    const handleSave = () => {
        logSignOrderDebug('sign_configuration_save_clicked', {
            mode,
            currentPhase,
            signId: localSign?.id ?? null,
            designation: localSign?.designation ?? null,
            width: localSign?.width ?? null,
            height: localSign?.height ?? null,
            quantity: localSign?.quantity ?? null,
            displayStructure: 'displayStructure' in localSign ? localSign.displayStructure ?? null : null,
            substrate: localSign?.substrate ?? null,
            sheeting: localSign?.sheeting ?? null,
        });
        // For secondary signs, make sure the quantity matches the primary sign
        let signToSave = localSign;
        if (isSecondary && primarySign) {
            signToSave = {
                ...localSign,
                quantity: primarySign.quantity
            };
        }

        if (mode === 'create') {
            dispatch({
                type: 'ADD_MPT_SIGN',
                payload: {
                    phaseNumber: currentPhase,
                    sign: signToSave,
                },
            });
        } else {
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
        }
        onOpenChange(false);
    };

    const handleCancel = () => {
        setIsCustom(sign.isCustom || false);
        logSignOrderDebug('sign_configuration_cancel_clicked', {
            mode,
            currentPhase,
            signId: localSign?.id ?? null,
            designation: localSign?.designation ?? null,
        });
        onOpenChange(false);
    };

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="relative z-10 shrink-0 bg-background">
                    <DialogHeader className="p-6 pb-4 text-left">
                        <DialogTitle>
                            {isSignOrderFlow && signOrderStep === 'designation'
                                ? 'Select Sign Designation'
                                : isSignOrderFlow && signOrderStep === 'dimension'
                                    ? `Select Size for ${localSign.designation || 'Sign'}`
                                    : `${mode === 'create' ? 'Add' : 'Edit'} ${isCustom ? 'Custom sign' : (localSign.designation || 'Sign')} details`}
                        </DialogTitle>
                        {isSecondary && primarySign && (
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-md text-sm">
                                Secondary sign associated with primary sign: {primarySign.designation || "Unknown"}
                            </div>
                        )}
                    </DialogHeader>
                    <Separator className="w-full" />
                </div>
                {isSignOrderFlow && signOrderStep === 'designation' && (
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        <Tabs value={activePickerTab} onValueChange={(value) => setActivePickerTab(value as 'mutcd' | 'pata' | 'pts')} className="flex flex-col gap-4">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="mutcd">MUTCD Signs</TabsTrigger>
                                <TabsTrigger value="pata">PATA Kits</TabsTrigger>
                                <TabsTrigger value="pts">PTS Kits</TabsTrigger>
                            </TabsList>

                            <TabsContent value="mutcd" className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={mutcdSearch}
                                        placeholder="Search MUTCD designations..."
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setMutcdSearch(value);
                                            filterDesignations(value);
                                        }}
                                        className="pl-10"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustom(true);
                                        setLocalSign((prev) => ({
                                            ...prev,
                                            designation: '',
                                            width: 0,
                                            height: 0,
                                            description: '',
                                            quantity: prev.quantity && prev.quantity > 0 ? prev.quantity : 1,
                                            isCustom: true,
                                        }));
                                        setSignOrderStep('configuration');
                                    }}
                                    className="w-full rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
                                >
                                    <div className="flex items-start gap-3">
                                        <Plus className="mt-0.5 h-5 w-5 text-primary" />
                                        <div>
                                            <div className="font-medium text-primary">Custom Sign</div>
                                            <div className="text-sm text-muted-foreground">Create a custom sign designation not in the database</div>
                                        </div>
                                    </div>
                                </button>
                                {filteredSigns.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">No designations found.</div>
                                ) : (
                                    filteredSigns.map((designation) => (
                                        <button
                                            key={designation.designation}
                                            type="button"
                                            onClick={() => handleSignOrderDesignationSelect(designation)}
                                            className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded border bg-muted flex-shrink-0">
                                                        {designation.image_url ? (
                                                            <img
                                                                src={designation.image_url}
                                                                alt={designation.designation}
                                                                className="h-full w-full object-contain p-1"
                                                            />
                                                        ) : (
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {designation.designation.substring(0, 2).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{designation.designation}</div>
                                                        <div className="text-sm text-muted-foreground">{designation.description || '-'}</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {designation.dimensions?.length || 0} size{designation.dimensions?.length === 1 ? '' : 's'}
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </TabsContent>

                            <TabsContent value="pata" className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={pataSearch}
                                        placeholder="Search PATA kits..."
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setPataSearch(value);
                                            filterKits(value, 'pata');
                                        }}
                                        className="pl-10"
                                    />
                                </div>
                                {filteredPataKits.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">No PATA kits found.</div>
                                ) : (
                                    filteredPataKits.map((kit) => (
                                        <button
                                            key={kit.id}
                                            type="button"
                                            onClick={() => handleKitSelect(kit, 'pata')}
                                            className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded border bg-muted flex-shrink-0">
                                                    {kit.image_url ? (
                                                        <img
                                                            src={kit.image_url}
                                                            alt={kit.code}
                                                            className="h-full w-full object-contain p-1"
                                                        />
                                                    ) : (
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">{kit.code}</div>
                                                    <div className="text-sm text-muted-foreground">{kit.description || '-'}</div>
                                                    <div className="mt-1 text-xs text-muted-foreground">{kit.contents.length} sign{kit.contents.length === 1 ? '' : 's'}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </TabsContent>

                            <TabsContent value="pts" className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={ptsSearch}
                                        placeholder="Search PTS kits..."
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setPtsSearch(value);
                                            filterKits(value, 'pts');
                                        }}
                                        className="pl-10"
                                    />
                                </div>
                                {filteredPtsKits.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">No PTS kits found.</div>
                                ) : (
                                    filteredPtsKits.map((kit) => (
                                        <button
                                            key={kit.id}
                                            type="button"
                                            onClick={() => handleKitSelect(kit, 'pts')}
                                            className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded border bg-muted flex-shrink-0">
                                                    {kit.image_url ? (
                                                        <img
                                                            src={kit.image_url}
                                                            alt={kit.code}
                                                            className="h-full w-full object-contain p-1"
                                                        />
                                                    ) : (
                                                        <Package className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">{kit.code}</div>
                                                    <div className="text-sm text-muted-foreground">{kit.description || '-'}</div>
                                                    <div className="mt-1 text-xs text-muted-foreground">{kit.contents.length} sign{kit.contents.length === 1 ? '' : 's'}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
                {isSignOrderFlow && signOrderStep === 'dimension' && (
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded border bg-background flex-shrink-0">
                                    {selectedDesignationInfo?.image_url ? (
                                        <img
                                            src={selectedDesignationInfo.image_url}
                                            alt={localSign.designation || 'Selected sign'}
                                            className="h-full w-full object-contain p-1"
                                        />
                                    ) : (
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {(localSign.designation || '').substring(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium">{localSign.designation || '-'}</div>
                                    <div className="text-sm text-muted-foreground">{selectedDesignationInfo?.description || localSign.description || '-'}</div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availableDimensions.map((dim) => (
                                <button
                                    key={`${dim.width}x${dim.height}`}
                                    type="button"
                                    onClick={() => handleSignOrderDimensionPicked(dim.width, dim.height)}
                                    className="rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                                >
                                    <div className="font-medium">{dim.width}&quot; x {dim.height}&quot;</div>
                                    <div className="text-xs text-muted-foreground mt-1">{localSign.sheeting || selectedDesignationInfo?.sheeting || '-'}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {(!isSignOrderFlow || signOrderStep === 'configuration') && (
                <div className="flex-1 overflow-y-auto space-y-6 px-6 py-4">
                    {/* Custom Sign Toggle */}
                    {!isSignOrderFlow && (
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
                    )}

                    {/* Designation Section */}
                    {isSignOrderConfigOnly ? (
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <Label className="text-base font-semibold mb-2.5 block">
                                Sign Selection
                            </Label>
                            <div className="flex items-start gap-3">
                                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded border bg-background flex-shrink-0">
                                    {selectedDesignationInfo?.image_url ? (
                                        <img
                                            src={selectedDesignationInfo.image_url}
                                            alt={localSign.designation || 'Selected sign'}
                                            className="h-full w-full object-contain p-1"
                                        />
                                    ) : (
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {(localSign.designation || '').substring(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="grid flex-1 grid-cols-1 gap-4 text-sm md:grid-cols-3">
                                    <div>
                                        <div className="text-muted-foreground">Designation</div>
                                        <div className="font-medium">{localSign.designation || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Dimensions</div>
                                        <div className="font-medium">
                                            {localSign.width > 0 && localSign.height > 0
                                                ? `${localSign.width}" x ${localSign.height}"`
                                                : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Quantity</div>
                                        <div className="pt-1">
                                            <QuantityInput
                                                value={isSecondary && primarySign ? primarySign.quantity : localSign.quantity || 1}
                                                onChange={(value) => handleSignUpdate("quantity", value)}
                                                min={1}
                                                disabled={isSecondary}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
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
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {!isSecondary && (
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Structure</Label>
                                {isSignOrderFlow ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                                            {SIGN_ORDER_STRUCTURE_OPTIONS.slice(0, 4).map((option) => {
                                                const selected = (localSign as PrimarySign).displayStructure === option;
                                                return (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => handleSignUpdate('displayStructure', option)}
                                                        className={cn(
                                                            "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                                            selected
                                                                ? "border-primary bg-primary/10 text-primary"
                                                                : "border-border hover:bg-muted/50"
                                                        )}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                                            {SIGN_ORDER_STRUCTURE_OPTIONS.slice(5, 9).map((option) => {
                                                const selected = (localSign as PrimarySign).displayStructure === option;
                                                return (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => handleSignUpdate('displayStructure', option)}
                                                        className={cn(
                                                            "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                                            selected
                                                                ? "border-primary bg-primary/10 text-primary"
                                                                : "border-border hover:bg-muted/50"
                                                        )}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[SIGN_ORDER_STRUCTURE_OPTIONS[4], SIGN_ORDER_STRUCTURE_OPTIONS[9]].map((option) => {
                                                const selected = (localSign as PrimarySign).displayStructure === option;
                                                return (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => handleSignUpdate('displayStructure', option)}
                                                        className={cn(
                                                            "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                                            selected
                                                                ? "border-primary bg-primary/10 text-primary"
                                                                : "border-border hover:bg-muted/50"
                                                        )}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <Select
                                        value={(localSign as PrimarySign).displayStructure}
                                        onValueChange={(value: DisplayStructures) => handleSignUpdate('displayStructure', value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Choose structure" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SIGN_ORDER_STRUCTURE_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}
                        <div>
                            <Label className="text-sm font-medium mb-2 block">Sheeting</Label>
                            {isSignOrderFlow ? (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                                    {SIGN_ORDER_SHEETING_OPTIONS.map((option) => {
                                        const selected = (localSign.sheeting || "HI") === option;
                                        return (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => handleSignUpdate("sheeting", option)}
                                                className={cn(
                                                    "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                                    selected
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border hover:bg-muted/50"
                                                )}
                                            >
                                                {option === "TYPEXI" ? "Type XI" : option}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Select
                                    value={localSign.sheeting || "HI"}
                                    onValueChange={(value) => handleSignUpdate("sheeting", value)}
                                    disabled={!localSign.isCustom && !isSignOrder}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SIGN_ORDER_SHEETING_OPTIONS.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option === "TYPEXI" ? "Type XI" : option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

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
                        ) : isSignOrderConfigOnly ? (
                            <></>
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

                    {/* Primary Sign Specific Fields */}
                    {!isSecondary && (
                        <>
                            {showSubstrateField && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">
                                            Substrate
                                        </Label>
                                        {isSignOrderFlow ? (
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                                                {SIGN_ORDER_SUBSTRATE_OPTIONS.map((option) => {
                                                    if (!isSignOrder && (option === "Roll Up" || option === "Face")) {
                                                        return null;
                                                    }
                                                    const selected = localSign.substrate === option;
                                                    return (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            onClick={() => handleSignUpdate("substrate", option)}
                                                            className={cn(
                                                                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                                                selected
                                                                    ? "border-primary bg-primary/10 text-primary"
                                                                    : "border-border hover:bg-muted/50"
                                                            )}
                                                        >
                                                            {option === "Aluminum-Composite" ? "Aluminum Composite" : option}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
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
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-end gap-6 pb-2">
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
                                </div>
                            )}

                            {isSignOrderFlow ? (
                                <div className="space-y-4">
                                    {!isSignOrderConfigOnly && (
                                        <div>
                                            <Label className="text-sm font-medium mb-2 block">Quantity</Label>
                                            <QuantityInput
                                                value={isSecondary && primarySign ? primarySign.quantity : localSign.quantity || 1}
                                                onChange={(value) => handleSignUpdate("quantity", value)}
                                                min={1}
                                                disabled={isSecondary}
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">B Lights</Label>
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-3 gap-2">
                                                {SIGN_ORDER_B_LIGHT_OPTIONS.slice(0, 3).map((option) => {
                                                    const selected = (localSign as PrimarySign).bLights === option.quantity && localSign.bLightsColor === option.color;
                                                    return (
                                                        <button
                                                            key={option.label}
                                                            type="button"
                                                            onClick={() => handleSignOrderBLightSelect(option.quantity, option.color)}
                                                            className={cn(
                                                                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                                                selected
                                                                    ? "border-primary bg-primary/10 text-primary"
                                                                    : "border-border hover:bg-muted/50"
                                                            )}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {SIGN_ORDER_B_LIGHT_OPTIONS.slice(3).map((option) => {
                                                    const selected = (localSign as PrimarySign).bLights === option.quantity && localSign.bLightsColor === option.color;
                                                    return (
                                                        <button
                                                            key={option.label}
                                                            type="button"
                                                            onClick={() => handleSignOrderBLightSelect(option.quantity, option.color)}
                                                            className={cn(
                                                                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                                                selected
                                                                    ? "border-primary bg-primary/10 text-primary"
                                                                    : "border-border hover:bg-muted/50"
                                                            )}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium mb-2 block">Quantity</Label>
                                            <QuantityInput
                                                value={isSecondary && primarySign ? primarySign.quantity : localSign.quantity || 0}
                                                onChange={(value) => handleSignUpdate("quantity", value)}
                                                min={0}
                                                disabled={isSecondary}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium mb-2 block">
                                                B Light Quantity
                                            </Label>
                                            <QuantityInput
                                                value={(localSign as PrimarySign).bLights || 0}
                                                onChange={(value) => handleSignUpdate("bLights", value)}
                                                min={0}
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
                                </>
                            )}

                        </>
                    )}
                </div>
                )}
                {/* Action Buttons */}
                {(!isSignOrderFlow || signOrderStep === 'configuration') && (localSign.quantity < 1 || localSign.width < 1 || localSign.height < 1) && <div className="px-6 py-2 flex items-center text-sm gap-2 text-muted-foreground bg-amber-200">
                    <AlertCircle size={14} />
                    <span>
                        Please fill out all necessary fields before saving.
                    </span>
                </div>}
                <div className="flex shrink-0 justify-end space-x-3 border-t bg-background px-6 py-4">
                    {isSignOrderFlow && signOrderStep !== 'designation' && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (signOrderStep === 'configuration') {
                                    setSignOrderStep(availableDimensions.length > 1 ? 'dimension' : 'designation');
                                } else {
                                    setSignOrderStep('designation');
                                }
                            }}
                        >
                            Back
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    {(!isSignOrderFlow || signOrderStep === 'configuration') && (
                        <Button onClick={handleSave} disabled={(localSign.quantity < 1 || localSign.width < 1 || localSign.height < 1)}>
                            Save Sign
                        </Button>
                    )}
                </div>

            </DialogContent>
        </Dialog>,

        {/* Kit Stepper Modal */}
        <Dialog open={kitStepperOpen} onOpenChange={setKitStepperOpen}>
            <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="relative z-10 shrink-0 bg-background">
                    <DialogHeader className="p-6 pb-4 text-left">
                        <DialogTitle>
                            Configure {selectedKit?.code} Kit Signs
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Configure each sign in the kit with your preferred settings.
                        </p>
                    </DialogHeader>
                    <Separator className="w-full" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 p-6">
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
                                Dimensions: {config.width}&quot; &times; {config.height}&quot;
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex shrink-0 justify-end space-x-3 border-t bg-background px-6 py-4">
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
            </DialogContent>
        </Dialog>
        </>
    );
};

export default SignEditingSheet;
