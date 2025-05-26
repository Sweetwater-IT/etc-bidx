// PrimarySignItem.tsx
import React, { useState } from "react";
import { PrimarySign, SecondarySign, EquipmentType } from "@/types/MPTEquipment";
import PrimarySignForm from "./primary-sign-form";
import SecondarySignItem from "./secondary-sign-item";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useEstimate } from "@/contexts/EstimateContext";
import { generateUniqueId } from "./generate-stable-id";

interface PrimarySignItemProps {
    primarySign: PrimarySign;
    secondarySigns: SecondarySign[];
    currentPhase: number;
    defaultConfiguring? : boolean
}

const PrimarySignItem = ({
    primarySign,
    secondarySigns,
    currentPhase,
    defaultConfiguring = false
}: PrimarySignItemProps) => {
    const { dispatch, mptRental } = useEstimate();
    const [isConfiguring, setIsConfiguring] = useState(true);

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
            substrate: 'aluminum'
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
                    value: 0 // Set to 0 when deleting
                }
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
                    value: 0 // Set to 0 when deleting
                }
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
                    value: 0 // Set to 0 when deleting
                }
            });
        }
    };

    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
            {isConfiguring ? (
                <PrimarySignForm
                    sign={primarySign}
                    currentPhase={currentPhase}
                    setIsConfiguring={setIsConfiguring}
                    showSubstrate={defaultConfiguring}
                />
            ) : (
                <div className="flex justify-between items-center">
                    <div>
                        <div className="font-medium">
                            {primarySign.designation}{" "}
                            {primarySign.description && `- ${primarySign.description}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {primarySign.width}x{primarySign.height} • Qty: {primarySign.quantity} •
                            B Lights: {primarySign.bLights} • Covers: {primarySign.covers}
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
                    showSubstrate={defaultConfiguring}
                />
            ))}
        </div>
    );
};

export default PrimarySignItem;