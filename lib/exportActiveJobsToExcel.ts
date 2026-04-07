import type { ActiveJob } from "@/data/active-jobs";

function escapeCsvValue(value: string | null | undefined) {
  const normalized = value ?? "";
  const escaped = String(normalized).replace(/"/g, '""');
  return `"${escaped}"`;
}

function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

function getCountyValue(job: ActiveJob) {
  if (typeof job.county === "string") return job.county;
  return job.county?.main || "";
}

export async function exportActiveJobsToExcel(jobs: ActiveJob[]) {
  const headers = [
    "Job Number",
    "Bid Number",
    "Contract Number",
    "Contractor",
    "County",
    "Branch",
    "Project Status",
    "Billing Status",
    "Start Date",
    "End Date",
    "Location",
    "CPR",
    "Created At",
  ];

  const rows = jobs.map((job) => [
    job.jobNumber || "",
    job.bidNumber || "",
    job.contractNumber || "",
    job.contractor || "",
    getCountyValue(job),
    job.branch || "",
    job.projectStatus || "",
    job.billingStatus || "",
    job.startDate || "",
    job.endDate || "",
    job.location || "",
    (job as ActiveJob & { cpr?: string }).cpr || "",
    job.createdAt ? new Date(job.createdAt).toLocaleDateString("en-US") : "",
  ]);

  const csvContent = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  const timestamp = new Date().toISOString().split("T")[0];
  downloadCsv(csvContent, `job_list_${timestamp}.csv`);
}
