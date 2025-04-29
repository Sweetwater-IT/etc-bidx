"use client";
import { FormData } from "@/types/IFormData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useState } from "react";
import EquipmentSummaryStep from "./equipment-summary-step";
import SaleItemsStep from "./sale-items-step";
import { SaleItem } from "@/types/TSaleItem";
import { Flagging } from "@/types/TFlagging";
import { MPTRentalEstimating } from "@/types/MPTEquipment";
import { EquipmentRentalItem } from "@/types/IEquipmentRentalItem";

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
  const [mptData, setMptData] = useState<MPTRentalEstimating>(formData.mptRental);

  const [equipmentRental, setEquipmentRental] = useState<EquipmentRentalItem[]>(formData.equipmentItems);

  // const [permanentSigns, setPermanentSigns] = useState<PermanentSignsData>();

  const [flagging, setFlagging] = useState<Flagging | undefined>(formData.flagging);

  const [saleItems, setSaleItems] = useState<SaleItem[]>(formData.saleItems);

  const [patterns, setPatterns] = useState<Flagging | undefined>(formData.patterns);

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
    section: keyof EquipmentRentalItem,
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

  // const handlePermanentSignsChange = (
  //   section: keyof PermanentSignsData,
  //   field: string,
  //   value: string
  // ) => {
  //   const updatedPermanentSigns = {
  //     ...permanentSigns,
  //     [section]: {
  //       ...permanentSigns[section],
  //       [field]:
  //         field === "quantity"
  //           ? value === ""
  //             ? 0
  //             : parseInt(value, 10)
  //           : value,
  //     },
  //   };

  //   setPermanentSigns(updatedPermanentSigns);
    
  //   // Update main form data
  //   setFormData((prev) => ({
  //     ...prev,
  //     permanentSigns: updatedPermanentSigns,
  //   }));
  // };

  // const handleFlaggingChange = (
  //   section: keyof Flagging,
  //   field: string,
  //   value: string
  // ) => {
  //   const numValue = value === "" ? 0 : parseInt(value, 10);
  //   if (isNaN(numValue) || numValue < 0) return;

  //   const updatedFlagging = {
  //     ...flagging,
  //     [section]: {
  //       ...flagging[section],
  //       [field]: numValue,
  //     },
  //   };

  //   setFlagging(updatedFlagging);
    
  //   // Update main form data
  //   setFormData((prev) => ({
  //     ...prev,
  //     flagging: updatedFlagging,
  //   }));
  // };

  const handleSaleItemsChange = (
    section: keyof SaleItem,
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


  const handleNext = () => {

    // Update all data before proceeding
    setFormData(prev => ({
      ...prev,
      mptData,
      equipmentRental,
      // permanentSigns,
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
                      {Object.entries(mptData.phases[0].standardEquipment).map(
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
                              //this needs to be updated to track the quantity of the certain equip type
                              value={value as any}
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
                      {/**This should filter down to the light and drum items */}
                      {/* {Object.entries(mptData.l).map(
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
                              value={value as any}
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
                      )} */}
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
                </div>
              </TabsContent>

              <TabsContent value="flagging" className="mt-6">
                <div className="space-y-6">
                  {/* Flagging Services Section */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      Flagging Services
                    </h3>
                    {/* <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {Object.entries(flagging).map(([key, value]) => (
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
                    </div> */}
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
                    {/* <div className="grid grid-cols-2 gap-x-6 gap-y-4">
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
                    </div> */}
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
