import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FormData } from "@/app/active-bid/page";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ViewBidSummarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
}

export function ViewBidSummarySheet({
  open,
  onOpenChange,
  formData,
}: ViewBidSummarySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-2xl">Bid Summary</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-8 px-5">
          {/* Financial Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Financial Overview</h3>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-semibold">{formatCurrency(Number(formData.totalRevenue) || 0)}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-xl font-semibold">{formatCurrency(Number(formData.totalCost) || 0)}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Gross Profit</p>
                <p className="text-xl font-semibold">{formatCurrency(Number(formData.grossProfit) || 0)}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Gross Margin</p>
                <p className="text-xl font-semibold">{formData.grossMargin || 0}%</p>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Project Details</h3>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Contract Number</p>
                <p className="text-base font-medium">{formData.contractNumber || '-'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Estimator</p>
                <p className="text-base font-medium">{formData.estimator || '-'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">County</p>
                <p className="text-base font-medium">{formData.county || '-'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Division</p>
                <p className="text-base font-medium">{formData.division || '-'}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Important Dates</h3>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Letting Date</p>
                <p className="text-base font-medium">{formData.lettingDate || '-'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-base font-medium">{formData.startDate || '-'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="text-base font-medium">{formData.endDate || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 