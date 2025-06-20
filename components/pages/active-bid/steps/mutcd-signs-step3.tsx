// MutcdSignsStep3.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Step } from "@/types/IStep";
import SignList from "../signs/sign-list";
import AddSignControl from "../signs/add-sign-control";

const step: Step = {
  id: "step-3",
  name: "MUTCD Signs",
  description: "Select and configure MUTCD signs",
  fields: [],
};

const MutcdSignsStep3 = ({
  currentPhase
}: {
  currentPhase: number;
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
              />

              {/* Add Sign Control */}
              <AddSignControl
                currentPhase={currentPhase}
              />
            </div>
          </div>
      </div>
    </div>
  );
};

export default MutcdSignsStep3;