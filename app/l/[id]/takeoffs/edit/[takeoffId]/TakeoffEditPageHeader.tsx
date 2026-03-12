"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const WORK_TYPES = [
  { value: "MPT", label: "MPT (Maintenance & Protection of Traffic)" },
  { value: "PERMANENT_SIGNS", label: "Permanent Signs" },
  { value: "FLAGGING", label: "Flagging" },
  { value: "LANE_CLOSURE", label: "Lane Closure" },
  { value: "SERVICE", label: "Service" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "RENTAL", label: "Rental" },
];

export default function TakeoffEditPageHeader({
  jobId,
  takeoffId,
}: {
  jobId: string;
  takeoffId: string;
}) {
  const router = useRouter();
  const [takeoff, setTakeoff] = useState<any>(null);

  useEffect(() => {
    const loadTakeoff = async () => {
      try {
        const response = await fetch(`/api/takeoffs/${takeoffId}`);
        if (!response.ok) {
          throw new Error(`Failed to load takeoff: ${response.status}`);
        }
        const data = await response.json();
        setTakeoff(data);
      } catch (error) {
        console.error("Error loading takeoff:", error);
        toast.error("Failed to load takeoff details");
      }
    };

    if (takeoffId) {
      loadTakeoff();
    }
  }, [takeoffId]);

  return (
    <>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Button
          variant="ghost"
          onClick={() => router.push(`/l/${jobId}/takeoffs/view/${takeoffId}`)}
          className="gap-2 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold truncate">{takeoff?.title || "Edit Takeoff"}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {WORK_TYPES.find((wt) => wt.value === takeoff?.work_type)?.label || takeoff?.work_type || "—"}
          </p>
        </div>
      </div>
    </>
  );
}