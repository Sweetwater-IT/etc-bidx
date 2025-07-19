"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";
import { useEstimate } from "@/contexts/EstimateContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
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
import { getDisplayName, PERMANENT_SIGN_ITEMS, PostMountedInstall, PostMountedResetOrRemove, PostMountedInstallTypeC, InstallFlexibleDelineators, PMSItemNumbers, AllPMSItemKeys, PMSItemKeys, permSignsDbMap, PMSEquipmentItems, AdditionalPMSEquipment } from "@/types/TPermanentSigns";
import { defaultFlexibleDelineators, defaultPMSResetB, defaultPMSTypeB, defaultPMSTypeC } from "@/types/default-objects/defaultPermanentSignsObject";
import { v4 as uuidv4 } from 'uuid';
import EmptyContainer from "./empty-container";
import { Separator } from "../ui/separator";
import { safeNumber } from "@/lib/safe-number";
import { getPermanentSignRevenueAndMargin, getPermSignDaysRequired, getPermSignFuelCost, getPermSignLaborCost, getPermSignMaterialCost, getPermSignSqFtCost, getPermSignTotalCost, getPermSignTrips, getRequiredInstallHours } from "@/lib/mptRentalHelperFunctions";
import { toast } from "sonner";
import { Switch } from "../ui/switch";
import { determineItemType } from "@/types/TPermanentSigns";
import { formatCurrencyValue } from "@/lib/formatDecimals";



// Additional equipment options for custom items
const ADDITIONAL_EQUIPMENT_OPTIONS: Record<string, PMSEquipmentItems> = {
  'Anti-Theft Bolts': 'antiTheftBolts',
  'Chevron Brackets': 'chevronBrackets',
  'Street Name Cross Brackets': 'streetNameCrossBrackets',
  'Stiffener (per sq inch)': 'stiffenerSqInches',
  'TMZ Brackets': 'tmzBrackets',
  'Jenny Brackets': 'jennyBrackets',
  'Hi-Reflective Strips': 'hiReflectiveStrips',
  'FYG Reflective Strips': 'fygReflectiveStrips',
  'Wood Post Metal Sleeves': 'woodPostMetalSleeves'
};

const createDefaultItem = (keyToBeAdded: PMSItemKeys): PMSItemNumbers => {
  const newPMSId = uuidv4();
  let defaultObjectToBeAdded: any;
  switch (keyToBeAdded) {
    case 'pmsTypeB':
      defaultObjectToBeAdded = {
        ...defaultPMSTypeB,
        id: newPMSId
      }
      break;
    case 'pmsTypeF':
      defaultObjectToBeAdded = {
        ...defaultPMSTypeB,
        id: newPMSId,
        type: 'F',
        itemNumber: '0935-001'
      }
      break;
    case 'pmsTypeC':
      defaultObjectToBeAdded = {
        ...defaultPMSTypeC,
        id: newPMSId
      }
      break;
    case 'resetTypeB':
      defaultObjectToBeAdded = {
        ...defaultPMSResetB,
        name: '0941-0001',
        id: newPMSId
        // permSignBolts
      }
      break;
    case 'resetTypeF':
      defaultObjectToBeAdded = {
        ...defaultPMSResetB,
        itemNumber: '0945-0001',
        id: newPMSId,
        isRemove: false,
        type: 'F'
        // permSignBolts
      }
      break;
    case 'removeTypeB':
      defaultObjectToBeAdded = {
        ...defaultPMSResetB,
        id: newPMSId,
        itemNumber: '0971-0001',
        isRemove: true
      }
      break;
    case 'removeTypeF':
      defaultObjectToBeAdded = {
        ...defaultPMSResetB,
        id: newPMSId,
        itemNumber: '0975-0001',
        isRemove: true
      }
      break;
    case 'flexibleDelineator':
      defaultObjectToBeAdded = {
        ...defaultFlexibleDelineators,
        id: newPMSId
      }
      break;
    default:
      defaultObjectToBeAdded = undefined;
  }
  return defaultObjectToBeAdded
}

const PermanentSignsSummaryStep = () => {
  const { permanentSigns, dispatch, adminData, mptRental } = useEstimate();
  const [selectedType, setSelectedType] = useState<PMSItemKeys>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PMSItemNumbers | null>(null);

  //get static data
  useEffect(() => {
    const getStaticData = async () => {
      const response = await fetch('/api/permanent-signs');
      if (!response.ok) {
        toast.error('Could not fetch permanent sign data')
      }
      else {
        const data = await response.json();
        dispatch({
          type: 'UPDATE_PERMANENT_SIGNS_ASSUMPTIONS',
          payload: {
            key: 'productivityRates',
            value: {
              'flexibleDelineator': data.data.flex_delineator,
              'pmsTypeB': data.data.type_b_install,
              'pmsTypeF': data.data.type_f_install,
              'pmsTypeC': data.data.type_c_install,
              'resetTypeB': data.data.type_b_reset,
              'resetTypeF': data.data.type_f_reset,
              'removeTypeB': data.data.type_b_remove,
              'removeTypeF': data.data.type_f_remove
            }
          }
        })
        dispatch({
          type: 'UPDATE_PERMANENT_SIGNS_ASSUMPTIONS',
          payload: {
            key: 'maxDailyHours',
            value: data.data.max_daily_hours
          }
        })
        dispatch({
          type: 'UPDATE_PERMANENT_SIGNS_ASSUMPTIONS',
          payload: {
            key: 'itemMarkup',
            value: data.data.material_markup
          }
        })
        dispatch({
          type: 'UPDATE_PERMANENT_SIGNS_ASSUMPTIONS',
          payload: {
            key: 'equipmentData',
            value: data.data.items.map((item: { name: string, price: number }) => ({
              name: permSignsDbMap[item.name],
              cost: item.price
            })).filter(item => !!item.name)
          }
        })
      }
    }
    getStaticData();
  }, [])

  const handleAddSign = () => {
    setSelectedType(undefined);
    setFormData(null);
    setEditingId(null);
    setDrawerOpen(true);
  };

  const handleEditItem = (signId: string) => {
    const item = permanentSigns?.signItems.find(item => item.id === signId);
    if (item) {
      setFormData({ ...item });
      setEditingId(signId);
      const itemType = determineItemType(item);
      setSelectedType(itemType);
      setDrawerOpen(true);
    }
  };

  const handleTypeChange = (value: PMSItemKeys) => {
    setSelectedType(value);
    // Create new form data based on the selected type
    const defaultItem = createDefaultItem(value);
    setFormData(defaultItem);
  };

  const handleFieldUpdate = (field: AllPMSItemKeys, value: any) => {
    if (formData) {
      setFormData(prevData => ({
        ...prevData,
        [field]: value
      } as any));
    }
  };

  // Handle additional items for custom equipment
  const handleAddAdditionalItem = () => {
    if (!formData || !('additionalItems' in formData)) return;
    
    const newItem: AdditionalPMSEquipment = {
      equipmentType: 'antiTheftBolts', // default
      quantity: 1
    };

    const updatedItems = [...(formData.additionalItems || []), newItem];
    handleFieldUpdate('additionalItems', updatedItems);
  };

  const handleRemoveAdditionalItem = (index: number) => {
    if (!formData || !('additionalItems' in formData)) return;
    
    const updatedItems = (formData.additionalItems || []).filter((_, i) => i !== index);
    handleFieldUpdate('additionalItems', updatedItems);
  };

  const handleUpdateAdditionalItem = (index: number, field: keyof AdditionalPMSEquipment, value: any) => {
    if (!formData || !('additionalItems' in formData)) return;
    
    const updatedItems = [...(formData.additionalItems || [])];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    handleFieldUpdate('additionalItems', updatedItems);
  };

  //set number trips in form data
  useEffect(() => {
    if(!formData || !permanentSigns || permanentSigns.signItems.length < 1 || !!editingId) return;
    setFormData(prevData => ({
      ...prevData,
      numberTrips: getPermSignTrips(formData, permanentSigns.signItems, permanentSigns.maxDailyHours)
    } as any))
  }, [formData?.id, permanentSigns?.maxDailyHours, formData?.installHoursRequired, formData?.separateMobilization, formData?.numberTrucks])

  //handle install hour calcs on the fly
  useEffect(() => {
    if (permanentSigns && formData && selectedType) {
      setFormData(prevData => ({
        ...prevData,
        installHoursRequired: getRequiredInstallHours(formData?.quantity, permanentSigns.productivityRates[selectedType], formData?.personnel)
      } as any))
    }
  }, [formData?.personnel, permanentSigns?.productivityRates, formData?.quantity])

  //handle trips calcs on the fly
  useEffect(() => {
    if (!permanentSigns || !selectedType || !formData) return;
    const calculatedTrips = getPermSignTrips(formData, permanentSigns.signItems, permanentSigns.maxDailyHours)
      setFormData(prevData => ({
        ...prevData,
        //if we're editing the first item and nothing has changed, don't automatically set the number trips (this will set trips back to original trips
        // if the user changes a value then goes back to the original)
        numberTrips: calculatedTrips 
      }) as any)
  }, [formData?.numberTrucks, permanentSigns?.maxDailyHours, formData?.installHoursRequired])

  //update perm sign bolts on the fly
  useEffect(() => {
    if (!selectedType || !formData || selectedType === 'removeTypeB' || selectedType === 'removeTypeF') return;
    setFormData(prevData => ({
      ...prevData,
      permSignBolts: formData.quantity * 2
    } as any))
  }, [formData?.quantity])

  const handleSave = () => {
    if (!formData || !selectedType) return;

    if (editingId) {
      //if the number of trips got changed, run the update trips function to adjust for new install hours
      if(formData.numberTrips !== permanentSigns?.signItems.find(signItem => signItem.id === editingId)?.numberTrips){
        updatePermSignTrips(editingId);
      } 
      // Update existing item by mapping through formData and updating relvent fields
      Object.keys(formData).forEach(field => {
        if (field !== 'id') {
          dispatch({
            type: 'UPDATE_PERMANENT_SIGNS_ITEM',
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
        type: 'ADD_PERMANENT_SIGNS_ITEM',
        payload: {
          newPMSItem: formData
        },
      });
    }

    setDrawerOpen(false);
    setFormData(null);
    setEditingId(null);
    setSelectedType(undefined);
  };

  const updatePermSignTrips = (editedItemId? : string) =>{
    if(!permanentSigns) return;
    permanentSigns?.signItems.forEach((signItem, index) => {
      if(index === 0) return;
      if(!!editedItemId && signItem.id === editedItemId) return;
      dispatch({
        type: 'UPDATE_PERMANENT_SIGNS_ITEM',
        payload: {
          signId: signItem.id,
          field: 'numberTrips',
          value: getPermSignTrips(signItem, permanentSigns.signItems, permanentSigns.maxDailyHours)
        }
      })
    })
  } 

  //useEffecct to update all trips of all items whenever an item gets added/removed
  useEffect(() => {
    updatePermSignTrips();
  }, [permanentSigns?.signItems.length])

  const handleCancel = () => {
    setDrawerOpen(false);
    setFormData(null);
    setEditingId(null);
    setSelectedType(undefined);
  };

  const handleItemDelete = (pmsId: string) => {
    dispatch({
      type: 'DELETE_PERMANENT_SIGNS_ITEM',
      payload: { signId: pmsId },
    });
  };

  const renderFormFields = () => {
    if (!formData || !selectedType) return null;

    // Common fields that appear in all types
    const commonFields = (
      <>
        {!!permanentSigns && permanentSigns.signItems.length > 0 && formData.id !== permanentSigns.signItems[0]?.id && <div>
          <Switch
            checked={formData.separateMobilization}
            onCheckedChange={(value) => handleFieldUpdate('separateMobilization', value)}
          />
        </div>}
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Personnel</Label>
          <Input
            type="number"
            value={formData?.personnel || ""}
            onChange={(e) => handleFieldUpdate('personnel', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Number of Trucks</Label>
          <Input
            type="number"
            value={formData?.numberTrucks || ""}
            onChange={(e) => handleFieldUpdate('numberTrucks', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Number of Trips</Label>
          <Input
            type="number"
            value={formData?.numberTrips || ""}
            onChange={(e) => handleFieldUpdate('numberTrips', parseInt(e.target.value) || 0)}
            min={0}
            disabled={((!!permanentSigns && permanentSigns?.signItems?.length > 0) && formData.id !== permanentSigns?.signItems[0]?.id)}
            className="w-full"
          />
        </div>
        {(selectedType === 'pmsTypeB' || selectedType === 'pmsTypeF' || selectedType === 'pmsTypeC') && <><div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Sign Cost / Sq. Ft</Label>
          <Input
            type="number"
            value={permanentSigns?.equipmentData.find(equip => equip.name === 'permSignCostSqFt')?.cost || ""}
            onChange={(e) => {
              if (!permanentSigns) return;
              dispatch({
                type: 'UPDATE_PERMANENT_SIGNS_ASSUMPTIONS', payload: {
                  key: 'equipmentData', value: permanentSigns.equipmentData.map(equip => {
                    if (equip.name === 'permSignCostSqFt') {
                      return { name: equip.name, cost: parseInt(e.target.value) }
                    } else return equip
                  })
                }
              })
            }}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Sign Price / Sq. Ft</Label>
          <Input
            type="number"
            value={permanentSigns?.equipmentData.find(equip => equip.name === 'permSignPriceSqFt')?.cost || ""}
            onChange={(e) => {
              if (!permanentSigns) return;
              dispatch({
                type: 'UPDATE_PERMANENT_SIGNS_ASSUMPTIONS', payload: {
                  key: 'equipmentData', value: permanentSigns.equipmentData.map(equip => {
                    if (equip.name === 'permSignPriceSqFt') {
                      return { name: equip.name, cost: parseInt(e.target.value) }
                    } else return equip
                  })
                }
              })
            }}
            min={10}
            className="w-full"
          />
        </div></>}
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">O/W Travel Time</Label>
          <Input
            type="number"
            value={Math.round((safeNumber(adminData?.owTravelTimeMins) / 60) * 100) / 100}
            onChange={(e) => {
              dispatch({
                type: 'UPDATE_ADMIN_DATA',
                payload: {
                  key: 'owTravelTimeMins',
                  value: parseFloat(e.target.value) * 60
                }
              })
            }}
            min={0}
            step='0.01'
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">O/W Travel Distance</Label>
          <Input
            type="number"
            value={safeNumber(adminData?.owMileage)}
            onChange={(e) => dispatch({
              type: 'UPDATE_ADMIN_DATA',
              payload: {
                key: 'owTravelTimeMins',
                value: parseInt(e.target.value)
              }
            })}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Quantity</Label>
          <Input
            type="number"
            value={formData?.quantity || ""}
            onChange={(e) => handleFieldUpdate('quantity', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block whitespace-nowrap">Install Hours Required</Label>
          <Input
            type="number"
            value={formData?.installHoursRequired || ""}
            onChange={(e) => handleFieldUpdate('installHoursRequired', parseFloat(e.target.value) || 0)}
            min={0}
            step="0.1"
            className="w-full"
          />
        </div>
        <Separator className="col-span-3" />
      </>
    );

    // Perm Sign Bolts field (most types have this, except resetTypeF)
    const permSignBoltsField = (selectedType !== 'removeTypeF' && selectedType !== 'removeTypeB') ? (
      <div className="flex-1">
        <Label className="text-sm font-medium mb-2 block">Perm. Sign Bolts</Label>
        <Input
          type="number"
          value={formData?.permSignBolts || ""}
          onChange={(e) => handleFieldUpdate('permSignBolts', parseInt(e.target.value) || 0)}
          min={0}
          className="w-full"
          disabled
        />
      </div>
    ) : null;

    // Fields specific to PostMountedInstall (Type B and F)
    const postMountedInstallFields = (selectedType === 'pmsTypeB' || selectedType === 'pmsTypeF') ? (
      <>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Sign Sq. Footage</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstall).signSqFootage || ""}
            onChange={(e) => handleFieldUpdate('signSqFootage', parseFloat(e.target.value) || 0)}
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
            onChange={(e) => handleFieldUpdate('hiReflectiveStrips', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">FYG Reflective Strips</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstall).fygReflectiveStrips || ""}
            onChange={(e) => handleFieldUpdate('fygReflectiveStrips', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Jenny Brackets</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstall).jennyBrackets || ""}
            onChange={(e) => handleFieldUpdate('jennyBrackets', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Stiffener Sq. Inches</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstall).stiffenerSqInches || ""}
            onChange={(e) => handleFieldUpdate('stiffenerSqInches', parseFloat(e.target.value) || 0)}
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
            onChange={(e) => handleFieldUpdate('tmzBrackets', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Anti-Theft Bolts</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstall).antiTheftBolts || ""}
            onChange={(e) => handleFieldUpdate('antiTheftBolts', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Chevron Brackets</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstall).chevronBrackets || ""}
            onChange={(e) => handleFieldUpdate('chevronBrackets', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block whitespace-nowrap">Street Name Cross Brackets</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstall).streetNameCrossBrackets || ""}
            onChange={(e) => handleFieldUpdate('streetNameCrossBrackets', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
      </>
    ) : null;

    // Fields specific to PostMountedInstallTypeC
    const typeCFields = selectedType === 'pmsTypeC' ? (
      <>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Sign Sq. Footage</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstallTypeC).signSqFootage || ""}
            onChange={(e) => handleFieldUpdate('signSqFootage', parseFloat(e.target.value) || 0)}
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
            onChange={(e) => handleFieldUpdate('hiReflectiveStrips', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">FYG Reflective Strips</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstallTypeC).fygReflectiveStrips || ""}
            onChange={(e) => handleFieldUpdate('fygReflectiveStrips', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Stiffener Sq. Inches</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstallTypeC).stiffenerSqInches || ""}
            onChange={(e) => handleFieldUpdate('stiffenerSqInches', parseFloat(e.target.value) || 0)}
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
            onChange={(e) => handleFieldUpdate('tmzBrackets', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Anti-Theft Bolts</Label>
          <Input
            type="number"
            value={(formData as PostMountedInstallTypeC).antiTheftBolts || ""}
            onChange={(e) => handleFieldUpdate('antiTheftBolts', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full"
          />
        </div>
      </>
    ) : null;

    // Fields specific to InstallFlexibleDelineators
    const flexibleDelineatorFields = selectedType === 'flexibleDelineator' ? (
      <>
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Cost</Label>
          <Input
            type="number"
            value={(formData as InstallFlexibleDelineators).flexibleDelineatorCost || ""}
            onChange={(e) => handleFieldUpdate('flexibleDelineatorCost', parseFloat(e.target.value) || 0)}
            min={0}
            step="0.01"
            className="w-full"
          />
        </div>
      </>
    ) : null;

    // Additional items section for custom equipment (not for main install types)
    const canHaveAdditionalItems = selectedType && !['pmsTypeB', 'pmsTypeF', 'pmsTypeC'].includes(selectedType);
    const additionalItemsSection = canHaveAdditionalItems && 'additionalItems' in formData ? (
      <>
        <Separator className="col-span-3" />
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-medium">Additional Equipment</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAdditionalItem}
            >
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
                    handleUpdateAdditionalItem(index, 'equipmentType', value)
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
                <Label className="text-sm font-medium mb-2 block">Quantity</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => 
                    handleUpdateAdditionalItem(index, 'quantity', parseInt(e.target.value) || 0)
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
        {/* Item Number Input */}
        <div className="w-full">
          <Label className="text-sm font-medium mb-2 block">Item Number</Label>
          <Input
            type="text"
            value={formData?.itemNumber || ""}
            onChange={(e) => handleFieldUpdate('itemNumber', e.target.value)}
            className="w-full"
            placeholder="Enter item number"
          />
        </div>

        {/* Fields in responsive grid */}
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
      <div className="flex items-center justify-between pb-2 border-b mb-6">
        <h3 className="text-xl text-black font-semibold">
          Permanent Signs
        </h3>
        <Button onClick={handleAddSign}>
          <Plus className="mr-2 h-4 w-4" />
          Add Sign Item
        </Button>
      </div>

      <div className="relative">
        {/* Permanent Signs List */}
        {(!permanentSigns || permanentSigns.signItems.length === 0) && (
          <EmptyContainer topText="No permanent signs added yet" subtext="When you add permanent signs, they will appear here." />
        )}
        {permanentSigns && permanentSigns.signItems.map(pmsItem => {
          const itemType = determineItemType(pmsItem);

          return (
            <div
              key={`sign-${pmsItem.id}`}
              className="rounded-lg border bg-card text-card-foreground shadow-sm mb-2 p-4"
            >
              <div className='grid grid-cols-2 mb-4'>
                <div></div>
                <div className='ml-auto flex items-center gap-x-2'>
                  <div className='whitespace-nowrap'>Use custom margin</div>
                  <Switch
                    checked={!pmsItem.standardPricing}
                    onCheckedChange={(value) => dispatch({ type: 'UPDATE_PERMANENT_SIGNS_ITEM', payload: { signId: pmsItem.id, field: 'standardPricing', value: !value } })}
                  />
                  {!pmsItem.standardPricing && <Input
                    type='number'
                    value={pmsItem.customMargin}
                    min={0}
                    step='0.01'
                    onChange={(e) => dispatch({ type: 'UPDATE_PERMANENT_SIGNS_ITEM', payload: { signId: pmsItem.id, field: 'customMargin', value: safeNumber(parseInt(e.target.value)) } })}
                  />}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="font-medium">{getDisplayName(itemType)}</div>
                  <div className="text-sm text-muted-foreground">
                    {pmsItem?.quantity ? `Installs: ${pmsItem.quantity}` : 'Not configured'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditItem(pmsItem.id)}
                  >
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
              {/***Financials */}
              <div className='grid grid-cols-3 mt-4'>
                <div className="flex flex-col">
                  <label className="text-sm font-semibold">
                    Total Revenue
                  </label>
                  <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    ${getPermanentSignRevenueAndMargin(permanentSigns, pmsItem, adminData, mptRental).revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold">
                    Total Cost
                  </label>
                  <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    ${getPermSignTotalCost(itemType, permanentSigns, pmsItem, adminData, mptRental).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-semibold">
                    Gross Margin
                  </label>
                  <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                  {(getPermanentSignRevenueAndMargin(permanentSigns, pmsItem, adminData, mptRental).grossMargin * 100).toFixed(2)}%
                  </div>
                </div>
                {(itemType === 'pmsTypeB' || itemType === 'pmsTypeF' || itemType === 'pmsTypeC') && <div className="flex flex-col">
                  <label className="text-sm font-semibold">
                    Sign Costs
                  </label>
                  <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    ${getPermSignSqFtCost(permanentSigns, pmsItem).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>}

                <div className="flex flex-col">
                  <label className="text-sm font-semibold">
                    Labor Cost
                  </label>
                  <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    ${getPermSignLaborCost(pmsItem, adminData).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-semibold">
                    Material Cost
                  </label>
                  <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    ${getPermSignMaterialCost(itemType, permanentSigns, pmsItem).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2 block">
                    Fuel Cost
                  </label>
                  <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    ${getPermSignFuelCost(pmsItem, adminData, mptRental).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
                {(itemType === 'pmsTypeB' || itemType === 'pmsTypeF' || itemType === 'pmsTypeC') ? <div className="flex flex-col">
                  <label className="text-sm font-semibold">
                    Price Per Square Foot
                  </label>
                  <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                  ${(getPermanentSignRevenueAndMargin(permanentSigns, pmsItem, adminData, mptRental).revenue / (pmsItem as PostMountedInstall).signSqFootage).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div> : <div className="flex flex-col">
                  <label className="text-sm font-semibold">
                    Price Per Each
                  </label>
                  <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                  ${(getPermanentSignRevenueAndMargin(permanentSigns, pmsItem, adminData, mptRental).revenue / pmsItem.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>}
                <div className="flex flex-col">
                  <label className="text-sm font-semibold">
                    Total Days Required
                  </label>
                  <div className="pr-3 py-1 select-text cursor-default text-muted-foreground">
                    {getPermSignDaysRequired(pmsItem.installHoursRequired, permanentSigns.maxDailyHours)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer for adding/editing permanent signs */}
      <Drawer open={drawerOpen} direction="right" onOpenChange={setDrawerOpen}>
        <DrawerContent className='min-w-[500px] h-full' >
          <DrawerHeader>
            <DrawerTitle>
              {editingId ? 'Edit Permanent Sign' : 'Add Permanent Sign'}
            </DrawerTitle>
            <DrawerDescription>
              {editingId
                ? 'Update the permanent sign details below.'
                : 'Configure the details for your new permanent sign item.'
              }
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4 pb-12 overflow-y-auto">
            {/* Sign Type Selection */}
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

            {/* Render form fields based on selected type */}
            {selectedType && renderFormFields()}
          </div>

          <DrawerFooter>
            <div className="flex justify-end bg-white fixed border-t-1 pt-4 pr-4 right-0 bottom-4 space-x-3 w-full">
              <DrawerClose asChild>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                onClick={handleSave}
                disabled={!selectedType}
              >
                {editingId ? 'Update Sign Item' : 'Save Sign Item'}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default PermanentSignsSummaryStep;