"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

// Markup percentages arrays for rated and non-rated jobs
const NON_RATED_MARKUP_PERCENTAGES = [50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70, 72.5, 75, 77.5];
const RATED_MARKUP_PERCENTAGES = [42.5, 45, 47.5, 50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70];

const ServiceWorkTab = () => {
  const { adminData, serviceWork, dispatch } = useEstimate();
  const [serviceWorkSummary, setServiceWorkSummary] = useState<any>(null);
  const [selectedMarkupRate, setSelectedMarkupRate] = useState<number | null>(null);
  const [displayEquipCost, setDisplayEquipCost] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Calculate equipment cost
  const getEquipCost = useCallback(() => {
    if (!serviceWork) return 0;
    
    const arrowBoardsCost = Number(safeNumber(serviceWork?.arrowBoards.quantity) * serviceWork.arrowBoards.cost);
    const messageBoardsCost = Number(safeNumber(serviceWork?.messageBoards.quantity) * serviceWork.messageBoards.cost);
    const tmaCost = Number(safeNumber(serviceWork?.TMA.quantity) * serviceWork.TMA.cost);

    return arrowBoardsCost + messageBoardsCost + tmaCost;
  }, [serviceWork]);

  useEffect(() => {
    const ec = getEquipCost();
    setDisplayEquipCost(ec);
  }, [getEquipCost]);

  // Initialize service work if needed
  useEffect(() => {
    if (!serviceWork) {
      dispatch({ type: 'ADD_SERVICE_WORK' });
    }
    
    const fetchFlaggingStaticData = async () => {
      try {
        const flaggingResponse = await fetch('/api/flagging');
        if (flaggingResponse.ok) {
          const flaggingData = await flaggingResponse.json();
          const flaggingObject = flaggingData.data[0];
          
          dispatch({ 
            type: 'UPDATE_SERVICE_WORK', 
            payload: { 
              key: 'fuelEconomyMPG', 
              value: Number(flaggingObject.fuel_economy_mpg) 
            } 
          });
          
          dispatch({ 
            type: 'UPDATE_SERVICE_WORK', 
            payload: { 
              key: 'truckDispatchFee', 
              value: Number(flaggingObject.truck_dispatch_fee) 
            } 
          });
          
          dispatch({ 
            type: 'UPDATE_SERVICE_WORK', 
            payload: { 
              key: 'workerComp', 
              value: Number(flaggingObject.worker_comp) 
            } 
          });
          
          dispatch({ 
            type: 'UPDATE_SERVICE_WORK', 
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
    if (!serviceWork?.markupRate) {
      return;
    }
    setSelectedMarkupRate(serviceWork?.markupRate);
  }, [serviceWork?.markupRate]);

  // Calculate service work cost summary
  useEffect(() => {
    if (!serviceWork || !adminData) {
      return;
    }
    setServiceWorkSummary(calculateFlaggingCostSummary(adminData, serviceWork, true));
  }, [serviceWork, adminData]);

  // Handle input changes
  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    dispatch({
      type: 'UPDATE_SERVICE_WORK',
      payload: {
        key: field as keyof Flagging,
        value: typeof value === 'string' || typeof value === 'boolean' ? value : Number(value),
      },
    });
  };

  // Handle equipment input changes
  const handleEquipmentInputChange = (field: 'arrowBoards' | 'messageBoards' | 'TMA', subfield: string, value: number | boolean) => {
    if (!serviceWork) return;

    const currentEquipment = serviceWork[field];
    
    dispatch({
      type: 'UPDATE_SERVICE_WORK',
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
    if (!serviceWorkSummary || !serviceWork) return { lumpSumWithEquipment: 0, hourlyRate: 0 };

    const arrowBoardsCost = serviceWork.arrowBoards.includeInLumpSum 
      ? Number(safeNumber(serviceWork?.arrowBoards.quantity) * serviceWork.arrowBoards.cost) 
      : 0;
      
    const messageBoardsCost = serviceWork.messageBoards.includeInLumpSum 
      ? Number(safeNumber(serviceWork?.messageBoards.quantity) * serviceWork.messageBoards.cost) 
      : 0;
      
    const tmaCost = serviceWork.TMA.includeInLumpSum 
      ? Number(safeNumber(serviceWork?.TMA.quantity) * serviceWork.TMA.cost) 
      : 0;

    const lumpSum = serviceWorkSummary.totalFlaggingCost / (1 - (rate / 100));
    const lumpSumWithEquipment = arrowBoardsCost + messageBoardsCost + tmaCost + lumpSum;
    const totalHours = Math.ceil((safeNumber(adminData.owTravelTimeMins) * 2) / 60) + serviceWork.onSiteJobHours;
    const hourlyRate = serviceWork.personnel !== 0 ? safeNumber(lumpSum / (serviceWork.personnel * totalHours)) : 0;

    return { lumpSumWithEquipment, hourlyRate };
  };

  // Calculate total hours
  const getTotalHours = () => {
    if (!serviceWork || !adminData) return 0;
    
    return safeNumber(serviceWork.onSiteJobHours) + Math.ceil((safeNumber(adminData.owTravelTimeMins) * 2) / 60);
  };

  // Calculate overtime hours
  const getOvertimeHours = () => {
    if (!serviceWork || !adminData) return 0;
    
    return Math.max(0, (safeNumber(serviceWork.onSiteJobHours) + Math.ceil((safeNumber(adminData.owTravelTimeMins) * 2) / 60) - 8));
  };

  return (
    <div className="space-y-6">      
      <div className="space-y-8">
        {/* General Settings Section */}
        <h3 className="text-lg font-medium mb-3 text-left">General Settings</h3>
        <div className="space-y-4">          
          <div className="flex justify-between items-center">
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
          
          <div className="flex justify-between items-center">
            <Label htmlFor="gas-cost" className="text-base">Gas Cost Per Gallon ($)</Label>
            <div className="flex items-center">
              <DollarSign className="mr-1 h-4 w-4" />
              <Input
                id="gas-cost"
                type="number"
                min={0}
                step={0.01}
                value={safeNumber(serviceWork?.fuelCostPerGallon) || ""}
                onChange={(e) => handleInputChange('fuelCostPerGallon', parseFloat(e.target.value) || 0)}
                className="w-40 text-right"

              />
            </div>
          </div>
          
          <div className="space-y-2 flex flex-col items-end">
            <div className="text-sm text-muted-foreground">County: {adminData.county.name}</div>
            <div className="text-sm text-muted-foreground">Branch: {adminData.county.branch}</div>
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="shop-rate" className="text-base">Shop Rate</Label>
            <div className="flex items-center">
              <DollarSign className="mr-1 h-4 w-4" />
              <Input
                id="shop-rate"
                value={adminData.county?.shopRate || ""}
                disabled
                readOnly
                className="w-40 text-right"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="base-rate" className="text-base">Base Rate</Label>
            <div className="flex items-center">
              <DollarSign className="mr-1 h-4 w-4" />
              <Input
                id="base-rate"
                value={adminData.county?.laborRate || ""}
                disabled
                readOnly
                className="w-40 text-right"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="fringe-rate" className="text-base">Fringe Rate</Label>
            <div className="flex items-center">
              <DollarSign className="mr-1 h-4 w-4" />
              <Input
                id="fringe-rate"
                value={adminData.county?.fringeRate || ""}
                disabled
                readOnly
                className="w-40 text-right"
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
              <User className="mr-1 h-4 w-4" />
              <Input
                id="personnel"
                type="number"
                min={0}
                value={safeNumber(serviceWork?.personnel) || ""}
                onChange={(e) => handleInputChange('personnel', parseInt(e.target.value) || 0)}
                className="w-40 text-right"

              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="trucks" className="text-base">Number of Trucks</Label>
            <div className="flex items-center">
              <Truck className="mr-1 h-4 w-4" />
              <Input
                id="trucks"
                type="number"
                min={0}
                value={safeNumber(serviceWork?.numberTrucks) || ""}
                onChange={(e) => handleInputChange('numberTrucks', parseInt(e.target.value) || 0)}

                className="w-40 text-right"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="ow-miles" className="text-base">One-Way Miles</Label>
            <Input
              id="ow-miles"
              type="number"
              min={0}
              value={safeNumber(adminData?.owMileage) || ""}
              disabled
              readOnly
              className="w-40 text-right"
            />
          </div>
          
          {/* Arrow Boards */}
          <div className="flex justify-between items-center">
            <Label className="text-base">Arrow Boards ($/day)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={serviceWork?.arrowBoards.cost || ""}
              onChange={(e) => handleEquipmentInputChange('arrowBoards', 'cost', parseFloat(e.target.value) || 0)}
              className="w-40 text-right"
              
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
              value={safeNumber(serviceWork?.arrowBoards.quantity) || ""}
              onChange={(e) => handleEquipmentInputChange('arrowBoards', 'quantity', parseInt(e.target.value) || 0)}
              
              className="w-40 text-right"
            />
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <Label htmlFor="include-arrow-boards" className="text-base">Include in lump sum</Label>
            <Checkbox
              id="include-arrow-boards"
              checked={serviceWork?.arrowBoards.includeInLumpSum || false}
              onCheckedChange={(checked) => 
                handleEquipmentInputChange('arrowBoards', 'includeInLumpSum', checked === true)
              }
              
            />
          </div>
          
          {/* Message Boards */}
          <div className="flex justify-between items-center">
            <Label className="text-base">Message Boards ($/day)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={serviceWork?.messageBoards.cost || ""}
              onChange={(e) => handleEquipmentInputChange('messageBoards', 'cost', parseFloat(e.target.value) || 0)}
              className="w-40 text-right"
              
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
              value={safeNumber(serviceWork?.messageBoards.quantity) || ""}
              onChange={(e) => handleEquipmentInputChange('messageBoards', 'quantity', parseInt(e.target.value) || 0)}
              
              className="w-40 text-right"
            />
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <Label htmlFor="include-message-boards" className="text-base">Include in lump sum</Label>
            <Checkbox
              id="include-message-boards"
              checked={serviceWork?.messageBoards.includeInLumpSum || false}
              onCheckedChange={(checked) => 
                handleEquipmentInputChange('messageBoards', 'includeInLumpSum', checked === true)
              }
              
            />
          </div>
          
          {/* TMA */}
          <div className="flex justify-between items-center">
            <Label className="text-base">TMA ($/day)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={serviceWork?.TMA.cost || ""}
              onChange={(e) => handleEquipmentInputChange('TMA', 'cost', parseFloat(e.target.value) || 0)}
              className="w-40 text-right"
              
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
              value={safeNumber(serviceWork?.TMA.quantity) || ""}
              onChange={(e) => handleEquipmentInputChange('TMA', 'quantity', parseInt(e.target.value) || 0)}
              
              className="w-40 text-right"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="include-tma" className="text-base">Include in lump sum</Label>
            <Checkbox
              id="include-tma"
              checked={serviceWork?.TMA.includeInLumpSum || false}
              onCheckedChange={(checked) => 
                handleEquipmentInputChange('TMA', 'includeInLumpSum', checked === true)
              }
              
            />
          </div>
        </div>

        <Separator className="my-2" />
        
        {/* Service Work Cost Summary Section */}
        <h3 className="text-lg font-medium mb-3 text-left">Service Work Cost Summary</h3>
        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between items-center">
              <Label htmlFor="on-site-hours" className="text-base">On Site Job Hours</Label>
              <span className="text-sm text-muted-foreground">
                ${serviceWorkSummary && serviceWorkSummary.onSiteJobHoursCost ? serviceWorkSummary.onSiteJobHoursCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </span>
            </div>
            <Input
              id="on-site-hours"
              type="number"
              min={0}
              value={safeNumber(serviceWork?.onSiteJobHours) || ""}
              onChange={(e) => handleInputChange('onSiteJobHours', parseInt(e.target.value) || 0)}
              
              className="w-40 text-right"
            />
          </div>
          
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between items-center">
              <Label htmlFor="travel-time" className="text-base">Round Trip Travel Time Hours</Label>
              <span className="text-sm text-muted-foreground">
                ${serviceWorkSummary && serviceWorkSummary.rtTravelTimeHoursCost ? serviceWorkSummary.rtTravelTimeHoursCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </span>
            </div>
            <Input
              id="travel-time"
              type="number"
              value={Math.ceil((safeNumber(adminData?.owTravelTimeMins) * 2) / 60)}
              disabled
              readOnly
              className="w-40 text-right"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Label className="text-base">Over Time Hours</Label>
            <span>{getOvertimeHours()}</span>
          </div>
          
          <div className="flex justify-between items-center pt-3 border-t">
            <Label className="text-base font-medium">Total Hours</Label>
            <span className="font-medium">{getTotalHours()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-base font-medium">Total Labor Cost</span>
            <span className="font-medium">
              ${serviceWorkSummary && serviceWorkSummary.totalLaborCost ? serviceWorkSummary.totalLaborCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-base font-medium">Truck and Fuel Cost</span>
            <span className="font-medium">
              ${serviceWorkSummary && serviceWorkSummary.totalFuelCost ? serviceWorkSummary.totalFuelCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <Label htmlFor="additional-costs" className="text-base font-medium">Additional Costs</Label>
            <Input
              id="additional-costs"
              type="number"
              min={0}
              step={0.01}
              value={safeNumber(serviceWork?.additionalEquipmentCost) || ""}
              onChange={(e) => handleInputChange('additionalEquipmentCost', parseFloat(e.target.value) || 0)}
              
              className="w-40 text-right"
            />
          </div>
          
          <div className="flex justify-between items-center pt-3 border-t">
            <span className="text-base font-bold">Total Cost</span>
            <span className="font-bold">
              ${serviceWorkSummary && serviceWorkSummary.totalFlaggingCost ? serviceWorkSummary.totalFlaggingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-base font-medium">Total Cost Per Hour</span>
            <span className="font-medium">
              ${serviceWorkSummary && serviceWorkSummary.totalCostPerHour ? serviceWorkSummary.totalCostPerHour.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-base">Total Equipment Revenue</span>
            <span>
              ${displayEquipCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <Separator className="my-2" />
        
        {/* Service Work Pricing Section */}
        <h3 className="text-lg font-medium mb-3 text-left">Service Work Pricing</h3>
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
                  checked={serviceWork?.markupRate === rate}
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

export default ServiceWorkTab;