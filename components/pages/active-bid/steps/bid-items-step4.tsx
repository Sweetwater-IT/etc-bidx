"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useState } from "react";

interface MPTData {
    mptEquipment: {
        typeIII: number;
        wings: number;
        hStands: number;
        posts: number;
        covers: number;
        metalStands: number;
        sandbags: number;
    };
    lightAndDrum: {
        hiVerticalPanels: number;
        typeXIVerticalPanels: number;
        bLights: number;
        acLights: number;
    };
}

interface EquipmentRentalData {
    arrowBoard: {
        type25: number;
        type75: number;
        solarAssist: number;
    };
    messageBoard: {
        fullSize: number;
        miniSize: number;
        radar: number;
    };
    attenuator: {
        standard: number;
        smart: number;
    };
    trailer: {
        equipment: number;
        storage: number;
        arrow: number;
        light: number;
    };
}

interface PermanentSignsData {
    regulatory: {
        stop: number;
        yield: number;
        speedLimit: number;
        noParking: number;
        oneWay: number;
        doNotEnter: number;
    };
    warning: {
        pedestrian: number;
        school: number;
        merge: number;
        curve: number;
        intersection: number;
    };
    guide: {
        street: number;
        highway: number;
        mile: number;
        exit: number;
        directional: number;
    };
    custom: {
        size: string;
        quantity: number;
        description: string;
    };
}

interface FlaggingData {
    services: {
        trafficControl: number;
        policeDetail: number;
        uniformedFlagger: number;
        trafficSupervisor: number;
    };
    equipment: {
        radioUnit: number;
        safetyVest: number;
        stopSlowPaddle: number;
        flags: number;
    };
}

interface SaleItemsData {
    materials: {
        concrete: number;
        asphalt: number;
        gravel: number;
        sand: number;
    };
    tools: {
        shovels: number;
        rakes: number;
        wheelbarrows: number;
        safetyCones: number;
    };
    supplies: {
        paint: number;
        markers: number;
        tape: number;
        signs: number;
    };
}

interface PatternsData {
    pavement: {
        milling: number;
        overlay: number;
        fullDepth: number;
        patching: number;
    };
    markings: {
        thermoplastic: number;
        paint: number;
        epoxy: number;
        preformed: number;
    };
    configurations: {
        laneClosure: number;
        shoulderWork: number;
        intersection: number;
        workZone: number;
    };
}

const BidItemsStep4 = ({
    currentStep,
    setCurrentStep
}: {
    currentStep: number;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
}) => {
    const [activeTab, setActiveTab] = useState("mpt");
    const [mptData, setMptData] = useState<MPTData>({
        mptEquipment: {
            typeIII: 0,
            wings: 0,
            hStands: 0,
            posts: 0,
            covers: 0,
            metalStands: 0,
            sandbags: 0,
        },
        lightAndDrum: {
            hiVerticalPanels: 0,
            typeXIVerticalPanels: 0,
            bLights: 0,
            acLights: 0,
        },
    });

    const [equipmentRental, setEquipmentRental] = useState<EquipmentRentalData>({
        arrowBoard: {
            type25: 0,
            type75: 0,
            solarAssist: 0,
        },
        messageBoard: {
            fullSize: 0,
            miniSize: 0,
            radar: 0,
        },
        attenuator: {
            standard: 0,
            smart: 0,
        },
        trailer: {
            equipment: 0,
            storage: 0,
            arrow: 0,
            light: 0,
        },
    });

    const [permanentSigns, setPermanentSigns] = useState<PermanentSignsData>({
        regulatory: {
            stop: 0,
            yield: 0,
            speedLimit: 0,
            noParking: 0,
            oneWay: 0,
            doNotEnter: 0,
        },
        warning: {
            pedestrian: 0,
            school: 0,
            merge: 0,
            curve: 0,
            intersection: 0,
        },
        guide: {
            street: 0,
            highway: 0,
            mile: 0,
            exit: 0,
            directional: 0,
        },
        custom: {
            size: '',
            quantity: 0,
            description: '',
        },
    });

    const [flagging, setFlagging] = useState<FlaggingData>({
        services: {
            trafficControl: 0,
            policeDetail: 0,
            uniformedFlagger: 0,
            trafficSupervisor: 0,
        },
        equipment: {
            radioUnit: 0,
            safetyVest: 0,
            stopSlowPaddle: 0,
            flags: 0,
        },
    });

    const [saleItems, setSaleItems] = useState<SaleItemsData>({
        materials: {
            concrete: 0,
            asphalt: 0,
            gravel: 0,
            sand: 0,
        },
        tools: {
            shovels: 0,
            rakes: 0,
            wheelbarrows: 0,
            safetyCones: 0,
        },
        supplies: {
            paint: 0,
            markers: 0,
            tape: 0,
            signs: 0,
        },
    });

    const [patterns, setPatterns] = useState<PatternsData>({
        pavement: {
            milling: 0,
            overlay: 0,
            fullDepth: 0,
            patching: 0,
        },
        markings: {
            thermoplastic: 0,
            paint: 0,
            epoxy: 0,
            preformed: 0,
        },
        configurations: {
            laneClosure: 0,
            shoulderWork: 0,
            intersection: 0,
            workZone: 0,
        },
    });

    const handleMPTInputChange = (section: 'mptEquipment' | 'lightAndDrum', field: string, value: string) => {
        const numValue = value === '' ? 0 : parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;

        setMptData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: numValue
            }
        }));
    };

    const handleEquipmentRentalChange = (section: keyof EquipmentRentalData, field: string, value: string) => {
        const numValue = value === '' ? 0 : parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;

        setEquipmentRental(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: numValue
            }
        }));
    };

    const handlePermanentSignsChange = (section: keyof PermanentSignsData, field: string, value: string) => {
        setPermanentSigns(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: field === 'quantity' ? (value === '' ? 0 : parseInt(value, 10)) : value
            }
        }));
    };

    const handleFlaggingChange = (section: keyof FlaggingData, field: string, value: string) => {
        const numValue = value === '' ? 0 : parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;

        setFlagging(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: numValue
            }
        }));
    };

    const handleSaleItemsChange = (section: keyof SaleItemsData, field: string, value: string) => {
        const numValue = value === '' ? 0 : parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;

        setSaleItems(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: numValue
            }
        }));
    };

    const handlePatternsChange = (section: keyof PatternsData, field: string, value: string) => {
        const numValue = value === '' ? 0 : parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;

        setPatterns(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: numValue
            }
        }));
    };

    return (
            <div className="relative">
            {/* Step Header */}
                <button
                    onClick={() => setCurrentStep(4)}
                    className={`group flex w-full items-start gap-4 py-4 text-left ${currentStep === 4 ? "text-foreground" : "text-muted-foreground"}`}
                >
                    <div
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                        currentStep >= 4 
                            ? "border-primary bg-primary text-primary-foreground" 
                            : "border-muted-foreground bg-background text-muted-foreground"
                        }`}
                    >
                        4
                    </div>
                    <div className="flex flex-col gap-1">
                    <div className="text-base font-medium">Bid Items</div>
                    <div className="text-sm text-muted-foreground">Add and manage bid items</div>
                    </div>
                </button>

            {/* Step Content */}
                {currentStep === 4 && (
                <div className="mt-2 mb-6 ml-12">
                    <Tabs defaultValue="mpt" className="w-full" onValueChange={setActiveTab} value={activeTab}>
                        <TabsList className="w-full border-0 bg-transparent p-0 [&>*]:border-0">
                            <TabsTrigger 
                                value="mpt" 
                                className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                            >
                                MPT
                            </TabsTrigger>
                            <TabsTrigger 
                                value="equipment" 
                                className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                            >
                                Equipment Rental
                            </TabsTrigger>
                            <TabsTrigger 
                                value="permanent" 
                                className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                            >
                                Permanent Signs
                            </TabsTrigger>
                            <TabsTrigger 
                                value="flagging" 
                                className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                            >
                                Flagging
                            </TabsTrigger>
                            <TabsTrigger 
                                value="sale" 
                                className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                            >
                                Sale Items
                            </TabsTrigger>
                            <TabsTrigger 
                                value="patterns" 
                                className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                            >
                                Patterns
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="mpt" className="mt-6">
                            {/* MPT Equipment Section */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-base font-semibold mb-4">MPT Equipment</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="typeIII" className="text-sm font-medium">4&apos; Ft Type III</Label>
                                            <Input
                                                id="typeIII"
                                                type="number"
                                                min="0"
                                                value={mptData.mptEquipment.typeIII || ''}
                                                onChange={(e) => handleMPTInputChange('mptEquipment', 'typeIII', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="wings" className="text-sm font-medium">6 Ft Wings</Label>
                                            <Input
                                                id="wings"
                                                type="number"
                                                min="0"
                                                value={mptData.mptEquipment.wings || ''}
                                                onChange={(e) => handleMPTInputChange('mptEquipment', 'wings', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hStands" className="text-sm font-medium">H Stands</Label>
                                            <Input
                                                id="hStands"
                                                type="number"
                                                min="0"
                                                value={mptData.mptEquipment.hStands || ''}
                                                onChange={(e) => handleMPTInputChange('mptEquipment', 'hStands', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="posts" className="text-sm font-medium">Posts</Label>
                                            <Input
                                                id="posts"
                                                type="number"
                                                min="0"
                                                value={mptData.mptEquipment.posts || ''}
                                                onChange={(e) => handleMPTInputChange('mptEquipment', 'posts', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="covers" className="text-sm font-medium">Covers</Label>
                                            <Input
                                                id="covers"
                                                type="number"
                                                min="0"
                                                value={mptData.mptEquipment.covers || ''}
                                                onChange={(e) => handleMPTInputChange('mptEquipment', 'covers', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="metalStands" className="text-sm font-medium">Metal Stands</Label>
                                            <Input
                                                id="metalStands"
                                                type="number"
                                                min="0"
                                                value={mptData.mptEquipment.metalStands || ''}
                                                onChange={(e) => handleMPTInputChange('mptEquipment', 'metalStands', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label htmlFor="sandbags" className="text-sm font-medium">Sandbags, Empty</Label>
                                            <Input
                                                id="sandbags"
                                                type="number"
                                                min="0"
                                                value={mptData.mptEquipment.sandbags || ''}
                                                onChange={(e) => handleMPTInputChange('mptEquipment', 'sandbags', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Light and Drum Rental Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Light and Drum Rental</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="hiVerticalPanels" className="text-sm font-medium">HI Vertical Panels</Label>
                                            <Input
                                                id="hiVerticalPanels"
                                                type="number"
                                                min="0"
                                                value={mptData.lightAndDrum.hiVerticalPanels || ''}
                                                onChange={(e) => handleMPTInputChange('lightAndDrum', 'hiVerticalPanels', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="typeXIVerticalPanels" className="text-sm font-medium">Type XI Vertical Panels</Label>
                                            <Input
                                                id="typeXIVerticalPanels"
                                                type="number"
                                                min="0"
                                                value={mptData.lightAndDrum.typeXIVerticalPanels || ''}
                                                onChange={(e) => handleMPTInputChange('lightAndDrum', 'typeXIVerticalPanels', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bLights" className="text-sm font-medium">B-Lights</Label>
                                            <Input
                                                id="bLights"
                                                type="number"
                                                min="0"
                                                value={mptData.lightAndDrum.bLights || ''}
                                                onChange={(e) => handleMPTInputChange('lightAndDrum', 'bLights', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="acLights" className="text-sm font-medium">A-C Lights</Label>
                                            <Input
                                                id="acLights"
                                                type="number"
                                                min="0"
                                                value={mptData.lightAndDrum.acLights || ''}
                                                onChange={(e) => handleMPTInputChange('lightAndDrum', 'acLights', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="equipment" className="mt-6">
                            <div className="space-y-6">
                                {/* Arrow Board Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Arrow Board</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="type25" className="text-sm font-medium">Type 25</Label>
                                            <Input
                                                id="type25"
                                                type="number"
                                                min="0"
                                                value={equipmentRental.arrowBoard.type25 || ''}
                                                onChange={(e) => handleEquipmentRentalChange('arrowBoard', 'type25', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="type75" className="text-sm font-medium">Type 75</Label>
                                            <Input
                                                id="type75"
                                                type="number"
                                                min="0"
                                                value={equipmentRental.arrowBoard.type75 || ''}
                                                onChange={(e) => handleEquipmentRentalChange('arrowBoard', 'type75', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="solarAssist" className="text-sm font-medium">Solar Assist</Label>
                                            <Input
                                                id="solarAssist"
                                                type="number"
                                                min="0"
                                                value={equipmentRental.arrowBoard.solarAssist || ''}
                                                onChange={(e) => handleEquipmentRentalChange('arrowBoard', 'solarAssist', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Message Board Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Message Board</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullSize" className="text-sm font-medium">Full Size</Label>
                                            <Input
                                                id="fullSize"
                                                type="number"
                                                min="0"
                                                value={equipmentRental.messageBoard.fullSize || ''}
                                                onChange={(e) => handleEquipmentRentalChange('messageBoard', 'fullSize', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="miniSize" className="text-sm font-medium">Mini Size</Label>
                                            <Input
                                                id="miniSize"
                                                type="number"
                                                min="0"
                                                value={equipmentRental.messageBoard.miniSize || ''}
                                                onChange={(e) => handleEquipmentRentalChange('messageBoard', 'miniSize', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="radar" className="text-sm font-medium">Radar</Label>
                                            <Input
                                                id="radar"
                                                type="number"
                                                min="0"
                                                value={equipmentRental.messageBoard.radar || ''}
                                                onChange={(e) => handleEquipmentRentalChange('messageBoard', 'radar', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Attenuator Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Attenuator</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="standard" className="text-sm font-medium">Standard</Label>
                                            <Input
                                                id="standard"
                                                type="number"
                                                min="0"
                                                value={equipmentRental.attenuator.standard || ''}
                                                onChange={(e) => handleEquipmentRentalChange('attenuator', 'standard', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smart" className="text-sm font-medium">Smart</Label>
                                            <Input
                                                id="smart"
                                                type="number"
                                                min="0"
                                                value={equipmentRental.attenuator.smart || ''}
                                                onChange={(e) => handleEquipmentRentalChange('attenuator', 'smart', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Trailer Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Trailer</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="equipment" className="text-sm font-medium">Equipment</Label>
                                            <Input
                                                id="equipment"
                                                type="number"
                                                min="0"
                                                value={equipmentRental.trailer.equipment || ''}
                                                onChange={(e) => handleEquipmentRentalChange('trailer', 'equipment', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="storage" className="text-sm font-medium">Storage</Label>
                                            <Input
                                                id="storage"
                                                type="number"
                                                min="0"
                                                value={equipmentRental.trailer.storage || ''}
                                                onChange={(e) => handleEquipmentRentalChange('trailer', 'storage', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="arrow" className="text-sm font-medium">Arrow</Label>
                                            <Input
                                                id="arrow"
                                                type="number"
                                                min="0"
                                                value={equipmentRental.trailer.arrow || ''}
                                                onChange={(e) => handleEquipmentRentalChange('trailer', 'arrow', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="light" className="text-sm font-medium">Light</Label>
                                            <Input
                                                id="light"
                                                type="number"
                                                min="0"
                                                value={equipmentRental.trailer.light || ''}
                                                onChange={(e) => handleEquipmentRentalChange('trailer', 'light', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="permanent" className="mt-6">
                            <div className="space-y-6">
                                {/* Regulatory Signs Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Regulatory Signs</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="stop" className="text-sm font-medium">Stop</Label>
                                            <Input
                                                id="stop"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.regulatory.stop || ''}
                                                onChange={(e) => handlePermanentSignsChange('regulatory', 'stop', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="yield" className="text-sm font-medium">Yield</Label>
                                            <Input
                                                id="yield"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.regulatory.yield || ''}
                                                onChange={(e) => handlePermanentSignsChange('regulatory', 'yield', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="speedLimit" className="text-sm font-medium">Speed Limit</Label>
                                            <Input
                                                id="speedLimit"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.regulatory.speedLimit || ''}
                                                onChange={(e) => handlePermanentSignsChange('regulatory', 'speedLimit', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="noParking" className="text-sm font-medium">No Parking</Label>
                                            <Input
                                                id="noParking"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.regulatory.noParking || ''}
                                                onChange={(e) => handlePermanentSignsChange('regulatory', 'noParking', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="oneWay" className="text-sm font-medium">One Way</Label>
                                            <Input
                                                id="oneWay"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.regulatory.oneWay || ''}
                                                onChange={(e) => handlePermanentSignsChange('regulatory', 'oneWay', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="doNotEnter" className="text-sm font-medium">Do Not Enter</Label>
                                            <Input
                                                id="doNotEnter"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.regulatory.doNotEnter || ''}
                                                onChange={(e) => handlePermanentSignsChange('regulatory', 'doNotEnter', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Warning Signs Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Warning Signs</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="pedestrian" className="text-sm font-medium">Pedestrian</Label>
                                            <Input
                                                id="pedestrian"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.warning.pedestrian || ''}
                                                onChange={(e) => handlePermanentSignsChange('warning', 'pedestrian', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="school" className="text-sm font-medium">School</Label>
                                            <Input
                                                id="school"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.warning.school || ''}
                                                onChange={(e) => handlePermanentSignsChange('warning', 'school', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="merge" className="text-sm font-medium">Merge</Label>
                                            <Input
                                                id="merge"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.warning.merge || ''}
                                                onChange={(e) => handlePermanentSignsChange('warning', 'merge', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="curve" className="text-sm font-medium">Curve</Label>
                                            <Input
                                                id="curve"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.warning.curve || ''}
                                                onChange={(e) => handlePermanentSignsChange('warning', 'curve', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="intersection" className="text-sm font-medium">Intersection</Label>
                                            <Input
                                                id="intersection"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.warning.intersection || ''}
                                                onChange={(e) => handlePermanentSignsChange('warning', 'intersection', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Guide Signs Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Guide Signs</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="street" className="text-sm font-medium">Street Name</Label>
                                            <Input
                                                id="street"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.guide.street || ''}
                                                onChange={(e) => handlePermanentSignsChange('guide', 'street', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="highway" className="text-sm font-medium">Highway</Label>
                                            <Input
                                                id="highway"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.guide.highway || ''}
                                                onChange={(e) => handlePermanentSignsChange('guide', 'highway', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mile" className="text-sm font-medium">Mile Marker</Label>
                                            <Input
                                                id="mile"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.guide.mile || ''}
                                                onChange={(e) => handlePermanentSignsChange('guide', 'mile', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exit" className="text-sm font-medium">Exit</Label>
                                            <Input
                                                id="exit"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.guide.exit || ''}
                                                onChange={(e) => handlePermanentSignsChange('guide', 'exit', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="directional" className="text-sm font-medium">Directional</Label>
                                            <Input
                                                id="directional"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.guide.directional || ''}
                                                onChange={(e) => handlePermanentSignsChange('guide', 'directional', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Signs Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Custom Signs</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="size" className="text-sm font-medium">Size</Label>
                                            <Input
                                                id="size"
                                                type="text"
                                                value={permanentSigns.custom.size}
                                                onChange={(e) => handlePermanentSignsChange('custom', 'size', e.target.value)}
                                                className="h-9"
                                                placeholder="e.g., 24x36"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="quantity" className="text-sm font-medium">Quantity</Label>
                                            <Input
                                                id="quantity"
                                                type="number"
                                                min="0"
                                                value={permanentSigns.custom.quantity || ''}
                                                onChange={(e) => handlePermanentSignsChange('custom', 'quantity', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                            <Input
                                                id="description"
                                                type="text"
                                                value={permanentSigns.custom.description}
                                                onChange={(e) => handlePermanentSignsChange('custom', 'description', e.target.value)}
                                                className="h-9"
                                                placeholder="Enter custom sign description"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="flagging" className="mt-6">
                            <div className="space-y-6">
                                {/* Flagging Services Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Flagging Services</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="trafficControl" className="text-sm font-medium">Traffic Control</Label>
                                            <Input
                                                id="trafficControl"
                                                type="number"
                                                min="0"
                                                value={flagging.services.trafficControl || ''}
                                                onChange={(e) => handleFlaggingChange('services', 'trafficControl', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="policeDetail" className="text-sm font-medium">Police Detail</Label>
                                            <Input
                                                id="policeDetail"
                                                type="number"
                                                min="0"
                                                value={flagging.services.policeDetail || ''}
                                                onChange={(e) => handleFlaggingChange('services', 'policeDetail', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="uniformedFlagger" className="text-sm font-medium">Uniformed Flagger</Label>
                                            <Input
                                                id="uniformedFlagger"
                                                type="number"
                                                min="0"
                                                value={flagging.services.uniformedFlagger || ''}
                                                onChange={(e) => handleFlaggingChange('services', 'uniformedFlagger', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="trafficSupervisor" className="text-sm font-medium">Traffic Supervisor</Label>
                                            <Input
                                                id="trafficSupervisor"
                                                type="number"
                                                min="0"
                                                value={flagging.services.trafficSupervisor || ''}
                                                onChange={(e) => handleFlaggingChange('services', 'trafficSupervisor', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Flagging Equipment Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Flagging Equipment</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="radioUnit" className="text-sm font-medium">Radio Unit</Label>
                                            <Input
                                                id="radioUnit"
                                                type="number"
                                                min="0"
                                                value={flagging.equipment.radioUnit || ''}
                                                onChange={(e) => handleFlaggingChange('equipment', 'radioUnit', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="safetyVest" className="text-sm font-medium">Safety Vest</Label>
                                            <Input
                                                id="safetyVest"
                                                type="number"
                                                min="0"
                                                value={flagging.equipment.safetyVest || ''}
                                                onChange={(e) => handleFlaggingChange('equipment', 'safetyVest', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="stopSlowPaddle" className="text-sm font-medium">Stop/Slow Paddle</Label>
                                            <Input
                                                id="stopSlowPaddle"
                                                type="number"
                                                min="0"
                                                value={flagging.equipment.stopSlowPaddle || ''}
                                                onChange={(e) => handleFlaggingChange('equipment', 'stopSlowPaddle', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="flags" className="text-sm font-medium">Flags</Label>
                                            <Input
                                                id="flags"
                                                type="number"
                                                min="0"
                                                value={flagging.equipment.flags || ''}
                                                onChange={(e) => handleFlaggingChange('equipment', 'flags', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="sale" className="mt-6">
                            <div className="space-y-6">
                                {/* Materials Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Materials</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="concrete" className="text-sm font-medium">Concrete</Label>
                                            <Input
                                                id="concrete"
                                                type="number"
                                                min="0"
                                                value={saleItems.materials.concrete || ''}
                                                onChange={(e) => handleSaleItemsChange('materials', 'concrete', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="asphalt" className="text-sm font-medium">Asphalt</Label>
                                            <Input
                                                id="asphalt"
                                                type="number"
                                                min="0"
                                                value={saleItems.materials.asphalt || ''}
                                                onChange={(e) => handleSaleItemsChange('materials', 'asphalt', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gravel" className="text-sm font-medium">Gravel</Label>
                                            <Input
                                                id="gravel"
                                                type="number"
                                                min="0"
                                                value={saleItems.materials.gravel || ''}
                                                onChange={(e) => handleSaleItemsChange('materials', 'gravel', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sand" className="text-sm font-medium">Sand</Label>
                                            <Input
                                                id="sand"
                                                type="number"
                                                min="0"
                                                value={saleItems.materials.sand || ''}
                                                onChange={(e) => handleSaleItemsChange('materials', 'sand', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tools Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Tools</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="shovels" className="text-sm font-medium">Shovels</Label>
                                            <Input
                                                id="shovels"
                                                type="number"
                                                min="0"
                                                value={saleItems.tools.shovels || ''}
                                                onChange={(e) => handleSaleItemsChange('tools', 'shovels', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="rakes" className="text-sm font-medium">Rakes</Label>
                                            <Input
                                                id="rakes"
                                                type="number"
                                                min="0"
                                                value={saleItems.tools.rakes || ''}
                                                onChange={(e) => handleSaleItemsChange('tools', 'rakes', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="wheelbarrows" className="text-sm font-medium">Wheelbarrows</Label>
                                            <Input
                                                id="wheelbarrows"
                                                type="number"
                                                min="0"
                                                value={saleItems.tools.wheelbarrows || ''}
                                                onChange={(e) => handleSaleItemsChange('tools', 'wheelbarrows', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="safetyCones" className="text-sm font-medium">Safety Cones</Label>
                                            <Input
                                                id="safetyCones"
                                                type="number"
                                                min="0"
                                                value={saleItems.tools.safetyCones || ''}
                                                onChange={(e) => handleSaleItemsChange('tools', 'safetyCones', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Supplies Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Supplies</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="paint" className="text-sm font-medium">Paint</Label>
                                            <Input
                                                id="paint"
                                                type="number"
                                                min="0"
                                                value={saleItems.supplies.paint || ''}
                                                onChange={(e) => handleSaleItemsChange('supplies', 'paint', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="markers" className="text-sm font-medium">Markers</Label>
                                            <Input
                                                id="markers"
                                                type="number"
                                                min="0"
                                                value={saleItems.supplies.markers || ''}
                                                onChange={(e) => handleSaleItemsChange('supplies', 'markers', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tape" className="text-sm font-medium">Tape</Label>
                                            <Input
                                                id="tape"
                                                type="number"
                                                min="0"
                                                value={saleItems.supplies.tape || ''}
                                                onChange={(e) => handleSaleItemsChange('supplies', 'tape', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signs" className="text-sm font-medium">Signs</Label>
                                            <Input
                                                id="signs"
                                                type="number"
                                                min="0"
                                                value={saleItems.supplies.signs || ''}
                                                onChange={(e) => handleSaleItemsChange('supplies', 'signs', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="patterns" className="mt-6">
                            <div className="space-y-6">
                                {/* Pavement Patterns Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Pavement Patterns</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="milling" className="text-sm font-medium">Milling</Label>
                                            <Input
                                                id="milling"
                                                type="number"
                                                min="0"
                                                value={patterns.pavement.milling || ''}
                                                onChange={(e) => handlePatternsChange('pavement', 'milling', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="overlay" className="text-sm font-medium">Overlay</Label>
                                            <Input
                                                id="overlay"
                                                type="number"
                                                min="0"
                                                value={patterns.pavement.overlay || ''}
                                                onChange={(e) => handlePatternsChange('pavement', 'overlay', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="fullDepth" className="text-sm font-medium">Full Depth</Label>
                                            <Input
                                                id="fullDepth"
                                                type="number"
                                                min="0"
                                                value={patterns.pavement.fullDepth || ''}
                                                onChange={(e) => handlePatternsChange('pavement', 'fullDepth', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="patching" className="text-sm font-medium">Patching</Label>
                                            <Input
                                                id="patching"
                                                type="number"
                                                min="0"
                                                value={patterns.pavement.patching || ''}
                                                onChange={(e) => handlePatternsChange('pavement', 'patching', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Markings Patterns Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Markings Patterns</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="thermoplastic" className="text-sm font-medium">Thermoplastic</Label>
                                            <Input
                                                id="thermoplastic"
                                                type="number"
                                                min="0"
                                                value={patterns.markings.thermoplastic || ''}
                                                onChange={(e) => handlePatternsChange('markings', 'thermoplastic', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="paint" className="text-sm font-medium">Paint</Label>
                                            <Input
                                                id="paint"
                                                type="number"
                                                min="0"
                                                value={patterns.markings.paint || ''}
                                                onChange={(e) => handlePatternsChange('markings', 'paint', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="epoxy" className="text-sm font-medium">Epoxy</Label>
                                            <Input
                                                id="epoxy"
                                                type="number"
                                                min="0"
                                                value={patterns.markings.epoxy || ''}
                                                onChange={(e) => handlePatternsChange('markings', 'epoxy', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="preformed" className="text-sm font-medium">Preformed</Label>
                                            <Input
                                                id="preformed"
                                                type="number"
                                                min="0"
                                                value={patterns.markings.preformed || ''}
                                                onChange={(e) => handlePatternsChange('markings', 'preformed', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Configuration Patterns Section */}
                                <div>
                                    <h3 className="text-base font-semibold mb-4">Configuration Patterns</h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="laneClosure" className="text-sm font-medium">Lane Closure</Label>
                                            <Input
                                                id="laneClosure"
                                                type="number"
                                                min="0"
                                                value={patterns.configurations.laneClosure || ''}
                                                onChange={(e) => handlePatternsChange('configurations', 'laneClosure', e.target.value)}
                                                className="h-9"
                                            />
                                            </div>
                                            <div className="space-y-2">
                                            <Label htmlFor="shoulderWork" className="text-sm font-medium">Shoulder Work</Label>
                                                <Input
                                                id="shoulderWork"
                                                type="number"
                                                min="0"
                                                value={patterns.configurations.shoulderWork || ''}
                                                onChange={(e) => handlePatternsChange('configurations', 'shoulderWork', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="intersection" className="text-sm font-medium">Intersection</Label>
                                            <Input
                                                id="intersection"
                                                type="number"
                                                min="0"
                                                value={patterns.configurations.intersection || ''}
                                                onChange={(e) => handlePatternsChange('configurations', 'intersection', e.target.value)}
                                                className="h-9"
                                                        />
                                                    </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="workZone" className="text-sm font-medium">Work Zone</Label>
                                            <Input
                                                id="workZone"
                                                type="number"
                                                min="0"
                                                value={patterns.configurations.workZone || ''}
                                                onChange={(e) => handlePatternsChange('configurations', 'workZone', e.target.value)}
                                                className="h-9"
                                            />
                                            </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-between mt-8">
                                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                                    Back
                                </Button>
                                <Button onClick={() => setCurrentStep(5)}>Next</Button>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default BidItemsStep4;
