import React from "react";
import { ClipboardList, ChevronDown } from "lucide-react";

interface ContractTrackerProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ContractTracker({ isOpen, onToggle }: ContractTrackerProps) {
  return (
    <div className="mb-2">
      <button
        className={`flex items-center gap-2 w-full text-sm font-semibold text-foreground py-2 px-3 transition-colors bg-muted hover:bg-muted/80 justify-between`}
        style={{
          borderRadius: isOpen ? "12px 12px 0 0" : "12px",
        }}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Contract Tracker
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div
          className="px-4 pb-4 pt-1 bg-muted transition-all duration-300"
          style={{ borderRadius: "0 0 12px 12px" }}
        >
          <div className="mb-2 font-semibold text-foreground">
            Contract Progress
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
            <li>Signed: 06/01/2024</li>
            <li>In progress: 06/05/2024</li>
            <li>Expected completion: 11/12/2025</li>
          </ul>
        </div>
      )}
    </div>
  );
}
