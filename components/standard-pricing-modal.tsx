"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { safeNumber } from "@/lib/safe-number";
import { Flagging } from "@/types/TFlagging";
import { DialogClose } from "@/components/ui/dialog";
import { Button } from "./ui/button";

const StandardPricingModal = ({ onClose }) => {
  const { adminData, flagging, dispatch } = useEstimate();
  const [lumpSum, setLumpSum] = useState<number>(0);

  const handleInputChange = (
    field: keyof Flagging,
    value: string | number
  ) => {
    dispatch({
      type: 'UPDATE_FLAGGING',
      payload: {
        key: field,
        value: typeof value === 'string' ? value : Number(value),
      },
    });
  };

  const getPersonLumpSum = (numberPersonnel: number) => {
    if (!flagging || !adminData.county) return 0;
    
    let onePersonLumpSum = safeNumber(flagging?.truckDispatchFee) + 
                           adminData.county.fuel + 
                           adminData.county.insurance;

    const hourlyRate = adminData.rated === 'RATED'
      ? adminData.county.flaggingFringeRate + adminData.county.flaggingBaseRate 
      : adminData.county.flaggingRate;
      
    const dayRate = hourlyRate * 8;
    
    const targetRate = adminData.rated === 'RATED'
      ? (adminData.county.ratedTargetGM / 100) 
      : (adminData.county.nonRatedTargetGM / 100);
      
    onePersonLumpSum += (dayRate / (1 - (targetRate)));

    return onePersonLumpSum * numberPersonnel;
  };

  const getOnePersonOTRate = () => {
    if (!adminData.county) return 0;
    
    const hourlyRate = adminData.rated === 'RATED'
      ? adminData.county.flaggingFringeRate + adminData.county.flaggingBaseRate 
      : adminData.county.flaggingRate;
      
    const overTime = hourlyRate * 1.5;
    
    const overTimeRate = adminData.rated === 'RATED'
      ? (overTime / (1 - 0.4)) 
      : (overTime / (1 - 0.55));
      
    return overTimeRate;
  };

  // Effect to update lump sum when rate or personnel changes
  useEffect(() => {
    if (flagging && adminData.county?.name) {
      let calculatedLumpSum = getPersonLumpSum(flagging?.personnel);

      if (adminData.county.market === 'MOBILIZATION') {
        calculatedLumpSum += (175 * flagging?.personnel);
      }

      setLumpSum(calculatedLumpSum);

      // Update the standardLumpSum in the flagging state
      dispatch({
        type: 'UPDATE_FLAGGING',
        payload: {
          key: 'standardLumpSum',
          value: calculatedLumpSum,
        },
      });
    }
  }, [adminData.rated, flagging?.personnel, adminData.county?.name, dispatch]);

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="col-span-4 sm:col-span-2 md:col-span-1">
        <Label htmlFor="county">County</Label>
        <Input
          id="county"
          value={adminData.county?.name || ""}
          disabled
        />
      </div>
      
      <div className="col-span-4 sm:col-span-2 md:col-span-1">
        <Label htmlFor="branch">Branch</Label>
        <Input
          id="branch"
          value={adminData.county?.branch || ""}
          disabled
        />
      </div>
      
      <div className="col-span-4 sm:col-span-2 md:col-span-1">
        <Label htmlFor="market">Market</Label>
        <Input
          id="market"
          value={adminData.county?.market || ""}
          disabled
        />
      </div>
      
      <div className="col-span-4 sm:col-span-2 md:col-span-1">
        <Label htmlFor="base-rate">Base Rate</Label>
        <Input
          id="base-rate"
          value={adminData.county?.flaggingBaseRate || ""}
          disabled
        />
      </div>
      
      <div className="col-span-4 sm:col-span-2 md:col-span-1">
        <Label htmlFor="fringe-rate">Fringe Rate</Label>
        <Input
          id="fringe-rate"
          value={adminData.county?.flaggingFringeRate || ""}
          disabled
        />
      </div>
      
      <div className="col-span-4 sm:col-span-2 md:col-span-1">
        <Label htmlFor="branch-rate">Branch Rate</Label>
        <Input
          id="branch-rate"
          value={adminData.county?.flaggingRate || ""}
          disabled
        />
      </div>
      
      <div className="col-span-4 sm:col-span-2">
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
      
      <div className="col-span-4 sm:col-span-2">
        <Label htmlFor="personnel">Personnel</Label>
        <div className="flex items-center">
          <User className="mr-2 h-4 w-4" />
          <Input
            id="personnel"
            type="number"
            min={0}
            value={safeNumber(flagging?.personnel) || ""}
            onChange={(e) => handleInputChange('personnel', safeNumber(Number(e.target.value)))}
            placeholder="Number of personnel"
          />
        </div>
      </div>
      
      <div className="col-span-4 sm:col-span-2 md:col-span-1">
        <Label htmlFor="one-person-hourly-rate">1 Person Hourly Rate</Label>
        <Input
          id="one-person-hourly-rate"
          value={safeNumber(getPersonLumpSum(1) / 8).toFixed(2)}
          disabled
        />
      </div>
      
      <div className="col-span-4 sm:col-span-2 md:col-span-1">
        <Label htmlFor="one-person-ot-rate">1 Person Over Time Rate</Label>
        <Input
          id="one-person-ot-rate"
          value={getOnePersonOTRate().toFixed(2)}
          disabled
        />
      </div>
      
      <div className="col-span-4 sm:col-span-2 md:col-span-2">
        <Label htmlFor="hourly-total">Hourly Total</Label>
        <Input
          id="hourly-total"
          value={safeNumber(getPersonLumpSum(flagging?.personnel ?? 0)).toFixed(2)}
          disabled
        />
      </div>
      
      <div className="col-span-4 sm:col-span-2">
        <Label htmlFor="one-person-lump-sum">1 Person Lump Sum</Label>
        <Input
          id="one-person-lump-sum"
          value={safeNumber(getPersonLumpSum(1)).toFixed(2)}
          disabled
        />
      </div>
      
      <div className="col-span-4 sm:col-span-2">
        <Label htmlFor="lump-sum">Lump Sum</Label>
        <Input
          id="lump-sum"
          value={lumpSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          disabled
        />
      </div>
      
      {adminData.county?.market === 'MOBILIZATION' && flagging?.personnel && flagging.personnel > 0 && (
        <div className="col-span-4">
              Mobilization Fee added to Lump Sum, not reflected in hourly pricing. 
              Mobilization fee added: ${(flagging.personnel * 175).toFixed(2)}
        </div>
      )}
      
      <div className="col-span-4 flex justify-end space-x-2 mt-4">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={onClose}>Save</Button>
      </div>
    </div>
  );
};

export default StandardPricingModal;