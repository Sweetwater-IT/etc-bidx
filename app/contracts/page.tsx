"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { IconUpload } from "@tabler/icons-react";

interface FormInputProps {
  label: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function FormInput({ label, value, placeholder, disabled, className }: FormInputProps) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <Input value={value} placeholder={placeholder} disabled={disabled} className="mt-1 bg-muted/50" />
    </div>
  );
}

interface AdminInfoItemProps {
  label: string;
  value: string;
}

function AdminInfoItem({ label, value }: AdminInfoItemProps) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

export default function ContractPage() {
  const contractId = "1209181";

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 68)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Dashboard
                <span className="mx-2">/</span>
                Contract Manager
              </div>
            </div>
          </div>

          <div className="flex gap-6 p-6">
            {/* Main Content (2/3) */}
            <div className="flex-[2] space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Contract #{contractId}</h2>
                <Button>Create Job</Button>
              </div>

              {/* Customer Information */}
              <div className="rounded-lg border bg-card p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Customer Information</h3>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormInput
                    label="Customer"
                  />
                  <FormInput
                    label="Customer Contract Number"
                  />
                  <FormInput
                    label="Project Manager"
                  />
                  <FormInput
                    label="PM Email"
                  />
                  <FormInput
                    label="PM Phone"
                  />
                </div>
              </div>

              {/* Contract Upload */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-6 text-lg font-semibold">Contract</h3>
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12">
                  <IconUpload className="mb-4 h-8 w-8 text-muted-foreground" />
                  <div className="text-center text-muted-foreground">
                    Upload contract here
                  </div>
                </div>
              </div>

              {/* Prevailing Wages */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-6 text-lg font-semibold">Prevailing Wages</h3>
                <div className="mb-6 flex items-center space-x-2">
                  <Switch id="use-shop-rates" />
                  <Label htmlFor="use-shop-rates">Use shop rates</Label>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Labor Rate</Label>
                    <div className="flex items-center">
                      <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                        $
                      </div>
                      <Input type="number" className="rounded-l-none bg-muted/50" defaultValue="32.75" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fringe Rate</Label>
                    <div className="flex items-center">
                      <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground">
                        $
                      </div>
                      <Input type="number" className="rounded-l-none bg-muted/50" defaultValue="25.5" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Certified Payroll</Label>
                    <Input value="State" className="bg-muted/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (1/3) */}
            <div className="flex-1 space-y-6">
              {/* File Manager */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold">File Manager</h3>
                <div className="mb-4 flex items-center gap-2">
                  <Button variant="outline" className="flex-1">Combine Files</Button>
                  <Button className="flex-1">Send</Button>
                </div>
                <div className="rounded-lg border-2 border-dashed p-8 text-center">
                  <div className="text-sm text-muted-foreground">
                    Drop a file here or click to browse
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    File should not exceed 5MB in size
                  </div>
                </div>
              </div>

              {/* Admin Information */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold">Admin Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <AdminInfoItem label="Contract #" value="1209181" />
                  <AdminInfoItem label="Owner" value="TURNPIKE" />
                  <AdminInfoItem label="County" value="Armstrong" />
                  <AdminInfoItem label="Branch" value="WEST" />
                  <AdminInfoItem label="Township" value="Philadelphia" />
                  <AdminInfoItem label="Division" value="PRIVATE" />
                  <AdminInfoItem label="Start Date" value="4/25/2025" />
                  <AdminInfoItem label="End Date" value="8/3/2025" />
                  <AdminInfoItem label="Total Days" value="100" />
                  <AdminInfoItem label="Bid Date" value="4/24/2025" />
                  <AdminInfoItem label="SR Route" value="10" />
                  <AdminInfoItem label="DBE %" value="10%" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 