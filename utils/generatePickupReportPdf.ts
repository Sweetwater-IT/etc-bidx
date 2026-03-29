import jsPDF from "jspdf";

interface PickupReportData {
  woNumber: string;
  woTitle: string;
  jobName: string;
  items: Array<{
    description: string;
    pickup_condition: "good" | "serviceable" | "damaged" | "missing";
    pickup_images: string[];
  }>;
}

const CONDITION_LABELS: Record<PickupReportData["items"][number]["pickup_condition"], string> = {
  good: "Good",
  serviceable: "Serviceable",
  damaged: "Damaged",
  missing: "Missing",
};

export async function generatePickupReportPdf(
  data: PickupReportData
): Promise<ArrayBuffer | null> {
  try {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 36;
    const rowHeight = 24;
    const col1 = margin;
    const col2 = 320;
    const col3 = 470;
    const col4 = pageW - margin;

    const drawHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("PICKUP REPORT", margin, 30);

      doc.setFontSize(11);
      doc.text(`WO# ${data.woNumber || "—"}`, pageW - margin, 30, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(data.woTitle || "Untitled Work Order", pageW / 2, 30, { align: "center" });
      doc.text(`Job: ${data.jobName || "—"}`, margin, 48);

      doc.setDrawColor(180);
      doc.line(margin, 56, pageW - margin, 56);

      doc.setFillColor(240, 240, 240);
      doc.rect(col1, 68, col4 - col1, rowHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("DESCRIPTION", col1 + 8, 84);
      doc.text("CONDITION", col2 + 8, 84);
      doc.text("IMAGE COUNT", col3 + 8, 84);
    };

    drawHeader();

    let y = 92;

    const ensurePageSpace = () => {
      if (y + rowHeight > pageH - margin) {
        doc.addPage();
        drawHeader();
        y = 92;
      }
    };

    if (data.items.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text("No pickup items recorded.", margin, y + 18);
    } else {
      data.items.forEach((item, index) => {
        ensurePageSpace();

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(col1, y, col4 - col1, rowHeight, "F");
        }

        doc.setDrawColor(225);
        doc.rect(col1, y, col4 - col1, rowHeight);
        doc.line(col2, y, col2, y + rowHeight);
        doc.line(col3, y, col3, y + rowHeight);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(item.description || "—", col1 + 8, y + 16, { maxWidth: col2 - col1 - 16 });
        doc.text(CONDITION_LABELS[item.pickup_condition] || item.pickup_condition, col2 + 8, y + 16);
        doc.text(String(item.pickup_images?.length || 0), col3 + 8, y + 16);

        y += rowHeight;
      });
    }

    return doc.output("arraybuffer");
  } catch (error) {
    console.error("Failed to generate pickup report PDF", error);
    return null;
  }
}