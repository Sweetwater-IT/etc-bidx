import React from "react";
import { CardHeader, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

interface CustomerInfo {
  customer: string;
  contract: string;
  manager: string;
  email: string;
  phone: string;
}

interface JobInfoSidebarProps {
  customerInfo: CustomerInfo;
}

export function JobInfoSidebar({ customerInfo }: JobInfoSidebarProps) {
  return (
    <div>
      <CardHeader className="pb-0 pt-0 px-0 flex flex-col gap-3 bg-transparent">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold tracking-widest mb-1 py-2">
          <Info className="w-4 h-4" /> GENERAL INFO
        </div>
      </CardHeader>
      <CardContent className="pb-0 px-0 bg-background">
        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-2 bg-muted p-4 rounded-xl">
          <div className="flex flex-col">
            <span className="text-muted-foreground mb-0.5">Customer</span>
            <span className="font-bold text-foreground">
              {customerInfo.customer}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground mb-0.5">
              Customer Contract
            </span>
            <span className="text-foreground">{customerInfo.contract}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground mb-0.5">
              Project Manager
            </span>
            <span className="text-foreground">{customerInfo.manager}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground mb-0.5">PM Email</span>
            <span className="text-foreground">{customerInfo.email}</span>
          </div>
          <div className="flex flex-col md:col-span-2">
            <span className="text-muted-foreground mb-0.5">PM Phone</span>
            <span className="text-foreground">{customerInfo.phone}</span>
          </div>
        </div>

        {/* Separator */}
        <div className="border-b border-border my-4" />

        {/* Admin Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-2 bg-muted p-4 rounded-xl">
          <div className="flex flex-col">
            <span className="text-muted-foreground mb-0.5">Admin Name</span>
            <span className="font-bold text-foreground">John Doe</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground mb-0.5">Admin Email</span>
            <span className="text-foreground">admin@email.com</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground mb-0.5">Role</span>
            <span className="text-foreground">Project Admin</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground mb-0.5">Created</span>
            <span className="text-foreground">01/01/2024</span>
          </div>
        </div>
      </CardContent>
    </div>
  );
}
