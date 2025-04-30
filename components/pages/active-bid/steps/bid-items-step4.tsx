"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Plus 
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useEstimate } from "@/contexts/EstimateContext";
import { 
  EquipmentType, 
  DynamicEquipmentInfo, 
  CustomLightAndDrumItem, 
  Phase, 
  SheetingType 
} from "@/types/MPTEquipment";

const step = {
  id: "step-4",
  name: "Bid Items",
  description: "Configure bid items",
};

// Mapping for equipment labels
const labelMapping: Record<string, string> = {
  fourFootTypeIII: "Four Foot Type III",
  hStand: "H Stand",
  post: "Post",
  sandbag: "Sandbags",
  sixFootWings: "Six Foot Wings",
  metalStands: "Metal Stands",
  covers: "Covers",
  HIVP: "HI Vertical Panels",
  TypeXIVP: "Type XI Vertical Panels",
  BLights: "B-Lights",
  ACLights: "AC Lights",
  sharps: "Sharps"
};

// Standard equipment list
const standardEquipmentList: EquipmentType[] = [
  "fourFootTypeIII",
  "hStand",
  "post",
  "sixFootWings",
  "metalStands",
  "covers",
  "sandbag"
];

// Light and drum list
const lightAndDrumList: EquipmentType[] = [
  "HIVP",
  "TypeXIVP",
  "BLights",
  "ACLights",
  "sharps"
];

// Helper functions
const safeNumber = (value: any): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const formatLabel = (key: string) => {
  return labelMapping[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
};

// Placeholder calculation functions - replace with actual implementations
const getAssociatedSignEquipment = (phase: Phase) => {
  return {
    bLights: 0,
    acLights: 0,
    cover: 0,
    type3: 0,
    hStand: 0,
    post: 0
  };
};

const calculateLightDailyRateCosts = (mptRental: any, cost: number) => {
  return cost / 365; // Simple placeholder calculation
};

const BidItemsStep4 = ({
  currentStep,
  setCurrentStep,
}: {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { mptRental, adminData, dispatch } = useEstimate();
  const [activeTab, setActiveTab] = useState("mpt");
  const [sandbagQuantity, setSandbagQuantity] = useState<number>(0);
  const [newCustomItem, setNewCustomItem] = useState<Omit<CustomLightAndDrumItem, 'id'>>({
    quantity: 0,
    cost: 0,
    usefulLife: 0
  });
  const [itemName, setItemName] = useState('');
  const currentPhase = 0; // Using first phase as default
  
  // Fetch equipment data
  useEffect(() => {
    const fetchEquipmentPrice = async () => {
      try {
        // Mock API call or actual implementation
        // Replace with actual API calls if available
        console.log("Fetching equipment pricing data...");
        // In a real implementation, you would call your API and update the context
      } catch (error) {
        console.error('Error fetching equipment data:', error);
      }
    };

    fetchEquipmentPrice();
  }, []);
  
  // Calculate sandbag quantity based on equipment
  useEffect(() => {
    if (mptRental?.phases && mptRental.phases[currentPhase]) {
      const phase = mptRental.phases[currentPhase];
      const hStandQuantity = phase.standardEquipment.hStand?.quantity || 0;
      const fourFootTypeIIIQuantity = phase.standardEquipment.fourFootTypeIII?.quantity || 0;
      const sixFootWingsQuantity = phase.standardEquipment.sixFootWings?.quantity || 0;
      
      const calculatedSandbagQuantity = (hStandQuantity * 6) + (fourFootTypeIIIQuantity * 10) + (sixFootWingsQuantity * 4);
      
      dispatch({
        type: 'ADD_MPT_ITEM_NOT_SIGN',
        payload: {
          phaseNumber: currentPhase,
          equipmentType: 'sandbag',
          equipmentProperty: 'quantity',
          value: calculatedSandbagQuantity
        }
      });
      
      setSandbagQuantity(calculatedSandbagQuantity);
    }
  }, [
    mptRental?.phases?.[currentPhase]?.standardEquipment?.fourFootTypeIII?.quantity, 
    mptRental?.phases?.[currentPhase]?.standardEquipment?.hStand?.quantity, 
    mptRental?.phases?.[currentPhase]?.standardEquipment?.sixFootWings?.quantity
  ]);
  
  // Handle equipment input changes
  const handleStandardInputChange = (
    value: number,
    equipmentKey: EquipmentType,
    property: keyof DynamicEquipmentInfo
  ) => {
    dispatch({
      type: 'ADD_MPT_ITEM_NOT_SIGN',
      payload: {
        phaseNumber: currentPhase,
        equipmentType: equipmentKey,
        equipmentProperty: property,
        value: safeNumber(value)
      },
    });
  };
  
  // Handle custom item input changes
  const handleNewItemInputChange = (field: keyof Omit<CustomLightAndDrumItem, 'id'>, value: number) => {
    setNewCustomItem(prev => ({
      ...prev,
      [field]: safeNumber(value),
    }));
  };
  
  // Add custom item to the list
  const handleAddCustomItem = () => {
    if (itemName && newCustomItem.quantity > 0 && newCustomItem.cost > 0) {
      dispatch({
        type: 'ADD_LIGHT_AND_DRUM_CUSTOM_ITEM',
        payload: {
          phaseNumber: currentPhase,
          item: {
            id: itemName,
            ...newCustomItem,
          },
        },
      });
      setNewCustomItem({
        quantity: 0,
        cost: 0,
        usefulLife: 0
      });
      setItemName('');
    }
  };
  
  // Handle emergency job toggle
  const handleEmergencyJobChange = (checked: boolean) => {
    dispatch({ 
      type: 'UPDATE_ADMIN_DATA', 
      payload: { 
        key: 'emergencyJob', 
        value: checked 
      } 
    });
  };

  const handleNext = () => {    
    setCurrentStep(5);
  };

  // Safely get equipment quantities
  const getEquipmentQuantity = (equipmentKey: EquipmentType): number => {
    if (!mptRental?.phases || !mptRental.phases[currentPhase]) return 0;
    return safeNumber(mptRental.phases[currentPhase].standardEquipment[equipmentKey]?.quantity);
  };
  
  // Safely get equipment price
  const getEquipmentPrice = (equipmentKey: EquipmentType): number => {
    if (!mptRental?.staticEquipmentInfo || !mptRental.staticEquipmentInfo[equipmentKey]) return 0;
    return safeNumber(mptRental.staticEquipmentInfo[equipmentKey]?.price);
  };
  
  // Get minimum allowed quantity for an equipment type
  const getMinQuantity = (equipmentKey: EquipmentType): number => {
    if (!mptRental?.phases || !mptRental.phases[currentPhase]) return 0;
    
    const associatedEquipment = getAssociatedSignEquipment(mptRental.phases[currentPhase]);
    
    switch (equipmentKey) {
      case 'covers': 
        return associatedEquipment.cover;
      case 'fourFootTypeIII':
        return associatedEquipment.type3;
      case 'hStand':
        return associatedEquipment.hStand;
      case 'post':
        return associatedEquipment.post;
      case 'BLights':
        return associatedEquipment.bLights;
      case 'ACLights':
        return associatedEquipment.acLights;
      default:
        return 0;
    }
  };

  return (
    <div>
      <div className="relative">
        <button
          onClick={() => setCurrentStep(4)}
          className={cn(
            "group flex w-full items-start gap-4 py-4 text-left",
            currentStep === 4 ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm",
              4 <= currentStep
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground bg-background"
            )}
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
                  value="light-drum"
                  className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground before:absolute before:left-0 before:bottom-0 before:h-[2px] before:w-full before:scale-x-0 before:bg-foreground before:transition-transform data-[state=active]:before:scale-x-100 data-[state=active]:shadow-none"
                >
                  Light & Drum Rental
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

              {/* MPT Equipment Tab */}
              <TabsContent value="mpt" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      MPT Equipment
                    </h3>
                    <div className="grid grid-cols-12 gap-4 mb-4">
                      <div className="col-span-4 font-medium">Item Name</div>
                      <div className="col-span-4 font-medium">Quantity</div>
                      <div className="col-span-4 font-medium">Cost</div>
                    </div>
                    <div className="space-y-4">
                      {standardEquipmentList.map((equipmentKey) => (
                        equipmentKey === 'sandbag' ? (
                          <div key={equipmentKey} className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-4">{formatLabel(equipmentKey)}</div>
                            <div className="col-span-4">{sandbagQuantity}</div>
                            <div className="col-span-4">
                              ${getEquipmentPrice(equipmentKey).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <div key={equipmentKey} className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-4">{formatLabel(equipmentKey)}</div>
                            <div className="col-span-4">
                              <Input
                                type="number"
                                min={getMinQuantity(equipmentKey)}
                                value={getEquipmentQuantity(equipmentKey)}
                                onChange={(e) => handleStandardInputChange(
                                  parseFloat(e.target.value) || 0,
                                  equipmentKey,
                                  'quantity'
                                )}
                              />
                            </div>
                            <div className="col-span-4">
                              ${getEquipmentPrice(equipmentKey).toFixed(2)}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Light and Drum Rental Tab */}
              <TabsContent value="light-drum" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-semibold">
                        Light and Drum Rental
                      </h3>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="emergency-job"
                          checked={adminData?.emergencyJob || false}
                          onCheckedChange={handleEmergencyJobChange}
                        />
                        <Label htmlFor="emergency-job">Emergency Job</Label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-4 mb-4">
                      <div className="col-span-3 font-medium">Item Name</div>
                      <div className="col-span-3 font-medium">Quantity</div>
                      <div className="col-span-2 font-medium">Cost</div>
                      <div className="col-span-2 font-medium">Daily Price</div>
                      {adminData?.emergencyJob && <div className="col-span-2 font-medium">Emergency Rate</div>}
                    </div>
                    
                    <div className="space-y-4">
                      {lightAndDrumList.map((equipmentKey) => (
                        <div key={equipmentKey} className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3">{formatLabel(equipmentKey)}</div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              min={getMinQuantity(equipmentKey)}
                              value={getEquipmentQuantity(equipmentKey)}
                              onChange={(e) => handleStandardInputChange(
                                parseFloat(e.target.value) || 0,
                                equipmentKey,
                                'quantity'
                              )}
                            />
                          </div>
                          <div className="col-span-2">
                            ${getEquipmentPrice(equipmentKey).toFixed(2)}
                          </div>
                          <div className="col-span-2">
                            ${calculateLightDailyRateCosts(mptRental, getEquipmentPrice(equipmentKey)).toFixed(2)}
                          </div>
                          {adminData?.emergencyJob && (
                            <div className="col-span-2">
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={adminData?.emergencyFields?.[`emergency${equipmentKey}`] || "0"}
                                onChange={(e) => dispatch({
                                  type: 'UPDATE_ADMIN_DATA',
                                  payload: {
                                    key: 'emergencyFields',
                                    value: {
                                      ...adminData?.emergencyFields,
                                      [`emergency${equipmentKey}`]: parseFloat(e.target.value) || 0
                                    }
                                  }
                                })}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Custom Equipment Section */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      Custom Equipment
                    </h3>
                    <div className="grid grid-cols-12 gap-4 mb-4">
                      <div className="col-span-3">
                        <Label htmlFor="itemName">Item Name</Label>
                        <Input
                          id="itemName"
                          value={itemName}
                          onChange={(e) => setItemName(e.target.value)}
                          placeholder="Enter item name"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min={0}
                          value={newCustomItem.quantity === 0 ? "" : newCustomItem.quantity}
                          onChange={(e) => handleNewItemInputChange('quantity', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor="cost">Cost</Label>
                        <Input
                          id="cost"
                          type="number"
                          min={0}
                          step={0.01}
                          value={newCustomItem.cost === 0 ? "" : newCustomItem.cost}
                          onChange={(e) => handleNewItemInputChange('cost', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor="usefulLife">Useful Life (days)</Label>
                        <Input
                          id="usefulLife"
                          type="number"
                          min={0}
                          value={newCustomItem.usefulLife === 0 ? "" : newCustomItem.usefulLife}
                          onChange={(e) => handleNewItemInputChange('usefulLife', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleAddCustomItem}
                      className="mt-2"
                      disabled={!itemName || newCustomItem.quantity <= 0 || newCustomItem.cost <= 0}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Custom Item
                    </Button>
                  </div>
                  
                  {/* Custom Items List */}
                  {mptRental?.phases?.[currentPhase]?.customLightAndDrumItems?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-base font-semibold mb-4">
                        Custom Items
                      </h3>
                      <div className="grid grid-cols-12 gap-4 mb-4">
                        <div className="col-span-2 font-medium">Item Name</div>
                        <div className="col-span-3 font-medium">Quantity</div>
                        <div className="col-span-3 font-medium">Cost</div>
                        <div className="col-span-2 font-medium">Useful Life</div>
                        <div className="col-span-2 font-medium">Daily Price</div>
                      </div>
                      
                      <div className="space-y-4">
                        {mptRental.phases[currentPhase].customLightAndDrumItems.map((item) => (
                          <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-2">{item.id}</div>
                            <div className="col-span-3">
                              <Input
                                type="number"
                                min={0}
                                value={item.quantity}
                                onChange={(e) => dispatch({
                                  type: 'UPDATE_LIGHT_AND_DRUM_CUSTOM_ITEM',
                                  payload: {
                                    phaseNumber: currentPhase,
                                    id: item.id,
                                    key: 'quantity',
                                    value: parseFloat(e.target.value) || 0
                                  }
                                })}
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={item.cost}
                                onChange={(e) => dispatch({
                                  type: 'UPDATE_LIGHT_AND_DRUM_CUSTOM_ITEM',
                                  payload: {
                                    phaseNumber: currentPhase,
                                    id: item.id,
                                    key: 'cost',
                                    value: parseFloat(e.target.value) || 0
                                  }
                                })}
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                min={0}
                                value={item.usefulLife}
                                onChange={(e) => dispatch({
                                  type: 'UPDATE_LIGHT_AND_DRUM_CUSTOM_ITEM',
                                  payload: {
                                    phaseNumber: currentPhase,
                                    id: item.id,
                                    key: 'usefulLife',
                                    value: parseFloat(e.target.value) || 0
                                  }
                                })}
                              />
                            </div>
                            <div className="col-span-2">
                              ${calculateLightDailyRateCosts(mptRental, item.cost).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Equipment Tab */}
              <TabsContent value="equipment" className="mt-6">
                <div className="text-center py-6 text-muted-foreground">
                  Equipment Rental will be implemented here
                </div>
              </TabsContent>

              {/* Permanent Signs Tab */}
              <TabsContent value="permanent" className="mt-6">
                <div className="text-center py-6 text-muted-foreground">
                  Permanent Signs will be implemented here
                </div>
              </TabsContent>

              {/* Flagging Tab */}
              <TabsContent value="flagging" className="mt-6">
                <div className="text-center py-6 text-muted-foreground">
                  Flagging Services will be implemented here
                </div>
              </TabsContent>

              {/* Sale Items Tab */}
              <TabsContent value="sale" className="mt-6">
                <div className="text-center py-6 text-muted-foreground">
                  Sale Items will be implemented here
                </div>
              </TabsContent>

              {/* Patterns Tab */}
              <TabsContent value="patterns" className="mt-6">
                <div className="text-center py-6 text-muted-foreground">
                  Pavement Patterns will be implemented here
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