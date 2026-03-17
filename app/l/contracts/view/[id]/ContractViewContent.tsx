"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageTitleBlock } from "@/app/l/components/PageTitleBlock";
import { StickyPageHeader } from "@/app/l/components/StickyPageHeader";
import { SOVTable } from "@/components/SOVTable";
import { ContractSaveDocument } from "@/app/l/components/ContractSaveDocument";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import type { JobProjectInfo } from "@/types/job";

type DocumentCategory = "contract" | "addendum" | "permit" | "insurance" | "bond" | "plan" | "specification" | "correspondence" | "photo" | "other";

interface ContractDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  category: DocumentCategory;
  associatedItemId?: string;
  associatedItemLabel?: string;
  uploadedAt: string;
  filePath: string;
}

export default function ContractViewContent() {
  const router = useRouter();
  const params = useParams();
  const contractId = params?.id as string;

  const [contract, setContract] = useState<any>(null);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [projectInfo, setProjectInfo] = useState<JobProjectInfo | null>(null);
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

        // Transform contract data to projectInfo format for ProjectInfoFields
        const transformedProjectInfo: JobProjectInfo = {
          projectName: contractData.project_name || "",
          contractNumber: contractData.contract_number || "",
          customerName: contractData.customer_name || "",
          customerJobNumber: contractData.customer_job_number || "",
          projectOwner: contractData.project_owner || "",
          etcJobNumber: contractData.etc_job_number || null,
          etcBranch: contractData.etc_branch || "",
          county: contractData.county || "",
          customerPM: contractData.customer_pm || "",
          customerPMEmail: contractData.customer_pm_email || "",
          customerPMPhone: contractData.customer_pm_phone || "",
          certifiedPayrollContact: contractData.certified_payroll_contact || "",
          certifiedPayrollEmail: contractData.certified_payroll_email || "",
          certifiedPayrollPhone: contractData.certified_payroll_phone || "",
          customerBillingContact: contractData.customer_billing_contact || "",
          customerBillingEmail: contractData.customer_billing_email || "",
          customerBillingPhone: contractData.customer_billing_phone || "",
          etcProjectManager: contractData.etc_project_manager || "",
          etcBillingManager: contractData.etc_billing_manager || "",
          etcProjectManagerEmail: contractData.etc_project_manager_email || "",
          etcBillingManagerEmail: contractData.etc_billing_manager_email || "",
          projectStartDate: contractData.project_start_date || "",
          projectEndDate: contractData.project_end_date || "",
          otherNotes: contractData.additional_notes || "",
          isCertifiedPayroll: contractData.certified_payroll_type === "state" ? "state" : contractData.certified_payroll_type === "federal" ? "federal" : "none",
          shopRate: contractData.shop_rate || "",
          stateMptBaseRate: contractData.state_base_rate || "",
          stateMptFringeRate: contractData.state_fringe_rate || "",
          stateFlaggingBaseRate: contractData.state_flagging_base_rate || "",
          stateFlaggingFringeRate: contractData.state_flagging_fringe_rate || "",
          federalMptBaseRate: contractData.federal_base_rate || "",
          federalMptFringeRate: contractData.federal_fringe_rate || "",
          federalFlaggingBaseRate: contractData.federal_flagging_base_rate || "",
          federalFlaggingFringeRate: contractData.federal_flagging_fringe_rate || "",
          extensionDate: contractData.extension_date || "",
        };
        setProjectInfo(transformedProjectInfo);

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
              category: (d.file_type || "other") as DocumentCategory,
              associatedItemId: d.checklist_item_id || undefined,
              uploadedAt: d.uploaded_at,
              filePath: d.file_path,
            })));
          }
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

  if (!contract || !projectInfo) {
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

  const jobName = projectInfo?.etcJobNumber?.toString() || contract.project_name || "Untitled Project";

  return (
    <div className="min-h-screen bg-background">
      <StickyPageHeader
        backLabel="Contracts"
        onBack={() => router.push("/l/contracts")}
        rightContent={
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/l/contracts">Contracts</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{jobName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <PageTitleBlock
          title={`Contract for ${jobName}`}
          description="Review contract details, schedule of values, and supporting documents."
        />

        {/* Project Information */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Details</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Project Owner</span>
                <span className="text-sm font-medium">{projectInfo.projectOwner || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Job Name</span>
                <span className="text-sm font-medium">{projectInfo.projectName || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Project Owner Contract #</span>
                <span className="text-sm font-medium">{projectInfo.contractNumber || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">County</span>
                <span className="text-sm font-medium">{projectInfo.county || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">ETC Branch</span>
                <span className="text-sm font-medium">{projectInfo.etcBranch || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">ETC Job #</span>
                <span className="text-sm font-medium font-mono">{projectInfo.etcJobNumber || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">ETC Project Manager</span>
                <span className="text-sm font-medium">{projectInfo.etcProjectManager || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Project Start Date</span>
                <span className="text-sm font-medium">{projectInfo.projectStartDate || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Project End Date</span>
                <span className="text-sm font-medium">{projectInfo.projectEndDate || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer Admin Information</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer Name</span>
                <span className="text-sm font-medium">{projectInfo.customerName || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer Job Number</span>
                <span className="text-sm font-medium">{projectInfo.customerJobNumber || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Customer Project Manager</span>
                <span className="text-sm font-medium">{projectInfo.customerPM || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">PM Email</span>
                <span className="text-sm font-medium">{projectInfo.customerPMEmail || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">PM Phone</span>
                <span className="text-sm font-medium">{projectInfo.customerPMPhone || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Certified Payroll Contact</span>
                <span className="text-sm font-medium">{projectInfo.certifiedPayrollContact || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Payroll Email</span>
                <span className="text-sm font-medium">{projectInfo.certifiedPayrollEmail || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Payroll Phone</span>
                <span className="text-sm font-medium">{projectInfo.certifiedPayrollPhone || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Billing Contact Name</span>
                <span className="text-sm font-medium">{projectInfo.customerBillingContact || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Billing Email</span>
                <span className="text-sm font-medium">{projectInfo.customerBillingEmail || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Billing Phone</span>
                <span className="text-sm font-medium">{projectInfo.customerBillingPhone || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Certified Payroll Information */}
        {projectInfo.isCertifiedPayroll !== "none" && (
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="px-5 py-3 border-b bg-muted/30">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Certified Payroll Information</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Certified Payroll Type</span>
                  <span className="text-sm font-medium">
                    {projectInfo.isCertifiedPayroll === "state" ? "Yes — State (PA Prevailing Wage)" :
                     projectInfo.isCertifiedPayroll === "federal" ? "Yes — Federal (Davis-Bacon)" : "No"}
                  </span>
                </div>

                {projectInfo.isCertifiedPayroll === "state" && (
                  <>
                    <div>
                      <span className="text-[11px] font-semibold text-foreground mb-2 block">PA Prevailing Wage Rates</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">MPT Base Rate</span>
                        <span className="text-sm font-medium">${projectInfo.stateMptBaseRate || "0.00"}/hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">MPT Fringe Rate</span>
                        <span className="text-sm font-medium">${projectInfo.stateMptFringeRate || "0.00"}/hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">MPT Total</span>
                        <span className="text-sm font-medium">${((parseFloat(projectInfo.stateMptBaseRate || "0") || 0) + (parseFloat(projectInfo.stateMptFringeRate || "0") || 0)).toFixed(2)}/hr</span>
                      </div>
                      <div></div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Flagging Base Rate</span>
                        <span className="text-sm font-medium">${projectInfo.stateFlaggingBaseRate || "0.00"}/hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Flagging Fringe Rate</span>
                        <span className="text-sm font-medium">${projectInfo.stateFlaggingFringeRate || "0.00"}/hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Flagging Total</span>
                        <span className="text-sm font-medium">${((parseFloat(projectInfo.stateFlaggingBaseRate || "0") || 0) + (parseFloat(projectInfo.stateFlaggingFringeRate || "0") || 0)).toFixed(2)}/hr</span>
                      </div>
                    </div>
                  </>
                )}

                {projectInfo.isCertifiedPayroll === "federal" && (
                  <>
                    <div>
                      <span className="text-[11px] font-semibold text-foreground mb-2 block">Federal Davis-Bacon Rates</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">MPT Base Rate</span>
                        <span className="text-sm font-medium">${projectInfo.federalMptBaseRate || "0.00"}/hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">MPT Fringe Rate</span>
                        <span className="text-sm font-medium">${projectInfo.federalMptFringeRate || "0.00"}/hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">MPT Total</span>
                        <span className="text-sm font-medium">${((parseFloat(projectInfo.federalMptBaseRate || "0") || 0) + (parseFloat(projectInfo.federalMptFringeRate || "0") || 0)).toFixed(2)}/hr</span>
                      </div>
                      <div></div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Flagging Base Rate</span>
                        <span className="text-sm font-medium">${projectInfo.federalFlaggingBaseRate || "0.00"}/hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Flagging Fringe Rate</span>
                        <span className="text-sm font-medium">${projectInfo.federalFlaggingFringeRate || "0.00"}/hr</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Flagging Total</span>
                        <span className="text-sm font-medium">${((parseFloat(projectInfo.federalFlaggingBaseRate || "0") || 0) + (parseFloat(projectInfo.federalFlaggingFringeRate || "0") || 0)).toFixed(2)}/hr</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {projectInfo.otherNotes && (
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="px-5 py-3 border-b bg-muted/30">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Additional Notes</h2>
            </div>
            <div className="p-5">
              <div className="text-sm">{projectInfo.otherNotes}</div>
            </div>
          </div>
        )}

        {/* Schedule of Values */}
        <div>
          <SOVTable contractId={contractId} readOnly={true} />
        </div>

        {/* Documents & Forms */}
        <ContractSaveDocument
          documents={documents}
          projectInfo={projectInfo}
          jobId={contractId}
          onAddDocuments={() => {}} // No-op for view mode
          onRemoveDocument={() => {}} // No-op for view mode
          onUpdateCategory={() => {}} // No-op for view mode
          readOnly={true}
        />
      </div>
    </div>
  );
}
