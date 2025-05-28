import React from "react";
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
  return (
    <div className="bg-card rounded-xl border shadow-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-lg font-semibold">BID PHASE SUMMARY</h2>
        <div className="flex gap-2 mt-2 md:mt-0">
          <input
            type="text"
            placeholder="Search..."
            className="border rounded px-2 py-1 text-sm"
          />
          <Button variant="outline" size="sm">
            Save Changes
          </Button>
        </div>
      </div>

      {/* Phases Tabs */}
      <div className="flex gap-2 mb-4">
        {bidPhases.map((phase, idx) => (
          <Button
            key={idx}
            variant={idx === 0 ? "default" : "outline"}
            size="sm"
          >
            {phase.name}
          </Button>
        ))}
        <Button variant="ghost" size="sm">
          + Add Phase
        </Button>
      </div>

      {/* Dates & Toggles */}
      <div className="flex gap-4 items-center mb-4">
        <input
          type="text"
          value={bidPhases[0].start}
          className="border rounded px-2 py-1 text-sm w-32"
          readOnly
        />
        <span>-</span>
        <input
          type="text"
          value={bidPhases[0].end}
          className="border rounded px-2 py-1 text-sm w-32"
          readOnly
        />
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
              <th className="px-2 py-1 text-left font-semibold">
                Product Name:
              </th>
              <th className="px-2 py-1 text-left font-semibold">
                Parameters / Units:
              </th>
              <th className="px-2 py-1 text-left font-semibold">Bid values:</th>
              <th className="px-2 py-1 text-left font-semibold">Actions:</th>
            </tr>
          </thead>
          <tbody>
            {bidPhases[0].products.map((prod, idx) => (
              <tr key={idx} className="border-b last:border-b-0">
                <td className="px-2 py-1">{prod.name}</td>
                <td className="px-2 py-1">{prod.params}</td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    value={prod.value}
                    placeholder="Enter number..."
                    className="border-none rounded px-2 py-1 text-sm w-28"
                    readOnly={!prod.actions}
                  />
                </td>
                <td className="px-2 py-1">
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
