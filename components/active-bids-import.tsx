import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { importJobs } from "@/lib/api-client";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Map Excel columns to DB fields (adjust as needed)
const COLUMN_MAP: Record<string, string> = {
  "Status": "status",
  "Branch": "branch",
  "Contract Number": "contract_number",
  "County": "county",
  "Due Date": "due_date",
  "Letting Date": "letting_date",
  "Entry Date": "entry_date",
  "Location": "location",
  "Owner": "owner",
  "Platform": "platform",
  "Requestor": "requestor",
  "MPT": "mpt",
  "Flagging": "flagging",
  "Perm Signs": "perm_signs",
  "Equipment Rental": "equipment_rental",
  "Other": "other",
  "DBE %": "dbe_percentage",
  "No Bid Reason": "no_bid_reason"
};

function parseBoolean(val: any) {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return ["yes", "true", "1"].includes(val.toLowerCase());
  return Boolean(val);
}

function parseDate(val: any) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export default function ActiveBidsImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setImportResult(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const jobs = (json as any[]).map((row) => {
        const job: Record<string, any> = {};
        for (const [excelCol, dbField] of Object.entries(COLUMN_MAP)) {
          let val = row[excelCol];
          // Parse booleans
          if (["mpt", "flagging", "perm_signs", "equipment_rental", "other"].includes(dbField)) {
            val = parseBoolean(val);
          }
          // Parse numbers
          if (dbField === "dbe_percentage") {
            val = val ? parseFloat(val) : null;
          }
          // Parse dates
          if (["due_date", "letting_date", "entry_date"].includes(dbField)) {
            val = parseDate(val);
          }
          job[dbField] = val;
        }
        // Defaults
        if (!job.status) job.status = "Bid";
        return job;
      });
      // Call API to batch insert
      const res = await importJobs(jobs);
      setImportResult({ success: res.count, failed: (jobs.length - res.count), errors: res.errors || [] });
    } catch (err: any) {
      setImportResult({ success: 0, failed: 0, errors: [err.message || "Import failed"] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        {loading ? "Importing..." : "Import Active Bids (.xlsx)"}
      </Button>
      {importResult && (
        <div className="mt-2 text-sm">
          <div>Imported: {importResult.success}</div>
          <div>Failed: {importResult.failed}</div>
          {importResult.errors.length > 0 && (
            <ul className="text-red-500">
              {importResult.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
