// PrimarySignItem.tsx
import React, { useState } from "react";
import {
  PrimarySign,
  SecondarySign,
  EquipmentType,
} from "@/types/MPTEquipment";
import PrimarySignForm from "./primary-sign-form";
import SecondarySignItem from "./secondary-sign-item";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useEstimate } from "@/contexts/EstimateContext";
import { generateUniqueId } from "./generate-stable-id";
import "./no-spinner.css";
import Image from "next/image";

interface PrimarySignItemProps {
  primarySign: PrimarySign;
  secondarySigns: SecondarySign[];
  currentPhase: number;
  isTakeoff?: boolean;
}

const PrimarySignItem = ({
  primarySign,
  secondarySigns,
  currentPhase,
  isTakeoff = false,
}: PrimarySignItemProps) => {
  const { dispatch, mptRental } = useEstimate();
  const [isConfiguring, setIsConfiguring] = useState(true);
  // Local image preview state
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleEditSign = () => {
    setIsConfiguring(true);
  };

  const handleAddSecondarySign = (primarySignId: string) => {
    // Create a new secondary sign with empty designation
    const newSecondarySign: SecondarySign = {
      id: generateUniqueId(),
      primarySignId: primarySignId,
      designation: "", // Empty designation
      width: 0,
      height: 0,
      quantity: primarySign.quantity, // Only inherit quantity
      sheeting: "HI", // Default sheeting
      isCustom: false,
      description: "",
      substrate: "aluminum",
    };

    // Add the new secondary sign to the context
    dispatch({
      type: "ADD_MPT_SIGN",
      payload: {
        phaseNumber: currentPhase,
        sign: newSecondarySign,
      },
    });
  };

  const handleSignDelete = (id: string) => {
    // Delete the primary sign and all associated secondary signs
    // Update equipment quantities as necessary
    // First, delete all secondary signs
    secondarySigns.forEach((secondarySign) => {
      dispatch({
        type: "DELETE_MPT_SIGN",
        payload: secondarySign.id,
      });
    });

    // Then delete the primary sign
    dispatch({
      type: "DELETE_MPT_SIGN",
      payload: id,
    });

    // Update equipment based on removed sign
    updateEquipmentQuantities(primarySign, "delete");
  };

  // Helper to update equipment quantities when deleting signs
  const updateEquipmentQuantities = (sign: PrimarySign, action: "delete") => {
    // Update associated structure quantity
    if (sign.associatedStructure !== "none") {
      dispatch({
        type: "ADD_MPT_ITEM_NOT_SIGN",
        payload: {
          phaseNumber: currentPhase,
          equipmentType: sign.associatedStructure as EquipmentType,
          equipmentProperty: "quantity",
          value: 0, // Set to 0 when deleting
        },
      });
    }

    // Update BLights
    if (sign.bLights > 0) {
      dispatch({
        type: "ADD_MPT_ITEM_NOT_SIGN",
        payload: {
          phaseNumber: currentPhase,
          equipmentType: "BLights" as EquipmentType,
          equipmentProperty: "quantity",
          value: 0, // Set to 0 when deleting
        },
      });
    }

    // Update covers
    if (sign.covers > 0) {
      dispatch({
        type: "ADD_MPT_ITEM_NOT_SIGN",
        payload: {
          phaseNumber: currentPhase,
          equipmentType: "covers" as EquipmentType,
          equipmentProperty: "quantity",
          value: 0, // Set to 0 when deleting
        },
      });
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      {isConfiguring ? (
        // Edit mode: input de upload, mostrar preview se imagePreview existir
        <>
          <PrimarySignForm
            sign={primarySign}
            currentPhase={currentPhase}
            setIsConfiguring={setIsConfiguring}
            isTakeoff={isTakeoff}
          />
        </>
      ) : (
        <div className="flex justify-between items-center">
          <div className="w-full flex items-start gap-3">
            {/* Miniatura quadrada na lista, só mostra se salvo */}
            {imagePreview && (
              <div className="w-20 h-20 flex items-center justify-center rounded bg-gray-50 overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  className="object-cover w-full h-full"
                  width={48}
                  height={48}
                />
              </div>
            )}
            <div>
              <div className="font-medium">
                {primarySign.designation}{" "}
                {primarySign.description && `- ${primarySign.description}`}
              </div>
              <div className="text-sm text-muted-foreground">
                {primarySign.width}x{primarySign.height} • B Lights:{" "}
                {primarySign.bLights} • Covers: {primarySign.covers}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Qty:
                </span>
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    className="w-7 h-7 flex items-center justify-center border rounded bg-muted text-lg hover:bg-accent "
                    onClick={() => {
                      const value = Math.max(1, primarySign.quantity - 1);
                      dispatch({
                        type: "UPDATE_MPT_SIGN",
                        payload: {
                          phase: currentPhase,
                          signId: primarySign.id,
                          key: "quantity",
                          value,
                        },
                      });
                    }}
                    aria-label="Diminuir quantidade"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={primarySign.quantity}
                    onChange={(e) => {
                      const value = Math.max(1, Number(e.target.value));
                      dispatch({
                        type: "UPDATE_MPT_SIGN",
                        payload: {
                          phase: currentPhase,
                          signId: primarySign.id,
                          key: "quantity",
                          value,
                        },
                      });
                    }}
                    className="no-spinner w-12 px-2 py-1 border rounded text-center bg-background !border-none"
                    style={{ width: 48, height: 28 }}
                  />
                  <button
                    type="button"
                    className="w-7 h-7 flex items-center justify-center border rounded bg-muted text-lg hover:bg-accent"
                    onClick={() => {
                      const value = primarySign.quantity + 1;
                      dispatch({
                        type: "UPDATE_MPT_SIGN",
                        payload: {
                          phase: currentPhase,
                          signId: primarySign.id,
                          key: "quantity",
                          value,
                        },
                      });
                    }}
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddSecondarySign(primarySign.id)}
            >
              Add Secondary
            </Button>
            <Button variant="ghost" size="sm" onClick={handleEditSign}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSignDelete(primarySign.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Secondary Signs */}
      {secondarySigns.map((secondarySign) => (
        <SecondarySignItem
          key={secondarySign.id}
          secondarySign={secondarySign}
          primarySign={primarySign}
          currentPhase={currentPhase}
          isTakeoff={isTakeoff}
        />
      ))}
    </div>
  );
};

export default PrimarySignItem;
