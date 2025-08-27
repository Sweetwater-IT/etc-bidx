// MutcdSignsStep3.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Step } from "@/types/IStep";
import SignList from "../signs/sign-list";

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