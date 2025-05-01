import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FormData } from "@/types/IFormData";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface ViewBidSummarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewBidSummarySheet({
  open,
  onOpenChange,
}: ViewBidSummarySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[900px] overflow-y-auto">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-2xl">Bid Summary Dashboard</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-8 px-5">
          {/* MPT Discounting */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">MPT Discounting</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Clear</Button>
                <Button variant="default" size="sm">Swing</Button>
                <Button variant="default" size="sm">Target</Button>
                <Button variant="destructive" size="sm">Breakeven</Button>
              </div>
            </div>
            <div className="rounded-lg border">
              <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Item</div>
                <div className="font-medium">Input Discount Rate</div>
                <div className="font-medium">Swing</div>
                <div className="font-medium">Target</div>
                <div className="font-medium">Breakeven</div>
              </div>
              <div className="divide-y">
                {[
                  "4' Ft Type III",
                  "6 Ft Wings",
                  "H Stand",
                  "Post",
                  "Sandbag",
                  "Covers",
                  "Metal Stands",
                  "HI",
                  "DG",
                  "Special"
                ].map((item) => (
                  <div key={item} className="grid grid-cols-5 gap-4 p-4">
                    <div>{item}</div>
                    <div>0</div>
                    <div>100.00%</div>
                    <div>100.00%</div>
                    <div>100.00%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue and Profit Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Revenue and Profit Summary</h3>
            <div className="rounded-lg border">
              <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">MPT</div>
                <div className="font-medium">Revenue</div>
                <div className="font-medium">Cost</div>
                <div className="font-medium">Gross Profit</div>
                <div className="font-medium">Gross Profit %</div>
              </div>
              <div className="divide-y">
                {[
                  { name: "MPT Equipment", highlight: false },
                  { name: "Channelizer and Light Rentals", highlight: false },
                  { name: "HI Signs", highlight: false },
                  { name: "DG Signs", highlight: false },
                  { name: "Special Signs", highlight: false },
                  { name: "Rate Labor", highlight: false },
                  { name: "Shop Labor", highlight: false },
                  { name: "Truck & Fuel Costs", highlight: false },
                  { name: "MPT Total", highlight: true },
                ].map(({ name, highlight }) => (
                  <div key={name} className={`grid grid-cols-5 gap-4 p-4 ${highlight ? "bg-muted" : ""}`}>
                    <div>{name}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>0.00%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rental Section */}
            <div className="rounded-lg border mt-4">
              <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Rental</div>
                <div className="font-medium">Revenue</div>
                <div className="font-medium">Cost</div>
                <div className="font-medium">Gross Profit</div>
                <div className="font-medium">Gross Profit %</div>
              </div>
              <div className="divide-y">
                {[
                  { name: "TMA", highlight: false },
                  { name: "Arrow Board", highlight: false },
                  { name: "Message Board", highlight: false },
                  { name: "Speed Trailer", highlight: false },
                  { name: "Total", highlight: true },
                ].map(({ name, highlight }) => (
                  <div key={name} className={`grid grid-cols-5 gap-4 p-4 ${highlight ? "bg-muted" : ""}`}>
                    <div>{name}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>0.00%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flagging Section */}
            <div className="rounded-lg border mt-4">
              <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Flagging</div>
                <div className="font-medium">Revenue</div>
                <div className="font-medium">Cost</div>
                <div className="font-medium">Gross Profit</div>
                <div className="font-medium">Gross Profit %</div>
              </div>
              <div className="divide-y">
                {[
                  { name: "Flagging", highlight: false },
                  { name: "Patterns", highlight: false },
                  { name: "Total", highlight: true },
                ].map(({ name, highlight }) => (
                  <div key={name} className={`grid grid-cols-5 gap-4 p-4 ${highlight ? "bg-muted" : ""}`}>
                    <div>{name}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>0.00%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permanent Signs Section */}
            <div className="rounded-lg border mt-4">
              <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Perm. Signs Items</div>
                <div className="font-medium">Revenue</div>
                <div className="font-medium">Cost</div>
                <div className="font-medium">Gross Profit</div>
                <div className="font-medium">Gross Profit %</div>
              </div>
              <div className="divide-y">
                {[
                  { name: "PMS, Type B", highlight: false },
                  { name: "Reset PMS, Type B", highlight: false },
                  { name: "Remove PMS, Type B", highlight: false },
                  { name: "PMS, Type F", highlight: false },
                  { name: "Reset PMS, Type F", highlight: false },
                  { name: "Remove PMS, Type F", highlight: false },
                  { name: "Total", highlight: true },
                ].map(({ name, highlight }) => (
                  <div key={name} className={`grid grid-cols-5 gap-4 p-4 ${highlight ? "bg-muted" : ""}`}>
                    <div>{name}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>{formatCurrency(0)}</div>
                    <div>0.00%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* BID TOTAL */}
            <div className="rounded-lg border mt-4">
              <div className={`grid grid-cols-5 gap-4 p-4 bg-muted font-medium`}>
                <div>BID TOTAL</div>
                <div>{formatCurrency(0)}</div>
                <div>{formatCurrency(0)}</div>
                <div>{formatCurrency(0)}</div>
                <div>0.00%</div>
              </div>
            </div>
          </div>

          {/* Sale Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sale Items</h3>
            <div className="rounded-lg border overflow-x-auto">
              <div className="min-w-[1200px]">
                <div className="grid grid-cols-10 gap-4 p-4 border-b bg-muted/50">
                  <div className="font-medium">Item #</div>
                  <div className="font-medium">Item Name</div>
                  <div className="font-medium">Vendor</div>
                  <div className="font-medium">Quote Price</div>
                  <div className="font-medium">Mark Up</div>
                  <div className="font-medium">Margin</div>
                  <div className="font-medium">Unit Price</div>
                  <div className="font-medium">Quantity</div>
                  <div className="font-medium">Extended Price</div>
                  <div className="font-medium">Gross Profit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Equipment Summary</h3>
            <div className="rounded-lg border">
              <div className="grid grid-cols-3 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Item</div>
                <div className="font-medium">Total</div>
                <div className="font-medium">Phase 1</div>
              </div>
              <div className="divide-y">
                {[
                  "4' Ft Type III",
                  "6 Ft Wings",
                  "H Stand",
                  "Post",
                  "Covers",
                  "Metal Stands",
                  "Sandbag",
                  "HI Vertical Panels",
                  "Type XI Vertical Panels",
                  "B-Lites",
                  "A/C-Lites",
                  "Sharps",
                  "HI",
                  "DG",
                  "Special",
                  "TMA",
                  "Arrow Board",
                  "Message Board",
                  "Speed Trailer"
                ].map((item) => (
                  <div key={item} className="grid grid-cols-3 gap-4 p-4">
                    <div>{item}</div>
                    <div>0</div>
                    <div>0</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Labor Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Labor Summary (Hours)</h3>
            <div className="rounded-lg border">
              <div className="grid grid-cols-2 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Type</div>
                <div className="font-medium">Hours</div>
              </div>
              <div className="divide-y">
                {[
                  { name: "Rated Labor Hours", highlight: false },
                  { name: "Shop Labor Hours", highlight: false },
                  { name: "Permanent Sign Hours", highlight: false },
                  { name: "Total", highlight: true }
                ].map(({ name, highlight }) => (
                  <div key={name} className={`grid grid-cols-2 gap-4 p-4 ${highlight ? "bg-muted" : ""}`}>
                    <div>{name}</div>
                    <div>0.00 hrs</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Square Footage */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Square Footage by Sign Type</h3>
            <div className="rounded-lg border">
              <div className="grid grid-cols-2 gap-4 p-4 border-b bg-muted/50">
                <div className="font-medium">Type</div>
                <div className="font-medium">Area</div>
              </div>
              <div className="divide-y">
                {[
                  "High Intensity",
                  "Diamond Grade",
                  "Special"
                ].map((type) => (
                  <div key={type} className="grid grid-cols-2 gap-4 p-4">
                    <div>{type}</div>
                    <div>0.00 sq. ft.</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 