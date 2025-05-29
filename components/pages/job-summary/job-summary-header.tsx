import React from "react";

interface JobSummaryHeaderProps {
  jobNumber: string;
  billingStatus: string;
  projectStatus: string;
  onBillingStatusChange?: (status: string) => void;
  onProjectStatusChange?: (status: string) => void;
}

const BILLING_OPTIONS = ["In progress", "Completed", "Pending", "On Hold"];
const PROJECT_OPTIONS = ["Not Started", "In progress", "Completed", "On Hold"];

export function JobSummaryHeader({
  jobNumber,
  billingStatus,
  projectStatus,
  onBillingStatusChange,
  onProjectStatusChange,
}: JobSummaryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <div className="text-xs text-muted-foreground mb-1">
          Dashboard / Estimating / Jobs
        </div>
        <h1 className="text-2xl font-bold">
          Job number:{" "}
          <span className="font-mono">{jobNumber.slice(0, 10)}</span>
        </h1>
      </div>
      <div className="flex gap-4 mt-4 md:mt-0">
        <div className="">
          <div className="text-xs text-muted-foreground">Billing Status:</div>
          <div className="relative inline-block min-w-[60px]">
            <select
              value={billingStatus}
              onChange={(e) => onBillingStatusChange?.(e.target.value)}
              className="font-medium text-orange-700 text-xs px-2 py-1 rounded appearance-none focus:outline-none focus:ring-0 bg-transparent border-none cursor-pointer w-full pr-6"
              style={{ boxShadow: "none" }}
            >
              {BILLING_OPTIONS.map((opt) => (
                <option
                  key={opt}
                  value={opt}
                  className="text-orange-700 bg-white"
                >
                  {opt}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Project Status:</div>
          <div className="relative inline-block min-w-[100px]">
            <select
              value={projectStatus}
              onChange={(e) => onProjectStatusChange?.(e.target.value)}
              className="font-medium text-gray-700 text-xs px-2 py-1 rounded appearance-none focus:outline-none focus:ring-0 bg-transparent border-none cursor-pointer w-full pr-6"
              style={{ boxShadow: "none" }}
            >
              {PROJECT_OPTIONS.map((opt) => (
                <option
                  key={opt}
                  value={opt}
                  className="text-gray-700 bg-white"
                >
                  {opt}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
