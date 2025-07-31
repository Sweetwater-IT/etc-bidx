// components/BidItems/permanent-signs-tab.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";
import { useEstimate } from "@/contexts/EstimateContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  getDisplayName,
  PERMANENT_SIGN_ITEMS,
  ADDITIONAL_EQUIPMENT_OPTIONS,
  PostMountedInstall,
  PostMountedResetOrRemove,
  PostMountedInstallTypeC,
  InstallFlexibleDelineators,
  PMSItemNumbers,
  AllPMSItemKeys,
  PMSItemKeys,
  permSignsDbMap,
  PMSEquipmentItems,
  AdditionalPMSEquipment,
} from "@/types/TPermanentSigns";
import {
  defaultFlexibleDelineators,
  defaultPMSResetB,
  defaultPMSTypeB,
  defaultPMSTypeC,
} from "@/types/default-objects/defaultPermanentSignsObject";
import { v4 as uuidv4 } from "uuid";
import EmptyContainer from "./empty-container";
import { Separator } from "../ui/separator";
import { safeNumber } from "@/lib/safe-number";
import {
  getPermanentSignRevenueAndMargin,
  getPermSignDaysRequired,
  getPermSignFuelCost,
  getPermSignLaborCost,
  getPermSignMaterialCost,
  getPermSignSqFtCost,
  getPermSignTotalCost,
  getRequiredInstallHours,
  getPermSignTrips,
} from "@/lib/mptRentalHelperFunctions";
import { toast } from "sonner";
import { Switch } from "../ui/switch";
import { determineItemType } from "@/types/TPermanentSigns";
import { formatCurrencyValue } from "@/lib/formatDecimals";

const createDefaultItem = (keyToBeAdded: PMSItemKeys): PMSItemNumbers => {
  const newPMSId = uuidv4();
  let defaultObjectToBeAdded: any;
  switch (keyToBeAdded) {
    case "pmsTypeB":
      defaultObjectToBeAdded = { ...defaultPMSTypeB, id: newPMSId, days: 0, numberTrips: 0 };
      break;
    case "pmsTypeF":
      defaultObjectToBeAdded = {
        ...defaultPMSTypeB,
        id: newPMSId,
        type: "F",
        itemNumber: "0935-001",
        permSignCostSqFt: 0,
        permSignPriceSqFt: 0,
        days: 0,
        numberTrips: 0,
      };
      break;
    case "pmsTypeC":
      defaultObjectToBeAdded = { ...defaultPMSTypeC, id: newPMSId, days: 0, numberTrips: 0 };
      break;
    case "resetTypeB":
      defaultObjectToBeAdded = {
        ...defaultPMSResetB,
        id: newPMSId,
        itemNumber: "0941-0001",
        days: 0,
        numberTrips: 0,
      };
      break;
    case "resetTypeF":
      defaultObjectToBeAdded = {
        ...defaultPMSResetB,
        id: newPMSId,
        itemNumber: "0945-0001",
        isRemove: false,
        type: "F",
        days: 0,
        numberTrips: 0,
      };
      break;
    case "removeTypeB":
      defaultObjectToBeAdded = {
        ...defaultPMSResetB,
        id: newPMSId,
        itemNumber: "0971-0001",
        isRemove: true,
        days: 0,
        numberTrips: 0,
      };
      break;
    case "removeTypeF":
      defaultObjectToBeAdded = {
        ...defaultPMSResetB,
        id: newPMSId,
        itemNumber: "0975-0001",
        isRemove: true,
        days: 0,
        numberTrips: 0,
      };
      break;
    case "flexibleDelineator":
      defaultObjectToBeAdded = { ...defaultFlexibleDelineators, id: newPMSId, days: 0, numberTrips: 0 };
      break;
    default:
      defaultObjectToBeAdded = undefined;
  }
  return defaultObjectToBeAdded;
};

const PermanentSignsSummaryStep = () => {
  const { permanentSigns, dispatch, adminData, mptRental, } = useEstimate();
  const [selectedType, setSelectedType] = useState<PMSItemKeys>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PMSItemNumbers | null>(null);
  const [editOpened, setEditOpened] = useState<boolean>(false);

  // Fetch static data
  useEffect(() => {
    const getStaticData = async () => {
      const response = await fetch("/api/permanent-signs");
      if (!response.ok) {
        toast.error("Could not fetch permanent sign data");
      } else {
        const data = await response.json();
        dispatch({
          type: "UPDATE_PERMANENT_SIGNS_ASSUMPTIONS",
          payload: {
            key: "productivityRates",
            value: {
              flexibleDelineator: data.data.flex_delineator,
              pmsTypeB: data.data.type_b_install,
              pmsTypeF: data.data.type_f_install,
              pmsTypeC: data.data.type_c_install,
              resetTypeB: data.data.type_b_reset,
              resetTypeF: data.data.type_f_reset,
              removeTypeB: data.data.type_b_remove,
              removeTypeF: data.data.type_f_remove,
            },
          },
        });
        dispatch({
          type: "UPDATE_PERMANENT_SIGNS_ASSUMPTIONS",
          payload: {
            key: "maxDailyHours",
            value: data.data.max_daily_hours,
          },
        });
        dispatch({
          type: "UPDATE_PERMANENT_SIGNS_ASSUMPTIONS",
          payload: {
            key: "itemMarkup",
            value: data.data.material_markup,
          },
        });
        dispatch({
          type: "UPDATE_PERMANENT_SIGNS_ASSUMPTIONS",
          payload: {
            key: "equipmentData",
            value: data.data.items
              .map((item: { name: string; price: number }) => ({
                name: permSignsDbMap[item.name],
                cost: item.price,
              }))
              .filter(item => !!item.name),
          },
        });
      }
    };
    getStaticData();
  }, [dispatch]);

  useEffect(() => {

    if (!editOpened || !permanentSigns || !formData || !selectedType) {
      setEditOpened(true);
      return;
    }

    const newInstall = getRequiredInstallHours(
      formData.quantity,
      permanentSigns.productivityRates[selectedType],
      formData.personnel
    );

    setFormData((prev: any) => {
      if (!prev || prev.installHoursRequired === newInstall) return prev;

      return {
        ...prev,
        installHoursRequired: newInstall,
      };
    });
  }, [
    editOpened,
    selectedType,
    permanentSigns?.productivityRates,
    formData?.quantity,
    formData?.personnel,
  ]);

  // Update totalTrips and days, when change quantity
  useEffect(() => {
    if (!editOpened || !permanentSigns || !formData || !selectedType) return;

    const quantity = formData.quantity;
    const personnel = formData.personnel;

    const newInstall = getRequiredInstallHours(
      quantity,
      permanentSigns.productivityRates[selectedType],
      personnel
    );

    const arraySigns = editingId
      ? permanentSigns.signItems.map(item =>
        item.id === formData.id
          ? { ...formData, installHoursRequired: newInstall }
          : item
      )
      : [...permanentSigns.signItems, {
        ...formData,
        installHoursRequired: newInstall
      }];

    const firstItem = permanentSigns.signItems[0] ?? formData;

    const { updatedItems, totalTrips } = getPermSignTrips(
      firstItem,
      arraySigns,
      permanentSigns.maxDailyHours
    );

    const currentItem = updatedItems.find((itm) => itm.id === formData.id);
    if (!currentItem) return;

    setFormData((prev: any) => ({
      ...prev,
      installHoursRequired: newInstall,
      days: currentItem.days,
      numberTrips: totalTrips,
    }));
  }, [
    formData?.quantity,
    formData?.personnel,
    permanentSigns?.signItems,
    permanentSigns?.maxDailyHours,
    selectedType,
    editOpened,
    editingId,
  ]);

  // Update perm sign bolts
  useEffect(() => {
    if (
      !formData ||
      !selectedType ||
      selectedType === "removeTypeB" ||
      selectedType === "removeTypeF"
    ) return;

    const newBolts = formData.quantity * 2;

    setFormData(prev => {
      if (!prev || prev.permSignBolts === newBolts) return prev;

      return {
        ...prev,
        permSignBolts: newBolts,
      };
    });
  }, [
    formData?.quantity,
    selectedType,
  ]); // Added formData to satisfy ESLint

  // Reset editOpened when drawer closes
  useEffect(() => {
    if (!drawerOpen) {
      setEditOpened(false);
    }
  }, [drawerOpen]);

  const handleAddSign = () => {
    setSelectedType(undefined);
    setFormData(null);
    setEditingId(null);
    setDrawerOpen(true);
  };

  const handleEditItem = useCallback((signId: string) => {
    const item = permanentSigns?.signItems.find(item => item.id === signId);
    if (item) {
      setFormData({ ...item });
      setEditingId(signId);
      const itemType = determineItemType(item);
      setSelectedType(itemType);
      setDrawerOpen(true);
    }
  }, [permanentSigns]); // Wrapped in useCallback to stabilize function reference

  const handleTypeChange = useCallback((value: PMSItemKeys) => {
    const defaultItem = createDefaultItem(value);

    if (
      defaultItem &&
      (value === "pmsTypeB" || value === "pmsTypeF" || value === "pmsTypeC") &&
      permanentSigns
    ) {
      const baseCost = permanentSigns.equipmentData.find(e => e.name === "permSignCostSqFt")?.cost ?? 0;
      const basePrice = permanentSigns.equipmentData.find(e => e.name === "permSignPriceSqFt")?.cost ?? 0;

      (defaultItem as PostMountedInstall | PostMountedInstallTypeC).permSignCostSqFt = baseCost;
      (defaultItem as PostMountedInstall | PostMountedInstallTypeC).permSignPriceSqFt = basePrice;
    }

    setSelectedType(value);
    setFormData(defaultItem);
  }, [permanentSigns]);

  const handleFieldUpdate = useCallback((field: AllPMSItemKeys, value: any) => {
    setFormData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        [field]: value,
      };
    });
  }, []); // Wrapped in useCallback to stabilize function reference

  const handleAddAdditionalItem = useCallback(() => {
    setFormData(prevData => {
      if (!prevData || !("additionalItems" in prevData)) return prevData;
      const newItem: AdditionalPMSEquipment = {
        equipmentType: "antiTheftBolts",
        quantity: 1,
      };
      const updatedItems = [...(prevData.additionalItems || []), newItem];
      return { ...prevData, additionalItems: updatedItems };
    });
  }, []); // Wrapped in useCallback to stabilize function reference

  const handleRemoveAdditionalItem = useCallback((index: number) => {
    setFormData(prevData => {
      if (!prevData || !("additionalItems" in prevData)) return prevData;
      const updatedItems = (prevData.additionalItems || []).filter((_, i) => i !== index);
      return { ...prevData, additionalItems: updatedItems };
    });
  }, []); // Wrapped in useCallback to stabilize function reference

  const handleUpdateAdditionalItem = useCallback(
    (index: number, field: keyof AdditionalPMSEquipment, value: any) => {
      setFormData(prevData => {
        if (!prevData || !("additionalItems" in prevData)) return prevData;
        const updatedItems = [...(prevData.additionalItems || [])];
        updatedItems[index] = {
          ...updatedItems[index],
          [field]: value,
        };
        return { ...prevData, additionalItems: updatedItems };
      });
    },
    []
  ); // Wrapped in useCallback to stabilize function reference

  const handleSave = useCallback(() => {
    if (!formData || !selectedType || !permanentSigns) return;

    if (editingId) {
      // Update existing item
      Object.keys(formData).forEach(field => {
        if (field !== "id" && field !== "days" && field !== "numberTrips") {
          dispatch({
            type: "UPDATE_PERMANENT_SIGNS_ITEM",
            payload: {
              signId: editingId,
              field: field as AllPMSItemKeys,
              value: (formData as any)[field],
            },
          });
        }
      });
    } else {
      // Add new item
      dispatch({
        type: "ADD_PERMANENT_SIGNS_ITEM",
        payload: {
          newPMSItem: { ...formData },
        },
      });
    }

    setDrawerOpen(false);
    setFormData(null);
    setEditingId(null);
    setSelectedType(undefined);
  }, [formData, selectedType, permanentSigns, editingId, dispatch]); // Added dependencies

  const handleCancel = useCallback(() => {
    setDrawerOpen(false);
    setFormData(null);
    setEditingId(null);
    setSelectedType(undefined);
  }, []); // Wrapped in useCallback to stabilize function reference

  const handleItemDelete = useCallback((pmsId: string) => {
    dispatch({
      type: "DELETE_PERMANENT_SIGNS_ITEM",
      payload: { signId: pmsId },
    });
  }, [dispatch]); // Wrapped in useCallback to stabilize function reference

  const getTotalDays = () => permanentSigns?.signItems.reduce((acc, item) => acc + item.days, 0)
  const getTotalTrips = () => permanentSigns?.signItems.reduce((acc, item) => acc + item.numberTrips, 0)

  function hasPermSignSqFtFields(item: PMSItemNumbers): item is PostMountedInstall | PostMountedInstallTypeC {
    return 'permSignCostSqFt' in item && 'permSignPriceSqFt' in item;
  }

  const renderFormFields = () => {
    if (!formData || !selectedType) return null;

    const commonFields = (
      <>
        {!!permanentSigns && permanentSigns.signItems.length > 0 && formData.id !== permanentSigns.signItems[0]?.id && (
          <div className="mt-1">
            <Label className="text-sm font-medium mb-2 block">Separate Mobilization</Label>
            <Switch
              checked={formData.separateMobilization}
              onCheckedChange={(value) => handleFieldUpdate("separateMobilization", value)}
            />
          </div>
        )}
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Personnel</Label>
          <Input
            type="number"
            value={formData?.personnel || ""}
            onChange={(e) => handleFieldUpdate("personnel", parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Number of Trucks</Label>
          <Input
            type="number"
            value={formData?.numberTrucks || ""}
            onChange={(e) => handleFieldUpdate("numberTrucks", parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Number of Trips</Label>
          <Input
            type="number"
            value={formData?.numberTrips || ""}
            readOnly
            disabled
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Days</Label>
          <Input
            type="number"
            value={formData?.days || 0}
            readOnly
            disabled
            className="w-full"
          />
        </div>
        {(selectedType === "pmsTypeB" || selectedType === "pmsTypeF" || selectedType === "pmsTypeC") && (
          <>
            {(selectedType === "pmsTypeB" || selectedType === "pmsTypeF" || selectedType === "pmsTypeC") && hasPermSignSqFtFields(formData) && (
              <>
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block">Sign Cost / Sq. Ft</Label>
                  <Input
                    type="number"
                    value={formData.permSignCostSqFt}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) handleFieldUpdate("permSignCostSqFt", val);
                    }}
                    min={0}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block">Sign Price / Sq. Ft</Label>
                  <Input
                    type="number"
                    value={formData.permSignPriceSqFt}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) handleFieldUpdate("permSignPriceSqFt", val);
                    }}
                    min={0}
                    step="0.01"
                    className="w-full"
                  />
                </div>
              </>
            )}
          </>
        )}
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">O/W Travel Time</Label>
          <Input
            type="number"
            value={Math.round((safeNumber(adminData?.owTravelTimeMins) / 60) * 100) / 100}
            onChange={(e) => {
              dispatch({
                type: "UPDATE_ADMIN_DATA",
                payload: {
                  key: "owTravelTimeMins",
                  value: parseFloat(e.target.value) * 60,
                },
              });
            }}
            min={0}
            step="0.01"
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">O/W Travel Distance</Label>
          <Input
            type="number"
            value={safeNumber(adminData?.owMileage)}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_ADMIN_DATA",
                payload: {
                  key: "owMileage",
                  value: parseInt(e.target.value),
                },
              })
            }
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Quantity / Installs</Label>
          <Input
            type="number"
            value={formData?.quantity || ""}
            onChange={(e) => handleFieldUpdate("quantity", parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block whitespace-nowrap">Install Hours Required</Label>
          <Input
            type="number"
            value={formData?.installHoursRequired || ""}
            onChange={(e) => handleFieldUpdate("installHoursRequired", parseFloat(e.target.value) || 0)}
            min={0}
            step="0.1"
            className="w-full"
          />
        </div>
        <Separator className="col-span-3" />
      </>
    );

    const permSignBoltsField =
      selectedType !== "removeTypeF" && selectedType !== "removeTypeB" ? (
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Perm. Sign Bolts</Label>
          <Input
            type="number"
            value={formData?.permSignBolts || ""}
            onChange={(e) => handleFieldUpdate("permSignBolts", parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
            disabled
          />
        </div>
      ) : null;

    const postMountedInstallFields =
      selectedType === "pmsTypeB" || selectedType === "pmsTypeF" ? (
        <>
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Sign Sq. Footage</Label>
            <Input
              type="number"
              value={(formData as PostMountedInstall).signSqFootage || ""}
              onChange={(e) => handleFieldUpdate("signSqFootage", parseFloat(e.target.value) || 0)}
              min={0}
              step="0.01"
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Hi-Reflective Strips</Label>
            <Input
              type="number"
              value={(formData as PostMountedInstall).hiReflectiveStrips || ""}
              onChange={(e) => handleFieldUpdate("hiReflectiveStrips", parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">FYG Reflective Strips</Label>
            <Input
              type="number"
              value={(formData as PostMountedInstall).fygReflectiveStrips || ""}
              onChange={(e) => handleFieldUpdate("fygReflectiveStrips", parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Jenny Brackets</Label>
            <Input
              type="number"
              value={(formData as PostMountedInstall).jennyBrackets || ""}
              onChange={(e) => handleFieldUpdate("jennyBrackets", parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Stiffener Inches</Label>
            <Input
              type="number"
              value={(formData as PostMountedInstall).stiffenerInches || ""}
              onChange={(e) => handleFieldUpdate("stiffenerInches", parseFloat(e.target.value) || 0)}
              min={0}
              step="0.01"
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">TMZ Brackets</Label>
            <Input
              type="number"
              value={(formData as PostMountedInstall).tmzBrackets || ""}
              onChange={(e) => handleFieldUpdate("tmzBrackets", parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Anti-Theft Bolts</Label>
            <Input
              type="number"
              value={(formData as PostMountedInstall).antiTheftBolts || ""}
              onChange={(e) => handleFieldUpdate("antiTheftBolts", parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block">Chevron Brackets</Label>
            <Input
              type="number"
              value={(formData as PostMountedInstall).chevronBrackets || ""}
              onChange={(e) => handleFieldUpdate("chevronBrackets", parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium mb-2 block whitespace-nowrap">Street Name Cross Brackets</Label>
            <Input
              type="number"
              value={(formData as PostMountedInstall).streetNameCrossBrackets || ""}
              onChange={(e) => handleFieldUpdate("streetNameCrossBrackets", parseInt(e.target.value) || 0)}
              min={0}
              className="w-full"
            />
          </div>
        </>
      ) : null;

    const typeCFields = selectedType === "pmsTypeC" ? (
      <>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Sign Sq. Footage</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstallTypeC).signSqFootage || ""}
            onChange={(e) => handleFieldUpdate("signSqFootage", parseFloat(e.target.value) || 0)}
            min={0}
            step="0.01"
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Hi-Reflective Strips</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstallTypeC).hiReflectiveStrips || ""}
            onChange={(e) => handleFieldUpdate("hiReflectiveStrips", parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">FYG Reflective Strips</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstallTypeC).fygReflectiveStrips || ""}
            onChange={(e) => handleFieldUpdate("fygReflectiveStrips", parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Stiffener Inches</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstallTypeC).stiffenerInches || ""}
            onChange={(e) => handleFieldUpdate("stiffenerInches", parseFloat(e.target.value) || 0)}
            min={0}
            step="0.01"
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">TMZ Brackets</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstallTypeC).tmzBrackets || ""}
            onChange={(e) => handleFieldUpdate("tmzBrackets", parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Anti-Theft Bolts</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstallTypeC).antiTheftBolts || ""}
            onChange={(e) => handleFieldUpdate("antiTheftBolts", parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
      </>
    ) : null;

    const flexibleDelineatorFields = selectedType === "flexibleDelineator" ? (
      <>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Cost</Label>
          <Input
            type="number"
            value={(formData as InstallFlexibleDelineators).flexibleDelineatorCost || ""}
            onChange={(e) => handleFieldUpdate("flexibleDelineatorCost", parseFloat(e.target.value) || 0)}
            min={0}
            step="0.01"
            className="w-full"
          />
        </div>
      </>
    ) : null;

    const canHaveAdditionalItems =
      selectedType && !["pmsTypeB", "pmsTypeF", "pmsTypeC"].includes(selectedType);
    const additionalItemsSection = canHaveAdditionalItems && "additionalItems" in formData ? (
      <>
        <Separator className="col-span-3" />
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-medium">Additional Equipment</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddAdditionalItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Button>
          </div>
          {(formData as any).additionalItems?.map((item: AdditionalPMSEquipment, index: number) => (
            <div key={index} className="flex gap-4 items-end mb-3 p-3 border rounded-lg">
              <div>
                <Label className="text-sm font-medium mb-2 block">Equipment Type</Label>
                <Select
                  value={item.equipmentType}
                  onValueChange={(value: PMSEquipmentItems) =>
                    handleUpdateAdditionalItem(index, "equipmentType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ADDITIONAL_EQUIPMENT_OPTIONS).map(([displayName, key]) => (
                      <SelectItem key={key} value={key}>
                        {displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Quantity / Installs</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleUpdateAdditionalItem(index, "quantity", parseInt(e.target.value) || 0)
                  }
                  min={0}
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveAdditionalItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </>
    ) : null;

    return (
      <div className="space-y-4">
        <div className="w-full">
          <Label className="text-sm font-medium mb-2 block">Item Number</Label>
          <Input
            type="text"
            value={formData?.itemNumber || ""}
            onChange={(e) => handleFieldUpdate("itemNumber", e.target.value)}
            className="w-full"
            placeholder="Enter item number"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {commonFields}
          {permSignBoltsField}
          {postMountedInstallFields}
          {typeCFields}
          {flexibleDelineatorFields}
          {additionalItemsSection}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between pb-2 border-b mb-3">
        <h3 className="text-xl text-black font-semibold">Permanent Signs</h3>
        <Button onClick={handleAddSign}>
          <Plus className="mr-2 h-4 w-4" />
          Add Sign Item
        </Button>
      </div>
      <div className="flex flex-row items-center mb-3">
        <div className="flex flex-row items-center gap-[8px]">
          <label className="text-sm font-semibold">Total Trips Required: </label>
          <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
            {getTotalTrips() ?? " -"}
          </div>
        </div>
        <div className="flex flex-row items-center gap-[8px]">
          <label className="text-sm font-semibold">Total Days Required: </label>
          <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
            {getTotalDays() ?? " -"}
          </div>
        </div>


      </div>
      <div className="relative">
        {(!permanentSigns || permanentSigns.signItems.length === 0) && (
          <EmptyContainer
            topText="No permanent signs added yet"
            subtext="When you add permanent signs, they will appear here."
          />
        )}
        {permanentSigns &&
          permanentSigns.signItems.map(pmsItem => {
            const itemType = determineItemType(pmsItem);
            return (
              <div
                key={`sign-${pmsItem.id}`}
                className="rounded-lg border bg-card text-card-foreground shadow-sm mb-2 p-4"
              >
                <div className="grid grid-cols-2 mb-4">
                  <div className="ml-auto flex items-center gap-x-2">
                    <div className="whitespace-nowrap">Use custom margin</div>
                    <Switch
                      checked={!pmsItem.standardPricing}
                      onCheckedChange={(value) =>
                        dispatch({
                          type: "UPDATE_PERMANENT_SIGNS_ITEM",
                          payload: {
                            signId: pmsItem.id,
                            field: "standardPricing",
                            value: !value,
                          },
                        })
                      }
                    />
                    {!pmsItem.standardPricing && (
                      <Input
                        type="number"
                        value={pmsItem.customMargin}
                        min={0}
                        step="0.01"
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_PERMANENT_SIGNS_ITEM",
                            payload: {
                              signId: pmsItem.id,
                              field: "customMargin",
                              value: safeNumber(parseFloat(e.target.value)),
                            },
                          })
                        }
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-row items-start flex-wrap space-x-4 space-y-2">
                    <div className="font-medium">{getDisplayName(itemType)}</div>
                    {(itemType === "pmsTypeB" || itemType === "pmsTypeF" || itemType === "pmsTypeC") ? (
                      <div className="flex gap-x-2 items-center">
                        <label className="text-red-400 text-sm font-medium">Price Per Square Foot:</label>
                        <div className="text-sm text-red-500">
                          {formatCurrencyValue(
                            getPermanentSignRevenueAndMargin(permanentSigns, pmsItem, adminData, mptRental)
                              .revenue / (pmsItem as PostMountedInstall).signSqFootage
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-x-2 items-center">
                        <label className="text-red-400 text-sm font-medium">Price Per Sign:</label>
                        <div className="text-sm text-red-500">
                          {formatCurrencyValue(
                            getPermanentSignRevenueAndMargin(permanentSigns, pmsItem, adminData, mptRental)
                              .revenue / pmsItem.quantity
                          )}
                        </div>
                      </div>
                    )}
                    {"signSqFootage" in pmsItem && (
                      <div className="text-sm text-muted-foreground">
                        Square Footage: {(pmsItem as PostMountedInstall).signSqFootage}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {pmsItem?.quantity ? `Number of Installs: ${pmsItem.quantity}` : "Not configured"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Days: {pmsItem.days || "-"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Trips: {pmsItem.numberTrips || "-"}
                    </div>
                    {
                      (itemType === "pmsTypeB" || itemType === "pmsTypeF" || itemType === "pmsTypeC") && hasPermSignSqFtFields(pmsItem) && (
                        <>
                          <div className="text-sm text-muted-foreground">
                            Sign Cost / Sq. Ft: {pmsItem.permSignCostSqFt ?? "-"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Sign Price / Sq. Ft: {pmsItem.permSignPriceSqFt ?? "-"}
                          </div>
                        </>
                      )
                    }
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <Button variant="ghost" size="sm" onClick={() => handleEditItem(pmsItem.id)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleItemDelete(pmsItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 mt-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Total Revenue</label>
                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                      {formatCurrencyValue(
                        getPermanentSignRevenueAndMargin(permanentSigns, pmsItem, adminData, mptRental).revenue
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Total Cost</label>
                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                      {formatCurrencyValue(
                        getPermSignTotalCost(itemType, permanentSigns, pmsItem, adminData, mptRental)
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Gross Margin</label>
                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                      {(getPermanentSignRevenueAndMargin(permanentSigns, pmsItem, adminData, mptRental).grossMargin * 100).toFixed(2)}%
                    </div>
                  </div>
                  {(itemType === "pmsTypeB" || itemType === "pmsTypeF" || itemType === "pmsTypeC") && (
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold">Sign Costs</label>
                      <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                        {formatCurrencyValue(getPermSignSqFtCost(permanentSigns, pmsItem))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Labor Cost</label>
                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                      {formatCurrencyValue(getPermSignLaborCost(pmsItem, adminData))}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Material Cost</label>
                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                      {formatCurrencyValue(getPermSignMaterialCost(itemType, permanentSigns, pmsItem))}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Fuel Cost</label>
                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                      {formatCurrencyValue(getPermSignFuelCost(pmsItem, adminData, mptRental))}
                    </div>
                  </div>
                  {(itemType === "pmsTypeB" || itemType === "pmsTypeF" || itemType === "pmsTypeC") ? (
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold">Price Per Square Foot</label>
                      <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                        {formatCurrencyValue(
                          getPermanentSignRevenueAndMargin(permanentSigns, pmsItem, adminData, mptRental)
                            .revenue / (pmsItem as PostMountedInstall).signSqFootage
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold">Price Per Each</label>
                      <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                        {formatCurrencyValue(
                          getPermanentSignRevenueAndMargin(permanentSigns, pmsItem, adminData, mptRental)
                            .revenue / pmsItem.quantity
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Days Required</label>
                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                      {pmsItem.days || "-"}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold">Trips Required</label>
                    <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                      {pmsItem.numberTrips || "-"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      <Drawer open={drawerOpen} direction="right" onOpenChange={setDrawerOpen}>
        <DrawerContent className="min-w-[500px] h-full">
          <DrawerHeader>
            <DrawerTitle>{editingId ? "Edit Permanent Sign" : "Add Permanent Sign"}</DrawerTitle>
            <DrawerDescription>
              {editingId
                ? "Update the permanent sign details below."
                : "Configure the details for your new permanent sign item."}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 space-y-4 pb-12 overflow-y-auto">
            <div className="w-full">
              <Label className="text-sm font-medium mb-2 block">Sign Item Type</Label>
              <Select
                value={selectedType}
                onValueChange={handleTypeChange}
                disabled={!!editingId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose permanent sign item" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PERMANENT_SIGN_ITEMS).map(([displayName, key]) => (
                    <SelectItem key={key} value={key}>
                      {displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedType && renderFormFields()}
          </div>
          <DrawerFooter>
            <div className="flex justify-end bg-white fixed border-t-1 pt-4 pr-4 right-0 bottom-4 space-x-3 w-full">
              <DrawerClose asChild>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </DrawerClose>
              <Button onClick={handleSave} disabled={!selectedType}>
                {editingId ? "Update Sign Item" : "Save Sign Item"}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div >
  );
};

export default PermanentSignsSummaryStep;
