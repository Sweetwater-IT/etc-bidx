"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import React, { useEffect, useState } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { safeNumber } from "@/lib/safe-number";
import { calculateFlaggingCostSummary } from "@/lib/mptRentalHelperFunctions";
import { Flagging } from "@/types/TFlagging";
import StandardPricingModal from "../standard-pricing-modal";


// Markup percentages arrays for rated and non-rated jobs
const NON_RATED_MARKUP_PERCENTAGES = [50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70, 72.5, 75, 77.5];
const RATED_MARKUP_PERCENTAGES = [42.5, 45, 47.5, 50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70];



const FlaggingServicesTab = () => {
  const { adminData, flagging, dispatch } = useEstimate();
  const [flaggingCostSummary, setFlaggingCostSummary] = useState<any>(null);
  const [selectedMarkupRate, setSelectedMarkupRate] = useState<number | null>(null);
  const [displayEquipCost, setDisplayEquipCost] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Calculate equipment cost
  useEffect(() => {
    const ec = getEquipCost();
    setDisplayEquipCost(ec);
  }, [flagging?.TMA, flagging?.messageBoards, flagging?.arrowBoards]);

  // Initialize flagging services if needed
  useEffect(() => {
    
    const fetchFlaggingStaticData = async () => {
      try {
        const flaggingResponse = await fetch('/api/flagging');
        if (flaggingResponse.ok) {
          const flaggingData = await flaggingResponse.json();
          const flaggingObject = flaggingData.data[0];
          
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
  }, [dispatch, flagging]);

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
  }, [flagging, adminData]);

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

  // Calculate equipment cost
  const getEquipCost = () => {
    if (!flagging) return 0;
    
    const arrowBoardsCost = Number(safeNumber(flagging?.arrowBoards.quantity) * flagging.arrowBoards.cost);
    const messageBoardsCost = Number(safeNumber(flagging?.messageBoards.quantity) * flagging.messageBoards.cost);
    const tmaCost = Number(safeNumber(flagging?.TMA.quantity) * flagging.TMA.cost);

    return arrowBoardsCost + messageBoardsCost + tmaCost;
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
      <h3 className="text-base font-semibold mb-4">
        Flagging Services
      </h3>
      
      {/* Standard Pricing Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Standard Pricing</DialogTitle>
            <DialogDescription>
              Enter the standard lump sum for flagging services.
            </DialogDescription>
          </DialogHeader>
          <StandardPricingModal onClose={close}/>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        {/* General Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <Label htmlFor="standard-pricing">Standard Pricing</Label>
                  <Switch
                    id="standard-pricing"
                    checked={flagging?.standardPricing || false}
                    onCheckedChange={handleStandardPricingToggle}
                  />
                </div>
                
                {flagging?.standardPricing && (
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => setDialogOpen(true)}
                  >
                    Edit Standard Pricing
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rate-type">Rate Type</Label>
                <Select
                  value={adminData.rated || ""}
                  onValueChange={(value) => dispatch({
                    type: 'UPDATE_ADMIN_DATA',
                    payload: {
                      key: 'rated',
                      value
                    }
                  })}
                  disabled={flagging?.standardPricing}
                >
                  <SelectTrigger id="rate-type" className="w-full">
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select rate type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rated">Rated</SelectItem>
                    <SelectItem value="nonRated">Non-Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gas-cost">Gas Cost Per Gallon ($)</Label>
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  <Input
                    id="gas-cost"
                    type="number"
                    min={0}
                    step={0.01}
                    value={safeNumber(flagging?.fuelCostPerGallon) || ""}
                    onChange={(e) => handleInputChange('fuelCostPerGallon', parseFloat(e.target.value) || 0)}
                    disabled={flagging?.standardPricing}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">County: {adminData.county?.name || "N/A"}</span>
                <span className="text-sm text-muted-foreground">Branch: {adminData.county?.branch || "N/A"}</span>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Label htmlFor="flagging-rate">Flagging Rate</Label>
                  <div className="flex items-center">
                    <DollarSign className="mr-1 h-4 w-4" />
                    <Input
                      id="flagging-rate"
                      value={adminData.county?.flaggingRate || ""}
                      disabled
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Label htmlFor="flagging-base-rate">Flagging Base Rate</Label>
                  <div className="flex items-center">
                    <DollarSign className="mr-1 h-4 w-4" />
                    <Input
                      id="flagging-base-rate"
                      type="number"
                      min={0}
                      step={0.01}
                      value={adminData.county?.flaggingBaseRate || ""}
                      onChange={(e) => handleCountyRateChange('flaggingBaseRate', parseFloat(e.target.value) || 0)}
                      disabled={flagging?.standardPricing}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Label htmlFor="flagging-fringe-rate">Flagging Fringe Rate</Label>
                  <div className="flex items-center">
                    <DollarSign className="mr-1 h-4 w-4" />
                    <Input
                      id="flagging-fringe-rate"
                      type="number"
                      min={0}
                      step={0.01}
                      value={adminData.county?.flaggingFringeRate || ""}
                      onChange={(e) => handleCountyRateChange('flaggingFringeRate', parseFloat(e.target.value) || 0)}
                      disabled={flagging?.standardPricing}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Resources and Equipment Section */}
        <Card>
          <CardHeader>
            <CardTitle>Resources and Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="personnel">Personnel</Label>
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <Input
                    id="personnel"
                    type="number"
                    min={0}
                    value={safeNumber(flagging?.personnel) || ""}
                    onChange={(e) => handleInputChange('personnel', parseInt(e.target.value) || 0)}
                    disabled={flagging?.standardPricing}
                    placeholder="Number of personnel"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trucks">Number of Trucks</Label>
                <div className="flex items-center">
                  <Truck className="mr-2 h-4 w-4" />
                  <Input
                    id="trucks"
                    type="number"
                    min={0}
                    value={safeNumber(flagging?.numberTrucks) || ""}
                    onChange={(e) => handleInputChange('numberTrucks', parseInt(e.target.value) || 0)}
                    disabled={flagging?.standardPricing}
                    placeholder="Number of trucks"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ow-miles">One-Way Miles</Label>
                <div className="flex items-center">
                  <Input
                    id="ow-miles"
                    type="number"
                    min={0}
                    value={safeNumber(adminData?.owMileage) || ""}
                    disabled
                    placeholder="One-way mileage"
                  />
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Equipment Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Arrow Boards ($/day)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={flagging?.arrowBoards.cost || ""}
                    onChange={(e) => handleEquipmentInputChange('arrowBoards', 'cost', parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center">
                  <CornerDownRight className="mr-2 h-4 w-4" />
                  <Input
                    type="number"
                    min={0}
                    value={safeNumber(flagging?.arrowBoards.quantity) || ""}
                    onChange={(e) => handleEquipmentInputChange('arrowBoards', 'quantity', parseInt(e.target.value) || 0)}
                    disabled={flagging?.standardPricing}
                    placeholder="Quantity"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-arrow-boards"
                    checked={flagging?.arrowBoards.includeInLumpSum || false}
                    onCheckedChange={(checked) => 
                      handleEquipmentInputChange('arrowBoards', 'includeInLumpSum', checked === true)
                    }
                  />
                  <Label htmlFor="include-arrow-boards">Include in lump sum</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Message Boards ($/day)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={flagging?.messageBoards.cost || ""}
                    onChange={(e) => handleEquipmentInputChange('messageBoards', 'cost', parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center">
                  <Keyboard className="mr-2 h-4 w-4" />
                  <Input
                    type="number"
                    min={0}
                    value={safeNumber(flagging?.messageBoards.quantity) || ""}
                    onChange={(e) => handleEquipmentInputChange('messageBoards', 'quantity', parseInt(e.target.value) || 0)}
                    disabled={flagging?.standardPricing}
                    placeholder="Quantity"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-message-boards"
                    checked={flagging?.messageBoards.includeInLumpSum || false}
                    onCheckedChange={(checked) => 
                      handleEquipmentInputChange('messageBoards', 'includeInLumpSum', checked === true)
                    }
                  />
                  <Label htmlFor="include-message-boards">Include in lump sum</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>TMA ($/day)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={flagging?.TMA.cost || ""}
                    onChange={(e) => handleEquipmentInputChange('TMA', 'cost', parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center">
                  <Car className="mr-2 h-4 w-4" />
                  <Input
                    type="number"
                    min={0}
                    value={safeNumber(flagging?.TMA.quantity) || ""}
                    onChange={(e) => handleEquipmentInputChange('TMA', 'quantity', parseInt(e.target.value) || 0)}
                    disabled={flagging?.standardPricing}
                    placeholder="Quantity"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-tma"
                    checked={flagging?.TMA.includeInLumpSum || false}
                    onCheckedChange={(checked) => 
                      handleEquipmentInputChange('TMA', 'includeInLumpSum', checked === true)
                    }
                  />
                  <Label htmlFor="include-tma">Include in lump sum</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flagging Cost Summary Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Flagging Cost Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium">Description</div>
              <div className="font-medium">Hours</div>
              <div className="font-medium">Cost</div>
              
              <div>On Site Job Hours</div>
              <div>
                <Input
                  type="number"
                  min={0}
                  value={safeNumber(flagging?.onSiteJobHours) || ""}
                  onChange={(e) => handleInputChange('onSiteJobHours', parseInt(e.target.value) || 0)}
                  disabled={flagging?.standardPricing}
                />
              </div>
              <div className="flex items-center">
                ${flaggingCostSummary ? flaggingCostSummary.onSiteJobHoursCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </div>
              
              <div>Round Trip Travel Time Hours</div>
              <div>
                <Input
                  type="number"
                  value={Math.ceil((safeNumber(adminData?.owTravelTimeMins) * 2) / 60)}
                  disabled
                />
              </div>
              <div className="flex items-center">
                ${flaggingCostSummary ? flaggingCostSummary.rtTravelTimeHoursCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </div>
              
              <div>Over Time Hours</div>
              <div>{getOvertimeHours()}</div>
              <div></div>
              
              <div className="font-medium">Total Hours</div>
              <div>{getTotalHours()}</div>
              <div className="font-medium">
                ${flaggingCostSummary ? flaggingCostSummary.totalHoursCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </div>
              
              <div></div>
              <div className="font-medium">Total Labor Cost</div>
              <div className="font-medium">
                ${flaggingCostSummary ? flaggingCostSummary.totalLaborCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </div>
              
              <div></div>
              <div className="font-medium">Truck and Fuel Cost</div>
              <div className="font-medium">
                ${flaggingCostSummary ? flaggingCostSummary.totalFuelCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </div>
              
              <div></div>
              <div className="font-medium">Additional Costs</div>
              <div>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={safeNumber(flagging?.additionalEquipmentCost) || ""}
                  onChange={(e) => handleInputChange('additionalEquipmentCost', parseFloat(e.target.value) || 0)}
                  disabled={flagging?.standardPricing}
                />
              </div>
              
              <div></div>
              <div className="font-bold">Total Cost</div>
              <div className="font-bold">
                ${flaggingCostSummary ? flaggingCostSummary.totalFlaggingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </div>
              
              <div></div>
              <div className="font-medium">Total Cost Per Hour</div>
              <div className="font-medium">
                ${flaggingCostSummary ? flaggingCostSummary.totalCostPerHour.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </div>
              
              <div></div>
              <div>Total Equipment Revenue</div>
              <div>${displayEquipCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </CardContent>
        </Card>

        {/* Flagging Pricing Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Flagging Pricing</CardTitle>
          </CardHeader>
          <CardContent>
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
                      disabled={flagging?.standardPricing}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FlaggingServicesTab;