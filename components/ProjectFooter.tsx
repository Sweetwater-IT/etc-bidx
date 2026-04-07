"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useJobFromDB } from "@/hooks/useJobFromDB";
import { useSidebar } from "@/components/ui/sidebar";

function useJobIdFromRoute(): string | undefined {
  const pathname = usePathname();
  const match =
    pathname?.match(/\/l\/([^/]+)\/takeoffs/) ||
    pathname?.match(/\/l\/jobs\/([^/]+)\/work-orders/) ||
    pathname?.match(/\/l\/contract\/([^/]+)/) ||
    pathname?.match(/\/l\/project\/([^/]+)/);
  return match?.[1];
}

export const ProjectFooter = () => {
  const jobId = useJobIdFromRoute();
  const { data: job } = useJobFromDB(jobId);
  const { state: sidebarState } = useSidebar();

  const items = useMemo(() => {
    if (!job) return [];
    const info = job.projectInfo;
    return [
      { label: "Job Name", value: info.projectName },
      { label: "Project Owner", value: info.projectOwner },
      { label: "Owner Job #", value: info.customerJobNumber },
      { label: "County", value: info.county },
      { label: "ETC PM", value: info.etcProjectManager },
      { label: "ETC Job #", value: info.etcJobNumber },
      { label: "Customer", value: info.customerName },
      { label: "Customer Job #", value: info.customerJobNumber },
    ];
  }, [job]);

  if (!job || items.length === 0) return null;

  const leftPosition = sidebarState === 'expanded' ? 'calc(var(--spacing) * 68)' : '0';

  return (
    <footer
      className="border-t bg-card px-4 py-2 fixed bottom-0 z-10 shadow-lg"
      style={{
        left: leftPosition,
        right: 0,
      }}
    >
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 justify-center">
        {items.map((item) => (
          <span key={item.label} className="text-[10px] text-muted-foreground/60">
            <span className="font-medium">{item.label}:</span>{" "}
            {item.value || "—"}
          </span>
        ))}
      </div>
    </footer>
  );
};