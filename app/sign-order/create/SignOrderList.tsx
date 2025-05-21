"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import AddSignControl from "@/components/pages/active-bid/signs/add-sign-control";
import SignList from "@/components/pages/active-bid/signs/sign-list";
import { useEstimate } from "@/contexts/EstimateContext";
import { generateUniqueId } from "@/components/pages/active-bid/signs/generate-stable-id";

export function SignOrderList() {

    const { dispatch } = useEstimate(); 

    const handleSignAddition = () => {
        dispatch({ type: 'ADD_MPT_SIGN', payload: {
            phaseNumber: 0,
            sign: {
                id: generateUniqueId(),
                designation: '',
                width: 0,
                height: 0,
                sheeting: 'DG',
                quantity: 1,
                associatedStructure: "none",
                bLights: 0,
                covers: 0,
                isCustom: false,
                description: '',
            }
        }})
    }

    return (
        <div className="rounded-lg border p-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Sign List</h2>
                <Button onClick={handleSignAddition}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Sign
                </Button>
            </div>
            <div className="space-y-4">
                {/* Add Custom Sign Form */}
                <SignList currentPhase={0} defaultConfiguring={true}/>
            </div>
        </div>
    );
}