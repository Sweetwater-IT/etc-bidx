import jsPDF from "jspdf";
import { abbreviateMaterial } from "@/utils/signMaterial";

interface TakeoffPdfData {
  title: string;
  workType: string;
  status: string;
  installDate?: string | null;
  pickupDate?: string | null;
  neededByDate?: string | null;
  notes?: string | null;
  workOrderNumber?: string | null;
  contractedOrAdditional?: string;
  projectName?: string;
  etcJobNumber?: string;
  customerName?: string;
  customerJobNumber?: string;
  customerPM?: string;
  projectOwner?: string;
  county?: string;
  etcBranch?: string;
  etcProjectManager?: string;
  crewNotes?: string | null;
  buildShopNotes?: string | null;
  items: {
    product_name: string;
    category: string;
    unit: string;
    quantity: number;
    notes?: string | null;
    material?: string;
  }[];
  sovItems?: {
    itemNumber: string;
    description: string;
    uom: string;
    quantity: number;
    unitPrice: number;
    extendedPrice: number;
    retainageType: 'percent' | 'dollar';
    retainageValue: number;
    retainageAmount: number;
    notes?: string | null;
  }[];
  returnBytes?: boolean;
}

interface SecondarySignMeta {
  signDesignation?: string;
  signDescription?: string;
  dimensionLabel?: string;
  width?: number;
  height?: number;
  signLegend?: string;
  sheeting?: string;
  sqft?: number;
}

interface ParsedMeta {
  itemType?: string;
  material?: string;
  signDescription?: string;
  description?: string;
  sheeting?: string;
  width?: number;
  height?: number;
  dimensionLabel?: string;
  signLegend?: string;
  structureType?: string;
  bLights?: string;
  sqft?: number;
  totalSqft?: number;
  substrate?: string;
  structure?: string;
  itemNumber?: string;
  postSize?: string;
  planSheetNum?: string;
  planSheetTotal?: string;
  loadOrder?: number;
  cover?: boolean;
  vehicleType?: string;
  equipmentId?: string;
  equipmentLabel?: string;
  secondarySigns?: SecondarySignMeta[];
}

function tryParseNotes(notes?: string | null): ParsedMeta | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (typeof parsed === "object" && parsed !== null) return parsed;
  } catch {}
  return null;
}

function addField(doc: jsPDF, label: string, value: string, x: number, y: number): number {
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120);
  doc.text(label, x, y);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(value || "—", x, y + 4);
  return y;
}

function drawTableHeader(doc: jsPDF, cols: { label: string; x: number; w: number }[], y: number, pageW: number): number {
  const RIGHT_ALIGN_LABELS = new Set(["COVER", "LIGHTS", "MATL"]);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 240, 240);
  doc.rect(14, y - 3.5, pageW - 28, 7, "F");
  for (const col of cols) {
    if (RIGHT_ALIGN_LABELS.has(col.label)) {
      doc.text(col.label, col.x + col.w, y, { align: "right" });
    } else {
      doc.text(col.label, col.x, y);
    }
  }
  return y + 7;
}

// Track current active columns for header carryover on page breaks
let _activeCols: { label: string; x: number; w: number }[] | null = null;
let _activePageW: number = 210;

function checkPageBreak(doc: jsPDF, y: number, needed: number = 12): number {
  const pageH = 210; // landscape A4 height
  if (y > pageH - 18 - needed) {
    doc.addPage();
    let newY = 20;
    // Re-draw column headers on new page
    if (_activeCols) {
      newY = drawTableHeader(doc, _activeCols, newY, _activePageW);
    }
    return newY;
  }
  return y;
}

function splitCellText(doc: jsPDF, value: string | number | null | undefined, width: number): string[] {
  const text = value === null || value === undefined || value === "" ? "—" : String(value);
  return doc.splitTextToSize(text, Math.max(4, width));
}

function getLineHeight(lineCount: number, minHeight = 6, lineStep = 3.5): number {
  return Math.max(minHeight, lineCount * lineStep);
}

// MPT columns: [#], Designation, Legend, Dimensions, Sheeting, Qty, Sq Ft, Structure, Lights, Cover
// Type III has # column hanging left; all other columns align with non-Type-III
// Landscape page width ~297mm; usable area 14..283 = 269mm
const MPT_COLS_ORDERED = [
  { label: "LOAD", x: 14, w: 8 },
  { label: "DESIG", x: 22, w: 18 },
  { label: "LEGEND", x: 40, w: 86 },
  { label: "DIM", x: 126, w: 18 },
  { label: "SHEET", x: 144, w: 16 },
  { label: "QTY", x: 160, w: 10 },
  { label: "STRUCTURE", x: 170, w: 42 },
  { label: "LIGHTS", x: 212, w: 12 },
  { label: "SQ FT", x: 224, w: 18 },
  { label: "MATL", x: 242, w: 12 },
  { label: "COVER", x: 266, w: 17 },
];

const MPT_COLS = [
  { label: "DESIG", x: 22, w: 20 },
  { label: "LEGEND", x: 42, w: 92 },
  { label: "DIM", x: 134, w: 20 },
  { label: "SHEET", x: 154, w: 16 },
  { label: "QTY", x: 170, w: 12 },
  { label: "STRUCTURE", x: 182, w: 42 },
  { label: "LIGHTS", x: 224, w: 12 },
  { label: "SQ FT", x: 236, w: 18 },
  { label: "MATL", x: 254, w: 12 },
  { label: "COVER", x: 266, w: 17 },
];

const PERM_COLS = [
  { label: "DESIGNATION", x: 14, w: 30 },
  { label: "LEGEND", x: 44, w: 92 },
  { label: "DIMENSIONS", x: 136, w: 24 },
  { label: "SHEETING", x: 160, w: 18 },
  { label: "QTY", x: 178, w: 12 },
  { label: "POST SIZE", x: 190, w: 22 },
  { label: "PLAN SHEET", x: 212, w: 28 },
  { label: "SQ FT", x: 240, w: 18 },
];

const VEHICLE_COLS = [
  { label: "TYPE", x: 14, w: 220 },
  { label: "QTY", x: 234, w: 20 },
];

const ADDITIONAL_COLS = [
  { label: "ITEM", x: 14, w: 120 },
  { label: "QTY", x: 134, w: 20 },
  { label: "NOTES", x: 154, w: 129 },
];

const ROLLING_STOCK_COLS = [
  { label: "EQUIPMENT", x: 14, w: 220 },
  { label: "QTY", x: 234, w: 20 },
];

const PERM_ENTRY_COLS = [
  { label: "QTY", x: 14, w: 20 },
  { label: "DESCRIPTION / NOTES", x: 38, w: 245 },
];

const SIMPLE_COLS = [
  { label: "ITEM", x: 14, w: 110 },
  { label: "QTY", x: 124, w: 20 },
  { label: "UNIT", x: 144, w: 24 },
  { label: "NOTES", x: 168, w: 115 },
];

function isTypeIIICategory(cat: string): boolean {
  return cat.toLowerCase().includes("type iii");
}

function isMPTSignCategory(cat: string, workType?: string): boolean {
  const lowerCat = cat.toLowerCase();
  const lowerWorkType = workType?.toLowerCase() || "";

  // Standard MPT categories
  if (lowerCat.includes("trailblazer") ||
      lowerCat.includes("h-stand") ||
      lowerCat.includes("sign stand") ||
      lowerCat.includes("type iii")) {
    return true;
  }

  // For flagging/lane closure work types, treat "sign" category as MPT
  if (lowerCat === "sign" &&
      (lowerWorkType === "flagging" || lowerWorkType === "lane_closure")) {
    return true;
  }

  return false;
}

function isPermSignCategory(cat: string): boolean {
  return cat.toLowerCase().includes("perm sign");
}

function isSimpleCategory(cat: string): boolean {
  return !isMPTSignCategory(cat) && !isPermSignCategory(cat);
}

function isPermanentEntryItems(items: TakeoffPdfData["items"]): boolean {
  return items.length > 0 && items.every((item) => tryParseNotes(item.notes)?.itemType === "permanent_entry");
}

function abbreviateStructure(s: string): string {
  return s.replace(/post\s+complete/gi, "P Comp");
}

function cleanProductName(name: string, category: string): string {
  // Remove "barricade" from wing items
  if (category.toLowerCase().includes("type iii")) {
    return name.replace(/\bbarricade\b\s*/gi, "").replace(/\s{2,}/g, " ").trim();
  }
  return name;
}

function renderMPTSectionSummary(
  doc: jsPDF,
  items: TakeoffPdfData["items"],
  y: number,
  pageW: number
): number {
  let totalSqft = 0;
  let totalSigns = 0;
  let totalBLights = 0;
  const structureCounts: Record<string, number> = {};

  for (const item of items) {
    const meta = tryParseNotes(item.notes);
    totalSigns += item.quantity;
    // Primary sign sqft
    const primarySqft = meta?.sqft ?? 0;
    totalSqft += primarySqft * item.quantity;
    // B-lights
    if (meta?.bLights && meta.bLights !== "none") {
      totalBLights += Number(meta.bLights) * item.quantity;
    }
    // Structure counts
    if (meta?.structureType) {
      structureCounts[meta.structureType] = (structureCounts[meta.structureType] || 0) + item.quantity;
    }
    // Secondary signs sqft
    if (meta?.secondarySigns?.length) {
      for (const sec of meta.secondarySigns) {
        totalSqft += (sec.sqft ?? 0) * item.quantity;
      }
    }
  }

  y = checkPageBreak(doc, y, 18);
  doc.setFillColor(245, 245, 248);
  const summaryStartY = y;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(80);

  const summaryParts: string[] = [];
  summaryParts.push(`Signs: ${totalSigns}`);
  summaryParts.push(`Total SqFt: ${Math.round(totalSqft * 100) / 100}`);
  if (totalBLights > 0) summaryParts.push(`B-Lights: ${totalBLights}`);
  const structureEntries = Object.entries(structureCounts);
  if (structureEntries.length > 0) {
    const structStr = structureEntries.map(([type, count]) => `${type}: ${count}`).join(", ");
    summaryParts.push(`Structures — ${structStr}`);
  }

  const summaryText = summaryParts.join("   |   ");
  doc.rect(14, y - 3, pageW - 28, 7, "F");
  doc.text(summaryText, 16, y + 1);
  doc.setTextColor(0);
  y += 8;
  return y;
}

function renderPermSectionSummary(
  doc: jsPDF,
  items: TakeoffPdfData["items"],
  y: number,
  pageW: number
): number {
  let totalSqft = 0;
  let totalSigns = 0;

  for (const item of items) {
    const meta = tryParseNotes(item.notes);
    totalSigns += item.quantity;
    totalSqft += (meta?.totalSqft ?? 0);
    if (meta?.secondarySigns?.length) {
      for (const sec of meta.secondarySigns) {
        totalSqft += (sec.sqft ?? 0) * item.quantity;
      }
    }
  }

  y = checkPageBreak(doc, y, 18);
  doc.setFillColor(245, 245, 248);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(80);

  const summaryText = `Signs: ${totalSigns}   |   Total SqFt: ${Math.round(totalSqft * 100) / 100}`;
  doc.rect(14, y - 3, pageW - 28, 7, "F");
  doc.text(summaryText, 16, y + 1);
  doc.setTextColor(0);
  y += 8;
  return y;
}

export async function generateTakeoffPdf(data: TakeoffPdfData): Promise<ArrayBuffer | null> {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Cover page with notes (if any notes exist) ──
  const hasCrewNotes = !!data.crewNotes?.trim();
  const hasBuildShopNotes = !!data.buildShopNotes?.trim();

  if (hasCrewNotes || hasBuildShopNotes) {
    // Cover page title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("MATERIAL TAKEOFF", 14, 14);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    const coverGenText = `Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
    doc.text(coverGenText, pageW / 2, 14, { align: "center" });
    doc.setTextColor(0);
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(14, 17, pageW - 14, 17);

    // Cover page info grid (same as main header)
    const coverInfoStartY = 20;
    let coverY = coverInfoStartY + 3;
    const coverRowH = 9.5;
    const coverInfoLeft = 14;
    const coverInfoW = pageW - 28;
    const coverColW = coverInfoW / 3;
    const coverCol1X = coverInfoLeft + 3;
    const coverCol2X = coverInfoLeft + coverColW + 3;
    const coverCol3X = coverInfoLeft + coverColW * 2 + 3;

    const coverDrawRowDivider = (atY: number) => {
      doc.setDrawColor(200);
      doc.setLineWidth(0.2);
      doc.line(coverInfoLeft, atY, coverInfoLeft + coverInfoW, atY);
    };
    const coverDrawColDividers = (fromY: number, toY: number) => {
      doc.setDrawColor(215);
      doc.setLineWidth(0.15);
      doc.line(coverInfoLeft + coverColW, fromY, coverInfoLeft + coverColW, toY);
      doc.line(coverInfoLeft + coverColW * 2, fromY, coverInfoLeft + coverColW * 2, toY);
    };

    addField(doc, "JOB NAME", data.projectName || "—", coverCol1X, coverY);
    addField(doc, "TAKEOFF TITLE", data.title, coverCol2X, coverY);
    addField(doc, "WORK TYPE", data.workType, coverCol3X, coverY);
    coverY += coverRowH;
    coverDrawRowDivider(coverY - 2);

    addField(doc, "PROJECT OWNER", data.projectOwner || "—", coverCol1X, coverY);
    addField(doc, "OWNER JOB #", data.customerJobNumber || "—", coverCol2X, coverY);
    addField(doc, "COUNTY", data.county || "—", coverCol3X, coverY);
    coverY += coverRowH;
    coverDrawRowDivider(coverY - 2);

    addField(doc, "ETC PM", data.etcProjectManager || "—", coverCol1X, coverY);
    addField(doc, "ETC JOB #", data.etcJobNumber || "—", coverCol2X, coverY);
    addField(doc, "BRANCH", data.etcBranch || "—", coverCol3X, coverY);
    coverY += coverRowH - 2;

    coverDrawColDividers(coverInfoStartY, coverY);
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(coverInfoLeft, coverInfoStartY, coverInfoW, coverY - coverInfoStartY);
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    coverY += 10;

    // Render notes sections
    if (hasCrewNotes) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("CREW NOTES", 14, coverY);
      coverY += 6;
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(14, coverY - 3, pageW - 14, coverY - 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const crewLines = doc.splitTextToSize(data.crewNotes!.trim(), pageW - 28);
      doc.text(crewLines, 14, coverY);
      coverY += crewLines.length * 5 + 8;
    }

    if (hasBuildShopNotes) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("BUILD SHOP NOTES", 14, coverY);
      coverY += 6;
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(14, coverY - 3, pageW - 14, coverY - 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const buildLines = doc.splitTextToSize(data.buildShopNotes!.trim(), pageW - 28);
      doc.text(buildLines, 14, coverY);
      coverY += buildLines.length * 5 + 8;
    }

    // Start new page for the actual takeoff content
    doc.addPage();
  }

  // ── Title line ──
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("MATERIAL TAKEOFF", 14, 14);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  const genText = `Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
  doc.text(genText, pageW / 2, 14, { align: "center" });
  doc.setTextColor(0);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(14, 17, pageW - 14, 17);

  // ── Project info grid ──
  const infoStartY = 20;
  let y = infoStartY + 3;
  const rowH = 9.5;

  const infoLeft = 14;
  const infoW = pageW - 28;
  // Three equal columns with inner padding
  const colW = infoW / 3;
  const col1X = infoLeft + 3;
  const col2X = infoLeft + colW + 3;
  const col3X = infoLeft + colW * 2 + 3;

  const drawRowDivider = (atY: number) => {
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(infoLeft, atY, infoLeft + infoW, atY);
  };

  const drawColDividers = (fromY: number, toY: number) => {
    doc.setDrawColor(215);
    doc.setLineWidth(0.15);
    doc.line(infoLeft + colW, fromY, infoLeft + colW, toY);
    doc.line(infoLeft + colW * 2, fromY, infoLeft + colW * 2, toY);
  };

  // Row 1
  addField(doc, "JOB NAME", data.projectName || "—", col1X, y);
  addField(doc, "TAKEOFF TITLE", data.title, col2X, y);
  addField(doc, "WORK TYPE", data.workType, col3X, y);
  y += rowH;
  drawRowDivider(y - 2);

  // Row 2
  addField(doc, "PROJECT OWNER", data.projectOwner || "—", col1X, y);
  addField(doc, "OWNER JOB #", data.customerJobNumber || "—", col2X, y);
  addField(doc, "COUNTY", data.county || "—", col3X, y);
  y += rowH;
  drawRowDivider(y - 2);

  // Row 3
  addField(doc, "ETC PM", data.etcProjectManager || "—", col1X, y);
  addField(doc, "ETC JOB #", data.etcJobNumber || "—", col2X, y);
  addField(doc, "BRANCH", data.etcBranch || "—", col3X, y);
  y += rowH;
  drawRowDivider(y - 2);

  // Row 4
  addField(doc, "CUSTOMER", data.customerName || "—", col1X, y);
  addField(doc, "CUSTOMER JOB #", data.customerJobNumber || "—", col2X, y);
  addField(doc, "CUSTOMER POC", data.customerPM || "—", col3X, y);
  y += rowH;
  drawRowDivider(y - 2);

  // Row 5: Dates
  const fmtDate = (d?: string | null) => {
    if (!d) return "—";
    const dt = new Date(d + "T00:00:00");
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, "0");
    const m = dt.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const yy = String(dt.getFullYear()).slice(-2);
    return `${dd}-${m}-${yy}`;
  };
  addField(doc, "INSTALL DATE", fmtDate(data.installDate), col1X, y);
  addField(doc, "PICKUP DATE", fmtDate(data.pickupDate), col2X, y);
  addField(doc, "NEEDED BY", fmtDate(data.neededByDate), col3X, y);
  y += rowH - 2;

  // Column dividers spanning all rows
  drawColDividers(infoStartY, y);

  // Outer border
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(infoLeft, infoStartY, infoW, y - infoStartY);
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  y += 6;

  // Group items by category
  const grouped: Record<string, typeof data.items> = {};
  for (const item of data.items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  // Sort categories: Trailblazers/H-Stands first, then Sign Stands, then Type III,
  // then Perm Signs, then Vehicles/Rolling Stock, then Additional Items last
  const categoryOrder = (cat: string): number => {
    const lower = cat.toLowerCase();
    if (lower.includes("trailblazer") || lower.includes("h-stand")) return 0;
    if (lower.includes("sign stand")) return 1;
    if (lower.includes("type iii")) return 2;
    if (lower.includes("perm sign")) return 3;
    if (lower.includes("vehicle")) return 4;
    if (lower.includes("rolling stock")) return 5;
    if (lower.includes("additional")) return 6;
    return 3; // default: after structures, before additional
  };

  const sortedCategories = Object.keys(grouped).sort((a, b) => categoryOrder(a) - categoryOrder(b));

  if (data.items.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("No items in this takeoff.", 14, y);
  } else {
    for (const category of sortedCategories) {
      const items = grouped[category];
      y = checkPageBreak(doc, y, 20);

      // Category header row
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(230, 235, 245);
      doc.rect(14, y - 3.5, pageW - 28, 8, "F");
      doc.text(category.toUpperCase(), 16, y + 1);
      y += 9;

      const lowerWorkType  = (data.workType || "").toLowerCase().trim();
      const lowerCategory  = category.toLowerCase().trim();
      const parsedItems = items.map((item) => tryParseNotes(item.notes));

      // ── Job type detection ────────────────────────────────────────────────
      const isPermanentJob =
        lowerWorkType.includes("perm") ||
        lowerWorkType.includes("permanent") ||
        lowerWorkType === "permanent signs";

      const shouldUseMPT =
        lowerWorkType.includes("mpt") ||
        lowerWorkType.includes("flagg") ||
        lowerWorkType.includes("lane") ||
        lowerWorkType.includes("closure") ||
        lowerWorkType.includes("traffic control") ||
        lowerCategory.includes("sign") ||
        lowerCategory.startsWith("mpt:");

      let columnsUsed: { label: string; x: number; w: number }[] = SIMPLE_COLS;
      let isMPT = false;
      let isPerm = false;
      let isTypeIII = false;
      let isVehicle = false;
      let isAdditional = false;
      let isRollingStock = false;
      let isPermanentEntry = false;

      // Check for vehicle category
      if (lowerCategory.includes("vehicle") || parsedItems.some((meta) => meta?.itemType === "vehicle")) {
        isVehicle = true;
        columnsUsed = VEHICLE_COLS;
      } else if (lowerCategory.includes("rolling stock") || parsedItems.some((meta) => meta?.itemType === "rolling_stock")) {
        isRollingStock = true;
        columnsUsed = ROLLING_STOCK_COLS;
      } else if (lowerCategory.includes("additional") || parsedItems.some((meta) => meta?.itemType === "additional")) {
        isAdditional = true;
        columnsUsed = ADDITIONAL_COLS;
      } else if (isPermanentJob && isPermanentEntryItems(items)) {
        isPermanentEntry = true;
        columnsUsed = PERM_ENTRY_COLS;
      } else if (isPermanentJob) {
        isPerm = true;
        columnsUsed = PERM_COLS;
      } else if (shouldUseMPT) {
        isMPT = true;
        isTypeIII = isTypeIIICategory(category);
        columnsUsed = isTypeIII ? MPT_COLS_ORDERED : MPT_COLS;
      }

      _activeCols = columnsUsed;
      _activePageW = pageW;
      y = drawTableHeader(doc, columnsUsed, y, pageW);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      if (isPerm) {
        // ── Permanent signs rendering ──────────────────────────────────────
        for (const item of items) {
          y = checkPageBreak(doc, y);
          const meta = tryParseNotes(item.notes);

          const designationLines = splitCellText(doc, item.product_name || "", PERM_COLS[0].w);
          const permLegendLines = splitCellText(doc, meta?.signLegend || "", PERM_COLS[1].w);
          const dimLines = splitCellText(doc, meta?.dimensionLabel || "—", PERM_COLS[2].w);
          const postSizeLines = splitCellText(doc, meta?.postSize || "—", PERM_COLS[5].w);
          const planSheet = meta?.planSheetNum
            ? `${meta.planSheetNum}${meta.planSheetTotal ? ` of ${meta.planSheetTotal}` : ""}`
            : "—";
          const planSheetLines = splitCellText(doc, planSheet, PERM_COLS[6].w);
          const sqftLines = splitCellText(
            doc,
            meta?.totalSqft ? String(Math.round(meta.totalSqft * 100) / 100) : "—",
            PERM_COLS[7].w
          );
          const permRowH = getLineHeight(
            Math.max(
              designationLines.length,
              permLegendLines.length,
              dimLines.length,
              postSizeLines.length,
              planSheetLines.length,
              sqftLines.length
            )
          );
          y = checkPageBreak(doc, y, permRowH);

          doc.text(designationLines, PERM_COLS[0].x, y);
          doc.text(permLegendLines, PERM_COLS[1].x, y);
          doc.text(dimLines, PERM_COLS[2].x, y);
          doc.text(meta?.sheeting || "—", PERM_COLS[3].x, y);
          doc.text(String(item.quantity), PERM_COLS[4].x, y);
          doc.text(postSizeLines, PERM_COLS[5].x, y);
          doc.text(planSheetLines, PERM_COLS[6].x, y);
          doc.text(sqftLines, PERM_COLS[7].x, y);

          y += permRowH;
          doc.setDrawColor(220);
          doc.setLineWidth(0.15);
          doc.line(14, y - 2.5, pageW - 14, y - 2.5);

          // Secondary signs (perm)
          if (meta?.secondarySigns?.length) {
            for (const sec of meta.secondarySigns) {
              const secDesignationLines = splitCellText(doc, sec.signDesignation || "", PERM_COLS[0].w - 8);
              const secLegendLines = splitCellText(doc, sec.signLegend || "", PERM_COLS[1].w);
              const secDimLines = splitCellText(doc, sec.dimensionLabel || "—", PERM_COLS[2].w);
              const secSqftLines = splitCellText(doc, sec.sqft ? String(sec.sqft) : "—", PERM_COLS[7].w);
              const secRowH = getLineHeight(
                Math.max(secDesignationLines.length, secLegendLines.length, secDimLines.length, secSqftLines.length)
              );
              y = checkPageBreak(doc, y, secRowH);
              doc.setFillColor(248, 248, 250);
              doc.rect(14, y - 3.5, pageW - 28, secRowH, "F");
              doc.setDrawColor(220);
              doc.line(14, y - 3.5, 14, y + secRowH - 3.5);
              doc.setDrawColor(200);
              doc.setFont("helvetica", "italic");
              doc.setFontSize(7);
              doc.text("•", PERM_COLS[0].x + 2, y);
              doc.text(secDesignationLines, PERM_COLS[0].x + 8, y);
              doc.text(secLegendLines, PERM_COLS[1].x, y);
              doc.text(secDimLines, PERM_COLS[2].x, y);
              doc.text(sec.sheeting || "—", PERM_COLS[3].x, y);
              doc.text("", PERM_COLS[4].x, y);
              doc.text("", PERM_COLS[5].x, y);
              doc.text("", PERM_COLS[6].x, y);
              doc.text(secSqftLines, PERM_COLS[7].x, y);
              doc.setFontSize(8);
              doc.setFont("helvetica", "normal");
              y += secRowH;
            }
          }
        }

        y = renderPermSectionSummary(doc, items, y, pageW);
      } else if (isPermanentEntry) {
        for (const item of items) {
          const meta = tryParseNotes(item.notes);
          const noteLines = doc.splitTextToSize(meta?.description || "", PERM_ENTRY_COLS[1].w);
          const rowH = Math.max(6, noteLines.length * 4);
          y = checkPageBreak(doc, y, rowH);

          doc.text(String(item.quantity), PERM_ENTRY_COLS[0].x, y);
          doc.text(noteLines, PERM_ENTRY_COLS[1].x, y);
          y += rowH;

          doc.setDrawColor(220);
          doc.setLineWidth(0.15);
          doc.line(14, y - 2.5, pageW - 14, y - 2.5);
        }
      } else if (isMPT) {
        // ── MPT rendering ───────────────────────────────────────────────────
        const sortedItems = isTypeIII
          ? [...items].sort((a, b) => {
              const ma = tryParseNotes(a.notes);
              const mb = tryParseNotes(b.notes);
              return (ma?.loadOrder ?? 999) - (mb?.loadOrder ?? 999);
            })
          : items;

        for (let idx = 0; idx < sortedItems.length; idx++) {
          const item = sortedItems[idx];
          y = checkPageBreak(doc, y);
          const meta = tryParseNotes(item.notes);

          const desigLines = splitCellText(
            doc,
            cleanProductName(item.product_name || "", category),
            (isTypeIII ? columnsUsed[1] : columnsUsed[0]).w
          );
          const legendCol = isTypeIII ? MPT_COLS_ORDERED[2] : MPT_COLS[1];
          const legendLines = splitCellText(doc, meta?.signLegend || "", legendCol.w);
          const dimensionLines = splitCellText(doc, meta?.dimensionLabel || "—", (isTypeIII ? columnsUsed[3] : columnsUsed[2]).w);
          const structureLines = splitCellText(
            doc,
            abbreviateStructure(meta?.structureType || "—"),
            (isTypeIII ? columnsUsed[6] : columnsUsed[5]).w
          );
          const sqftLines = splitCellText(
            doc,
            meta?.sqft ? String(Math.round(meta.sqft * 100) / 100) : "—",
            (isTypeIII ? columnsUsed[8] : columnsUsed[7]).w
          );
          const rowH = getLineHeight(
            Math.max(desigLines.length, legendLines.length, dimensionLines.length, structureLines.length, sqftLines.length)
          );
          y = checkPageBreak(doc, y, rowH);

          if (isTypeIII) {
            doc.text(String(idx + 1), columnsUsed[0].x, y);
            doc.text(desigLines, columnsUsed[1].x, y);
            doc.text(legendLines, columnsUsed[2].x, y);
            doc.text(dimensionLines, columnsUsed[3].x, y);
            doc.text(meta?.sheeting || "—", columnsUsed[4].x, y);
            doc.text(String(item.quantity), columnsUsed[5].x, y);
            doc.text(structureLines, columnsUsed[6].x, y);
            doc.text(meta?.bLights && meta.bLights !== "none" ? meta.bLights : "", columnsUsed[7].x + columnsUsed[7].w, y, { align: "right" });
            doc.text(sqftLines, columnsUsed[8].x, y);
            doc.text(abbreviateMaterial(item.material || meta?.material || ""), columnsUsed[9].x + columnsUsed[9].w, y, { align: "right" });
            doc.text(meta?.cover ? "Y" : "", columnsUsed[10].x + columnsUsed[10].w, y, { align: "right" });
          } else {
            doc.text(desigLines, columnsUsed[0].x, y);
            doc.text(legendLines, columnsUsed[1].x, y);
            doc.text(dimensionLines, columnsUsed[2].x, y);
            doc.text(meta?.sheeting || "—", columnsUsed[3].x, y);
            doc.text(String(item.quantity), columnsUsed[4].x, y);
            doc.text(structureLines, columnsUsed[5].x, y);
            doc.text(meta?.bLights && meta.bLights !== "none" ? meta.bLights : "", columnsUsed[6].x + columnsUsed[6].w, y, { align: "right" });
            doc.text(sqftLines, columnsUsed[7].x, y);
            doc.text(abbreviateMaterial(item.material || meta?.material || ""), columnsUsed[8].x + columnsUsed[8].w, y, { align: "right" });
            doc.text(meta?.cover ? "Y" : "", columnsUsed[9].x + columnsUsed[9].w, y, { align: "right" });
          }

          y += rowH;
          doc.setDrawColor(220);
          doc.setLineWidth(0.15);
          doc.line(14, y - 2.5, pageW - 14, y - 2.5);

          // Secondary signs (MPT)
          if (meta?.secondarySigns?.length) {
            for (const sec of meta.secondarySigns) {
              const secLegendLines = doc.splitTextToSize(sec.signLegend || "", legendCol.w);
              const secDesignationLines = splitCellText(
                doc,
                sec.signDesignation || "",
                (isTypeIII ? columnsUsed[1] : columnsUsed[0]).w - 4
              );
              const secDimLines = splitCellText(doc, sec.dimensionLabel || "—", (isTypeIII ? columnsUsed[3] : columnsUsed[2]).w);
              const secRowH = getLineHeight(
                Math.max(secDesignationLines.length, secLegendLines.length, secDimLines.length)
              );
              y = checkPageBreak(doc, y, secRowH);

              doc.setFillColor(248, 248, 250);
              doc.rect(14, y - 3.5, pageW - 28, secRowH, "F");
              doc.setDrawColor(220);
              doc.line(14, y - 3.5, 14, y + secRowH - 3.5);
              doc.setDrawColor(200);
              doc.setFont("helvetica", "italic");
              doc.setFontSize(7);

              doc.text("•", columnsUsed[0].x + 2, y);
              doc.text(secDesignationLines, (isTypeIII ? columnsUsed[1] : columnsUsed[0]).x + (isTypeIII ? 0 : 8), y);
              doc.text(secLegendLines, legendCol.x, y);
              doc.text(secDimLines, (isTypeIII ? columnsUsed[3] : columnsUsed[2]).x, y);
              doc.text(sec.sheeting || "—", (isTypeIII ? columnsUsed[4] : columnsUsed[3]).x, y);

              // empty cells for qty, sqft, structure, matl, lights, cover
              y += secRowH;
            }
          }
        }

        y = renderMPTSectionSummary(doc, sortedItems, y, pageW);
      } else {
        // Simple fallback (vehicles, lights, additional items, etc.)
        // Use the appropriate column set based on category
        const cols = isVehicle
          ? VEHICLE_COLS
          : isRollingStock
            ? ROLLING_STOCK_COLS
            : isAdditional
              ? ADDITIONAL_COLS
              : SIMPLE_COLS;
        for (const item of items) {
          const meta = tryParseNotes(item.notes);
          const itemLines = doc.splitTextToSize(item.product_name || "", cols[0].w);
          const notesValue = meta?.description || "";
          const notesColumnIndex = cols === SIMPLE_COLS ? 3 : 2;
          const hasNotesColumn = cols.length > notesColumnIndex;
          const notesLines = hasNotesColumn
            ? (notesValue ? doc.splitTextToSize(notesValue, cols[notesColumnIndex].w) : [""])
            : [""];
          const lineCount = hasNotesColumn ? Math.max(itemLines.length, notesLines.length) : itemLines.length;
          const rowH = Math.max(6, lineCount * 4);
          y = checkPageBreak(doc, y, rowH);

          doc.text(itemLines, cols[0].x, y);
          doc.text(String(item.quantity), cols[1].x, y);
          if (cols === SIMPLE_COLS) {
            doc.text(item.unit || "EA", cols[2].x, y);
          }
          if (hasNotesColumn) {
            doc.text(notesLines, cols[notesColumnIndex].x, y);
          }
          y += rowH;

          doc.setDrawColor(220);
          doc.setLineWidth(0.15);
          doc.line(14, y - 2.5, pageW - 14, y - 2.5);
        }
      }

      _activeCols = null;
      y += 8; // slightly more breathing room between categories
    }
  }

  // Schedule of Values
  if (data.sovItems && data.sovItems.length > 0) {
    y += 12;
    y = checkPageBreak(doc, y, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Schedule of Values", 14, y);
    y += 5;

    // SOV Table header
    doc.setFontSize(7);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y - 3.5, pageW - 28, 7, "F");
    doc.text("ITEM #", 14 + 2, y);
    doc.text("DESCRIPTION", 40, y);
    doc.text("UOM", 110, y);
    doc.text("QTY", 125, y);
    doc.text("UNIT PRICE", 140, y);
    doc.text("EXTENDED", 165, y);
    doc.text("RETAINAGE", 185, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (const item of data.sovItems) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(item.itemNumber || "", 14 + 2, y);
      doc.text((item.description || "").substring(0, 35), 40, y);
      doc.text(item.uom || "EA", 110, y);
      doc.text(String(item.quantity), 125, y);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 140, y);
      doc.text(`$${item.extendedPrice.toFixed(2)}`, 165, y);
      const retainageText = item.retainageType === 'percent'
        ? `${item.retainageValue}%`
        : `$${item.retainageValue.toFixed(2)}`;
      doc.text(retainageText, 185, y);
      y += 5;
      // Light grey row divider
      doc.setDrawColor(220);
      doc.setLineWidth(0.15);
      doc.line(14, y - 2.5, pageW - 14, y - 2.5);
    }

    // SOV Totals
    y += 2;
    const totalExtended = data.sovItems.reduce((sum, i) => sum + i.extendedPrice, 0);
    const totalRetainage = data.sovItems.reduce((sum, i) => sum + i.retainageAmount, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Contract Value: $${totalExtended.toFixed(2)}`, 14, y);
    y += 5;
    doc.text(`Total Retainage: $${totalRetainage.toFixed(2)}`, 14, y);
    y += 8;
  }

  // Notes
  if (data.notes) {
    y += 12;
    y = checkPageBreak(doc, y, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(data.notes, pageW - 28);
    doc.text(lines, 14, y);
  }

  // Stamp page numbers on every page: "Page X of Y"
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const pageLabel = `Page ${i} of ${totalPages}`;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(140);
    // Header — top right
    doc.text(pageLabel, pw - 14, 10, { align: "right" });
    // Footer — bottom center
    doc.text(pageLabel, pw / 2, ph - 8, { align: "center" });
    doc.setTextColor(0);
  }

  if (data.returnBytes) {
    return doc.output("arraybuffer") as ArrayBuffer;
  }

  // Download
  const filename = `Takeoff_${data.title.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
  return null;
}
