"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  HashIcon,
  LayersIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  BuildingIcon,
  ClockIcon,
  DollarSignIcon,
  EyeIcon,
  PencilIcon,
  AlertCircle,
} from "lucide-react";
import { type ActiveJob } from "@/data/active-jobs";
import { Separator } from "./ui/separator";
import { formatDate } from "@/lib/formatUTCDate";
import FileViewingContainer from "./file-viewing-container";
import { DropzoneContent, DropzoneEmptyState, Dropzone } from "./ui/dropzone";
import { useFileUpload } from "@/hooks/use-file-upload";
import { FileMetadata } from "@/types/FileTypes";
import { toast } from "sonner";
import { fetchFileMetadataByFolder } from "@/lib/api-client";

interface ActiveJobDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: ActiveJob;
  onEdit?: (job: ActiveJob) => void;
  onNavigate?: (direction: "up" | "down") => void;
}

export function ActiveJobDetailsSheet({
  open,
  onOpenChange,
  job,
  onEdit,
  onNavigate,
}: ActiveJobDetailsSheetProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [files, setFiles] = useState<FileMetadata[]>([])

  const getFiles = async () => {
    const fileResponse = await fetchFileMetadataByFolder(
      Number(job?.id),
      'jobs'
    )
    if (fileResponse.success) {
      setFiles(fileResponse.files)
    } else {
      toast.error("Couldn't fetch files for this bid: " + fileResponse.error)
    }
  }

  useEffect(() => {
    if (job && job?.id && open) {
      getFiles()
    }
  }, [job, open])

  const fileUploadProps = useFileUpload({
    maxFileSize: 50 * 1024 * 1024, 
    maxFiles: 5, 
    uniqueIdentifier: job?.id,
    folder: 'jobs',
    apiEndpoint: '/api/files',
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'application/zip': ['.zip'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    onSuccess: getFiles
  });

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" && onNavigate) {
        e.preventDefault();
        onNavigate("down");
      } else if (e.key === "ArrowUp" && onNavigate) {
        e.preventDefault();
        onNavigate("up");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onNavigate]);

  // Update dates when job changes
  useEffect(() => {
    if (job) {
      setStartDate(job.startDate ? new Date(job.startDate) : undefined);
      setEndDate(job.endDate ? new Date(job.endDate) : undefined);
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [job]);

  const handleEdit = () => {
    if (job && onEdit) {
      onOpenChange(false); // Close the details sheet
      onEdit(job);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] flex flex-col p-0"
      >
        <SheetHeader className="p-0">
          <div className="flex items-center p-6 pb-2">
            <SheetTitle>
              Job Detailss {job?.jobNumber ? `- ${job.jobNumber}` : ""}
            </SheetTitle>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md flex items-center gap-1 ml-2">
              View Only <EyeIcon className="h-3 w-3" />
            </span>
          </div>
          <Separator />
        </SheetHeader>

        {job && (
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex-1 overflow-y-auto p-6 pt-2">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">
                      Job Number
                    </Label>
                    <div className="font-medium">{job.jobNumber || ""}</div>
                  </div>

                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">
                      Bid Number
                    </Label>
                    <div className="font-medium">{job.bidNumber || ""}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Project Status
                    </Label>
                    <div className="font-medium">{job.projectStatus.replace('_', ' ')}</div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Billing Status
                    </Label>
                    <div className="font-medium">{job.billingStatus.replace('_', ' ') || ""}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Contract Number
                    </Label>
                    <div className="font-medium">
                      {job.contractNumber || ""}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Location
                    </Label>
                    <div className="font-medium">{job.location || ""}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 w-full">
                    <Label>County</Label>
                    <div className="font-medium">{(job.county as any).main || ""}</div>
                  </div>

                  <div className="space-y-1 w-full">
                    <Label>Branch</Label>
                    <div className="font-medium">{job.branch || ""}</div>
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="text-sm text-muted-foreground">
                    Contractor
                  </Label>
                  <div className="font-medium">{job.contractor || ""}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">
                      Start Date
                    </Label>
                    <div className="font-medium">
                      {startDate ? formatDate(startDate) : ""}
                    </div>
                  </div>

                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">
                      End Date
                    </Label>
                    <div className="font-medium">
                      {endDate ? formatDate(endDate) : ""}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">
                      Labor Rate
                    </Label>
                    <div className="font-medium">
                      {job.countyJson && job.countyJson.laborRate
                        ? '$' + job.countyJson.laborRate.toFixed(2)
                        : ""}
                    </div>
                  </div>

                  <div className="space-y-1 w-full">
                    <Label className="text-sm text-muted-foreground">
                      Fringe Rate
                    </Label>
                    <div className="font-medium">
                      {job.countyJson && job.countyJson.laborRate
                        ? '$' + job.countyJson.fringeRate.toFixed(2)
                        : ""}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <Label className="font-medium">Services Required</Label>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                    {job?.wonBidItems.map((wbi, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-gray-100 rounded-md"
                      >
                        {wbi}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <div className='rounded-lg border p-6'>
                    <h2 className='mb-4 text-lg font-semibold'>Files</h2>
                    <FileViewingContainer files={files} onFilesChange={setFiles} />
                    <Dropzone {...fileUploadProps}>
                      <DropzoneContent />
                      <DropzoneEmptyState />
                    </Dropzone>
                  </div>
                </div>
                {job?.overdays && job?.overdays > 0 && (
                  <div className="space-y-2 w-full">
                    <Label>Overdays</Label>
                    <div className="flex items-center mt-2 text-sm gap-2 text-amber-500">
                      <AlertCircle size={14} />
                      <span>This job is overdays</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
            <div className="flex justify-end p-6 pt-0 gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleEdit}>
                Edit
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
