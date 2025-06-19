import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { getNonRatedHoursPerPhase, getRatedHoursPerPhase, getTotalTripsPerPhase } from "@/lib/mptRentalHelperFunctions";
import { safeNumber } from "@/lib/safe-number";
import { Pencil, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Phase } from "@/types/MPTEquipment";

interface TripAndLaborSummaryAccordionProps {
  currentPhase: number;
}

const TripAndLaborSummaryAccordion = ({ currentPhase }: TripAndLaborSummaryAccordionProps) => {
  const [value, setValue] = useState<string[]>([]);
  const { mptRental, adminData, dispatch } = useEstimate();
  const [editing, setEditing] = useState(false);
  const [tempPersonnel, setTempPersonnel] = useState<number>();
  const [tempTrucks, setTempTrucks] = useState<number>();

  const getPhaseValue = (key: keyof Phase | 'trips' | 'nonRatedHours' | 'ratedHours'): number => {
    if(key === 'customLightAndDrumItems' || key === 'signs' || 
    key === 'standardEquipment' || key === 'name' || key === 'endDate' || key === 'startDate'){
      return 0;
    }
    if (!mptRental || !mptRental.phases || !mptRental.phases[currentPhase]) {
      return 0;
    }
    if (key === 'trips') {
      return getTotalTripsPerPhase(mptRental.phases[currentPhase])
    }
    if (key === 'ratedHours'){
      return getRatedHoursPerPhase(mptRental.phases[currentPhase])
    }
    if (key === 'nonRatedHours'){
      return getNonRatedHoursPerPhase(adminData, mptRental.phases[currentPhase])
    }
    return mptRental.phases[currentPhase][key] || 0;
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || Number.isNaN(value)) {
      return '';
    }
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Memoize the current phase data
  const currentPhaseData = useMemo(() => {
    return mptRental?.phases?.[currentPhase] || {
      days: 0,
      personnel: 0,
      numberTrucks: 0,
      additionalRatedHours: 0,
      additionalNonRatedHours: 0,
      maintenanceTrips: 0
    };
  }, [mptRental?.phases, currentPhase]);

  // Memoize cost calculations
  const { mobilizationCost, fuelCost, truckAndFuelCost } = useMemo(() => {
    if (mptRental.phases.length === 0) {
      return {
        mobilizationCost: 0,
        fuelCost: 0,
        truckAndFuelCost: 0
      }
    }
    const mobilization = (currentPhaseData.numberTrucks || 0) *
      getTotalTripsPerPhase(currentPhaseData) *
      (mptRental?.dispatchFee || 0);

    const fuel = (((currentPhaseData.numberTrucks || 0) *
      getTotalTripsPerPhase(currentPhaseData) * 2 *
      (adminData?.owMileage ?? 0)) /
      (mptRental?.mpgPerTruck || 1)) *
      (adminData?.fuelCostPerGallon ?? 0);

    return {
      mobilizationCost: mobilization,
      fuelCost: fuel,
      truckAndFuelCost: mobilization + fuel
    };
  }, [
    currentPhaseData,
    mptRental?.dispatchFee,
    mptRental?.mpgPerTruck,
    adminData?.owMileage,
    adminData?.fuelCostPerGallon
  ]);

  return (
    <Card className="p-4">
      <Accordion type="multiple" value={value} onValueChange={setValue}>
        <AccordionItem value="item-1">
          <AccordionTrigger className="py-0">
            <h3 className="font-semibold">Trip and Labor Summary - Phase {currentPhase + 1}</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm mt-4">
              {editing ? <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 block ml-auto p-0"
                onClick={() => {
                  dispatch({ type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR', payload: {key: 'personnel', value: tempPersonnel || 0, phase: currentPhase}})
                  dispatch({ type: 'UPDATE_MPT_PHASE_TRIP_AND_LABOR', payload: {key: 'numberTrucks', value: tempTrucks || 0, phase: currentPhase}})
                  setEditing(false)
                }}
              >
                <Save className="h-4 w-4" />
              </Button> : <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 block ml-auto p-0"
                onClick={() => {
                  setEditing(true)
                  setTempPersonnel(getPhaseValue('personnel'))
                  setTempTrucks(getPhaseValue('numberTrucks'))
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of Days:</span>
                <span>{safeNumber(getPhaseValue("days"))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Number of Personnel:</span>
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-20 h-8 rounded border px-2"
                      value={tempPersonnel}
                      onChange={e => setTempPersonnel(safeNumber(Number(e.target.value)))}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{safeNumber(getPhaseValue("personnel"))}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of Trucks:</span>
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-20 h-8 rounded border px-2"
                      value={tempTrucks}
                      onChange={e => setTempTrucks(safeNumber(Number(e.target.value)))}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{safeNumber(getPhaseValue('numberTrucks'))}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Trips:</span>
                <span>{safeNumber(getPhaseValue("trips") + (getPhaseValue("maintenanceTrips") * 2))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Rated Hours:</span>
                <span>{safeNumber(getPhaseValue("ratedHours") + getPhaseValue("additionalRatedHours")).toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Non-Rated Hours:</span>
                <span>{safeNumber(getPhaseValue("nonRatedHours") + getPhaseValue("additionalNonRatedHours")).toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mobilization: </span>
                <span>{formatCurrency(mobilizationCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel Cost:</span>
                <span>{formatCurrency(fuelCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Truck & Fuel Cost:</span>
                <span>{formatCurrency(truckAndFuelCost)}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default TripAndLaborSummaryAccordion;