import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, MoreVertical, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { EquipmentType, labelMapping, lightAndDrumList, standardEquipmentList } from "@/types/MPTEquipment";
import { useEstimate } from "@/contexts/EstimateContext";
import { getAssociatedSignEquipment } from "@/lib/mptRentalHelperFunctions";
import { safeNumber } from "@/lib/safe-number";

const EquipmentTotalsAccordion = () => {

  const { mptRental, dispatch } = useEstimate();

  const [editingMode, setEditingMode] = useState<boolean>(false);

  const handleEditClick = () => {
    setEditingMode(!editingMode)
  };

  const handleDecrement = (item: EquipmentType) => {
    const currentQuantity = mptRental.phases[0].standardEquipment[item].quantity;
    
    // For sign-related equipment, check if we can decrement below minimum required
    if (item === 'fourFootTypeIII' || item === 'hStand' || item === 'post' || item === 'covers' || item === 'BLights') {
      const equipTotals = getAssociatedSignEquipment(mptRental.phases[0]);
      const minRequired = equipTotals[item] || 0;
      
      if (currentQuantity <= minRequired) {
        return;
      }
    }
  
    // Proceed with decrement
    dispatch({
      type: 'ADD_MPT_ITEM_NOT_SIGN',
      payload: {
        phaseNumber: 0,
        equipmentType: item,
        equipmentProperty: 'quantity',
        value: Math.max(0, currentQuantity - 1)
      }
    });
  };

  const handleQuantityChange = (item : EquipmentType, quantity: number) => {

    if (item === 'fourFootTypeIII' || item === 'hStand' || item === 'post' || item === 'covers' || item === 'BLights') {
      const equipTotals = getAssociatedSignEquipment(mptRental.phases[0]);
      const minRequired = equipTotals[item] || 0;
      
      if (quantity < minRequired) {
        return;
      }
    }

    dispatch({
      type: 'ADD_MPT_ITEM_NOT_SIGN',
      payload: {
        phaseNumber: 0,
        equipmentType: item,
        equipmentProperty: 'quantity',
        value: quantity
      }
    })
  }

  const getMin = (item: EquipmentType): number => {
    if (item === 'fourFootTypeIII' || item === 'hStand' || item === 'post' || item === 'covers' || item === 'BLights') {
      const equipTotals = getAssociatedSignEquipment(mptRental.phases[0]);
      return equipTotals[item] || 0;
    } 
    return 0;
  };

  return (
    <Card className="p-4">
      <Accordion defaultValue="equipment-totals" type="single" collapsible>
        <AccordionItem value="equipment-totals">
          <AccordionTrigger className="py-0">
            <div className="flex items-center justify-between w-full pr-4">
              <h3 className="font-semibold">Equipment Totals Summary</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                className="flex ml-auto items-center justify-end"
                onClick={(e) => e.stopPropagation()} // Prevent accordion toggle
              >
                <Button variant="ghost" size="sm" className="!p-[2px]">
                  <MoreHorizontal className="ml-auto h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" onClick={handleEditClick}>
                  <Pencil className="h-4 w-4 mr-2" />
                  {!editingMode ? 'Edit'  : 'Exit editing'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="space-y-2 text-sm mt-4">
              {[...standardEquipmentList, ...lightAndDrumList].map(item => (
                <div key={item} className="flex justify-between">
                  <span className="text-muted-foreground">{labelMapping[item]}</span>
                  {editingMode ? <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Qty:
                    </span>
                    <div className="inline-flex items-center">
                      <button
                        type="button"
                        className="w-7 h-7 flex items-center justify-center border rounded bg-muted text-lg hover:bg-accent "
                        onClick={() => handleDecrement(item)}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={getMin(item)}
                        value={mptRental.phases[0].standardEquipment[item]?.quantity ?? 0}
                        onChange={(e) => {
                          handleQuantityChange(item, safeNumber(parseInt(e.target.value)));
                        }}
                        className="no-spinner w-12 px-2 py-1 border rounded text-center bg-background !border-none"
                        style={{ width: 48, height: 28 }}
                      />
                      <button
                        type="button"
                        className="w-7 h-7 flex items-center justify-center border rounded bg-muted text-lg hover:bg-accent"
                        onClick={() => {
                          dispatch({
                            type: 'ADD_MPT_ITEM_NOT_SIGN',
                            payload: {
                              phaseNumber: 0,
                              equipmentType: item,
                              equipmentProperty: 'quantity',
                              value: mptRental.phases[0].standardEquipment[item].quantity + 1
                            }
                          })
                        }}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                    : <span>{mptRental.phases[0].standardEquipment[item].quantity}</span>}
                </div>
              )
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default EquipmentTotalsAccordion;