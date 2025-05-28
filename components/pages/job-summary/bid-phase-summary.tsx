import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  IconDotsVertical,
  IconTrash,
  IconClipboard,
} from "@tabler/icons-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  name: string;
  params: number;
  value: string | number;
  actions: boolean;
}

interface BidPhase {
  name: string;
  start: string;
  end: string;
  products: Product[];
}

interface BidPhaseSummaryProps {
  bidPhases: BidPhase[];
}

export function BidPhaseSummary({ bidPhases }: BidPhaseSummaryProps) {
  const [activePhase, setActivePhase] = useState(0);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>(
    bidPhases[0]?.products || []
  );

  const phase = bidPhases[activePhase] || bidPhases[0];

  // Update dates and products when phase changes
  React.useEffect(() => {
    if (phase) {
      setStartDate(phase.start ? new Date(phase.start) : undefined);
      setEndDate(phase.end ? new Date(phase.end) : undefined);
      setProducts(phase.products || []);
    }
  }, [phase]);

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-lg font-semibold">BID PHASE SUMMARY</h2>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button variant="outline" size="sm">
            Save Changes
          </Button>
        </div>
      </div>

      {/* Phases Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {bidPhases.map((phase, idx) => (
          <button
            key={idx}
            className={`px-6 py-2 font-medium focus:outline-none transition-colors cursor-pointer ${
              activePhase === idx
                ? "border-b-2 border-black text-black"
                : "text-gray-500"
            }`}
            onClick={() => setActivePhase(idx)}
            type="button"
          >
            {phase.name}
          </button>
        ))}
        <button
          className="px-6 py-2 font-medium text-gray-400 hover:text-black"
          type="button"
          onClick={() => { /* lógica para adicionar fase */ }}
        >
          + Add Phase
        </button>
      </div>

      {/* Dates & Toggles */}
      <div className="flex gap-4 items-center mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "min-w-[180px] w-auto justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-0 h-4 w-4" />
              {startDate instanceof Date && !isNaN(startDate.getTime()) ? (
                format(startDate, "PPP")
              ) : (
                <span>Start date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span>-</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "min-w-[180px] w-auto justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-0 h-4 w-4" />
              {endDate instanceof Date && !isNaN(endDate.getTime()) ? (
                format(endDate, "PPP")
              ) : (
                <span>End date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
              disabled={(date) => (startDate ? date < startDate : false)}
            />
          </PopoverContent>
        </Popover>

        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" className="accent-primary" /> Hide empty fields
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" className="accent-primary" /> Use bid values
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border rounded">
          <thead>
            <tr className="bg-muted">
              <th className="px-2 py-1 text-left font-semibold border-r border-border last:border-r-0">
                Product Name:
              </th>
              <th className="px-2 py-1 text-left font-semibold border-r border-border last:border-r-0">
                Parameters / Units:
              </th>
              <th className="px-2 py-1 text-left font-semibold border-r border-border last:border-r-0">
                Bid values:
              </th>
              <th className="px-2 py-1 text-left font-semibold">Actions:</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod, idx) => (
              <tr key={idx} className="border-b last:border-b-0">
                <td className="px-2 py-0 border-r border-border last:border-r-0">
                  {prod.name}
                </td>
                <td className="px-2 py-0 border-r border-border last:border-r-0">
                  {prod.params}
                </td>
                <td className="px-2 py-0 border-r border-border last:border-r-0">
                  {prod.actions ? (
                    <input
                      type="text"
                      value={prod.value}
                      placeholder="Enter number..."
                      className="border-[1px] border-border rounded px-2 py-1 text-sm w-28"
                      onChange={(e) => {
                        const newProducts = [...products];
                        newProducts[idx] = {
                          ...prod,
                          value: e.target.value,
                        };
                        setProducts(newProducts);
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      defaultValue={prod.value}
                      placeholder="Enter number..."
                      className="border-[1px] border-border rounded px-2 py-1 text-sm w-28"
                      readOnly
                    />
                  )}
                </td>
                <td className="px-2 py-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded hover:bg-muted focus:outline-none">
                        <IconDotsVertical className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(prod.name)}
                      >
                        <IconClipboard className="w-4 h-4 mr-2" /> Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => alert(`Deletar ${prod.name}`)}
                      >
                        <IconTrash className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
