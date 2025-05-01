"use client";

import { AppSidebar } from "@/components/app-sidebar";
import StepsMain from "@/components/pages/steps-main";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { fetchBidById } from "@/lib/api-client";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

function ActiveBidContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const source = searchParams.get("source");
  
  const [isLoading, setIsLoading] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  
  useEffect(() => {
    const fetchJobData = async () => {
      if (!jobId) return;
      
      try {
        setIsLoading(true);
        const job = await fetchBidById(parseInt(jobId));
        console.log('Fetched job data:', job);
        
        let formattedLettingDate = '';
        if (job.letting_date) {
          if (typeof job.letting_date === 'string' && job.letting_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedLettingDate = job.letting_date;
          } else {
            try {
              const date = new Date(job.letting_date);
              if (!isNaN(date.getTime())) {
                formattedLettingDate = date.toISOString().split('T')[0];
              }
            } catch (error) {
              console.error('Error formatting letting date:', error);
            }
          }
        }
        
        const mappedData = {
          adminData: {
            contractNumber: job.contract_number || '',
            estimator: job.requestor || '',
            owner: job.owner || '',
            county: {
              name: job.county || '',
              district: 0,
              branch: job.branch || '',
              laborRate: 0,
              fringeRate: 0,
              shopRate: 0,
              flaggingRate: 0,
              flaggingBaseRate: 0,
              flaggingFringeRate: 0,
              ratedTargetGM: 0,
              nonRatedTargetGM: 0,
              insurance: 0,
              fuel: 0,
              market: 'CORE'
            },
            srRoute: '',
            location: job.location || '',
            division: job.platform || '',
            lettingDate: formattedLettingDate || '',
            startDate: null,
            endDate: job.due_date || '',
            dbe: job.dbe_percentage ? job.dbe_percentage.toString() : '',
            emergencyJob: false,
            rated: 'NON-RATED',
            emergencyFields: {}
          },
          mptRental: {
            targetMOIC: 0,
            paybackPeriod: 0,
            annualUtilization: 0,
            dispatchFee: 0,
            mpgPerTruck: 0,
            staticEquipmentInfo: {},
            phases: [{
              name: 'Phase 1',
              startDate: null,
              endDate: null,
              personnel: 0,
              days: 0,
              numberTrucks: 0,
              additionalRatedHours: 0,
              additionalNonRatedHours: 0,
              maintenanceTrips: 0,
              standardEquipment: {},
              customLightAndDrumItems: [],
              signs: []
            }]
          },
          saleItems: [],
          equipmentItems: []
        };
        
        console.log('Mapped form data:', mappedData);
        setJobData(mappedData);
      } catch (error) {
        console.error('Error fetching job data:', error);
        toast.error('Failed to fetch job data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJobData();
  }, [jobId]);
  
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-6">
            <div className="mb-6">
              <Link
                href="/jobs/active-bids"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "gap-2 -ml-2 mb-4"
                )}
              >
                <MoveLeft className="w-3 mt-[1px]" /> Back to Bid List
              </Link>
              <h1 className="text-3xl font-bold">Create New Bid</h1>
              {source && <p className="text-muted-foreground">Source: {source}</p>}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p>Loading job data...</p>
              </div>
            ) : (
              <StepsMain initialData={jobData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActiveBidPage() {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 68)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col -mt-8">
            <ActiveBidContent />
          </div>
        </SidebarInset>
      </Suspense>
    </SidebarProvider>
  );
}
