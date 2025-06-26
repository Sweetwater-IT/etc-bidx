import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { DynamicEquipmentInfo, EquipmentType, PrimarySign, SecondarySign } from "@/types/MPTEquipment";
import { useEstimate } from "@/contexts/EstimateContext";
import { sortSignsBySecondary } from "@/lib/sortSignsBySecondary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAssociatedSignEquipment } from "@/lib/mptRentalHelperFunctions";
import { safeNumber } from "@/lib/safe-number";

interface SignSummaryAccordionProps {
    currentPhase: number;
}

const standardEquipmentList: EquipmentType[] = [
    "fourFootTypeIII",
    "hStand",
    "post",
    "sixFootWings",
    "metalStands",
    "covers",
    "sandbag",
    'HIVP',
    'TypeXIVP',
    'BLights',
    'ACLights',
    'sharps'
];

const labelMapping: Record<string, string> = {
    fourFootTypeIII: "4' Type III",
    hStand: "H Stand",
    post: "Post",
    sandbag: "Sandbags",
    sixFootWings: "Six Foot Wings",
    metalStands: "Metal Stands",
    covers: "Covers",
    HIVP: "HI Vertical Panels",
    TypeXIVP: "Type XI Vertical Panels",
    BLights: "B-Lights",
    ACLights: "AC Lights",
    sharps: "Sharps"
};

const formatLabel = (key: string) => {
    return labelMapping[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
};


const SignOrderSummary = ({ currentPhase }: SignSummaryAccordionProps) => {
    const { mptRental, dispatch } = useEstimate();
    const [value, setValue] = useState<string[]>(['item-1']);

    const signs: (PrimarySign | SecondarySign)[] =
        mptRental.phases &&
            mptRental.phases.length > 0 &&
            mptRental.phases[currentPhase].signs
            ? sortSignsBySecondary(mptRental.phases[currentPhase].signs)
            : [];

    // Function to display associated structure in a readable format
    const formatStructure = (structure: string): string => {
        switch (structure) {
            case 'fourFootTypeIII': return '4\' Type III';
            case 'hStand': return 'H Stand';
            case 'post': return 'Post';
            case 'none': return 'None';
            default: return structure;
        }
    };

    const handleStandardInputChange = (
        value: number,
        equipmentKey: EquipmentType,
        property: keyof DynamicEquipmentInfo
    ) => {
        dispatch({
            type: 'ADD_MPT_ITEM_NOT_SIGN',
            payload: {
                phaseNumber: currentPhase,
                equipmentType: equipmentKey,
                equipmentProperty: property,
                value: safeNumber(value)
            },
        });
    };


    const getMinQuantity = (equipmentKey: EquipmentType): number | undefined => {
        if (!mptRental?.phases || !mptRental.phases[currentPhase]) return undefined;

        const associatedEquipment = getAssociatedSignEquipment(mptRental.phases[currentPhase]);

        switch (equipmentKey) {
            case 'covers':
                return associatedEquipment.covers;
            case 'fourFootTypeIII':
                return associatedEquipment.fourFootTypeIII;
            case 'hStand':
                return associatedEquipment.hStand;
            case 'post':
                return associatedEquipment.post;
            case 'BLights':
                return associatedEquipment.BLights;
            default:
                return 0;
        }
    };

    return (
        <Card className="p-4">
            <Accordion type="multiple" value={value} onValueChange={setValue}>
                <AccordionItem value="item-1">
                    <AccordionTrigger className="py-0">
                        <h3 className="font-semibold">Equipment Summary</h3>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-3 text-sm mt-4">
                            {standardEquipmentList.map((equipmentKey) => (
                                equipmentKey === 'sandbag' ? (
                                    <div key={equipmentKey} className="font-medium flex justify-between items-center">
                                        <div className="font-medium mb-2">{formatLabel(equipmentKey)}</div>
                                        <div className="text-xs font-medium text-muted-foreground">Qty: {mptRental.phases[0].standardEquipment.sandbag.quantity}</div>
                                    </div>
                                ) : (
                                    <div key={equipmentKey} className="font-medium justify-between flex items-center gap-x-2">
                                        <div className="font-medium">{formatLabel(equipmentKey)}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                Qty:
                                            </span>
                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    className="w-7 h-7 flex items-center justify-center border rounded bg-muted text-lg hover:bg-accent "
                                                    onClick={() => {
                                                        const value = Math.max(1, mptRental.phases[0].standardEquipment[equipmentKey].quantity - 1);
                                                        if (value < getMinQuantity(equipmentKey)!) return;
                                                        handleStandardInputChange(value, equipmentKey, 'quantity')
                                                    }}
                                                    aria-label="Diminuir quantidade"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min={getMinQuantity(equipmentKey)}
                                                    value={mptRental.phases[0].standardEquipment[equipmentKey].quantity}
                                                    onChange={(e) => {
                                                        const value = Math.max(1, Number(e.target.value));
                                                        handleStandardInputChange(value, equipmentKey, 'quantity')
                                                    }}
                                                    className="no-spinner w-12 px-2 py-1 border rounded text-center bg-background !border-none"
                                                    style={{ width: 48, height: 28 }}
                                                />
                                                <button
                                                    type="button"
                                                    className="w-7 h-7 flex items-center justify-center border rounded bg-muted text-lg hover:bg-accent"
                                                    onClick={() => {
                                                        const value = mptRental.phases[0].standardEquipment[equipmentKey].quantity + 1;
                                                        handleStandardInputChange(value, equipmentKey, 'quantity')
                                                    }}
                                                    aria-label="Aumentar quantidade"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ))}
                            {/* {signs.length === 0 ? (
                                <div className="text-muted-foreground text-left py-0">
                                    No signs added yet
                                </div>
                            ) : (
                                signs.map((sign) => (
                                    <div key={sign.id} className={`space-y-1 ${Object.hasOwn(sign, 'primarySignId') ? 'ml-4' : ''}`}>
                                        <div className="font-medium">
                                            {sign.designation}
                                            {sign.description && ` - ${sign.description}`}
                                        </div>
                                        <div className="text-muted-foreground text-xs space-x-2">
                                            {sign.width && sign.height && (
                                                <span>{sign.width} x {sign.height}</span>
                                            )}
                                            {sign.sheeting && <span>• {sign.sheeting}</span>}
                                            {sign.quantity && <span>• Qty: {sign.quantity}</span>}
                                            {"associatedStructure" in sign && sign.associatedStructure !== "none" && (
                                                <span>• Structure: {formatStructure(sign.associatedStructure)}</span>
                                            )}
                                            {"bLights" in sign && sign.bLights > 0 && (
                                                <span>• B Lights: {sign.bLights}</span>
                                            )}
                                            {"covers" in sign && sign.covers > 0 && (
                                                <span>• Covers: {sign.covers}</span>
                                            )}
                                            {"primarySignId" in sign && (
                                                <span className="italic">• Secondary Sign</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )} */}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
};

export default SignOrderSummary;