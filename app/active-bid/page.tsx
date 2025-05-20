"use client";

import { AppSidebar } from "@/components/app-sidebar";
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
import dynamic from 'next/dynamic';

// Dynamically import StepsMain to avoid hydration issues
const StepsMain = dynamic(
  () => import("@/components/pages/steps-main"),
  { ssr: false }
);

function ActiveBidContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const source = searchParams.get("source");
  
  // Initialize with default values to avoid hydration mismatches
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  
  // Set the actual values after first render to avoid hydration issues
  useEffect(() => {
    const isEditingValue = searchParams.get("isEditing") === "true";
    setIsEditing(isEditingValue);
    setIsProcessing(isEditingValue);
  }, [searchParams]);

  // Helper function to format dates for input fields
  const formatDateForInput = (dateString: string | Date | null): string | null => {
    if (!dateString) return null;
    
    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      
      // Otherwise, convert to Date and format
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error formatting date:', error);
    }
    
    return null;
  };

  // This effect runs when jobId changes to fetch data
  useEffect(() => {
    // Skip if no jobId is provided
    if (!jobId) return;
    
    const fetchJobData = async () => {      
      try {
        setIsLoading(true);
        // No need to set isProcessing here as it's already set in the useEffect above
        
        const job = await fetchBidById(parseInt(jobId));
        console.log('Fetched job data:', job);
        
        // Process date fields properly
        const formattedLettingDate = formatDateForInput(job.letting_date) || '';
        
        // Log the raw data to help with debugging
        console.log('Raw job data for prefilling:', job);
        
        // Create a more comprehensive mapped data object with all available fields from the job
        // Ensure we include the ID values for dropdown fields to properly prefill them
        const mappedData = {
          adminData: {
            contractNumber: job.contract_number || '',
            // For dropdown fields, ensure we have both ID and name values
            estimator: job.requestor_id || job.requestor || '',
            estimatorName: job.requestor || '',
            estimatorId: job.requestor_id || '',
            owner: job.owner_id || job.owner || '',
            ownerName: job.owner || '',
            ownerId: job.owner_id || '',
            county: {
              id: job.county_id || 0,
              name: job.county || '',
              district: job.district || 0,
              branch: job.branch || '',
              laborRate: job.labor_rate || 0,
              fringeRate: job.fringe_rate || 0,
              shopRate: job.shop_rate || 0,
              flaggingRate: job.flagging_rate || 0,
              flaggingBaseRate: job.flagging_base_rate || 0,
              flaggingFringeRate: job.flagging_fringe_rate || 0,
              ratedTargetGM: job.rated_target_gm || 0,
              nonRatedTargetGM: job.non_rated_target_gm || 0,
              insurance: job.insurance || 0,
              fuel: job.fuel || 0,
              market: job.market || 'CORE'
            },
            srRoute: job.sr_route || '',
            location: job.location || '',
            division: job.platform || '',
            lettingDate: formattedLettingDate || '',
            startDate: job.start_date ? formatDateForInput(job.start_date) : '',
            endDate: job.due_date ? formatDateForInput(job.due_date) : '',
            dbe: job.dbe_percentage ? job.dbe_percentage.toString() : '',
            owTravelTimeMins: job.ow_travel_time_mins || 0,
            owMileage: job.ow_mileage || 0,
            fuelCostPerGallon: job.fuel_cost_per_gallon || 0,
            emergencyJob: job.emergency_job || false,
            rated: job.rated || 'NON-RATED',
            emergencyFields: job.emergency_fields || {}
          },
          mptRental: {
            targetMOIC: job.target_moic || 0,
            paybackPeriod: job.payback_period || 0,
            annualUtilization: job.annual_utilization || 0,
            dispatchFee: job.dispatch_fee || 0,
            mpgPerTruck: job.mpg_per_truck || 0,
            staticEquipmentInfo: job.static_equipment_info || {},
            phases: job.phases && job.phases.length > 0 ? job.phases.map(phase => ({
              name: phase.name || 'Phase 1',
              startDate: phase.start_date || null,
              endDate: phase.end_date || null,
              personnel: phase.personnel || 0,
              days: phase.days || 0,
              numberTrucks: phase.number_trucks || 0,
              additionalRatedHours: phase.additional_rated_hours || 0,
              additionalNonRatedHours: phase.additional_non_rated_hours || 0,
              maintenanceTrips: phase.maintenance_trips || 0,
              standardEquipment: phase.standard_equipment || {
                // Add default empty objects with quantity: 0 for required equipment types
                fourFootTypeIII: { quantity: 0 },
                hStand: { quantity: 0 },
                post: { quantity: 0 }
              },
              customLightAndDrumItems: phase.custom_light_and_drum_items || [],
              signs: phase.signs || []
            })) : [{
              name: 'Phase 1',
              startDate: null,
              endDate: null,
              personnel: 0,
              days: 0,
              numberTrucks: 0,
              additionalRatedHours: 0,
              additionalNonRatedHours: 0,
              maintenanceTrips: 0,
              standardEquipment: {
                fourFootTypeIII: { quantity: 0 },
                hStand: { quantity: 0 },
                post: { quantity: 0 }
              },
              customLightAndDrumItems: [],
              signs: []
            }]
          },
          saleItems: job.sale_items || [],
          equipmentItems: job.equipment_items || [],
          // Add a flag to indicate this is an edit operation and the form should be auto-submitted
          isEditOperation: isEditing
        };
        
        console.log('Mapped form data:', mappedData);
        setJobData(mappedData);
        
        // If we're editing, we need to mark the form as ready
        if (isEditing) {
          // Small delay to ensure the form is fully loaded before showing it
          setTimeout(() => {
            setIsReady(true);
            setIsProcessing(false);
          }, 500);
        }
      } catch (error) {
        console.error('Error fetching job data:', error);
        toast.error('Failed to fetch job data');
        setIsProcessing(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJobData();
  }, [jobId, isEditing]); // Include isEditing since we're using it inside the effect
  
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
              <h1 className="text-3xl font-bold">
                {isEditing && jobData?.adminData?.contractNumber 
                  ? `Edit Bid - ${jobData.adminData.contractNumber}` 
                  : "Create New Bid"}
              </h1>
              {source && <p className="text-muted-foreground">Source: {source}</p>}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p>Loading job data...</p>
              </div>
            ) : isEditing && (isProcessing || !isReady) ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="mb-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
                <p>Preparing bid form...</p>
                <p className="text-sm text-muted-foreground mt-2">Please wait while we get everything ready.</p>
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
