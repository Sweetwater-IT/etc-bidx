"use client";

import { FormData } from "@/app/active-bid/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useState } from "react";
import EquipmentSummaryStep from "./equipment-summary-step";
import SaleItemsStep from "./sale-items-step";

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

const step = {
  id: "step-4",
  name: "Bid Items",
  description: "Configure bid items",
};

const labelMapping: Record<string, string> = {
  typeIII: "Type III",
  hiVerticalPanels: "HI Vertical Panels",
  typeXIVerticalPanels: "Type XI Vertical Panels",
  bLights: "B-Lights",
  acLights: "AC Lights",
  hStands: "H-Stands",
};

const formatLabel = (key: string) => {
  return labelMapping[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
};

const BidItemsStep4 = ({
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
  const [activeTab, setActiveTab] = useState("mpt");
  const [mptData, setMptData] = useState<MPTData>(
    formData.mptData || {
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
    }
  );

  const [equipmentRental, setEquipmentRental] = useState<EquipmentRentalData>(
    formData.equipmentRental || {
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
    }
  );

  const [permanentSigns, setPermanentSigns] = useState<PermanentSignsData>(
    formData.permanentSigns || {
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
        size: "",
        quantity: 0,
        description: "",
      },
    }
  );

  const [flagging, setFlagging] = useState<FlaggingData>(
    formData.flagging || {
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
    }
  );

  const [saleItems, setSaleItems] = useState<SaleItemsData>(
    formData.saleItems || {
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
    }
  );

  const [patterns, setPatterns] = useState<PatternsData>(
    formData.patterns || {
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
    }
  );

  const handleMPTInputChange = (
    section: "mptEquipment" | "lightAndDrum",
    field: string,
    value: string
  ) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    const updatedMptData = {
      ...mptData,
      [section]: {
        ...mptData[section],
        [field]: numValue,
      },
    };

    setMptData(updatedMptData);
    
    // Update main form data
    setFormData((prev) => ({
      ...prev,
      mptData: updatedMptData,
    }));
  };

  const handleEquipmentRentalChange = (
    section: keyof EquipmentRentalData,
    field: string,
    value: string
  ) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    const updatedEquipmentRental = {
      ...equipmentRental,
      [section]: {
        ...equipmentRental[section],
        [field]: numValue,
      },
    };

    setEquipmentRental(updatedEquipmentRental);
    
    // Update main form data
    setFormData((prev) => ({
      ...prev,
      equipmentRental: updatedEquipmentRental,
    }));
  };

  const handlePermanentSignsChange = (
    section: keyof PermanentSignsData,
    field: string,
    value: string
  ) => {
    const updatedPermanentSigns = {
      ...permanentSigns,
      [section]: {
        ...permanentSigns[section],
        [field]:
          field === "quantity"
            ? value === ""
              ? 0
              : parseInt(value, 10)
            : value,
      },
    };

    setPermanentSigns(updatedPermanentSigns);
    
    // Update main form data
    setFormData((prev) => ({
      ...prev,
      permanentSigns: updatedPermanentSigns,
    }));
  };

  const handleFlaggingChange = (
    section: keyof FlaggingData,
    field: string,
    value: string
  ) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    const updatedFlagging = {
      ...flagging,
      [section]: {
        ...flagging[section],
        [field]: numValue,
      },
    };

    setFlagging(updatedFlagging);
    
    // Update main form data
    setFormData((prev) => ({
      ...prev,
      flagging: updatedFlagging,
    }));
  };

  const handleSaleItemsChange = (
    section: keyof SaleItemsData,
    field: string,
    value: string
  ) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    const updatedSaleItems = {
      ...saleItems,
      [section]: {
        ...saleItems[section],
        [field]: numValue,
      },
    };

    setSaleItems(updatedSaleItems);
    
    // Update main form data
    setFormData((prev) => ({
      ...prev,
      saleItems: updatedSaleItems,
    }));
  };

  const handlePatternsChange = (
    section: keyof PatternsData,
    field: string,
    value: string
  ) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    const updatedPatterns = {
      ...patterns,
      [section]: {
        ...patterns[section],
        [field]: numValue,
      },
    };

    setPatterns(updatedPatterns);
    
    // Update main form data
    setFormData((prev) => ({
      ...prev,
      patterns: updatedPatterns,
    }));
  };

  const handleNext = () => {

    // Update all data before proceeding
    setFormData(prev => ({
      ...prev,
      mptData,
      equipmentRental,
      permanentSigns,
      flagging,
      saleItems,
      patterns
    }));
    
    setCurrentStep(5);
  };

  return (
    <div>
      <div className="relative">
        <button
          onClick={() => setCurrentStep(4)}
          className={`group flex w-full items-start gap-4 py-4 text-left ${
            currentStep === 4 ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <div
            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
              4 <= currentStep
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground bg-background"
            }`}
          >
            4
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-base font-medium">{step.name}</div>
            <div className="text-sm text-muted-foreground">
              {step.description}
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {currentStep === 4 && (
          <div className="mt-2 mb-6 ml-12">
            <Tabs
              defaultValue="mpt"
              className="w-full"
              onValueChange={setActiveTab}
              value={activeTab}
            >
              <TabsList className="w-full border-0 bg-transparent p-0 [&_>_*]:border-0">
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
                    <h3 className="text-base font-semibold mb-4">
                      MPT Equipment
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {/* MPT Equipment fields */}
                      {Object.entries(mptData.mptEquipment).map(
                        ([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label
                              htmlFor={key}
                              className="text-sm font-medium"
                            >
                              {formatLabel(key)}
                            </Label>
                            <Input
                              id={key}
                              type="number"
                              min="0"
                              value={value || ""}
                              onChange={(e) =>
                                handleMPTInputChange(
                                  "mptEquipment",
                                  key,
                                  e.target.value
                                )
                              }
                              className="h-9"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Light and Drum Rental Section */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      Light and Drum Rental
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {/* Light and Drum fields */}
                      {Object.entries(mptData.lightAndDrum).map(
                        ([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label
                              htmlFor={key}
                              className="text-sm font-medium"
                            >
                              {formatLabel(key)}
                            </Label>
                            <Input
                              id={key}
                              type="number"
                              min="0"
                              value={value || ""}
                              onChange={(e) =>
                                handleMPTInputChange(
                                  "lightAndDrum",
                                  key,
                                  e.target.value
                                )
                              }
                              className="h-9"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="equipment" className="mt-6">
                <EquipmentSummaryStep
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  formData={formData}
                  setFormData={setFormData}
                />
              </TabsContent>

              <TabsContent value="permanent" className="mt-6">
                <div className="space-y-6">
                  {/* Regulatory Signs Section */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      Regulatory Signs
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {Object.entries(permanentSigns.regulatory).map(
                        ([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label
                              htmlFor={key}
                              className="text-sm font-medium"
                            >
                              {formatLabel(key)}
                            </Label>
                            <Input
                              id={key}
                              type="number"
                              min="0"
                              value={value || ""}
                              onChange={(e) =>
                                handlePermanentSignsChange(
                                  "regulatory",
                                  key,
                                  e.target.value
                                )
                              }
                              className="h-9"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Warning Signs Section */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      Warning Signs
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {Object.entries(permanentSigns.warning).map(
                        ([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label
                              htmlFor={key}
                              className="text-sm font-medium"
                            >
                              {formatLabel(key)}
                            </Label>
                            <Input
                              id={key}
                              type="number"
                              min="0"
                              value={value || ""}
                              onChange={(e) =>
                                handlePermanentSignsChange(
                                  "warning",
                                  key,
                                  e.target.value
                                )
                              }
                              className="h-9"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Guide Signs Section */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      Guide Signs
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {Object.entries(permanentSigns.guide).map(
                        ([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label
                              htmlFor={key}
                              className="text-sm font-medium"
                            >
                              {formatLabel(key)}
                            </Label>
                            <Input
                              id={key}
                              type="number"
                              min="0"
                              value={value || ""}
                              onChange={(e) =>
                                handlePermanentSignsChange(
                                  "guide",
                                  key,
                                  e.target.value
                                )
                              }
                              className="h-9"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Custom Signs Section */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      Custom Signs
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="size" className="text-sm font-medium">
                          Size
                        </Label>
                        <Input
                          id="size"
                          type="text"
                          value={permanentSigns.custom.size}
                          onChange={(e) =>
                            handlePermanentSignsChange(
                              "custom",
                              "size",
                              e.target.value
                            )
                          }
                          className="h-9"
                          placeholder="e.g., 24x36"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="quantity"
                          className="text-sm font-medium"
                        >
                          Quantity
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="0"
                          value={permanentSigns.custom.quantity || ""}
                          onChange={(e) =>
                            handlePermanentSignsChange(
                              "custom",
                              "quantity",
                              e.target.value
                            )
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label
                          htmlFor="description"
                          className="text-sm font-medium"
                        >
                          Description
                        </Label>
                        <Input
                          id="description"
                          type="text"
                          value={permanentSigns.custom.description}
                          onChange={(e) =>
                            handlePermanentSignsChange(
                              "custom",
                              "description",
                              e.target.value
                            )
                          }
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
                    <h3 className="text-base font-semibold mb-4">
                      Flagging Services
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {Object.entries(flagging.services).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key} className="text-sm font-medium">
                            {formatLabel(key)}
                          </Label>
                          <Input
                            id={key}
                            type="number"
                            min="0"
                            value={value || ""}
                            onChange={(e) =>
                              handleFlaggingChange(
                                "services",
                                key,
                                e.target.value
                              )
                            }
                            className="h-9"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flagging Equipment Section */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      Flagging Equipment
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {Object.entries(flagging.equipment).map(
                        ([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label
                              htmlFor={key}
                              className="text-sm font-medium"
                            >
                              {formatLabel(key)}
                            </Label>
                            <Input
                              id={key}
                              type="number"
                              min="0"
                              value={value || ""}
                              onChange={(e) =>
                                handleFlaggingChange(
                                  "equipment",
                                  key,
                                  e.target.value
                                )
                              }
                              className="h-9"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sale" className="mt-6">
                <SaleItemsStep
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  formData={formData}
                  setFormData={setFormData}
                />
              </TabsContent>

              <TabsContent value="patterns" className="mt-6">
                <div className="space-y-6">
                  {/* Pavement Patterns Section */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      Pavement Patterns
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {Object.entries(patterns.pavement).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key} className="text-sm font-medium">
                            {formatLabel(key)}
                          </Label>
                          <Input
                            id={key}
                            type="number"
                            min="0"
                            value={value || ""}
                            onChange={(e) =>
                              handlePatternsChange(
                                "pavement",
                                key,
                                e.target.value
                              )
                            }
                            className="h-9"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Markings Patterns Section */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      Markings Patterns
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {Object.entries(patterns.markings).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key} className="text-sm font-medium">
                            {formatLabel(key)}
                          </Label>
                          <Input
                            id={key}
                            type="number"
                            min="0"
                            value={value || ""}
                            onChange={(e) =>
                              handlePatternsChange(
                                "markings",
                                key,
                                e.target.value
                              )
                            }
                            className="h-9"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configuration Patterns Section */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      Configuration Patterns
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {Object.entries(patterns.configurations).map(
                        ([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label
                              htmlFor={key}
                              className="text-sm font-medium"
                            >
                              {formatLabel(key)}
                            </Label>
                            <Input
                              id={key}
                              type="number"
                              min="0"
                              value={value || ""}
                              onChange={(e) =>
                                handlePatternsChange(
                                  "configurations",
                                  key,
                                  e.target.value
                                )
                              }
                              className="h-9"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Back
              </Button>
              <Button onClick={handleNext}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidItemsStep4;
