import React from "react";

interface JobSummaryHeaderProps {
  jobNumber: string;
  billingStatus: string;
  projectStatus: string;
}

export function JobSummaryHeader({
  jobNumber,
  billingStatus,
  projectStatus,
}: JobSummaryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <div className="text-xs text-muted-foreground mb-1">
          Dashboard / Estimating / Jobs
        </div>
        <h1 className="text-2xl font-bold">
          Job number <span className="font-mono">{jobNumber}</span>
        </h1>
      </div>
      <div className="flex gap-4 mt-4 md:mt-0">
        <div>
          <div className="text-xs text-muted-foreground">Billing Status:</div>
          <div className="font-medium bg-orange-100/95 text-orange-800 rounded px-2 py-1 text-xs inline-block">
            {billingStatus}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Project Status:</div>
          <div className="font-medium bg-gray-100/95 text-gray-800 rounded px-2 py-1 text-xs inline-block">
            {projectStatus}
          </div>
        </div>
      </div>
    </div>
  );
}
