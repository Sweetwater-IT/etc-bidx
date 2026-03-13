"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";

interface ContractDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  category: string;
  uploadedAt: string;
}

export default function ContractViewContent() {
  const router = useRouter();
  const params = useParams();
  const contractId = params?.id as string;

  const [contract, setContract] = useState<any>(null);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [sovItems, setSovItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContract = async () => {
      try {
        // Load contract data
        const response = await fetch(`/api/l/contracts/${contractId}`);
        if (!response.ok) {
          throw new Error(`Failed to load contract: ${response.status}`);
        }
        const contractData = await response.json();
        setContract(contractData);

        // Load documents
        const docsResponse = await fetch(`/api/l/contracts/${contractId}/documents`);
        if (docsResponse.ok) {
          const docs = await docsResponse.json();
          if (docs && docs.length > 0) {
            setDocuments(docs.map((d: any) => ({
              id: d.id,
              name: d.file_name,
              size: d.file_size || 0,
              type: d.file_type || "other",
              category: d.file_type || "other",
              uploadedAt: d.uploaded_at,
            })));
          }
        }

        // Load SOV items
        const sovResponse = await fetch(`/api/l/contracts/${contractId}/sov-items`);
        if (sovResponse.ok) {
          const sov = await sovResponse.json();
          setSovItems(sov || []);
        }
      } catch (error) {
        console.error('Error loading contract:', error);
        toast.error('Failed to load contract');
      } finally {
        setLoading(false);
      }
    };

    if (contractId) {
      loadContract();
    }
  }, [contractId]);

  const handleEdit = () => {
    router.push(`/l/contracts/edit/${contractId}`);
  };

  const handleDownloadPdf = async () => {
    // TODO: Implement PDF generation for contracts
    toast.info('PDF generation for contracts coming soon');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="py-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading contract...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-background">
        <div className="py-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Contract not found</p>
            <button
              onClick={() => router.push(`/l/contracts`)}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Go back to contracts
            </button>
          </div>
        </div>
      </div>
    );
  }

  const jobName = contract.project_name || "Untitled Project";

  return (
    <div className="min-h-screen bg-background">
      <StickyPageHeader
        backLabel="Contracts"
        onBack={() => router.push("/l/contracts")}
        rightContent={
          <>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownloadPdf}>
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
          </>
        }
      />

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageTitleBlock
          title={`Contract for ${jobName}`}
          description="Review contract details, schedule of values, and supporting documents."
        />

        {/* Project Information */}
        <div className="rounded-lg border bg-card shadow-sm mb-6">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Information</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Project Name</span>
                <span className="text-sm font-medium">{contract.project_name || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Contract Number</span>
                <span className="text-sm font-medium">{contract.contract_number || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer Name</span>
                <span className="text-sm font-medium">{contract.customer_name || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer Job Number</span>
                <span className="text-sm font-medium">{contract.customer_job_number || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Project Owner</span>
                <span className="text-sm font-medium">{contract.project_owner || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">ETC Job Number</span>
                <span className="text-sm font-medium font-mono">{contract.etc_job_number || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">ETC Branch</span>
                <span className="text-sm font-medium">{contract.etc_branch || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">County</span>
                <span className="text-sm font-medium">{contract.county || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer PM</span>
                <span className="text-sm font-medium">{contract.customer_pm || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer PM Email</span>
                <span className="text-sm font-medium">{contract.customer_pm_email || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer PM Phone</span>
                <span className="text-sm font-medium">{contract.customer_pm_phone || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">ETC Project Manager</span>
                <span className="text-sm font-medium">{contract.etc_project_manager || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">ETC Billing Manager</span>
                <span className="text-sm font-medium">{contract.etc_billing_manager || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Project Start Date</span>
                <span className="text-sm font-medium">{contract.project_start_date || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Project End Date</span>
                <span className="text-sm font-medium">{contract.project_end_date || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Extension Date</span>
                <span className="text-sm font-medium">{contract.extension_date || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Certified Payroll</span>
                <span className="text-sm font-medium capitalize">{contract.certified_payroll_type || "none"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Shop Rate</span>
                <span className="text-sm font-medium">{contract.shop_rate || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule of Values */}
        {sovItems.length > 0 && (
          <div className="rounded-lg border bg-card shadow-sm mb-6">
            <div className="px-5 py-3 border-b bg-muted/30">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Schedule of Values</h2>
            </div>
            <div className="p-5 overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Item</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quantity</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unit</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unit Price</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sovItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/10">
                      <td className="px-3 py-2 font-medium">{item.item_number}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.description}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">{item.unit}</td>
                      <td className="px-3 py-2">${item.unit_price?.toLocaleString() || "—"}</td>
                      <td className="px-3 py-2">${item.total?.toLocaleString() || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="px-5 py-3 border-b bg-muted/30">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Documents</h2>
            </div>
            <div className="p-5 overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Document Name</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Size</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {documents.map((doc: ContractDocument) => (
                    <tr key={doc.id} className="hover:bg-muted/10">
                      <td className="px-3 py-2 font-medium">{doc.name}</td>
                      <td className="px-3 py-2 text-muted-foreground capitalize">{doc.category}</td>
                      <td className="px-3 py-2">{(doc.size / 1024).toFixed(1)} KB</td>
                      <td className="px-3 py-2">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notes */}
        {contract.additional_notes && (
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="px-5 py-3 border-b bg-muted/30">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Additional Notes</h2>
            </div>
            <div className="p-5">
              <div className="text-sm whitespace-pre-wrap">{contract.additional_notes}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}