const WORK_TYPE_LABELS: Record<string, string> = {
  MPT: "MPT",
  PERMANENT_SIGNS: "Permanent sign",
  FLAGGING: "Flagging",
  LANE_CLOSURE: "Lane closure",
  SERVICE: "Service",
  DELIVERY: "Delivery",
  RENTAL: "Rental",
  CUSTOM: "Custom",
};

function normalizeWorkTypeKey(workType?: string | null) {
  return workType?.trim().toUpperCase().replace(/\s+/g, "_") || "";
}

export function getWorkTypeLabel(workType?: string | null) {
  const normalized = normalizeWorkTypeKey(workType);
  return WORK_TYPE_LABELS[normalized] || workType?.trim() || "";
}

export function formatTakeoffPageTitle({
  workType,
  isPickup = false,
  jobLabel,
}: {
  workType?: string | null;
  isPickup?: boolean;
  jobLabel?: string | null;
}) {
  const resolvedJobLabel = jobLabel?.trim() || "Untitled Project";
  if (isPickup) return `Pickup takeoff for ${resolvedJobLabel}`;

  const workTypeLabel = getWorkTypeLabel(workType);
  return workTypeLabel
    ? `${workTypeLabel} takeoff for ${resolvedJobLabel}`
    : `Takeoff for ${resolvedJobLabel}`;
}

export function formatWorkOrderPageTitle({
  workType,
  isPickup = false,
  jobLabel,
}: {
  workType?: string | null;
  isPickup?: boolean;
  jobLabel?: string | null;
}) {
  const resolvedJobLabel = jobLabel?.trim() || "Untitled Project";
  if (isPickup) return `Pickup work order for ${resolvedJobLabel}`;

  const workTypeLabel = getWorkTypeLabel(workType);
  return workTypeLabel
    ? `${workTypeLabel} work order for ${resolvedJobLabel}`
    : `Work order for ${resolvedJobLabel}`;
}
