import React, { useRef, useEffect, useState } from "react";
import { ClipboardList, ChevronDown, CheckCircle, Circle } from "lucide-react";

interface ContractTrackerProps {
  isOpen: boolean;
  onToggle: () => void;
}

const steps = [
  {
    label: "Contract received",
    description: "Contract received, pending processing",
    time: "2 hours ago",
    completed: true,
  },
  {
    label: "Contract signed",
    description: "Contract signed, awaiting finalization",
    time: "2 hours ago",
    completed: true,
  },
  {
    label: "Job Created",
    description: "The work has been successfully completed",
    time: "2 hours ago",
    completed: false,
  },
];

export function ContractTracker({ isOpen, onToggle }: ContractTrackerProps) {
  const [lineHeight, setLineHeight] = useState(0);
  const firstRef = useRef<HTMLLIElement>(null);
  const lastRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (firstRef.current && lastRef.current) {
      const first = firstRef.current.getBoundingClientRect();
      const last = lastRef.current.getBoundingClientRect();
      setLineHeight(last.top - first.top);
    }
  }, [isOpen]);

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
          <div className="relative ml-6 pt-1">
            {/* Linha vertical do centro do primeiro ao centro do último ícone */}
            {lineHeight > 0 && (
              <div
                className="absolute left-0 z-0"
                style={{
                  left: "-8px",
                  top: 20,
                  height: lineHeight,
                  width: 2,
                  background: "#d1d5db", // neutral-300
                }}
              />
            )}
            <ol>
              {steps.map((step, idx) => (
                <li
                  key={idx}
                  ref={
                    idx === 0
                      ? firstRef
                      : idx === steps.length - 1
                      ? lastRef
                      : undefined
                  }
                  className="relative flex items-start mb-4 last:mb-0 z-10"
                >
                  <span className="absolute -left-6 flex items-center justify-center w-8 h-8 bg-muted z-10">
                    {step.completed ? (
                      <CheckCircle
                        className="w-6 h-6 text-black"
                        strokeWidth={2.2}
                        fill="white"
                      />
                    ) : (
                      <Circle
                        className="w-6 h-6 text-neutral-400"
                        strokeWidth={2.2}
                        fill="white"
                      />
                    )}
                  </span>
                  <div className="flex-1 ml-4">
                    <div className="font-bold text-black text-base">
                      {step.label}
                    </div>
                    <div className="text-[13px] text-neutral-700">
                      {step.description}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {step.time}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
