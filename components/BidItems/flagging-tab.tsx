"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Clock, 
  DollarSign, 
  User, 
  Truck, 
  CornerDownRight, 
  Keyboard, 
  Car
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { safeNumber } from "@/lib/safe-number";
import { calculateFlaggingCostSummary } from "@/lib/mptRentalHelperFunctions";
import { Flagging } from "@/types/TFlagging";
import StandardPricingModal from "../standard-pricing-modal";


// Markup percentages arrays for rated and non-rated jobs
const NON_RATED_MARKUP_PERCENTAGES = [50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70, 72.5, 75, 77.5];
const RATED_MARKUP_PERCENTAGES = [42.5, 45, 47.5, 50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70];

const FlaggingServicesTab = () => {
  const { adminData, flagging, dispatch, editable } = useEstimate();
  const [flaggingCostSummary, setFlaggingCostSummary] = useState<any>(null);
  const [selectedMarkupRate, setSelectedMarkupRate] = useState<number | null>(null);
  const [displayEquipCost, setDisplayEquipCost] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Calculate equipment cost
  const getEquipCost = useCallback(() => {
    if (!flagging) return 0;
    
    const arrowBoardsCost = Number(safeNumber(flagging?.arrowBoards.quantity) * flagging.arrowBoards.cost);
    const messageBoardsCost = Number(safeNumber(flagging?.messageBoards.quantity) * flagging.messageBoards.cost);
    const tmaCost = Number(safeNumber(flagging?.TMA.quantity) * flagging.TMA.cost);

    return arrowBoardsCost + messageBoardsCost + tmaCost;
  }, [flagging]);

  useEffect(() => {
    const ec = getEquipCost();
    setDisplayEquipCost(ec);
  }, [getEquipCost]);

  // Initialize flagging services if needed
  useEffect(() => {
    
    const fetchFlaggingStaticData = async () => {
      try {
        const flaggingResponse = await fetch('/api/flagging');
        if (flaggingResponse.ok) {
          const flaggingData = await flaggingResponse.json();
          const flaggingObject = flaggingData.data[0];
          console.log(flaggingObject)
          dispatch({ 
            type: 'UPDATE_FLAGGING', 
            payload: { 
              key: 'fuelEconomyMPG', 
              value: Number(flaggingObject.fuel_economy_mpg) 
            } 
          });
          
          dispatch({ 
            type: 'UPDATE_FLAGGING', 
            payload: { 
              key: 'truckDispatchFee', 
              value: Number(flaggingObject.truck_dispatch_fee) 
            } 
          });
          
          dispatch({ 
            type: 'UPDATE_FLAGGING', 
            payload: { 
              key: 'workerComp', 
              value: Number(flaggingObject.worker_comp) 
            } 
          });
          
          dispatch({ 
            type: 'UPDATE_FLAGGING', 
            payload: { 
              key: 'generalLiability', 
              value: Number(flaggingObject.general_liability) 
            } 
          });
        }
      } catch (error) {
        console.error('Error fetching flagging data:', error);
      }
    };
    
    fetchFlaggingStaticData();
  }, [dispatch]);

  // Set selected markup rate
  useEffect(() => {
    if (!flagging?.markupRate) {
      return;
    }
    setSelectedMarkupRate(flagging?.markupRate);
  }, [flagging?.markupRate]);

  // Calculate flagging cost summary
  useEffect(() => {
    if (!flagging || !adminData) {
      return;
    }
    setFlaggingCostSummary(calculateFlaggingCostSummary(adminData, flagging, false));
  }, [flagging, adminData, adminData.county.market]);

  // Handle county rate change
  const handleCountyRateChange = (propertyName: string, value: number) => {
    // Create a new county object with the updated property
    const updatedCounty = {
      ...adminData.county,
      [propertyName]: value
    };

    // Update the entire county object
    dispatch({
      type: 'UPDATE_ADMIN_DATA',
      payload: {
        key: 'county',
        value: updatedCounty,
      },
    });
  };

  // Handle flagging input changes
  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    dispatch({
      type: 'UPDATE_FLAGGING',
      payload: {
        key: field as keyof Flagging,
        value: typeof value === 'string' || typeof value === 'boolean' ? value : Number(value),
      },
    });
  };

  // Handle equipment input changes
  const handleEquipmentInputChange = (field: 'arrowBoards' | 'messageBoards' | 'TMA', subfield: string, value: number | boolean) => {
    if (!flagging) return;

    // Get the current values
    const currentEquipment = flagging[field];
    
    dispatch({
      type: 'UPDATE_FLAGGING',
      payload: {
        key: field,
        value: {
          ...currentEquipment,
          [subfield]: value
        }
      }
    });
  };



  // Calculate markup values
  const calculateMarkupValues = (rate: number) => {
    if (!flaggingCostSummary || !flagging) return { lumpSumWithEquipment: 0, hourlyRate: 0 };

    const arrowBoardsCost = flagging.arrowBoards.includeInLumpSum 
      ? Number(safeNumber(flagging?.arrowBoards.quantity) * flagging.arrowBoards.cost) 
      : 0;
      
    const messageBoardsCost = flagging.messageBoards.includeInLumpSum 
      ? Number(safeNumber(flagging?.messageBoards.quantity) * flagging.messageBoards.cost) 
      : 0;
      
    const tmaCost = flagging.TMA.includeInLumpSum 
      ? Number(safeNumber(flagging?.TMA.quantity) * flagging.TMA.cost) 
      : 0;

    const lumpSum = flaggingCostSummary.totalFlaggingCost / (1 - (rate / 100));
    const lumpSumWithEquipment = arrowBoardsCost + messageBoardsCost + tmaCost + lumpSum;
    const totalHours = Math.ceil((safeNumber(adminData.owTravelTimeMins) * 2) / 60) + flagging.onSiteJobHours;
    const hourlyRate = flagging.personnel !== 0 ? safeNumber(lumpSum / (flagging.personnel * totalHours)) : 0;

    return { lumpSumWithEquipment, hourlyRate };
  };

  // Toggle standard pricing
  const handleStandardPricingToggle = (checked: boolean) => {
    if (!flagging) return;
    
    if (checked) {
      setDialogOpen(true);
    }
    
    handleInputChange('standardPricing', checked);
  };

  // Calculate total hours
  const getTotalHours = () => {
    if (!flagging || !adminData) return 0;
    
    return safeNumber(flagging.onSiteJobHours) + Math.ceil((safeNumber(adminData.owTravelTimeMins) * 2) / 60);
  };

  // Calculate overtime hours
  const getOvertimeHours = () => {
    if (!flagging || !adminData) return 0;
    
    return Math.max(0, (safeNumber(flagging.onSiteJobHours) + Math.ceil((safeNumber(adminData.owTravelTimeMins) * 2) / 60) - 8));
  };

  return (
    <div className="space-y-6">      
      {/* Standard Pricing Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Standard Pricing</DialogTitle>
            <DialogDescription>
              Enter the standard lump sum for flagging services.
            </DialogDescription>
          </DialogHeader>
          <StandardPricingModal onClose={() => setDialogOpen(false)}/>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        {/* General Settings Section */}

        <h3 className="text-lg font-medium mb-3 text-left">General Settings</h3>
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="standard-pricing" className="text-base">Standard Pricing</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="standard-pricing"
                    checked={flagging?.standardPricing || false}
                    onCheckedChange={handleStandardPricingToggle}
                    disabled={!editable}
                    aria-disabled={!editable}
                  />
                  {flagging?.standardPricing && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setDialogOpen(true)}
                      disabled={!editable}
                      aria-disabled={!editable}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="rate-type" className="text-base whitespace-nowrap">Rate Type</Label>
                <div className="w-40">
                  <Select
                    value={adminData.rated || ""}
                    onValueChange={(value) => dispatch({
                      type: 'UPDATE_ADMIN_DATA',
                      payload: {
                        key: 'rated',
                        value
                      }
                    })}
                    disabled={!editable || flagging?.standardPricing}
                    aria-disabled={!editable || flagging?.standardPricing}
                  >
                    <SelectTrigger id="rate-type" className="w-full">
                      <SelectValue placeholder="Select rate type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RATED">RATED</SelectItem>
                      <SelectItem value="NON-RATED">NON-RATED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="gas-cost" className="text-base">Gas Cost Per Gallon ($)</Label>
                <div className="flex items-center">
                  <Input
                    id="gas-cost"
                    type="number"
                    min={0}
                    step={0.01}
                    value={safeNumber(flagging?.fuelCostPerGallon) || ""}
                    onChange={(e) => handleInputChange('fuelCostPerGallon', parseFloat(e.target.value) || 0)}
                    disabled={!editable || flagging?.standardPricing}
                    aria-disabled={!editable || flagging?.standardPricing}
                    placeholder="$ 0.00"
                    className="w-40 text-left"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="flagging-rate" className="text-base">Flagging Rate</Label>
                <div className="flex items-center">

                  <Input
                    id="flagging-rate"
                    value={adminData.county?.flaggingRate || ""}
                    disabled
                    placeholder="$ 0.00"
                    className="w-40 text-left"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="flagging-base-rate" className="text-base">Flagging Base Rate</Label>
                <div className="flex items-center">

                  <Input
                    id="flagging-base-rate"
                    type="number"
                    min={0}
                    placeholder="$ 0.00"
                    step={0.01}
                    value={adminData.county?.flaggingBaseRate || ""}
                    onChange={(e) => handleCountyRateChange('flaggingBaseRate', parseFloat(e.target.value) || 0)}
                    disabled={!editable || flagging?.standardPricing}
                    aria-disabled={!editable || flagging?.standardPricing}
                    className="w-40 text-left"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="flagging-fringe-rate" className="text-base">Flagging Fringe Rate</Label>
                <div className="flex items-center">

                  <Input
                    id="flagging-fringe-rate"
                    type="number"
                    placeholder="$ 0.00"
                    min={0}
                    step={0.01}
                    value={adminData.county?.flaggingFringeRate || ""}
                    onChange={(e) => handleCountyRateChange('flaggingFringeRate', parseFloat(e.target.value) || 0)}
                    disabled={!editable || flagging?.standardPricing}
                    aria-disabled={!editable || flagging?.standardPricing}
                    className="w-40 text-left"
                  />
                </div>
              </div>
          </div>
          
        <Separator className="my-2" />
        {/* Resources and Equipment Section */}
        <h3 className="text-lg font-medium mb-3 text-left">Resources and Equipment</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="personnel" className="text-base">Personnel</Label>
            <div className="flex items-center">
              <Input
                id="personnel"
                type="number"
                min={0}
                value={safeNumber(flagging?.personnel) || ""}
                onChange={(e) => handleInputChange('personnel', parseInt(e.target.value) || 0)}
                disabled={!editable || flagging?.standardPricing}
                aria-disabled={!editable || flagging?.standardPricing}
                className="w-40 text-right"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="trucks" className="text-base">Number of Trucks</Label>
            <div className="flex items-center">
              <Input
                id="trucks"
                type="number"
                min={0}
                value={safeNumber(flagging?.numberTrucks) || ""}
                onChange={(e) => handleInputChange('numberTrucks', parseInt(e.target.value) || 0)}
                disabled={!editable || flagging?.standardPricing}
                aria-disabled={!editable || flagging?.standardPricing}
                className="w-40 text-right"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="ow-miles" className="text-base">One-Way Miles</Label>
            <div className="flex items-center">
              <Input
                id="ow-miles"
                type="number"
                min={0}
                value={safeNumber(adminData?.owMileage) || ""}
                disabled
                className="w-40 text-right"
              />
            </div>
          </div>
          
          {/* Arrow Boards */}
          <div className="flex justify-between items-center">
            <Label className="text-base">Arrow Boards ($/day)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={flagging?.arrowBoards.cost || ""}
              onChange={(e) => handleEquipmentInputChange('arrowBoards', 'cost', parseFloat(e.target.value) || 0)}
              className="w-40 text-right"
              disabled={!editable}
              aria-disabled={!editable}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CornerDownRight className="mr-2 h-4 w-4" />
              <Label className="text-base">Quantity</Label>
            </div>
            <Input
              type="number"
              min={0}
              value={safeNumber(flagging?.arrowBoards.quantity) || ""}
              onChange={(e) => handleEquipmentInputChange('arrowBoards', 'quantity', parseInt(e.target.value) || 0)}
              disabled={!editable || flagging?.standardPricing}
              aria-disabled={!editable || flagging?.standardPricing}
              className="w-40 text-right"
            />
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <Label htmlFor="include-arrow-boards" className="text-base">Include in lump sum</Label>
            <Checkbox
              id="include-arrow-boards"
              checked={flagging?.arrowBoards.includeInLumpSum || false}
              onCheckedChange={(checked) => 
                handleEquipmentInputChange('arrowBoards', 'includeInLumpSum', checked === true)
              }
              disabled={!editable}
              aria-disabled={!editable}
            />
          </div>
          
          {/* Message Boards */}
          <div className="flex justify-between items-center">
            <Label className="text-base">Message Boards ($/day)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={flagging?.messageBoards.cost || ""}
              onChange={(e) => handleEquipmentInputChange('messageBoards', 'cost', parseFloat(e.target.value) || 0)}
              className="w-40 text-right"
              disabled={!editable}
              aria-disabled={!editable}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Keyboard className="mr-2 h-4 w-4" />
              <Label className="text-base">Quantity</Label>
            </div>
            <Input
              type="number"
              min={0}
              value={safeNumber(flagging?.messageBoards.quantity) || ""}
              onChange={(e) => handleEquipmentInputChange('messageBoards', 'quantity', parseInt(e.target.value) || 0)}
              disabled={!editable || flagging?.standardPricing}
              aria-disabled={!editable || flagging?.standardPricing}
              className="w-40 text-right"
            />
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <Label htmlFor="include-message-boards" className="text-base">Include in lump sum</Label>
            <Checkbox
              id="include-message-boards"
              checked={flagging?.messageBoards.includeInLumpSum || false}
              onCheckedChange={(checked) => 
                handleEquipmentInputChange('messageBoards', 'includeInLumpSum', checked === true)
              }
              disabled={!editable}
              aria-disabled={!editable}
            />
          </div>
          
          {/* TMA */}
          <div className="flex justify-between items-center">
            <Label className="text-base">TMA ($/day)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={flagging?.TMA.cost || ""}
              onChange={(e) => handleEquipmentInputChange('TMA', 'cost', parseFloat(e.target.value) || 0)}
              className="w-40 text-right"
              disabled={!editable}
              aria-disabled={!editable}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Car className="mr-2 h-4 w-4" />
              <Label className="text-base">Quantity</Label>
            </div>
            <Input
              type="number"
              min={0}
              value={safeNumber(flagging?.TMA.quantity) || ""}
              onChange={(e) => handleEquipmentInputChange('TMA', 'quantity', parseInt(e.target.value) || 0)}
              disabled={!editable || flagging?.standardPricing}
              aria-disabled={!editable || flagging?.standardPricing}
              className="w-40 text-right"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="include-tma" className="text-base">Include in lump sum</Label>
            <Checkbox
              id="include-tma"
              checked={flagging?.TMA.includeInLumpSum || false}
              onCheckedChange={(checked) => 
                handleEquipmentInputChange('TMA', 'includeInLumpSum', checked === true)
              }
              disabled={!editable}
              aria-disabled={!editable}
            />
          </div>
        </div>

        
        <Separator className="my-2" />
        {/* Flagging Cost Summary Section */}
        <h3 className="text-lg font-medium mb-3 text-left">Cost Summary</h3>
        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="on-site-hours" className="text-base">On Site Job Hours</Label>
            <Input
              id="on-site-hours"
              type="number"
              min={0}
              value={safeNumber(flagging?.onSiteJobHours) || ""}
              onChange={(e) => handleInputChange('onSiteJobHours', parseInt(e.target.value) || 0)}
              disabled={!editable || flagging?.standardPricing}
              aria-disabled={!editable || flagging?.standardPricing}
              className="w-40 text-right"
            />
            <span className="text-sm text-muted-foreground">
              ${flaggingCostSummary && flaggingCostSummary.onSiteJobHoursCost ? flaggingCostSummary.onSiteJobHoursCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <Label htmlFor="travel-time" className="text-base">Round Trip Travel Time Hours</Label>
            <Input
              id="travel-time"
              type="number"
              value={Math.ceil((safeNumber(adminData?.owTravelTimeMins) * 2) / 60)}
              disabled
              readOnly
              className="w-40 text-right"
            />
            <span className="text-sm text-muted-foreground">
              ${flaggingCostSummary && flaggingCostSummary.rtTravelTimeHoursCost ? flaggingCostSummary.rtTravelTimeHoursCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <Label className="text-base">Over Time Hours</Label>
            <span>{getOvertimeHours()}</span>
          </div>
          
          <div className="flex flex-col space-y-1 pt-3 border-t">
            <Label className="text-base font-medium">Total Hours</Label>
            <span className="font-medium">{getTotalHours()}</span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <Label className="text-base font-medium">Total Labor Cost</Label>
            <span className="font-medium">
              ${flaggingCostSummary && flaggingCostSummary.totalLaborCost ? flaggingCostSummary.totalLaborCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <Label className="text-base font-medium">Truck and Fuel Cost</Label>
            <span className="font-medium">
              ${flaggingCostSummary && flaggingCostSummary.totalFuelCost ? flaggingCostSummary.totalFuelCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <Label htmlFor="additional-costs" className="text-base font-medium">Additional Costs</Label>
            <Input
              id="additional-costs"
              type="number"
              min={0}
              step={0.01}
              value={safeNumber(flagging?.additionalEquipmentCost) || ""}
              onChange={(e) => handleInputChange('additionalEquipmentCost', parseFloat(e.target.value) || 0)}
              disabled={!editable || flagging?.standardPricing}
              aria-disabled={!editable || flagging?.standardPricing}
              className="w-40 text-right"
            />
          </div>
          
          <div className="flex flex-col space-y-1 pt-3 border-t">
            <Label className="text-base font-bold">Total Cost</Label>
            <span className="font-bold">
              ${flaggingCostSummary && flaggingCostSummary.totalFlaggingCost ? flaggingCostSummary.totalFlaggingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <Label className="text-base font-medium">Total Cost Per Hour</Label>
            <span className="font-medium">
              ${flaggingCostSummary && flaggingCostSummary.totalCostPerHour ? flaggingCostSummary.totalCostPerHour.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <Label className="text-base">Total Equipment Revenue</Label>
            <span>
              ${displayEquipCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
         
        
        <Separator className="my-2" />
        {/* Flagging Pricing Section */}
        <h3 className="text-lg font-medium mb-3 text-left">Flagging Pricing</h3>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="font-medium">Gross Margin Target</div>
          <div className="font-medium">Lump Sum</div>
          <div className="font-medium">Hourly Rate / Man</div>
          <div className="font-medium text-center">Use this price?</div>
        </div>
            
        {/* Markup Rates */}
        {(adminData?.rated === 'RATED' ? RATED_MARKUP_PERCENTAGES : NON_RATED_MARKUP_PERCENTAGES).map(rate => {
          const { lumpSumWithEquipment, hourlyRate } = calculateMarkupValues(rate);
              
          return (
            <div key={rate} className="grid grid-cols-4 gap-4 py-2 border-t">
              <div>{rate}%</div>
              <div>${safeNumber(lumpSumWithEquipment).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>${hourlyRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="flex justify-center">
                <Checkbox
                  checked={flagging?.markupRate === rate}
                  disabled={!editable || flagging?.standardPricing}
                  aria-disabled={!editable || flagging?.standardPricing}
                  onCheckedChange={(checked) => {
                    setSelectedMarkupRate(null);
                    if (checked) {
                      setSelectedMarkupRate(rate);
                      handleInputChange('markupRate', rate);
                    }
                  }}
                />
              </div>
            </div>
          );
          })}
      </div>
    </div>
  );
};

export default FlaggingServicesTab;