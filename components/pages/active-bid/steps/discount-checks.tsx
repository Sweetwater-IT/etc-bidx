"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { EquipmentType, SheetingType, MPTRentalEstimating, equipmentList } from "@/types/MPTEquipment";
import { getWeightedAverageDays } from "@/lib/mptRentalHelperFunctions";
import { safeNumber } from "@/lib/safe-number";

interface RowObject {
  item: EquipmentType | SheetingType;
  inputDiscountRate: number;
  swingDiscountRate: number;
  floorDiscountRate: number;
  maxDiscountRate: number;
}

// Define item names
const itemNames: (EquipmentType | SheetingType)[] = [
  'fourFootTypeIII',
  'sixFootWings',
  // 'sixFootTypeIII',
  'hStand',
  'post',
  'sandbag',
  'covers',
  'metalStands',
  'HI',
  'DG',
  'Special',
];

const returnMaxDiscountRate = (equipment: EquipmentType | SheetingType, mptRental: MPTRentalEstimating) => {
  const { price, usefulLife } = mptRental.staticEquipmentInfo[equipment];
  let days = 1;
  if (equipment === 'HI' || equipment === 'DG' || equipment === 'Special') {
    days = getWeightedAverageDays(mptRental)[equipment];
    const dailyDepreciation = price / (usefulLife * 365);
    return 1 - (dailyDepreciation * days / price);
  }
  else { days = getWeightedAverageDays(mptRental)[equipment]; }
  const dailyDepreciation = price / (usefulLife * 365);
  return 1 - (dailyDepreciation * days / price);
};

interface Props {
  editableDiscounts?: boolean;
}

const DiscountChecks = ({ editableDiscounts = true }: Props) => {
  const { mptRental, dispatch } = useEstimate();
  const [rows, setRows] = React.useState<RowObject[]>([]);

  useEffect(() => {
    setRows(itemNames.map((item) => {
      if (!mptRental) return { item, inputDiscountRate: 0, floorDiscountRate: 0, swingDiscountRate: 0, maxDiscountRate: 0 };
      const inputDiscountRate = mptRental?.staticEquipmentInfo[item]?.discountRate || 0;
      const maxDiscountRate = returnMaxDiscountRate(item, mptRental) * 100;
      const floorDiscountRate = safeNumber(getFloorDiscountRate(item, false)) * 100;
      const swingDiscountRate = safeNumber(getFloorDiscountRate(item, true)) * 100;

      return {
        item,
        inputDiscountRate,
        floorDiscountRate,
        swingDiscountRate,
        maxDiscountRate,
      };
    }));
  }, [mptRental]);

  const handleDiscountRateChange = (
    value: number,
    itemType: EquipmentType | SheetingType
  ) => {
    dispatch({
      type: 'UPDATE_STATIC_EQUIPMENT_INFO',
      payload: { type: itemType, property: 'discountRate', value },
    });
  };

  const handleClearDiscountRates = () => {
    rows.forEach(row => {
      handleDiscountRateChange(Number(0), row.item);
    });
  };

  const setDiscounts = (discountType: 'breakeven' | 'target' | 'swing') => {
    if (!mptRental) return;
    rows.forEach(row => {
      switch (discountType) {
        case 'breakeven':
          handleDiscountRateChange(
            Number((Math.floor(returnMaxDiscountRate(row.item, mptRental) * 100 * 100) / 100).toFixed(2)),
            row.item
          );
          break;
        case 'target':
          handleDiscountRateChange(Number(((safeNumber(getFloorDiscountRate(row.item, false)) * 100 * 100) / 100).toFixed(2)), row.item);
          break;
        case 'swing':
          handleDiscountRateChange(Number(((safeNumber(getFloorDiscountRate(row.item, true)) * 100 * 100) / 100).toFixed(2)), row.item);
          break;
        default:
          break;
      }
    });
  };

  const getFloorDiscountRate = (item: EquipmentType | SheetingType, isSwing: boolean) => {
    if (!mptRental) return;
    if(item === 'Special'){
      return 0;
    }
    if(item === 'sandbag' && isSwing){
      return 0;
    }
    const equipmentPiece = mptRental?.staticEquipmentInfo[item];
    const daysToRecover = isSwing ? (equipmentPiece.paybackPeriod - 1) * 365 : equipmentPiece.paybackPeriod * 365;
    const dailyPrice = equipmentPiece.price / daysToRecover;
    const revenuePerUnit = dailyPrice * getWeightedAverageDays(mptRental)[item];
    return 1 - (revenuePerUnit / equipmentPiece.price);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">MPT Discounting</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClearDiscountRates}>Clear</Button>
          <Button variant="default" size="sm" onClick={() => setDiscounts('swing')}>Swing</Button>
          <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setDiscounts('target')}>Target</Button>
          <Button variant="destructive" size="sm" onClick={() => setDiscounts('breakeven')}>Breakeven</Button>
        </div>
      </div>
      <div className="rounded-lg border">
        <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
          <div className="font-medium">Item</div>
          <div className="font-medium">Input Discount Rate</div>
          <div className="font-medium">Swing</div>
          <div className="font-medium">Target</div>
          <div className="font-medium">Breakeven</div>
        </div>
        <div className="divide-y">
          {rows.map((row) => {
            const label = equipmentList.find(equipment => equipment.key === row.item)?.label || row.item;
            const exceedsMax = row.inputDiscountRate > row.maxDiscountRate;
            
            return (
              <div 
                key={row.item} 
                className={`grid grid-cols-5 gap-4 p-2 ${exceedsMax ? "bg-red-100" : ""}`}
              >
                <div className="flex items-center">{label}</div>
                <div>
                  <Input
                    type="number"
                    className="h-9"
                    value={safeNumber(mptRental?.staticEquipmentInfo[row.item]?.discountRate) || ""}
                    onChange={(e) => handleDiscountRateChange(safeNumber(Number(e.target.value)), row.item)}
                    disabled={!editableDiscounts}
                  />
                </div>
                <div className="flex items-center">
                  {`${row.swingDiscountRate.toFixed(2)}%`}
                </div>
                <div className="flex items-center">
                  {`${row.floorDiscountRate.toFixed(2)}%`}
                </div>
                <div className="flex items-center">
                  {row.maxDiscountRate === -1
                    ? '-'
                    : `${row.maxDiscountRate.toFixed(2)}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiscountChecks;