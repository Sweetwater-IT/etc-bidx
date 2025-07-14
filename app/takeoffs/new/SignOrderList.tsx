'use client';

import { Button } from '@/components/ui/button';
import { ChevronRight, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEstimate } from '@/contexts/EstimateContext';
import { generateUniqueId } from '@/components/pages/active-bid/signs/generate-stable-id';
import { returnSignTotalsSquareFootage } from '@/lib/mptRentalHelperFunctions';
import {
  EquipmentType,
  PrimarySign,
  SecondarySign,
  ExtendedPrimarySign,
  ExtendedSecondarySign,
} from '@/types/MPTEquipment';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DesignationSearcher from '@/components/pages/active-bid/signs/DesignationSearcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SignEditingSheet from './SignEditingSheet';
import { safeNumber } from '@/lib/safe-number';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import '@/components/pages/active-bid/signs/no-spinner.css';

const SIGN_COLUMNS = [
  {
    key: 'designation',
    title: 'Designation',
  },
  {
    key: 'inStock',
    title: 'In Stock',
    shopOnly: true,
  },
  {
    key: 'order',
    title: 'Order',
    shopOnly: true,
  },
  {
    key: 'make',
    title: 'Make',
    shopOnly: true,
  },
  {
    key: 'description',
    title: 'Description',
  },
  {
    key: 'width',
    title: 'Width',
  },
  {
    key: 'height',
    title: 'Height',
  },
  {
    key: 'quantity',
    title: 'Quantity',
    centered: true,
  },
  {
    key: 'sheeting',
    title: 'Sheeting',
  },
  {
    key: 'substrate',
    title: 'Substrate',
  },
  {
    key: 'displayStructure', // Maps to associatedStructure in PrimarySign
    title: 'Structure',
  },
  {
    key: 'stiffener',
    title: 'Stiffener',
  },
  {
    key: 'bLights',
    title: 'B Lights',
  },
  {
    key: 'cover',
    title: 'Covers',
  },
  {
    key: 'actions',
    title: '',
    sticky: true,
  },
];

interface Props {
  currentPhase?: number;
  onlyTable?: boolean;
  shopMode?: boolean;
  shopSigns?: (ExtendedPrimarySign | ExtendedSecondarySign)[];
  updateShopTracking?: (signId: string, field: 'make' | 'order' | 'inStock', value: number) => void;
  adjustShopValue?: (signId: string, field: 'make' | 'order' | 'inStock', delta: number) => void;
}

export function SignOrderList({
  currentPhase = 0,
  onlyTable = false,
  shopMode = false,
  shopSigns,
  updateShopTracking,
  adjustShopValue,
}: Props) {
  const { mptRental, dispatch } = useEstimate();

  const [squareFootageTotal, setSquareFootageTotal] = useState<number>(0);
  const [localSign, setLocalSign] = useState<PrimarySign | SecondarySign>();
  const [open, setOpen] = useState<boolean>(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    if (localSign && localSign.designation !== '') {
      setOpen(true);
    }
  }, [localSign?.designation]);

  const handleClose = () => {
    setLocalSign(undefined);
    setOpen(false);
  };

  const getCurrentEquipmentQuantity = (equipmentType: EquipmentType): number => {
    const currentPhaseData = mptRental.phases[currentPhase];
    return currentPhaseData.standardEquipment[equipmentType]?.quantity || 0;
  };

  const deleteAssociatedEquipmentInfo = (signId: string) => {
    const deletedSign = mptRental.phases[currentPhase].signs.find(
      s => Object.hasOwn(s, 'associatedStructure') && s.id === signId
    ) as PrimarySign | undefined;

    if (deletedSign && deletedSign.quantity > 0) {
      if (deletedSign.cover) {
        dispatch({
          type: 'ADD_MPT_ITEM_NOT_SIGN',
          payload: {
            phaseNumber: 0,
            equipmentType: 'covers',
            equipmentProperty: 'quantity',
            value: getCurrentEquipmentQuantity('covers') - deletedSign.quantity,
          },
        });
      }
      if (deletedSign.associatedStructure !== 'none') {
        dispatch({
          type: 'ADD_MPT_ITEM_NOT_SIGN',
          payload: {
            phaseNumber: 0,
            equipmentType: deletedSign.associatedStructure,
            equipmentProperty: 'quantity',
            value: getCurrentEquipmentQuantity(deletedSign.associatedStructure) - deletedSign.quantity,
          },
        });
      }
      if (deletedSign.bLights > 0) {
        dispatch({
          type: 'ADD_MPT_ITEM_NOT_SIGN',
          payload: {
            phaseNumber: 0,
            equipmentType: 'BLights',
            equipmentProperty: 'quantity',
            value: getCurrentEquipmentQuantity('BLights') - (deletedSign.quantity * deletedSign.bLights),
          },
        });
      }
    }
  };

  useEffect(() => {
    if (!open) {
      const invalidSigns = mptRental.phases[currentPhase].signs.filter(
        s => s.quantity < 1 || s.height < 1 || s.width < 1 || !s.designation
      );
      invalidSigns.forEach(s => {
        dispatch({ type: 'DELETE_MPT_SIGN', payload: s.id });
        deleteAssociatedEquipmentInfo(s.id);
      });
    }
  }, [open]);

  useEffect(() => {
    const signTotals = returnSignTotalsSquareFootage(mptRental);
    setSquareFootageTotal(
      signTotals.HI.totalSquareFootage + signTotals.DG.totalSquareFootage + signTotals.Special.totalSquareFootage
    );
  }, [mptRental]);

  const handleSignAddition = () => {
    const defaultSign: PrimarySign = {
      id: generateUniqueId(),
      designation: '',
      width: 0,
      height: 0,
      sheeting: 'DG',
      quantity: 0,
      associatedStructure: 'none',
      displayStructure: 'LOOSE',
      bLights: 0,
      cover: false,
      isCustom: false,
      bLightsColor: undefined,
      description: '',
      substrate: 'Plastic',
    };
    dispatch({
      type: 'ADD_MPT_SIGN',
      payload: {
        phaseNumber: 0,
        sign: defaultSign,
      },
    });
    setLocalSign(defaultSign);
  };

  const getSecondarySignsForPrimary = (primarySignId: string): SecondarySign[] => {
    const desiredPhase = mptRental.phases[currentPhase];
    if (!desiredPhase) return [];

    return desiredPhase.signs.filter(
      (s): s is SecondarySign => 'primarySignId' in s && s.primarySignId === primarySignId
    );
  };

  const updateSecondarySignQuantities = (primarySignId: string, newQuantity: number) => {
    const secondarySigns = getSecondarySignsForPrimary(primarySignId);

    secondarySigns.forEach(secondarySign => {
      dispatch({
        type: 'UPDATE_MPT_SIGN',
        payload: {
          phase: currentPhase,
          signId: secondarySign.id,
          key: 'quantity',
          value: newQuantity,
        },
      });
    });
  };

  const updateEquipmentQuantity = (equipmentType: EquipmentType, newQuantity: number) => {
    dispatch({
      type: 'ADD_MPT_ITEM_NOT_SIGN',
      payload: {
        phaseNumber: currentPhase,
        equipmentType: equipmentType,
        equipmentProperty: 'quantity',
        value: newQuantity,
      },
    });
  };

  const handleQuantityChange = (signId: string, quantity: number) => {
    const currentSign = mptRental.phases[currentPhase].signs.find(s => s.id === signId);

    if (currentSign && Object.hasOwn(currentSign, 'associatedStructure')) {
      const qtyChange = quantity - currentSign.quantity;
      if ((currentSign as PrimarySign).associatedStructure !== 'none') {
        const currentStructureQuantity = getCurrentEquipmentQuantity((currentSign as PrimarySign).associatedStructure as any);
        const newStructureQuantity = currentStructureQuantity + qtyChange;
        updateEquipmentQuantity((currentSign as PrimarySign).associatedStructure as any, Math.max(0, newStructureQuantity));
      }
      if ((currentSign as PrimarySign).bLights > 0) {
        const totalBLights = (currentSign as PrimarySign).bLights * quantity;
        updateEquipmentQuantity('BLights' as EquipmentType, totalBLights);
      }
      if ((currentSign as PrimarySign).cover) {
        updateEquipmentQuantity('covers' as EquipmentType, quantity);
      }
      updateSecondarySignQuantities(currentSign.id, quantity);
      dispatch({
        type: 'UPDATE_MPT_SIGN',
        payload: {
          phase: currentPhase,
          signId: signId,
          key: 'quantity',
          value: quantity,
        },
      });
    }
  };

  useEffect(() => {
    const latestSign = mptRental.phases[currentPhase].signs[mptRental.phases[currentPhase].signs.length - 1];
    if (onlyTable && latestSign && latestSign.quantity === 0) {
      setLocalSign(latestSign);
    }
  }, [mptRental.phases[currentPhase].signs]);

  const formatColumnValue = (
    sign: PrimarySign | SecondarySign | ExtendedPrimarySign | ExtendedSecondarySign,
    column: keyof PrimarySign
  ) => {
    const isPrimary = !Object.hasOwn(sign, 'primarySignId');

    let valueToReturn: any;

    switch (column) {
      case 'stiffener':
        if (!isPrimary) {
          valueToReturn = '-';
        } else {
          valueToReturn = (sign as PrimarySign).stiffener ? 'Yes' : 'No';
        }
        break;
      case 'cover':
        if (!isPrimary) {
          valueToReturn = '-';
        } else {
          valueToReturn = (sign as PrimarySign).cover ? sign.quantity : 0;
        }
        break;
      case 'displayStructure':
        if (!isPrimary) {
          valueToReturn = '-';
        } else {
          valueToReturn = sign[column];
        }
        break;
      case 'bLights':
        if (!isPrimary) {
          valueToReturn = '-';
        } else {
          const bLightColor = !sign.bLightsColor
            ? ''
            : (sign as PrimarySign).bLightsColor === 'Red'
            ? 'R'
            : (sign as PrimarySign).bLightsColor === 'White'
            ? 'W'
            : 'Y';
          valueToReturn = sign[column] + ' ' + bLightColor;
        }
        break;
      case 'associatedStructure': // Handle 'structure' by mapping to 'associatedStructure'
        if (!isPrimary) {
          valueToReturn = '-';
        } else {
          valueToReturn = (sign as PrimarySign).associatedStructure;
        }
        break;
      default:
        valueToReturn = sign[column];
        break;
    }

    return valueToReturn;
  };

  return (
    <div>
      {!onlyTable && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sign List</h2>
          <Button onClick={handleSignAddition}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Sign
          </Button>
        </div>
      )}
      <div className="border rounded-md">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {SIGN_COLUMNS
                .filter(sc => (shopMode ? !sc.shopOnly || sc.shopOnly === true : !sc.shopOnly))
                .map(sc => (
                  <TableHead
                    key={sc.key}
                    className={(sc.shopOnly || sc.centered) ? 'text-center' : ''}
                  >
                    {sc.title}
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(shopMode && shopSigns ? shopSigns : mptRental.phases[currentPhase].signs)
              .filter(s => s.designation !== '')
              .reduce(
                (
                  acc: (PrimarySign | SecondarySign | ExtendedPrimarySign | ExtendedSecondarySign)[],
                  sign
                ) => {
                  if ('primarySignId' in sign) {
                    const primaryIndex = acc.findIndex(s => s.id === sign.primarySignId);
                    if (primaryIndex !== -1) {
                      let insertIndex = primaryIndex + 1;
                      while (
                        insertIndex < acc.length &&
                        'primarySignId' in acc[insertIndex] &&
                        (acc[insertIndex] as SecondarySign).primarySignId === sign.primarySignId
                      ) {
                        insertIndex++;
                      }
                      acc.splice(insertIndex, 0, sign);
                    } else {
                      acc.push(sign);
                    }
                  } else {
                    acc.push(sign);
                  }
                  return acc;
                },
                []
              )
              .map(sign => (
                <TableRow key={sign.id}>
                  {SIGN_COLUMNS
                    .filter(sc => (shopMode ? !sc.shopOnly || sc.shopOnly === true : !sc.shopOnly))
                    .map((sc, index) => {
                      if (!shopMode && sc.shopOnly) return null;

                      return (
                        <TableCell className={sc.sticky ? 'sticky right-0 bg-white z-10' : ''} key={sc.key}>
                          <div className="flex items-center text-nowrap truncate max-w-50">
                            {Object.hasOwn(sign, 'primarySignId') && index === 0 && (
                              <ChevronRight className="inline h-6 text-muted-foreground" />
                            )}

                            {shopMode && (sc.key === 'inStock' || sc.key === 'order' || sc.key === 'make') ? (
                              <div className="flex items-center">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-8 w-8 text-xs rounded-r-none border-r-0 bg-gray-100 hover:bg-gray-200"
                                  onClick={() =>
                                    adjustShopValue &&
                                    adjustShopValue(sign.id, sc.key as 'inStock' | 'order' | 'make', -1)
                                  }
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  value={(sign as any)[sc.key] || 0}
                                  onChange={e => {
                                    const value = parseInt(e.target.value);
                                    const newValue = isNaN(value) ? 0 : Math.max(0, Math.min(999, value));
                                    if (updateShopTracking) {
                                      updateShopTracking(
                                        sign.id,
                                        sc.key as 'inStock' | 'order' | 'make',
                                        newValue
                                      );
                                    }
                                  }}
                                  className="h-8 rounded-none text-center w-10 min-w-[2.5rem] px-0 text-xs no-spinner"
                                  min={0}
                                  max={999}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-8 w-8 text-xs rounded-l-none border-l-0 bg-gray-100 hover:bg-gray-200"
                                  onClick={() =>
                                    adjustShopValue &&
                                    adjustShopValue(sign.id, sc.key as 'inStock' | 'order' | 'make', 1)
                                  }
                                >
                                  +
                                </Button>
                              </div>
                            ) : sc.key === 'quantity' ? (
                              Object.hasOwn(sign, 'primarySignId') ? (
                                formatColumnValue(sign, 'quantity')
                              ) : (
                                <div className="inline-flex items-center">
                                  <button
                                    type="button"
                                    className="w-7 h-7 flex items-center justify-center border rounded bg-muted text-lg hover:bg-accent"
                                    onClick={() =>
                                      sign.quantity === 0
                                        ? console.log('no')
                                        : handleQuantityChange(sign.id, sign.quantity - 1)
                                    }
                                    aria-label="Decrease quantity"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min={0}
                                    max={999}
                                    value={sign.quantity}
                                    onChange={e => {
                                      const value = parseInt(e.target.value);
                                      const newValue = isNaN(value) ? 0 : Math.max(0, Math.min(999, value));
                                      handleQuantityChange(sign.id, safeNumber(newValue));
                                    }}
                                    className="no-spinner w-10 px-0 py-1 border rounded text-center bg-background !border-none"
                                    style={{ width: 40, height: 28 }}
                                  />
                                  <button
                                    type="button"
                                    className="w-7 h-7 flex items-center justify-center border rounded bg-muted text-lg hover:bg-accent"
                                    onClick={() => handleQuantityChange(sign.id, sign.quantity + 1)}
                                    aria-label="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>
                              )
                            ) : sc.key === 'actions' ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild className="flex items-center justify-center">
                                  <Button variant="ghost" size="sm" className="!p-[2px]">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setLocalSign(sign);
                                      setOpen(true);
                                      setMode('edit');
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  {Object.hasOwn(sign, 'associatedStructure') && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const defaultSecondary: SecondarySign = {
                                          id: generateUniqueId(),
                                          primarySignId: sign.id,
                                          designation: '',
                                          width: 0,
                                          height: 0,
                                          quantity: sign.quantity,
                                          sheeting: 'HI',
                                          isCustom: false,
                                          description: '',
                                          substrate: 'Plastic',
                                        };
                                        dispatch({
                                          type: 'ADD_MPT_SIGN',
                                          payload: {
                                            phaseNumber: 0,
                                            sign: defaultSecondary,
                                          },
                                        });
                                        setLocalSign(defaultSecondary);
                                        setOpen(true);
                                        setMode('create');
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Secondary Sign
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      deleteAssociatedEquipmentInfo(sign.id);
                                      dispatch({ type: 'DELETE_MPT_SIGN', payload: sign.id });
                                      if (Object.hasOwn(sign, 'associatedStructure')) {
                                        mptRental.phases[currentPhase].signs.forEach(s => {
                                          if ('primarySignId' in s && s.primarySignId === sign.id) {
                                            dispatch({ type: 'DELETE_MPT_SIGN', payload: s.id });
                                          }
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : sc.key === 'description' ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-pointer truncate block">
                                      {formatColumnValue(sign, sc.key as keyof PrimarySign)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{sign.description || 'No description'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              formatColumnValue(sign, sc.key as keyof PrimarySign)
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-4 mt-4">
        {localSign && <DesignationSearcher localSign={localSign} setLocalSign={setLocalSign} />}
        {localSign && <SignEditingSheet open={open} onOpenChange={handleClose} mode={mode} sign={localSign} />}
      </div>
      {!onlyTable && (
        <>
          <div className="flex justify-start">
            <Button
              className="mt-4 border-none p-0 !bg-transparent shadow-none"
              variant="outline"
              onClick={handleSignAddition}
            >
              + Add New Sign
            </Button>
          </div>
          <div className="mt-6 flex justify-end space-y-1 text-sm">
            <div className="text-right">
              <div>Total Signs: {mptRental.phases[currentPhase].signs.length}</div>
              <div className="font-medium">
                Total Square Footage: {squareFootageTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
