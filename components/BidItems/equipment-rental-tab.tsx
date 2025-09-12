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

interface StaticPriceData {
  usefulLife: number;
  cost: number;
}

interface RentalItem {
  id: number;
  item_number: string;
  display_name: string;
  item_description: string;
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
      if (isMounted) {
        // Filtramos los items duplicados basándonos en el display_name
        const uniqueRentalItems = rentalItemsData.filter(
          (item: RentalItem, index: number, self: RentalItem[]) =>
            index === self.findIndex((t: RentalItem) => (
              t.display_name === item.display_name
            ))
        );
        setRentalItems(uniqueRentalItems);
      }
    };
    setItemPrices();

    return () => { isMounted = false; };
  }, []); // El array vacío asegura que se ejecute solo una vez

  const handleAddEquipment = () => {
    setFormData({
      name: '',
      itemNumber: '',
      quantity: 0,
      months: 0,
      rentPrice: 0,
      reRentPrice: 0,
      reRentForCurrentJob: false,
      totalCost: 0,
      usefulLifeYrs: 0,
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
    const isStandard = rentalItems.some(item => item.item_number === itemToEdit.itemNumber);
    setIsCustom(!isStandard);
    setDrawerOpen(true);
  };

  const handleFormUpdate = (updates: Partial<EquipmentRentalItem>) => {
    if (formData) {
      const updatedFormData = { ...formData, ...updates };
      setFormData(updatedFormData); // Solo actualiza el estado local del formulario
    }
  };

  const handleSave = () => {
    if (!formData) return;

    const finalName = formData.name.trim();
    if (!finalName) return;

    const finalFormData = {
      ...formData,
      name: finalName,
      itemNumber: isCustom ? '' : formData.itemNumber,
    };

    if (editingIndex !== null) {
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
                          <CommandItem onSelect={() => { setIsCustom(true); setOpen(false); handleFormUpdate({ name: '', itemNumber: '' }); }} className="flex items-center">
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
                                  itemNumber: item.item_number,
                                  name: item.display_name
                                });
                                setIsCustom(false);
                                setOpen(false);
                              }}
                              className="flex items-center"
                            >
                              <Check className={cn("mr-2 h-4 w-4", formData.itemNumber === item.item_number ? "opacity-100" : "opacity-0")} />
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
                <div className='flex-1'>
                  <Label className='text-sm font-medium mb-2 block'>
                    Months
                  </Label>
                  <Input
                    type='number'
                    value={formData.months || ''
                    }
                    onChange={e => handleFormUpdate({ months: parseInt(e.target.value) || 0 }
                    )
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