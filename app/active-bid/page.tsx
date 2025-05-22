"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { fetchBidById, fetchReferenceData } from "@/lib/api-client";
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
        
        // Fetch the job data and all reference data in parallel
        const [job, countiesData, ownersData, usersData] = await Promise.all([
          fetchBidById(parseInt(jobId)),
          fetchReferenceData('counties'),
          fetchReferenceData('owners'),
          fetchReferenceData('users')
        ]);
        
        console.log('Fetched job data:', job);
        console.log('Fetched counties data:', countiesData);
        console.log('Fetched owners data:', ownersData);
        console.log('Fetched users data:', usersData);
        
        // Determine if the data is from available_jobs or bid_estimates
        const isFromAvailableJobs = job.hasOwnProperty('contract_number') === false && job.hasOwnProperty('contractor');
        
        // Extract all relevant fields from the job data with simpler approach
        const contractNumber = isFromAvailableJobs ? job.contractNumber : job.contract_number;
        const ownerName = isFromAvailableJobs ? job.owner : job.owner;
        const countyName = isFromAvailableJobs ? job.county?.main || job.countyValue : job.county;
        const branch = isFromAvailableJobs ? job.county?.secondary || job.branch : job.branch;
        
        // Handle date fields - for available_jobs, use letting_date, due_date, and entry_date
        const lettingDate = job.letting_date || job.lettingDate;
        
        // For start date, use entry_date if available (for available_jobs) or start_date (for bid_estimates)
        // If neither is available, use the current date
        const startDate = job.entry_date || job.start_date || new Date().toISOString().split('T')[0];
        
        // For end date, use due_date if available (for available_jobs) or end_date (for bid_estimates)
        const endDate = job.due_date || job.dueDate || job.end_date;
        
        const location = job.location;
        const division = job.platform || job.division;
        const dbe = job.dbe_percentage || job.dbe;
        const requestor = job.requestor || job.estimator;
        
        console.log('Extracted fields:', {
          contractNumber, ownerName, countyName, branch, lettingDate, 
          startDate, endDate, location, division, dbe, requestor
        });
        
        // Check if we have IDs in the response for county, owner, and requestor
        const countyId = job.county ? parseInt(job.county) : null;
        const ownerId = job.owner ? parseInt(job.owner) : null;
        const requestorId = job.requestor ? parseInt(job.requestor) : null;
        
        console.log('Extracted IDs:', { countyId, ownerId, requestorId });
        
        // Define types for our reference data objects
        type County = {
          id: number;
          name: string;
          district?: number;
          branch?: string;
          laborRate?: number;
          fringeRate?: number;
          shopRate?: number;
          flaggingRate?: number;
          flaggingBaseRate?: number;
          flaggingFringeRate?: number;
          ratedTargetGM?: number;
          nonRatedTargetGM?: number;
          insurance?: number;
          fuel?: number;
          market?: string;
        };
        
        type Owner = {
          id: number;
          name: string;
        };
        
        type User = {
          id: number;
          name: string;
        };
        
        // Find the matching county object by ID first, then by name
        let matchingCounty: County | null = null;
        if (countyId && !isNaN(countyId)) {
          const foundCounty = countiesData.find(c => c.id === countyId);
          if (foundCounty) matchingCounty = foundCounty as County;
          console.log('Found county by ID:', matchingCounty);
        }
        
        // If not found by ID, try by name or branch
        if (!matchingCounty) {
          const foundCounty = countiesData.find(c => 
            c.name.toLowerCase() === (countyName || '').toLowerCase() || 
            (c.branch && c.branch.toLowerCase() === (branch || '').toLowerCase())
          );
          if (foundCounty) matchingCounty = foundCounty as County;
          console.log('Found county by name/branch:', matchingCounty);
        }
        
        // Find the matching owner object by ID first, then by name
        let matchingOwner: Owner | null = null;
        if (ownerId && !isNaN(ownerId)) {
          const foundOwner = ownersData.find(o => o.id === ownerId);
          if (foundOwner) matchingOwner = foundOwner as Owner;
          console.log('Found owner by ID:', matchingOwner);
        }
        
        // If not found by ID, try by name
        if (!matchingOwner) {
          const foundOwner = ownersData.find(o => 
            o.name.toLowerCase() === (ownerName || '').toLowerCase()
          );
          if (foundOwner) matchingOwner = foundOwner as Owner;
          console.log('Found owner by name:', matchingOwner);
        }
        
        // Find the matching estimator (user) by ID first, then by name
        let matchingEstimator: User | null = null;
        if (requestorId && !isNaN(requestorId)) {
          const foundUser = usersData.find(u => u.id === requestorId);
          if (foundUser) matchingEstimator = foundUser as User;
          console.log('Found estimator by ID:', matchingEstimator);
        }
        
        // If not found by ID, try by name
        if (!matchingEstimator && requestor) {
          const foundUser = usersData.find(u => 
            u.name.toLowerCase() === (requestor || '').toLowerCase()
          );
          if (foundUser) matchingEstimator = foundUser as User;
          console.log('Found estimator by name:', matchingEstimator);
        }
        
        console.log('Found matching estimator:', matchingEstimator);
        
        // Process date fields properly
        const formattedLettingDate = formatDateForInput(lettingDate) || '';
        
        // Log the raw data to help with debugging
        console.log('Raw job data for prefilling:', job);
        
        // Create a simplified mapped data object for the form
        const mappedData = {
          adminData: {
            // Basic fields
            contractNumber: contractNumber || '',
            division: division || '',
            location: location || '',
            dbe: dbe ? dbe.toString() : '',
            lettingDate: formattedLettingDate || '',
            startDate: startDate ? formatDateForInput(startDate) : '',
            endDate: endDate ? formatDateForInput(endDate) : '',
            
            // Estimator field - use name for dropdown selection
            estimator: matchingEstimator ? matchingEstimator.name : requestor || '',
            
            // Owner field - use name for dropdown selection
            owner: matchingOwner ? matchingOwner.name : ownerName || '',
            
            // County field - use the matching county object or create a fallback
            county: matchingCounty ? {
              id: matchingCounty.id,
              name: matchingCounty.name,
              district: matchingCounty.district || 0,
              branch: matchingCounty.branch || '',
              laborRate: matchingCounty.laborRate || 0,
              fringeRate: matchingCounty.fringeRate || 0,
              shopRate: matchingCounty.shopRate || 0,
              flaggingRate: matchingCounty.flaggingRate || 0,
              flaggingBaseRate: matchingCounty.flaggingBaseRate || 0,
              flaggingFringeRate: matchingCounty.flaggingFringeRate || 0,
              ratedTargetGM: matchingCounty.ratedTargetGM || 0,
              nonRatedTargetGM: matchingCounty.nonRatedTargetGM || 0,
              insurance: matchingCounty.insurance || 0,
              fuel: matchingCounty.fuel || 0,
              market: matchingCounty.market || 'CORE'
            } : countyId ? {
              // If we have a county ID but no matching county, create a minimal object
              id: countyId,
              name: countyName || 'Unknown County',
              branch: branch || '',
              district: 0,
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
            } : null,
            srRoute: job.sr_route || '',
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
        // Store the job data with the properly mapped county
        setJobData(mappedData);
        
        // Log the final mapped data for debugging
        console.log('Final mapped data with county:', mappedData);
        
        // Mark as ready and not loading
        setIsLoading(false);
        setIsReady(true);
        if (isEditing) {
          // Small delay to ensure the form is fully loaded before showing it
          setTimeout(() => {
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
