"use client"

import * as React from "react"
import { z } from "zod"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { IconLayoutGrid, IconPlus } from "@tabler/icons-react"
import { JobData } from "@/data/jobs-data"

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

interface Segment {
  label: string
  value: string
}

interface DataTableProps {
  data: JobData[]
  segments?: Segment[]
  addButtonLabel?: string
  showCustomizeColumns?: boolean
}

export function DataTable({ 
  data,
  segments,
  addButtonLabel = "Add Section",
  showCustomizeColumns = true,
}: DataTableProps) {
  const [activeSegment, setActiveSegment] = React.useState(segments?.[0]?.value || "");

  return (
    <div className="px-4 lg:px-6">
      {segments && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            {segments.map((segment) => (
              <button
                key={segment.value}
                onClick={() => setActiveSegment(segment.value)}
                className={`
                  px-4 py-1.5 text-sm font-medium transition-colors rounded-md
                  ${activeSegment === segment.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {segment.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {showCustomizeColumns && (
              <Button variant="outline" size="sm" className="h-9 flex items-center">
                <IconLayoutGrid className="mr-0 size-4 mt-[2px] md-[-6px]" />
                Customize Columns
              </Button>
            )}
            <Button size="sm" className="h-9">
              <IconPlus className="mr-0 size-4 mt-[2px] md-[-6px]" />
              {addButtonLabel}
            </Button>
          </div>
        </div>
      )}
      <div className="rounded-lg border bg-card px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead>Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell>{job.company}</TableCell>
                <TableCell>{job.location}</TableCell>
                <TableCell>{job.type}</TableCell>
                <TableCell>{job.status}</TableCell>
                <TableCell className="text-right">
                  ${job.budget.toLocaleString()}
                </TableCell>
                <TableCell>{new Date(job.deadline).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}