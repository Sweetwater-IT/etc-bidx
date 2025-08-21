'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Trash2, Plus, Edit } from 'lucide-react';
import { useEstimate } from '@/contexts/EstimateContext';
import { EquipmentRentalItem } from '@/types/IEquipmentRentalItem';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { fetchReferenceData } from '@/lib/api-client';
import { isEquipmentType } from '@/lib/is-rental-equipment';
import EmptyContainer from './empty-container';
import { DataTable } from '@/components/data-table';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';

interface StaticPriceData {
  usefulLife: number;
  cost: number;
}

type EquipmentType =
  | 'Truck Mounted Attenuator'
  | 'Message Board'
  | 'Arrow Board'
  | 'Speed Trailer';

const EquipmentSummaryStep = () => {
  const { equipmentRental, dispatch } = useEstimate();
  const [selectedType, setSelectedType] = useState<EquipmentType | 'custom' | undefined>(undefined);
  const [customName, setCustomName] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<EquipmentRentalItem | null>(null);
  const [defaultPrices, setDefaultPrices] =
    useState<Record<EquipmentType, StaticPriceData>>();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ item: any, index: number } | null>(null);

  useEffect(() => {
    const setItemPrices = async () => {
      const itemData = await fetchReferenceData('mpt equipment');
      const tmaData = itemData.find(item => item.name === 'TMA');
      const mBoardData = itemData.find(item => item.name === 'M.BOARD');
      const aBoardData = itemData.find(item => item.name === 'A.BOARD');
      const sTrailerData = itemData.find(item => item.name === 'S.TRAILER');


      if (tmaData && mBoardData && aBoardData && sTrailerData) {
        setDefaultPrices({
          'Truck Mounted Attenuator': {
            cost: tmaData.price,
            usefulLife: tmaData.depreciation_rate_useful_life,
          },
          'Message Board': {
            cost: mBoardData.price,
            usefulLife: mBoardData.depreciation_rate_useful_life,
          },
          'Arrow Board': {
            cost: aBoardData.price,
            usefulLife: aBoardData.depreciation_rate_useful_life,
          },
          'Speed Trailer': {
            cost: sTrailerData.price,
            usefulLife: sTrailerData.depreciation_rate_useful_life,
          },
        });
      }
    };
    setItemPrices();
  }, []);

  const handleAddEquipment = () => {
    setSelectedType(undefined);
    setCustomName('');
    setFormData({
      name: '',
      quantity: 0,
      months: 0,
      rentPrice: 0,
      reRentPrice: 0,
      reRentForCurrentJob: false,
      totalCost: 0,
      usefulLifeYrs: 0,
    });
    setEditingIndex(null);
    setDrawerOpen(true);
  };

  const handleEditEquipment = (index: number) => {
    setFormData({ ...equipmentRental[index] });
    setEditingIndex(index);
    if (isEquipmentType(equipmentRental[index].name)) {
      setSelectedType(equipmentRental[index].name as EquipmentType);
    } else {
      setSelectedType('custom');
      setCustomName(equipmentRental[index].name);
    }
    setDrawerOpen(true);
  };

  const handleFormUpdate = (field: keyof EquipmentRentalItem, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleTypeChange = (value: EquipmentType | 'custom') => {
    setSelectedType(value);
    if (value !== 'custom' && formData) {
      const updatedFormData = {
        ...formData,
        name: value,
        totalCost: defaultPrices ? defaultPrices[value].cost : 0,
        usefulLifeYrs: defaultPrices ? defaultPrices[value].usefulLife : 0,
      };
      setFormData(updatedFormData);
      setCustomName('');
    } else if (value === 'custom' && formData) {
      setFormData({ ...formData, totalCost: 0, usefulLifeYrs: 0, name: '' });
    }
  };

  const handleCustomNameChange = (value: string) => {
    setCustomName(value);
    if (formData) {
      setFormData({ ...formData, name: value });
    }
  };

  const handleSave = () => {
    if (!formData) return;

    const finalName = selectedType === 'custom' ? customName.trim() : selectedType;
    if (!finalName) return;

    const finalFormData = { ...formData, name: finalName };

    if (editingIndex !== null) {
      dispatch({
        type: 'UPDATE_RENTAL_ITEM',
        payload: {
          index: editingIndex,
          key: 'name',
          value: finalFormData.name,
        },
      });
      dispatch({
        type: 'UPDATE_RENTAL_ITEM',
        payload: {
          index: editingIndex,
          key: 'quantity',
          value: finalFormData.quantity,
        },
      });
      dispatch({
        type: 'UPDATE_RENTAL_ITEM',
        payload: {
          index: editingIndex,
          key: 'months',
          value: finalFormData.months,
        },
      });
      dispatch({
        type: 'UPDATE_RENTAL_ITEM',
        payload: {
          index: editingIndex,
          key: 'rentPrice',
          value: finalFormData.rentPrice,
        },
      });
      dispatch({
        type: 'UPDATE_RENTAL_ITEM',
        payload: {
          index: editingIndex,
          key: 'reRentPrice',
          value: finalFormData.reRentPrice,
        },
      });
      dispatch({
        type: 'UPDATE_RENTAL_ITEM',
        payload: {
          index: editingIndex,
          key: 'reRentForCurrentJob',
          value: finalFormData.reRentForCurrentJob,
        },
      });
      dispatch({
        type: 'UPDATE_RENTAL_ITEM',
        payload: {
          index: editingIndex,
          key: 'totalCost',
          value: finalFormData.totalCost,
        },
      });
      dispatch({
        type: 'UPDATE_RENTAL_ITEM',
        payload: {
          index: editingIndex,
          key: 'usefulLifeYrs',
          value: finalFormData.usefulLifeYrs,
        },
      });
    } else {
      dispatch({
        type: 'ADD_RENTAL_ITEM',
        payload: finalFormData,
      });
    }

    setDrawerOpen(false);
    setFormData(null);
    setEditingIndex(null);
    setSelectedType(undefined);
    setCustomName('');
  };

  const handleCancel = () => {
    setDrawerOpen(false);
    setFormData(null);
    setEditingIndex(null);
    setSelectedType(undefined);
    setCustomName('');
  };

  const handleDeleteClick = (item: any) => {
    const index = equipmentRental.findIndex(equip => equip.name === item.name);
    if (index !== -1) {
      setItemToDelete({ item, index });
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      handleEquipmentDelete(itemToDelete.index); 

    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleEquipmentDelete = (index: number) => {
    dispatch({
      type: 'DELETE_RENTAL_ITEM',
      payload: { index },
    });
  };


  const EQUIPMENT_COLUMNS = [
    {
      key: 'name',
      title: 'Equipment',
      className: 'text-left'
    },
    {
      key: 'quantity',
      title: 'Quantity',
      className: 'text-left'
    },
    {
      key: 'months',
      title: 'Months',
      className: 'text-left'
    },
    {
      key: 'rentPrice',
      title: 'Rent Price',
      className: 'text-left'
    },
    {
      key: 'reRentPrice',
      title: 'Re-rent Price',
      className: 'text-left'
    }
  ];

  // Formatear los datos para la tabla
  const formatCurrency = (value: number | null | undefined): string => {
    if (!value) return "-";
    return `$${value.toFixed(2)}`;
  };

  const formattedData = equipmentRental.map(item => ({
    ...item,
    rentPrice: formatCurrency(item.rentPrice),
    reRentPrice: formatCurrency(item.reRentPrice)
  }));


  return (
    <div>
      <div className='flex items-center justify-between pb-2 border-b mb-6'>
        <h3 className='text-xl text-black font-semibold'>Rental Equipment</h3>
        <Button onClick={handleAddEquipment}>
          <Plus className='mr-2 h-4 w-4' />
          Add Equipment
        </Button>
      </div>

      <div className='relative'>
        {equipmentRental.length === 0 ? (
          <EmptyContainer
            topText='No rental items added yet'
            subtext='When you add rental items, they will appear here.'
          />
        ) : (
          <DataTable
            data={formattedData}
            columns={EQUIPMENT_COLUMNS}
            onDelete={handleDeleteClick}
            hideDropdown={true}
            onEdit={(item) => {
              const index = equipmentRental.findIndex(equip => equip.name === item.name);
              if (index !== -1) handleEditEquipment(index);
            }}
          />


        )}

      </div>
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemCount={1}
        itemType="equipment" 
      />

      <Drawer open={drawerOpen} direction='right' onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingIndex !== null ? 'Edit Equipment' : 'Add Equipment'}
            </DrawerTitle>
            <DrawerDescription>
              {editingIndex !== null
                ? 'Update the equipment details below.'
                : 'Configure the details for your new equipment item.'}
            </DrawerDescription>
          </DrawerHeader>

          {formData && (
            <div className='px-4 space-y-4'>
              <div className='w-full'>
                <Label className='text-sm font-medium mb-2 block'>
                  Equipment Type
                </Label>
                <Select
                  value={selectedType}
                  onValueChange={handleTypeChange}
                  disabled={editingIndex !== null && isEquipmentType(formData.name)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Choose equipment rental item' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Truck Mounted Attenuator'>
                      Truck Mounted Attenuator
                    </SelectItem>
                    <SelectItem value='Arrow Board'>Arrow Board</SelectItem>
                    <SelectItem value='Message Board'>Message Board</SelectItem>
                    <SelectItem value='Speed Trailer'>Speed Trailer</SelectItem>
                    <SelectItem value='custom'>Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedType === 'custom' && (
                <div className='w-full'>
                  <Label className='text-sm font-medium mb-2 block'>
                    Custom Equipment Name
                  </Label>
                  <Input
                    value={customName}
                    onChange={e => handleCustomNameChange(e.target.value)}
                    placeholder='Enter custom item name'
                    className='w-full'
                  />
                </div>
              )}
              <div className='flex gap-4 w-full'>
                <div className='flex-1'>
                  <Label className='text-sm font-medium mb-2 block'>Qty</Label>
                  <Input
                    type='number'
                    value={formData.quantity || ''}
                    onChange={e =>
                      handleFormUpdate(
                        'quantity',
                        parseInt(e.target.value) || 0
                      )
                    }
                    min={0}
                    className='w-full'
                  />
                </div>
                <div className='flex-1'>
                  <Label className='text-sm font-medium mb-2 block'>
                    Months
                  </Label>
                  <Input
                    type='number'
                    value={formData.months || ''
                    }
                    onChange={e =>
                      handleFormUpdate('months', parseInt(e.target.value) || 0)
                    }
                    min={0}
                    className='w-full'
                  />
                </div>
              </div>
              <div className='flex gap-4 w-full'>
                <div className='flex-1'>
                  <Label className='text-sm font-medium mb-2 block'>
                    Rent Price ($)
                  </Label>
                  <Input
                    type='number'
                    value={formData.rentPrice || ''}
                    onChange={e =>
                      handleFormUpdate(
                        'rentPrice',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min={0}
                    className='w-full'
                  />
                </div>
                {formData.reRentForCurrentJob && (
                  <div className='flex-1'>
                    <Label className='text-sm font-medium mb-2 block'>
                      Re-Rent Cost ($)
                    </Label>
                    <Input
                      type='number'
                      value={formData.reRentPrice || ''}
                      onChange={e =>
                        handleFormUpdate(
                          'reRentPrice',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      min={0}
                      className='w-full'
                    />
                  </div>
                )}
              </div>

              <div className='flex flex-row gap-4 w-full'>
                <div className='flex-1'>
                  <Label className='text-sm font-medium mb-2 block'>
                    Re-Rent
                  </Label>
                  <div className='flex items-center space-x-2 pt-2'>
                    <Checkbox
                      id='reRent-drawer'
                      checked={formData.reRentForCurrentJob}
                      onCheckedChange={checked =>
                        handleFormUpdate('reRentForCurrentJob', checked)
                      }
                    />
                    <Label htmlFor='reRent-drawer' className='text-sm'>
                      Re-rent for current job
                    </Label>
                  </div>
                </div>
              </div>

              {selectedType === 'custom' && (
                <div className='flex gap-x-4 w-full'>
                  <div className='flex-1'>
                    <Label className='text-sm font-medium mb-2 block'>
                      Cost
                    </Label>
                    <Input
                      type='number'
                      value={formData.totalCost || ''}
                      onChange={e =>
                        handleFormUpdate(
                          'totalCost',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      min={0}
                      className='w-full'
                    />
                  </div>
                  <div className='flex-1'>
                    <Label className='text-sm font-medium mb-2 block'>
                      Useful Life in Years
                    </Label>
                    <Input
                      type='number'
                      value={formData.usefulLifeYrs || ''
                      }
                      onChange={e =>
                        handleFormUpdate(
                          'usefulLifeYrs',
                          parseInt(e.target.value) || 0
                        )
                      }
                      min={0}
                      className='w-full'
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DrawerFooter>
            <div className='flex justify-end space-x-3 w-full'>
              <DrawerClose asChild>
                <Button variant='outline' onClick={handleCancel}>
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                onClick={handleSave}
                disabled={selectedType === 'custom' && !customName.trim()}
              >
                {editingIndex !== null ? 'Update Equipment' : 'Save Equipment'}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default EquipmentSummaryStep;