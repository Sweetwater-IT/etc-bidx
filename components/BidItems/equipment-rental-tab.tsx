'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useEstimate } from '@/contexts/EstimateContext';
import { EquipmentRentalItem } from '@/types/IEquipmentRentalItem';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchReferenceData } from '@/lib/api-client';
import EmptyContainer from './empty-container';
import { DataTable } from '@/components/data-table';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Textarea } from '../ui/textarea';
import { SelectTrigger, Select, SelectContent, SelectValue, SelectItem } from '../ui/select';

interface StaticPriceData {
  usefulLife: number;
  cost: number;
}

interface RentalItem {
  id: number;
  item_number: string;
  display_name: string;
  item_description: string;
  item_name: string;
}

const EquipmentSummaryStep = () => {
  const { equipmentRental, dispatch } = useEstimate();
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([]);
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<EquipmentRentalItem | null>(null);
  const [isCustom, setIsCustom] = useState(false);


  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ item: any, index: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const setItemPrices = async () => {
      const rentalItemsData = await fetchReferenceData('rental_items');
      console.log('Datos de rental_items:', rentalItemsData);
      if (isMounted) {
        const uniqueRentalItems = rentalItemsData.filter(
          (item: RentalItem, index: number, self: RentalItem[]) =>
            index === self.findIndex((t: RentalItem) => (
              t.item_number === item.item_number
            ))
        );
        setRentalItems(uniqueRentalItems);
      }
    };
    setItemPrices();

    return () => { isMounted = false; };
  }, []);

  const handleAddEquipment = () => {
    setFormData({
      name: '',
      item_number: '',
      item_description: '',
      quantity: 0,
      uom: 0,
      rentPrice: 0,
      reRentPrice: 0,
      reRentForCurrentJob: false,
      totalCost: 0,
      usefulLifeYrs: 0,
      notes: '',
      uom_type: 'Weeks'
    });
    setIsCustom(false);
    setEditingIndex(null);
    setDrawerOpen(true);
  };

  const handleEditEquipment = (index: number) => {
    const itemToEdit = equipmentRental[index];
    setFormData({ ...itemToEdit });
    setEditingIndex(index);
    // Check if the item is a standard one or a custom one
    const isStandard = rentalItems.some(item => item.item_number === itemToEdit.item_number);
    setIsCustom(!isStandard);
    setDrawerOpen(true);
  };

  const handleFormUpdate = (updates: Partial<EquipmentRentalItem>) => {
    if (formData) {
      const updatedFormData = { ...formData, ...updates };
      setFormData(updatedFormData);
    }
  };

  const handleSave = () => {
    if (!formData) return;

    const finalName = formData.name.trim();
    if (!finalName) return;

    const finalFormData = {
      ...formData,
      name: finalName,
      ...(isCustom ? {} : { itemNumber: formData.item_number }),
    };

    if (editingIndex !== null) {
      console.log('entro a dispatch update rental item', finalFormData);

      (Object.keys(finalFormData) as Array<keyof EquipmentRentalItem>).forEach(key => {
        dispatch({
          type: 'UPDATE_RENTAL_ITEM',
          payload: {
            index: editingIndex,
            key: key,
            value: finalFormData[key],
          },
        });
      });
    } else {
      console.log('entro a dispatch add rental item', finalFormData);

      dispatch({
        type: 'ADD_RENTAL_ITEM',
        payload: finalFormData,
      });
    }


    setDrawerOpen(false);
    setFormData(null);
    setEditingIndex(null);
    setIsCustom(false);
  };

  const handleCancel = () => {
    setDrawerOpen(false);
    setFormData(null);
    setEditingIndex(null);
    setIsCustom(false);
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
      key: 'itemNumber',
      title: 'Item Number',
      className: 'text-left'
    },
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
      key: 'uom',
      title: 'UOM',
      className: 'text-left'
    },
    {
      key: 'uom_type',
      title: 'Type UOM',
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

  const formatCurrency = (value: number | null | undefined): string => {
    if (!value) return "-";
    return `$${value.toFixed(2)}`;
  };

  const formattedData = equipmentRental.map(item => ({
    ...item,
    itemNumber: item.item_number || '-',
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
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between overflow-hidden"
                  >
                    <span className="truncate">
                      {formData.name
                        ? formData.name
                        : "Select equipment..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-sm p-0">
                  <Command>
                    <CommandInput placeholder="Search equipment..." />
                    <CommandList onWheel={(e) => e.stopPropagation()}>
                      <div className="max-h-[200px] overflow-y-auto">
                        <CommandEmpty>No equipment found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={() => { setIsCustom(true); setOpen(false); handleFormUpdate({ name: '', item_number: '' }); }} className="flex items-center">
                            <Check className={cn("mr-2 h-4 w-4", isCustom ? "opacity-100" : "opacity-0")} />
                            Custom
                          </CommandItem>
                          <Separator className='my-1' />
                          {rentalItems.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={`${item.display_name} ${item.item_number}`}
                              onSelect={() => {
                                handleFormUpdate({
                                  item_number: item.item_number,
                                  name: item.display_name,
                                  item_description: item.item_name
                                });
                                setIsCustom(false);
                                setOpen(false);
                              }}
                              className="flex items-center"
                            >
                              <Check className={cn("mr-2 h-4 w-4", formData.item_number === item.item_number ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col">
                                <span>{item.display_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {item.item_number}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </div>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Item Number and Description Display */}
              {formData.item_number && formData.name && !isCustom && (
                <div className="p-4 mt-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Item Number: </span>{formData.item_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Item Name: </span>{formData.item_description || formData.name}
                  </p>
                </div>
              )}

              {isCustom && (
                <div className='w-full'>
                  <Label className='text-sm font-medium mb-2 block'>
                    Custom Equipment Name
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={e => handleFormUpdate({ name: e.target.value })}
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
                      handleFormUpdate({
                        quantity:
                          parseInt(e.target.value) || 0
                      })
                    }
                    min={0}
                    className='w-full'
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block">UOM</Label>
                  <div className="flex flex-row items-center flex-1">
                    <div className=' w-2/5'>
                      <Input
                        type="number"
                        value={formData.uom || ''}
                        onChange={(e) =>
                          handleFormUpdate({ uom: parseInt(e.target.value) || 0 })
                        }
                        min={0}
                        className="flex-1 rounded-tr-none rounded-br-none"
                      />
                    </div>
                    <div className='w-3/5'>
                      <Select
                        value={formData.uom_type || 'Months'}
                        onValueChange={(value) => handleFormUpdate({ uom_type: value })}
                      >
                        <SelectTrigger className="rounded-tl-none rounded-bl-none h-full px-2">
                          <SelectValue placeholder="Months" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Days">Days</SelectItem>
                          <SelectItem value="Weeks">Weeks</SelectItem>
                          <SelectItem value="Months">Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
                      handleFormUpdate({
                        rentPrice:
                          parseFloat(e.target.value) || 0
                      })
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
                        handleFormUpdate({
                          reRentPrice:
                            parseFloat(e.target.value) || 0
                        })
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
                      onCheckedChange={(checked) =>
                        handleFormUpdate({ reRentForCurrentJob: !!checked })
                      }
                    />
                    <Label htmlFor='reRent-drawer' className='text-sm'>
                      Re-rent for current job
                    </Label>
                  </div>
                </div>
              </div>

              {isCustom && (
                <div className='flex gap-x-4 w-full'>
                  <div className='flex-1'>
                    <Label className='text-sm font-medium mb-2 block'>
                      Cost
                    </Label>
                    <Input
                      type='number'
                      value={formData.totalCost || ''}
                      onChange={e =>
                        handleFormUpdate({
                          totalCost:
                            parseFloat(e.target.value) || 0
                        })
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
                        handleFormUpdate({
                          usefulLifeYrs:
                            parseInt(e.target.value) || 0
                        })
                      }
                      min={0}
                      className='w-full'
                    />
                  </div>
                </div>
              )}

              <div className="w-full">
                <Label className="text-sm font-medium mb-2 block">Notes</Label>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => handleFormUpdate({ notes: e.target.value })}
                  placeholder="Add any notes related to this sale item..."
                  className="w-full h-24 p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
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
                disabled={!formData?.name.trim()}
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
