export const normalizeWorkOrderStatusForDb = (status: unknown): string | undefined => {
  if (typeof status !== "string") return undefined;

  const normalized = status.trim().toLowerCase();

  if (normalized === "installed") return "complete";
  if (normalized === "completed") return "complete";

  return normalized;
};

export const normalizeWorkOrderStatusForUi = (status: unknown): string | null => {
  if (typeof status !== "string") return null;

  const normalized = status.trim().toLowerCase();

  if (normalized === "complete") return "installed";

  return normalized;
};
