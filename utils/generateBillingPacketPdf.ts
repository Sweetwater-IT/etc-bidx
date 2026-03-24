import jsPDF from "jspdf";

interface BillingPacketData {
  // WO info
  woNumber: string;
  woTitle: string;
  woDescription: string;
  woNotes: string;
  etcAssignedTo: string;
  contractedOrAdditional: string;
  customerPocPhone: string;
  // Job info
  projectName: string;
  etcJobNumber: string;
  customerName: string;
  customerJobNumber: string;
  customerPM: string;
  projectOwner: string;
  contractNumber: string;
  county: string;
  etcBranch: string;
  etcProjectManager: string;
  installDate: string;
  pickupDate: string;
  // Items
  items: {
    item_number: string;
    description: string;
    uom: string;
    contract_quantity: number;
    work_order_quantity: number;
  }[];
  // SOV items
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
  // Dispatch/signature
  crewNotes: string;
  customerNotOnSite: boolean;
  customerSignatureName: string;
  signedAt: string;
  // Optional: return bytes instead of saving
  returnBytes?: boolean;
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

function drawBillingTableHeader(
  doc: jsPDF,
  columns: { label: string; x: number; w: number; align?: "left" | "right" }[],
  y: number,
  pageW: number,
  marginLeft: number
): number {
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 240, 240);
  doc.rect(marginLeft, y - 3.5, pageW - 28, 7, "F");

  for (const col of columns) {
    if (col.align === "right") {
      doc.text(col.label, col.x + col.w, y, { align: "right" });
    } else {
      doc.text(col.label, col.x, y);
    }
  }

  return y + 7;
}

function drawProjectFooter(
  doc: jsPDF,
  items: Array<{ label: string; value?: string | null }>,
  pageW: number,
  pageH: number
) {
  const footerX = 14;
  const footerY = pageH - 16;
  const footerW = pageW - 28;
  const footerH = 5.5;
  const footerItems = items.slice(0, 8);
  const colW = footerW / footerItems.length;
  const fitInline = (label: string, value?: string | null) => {
    const [line] = doc.splitTextToSize(`${label}: ${(value || "—").toString()}`, colW - 2);
    return line || `${label}: —`;
  };

  doc.setDrawColor(210);
  doc.setLineWidth(0.2);
  doc.rect(footerX, footerY, footerW, footerH, "S");

  for (let i = 1; i < footerItems.length; i++) {
    const x = footerX + colW * i;
    doc.line(x, footerY, x, footerY + footerH);
  }
  footerItems.forEach((item, index) => {
    const x = footerX + colW * index + 1;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.2);
    doc.setTextColor(80);
    doc.text(fitInline(item.label, item.value), x, footerY + 3.6);
  });
  doc.setTextColor(0);
}

function formatWorkOrderNumber(woNumber?: string | number | null): string {
  if (woNumber === null || woNumber === undefined || woNumber === "") return "";
  const asString = String(woNumber).trim();
  const asNumber = Number(asString);
  if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) {
    return String(Math.trunc(asNumber)).padStart(3, "0");
  }
  return asString;
}

async function loadPublicLogoDataUrl(path: string): Promise<string> {
  if (typeof window === "undefined") {
    const { readFile } = await import("fs/promises");
    const pathModule = await import("path");
    const filePath = pathModule.join(process.cwd(), "public", path.replace(/^\//, ""));
    const file = await readFile(filePath);
    return `data:image/jpeg;base64,${file.toString("base64")}`;
  }

  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch logo image from ${path}: ${response.status}`);
  }

  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read logo blob"));
    reader.readAsDataURL(blob);
  });

  return dataUrl;
}

export async function generateBillingPacketPdf(data: BillingPacketData): Promise<ArrayBuffer | null> {
  const doc = new jsPDF({ orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const ml = 14;

  // ── ETC Logo ──
  try {
    const logo = await loadPublicLogoDataUrl("/logo.jpg");
    const logoH = 12;
    const logoW = logoH * (1152 / 648);
    doc.addImage(logo, "JPEG", ml, 6, logoW, logoH);
  } catch (error) {
    console.error("[generateBillingPacketPdf] Failed to load sidebar logo", error);
  }
  // ── Title line ──
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  const formattedWoNumber = formatWorkOrderNumber(data.woNumber);
  const woTitle = formattedWoNumber ? `Work Order ${formattedWoNumber}` : "Work Order";
  doc.text(woTitle, pageW / 2, 14, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  const genText = `Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
  doc.text(genText, pageW / 2, 19, { align: "center" });
  doc.setTextColor(0);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(ml, 21, pageW - ml, 21);

  // ── Project info grid (matches takeoff layout) ──
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

  const fmtDate = (d?: string | null) => {
    if (!d) return "—";
    const dt = new Date(d + "T00:00:00");
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, "0");
    const m = dt.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const yy = String(dt.getFullYear()).slice(-2);
    return `${dd}-${m}-${yy}`;
  };

  // Row 1
  addField(doc, "JOB NAME", data.projectName, col1X, y);
  addField(doc, "WO TITLE", data.woTitle, col2X, y);
  addField(doc, "TYPE", data.contractedOrAdditional === "additional" ? "Additional Work" : "Contracted Work", col3X, y);
  y += rowH;
  drawRowDivider(y - 2);

  // Row 2
  addField(doc, "PROJECT OWNER", data.projectOwner || "—", col1X, y);
  addField(doc, "OWNER CONTRACT #", data.contractNumber || "—", col2X, y);
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
  addField(doc, "CUSTOMER POC", [data.customerPM, data.customerPocPhone].filter(Boolean).join(" · ") || "—", col3X, y);
  y += rowH;
  drawRowDivider(y - 2);

  // Row 5: Dates (no needed-by date)
  addField(doc, "INSTALL DATE", fmtDate(data.installDate), col1X, y);
  addField(doc, "PICKUP DATE", fmtDate(data.pickupDate), col2X, y);
  addField(doc, "ETC ASSIGNED TO", data.etcAssignedTo || "—", col3X, y);
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

  y += 2;

  // Billing Line Items
  y += 4;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Billing Line Items", ml, y);
  y += 5;

  const billingTableLeft = ml;
  const billingCols = [
    { label: "ITEM #", x: billingTableLeft + 2, w: 24 },
    { label: "DESCRIPTION", x: billingTableLeft + 26, w: 76 },
    { label: "UOM", x: billingTableLeft + 102, w: 14 },
    { label: "CONTRACT QTY", x: billingTableLeft + 116, w: 30, align: "right" as const },
    { label: "WORK ORDER QTY", x: billingTableLeft + 146, w: 36, align: "right" as const },
  ];

  y = drawBillingTableHeader(doc, billingCols, y, pageW, ml);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const item of data.items) {
    const itemNumberLines = doc.splitTextToSize(item.item_number || "", billingCols[0].w - 2);
    const descriptionLines = doc.splitTextToSize(item.description || "", billingCols[1].w - 2);
    const rowLineCount = Math.max(itemNumberLines.length, descriptionLines.length, 1);
    const rowH = Math.max(6, rowLineCount * 4);

    if (y > 270 - rowH) {
      doc.addPage();
      y = 20;
      y = drawBillingTableHeader(doc, billingCols, y, pageW, ml);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    }

    doc.text(itemNumberLines, billingCols[0].x, y);
    doc.text(descriptionLines, billingCols[1].x, y);
    doc.text(item.uom || "EA", billingCols[2].x, y);
    doc.text(String(item.contract_quantity), billingCols[3].x + billingCols[3].w, y, { align: "right" });
    doc.text(String(item.work_order_quantity), billingCols[4].x + billingCols[4].w, y, { align: "right" });
    y += rowH;
    // Light grey row divider
    doc.setDrawColor(220);
    doc.setLineWidth(0.15);
    doc.line(ml, y - 2.5, pageW - ml, y - 2.5);
  }

  // Schedule of Values
  if (data.sovItems && data.sovItems.length > 0) {
    y += 12;
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Schedule of Values", ml, y);
    y += 5;

    // SOV Table header
    doc.setFontSize(7);
    doc.setFillColor(240, 240, 240);
    doc.rect(ml, y - 3.5, pageW - 28, 7, "F");
    doc.text("ITEM #", ml + 2, y);
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
      doc.text(item.itemNumber || "", ml + 2, y);
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
      doc.line(ml, y - 2.5, pageW - ml, y - 2.5);
    }

    // SOV Totals
    y += 2;
    const totalExtended = data.sovItems.reduce((sum, i) => sum + i.extendedPrice, 0);
    const totalRetainage = data.sovItems.reduce((sum, i) => sum + i.retainageAmount, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Contract Value: $${totalExtended.toFixed(2)}`, ml, y);
    y += 5;
    doc.text(`Total Retainage: $${totalRetainage.toFixed(2)}`, ml, y);
    y += 8;
  }





  // Description of Work (after notes sections)
  if (data.woDescription) {
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Description of Work", ml, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const scopeLines = doc.splitTextToSize(data.woDescription, pageW - 28);
    doc.text(scopeLines, ml, y);
    y += scopeLines.length * 4 + 4;
  }

  // Notes
  if (data.woNotes) {
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Work Order Notes", ml, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(data.woNotes, pageW - 28);
    doc.text(lines, ml, y);
    y += lines.length * 4 + 4;
  }

  // Crew notes
  if (data.crewNotes) {
    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Field Crew Notes", ml, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(data.crewNotes, pageW - 28);
    doc.text(lines, ml, y);
    y += lines.length * 4 + 4;
  }

  // Page numbers + fixed Customer Acknowledgment on last page
  const totalPages = doc.getNumberOfPages();
  const pageH = doc.internal.pageSize.getHeight();
  const sigBlockTop = pageH - 66; // leave room for the boxed project footer and page number
  const footerItems = [
    { label: "Job Name", value: data.projectName },
    { label: "Project Owner", value: data.projectOwner },
    { label: "Owner Job #", value: data.customerJobNumber },
    { label: "County", value: data.county },
    { label: "ETC PM", value: data.etcProjectManager },
    { label: "ETC Job #", value: data.etcJobNumber },
    { label: "Customer", value: data.customerName },
    { label: "Customer Job #", value: data.customerJobNumber },
  ];

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    const label = `Page ${i} of ${totalPages}`;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(140);
    drawProjectFooter(doc, footerItems, pw, ph);
    doc.text(label, pw / 2, ph - 18.5, { align: "center" });
    doc.setTextColor(0);

    // Signature block only on last page
    if (i === totalPages) {
      const sy = sigBlockTop;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(ml, sy, pw - 28, 38);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Customer Acknowledgment", ml + 4, sy + 6);

      if (data.customerNotOnSite) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.text("Customer was not on site at time of service.", ml + 4, sy + 14);
      } else {
        const fieldY = sy + 16;
        const lineStartX = ml + 30;
        const lineEndX = pw - ml - 4;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        // Printed Name
        doc.text("Printed Name:", ml + 4, fieldY);
        doc.setLineWidth(0.3);
        doc.line(lineStartX, fieldY + 1, lineEndX, fieldY + 1);
        if (data.customerSignatureName) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(data.customerSignatureName, lineStartX + 2, fieldY);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
        }

        // Signature
        const sigFieldY = fieldY + 10;
        doc.text("Signature:", ml + 4, sigFieldY);
        doc.line(lineStartX, sigFieldY + 1, lineEndX, sigFieldY + 1);

        // Date
        const dateFieldY = sigFieldY + 10;
        doc.text("Date:", ml + 4, dateFieldY);
        doc.line(lineStartX, dateFieldY + 1, lineEndX, dateFieldY + 1);
        if (data.signedAt) {
          doc.text(new Date(data.signedAt).toLocaleString(), lineStartX + 2, dateFieldY);
        }
      }
    }
  }

  const filename = `BillingPacket_${data.woNumber || "WO"}_${new Date().toISOString().split("T")[0]}.pdf`;

  if (data.returnBytes) {
    return doc.output("arraybuffer") as ArrayBuffer;
  }

  doc.save(filename);
  return null;
}
