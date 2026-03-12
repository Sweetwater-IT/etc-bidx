import jsPDF from "jspdf";

interface PickupReportData {
  woNumber: string;
  woTitle: string;
  jobName: string;
  items: Array<{
    description: string;
    pickup_condition: 'good' | 'serviceable' | 'damaged' | 'missing';
    pickup_images: string[];
  }>;
}

export async function generatePickupReportPdf(data: PickupReportData): Promise<ArrayBuffer | null> {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PICKUP REPORT", 14, 14);
  doc.setFontSize(12);
  doc.text(`WO# ${data.woNumber}`, pageW - 14, 14, { align: "right" });
  doc.setFontSize(10);
  doc.text(data.woTitle, pageW / 2, 14, { align: "center" });
  doc.line(14, 17, pageW - 14, 17);

  let y = 25;

  // Job
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("JOB", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.jobName, 14, y + 5);
  y += 15;

  // Table header
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 240, 240);
  doc.rect(14