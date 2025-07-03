import React from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Phase } from "@/types/MPTEquipment";

interface PhaseInfoTableProps {
  phase: Phase;
  index: number;
}

const PhaseInfoTable: React.FC<PhaseInfoTableProps> = ({ phase, index }) => {
  return (
    <div className="space-y-4">
      {/* Phase Information Table */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phase Name</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">
                {phase.name || `Phase ${index + 1}`}
              </TableCell>
              <TableCell>{phase.days} days</TableCell>
              <TableCell>
                {phase.startDate ? format(phase.startDate, "PPP") : "Not set"}
              </TableCell>
              <TableCell>
                {phase.endDate ? format(phase.endDate, "PPP") : "Not set"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Trip and Labor Information Table */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Personnel</TableHead>
              <TableHead>Trucks</TableHead>
              <TableHead>Additional Trips</TableHead>
              <TableHead>Additional Rated Hours</TableHead>
              <TableHead>Additional Non-Rated Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">{phase.personnel}</TableCell>
              <TableCell>{phase.numberTrucks}</TableCell>
              <TableCell>{phase.maintenanceTrips}</TableCell>
              <TableCell>{phase.additionalRatedHours}</TableCell>
              <TableCell>{phase.additionalNonRatedHours}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PhaseInfoTable;