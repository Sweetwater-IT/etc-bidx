// SignList.tsx
import React, { useState, useEffect } from "react";
import { useEstimate } from "@/contexts/EstimateContext";
import { PrimarySign, SecondarySign, EquipmentType } from "@/types/MPTEquipment";
import PrimarySignItem from "./primary-sign-item";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SignListProps {
  currentPhase: number;
}

const SignList = ({ currentPhase }: SignListProps) => {
  const { mptRental } = useEstimate();
  const [signs, setSigns] = useState<(PrimarySign | SecondarySign)[]>([]);

  // Safely get the signs array with error handling
  const getSafeSignsArray = () => {
    try {
      if (!mptRental) return [];
      if (!mptRental.phases) return [];
      if (mptRental.phases.length === 0) return [];
      if (!mptRental.phases[currentPhase]) return [];
      if (!mptRental.phases[currentPhase].signs) return [];
      return mptRental.phases[currentPhase].signs || [];
    } catch (error) {
      console.error("Error getting signs array:", error);
      return [];
    }
  };

  // Use useEffect to keep signs state in sync with mptRental
  useEffect(() => {
    const currentSigns = getSafeSignsArray();
    setSigns(currentSigns);
  }, [getSafeSignsArray, mptRental, currentPhase]);
  
  // Filter to primary signs only
  const primarySigns = signs.filter(
    (sign): sign is PrimarySign => !("primarySignId" in sign)
  );

  // Get secondary signs for a given primary sign
  const getSecondarySignsForPrimary = (primaryId: string) => {
    return signs.filter(
      (sign): sign is SecondarySign => 
        "primarySignId" in sign && sign.primarySignId === primaryId
    );
  };

  return (
    <div className="space-y-6">
      {primarySigns.map((sign) => (
        <PrimarySignItem 
          key={sign.id}
          primarySign={sign}
          secondarySigns={getSecondarySignsForPrimary(sign.id)}
          currentPhase={currentPhase}
        />
      ))}
    </div>
  );
};

export default SignList;