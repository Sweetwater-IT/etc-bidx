function sanitizeFilenameSegment(value?: string | number | null, fallback = "untitled") {
  const normalized = String(value ?? "")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");

  return normalized || fallback;
}

export function getTakeoffPdfFilename(title?: string | null, isPickup = false) {
  const prefix = isPickup ? "PU-takeoff" : "takeoff";
  return `${prefix}-${sanitizeFilenameSegment(title)}.pdf`;
}

export function getWorkOrderPdfFilename(
  title?: string | null,
  woNumber?: string | number | null,
  isPickup = false
) {
  const prefix = isPickup ? "PU-WO" : "WO";
  return `${prefix}-${sanitizeFilenameSegment(woNumber, isPickup ? "pickup" : "work-order")}-${sanitizeFilenameSegment(title)}.pdf`;
}

export function getBillingPacketPdfFilename(title?: string | null, woNumber?: string | number | null) {
  return `billing-packet-${sanitizeFilenameSegment(title)}-${sanitizeFilenameSegment(woNumber, "work-order")}.pdf`;
}

export function getReturnInventoryPdfFilename(title?: string | null) {
  return `return-inventory-${sanitizeFilenameSegment(title)}.pdf`;
}

export function getQuotePdfFilename(quoteId?: string | number | null) {
  return `quote-${sanitizeFilenameSegment(quoteId, "quote")}.pdf`;
}
