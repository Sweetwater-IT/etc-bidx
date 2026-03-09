import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Phone, Mail, Calendar, MapPin, DollarSign, Users } from "lucide-react";
import type { JobProjectInfo } from "@/types/job";

interface ProjectInfoFieldsProps {
  projectInfo: JobProjectInfo;
  onChange: (info: JobProjectInfo) => void;
  showValidation?: boolean;
  readOnly?: boolean;
}

export const ProjectInfoFields = ({
  projectInfo,
  onChange,
  showValidation = false,
  readOnly = false
}: ProjectInfoFieldsProps) => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    contacts: false,
    rates: false,
    dates: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateField = (field: keyof JobProjectInfo, value: string | number | null) => {
    onChange({
      ...projectInfo,
      [field]: value,
    });
  };

  const hasRequiredFields = !!(
    projectInfo.projectName &&
    projectInfo.contractNumber &&
    projectInfo.customerName &&
    projectInfo.county
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Project Information
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Basic project details and contract information.
          </p>
        </div>
        {showValidation && (
          <Badge variant={hasRequiredFields ? "default" : "destructive"}>
            {hasRequiredFields ? "Complete" : "Incomplete"}
          </Badge>
        )}
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle
            className="text-sm font-medium cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('basic')}
          >
            Basic Information
            <span className="text-xs text-muted-foreground">
              {expandedSections.basic ? '−' : '+'}
            </span>
          </CardTitle>
        </CardHeader>
        {expandedSections.basic && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={projectInfo.projectName || ""}
                  onChange={(e) => updateField('projectName', e.target.value || null)}
                  placeholder="Enter project name"
                  className="h-8"
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Contract Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={projectInfo.contractNumber || ""}
                  onChange={(e) => updateField('contractNumber', e.target.value || null)}
                  placeholder="Enter contract number"
                  className="h-8"
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={projectInfo.customerName || ""}
                  onChange={(e) => updateField('customerName', e.target.value || null)}
                  placeholder="Enter customer name"
                  className="h-8"
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Customer Job Number</Label>
                <Input
                  value={projectInfo.customerJobNumber || ""}
                  onChange={(e) => updateField('customerJobNumber', e.target.value || null)}
                  placeholder="Enter customer job number"
                  className="h-8"
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Project Owner</Label>
                <Input
                  value={projectInfo.projectOwner || ""}
                  onChange={(e) => updateField('projectOwner', e.target.value || null)}
                  placeholder="Enter project owner"
                  className="h-8"
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  County <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={projectInfo.county || ""}
                  onChange={(e) => updateField('county', e.target.value || null)}
                  placeholder="Enter county"
                  className="h-8"
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">ETC Job Number</Label>
                <Input
                  type="number"
                  value={projectInfo.etcJobNumber?.toString() || ""}
                  onChange={(e) => updateField('etcJobNumber', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Enter ETC job number"
                  className="h-8"
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">ETC Branch</Label>
                <Input
                  value={projectInfo.etcBranch || ""}
                  onChange={(e) => updateField('etcBranch', e.target.value || null)}
                  placeholder="Enter ETC branch"
                  className="h-8"
                  readOnly={readOnly}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Other Notes</Label>
              <Textarea
                value={projectInfo.otherNotes || ""}
                onChange={(e) => updateField('otherNotes', e.target.value || null)}
                placeholder="Additional project notes..."
                className="min-h-[80px] resize-none"
                readOnly={readOnly}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle
            className="text-sm font-medium cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('contacts')}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contact Information
            </div>
            <span className="text-xs text-muted-foreground">
              {expandedSections.contacts ? '−' : '+'}
            </span>
          </CardTitle>
        </CardHeader>
        {expandedSections.contacts && (
          <CardContent className="space-y-6">
            {/* Customer PM */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Project Manager
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Name</Label>
                  <Input
                    value={projectInfo.customerPM || ""}
                    onChange={(e) => updateField('customerPM', e.target.value || null)}
                    placeholder="PM name"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Email</Label>
                  <Input
                    type="email"
                    value={projectInfo.customerPMEmail || ""}
                    onChange={(e) => updateField('customerPMEmail', e.target.value || null)}
                    placeholder="PM email"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Phone</Label>
                  <Input
                    value={projectInfo.customerPMPhone || ""}
                    onChange={(e) => updateField('customerPMPhone', e.target.value || null)}
                    placeholder="PM phone"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </div>

            {/* ETC Project Manager */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                ETC Project Manager
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Name</Label>
                  <Input
                    value={projectInfo.etcProjectManager || ""}
                    onChange={(e) => updateField('etcProjectManager', e.target.value || null)}
                    placeholder="ETC PM name"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Email</Label>
                  <Input
                    type="email"
                    value={projectInfo.etcProjectManagerEmail || ""}
                    onChange={(e) => updateField('etcProjectManagerEmail', e.target.value || null)}
                    placeholder="ETC PM email"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Phone</Label>
                  <Input
                    value={""}
                    placeholder="ETC PM phone"
                    className="h-8"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* ETC Billing Manager */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                ETC Billing Manager
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Name</Label>
                  <Input
                    value={projectInfo.etcBillingManager || ""}
                    onChange={(e) => updateField('etcBillingManager', e.target.value || null)}
                    placeholder="ETC billing name"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Email</Label>
                  <Input
                    type="email"
                    value={projectInfo.etcBillingManagerEmail || ""}
                    onChange={(e) => updateField('etcBillingManagerEmail', e.target.value || null)}
                    placeholder="ETC billing email"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Phone</Label>
                  <Input
                    value={""}
                    placeholder="ETC billing phone"
                    className="h-8"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Certified Payroll Contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Certified Payroll Contact
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Name</Label>
                  <Input
                    value={projectInfo.certifiedPayrollContact || ""}
                    onChange={(e) => updateField('certifiedPayrollContact', e.target.value || null)}
                    placeholder="Payroll contact name"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Email</Label>
                  <Input
                    type="email"
                    value={projectInfo.certifiedPayrollEmail || ""}
                    onChange={(e) => updateField('certifiedPayrollEmail', e.target.value || null)}
                    placeholder="Payroll contact email"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Phone</Label>
                  <Input
                    value={projectInfo.certifiedPayrollPhone || ""}
                    onChange={(e) => updateField('certifiedPayrollPhone', e.target.value || null)}
                    placeholder="Payroll contact phone"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </div>

            {/* Customer Billing Contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Billing Contact
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Name</Label>
                  <Input
                    value={projectInfo.customerBillingContact || ""}
                    onChange={(e) => updateField('customerBillingContact', e.target.value || null)}
                    placeholder="Billing contact name"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Email</Label>
                  <Input
                    type="email"
                    value={projectInfo.customerBillingEmail || ""}
                    onChange={(e) => updateField('customerBillingEmail', e.target.value || null)}
                    placeholder="Billing contact email"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Phone</Label>
                  <Input
                    value={projectInfo.customerBillingPhone || ""}
                    onChange={(e) => updateField('customerBillingPhone', e.target.value || null)}
                    placeholder="Billing contact phone"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Rates & Payroll */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle
            className="text-sm font-medium cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('rates')}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Rates & Payroll
            </div>
            <span className="text-xs text-muted-foreground">
              {expandedSections.rates ? '−' : '+'}
            </span>
          </CardTitle>
        </CardHeader>
        {expandedSections.rates && (
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium">Certified Payroll Type</Label>
                <Select
                  value={projectInfo.isCertifiedPayroll}
                  onValueChange={(value: "none" | "state" | "federal") => updateField('isCertifiedPayroll', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="federal">Federal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shop Rate */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Shop Rate</h4>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Shop Rate ($/hr)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={projectInfo.shopRate || ""}
                    onChange={(e) => updateField('shopRate', e.target.value || null)}
                    placeholder="0.00"
                    className="h-8"
                    readOnly={readOnly}
                  />
                </div>
              </div>

              {/* State Rates */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">State Rates</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">MPT Base</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={projectInfo.stateMptBaseRate || ""}
                      onChange={(e) => updateField('stateMptBaseRate', e.target.value || null)}
                      placeholder="0.00"
                      className="h-8"
                      readOnly={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">MPT Fringe</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={projectInfo.stateMptFringeRate || ""}
                      onChange={(e) => updateField('stateMptFringeRate', e.target.value || null)}
                      placeholder="0.00"
                      className="h-8"
                      readOnly={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Flagging Base</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={projectInfo.stateFlaggingBaseRate || ""}
                      onChange={(e) => updateField('stateFlaggingBaseRate', e.target.value || null)}
                      placeholder="0.00"
                      className="h-8"
                      readOnly={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Flagging Fringe</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={projectInfo.stateFlaggingFringeRate || ""}
                      onChange={(e) => updateField('stateFlaggingFringeRate', e.target.value || null)}
                      placeholder="0.00"
                      className="h-8"
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Federal Rates */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Federal Rates</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">MPT Base</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={projectInfo.federalMptBaseRate || ""}
                      onChange={(e) => updateField('federalMptBaseRate', e.target.value || null)}
                      placeholder="0.00"
                      className="h-8"
                      readOnly={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">MPT Fringe</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={projectInfo.federalMptFringeRate || ""}
                      onChange={(e) => updateField('federalMptFringeRate', e.target.value || null)}
                      placeholder="0.00"
                      className="h-8"
                      readOnly={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Flagging Base</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={projectInfo.federalFlaggingBaseRate || ""}
                      onChange={(e) => updateField('federalFlaggingBaseRate', e.target.value || null)}
                      placeholder="0.00"
                      className="h-8"
                      readOnly={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Flagging Fringe</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={projectInfo.federalFlaggingFringeRate || ""}
                      onChange={(e) => updateField('federalFlaggingFringeRate', e.target.value || null)}
                      placeholder="0.00"
                      className="h-8"
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Project Dates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle
            className="text-sm font-medium cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('dates')}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Project Dates
            </div>
            <span className="text-xs text-muted-foreground">
              {expandedSections.dates ? '−' : '+'}
            </span>
          </CardTitle>
        </CardHeader>
        {expandedSections.dates && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Project Start Date</Label>
                <Input
                  type="date"
                  value={projectInfo.projectStartDate || ""}
                  onChange={(e) => updateField('projectStartDate', e.target.value || null)}
                  className="h-8"
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Project End Date</Label>
                <Input
                  type="date"
                  value={projectInfo.projectEndDate || ""}
                  onChange={(e) => updateField('projectEndDate', e.target.value || null)}
                  className="h-8"
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Extension Date</Label>
                <Input
                  type="date"
                  value={projectInfo.extensionDate || ""}
                  onChange={(e) => updateField('extensionDate', e.target.value || null)}
                  className="h-8"
                  readOnly={readOnly}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};