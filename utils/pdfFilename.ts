function slugifyTitle(title?: string | null, fallback = "untitled") {
  const normalized = (title || "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized || fallback;
}

export function getTakeoffPdfFilename(title?: string | null, isPickup = false) {
  const prefix = isPickup ? "PU-takeoff" : "takeoff";
  return `${prefix}-${slugifyTitle(title)}.pdf`;
}

export function getWorkOrderPdfFilename(title?: string | null, isPickup = false) {
  const prefix = isPickup ? "PU-WO" : "WO";
  return `${prefix}-${slugifyTitle(title)}.pdf`;
}
