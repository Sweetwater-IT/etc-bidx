import jsPDF from "jspdf";

interface ReturnPdfItem {
  product_name: string;
  category: string;
  quantity: number;
  components: { key: string; label: string; condition: string; photoUrl?: string }[];
}

interface ReturnTakeoffPdfData {
  title: string;
  workType: string;
  projectName?: string;
  etcJobNumber?: string;
  etcBranch?: string;
  etcProjectManager?: string;
  customerName?: string;
  customerJobNumber?: string;
  projectOwner?: string;
  county?: string;
  installDate?: string | null;
  pickupDate?: string | null;
  customerPM?: string;
  assignedTo?: string;
  contractedOrAdditional?: string;
  customerPocPhone?: string;
  items: ReturnPdfItem[];
}

const CONDITION_LABELS: Record<string, string> = {
  damaged: "DAMAGED",
  missing: "MISSING",
  on_job: "ON JOB",
  ok: "OK",
};

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt.getTime())) return d;
  const dd = String(dt.getDate()).padStart(2, "0");
  const m = dt.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const yy = String(dt.getFullYear()).slice(-2);
  return `${dd}-${m}-${yy}`;
}

function addField(doc: jsPDF, label: string, value: string, x: number, y: number) {
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120);
  doc.text(label, x, y);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(value || "—", x, y + 4);
}

/** Get structure label from item metadata */
function getStructureLabel(item: ReturnPdfItem): string {
  const name = item.product_name.toUpperCase();
  if (name.includes("TYPE III") || name.includes("TYPE 3") || name.includes("BARRICADE")) {
    return "Barricade";
  }
  // Try to find structure component
  const structComp = item.components.find((c) => c.key === "structure");
  if (structComp) return "Post";
  return "—";
}

/** Determine which component columns are used across all items */
function getUsedCompColumns(items: ReturnPdfItem[]): string[] {
  const used = new Set<string>();
  for (const item of items) {
    for (const comp of item.components) {
      used.add(comp.key);
    }
  }
  return ["sign", "structure", "lights"].filter((k) => used.has(k));
}

const COMP_COL_LABELS: Record<string, string> = {
  sign: "SIGN",
  structure: "STRUCTURE",
  lights: "LIGHTS",
};

export async function generateReturnTakeoffPdf(data: ReturnTakeoffPdfData) {
  const doc = new jsPDF({ orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const ml = 14;

  // ── ETC Logo (top-right) ──
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = "/logo.jpg";
    });
    const logoH = 12;
    const logoW = logoH * (img.naturalWidth / img.naturalHeight);
    doc.addImage(img, "JPEG", pageW - ml - logoW, 6, logoW, logoH);
  } catch {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 120);
    doc.text("ETC", pageW - ml, 14, { align: "right" });
    doc.setTextColor(0);
  }

  // ── Title ──
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("RETURN INVENTORY REPORT", ml, 14);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    pageW / 2,
    19,
    { align: "center" }
  );
  doc.setTextColor(0);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(ml, 21, pageW - ml, 21);

  // ── Admin header grid (matches Work Order PDF exactly) ──
  const infoStartY = 24;
  let y = infoStartY + 3;
  const rowH = 9.5;
  const infoLeft = ml;
  const infoW = pageW - 28;
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
  addField(doc, "TYPE", (data.contractedOrAdditional === "additional" ? "Additional Work" : "Contracted Work"), col3X, y);
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

  // Row 5
  addField(doc, "INSTALL DATE", fmtDate(data.installDate), col1X, y);
  addField(doc, "PICKUP DATE", fmtDate(data.pickupDate), col2X, y);
  addField(doc, "ETC ASSIGNED TO", data.assignedTo || "—", col3X, y);
  y += rowH - 2;

  drawColDividers(infoStartY, y);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(infoLeft, infoStartY, infoW, y - infoStartY);

  y += 10;

  // ── Summary counts ──
  let damagedCount = 0;
  let missingCount = 0;
  let onJobCount = 0;
  let okCount = 0;
  for (const item of data.items) {
    for (const c of item.components) {
      if (c.condition === "damaged") damagedCount++;
      else if (c.condition === "missing") missingCount++;
      else if (c.condition === "on_job") onJobCount++;
      else if (c.condition === "ok") okCount++;
    }
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  const summaryParts: string[] = [];
  summaryParts.push(`OK: ${okCount}`);
  if (damagedCount > 0) summaryParts.push(`Damaged: ${damagedCount}`);
  if (missingCount > 0) summaryParts.push(`Missing: ${missingCount}`);
  if (onJobCount > 0) summaryParts.push(`On Job: ${onJobCount}`);
  doc.text(`Summary:  ${summaryParts.join("   |   ")}`, ml, y);
  y += 8;

  // ── Determine which component columns are in use ──
  const compCols = getUsedCompColumns(data.items);

  // ── Table layout matching UI: #, Item, Structure, Qty, [Sign], [Structure], [Lights] ──
  const tableLeft = 14;
  const tableRight = pageW - 14;
  const tableW = tableRight - tableLeft;

  // Fixed widths for static columns
  const numW = 8;
  const qtyW = 14;
  const structInfoW = 28;
  // Remaining space for Item + component columns
  const compColW = compCols.length > 0 ? 28 : 0;
  const totalCompW = compColW * compCols.length;
  const itemW = tableW - numW - structInfoW - qtyW - totalCompW;

  // Column X positions
  const colNum = tableLeft;
  const colItem = colNum + numW;
  const colStructInfo = colItem + itemW;
  const colQty = colStructInfo + structInfoW;
  const compStartX = colQty + qtyW;

  const drawTableHeader = () => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(240, 240, 240);
    doc.rect(tableLeft, y - 3.5, tableW, 7, "F");
    doc.setTextColor(80);
    doc.text("#", colNum + 1, y);
    doc.text("ITEM", colItem + 1, y);
    doc.text("STRUCT.", colStructInfo + 1, y);
    doc.text("QTY", colQty + 1, y);
    for (let i = 0; i < compCols.length; i++) {
      doc.text(COMP_COL_LABELS[compCols[i]], compStartX + i * compColW + 1, y);
    }
    doc.setTextColor(0);
    y += 7;
  };

  drawTableHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  for (let idx = 0; idx < data.items.length; idx++) {
    const item = data.items[idx];

    if (y > pageH - 20) {
      doc.addPage();
      y = 20;
      drawTableHeader();
    }

    // Row separator
    doc.setDrawColor(230);
    doc.setLineWidth(0.15);
    doc.line(tableLeft, y - 3, tableRight, y - 3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0);

    // Row number
    doc.setFont("helvetica", "bold");
    doc.text(String(idx + 1), colNum + 1, y);
    doc.setFont("helvetica", "normal");

    // Item name (truncate if needed)
    const nameLines = doc.splitTextToSize(item.product_name, itemW - 4);
    doc.text(nameLines[0], colItem + 1, y);

    // Structure type
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(getStructureLabel(item), colStructInfo + 1, y);
    doc.setFontSize(8);
    doc.setTextColor(0);

    // Quantity
    doc.text(String(item.quantity), colQty + 1, y);

    // Component condition columns
    const itemCompKeys = item.components.map((c) => c.key);
    for (let ci = 0; ci < compCols.length; ci++) {
      const compKey = compCols[ci];
      const cx = compStartX + ci * compColW + 1;

      if (!itemCompKeys.includes(compKey)) {
        // N/A
        doc.setFontSize(6);
        doc.setTextColor(180);
        doc.text("N/A", cx, y);
        doc.setFontSize(8);
        doc.setTextColor(0);
        continue;
      }

      const comp = item.components.find((c) => c.key === compKey)!;
      const condLabel = CONDITION_LABELS[comp.condition] || comp.condition;

      if (comp.condition === "damaged") doc.setTextColor(180, 30, 30);
      else if (comp.condition === "missing") doc.setTextColor(180, 120, 0);
      else if (comp.condition === "on_job") doc.setTextColor(30, 90, 180);
      else if (comp.condition === "ok") doc.setTextColor(30, 130, 60);

      doc.setFont("helvetica", "bold");
      doc.text(condLabel, cx, y);
      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
    }

    y += 6;
  }

  // ── Signature block ──
  if (y > pageH - 50) {
    doc.addPage();
    y = 20;
  }
  y += 10;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Returned By", ml, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  doc.text("Printed Name:", ml, y);
  doc.line(45, y, 130, y);
  y += 10;
  doc.text("Signature:", ml, y);
  doc.line(45, y, 130, y);
  y += 10;
  doc.text("Date:", ml, y);
  doc.line(45, y, 130, y);

  // ── Photo Appendix ──
  const photoEntries: { itemName: string; compLabel: string; condition: string; url: string }[] = [];
  for (const item of data.items) {
    for (const comp of item.components) {
      if (comp.photoUrl) {
        photoEntries.push({
          itemName: item.product_name,
          compLabel: COMP_COL_LABELS[comp.key] || comp.label,
          condition: CONDITION_LABELS[comp.condition] || comp.condition,
          url: comp.photoUrl,
        });
      }
    }
  }

  if (photoEntries.length > 0) {
    doc.addPage();
    y = 20;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("PHOTO DOCUMENTATION", ml, y);
    y += 4;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(ml, y, pageW - ml, y);
    y += 8;

    const photoW = 80;
    const photoH = 60;

    for (const entry of photoEntries) {
      if (y + photoH + 18 > pageH - 10) {
        doc.addPage();
        y = 20;
      }

      // Caption
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(`${entry.itemName}  —  ${entry.compLabel}  (${entry.condition})`, ml, y);
      y += 5;

      // Try to load and embed the image
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = entry.url;
        });
        const aspect = img.naturalWidth / img.naturalHeight;
        let drawW = photoW;
        let drawH = photoW / aspect;
        if (drawH > photoH) {
          drawH = photoH;
          drawW = photoH * aspect;
        }
        doc.addImage(img, "JPEG", ml, y, drawW, drawH);
        y += drawH + 8;
      } catch {
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text("[Photo could not be loaded]", ml, y + 4);
        doc.setTextColor(0);
        y += 12;
      }
    }
  }

  doc.save(`Return_Inventory_${data.etcJobNumber || "report"}.pdf`);
}
