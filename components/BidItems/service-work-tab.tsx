"use client";
import { Button } from "@/components/ui/button";
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Plus,
  Trash2,
  Clock,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { safeNumber } from "@/lib/safe-number";
import { calculateFlaggingCostSummary } from "@/lib/mptRentalHelperFunctions";
import { Flagging } from "@/types/TFlagging";
import EmptyContainer from "./empty-container";
import { formatHoursAndMinutes } from "@/lib/utils";

// Markup percentages arrays for rated and non-rated jobs
const NON_RATED_MARKUP_PERCENTAGES = [50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70, 72.5, 75, 77.5];
const RATED_MARKUP_PERCENTAGES = [42.5, 45, 47.5, 50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70];

interface ServiceWorkItem {
  id: string;
  personnel: number;
  numberTrucks: number;
  onSiteJobHours: number;
  fuelCostPerGallon: number;
  arrowBoards: {
    quantity: number;
    cost: number;
    includeInLumpSum: boolean;
  };
  messageBoards: {
    quantity: number;
    cost: number;
    includeInLumpSum: boolean;
  };
  TMA: {
    quantity: number;
    cost: number;
    includeInLumpSum: boolean;
  };
  additionalEquipmentCost: number;
  markupRate?: number;
}

const ServiceWorkTab = () => {
  const { adminData, serviceWork, dispatch } = useEstimate();
  const [serviceWorkItems, setServiceWorkItems] = useState<ServiceWorkItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ServiceWorkItem | null>(null);
  const [serviceWorkSummary, setServiceWorkSummary] = useState<any>(null);
  const [editingArrowBoardCost, setEditingArrowBoardCost] = useState(false);
  const [editingMessageBoardCost, setEditingMessageBoardCost] = useState(false);
  const [editingTMACost, setEditingTMACost] = useState(false);
  const [arrowBoardCost, setArrowBoardCost] = useState('');
  const [messageBoardCost, setMessageBoardCost] = useState('');
  const [tmaCost, setTMACost] = useState('');
  const [customGrossMargin, setCustomGrossMargin] = useState<{
    customGrossMargin: number,
    lumpSum: number,
    hourlyRate: number,
    item: any;
  }>({
    customGrossMargin: 35,
    lumpSum: 0,
    hourlyRate: 0,
    item: {}
  });

  // Add state for hours and minutes
  const onSiteTotalMinutes = safeNumber(formData?.onSiteJobHours) || 0;
  const onSiteHours = Math.floor(onSiteTotalMinutes / 60);
  const onSiteMinutes = onSiteTotalMinutes % 60;
  const onSiteDecimalHours = (onSiteTotalMinutes / 60).toFixed(1);

  // Handler for hours and minutes inputs
  const handleOnSiteJobTimeChange = (type: 'hours' | 'minutes', value: number) => {
    if (!formData) return;

    const newTotalMinutes =
      type === 'hours' ? value * 60 + (onSiteTotalMinutes % 60) : onSiteHours * 60 + value;

    setFormData({ ...formData, onSiteJobHours: newTotalMinutes });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const item = customGrossMargin?.item;

      if (!item || !adminData || !serviceWork) return;

      const { hourlyRate, lumpSumWithEquipment } = calculateCustomGrossMarginValues({
        item,
        adminData,
        serviceWork,
        markupRate: customGrossMargin.customGrossMargin
      });

      setCustomGrossMargin(prev => ({
        ...prev,
        lumpSum: lumpSumWithEquipment,
        hourlyRate
      }));
    }, 500);

    return () => clearTimeout(timeout);
  }, [customGrossMargin.customGrossMargin, serviceWorkItems, adminData, serviceWork]);

  function calculateCustomGrossMarginValues({
    item,
    adminData,
    serviceWork,
    markupRate
  }: {
    item: ServiceWorkItem,
    adminData,
    serviceWork,
    markupRate: number
  }) {
    if (!adminData || !serviceWork) return { lumpSumWithEquipment: 0, hourlyRate: 0 };

    const tempServiceWork: Flagging = {
      ...serviceWork,
      standardPricing: false,
      standardLumpSum: 0,
      markupRate: 0,
      fuelEconomyMPG: serviceWork?.fuelEconomyMPG ?? 0,
      truckDispatchFee: serviceWork?.truckDispatchFee ?? 0,
      workerComp: serviceWork?.workerComp ?? 0,
      generalLiability: serviceWork?.generalLiability ?? 0,
      personnel: item.personnel,
      numberTrucks: item.numberTrucks,
      onSiteJobHours: item.onSiteJobHours,
      fuelCostPerGallon: item.fuelCostPerGallon,
      arrowBoards: item.arrowBoards,
      messageBoards: item.messageBoards,
      TMA: item.TMA,
      additionalEquipmentCost: item.additionalEquipmentCost
    };

    const summary = calculateFlaggingCostSummary(adminData, tempServiceWork, true);
    if (!summary) return { lumpSumWithEquipment: 0, hourlyRate: 0 };

    const arrowBoardsCost = item.arrowBoards.includeInLumpSum
      ? safeNumber(item.arrowBoards.quantity) * item.arrowBoards.cost
      : 0;

    const messageBoardsCost = item.messageBoards.includeInLumpSum
      ? safeNumber(item.messageBoards.quantity) * item.messageBoards.cost
      : 0;

    const tmaCost = item.TMA.includeInLumpSum
      ? safeNumber(item.TMA.quantity) * item.TMA.cost
      : 0;

    const lumpSum = summary.totalFlaggingCost / (1 - markupRate / 100);
    const lumpSumWithEquipment = lumpSum + arrowBoardsCost + messageBoardsCost + tmaCost;

    const totalHours = Math.ceil((safeNumber(adminData.owTravelTimeMins) * 2) / 60) + item.onSiteJobHours;
    const hourlyRate = item.personnel > 0 ? safeNumber(lumpSum / (item.personnel * totalHours)) : 0;

    return { lumpSumWithEquipment, hourlyRate };
  }

  // Initialize service work if needed
  useEffect(() => {
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

  // Sync service work items with global state
  useEffect(() => {
    if (serviceWork && (serviceWork.personnel > 0 || serviceWork.numberTrucks > 0)) {
      setServiceWorkItems([{
        id: 'service-work',
        personnel: serviceWork.personnel || 0,
        numberTrucks: serviceWork.numberTrucks || 0,
        onSiteJobHours: serviceWork.onSiteJobHours || 0,
        fuelCostPerGallon: serviceWork.fuelCostPerGallon || 0,
        arrowBoards: {
          quantity: serviceWork.arrowBoards?.quantity || 0,
          cost: serviceWork.arrowBoards?.cost || 50,
          includeInLumpSum: serviceWork.arrowBoards?.includeInLumpSum || false
        },
        messageBoards: {
          quantity: serviceWork.messageBoards?.quantity || 0,
          cost: serviceWork.messageBoards?.cost || 100,
          includeInLumpSum: serviceWork.messageBoards?.includeInLumpSum || false
        },
        TMA: {
          quantity: serviceWork.TMA?.quantity || 0,
          cost: serviceWork.TMA?.cost || 500,
          includeInLumpSum: serviceWork.TMA?.includeInLumpSum || false
        },
        additionalEquipmentCost: serviceWork.additionalEquipmentCost || 0,
        markupRate: serviceWork.markupRate || 50
      }]);
    } else {
      setServiceWorkItems([]);
    }
  }, [serviceWork]);

  // Calculate service work cost summary for current form data
  useEffect(() => {
    if (formData && adminData && serviceWork) {
      const tempServiceWork: Flagging = {
        ...serviceWork,
        standardPricing: false,
        standardLumpSum: 0,
        markupRate: 0,
        fuelEconomyMPG: serviceWork?.fuelEconomyMPG ?? 0,
        truckDispatchFee: serviceWork?.truckDispatchFee ?? 0,
        workerComp: serviceWork?.workerComp ?? 0,
        generalLiability: serviceWork?.generalLiability ?? 0,
        personnel: formData.personnel,
        numberTrucks: formData.numberTrucks,
        onSiteJobHours: formData.onSiteJobHours,
        fuelCostPerGallon: formData.fuelCostPerGallon,
        arrowBoards: formData.arrowBoards,
        messageBoards: formData.messageBoards,
        TMA: formData.TMA,
        additionalEquipmentCost: formData.additionalEquipmentCost,
      };
      setServiceWorkSummary(calculateFlaggingCostSummary(adminData, tempServiceWork, true));
    }
  }, [formData, adminData, serviceWork]);

  const handleAddServiceWork = () => {
    setFormData({
      id: Date.now().toString(),
      personnel: 0,
      numberTrucks: 0,
      onSiteJobHours: 0,
      fuelCostPerGallon: 0,
      arrowBoards: {
        quantity: 0,
        cost: 50, // Updated default cost to match FlaggingServicesTab
        includeInLumpSum: false,
      },
      messageBoards: {
        quantity: 0,
        cost: 100, // Updated default cost
        includeInLumpSum: false,
      },
      TMA: {
        quantity: 0,
        cost: 400, // Updated default cost
        includeInLumpSum: false,
      },
      additionalEquipmentCost: 0,
    });
    setEditingIndex(null);
    setDrawerOpen(true);
  };

  const handleEditServiceWork = (index: number) => {
    setFormData({ ...serviceWorkItems[index] });
    setEditingIndex(index);
    setDrawerOpen(true);
  };

  const handleDeleteServiceWork = (index: number) => {
    const newItems = serviceWorkItems.filter((_, i) => i !== index);
    setServiceWorkItems(newItems);
    dispatch({ type: 'DELETE_SERVICE_WORK' });
  };

  const handleFormUpdate = (field: keyof ServiceWorkItem, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleEquipmentInputChange = (field: 'arrowBoards' | 'messageBoards' | 'TMA', subfield: string, value: number | boolean) => {
    if (!formData) return;

    const currentEquipment = formData[field];
    setFormData({
      ...formData,
      [field]: {
        ...currentEquipment,
        [subfield]: value
      }
    });
  };

  const handleSave = () => {
    if (!formData) return;

    const finalFormData = { ...formData, markupRate: 50 };

    // Dispatch to global state
    dispatch({
      type: 'UPDATE_SERVICE_WORK',
      payload: {
        key: 'personnel',
        value: finalFormData.personnel
      }
    });

    dispatch({
      type: 'UPDATE_SERVICE_WORK',
      payload: {
        key: 'markupRate',
        value: 50
      }
    });

    dispatch({
      type: 'UPDATE_SERVICE_WORK',
      payload: {
        key: 'numberTrucks',
        value: finalFormData.numberTrucks
      }
    });

    dispatch({
      type: 'UPDATE_SERVICE_WORK',
      payload: {
        key: 'onSiteJobHours',
        value: finalFormData.onSiteJobHours
      }
    });

    dispatch({
      type: 'UPDATE_SERVICE_WORK',
      payload: {
        key: 'fuelCostPerGallon',
        value: finalFormData.fuelCostPerGallon
      }
    });

    dispatch({
      type: 'UPDATE_SERVICE_WORK',
      payload: {
        key: 'arrowBoards',
        value: finalFormData.arrowBoards
      }
    });

    dispatch({
      type: 'UPDATE_SERVICE_WORK',
      payload: {
        key: 'messageBoards',
        value: finalFormData.messageBoards
      }
    });

    dispatch({
      type: 'UPDATE_SERVICE_WORK',
      payload: {
        key: 'TMA',
        value: finalFormData.TMA
      }
    });

    dispatch({
      type: 'UPDATE_SERVICE_WORK',
      payload: {
        key: 'additionalEquipmentCost',
        value: finalFormData.additionalEquipmentCost
      }
    });

    // Update local state for display purposes
    if (editingIndex !== null) {
      const newItems = [...serviceWorkItems];
      newItems[editingIndex] = finalFormData;
      setServiceWorkItems(newItems);
    } else {
      setServiceWorkItems([...serviceWorkItems, finalFormData]);
    }

    handleCancel();
  };

  const handleCancel = () => {
    setDrawerOpen(false);
    setFormData(null);
    setEditingIndex(null);
    setServiceWorkSummary(null);
  };

  // Calculate markup values for a service work item
  const calculateMarkupValues = (item: ServiceWorkItem, rate: number) => {
    if (!adminData || !serviceWork) return { lumpSumWithEquipment: 0, hourlyRate: 0 };

    // Create a temporary service work object for this specific item
    const tempServiceWork: Flagging = {
      ...serviceWork,
      standardPricing: false,
      standardLumpSum: 0,
      markupRate: 0,
      fuelEconomyMPG: serviceWork?.fuelEconomyMPG ?? 0,
      truckDispatchFee: serviceWork?.truckDispatchFee ?? 0,
      workerComp: serviceWork?.workerComp ?? 0,
      generalLiability: serviceWork?.generalLiability ?? 0,
      personnel: item.personnel,
      numberTrucks: item.numberTrucks,
      onSiteJobHours: item.onSiteJobHours,
      fuelCostPerGallon: item.fuelCostPerGallon,
      arrowBoards: item.arrowBoards,
      messageBoards: item.messageBoards,
      TMA: item.TMA,
      additionalEquipmentCost: item.additionalEquipmentCost,
    };

    // Calculate cost summary for this item
    const itemCostSummary = calculateFlaggingCostSummary(adminData, tempServiceWork, true);

    if (!itemCostSummary) return { lumpSumWithEquipment: 0, hourlyRate: 0 };

    const arrowBoardsCost = item.arrowBoards.includeInLumpSum
      ? Number(safeNumber(item.arrowBoards.quantity) * item.arrowBoards.cost)
      : 0;

    const messageBoardsCost = item.messageBoards.includeInLumpSum
      ? Number(safeNumber(item.messageBoards.quantity) * item.messageBoards.cost)
      : 0;

    const tmaCost = item.TMA.includeInLumpSum
      ? Number(safeNumber(item.TMA.quantity) * item.TMA.cost)
      : 0;

    // Calculate lump sum with markup
    const lumpSum = itemCostSummary.totalFlaggingCost / (1 - (rate / 100));
    const lumpSumWithEquipment = arrowBoardsCost + messageBoardsCost + tmaCost + lumpSum;

    // Calculate hourly rate
    const totalHours = Math.ceil((safeNumber(adminData.owTravelTimeMins) * 2) / 60) + item.onSiteJobHours;
    const hourlyRate = item.personnel !== 0 ? safeNumber(lumpSum / (item.personnel * totalHours)) : 0;

    return { lumpSumWithEquipment, hourlyRate };
  };

  const handleMarkupSelection = (itemIndex: number, rate: number) => {
    const newItems = [...serviceWorkItems];
    newItems[itemIndex].markupRate = rate;
    setServiceWorkItems(newItems);

    dispatch({
      type: 'UPDATE_SERVICE_WORK',
      payload: {
        key: 'markupRate',
        value: rate
      }
    });
  };

  // Calculate total hours
  const getTotalHours = (item: ServiceWorkItem | null, formData?: ServiceWorkItem | null) => {
    const source = formData || item;
    if (!source) return 0;
    const onSiteHours = safeNumber(source.onSiteJobHours) / 60;
    const travelHours = safeNumber(adminData.owTravelTimeMins) / 30; // Double and convert to hours
    return onSiteHours + travelHours;
  };

  // Calculate overtime hours
  const getOvertimeHours = (item: ServiceWorkItem | null, formData?: ServiceWorkItem | null) => {
    const totalHours = getTotalHours(item, formData);
    return Math.max(0, totalHours - 8);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b mb-6">
        <h3 className="text-xl text-black font-semibold">
          Service Work
        </h3>
        {serviceWorkItems.length < 1 && <Button onClick={handleAddServiceWork}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service Work
        </Button>}
      </div>

      <div className="relative">
        {/* Service Work Items List */}
        {serviceWorkItems.length === 0 && (
          <EmptyContainer
            topText="No service work added yet"
            subtext="When you add service work, it will appear here."
          />
        )}

        {serviceWorkItems.map((item, index) => (
          <div key={item.id} className="space-y-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm mb-2 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="font-medium">Service Work</div>
                  <div className="text-sm text-muted-foreground">
                    Personnel: {item.personnel} • Trucks: {item.numberTrucks} • Hours: {item.onSiteJobHours}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleEditServiceWork(index)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteServiceWork(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Equipment Summary */}
              {(item.arrowBoards.quantity > 0 || item.messageBoards.quantity > 0 || item.TMA.quantity > 0) && (
                <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
                  {item.arrowBoards.quantity > 0 && (
                    <div>Arrow Boards: {item.arrowBoards.quantity}</div>
                  )}
                  {item.messageBoards.quantity > 0 && (
                    <div>Message Boards: {item.messageBoards.quantity}</div>
                  )}
                  {item.TMA.quantity > 0 && (
                    <div>TMA: {item.TMA.quantity}</div>
                  )}
                </div>
              )}

              {/* Cost Summary */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>Total Hours: {getTotalHours(item)} ({getTotalHours(item) * 60} minutes)</div>
                <div>Overtime Hours: {getOvertimeHours(item)} ({getOvertimeHours(item) * 60} minutes)</div>
              </div>
            </div>

            {/* Pricing Table */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h4 className="text-lg font-medium mb-3">Pricing Options</h4>
              <div className="grid grid-cols-4 gap-4 mb-4 text-sm font-medium">
                <div>Gross Margin Target</div>
                <div>Lump Sum</div>
                <div>Hourly Rate / Man</div>
                <div className="text-center">Use this price?</div>
              </div>

              <div className='grid grid-cols-4 gap-4 py-2 border-t text-sm items-center'>
                <div className='w-full flex flex-row items-center gap-2'>
                  <Input
                    value={customGrossMargin.customGrossMargin}
                    max={100}
                    min={0}
                    placeholder='Custom gross margin'
                    className='bg-muted/50 w-12'
                    onChange={(e: any) =>
                      setCustomGrossMargin(prev => ({
                        ...prev,
                        customGrossMargin: Number(e.target.value),
                        item: item
                      }))
                    }
                  />
                  <p>%</p>
                </div>
                <div>
                  ${safeNumber(customGrossMargin.lumpSum).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <div>
                  ${customGrossMargin.hourlyRate.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <div className='flex justify-center'>
                  <Checkbox
                    checked={item.markupRate === customGrossMargin.customGrossMargin}
                    onCheckedChange={checked => {
                      if (checked) {
                        handleMarkupSelection(index, customGrossMargin.customGrossMargin)
                      }
                    }}
                  />
                </div>
              </div>

              {(adminData?.rated === 'RATED' ? RATED_MARKUP_PERCENTAGES : NON_RATED_MARKUP_PERCENTAGES).map(rate => {
                const { lumpSumWithEquipment, hourlyRate } = calculateMarkupValues(item, rate);

                return (
                  <div key={rate} className="grid grid-cols-4 gap-4 py-2 border-t text-sm">
                    <div>{rate}%</div>
                    <div>${safeNumber(lumpSumWithEquipment).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div>${hourlyRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="flex justify-center">
                      <Checkbox
                        checked={item.markupRate === rate}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleMarkupSelection(index, rate);
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Drawer for editing service work */}
      <Drawer open={drawerOpen} direction="right" onOpenChange={setDrawerOpen}>
        <DrawerContent className="min-w-lg">
          <div className="flex flex-col gap-2 relative z-10 bg-background">
            <DrawerHeader>
              <DrawerTitle>
                {editingIndex !== null ? 'Edit Service Work' : 'Add Service Work'}
              </DrawerTitle>
            </DrawerHeader>
            <Separator className="w-full -mt-2" />
          </div>

          {formData && (
            <div className="px-4 space-y-6 mt-4 overflow-y-auto h-full">
              {/* General Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">General Settings</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rate-type" className="font-medium text-sm mb-2 block">Rate Type</Label>
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
                      <SelectTrigger id="rate-type">
                        <Clock className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Select rate type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RATED">RATED</SelectItem>
                        <SelectItem value="NON-RATED">NON-RATED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="gas-cost" className="font-medium text-sm mb-2 block">Gas Cost Per Gallon ($)</Label>
                    <Input
                      id="gas-cost"
                      type="number"
                      min={0}
                      step={0.01}
                      value={formData.fuelCostPerGallon || ""}
                      onChange={(e) => handleFormUpdate('fuelCostPerGallon', parseFloat(e.target.value) || 0)}
                      placeholder="$ 0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2" htmlFor="county">County</Label>
                    <Input
                      id="county"
                      value={adminData.county?.name || ""}
                      disabled
                    />
                  </div>
                  <div>
                    <Label className='mb-2' htmlFor="shop-rate">Shop Rate</Label>
                    <Input
                      id="shop-rate"
                      value={adminData.county?.shopRate || ""}
                      disabled
                    />
                  </div>

                  <div>
                    <Label className='mb-2' htmlFor="labor-rate">Labor Rate</Label>
                    <Input
                      id="labor-rate"
                      value={adminData.county?.laborRate || ""}
                      disabled
                    />
                  </div>

                  <div>
                    <Label className='mb-2' htmlFor="fringe-rate">Fringe Rate</Label>
                    <Input
                      id="fringe-rate"
                      value={adminData.county?.fringeRate || ""}
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Resources and Equipment */}
              <div className="space-y-4">
                <h4 className="font-medium">Resources and Equipment</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="personnel" className="font-medium text-sm mb-2 block">Personnel</Label>
                    <Input
                      id="personnel"
                      type="number"
                      min={0}
                      value={formData.personnel || ""}
                      onChange={(e) => handleFormUpdate('personnel', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="trucks" className="font-medium text-sm mb-2 block">Number of Trucks</Label>
                    <Input
                      id="trucks"
                      type="number"
                      min={0}
                      value={formData.numberTrucks || ""}
                      onChange={(e) => handleFormUpdate('numberTrucks', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Equipment Sections */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Arrow Boards */}
                  <div>
                    <Label className="font-medium text-sm mb-2 block">
                      Arrow Boards (
                      {editingArrowBoardCost ? (
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={arrowBoardCost}
                          autoFocus
                          onChange={e => setArrowBoardCost(e.target.value)}
                          onBlur={() => {
                            handleEquipmentInputChange('arrowBoards', 'cost', parseFloat(arrowBoardCost) || 0);
                            setEditingArrowBoardCost(false);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleEquipmentInputChange('arrowBoards', 'cost', parseFloat(arrowBoardCost) || 0);
                              setEditingArrowBoardCost(false);
                            }
                          }}
                          className="w-16 inline-block text-left px-1 py-0.5"
                          style={{ display: 'inline-block' }}
                        />
                      ) : (
                        <span
                          className="underline cursor-pointer text-primary mx-1"
                          onClick={() => {
                            setArrowBoardCost(String(formData.arrowBoards.cost || 0));
                            setEditingArrowBoardCost(true);
                          }}
                        >
                          ${formData.arrowBoards.cost || 0}
                        </span>
                      )}
                      /day)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.arrowBoards.quantity || ""}
                      onChange={(e) => handleEquipmentInputChange('arrowBoards', 'quantity', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        id="include-arrow-boards"
                        checked={formData.arrowBoards.includeInLumpSum || false}
                        onCheckedChange={(checked) =>
                          handleEquipmentInputChange('arrowBoards', 'includeInLumpSum', checked === true)
                        }
                      />
                      <Label htmlFor="include-arrow-boards" className="text-sm">Include in lump sum</Label>
                    </div>
                  </div>

                  {/* Message Boards */}
                  <div>
                    <Label className="font-medium text-sm mb-2 block">
                      Message Boards (
                      {editingMessageBoardCost ? (
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={messageBoardCost}
                          autoFocus
                          onChange={e => setMessageBoardCost(e.target.value)}
                          onBlur={() => {
                            handleEquipmentInputChange('messageBoards', 'cost', parseFloat(messageBoardCost) || 0);
                            setEditingMessageBoardCost(false);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleEquipmentInputChange('messageBoards', 'cost', parseFloat(messageBoardCost) || 0);
                              setEditingMessageBoardCost(false);
                            }
                          }}
                          className="w-16 inline-block text-left px-1 py-0.5"
                          style={{ display: 'inline-block' }}
                        />
                      ) : (
                        <span
                          className="underline cursor-pointer text-primary mx-1"
                          onClick={() => {
                            setMessageBoardCost(String(formData.messageBoards.cost || 0));
                            setEditingMessageBoardCost(true);
                          }}
                        >
                          ${formData.messageBoards.cost || 0}
                        </span>
                      )}
                      /day)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.messageBoards.quantity || ""}
                      onChange={(e) => handleEquipmentInputChange('messageBoards', 'quantity', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        id="include-message-boards"
                        checked={formData.messageBoards.includeInLumpSum || false}
                        onCheckedChange={(checked) =>
                          handleEquipmentInputChange('messageBoards', 'includeInLumpSum', checked === true)
                        }
                      />
                      <Label htmlFor="include-message-boards" className="text-sm">Include in lump sum</Label>
                    </div>
                  </div>

                  {/* TMA */}
                  <div>
                    <Label className="font-medium text-sm mb-2 block">
                      TMA (
                      {editingTMACost ? (
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={tmaCost}
                          autoFocus
                          onChange={e => setTMACost(e.target.value)}
                          onBlur={() => {
                            handleEquipmentInputChange('TMA', 'cost', parseFloat(tmaCost) || 0);
                            setEditingTMACost(false);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleEquipmentInputChange('TMA', 'cost', parseFloat(tmaCost) || 0);
                              setEditingTMACost(false);
                            }
                          }}
                          className="w-16 inline-block text-left px-1 py-0.5"
                          style={{ display: 'inline-block' }}
                        />
                      ) : (
                        <span
                          className="underline cursor-pointer text-primary mx-1"
                          onClick={() => {
                            setTMACost(String(formData.TMA.cost || 0));
                            setEditingTMACost(true);
                          }}
                        >
                          ${formData.TMA.cost || 0}
                        </span>
                      )}
                      /day)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.TMA.quantity || ""}
                      onChange={(e) => handleEquipmentInputChange('TMA', 'quantity', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        id="include-tma"
                        checked={formData.TMA.includeInLumpSum || false}
                        onCheckedChange={(checked) =>
                          handleEquipmentInputChange('TMA', 'includeInLumpSum', checked === true)
                        }
                      />
                      <Label htmlFor="include-tma" className="text-sm">Include in lump sum</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Summary */}
              {serviceWorkSummary && (
                <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium">Service Work Cost Summary</h4>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex space-x-4">
                        <div className="flex-1 flex flex-col space-y-2">
                          <Label htmlFor="onSiteHoursInput" className="text-sm font-medium">
                            Hours
                          </Label>
                          <Input
                            id="onSiteHoursInput"
                            type="number"
                            min={0}
                            value={onSiteHours === 0 ? "" : onSiteHours}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue = value === "" ? 0 : parseInt(value);
                              if (!isNaN(numValue)) {
                                handleOnSiteJobTimeChange("hours", numValue);
                              }
                            }}
                            placeholder="00"
                            className="h-10"
                            onKeyDown={(e) =>
                              ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()
                            }
                          />
                        </div>

                        <div className="flex-1 flex flex-col space-y-2">
                          <Label htmlFor="onSiteMinutesInput" className="text-sm font-medium">
                            Minutes
                          </Label>
                          <Input
                            id="onSiteMinutesInput"
                            type="number"
                            min={0}
                            max={59}
                            value={onSiteMinutes === 0 ? "" : onSiteMinutes}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue = value === "" ? 0 : Math.min(parseInt(value), 59);
                              if (!isNaN(numValue)) {
                                handleOnSiteJobTimeChange("minutes", numValue);
                              }
                            }}
                            placeholder="00"
                            className="h-10"
                            onKeyDown={(e) =>
                              ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()
                            }
                          />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center space-x-2">
                        <p className="text-sm text-gray-500">
                          ({onSiteTotalMinutes} mins, {onSiteDecimalHours} hrs)
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>On Site Job Hours Cost:</span>
                      <span>${serviceWorkSummary.onSiteJobHoursCost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Round Trip Travel Time:</span>
                      <span>{formatHoursAndMinutes(safeNumber(adminData?.owTravelTimeMins) * 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Travel Time Cost:</span>
                      <span>${serviceWorkSummary.rtTravelTimeHoursCost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Over Time Hours:</span>
                      <span>{formatHoursAndMinutes(getOvertimeHours(null, formData))}</span>
                    </div>
                    <div></div>

                    <div className="flex justify-between">
                      <span>Total Hours:</span>
                      <span className="font-medium">{formatHoursAndMinutes(getTotalHours(null, formData))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Labor Cost:</span>
                      <span className="font-medium">${serviceWorkSummary.totalLaborCost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                    </div>

                    <div></div>
                    <div className="flex justify-between">
                      <span>Truck and Fuel Cost:</span>
                      <span className="font-medium">${serviceWorkSummary.totalFuelCost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                    </div>
                    <div></div>
                    <div>
                      <Input
                        id="additional-costs"
                        type="number"
                        min={0}
                        step={0.01}
                        value={formData.additionalEquipmentCost || ""}
                        onChange={(e) => handleFormUpdate('additionalEquipmentCost', parseFloat(e.target.value) || 0)}
                        placeholder="Additional Costs"
                      />
                    </div>
                    <div></div>
                  </div>

                  <Separator />

                  <div className="flex flex-col w-1/2 ml-auto justify-end gap-4 text-sm">
                    <div className="flex justify-between font-bold">
                      <span>Total Cost:</span>
                      <span>${serviceWorkSummary.totalFlaggingCost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Cost Per Hour:</span>
                      <span>${serviceWorkSummary.totalCostPerHour?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Equipment Revenue:</span>
                      <span>${((formData.arrowBoards.quantity * formData.arrowBoards.cost) + (formData.messageBoards.quantity * formData.messageBoards.cost) + (formData.TMA.quantity * formData.TMA.cost)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DrawerFooter>
            <div className="flex justify-end space-x-3 w-full">
              <DrawerClose asChild>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                onClick={handleSave}
                disabled={!formData || formData.personnel === 0}
              >
                {editingIndex !== null ? 'Update Service Work' : 'Save Service Work'}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ServiceWorkTab;
