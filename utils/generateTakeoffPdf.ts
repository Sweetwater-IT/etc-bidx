import jsPDF from "jspdf";

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
  signDescription?: string;
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

// MPT columns: [#], Designation, Legend, Dimensions, Sheeting, Qty, Structure, Lights, Cover
// Type III has # column hanging left; all other columns align with non-Type-III
// Landscape page width ~297mm; usable area 14..283 = 269mm
const MPT_COLS_ORDERED = [
  { label: "LOAD", x: 14, w: 8 },
  { label: "DESIG", x: 22, w: 22 },
  { label: "LEGEND", x: 44, w: 96 },
  { label: "DIM", x: 140, w: 18 },
  { label: "SHEET", x: 158, w: 14 },
  { label: "QTY", x: 172, w: 8 },
  { label: "STRUCTURE", x: 180, w: 38 },
  { label: "MATL", x: 218, w: 10 },
  { label: "LIGHTS", x: 228, w: 8 },
  { label: "COVER", x: 236, w: 12 },
];

const MPT_COLS = [
  { label: "DESIG", x: 22, w: 22 },
  { label: "LEGEND", x: 44, w: 100 },
  { label: "DIM", x: 144, w: 18 },
  { label: "SHEET", x: 162, w: 16 },
  { label: "QTY", x: 178, w: 12 },
  { label: "STRUCTURE", x: 190, w: 45 },
  { label: "MATL", x: 235, w: 16 },
  { label: "LIGHTS", x: 251, w: 12 },
  { label: "COVER", x: 263, w: 16 },
];

const PERM_COLS = [
  { label: "DESIGNATION", x: 14, w: 30 },
  { label: "LEGEND", x: 44, w: 60 },
  { label: "DIMENSIONS", x: 104, w: 24 },
  { label: "SHEETING", x: 128, w: 18 },
  { label: "QTY", x: 146, w: 12 },
  { label: "POST SIZE", x: 158, w: 22 },
  { label: "PLAN SHEET", x: 180, w: 24 },
  { label: "SQ FT", x: 204, w: 18 },
  { label: "STRUCTURE", x: 222, w: 24 },
  { label: "SUBSTRATE", x: 246, w: 20 },
  { label: "MATL", x: 266, w: 16 },
];

// Simple columns for Additional Items, Vehicles, Rolling Stock — landscape
const SIMPLE_COLS = [
  { label: "ITEM", x: 14, w: 110 },
  { label: "QTY", x: 124, w: 20 },
  { label: "UNIT", x: 144, w: 24 },
  { label: "NOTES", x: 168, w: 115 },
];

function isTypeIIICategory(cat: string): boolean {
  return cat.toLowerCase().includes("type iii");
}

function isMPTSignCategory(cat: string): boolean {
  return cat.toLowerCase().includes("trailblazer") ||
    cat.toLowerCase().includes("h-stand") ||
    cat.toLowerCase().includes("sign stand") ||
    cat.toLowerCase().includes("type iii");
}

function isPermSignCategory(cat: string): boolean {
  return cat.toLowerCase().includes("perm sign");
}

function isSimpleCategory(cat: string): boolean {
  return !isMPTSignCategory(cat) && !isPermSignCategory(cat);
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

export function generateTakeoffPdf(data: TakeoffPdfData): ArrayBuffer | null {
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
    if (data.workOrderNumber) {
      doc.setFontSize(10);
      doc.text(`WO# ${data.workOrderNumber}`, pageW - 14, 14, { align: "right" });
    }
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
  if (data.workOrderNumber) {
    doc.setFontSize(10);
    doc.text(`WO# ${data.workOrderNumber}`, pageW - 14, 14, { align: "right" });
  }
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

      const isTypeIII = isTypeIIICategory(category);
      const isMPT = isMPTSignCategory(category);
      const isPerm = isPermSignCategory(category);

      if (isMPT) {
        const cols = isTypeIII ? MPT_COLS_ORDERED : MPT_COLS;
        _activeCols = cols;
        _activePageW = pageW;
        y = drawTableHeader(doc, cols, y, pageW);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        // Sort Type III items by loadOrder if available
        const sortedItems = isTypeIII
          ? [...items].sort((a, b) => {
              const metaA = tryParseNotes(a.notes);
              const metaB = tryParseNotes(b.notes);
              return (metaA?.loadOrder ?? 999) - (metaB?.loadOrder ?? 999);
            })
          : items;

        for (let idx = 0; idx < sortedItems.length; idx++) {
          const item = sortedItems[idx];
          y = checkPageBreak(doc, y);
          const meta = tryParseNotes(item.notes);

          if (isTypeIII) {
            doc.setFont("helvetica", "normal");
            const desigText = cleanProductName(item.product_name || "", item.category).substring(0, 22);
            const legendText = meta?.signLegend || "";
            const legendLines = doc.splitTextToSize(legendText, MPT_COLS_ORDERED[2].w);
            const rowH = Math.max(6, legendLines.length * 3.5);
            y = checkPageBreak(doc, y, rowH);
            doc.text(String(idx + 1), MPT_COLS_ORDERED[0].x, y);
            doc.text(desigText, MPT_COLS_ORDERED[1].x, y);
            doc.text(legendLines, MPT_COLS_ORDERED[2].x, y);
            doc.text(meta?.dimensionLabel || "—", MPT_COLS_ORDERED[3].x, y);
            doc.text(meta?.sheeting || "—", MPT_COLS_ORDERED[4].x, y);
            doc.text(String(item.quantity), MPT_COLS_ORDERED[5].x, y);
            doc.text(abbreviateStructure(meta?.structureType || "—").substring(0, 22), MPT_COLS_ORDERED[6].x, y);
            doc.text((item.material || "").substring(0, 8), MPT_COLS_ORDERED[7].x + MPT_COLS_ORDERED[7].w, y, { align: "right" });
            doc.text(meta?.bLights && meta.bLights !== "none" ? meta.bLights : "", MPT_COLS_ORDERED[8].x + MPT_COLS_ORDERED[8].w, y, { align: "right" });
            doc.text(meta?.cover ? "Y" : "", MPT_COLS_ORDERED[9].x + MPT_COLS_ORDERED[9].w, y, { align: "right" });
            y += rowH;
            // Light grey separator line
            doc.setDrawColor(220);
            doc.setLineWidth(0.15);
            doc.line(14, y - 2.5, pageW - 14, y - 2.5);
            // Secondary signs
            if (meta?.secondarySigns?.length) {
              for (const sec of meta.secondarySigns) {
                const secDesigText = (sec.signDesignation || "").substring(0, 20);
                const secLegendText = sec.signLegend || "";
                const secLegendLines = doc.splitTextToSize(secLegendText, MPT_COLS_ORDERED[2].w);
                const secRowH = Math.max(6, secLegendLines.length * 3.5);
                y = checkPageBreak(doc, y, secRowH);
                doc.setFillColor(248, 248, 250);
                doc.rect(14, y - 3.5, pageW - 28, secRowH, "F");
                doc.setDrawColor(220);
                doc.line(14, y - 3.5, 14, y + secRowH - 3.5);
                doc.setDrawColor(200);
                doc.setFont("helvetica", "italic");
                doc.setFontSize(7);
                doc.text("•", MPT_COLS_ORDERED[0].x + 2, y);
                doc.text(secDesigText, MPT_COLS_ORDERED[1].x, y);
                doc.text(secLegendLines, MPT_COLS_ORDERED[2].x, y);
                doc.text(sec.dimensionLabel || "—", MPT_COLS_ORDERED[3].x, y);
                doc.text(sec.sheeting || "—", MPT_COLS_ORDERED[4].x, y);
                doc.text("", MPT_COLS_ORDERED[5].x, y);
                doc.text("", MPT_COLS_ORDERED[6].x, y);
                doc.text("", MPT_COLS_ORDERED[7].x, y);
                doc.text("", MPT_COLS_ORDERED[8].x, y);
                doc.text("", MPT_COLS_ORDERED[9].x, y);
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                y += secRowH;
              }
            }
          } else {
            doc.setFont("helvetica", "normal");
            const desigText = cleanProductName(item.product_name || "", item.category).substring(0, 22);
            const legendText = meta?.signLegend || "";
            const legendLines = doc.splitTextToSize(legendText, MPT_COLS[1].w);
            const rowH = Math.max(6, legendLines.length * 3.5);
            y = checkPageBreak(doc, y, rowH);
            doc.text(desigText, MPT_COLS[0].x, y);
            doc.text(legendLines, MPT_COLS[1].x, y);
            doc.text(meta?.dimensionLabel || "—", MPT_COLS[2].x, y);
            doc.text(meta?.sheeting || "—", MPT_COLS[3].x, y);
            doc.text(String(item.quantity), MPT_COLS[4].x, y);
            doc.text(abbreviateStructure(meta?.structureType || "—").substring(0, 22), MPT_COLS[5].x, y);
            doc.text((item.material || "").substring(0, 8), MPT_COLS[6].x + MPT_COLS[6].w, y, { align: "right" });
            doc.text(meta?.bLights && meta.bLights !== "none" ? meta.bLights : "", MPT_COLS[7].x + MPT_COLS[7].w, y, { align: "right" });
            doc.text(meta?.cover ? "Y" : "", MPT_COLS[8].x + MPT_COLS[8].w, y, { align: "right" });
            y += rowH;
            // Light grey separator line
            doc.setDrawColor(220);
            doc.setLineWidth(0.15);
            doc.line(14, y - 2.5, pageW - 14, y - 2.5);
            // Secondary signs
            if (meta?.secondarySigns?.length) {
              for (const sec of meta.secondarySigns) {
                const secDesigText = (sec.signDesignation || "").substring(0, 20);
                const secLegendText = sec.signLegend || "";
                const secLegendLines = doc.splitTextToSize(secLegendText, MPT_COLS[1].w);
                const secRowH = Math.max(6, secLegendLines.length * 3.5);
                y = checkPageBreak(doc, y, secRowH);
                doc.setFillColor(248, 248, 250);
                doc.rect(14, y - 3.5, pageW - 28, secRowH, "F");
                doc.setDrawColor(220);
                doc.line(14, y - 3.5, 14, y + secRowH - 3.5);
                doc.setDrawColor(200);
                doc.setFont("helvetica", "italic");
                doc.setFontSize(7);
                doc.text("•", MPT_COLS[0].x + 2, y);
                doc.text(secDesigText, MPT_COLS[0].x, y);
                doc.text(secLegendLines, MPT_COLS[1].x, y);
                doc.text(sec.dimensionLabel || "—", MPT_COLS[2].x, y);
                doc.text(sec.sheeting || "—", MPT_COLS[3].x, y);
                doc.text("", MPT_COLS[4].x, y);
                doc.text("", MPT_COLS[5].x, y);
                doc.text("", MPT_COLS[6].x, y);
                doc.text("", MPT_COLS[7].x, y);
                doc.text("", MPT_COLS[8].x, y);
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                y += secRowH;
              }
            }
          }

        }

        // Section summary
        y = renderMPTSectionSummary(doc, sortedItems, y, pageW);
      } else if (isPerm) {
        _activeCols = PERM_COLS;
        _activePageW = pageW;
        y = drawTableHeader(doc, PERM_COLS, y, pageW);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        for (const item of items) {
          y = checkPageBreak(doc, y);
          const meta = tryParseNotes(item.notes);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          const permLegendText = meta?.signLegend || "";
          const permLegendColW = PERM_COLS[1].w;
          const permLegendLines = doc.splitTextToSize(permLegendText, permLegendColW);
          const permRowH = Math.max(6, permLegendLines.length * 3.5);
          y = checkPageBreak(doc, y, permRowH);
          doc.text((item.product_name || "").substring(0, 26), PERM_COLS[0].x, y);
          doc.text(permLegendLines, PERM_COLS[1].x, y);
          doc.text(meta?.dimensionLabel || "—", PERM_COLS[2].x, y);
          doc.text(meta?.sheeting || "—", PERM_COLS[3].x, y);
          doc.text(String(item.quantity), PERM_COLS[4].x, y);
          doc.text(meta?.postSize || "—", PERM_COLS[5].x, y);
          const planSheet = meta?.planSheetNum ? `${meta.planSheetNum}${meta.planSheetTotal ? ` of ${meta.planSheetTotal}` : ""}` : "—";
          doc.text(planSheet, PERM_COLS[6].x, y);
          doc.text(meta?.totalSqft ? String(Math.round(meta.totalSqft * 100) / 100) : "—", PERM_COLS[7].x, y);
          doc.text(meta?.structure || "—", PERM_COLS[8].x, y);
          doc.text(meta?.substrate || "—", PERM_COLS[9].x, y);
          doc.text((item.material || "").substring(0, 8), PERM_COLS[10].x, y);
          y += permRowH;
          // Light grey separator line
          doc.setDrawColor(220);
          doc.setLineWidth(0.15);
          doc.line(14, y - 2.5, pageW - 14, y - 2.5);

          // Secondary signs
          if (meta?.secondarySigns?.length) {
            for (const sec of meta.secondarySigns) {
              y = checkPageBreak(doc, y);
              doc.setFillColor(248, 248, 250);
              doc.rect(14, y - 3.5, pageW - 28, 6, "F");
              doc.setDrawColor(220);
              doc.line(14, y - 3.5, 14, y + 2.5);
              doc.setDrawColor(200);
              doc.setFont("helvetica", "italic");
              doc.setFontSize(7);
              doc.text("•", PERM_COLS[0].x + 2, y);
              doc.text((sec.signDesignation || "").substring(0, 24), PERM_COLS[0].x + 8, y);
              doc.text((sec.signLegend || "").substring(0, 44), PERM_COLS[1].x, y);
              doc.text(sec.dimensionLabel || "—", PERM_COLS[2].x, y);
              doc.text(sec.sheeting || "—", PERM_COLS[3].x, y);
              doc.text("", PERM_COLS[4].x, y);
              doc.text("", PERM_COLS[5].x, y);
              doc.text("", PERM_COLS[6].x, y);
              doc.text(sec.sqft ? String(sec.sqft) : "—", PERM_COLS[7].x, y);
              doc.text("", PERM_COLS[8].x, y);
              doc.setFontSize(8);
              doc.setFont("helvetica", "normal");
              y += 6;
            }
          }
        }

        // Section summary for perm signs
        y = renderPermSectionSummary(doc, items, y, pageW);
      } else {
        _activeCols = SIMPLE_COLS;
        _activePageW = pageW;
        y = drawTableHeader(doc, SIMPLE_COLS, y, pageW);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        for (const item of items) {
          // Wrap text for simple items if needed
          const itemColW = SIMPLE_COLS[0].w;
          const notesColW = SIMPLE_COLS[3].w;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          const itemLines = doc.splitTextToSize(item.product_name || "", itemColW);
          const meta = tryParseNotes(item.notes);
          const notesText = meta ? "" : (item.notes || "");
          const notesLines = notesText ? doc.splitTextToSize(notesText, notesColW) : [""];
          const lineCount = Math.max(itemLines.length, notesLines.length);
          const rowH = Math.max(6, lineCount * 4);
          y = checkPageBreak(doc, y, rowH);
          doc.text(itemLines, SIMPLE_COLS[0].x, y);
          doc.text(String(item.quantity), SIMPLE_COLS[1].x, y);
          doc.text(item.unit || "EA", SIMPLE_COLS[2].x, y);
          doc.text(notesLines, SIMPLE_COLS[3].x, y);
          y += rowH;
        }
      }

      _activeCols = null; // clear after category
      y += 4; // spacing between categories
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
