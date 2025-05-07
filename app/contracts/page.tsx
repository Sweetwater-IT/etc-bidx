"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { CardActions } from "@/components/card-actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ContractData = {
  id: number;
  letting_date?: string | null;
  contract_number: string;
  contractor: string | null;
  status: string;
  county: string;
  branch: string;
  estimator?: string | null;
  created_at: string;
  source: "bid" | "job";
  job_number?: string;
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  if (dateString === "N/A") return "N/A";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch (e) {
    return "N/A";
  }
};

const COLUMNS = [
  { key: "letting_date", title: "Letting Date" },
  { key: "contract_number", title: "Contract #" },
  { key: "contractor", title: "Contractor" },
  { key: "status", title: "Status" },
  { key: "county", title: "County" },
  { key: "branch", title: "Branch" },
  { key: "estimator", title: "Estimator" },
  { key: "created_at", title: "Created At" },
];


export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSegment, setCurrentSegment] = useState("all");
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({
    all: 0,
    won: 0,
    "won-pending": 0,
    jobs: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Always fetch ALL data for accurate counts, regardless of current segment
        const counts = {
          all: 0,
          won: 0,
          "won-pending": 0,
          jobs: 0
        };
        
        // 1. First, fetch ALL won and won-pending bids to get accurate counts
        console.log('Fetching all bids for counts...');
        const allBidsResponse = await fetch(`/api/active-bids?status=won,won-pending`);
        const allBidsResult = await allBidsResponse.json();
        
        let allBids: any[] = [];
        if (allBidsResult.success && allBidsResult.data) {
          allBids = allBidsResult.data;
          console.log(`Found ${allBids.length} total bids (won + won-pending)`);
          
          // Log all bid statuses to debug
          console.log('All bid statuses:', allBids.map(bid => ({ id: bid.id, status: bid.status })));
          
          // Count bids by status (case-insensitive)
          allBids.forEach(bid => {
            // Convert status to lowercase for consistent comparison
            const lowerStatus = bid.status.toLowerCase();
            
            if (lowerStatus === 'won') {
              counts.won++;
              console.log(`Bid ${bid.id} has status 'won'`);
            } else if (lowerStatus === 'won-pending' || lowerStatus === 'won - pending') {
              counts["won-pending"]++;
              console.log(`Bid ${bid.id} has status 'won-pending'`);
            } else {
              console.log(`Bid ${bid.id} has unexpected status: '${bid.status}'`);
            }
          });
          
          // Total bids count
          counts.all += allBids.length;
        }
        
        // 2. Fetch all jobs to get accurate job counts
        const jobsResponse = await fetch("/api/jobs");
        const jobsData = await jobsResponse.json();
        
        let allJobs: any[] = [];
        if (Array.isArray(jobsData)) {
          allJobs = jobsData;
          counts.jobs = allJobs.length;
          counts.all += allJobs.length; // Add jobs to the total count
        }
        
        // 3. Now prepare the data for the current segment
        let displayData: ContractData[] = [];
        
        if (currentSegment === "all") {
          // Format all bids
          const formattedBids = allBids.map((bid: any) => {
            const displayStatus = bid.status ? 
              bid.status
                .split('-')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ') : '';
            
            return {
              id: bid.id,
              letting_date: formatDate(bid.letting_date),
              contract_number: bid.contract_number || '',
              contractor: bid.contractor || 'Not Specified',
              status: displayStatus,
              county: bid.county || '',
              branch: bid.branch || '',
              estimator: bid.estimator || 'Not Assigned',
              created_at: formatDate(bid.created_at),
              source: "bid" as const
            };
          });
          
          // Format all jobs
          const formattedJobs = allJobs.map((job: any) => {
            const displayStatus = job.projectStatus ? 
              job.projectStatus
                .split(/[-\s]/)
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ') : 'Active';
            
            return {
              id: job.id,
              letting_date: formatDate(job.lettingDate),
              contract_number: job.contractNumber || '',
              contractor: job.contractor || 'Not Specified',
              status: displayStatus,
              county: job.county || '',
              branch: job.branch || '',
              estimator: job.estimator || 'Not Assigned',
              created_at: formatDate(job.createdAt),
              source: "job" as const,
              job_number: job.jobNumber
            };
          });
          
          // Combine data for 'all' segment
          displayData = [...formattedBids, ...formattedJobs];
        } else if (currentSegment === "won") {
          // Filter and format only won bids (case-insensitive)
          const wonBids = allBids.filter(bid => bid.status.toLowerCase() === 'won');
          console.log(`Found ${wonBids.length} bids with status 'won' (case-insensitive)`);
          displayData = wonBids.map((bid: any) => {
            return {
              id: bid.id,
              letting_date: formatDate(bid.letting_date),
              contract_number: bid.contract_number || '',
              contractor: bid.contractor || 'Not Specified',
              status: 'Won',
              county: bid.county || '',
              branch: bid.branch || '',
              estimator: bid.estimator || 'Not Assigned',
              created_at: formatDate(bid.created_at),
              source: "bid" as const
            };
          });
        } else if (currentSegment === "won-pending") {
          // Filter and format only won-pending bids (case-insensitive)
          const pendingBids = allBids.filter(bid => {
            const lowerStatus = bid.status.toLowerCase();
            return lowerStatus === 'won-pending' || lowerStatus === 'won - pending';
          });
          console.log(`Found ${pendingBids.length} bids with status 'won-pending' (case-insensitive)`);
          displayData = pendingBids.map((bid: any) => {
            return {
              id: bid.id,
              letting_date: formatDate(bid.letting_date),
              contract_number: bid.contract_number || '',
              contractor: bid.contractor || 'Not Specified',
              status: 'Won Pending',
              county: bid.county || '',
              branch: bid.branch || '',
              estimator: bid.estimator || 'Not Assigned',
              created_at: formatDate(bid.created_at),
              source: "bid" as const
            };
          });
        } else if (currentSegment === "jobs") {
          // Format only jobs
          displayData = allJobs.map((job: any) => {
            const displayStatus = job.projectStatus ? 
              job.projectStatus
                .split(/[-\s]/)
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ') : 'Active';
            
            return {
              id: job.id,
              letting_date: formatDate(job.lettingDate),
              contract_number: job.contractNumber || '',
              contractor: job.contractor || 'Not Specified',
              status: displayStatus,
              county: job.county || '',
              branch: job.branch || '',
              estimator: job.estimator || 'Not Assigned',
              created_at: formatDate(job.createdAt),
              source: "job" as const,
              job_number: job.jobNumber
            };
          });
        }
        
        // Sort by created_at date (newest first)
        displayData.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        // Update states
        setContracts(displayData);
        setSegmentCounts(counts);
        console.log('Updated segment counts:', counts);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentSegment]);

  const handleSegmentChange = (value: string) => {
    setCurrentSegment(value);
  };

  const handleViewDetails = (item: ContractData) => {
    if (item.source === "bid") {
      router.push(`/active-bids/${item.id}`);
    } else {
      router.push(`/jobs/${item.job_number}`);
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex items-center justify-between px-0 -mb-3">
                <CardActions
                  createButtonLabel="Create Contract"
                  onCreateClick={() => router.push("/contracts/create")}
                  hideCalendar
                  goUpActions
                />
              </div>

              <DataTable<ContractData>
                data={contracts}
                columns={COLUMNS}
                segments={[
                  { label: `All (${segmentCounts.all})`, value: "all" },
                  { label: `Won (${segmentCounts.won})`, value: "won" },
                  { label: `Won - Pending (${segmentCounts["won-pending"]})`, value: "won-pending" },
                  { label: `Jobs (${segmentCounts.jobs})`, value: "jobs" },
                ]}
                segmentValue={currentSegment}
                onSegmentChange={handleSegmentChange}
                stickyLastColumn
                onViewDetails={handleViewDetails}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
