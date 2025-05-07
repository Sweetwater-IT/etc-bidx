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
        let combinedData: ContractData[] = [];
        
        const counts = {
          all: 0,
          won: 0,
          "won-pending": 0,
          jobs: 0
        };
        
        if (currentSegment !== "jobs") {
          let bidData: any[] = [];
          
          let statusFilter = '';
          
          if (currentSegment === "all") {
            statusFilter = "won,won-pending";
            console.log('Fetching both Won and Won-Pending bids...');
          } else if (currentSegment === "won") {
            statusFilter = "won";
            console.log('Fetching only Won bids...');
          } else if (currentSegment === "won-pending") {
            statusFilter = "won-pending";
            console.log('Fetching only Won-Pending bids...');
          }
          
          const bidResponse = await fetch(`/api/active-bids?status=${statusFilter}`);
          const apiResult = await bidResponse.json();
          
          if (apiResult.success && apiResult.data) {
            console.log(`Found ${apiResult.data.length} bids with status: ${statusFilter}`);
            bidData = apiResult.data;
            
            if (statusFilter.includes('won,won-pending')) {
              counts.all += bidData.length;
              
              bidData.forEach(bid => {
                if (bid.status === 'won') {
                  counts.won++;
                } else if (bid.status === 'won-pending') {
                  counts["won-pending"]++;
                }
              });
            } else if (statusFilter === 'won') {
              counts.won += bidData.length;
              counts.all += bidData.length;
            } else if (statusFilter === 'won-pending') {
              counts["won-pending"] += bidData.length;
              counts.all += bidData.length;
            }
            
            if (bidData.length > 0) {
              console.log('Sample bid data:', bidData[0]);
              console.log('Sample bid status:', bidData[0].status);
            }
          } else {
            console.log(`No bids found with status: ${statusFilter}`);
          }
          
          const bidResult = { 
            success: true, 
            data: bidData 
          };
          
          console.log(`Combined bid data: ${bidResult.data.length} records`);
          
          if (bidResult.data.length > 0) {
            console.log('First bid data from bid_estimates:', bidResult.data[0]);
            
            const bidData = bidResult.data.map((bid: any) => {
              if (bid.id === bidResult.data[0]?.id) {
                console.log('letting_date from bid_estimates:', bid.letting_date);
                console.log('estimator from bid_estimates:', bid.estimator);
              }
              
              const displayStatus = bid.status ? 
                bid.status
                  .split('-')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
            combinedData = [...combinedData, ...bidData];
          } else {
            console.log("No bid data found with the specified status");
          }
        }
        
        if (currentSegment === "all" || currentSegment === "jobs") {
          const jobsResponse = await fetch("/api/jobs");
          const jobsData = await jobsResponse.json();
          
          if (Array.isArray(jobsData)) {
            counts.jobs += jobsData.length;
            counts.all += jobsData.length;
            
            if (jobsData.length > 0) {
              console.log('First job data from jobs table:', jobsData[0]);
              
              const firstJobDetails = jobsData[0].job_details || {};
              console.log('Job details JSONB for first job:', firstJobDetails);
              
            }
            
            const formattedJobs = jobsData.map((job: any) => {
              if (job.id === jobsData[0]?.id) {
                console.log('First job from API:', job);
                console.log('Letting date from job:', job.lettingDate);
                console.log('Estimator from job:', job.estimator);
              }
              
              const displayStatus = job.projectStatus ? 
                job.projectStatus
                  .split(/[-\s]/)
                  .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ') : 'Active';
              
              return {
                id: job.id,
                letting_date: formatDate(job.lettingDate), // Use the lettingDate field from the API
                contract_number: job.contractNumber || '',
                contractor: job.contractor || 'Not Specified',
                status: displayStatus,
                county: job.county || '',
                branch: job.branch || '',
                estimator: job.estimator || 'Not Assigned', // Use the estimator field from the API
                created_at: formatDate(job.createdAt),
                source: "job" as const,
                job_number: job.jobNumber
              };
            });
            combinedData = [...combinedData, ...formattedJobs];
          } else {
            console.error("Failed to fetch jobs or invalid response format");
          }
        }
        
        // Sort combined data by created_at (newest first)
        combinedData.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        // Update the contracts state with the combined data
        setContracts(combinedData);
        
        // Update the segment counts state
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
