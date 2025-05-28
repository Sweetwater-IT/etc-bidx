import React from "react";
import { FolderOpen, ChevronDown } from "lucide-react";

interface JobItem {
  id: number;
  code: string;
  description: string;
}

interface JobItemsSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  jobItems: JobItem[];
}

export function JobItemsSection({
  isOpen,
  onToggle,
  jobItems,
}: JobItemsSectionProps) {
  return (
    <div className="mb-4">
      <button
        className={`flex items-center justify-between w-full text-sm font-semibold text-foreground py-2 px-3 transition-colors bg-muted hover:bg-muted/80`}
        style={{
          borderRadius: isOpen ? "12px 12px 0 0" : "12px",
        }}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" /> Job Items
          <span className="text-xs font-semibold bg-background border border-border text-foreground rounded px-2 py-0.5">
            {jobItems[0]?.code}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div
          className="px-3 pb-4 pt-1 bg-muted transition-all duration-300"
          style={{ borderRadius: "0 0 12px 12px" }}
        >
          <ul className="space-y-2 mb-2">
            {jobItems.map((item) => (
              <li
                key={item.id}
                className="p-3 rounded-lg bg-background flex flex-col border border-border"
              >
                <span className="text-sm text-foreground font-medium">
                  {item.code}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              </li>
            ))}
          </ul>
          <button className="w-full py-2 mt-1 rounded-lg bg-muted text-xs text-muted-foreground hover:bg-muted/70 border border-dashed border-border font-medium transition-colors">
            + Add Job Item
          </button>
        </div>
      )}
    </div>
  );
}
