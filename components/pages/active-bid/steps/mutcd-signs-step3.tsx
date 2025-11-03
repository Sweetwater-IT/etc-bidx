"use client";
import React, { useState, useEffect } from "react";
import { Step } from "@/types/IStep";
import SignList from "../signs/sign-list";
import { useEstimate } from "@/contexts/EstimateContext";
import { getAssociatedSignEquipment } from '@/lib/mptRentalHelperFunctions';

const step: Step = {
  id: "step-3",
  name: "PENNDOT Signs",
  description: "Select and configure PENNDOT signs",
  fields: [],
};

const MutcdSignsStep3 = ({
  currentPhase,
  isSignOrder = false,
}: {
  currentPhase: number;
  isSignOrder?: boolean;
}) => {
  const { mptRental, dispatch } = useEstimate();

  // FIXED: Bidirectional equipment update useEffect (runs on signs changes)
  useEffect(() => {
    if (!mptRental?.phases?.[currentPhase]?.signs?.length) return;

    const phase = mptRental.phases[currentPhase];
    const { fourFootTypeIII: requiredTypeIII, hStand: requiredHStand, post: requiredPost, BLights: requiredBLights, covers: requiredCovers, ACLights: requiredACLights } = getAssociatedSignEquipment(phase);

    const currentTypeIII = phase.standardEquipment?.fourFootTypeIII?.quantity || 0;
    const currentHStand = phase.standardEquipment?.hStand?.quantity || 0;
    const currentPost = phase.standardEquipment?.post?.quantity || 0;
    const currentBLights = phase.standardEquipment?.BLights?.quantity || 0;
    const currentCovers = phase.standardEquipment?.covers?.quantity || 0;
    const currentACLights = phase.standardEquipment?.ACLights?.quantity || 0;

    // Always dispatch if current !== required (enables decrements to 0)
    const equipmentUpdates = [
      { type: 'fourFootTypeIII', current: currentTypeIII, required: requiredTypeIII },
      { type: 'hStand', current: currentHStand, required: requiredHStand },
      { type: 'post', current: currentPost, required: requiredPost },
      { type: 'BLights', current: currentBLights, required: requiredBLights },
      { type: 'covers', current: currentCovers, required: requiredCovers },
      { type: 'ACLights', current: currentACLights, required: requiredACLights },
    ];

    equipmentUpdates.forEach(({ type, current, required }) => {
      if (current !== required) {
        dispatch({
          type: 'ADD_MPT_ITEM_NOT_SIGN',
          payload: {
            phaseNumber: currentPhase,
            equipmentType: type,
            equipmentProperty: 'quantity',
            value: required  // Sets to exact required (0 if none needed)
          }
        });
      }
    });
  }, [mptRental?.phases?.[currentPhase]?.signs, dispatch, currentPhase]);  // Re-runs on signs array changes

  return (
    <div>
      <div className="relative">
        {/* Collapsible Content */}
        <div className="mt-2 mb-6">
          <div className="space-y-6">
            {/* Signs List */}
            <SignList
              currentPhase={currentPhase}
              isSignOrder={isSignOrder}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MutcdSignsStep3;
