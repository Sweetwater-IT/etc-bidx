"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Loader
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
import { safeNumber } from "@/lib/safe-number";
import { calculateLightDailyRateCosts, getAssociatedSignEquipment } from "@/lib/mptRentalHelperFunctions";
import { fetchReferenceData } from "@/lib/api-client";
import EquipmentRentalTab from "@/components/BidItems/equipment-rental-tab";
import SaleItemsStep from "./sale-items-step";
import FlaggingServicesTab from "@/components/BidItems/flagging-tab";
const step = {
  id: "step-5",
  name: "Bid Items",
  description: "Configure bid items",
};

// Default values for payback calculations and truck/fuel data
const DEFAULT_PAYBACK_PERIOD = 5; // 5 years
const DEFAULT_MPG_PER_TRUCK = 8;
const DEFAULT_DISPATCH_FEE = 75;
const DEFAULT_ANNUAL_UTILIZATION = 0.75;
const DEFAULT_TARGET_MOIC = 2;

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

// Sign mapping for database names and sheeting types
interface SignMapping {
  key: SheetingType;
  label: string;
  dbName: string;
}

const signList: SignMapping[] = [
  { key: 'HI', label: 'HI', dbName: 'HI Signs' },
  { key: 'DG', label: 'DG', dbName: 'DG Signs' },
  { key: 'Special', label: 'Special', dbName: 'Special Signs' }
];

const formatLabel = (key: string) => {
  return labelMapping[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
};

const BidItemsStep5 = ({
  currentStep,
  setCurrentStep,
  currentPhase
}: {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  currentPhase: number;
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
  const [isLoading, setIsLoading] = useState(false);

  // Fetch equipment data
  useEffect(() => {
    const initializeEquipmentData = async () => {
      setIsLoading(true);

      try {
        // Set default values for truck and fuel costs
        dispatch({
          type: 'UPDATE_TRUCK_AND_FUEL_COSTS',
          payload: { key: 'mpgPerTruck', value: DEFAULT_MPG_PER_TRUCK }
        });

        dispatch({
          type: 'UPDATE_TRUCK_AND_FUEL_COSTS',
          payload: { key: 'dispatchFee', value: DEFAULT_DISPATCH_FEE }
        });

        // Set default values for payback calculations
        dispatch({
          type: 'UPDATE_PAYBACK_CALCULATIONS',
          payload: { key: 'targetMOIC', value: DEFAULT_TARGET_MOIC }
        });

        dispatch({
          type: 'UPDATE_PAYBACK_CALCULATIONS',
          payload: { key: 'paybackPeriod', value: DEFAULT_PAYBACK_PERIOD }
        });

        dispatch({
          type: 'UPDATE_PAYBACK_CALCULATIONS',
          payload: { key: 'annualUtilization', value: DEFAULT_ANNUAL_UTILIZATION }
        });

        // Fetch equipment data from API
        const equipmentData = await fetchReferenceData('mpt equipment');

        if (Array.isArray(equipmentData)) {
          // Process regular equipment data
          equipmentData.forEach(item => {
            if (!item) return;

            // Find matching equipment type
            const equipmentType = getEquipmentTypeFromName(item.name);
            if (!equipmentType) return;

            // Update price
            dispatch({
              type: 'UPDATE_STATIC_EQUIPMENT_INFO',
              payload: {
                type: equipmentType,
                property: 'price',
                value: parseFloat(item.price) || 0
              },
            });

            // Update useful life
            dispatch({
              type: 'UPDATE_STATIC_EQUIPMENT_INFO',
              payload: {
                type: equipmentType,
                property: 'usefulLife',
                value: item.depreciation_rate_useful_life || 365
              },
            });

            // Update payback period (using default if not available)
            dispatch({
              type: 'UPDATE_STATIC_EQUIPMENT_INFO',
              payload: {
                type: equipmentType,
                property: 'paybackPeriod',
                value: item.payback_period || DEFAULT_PAYBACK_PERIOD
              },
            });

            // Update discount rate if available
            if (item.discount_rate !== undefined) {
              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: equipmentType,
                  property: 'discountRate',
                  value: parseFloat(item.discount_rate) || 0
                },
              });
            }
          });

          // Process sign data separately
          signList.forEach(sign => {
            const matchedItem = equipmentData.find((item: any) => item.name === sign.dbName);
            if (matchedItem) {
              const price = parseFloat(matchedItem.price);

              // Update price
              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: sign.key,
                  property: 'price',
                  value: price
                },
              });

              // Update useful life
              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: sign.key,
                  property: 'usefulLife',
                  value: matchedItem.depreciation_rate_useful_life || 365
                },
              });

              // Update payback period
              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: sign.key,
                  property: 'paybackPeriod',
                  value: matchedItem.payback_period || DEFAULT_PAYBACK_PERIOD
                },
              });

              // Update discount rate if available
              if (matchedItem.discount_rate) {
                dispatch({
                  type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                  payload: {
                    type: sign.key,
                    property: 'discountRate',
                    value: parseFloat(matchedItem.discount_rate) || 0
                  },
                });
              }
            } else {
              console.warn(`No matching sign data found for database name: ${sign.dbName}`);

              // Set default values for signs if not found
              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: sign.key,
                  property: 'price',
                  value: getDefaultSignPrice(sign.key)
                },
              });

              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: sign.key,
                  property: 'usefulLife',
                  value: 365 // 1 year default
                },
              });

              dispatch({
                type: 'UPDATE_STATIC_EQUIPMENT_INFO',
                payload: {
                  type: sign.key,
                  property: 'paybackPeriod',
                  value: DEFAULT_PAYBACK_PERIOD
                },
              });
            }
          });
        }
      } catch (error) {
        console.error('Error initializing equipment data:', error);

        // Set default values for all equipment types in case of error
        [...standardEquipmentList, ...lightAndDrumList].forEach(equipmentType => {
          // Set default price (placeholder)
          dispatch({
            type: 'UPDATE_STATIC_EQUIPMENT_INFO',
            payload: {
              type: equipmentType,
              property: 'price',
              value: getDefaultPrice(equipmentType)
            },
          });

          // Set default useful life (365 days = 1 year)
          dispatch({
            type: 'UPDATE_STATIC_EQUIPMENT_INFO',
            payload: {
              type: equipmentType,
              property: 'usefulLife',
              value: 365
            },
          });

          // Set default payback period
          dispatch({
            type: 'UPDATE_STATIC_EQUIPMENT_INFO',
            payload: {
              type: equipmentType,
              property: 'paybackPeriod',
              value: DEFAULT_PAYBACK_PERIOD
            },
          });
        });

        // Set default values for signs
        signList.forEach(sign => {
          dispatch({
            type: 'UPDATE_STATIC_EQUIPMENT_INFO',
            payload: {
              type: sign.key,
              property: 'price',
              value: getDefaultSignPrice(sign.key)
            },
          });

          dispatch({
            type: 'UPDATE_STATIC_EQUIPMENT_INFO',
            payload: {
              type: sign.key,
              property: 'usefulLife',
              value: 365
            },
          });

          dispatch({
            type: 'UPDATE_STATIC_EQUIPMENT_INFO',
            payload: {
              type: sign.key,
              property: 'paybackPeriod',
              value: DEFAULT_PAYBACK_PERIOD
            },
          });
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeEquipmentData();
  }, [dispatch]);

  // Helper function to map API item name to equipment type
  const getEquipmentTypeFromName = (name: string): EquipmentType | null => {
    // Map database names to equipment types
    const nameToType: Record<string, EquipmentType> = {
      "4' Ft Type III": "fourFootTypeIII",
      "H Stands": "hStand",
      "Posts 12ft": "post",
      "6 Ft Wings": "sixFootWings",
      "SL Metal Stands": "metalStands",
      "Covers": "covers",
      "Sand Bag": "sandbag",
      "HI Vertical Panels": "HIVP",
      "Type XI Vertical Panels": "TypeXIVP",
      "B-Lites": "BLights",
      "A/C-Lites": "ACLights",
      "Sharps": "sharps",
    };

    return nameToType[name] || null;
  };

  // Helper function to get default price for equipment type (fallback values)
  const getDefaultPrice = (equipmentType: EquipmentType): number => {
    const defaultPrices: Record<string, number> = {
      fourFootTypeIII: 200,
      hStand: 150,
      post: 100,
      sixFootWings: 180,
      metalStands: 120,
      covers: 50,
      sandbag: 10,
      HIVP: 80,
      TypeXIVP: 90,
      BLights: 70,
      ACLights: 120,
      sharps: 60
    };

    return defaultPrices[equipmentType] || 100;
  };

  // Helper function to get default price for sign sheeting types
  const getDefaultSignPrice = (sheetingType: SheetingType): number => {
    const defaultSignPrices: Record<SheetingType, number> = {
      HI: 150,
      DG: 120,
      Special: 200
    };

    return defaultSignPrices[sheetingType] || 150;
  };

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
    mptRental?.phases?.[currentPhase]?.standardEquipment?.sixFootWings?.quantity,
    dispatch,
    currentPhase
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
      [field]: safeNumber(value)
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
    setCurrentStep(6);
  };

  // Safely get equipment quantities
  const getEquipmentQuantity = (equipmentKey: EquipmentType): number | undefined => {
    if (!mptRental?.phases || !mptRental.phases[currentPhase]) return undefined;
    return safeNumber(mptRental.phases[currentPhase].standardEquipment[equipmentKey]?.quantity);
  };

  // Safely get equipment price
  const getEquipmentPrice = (equipmentKey: EquipmentType): number | undefined => {
    if (!mptRental?.staticEquipmentInfo || !mptRental.staticEquipmentInfo[equipmentKey]) return undefined;
    return safeNumber(mptRental.staticEquipmentInfo[equipmentKey]?.price);
  };

  // Get minimum allowed quantity for an equipment type
  const getMinQuantity = (equipmentKey: EquipmentType): number | undefined => {
    if (!mptRental?.phases || !mptRental.phases[currentPhase]) return undefined;

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
      default:
        return 0;
    }
  };

  return (
    <div>
      <div className="relative">
        <button
          onClick={() => setCurrentStep(5)}
          className={cn(
            "group flex w-full items-start gap-4 py-4 text-left",
            currentStep === 4 ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm",
              5 <= currentStep
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground bg-background"
            )}
          >
            5
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-base font-medium">{step.name}</div>
            <div className="text-sm text-muted-foreground">
              {step.description}
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {currentStep === 5 && (
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

              {/* MPT Equipment Tab (combined with Light & Drum) */}
              <TabsContent value="mpt" className="mt-6">
                <div className="space-y-8">
                  {/* MPT Equipment Section */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      MPT Equipment - Phase {currentPhase + 1}
                    </h3>
                    <div className="flex flex-col w-1/3 gap-0">
                      {standardEquipmentList.map((equipmentKey) => (
                        equipmentKey === 'sandbag' ? (
                          <div key={equipmentKey} className="p-2 rounded-md">
                            <div className="font-medium mb-2">{formatLabel(equipmentKey)}</div>
                            <div className="text-muted-foreground">Quantity: {sandbagQuantity}</div>
                            <div className="text-sm text-muted-foreground mt-2">Cost: ${getEquipmentPrice(equipmentKey)?.toFixed(2) || ''}</div>
                          </div>
                        ) : (
                          <div key={equipmentKey} className="p-4 rounded-md">
                            <div className="font-medium mb-2">{formatLabel(equipmentKey)}</div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={`quantity-${equipmentKey}`} className="flex text-muted-foreground">Quantity:</Label>
                              <Input
                                id={`quantity-${equipmentKey}`}
                                type="number"
                                min={getMinQuantity(equipmentKey)}
                                value={getEquipmentQuantity(equipmentKey) || ''}
                                onChange={(e) => handleStandardInputChange(
                                  parseFloat(e.target.value) || 0,
                                  equipmentKey,
                                  'quantity'
                                )}
                                className="w-full"
                              />
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">Cost: ${getEquipmentPrice(equipmentKey)?.toFixed(2) || ''}</div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Light and Drum Rental Section */}
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

                    <div className="flex flex-col">
                      {lightAndDrumList.map((equipmentKey) => (
                        <div key={equipmentKey} className="p-2 rounded-md">
                          <div className="font-medium mb-2">{formatLabel(equipmentKey)}</div>
                          <div className="flex flex-col w-1/3 gap-2 mb-2">
                            <Label htmlFor={`quantity-light-${equipmentKey}`} className="text-muted-foreground">Quantity:</Label>
                            <Input
                              id={`quantity-light-${equipmentKey}`}
                              type="number"
                              min={getMinQuantity(equipmentKey)}
                              value={getEquipmentQuantity(equipmentKey) || ''}
                              onChange={(e) => handleStandardInputChange(
                                parseFloat(e.target.value) || 0,
                                equipmentKey,
                                'quantity'
                              )}
                              className="w-full"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">Cost: ${getEquipmentPrice(equipmentKey)?.toFixed(2) || ''}</div>
                          <div className="text-xs text-muted-foreground">Daily Price: ${calculateLightDailyRateCosts(mptRental, getEquipmentPrice(equipmentKey) || 0)?.toFixed(2) || ''}</div>
                          {adminData?.emergencyJob && (
                            <div className="flex flex-col w-1/3 gap-2 mt-2">
                              <Label htmlFor={`emergency-${equipmentKey}`} className="text-muted-foreground">Emergency Rate:</Label>
                              <Input
                                id={`emergency-${equipmentKey}`}
                                type="number"
                                min={0}
                                step={0.01}
                                value={adminData?.emergencyFields?.[`emergency${equipmentKey}`] || ''}
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
                                className="w-full"
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
                        <Label className="mb-2" htmlFor="itemName">Item Name</Label>
                        <Input
                          id="itemName"
                          value={itemName}
                          onChange={(e) => setItemName(e.target.value)}
                          placeholder="Enter item name"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="mb-2" htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min={0}
                          value={newCustomItem.quantity || ''}
                          onChange={(e) => handleNewItemInputChange('quantity', parseFloat(e.target.value) || 0)}
                          placeholder=""
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="mb-2" htmlFor="cost">Cost</Label>
                        <Input
                          id="cost"
                          type="number"
                          min={0}
                          step={0.01}
                          value={newCustomItem.cost || ''}
                          onChange={(e) => handleNewItemInputChange('cost', parseFloat(e.target.value) || 0)}
                          placeholder=""
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="mb-2" htmlFor="usefulLife">Useful Life (days)</Label>
                        <Input
                          id="usefulLife"
                          type="number"
                          min={0}
                          value={newCustomItem.usefulLife || ''}
                          onChange={(e) => handleNewItemInputChange('usefulLife', parseFloat(e.target.value) || 0)}
                          placeholder=""
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
                  <EquipmentRentalTab/>
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
                  <FlaggingServicesTab/>
                </div>
              </TabsContent>

              {/* Sale Items Tab */}
              <TabsContent value="sale" className="mt-6">
                <div className="text-center py-6 text-muted-foreground">
                  <SaleItemsStep/>
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
              <Button variant="outline" onClick={() => setCurrentStep(4)}>
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

export default BidItemsStep5;