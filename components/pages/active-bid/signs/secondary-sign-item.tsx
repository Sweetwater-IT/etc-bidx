// secondary-sign-item.tsx
import React, { useState } from "react";
import { PrimarySign, SecondarySign } from "@/types/MPTEquipment";
import SecondarySignForm from "./secondary-sign-form";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useEstimate } from "@/contexts/EstimateContext";

interface SecondarySignItemProps {
  secondarySign: SecondarySign;
  primarySign: PrimarySign;
  currentPhase: number;
  showSubstrate?: boolean
}

const SecondarySignItem = ({ 
  secondarySign, 
  primarySign,
  currentPhase,
  showSubstrate = false
}: SecondarySignItemProps) => {
  const { dispatch } = useEstimate();
  const [isConfiguring, setIsConfiguring] = useState(true);

  const handleEditSign = () => {
    setIsConfiguring(true);
  };

  const handleSignDelete = (id: string) => {
    dispatch({
      type: "DELETE_MPT_SIGN",
      payload: id,
    });
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-card text-card-foreground shadow-sm p-4 mt-4 ml-8">
      {isConfiguring ? (
        <SecondarySignForm 
          sign={secondarySign} 
          primarySign={primarySign}
          currentPhase={currentPhase}
          setIsConfiguring={setIsConfiguring}
          showSubstrate={showSubstrate}
        />
      ) : (
        <div className="flex justify-between items-center">
          <div>
            <div className="font-medium">
              {secondarySign.designation}{" "}
              {secondarySign.description && `- ${secondarySign.description}`}
              {" (Secondary)"}
            </div>
            <div className="text-sm text-muted-foreground">
              Secondary sign associated with primary sign: {primarySign.designation || "Unknown"}
            </div>
            <div className="text-sm text-muted-foreground">
              {secondarySign.width}x{secondarySign.height} • Qty: {secondarySign.quantity}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditSign}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSignDelete(secondarySign.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecondarySignItem;