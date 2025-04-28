import { AppSidebar } from "@/components/app-sidebar";
import StepsMain from "@/components/pages/steps-main";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { MoveLeft } from "lucide-react";
import Link from "next/link";

export interface SignData {
  id: string;
  designation: string;
  dimensions: string;
  sheeting: string;
  quantity: number;
  isConfiguring?: boolean;
}

export interface MPTData {
  mptEquipment: {
    typeIII: number;
    wings: number;
    hStands: number;
    posts: number;
    covers: number;
    metalStands: number;
    sandbags: number;
  };
  lightAndDrum: {
    hiVerticalPanels: number;
    typeXIVerticalPanels: number;
    bLights: number;
    acLights: number;
  };
}

export interface EquipmentRentalData {
  arrowBoard: {
    type25: number;
    type75: number;
    solarAssist: number;
  };
  messageBoard: {
    fullSize: number;
    miniSize: number;
    radar: number;
  };
  attenuator: {
    standard: number;
    smart: number;
  };
  trailer: {
    equipment: number;
    storage: number;
    arrow: number;
    light: number;
  };
}

export interface PermanentSignsData {
  regulatory: {
    stop: number;
    yield: number;
    speedLimit: number;
    noParking: number;
    oneWay: number;
    doNotEnter: number;
  };
  warning: {
    pedestrian: number;
    school: number;
    merge: number;
    curve: number;
    intersection: number;
  };
  guide: {
    street: number;
    highway: number;
    mile: number;
    exit: number;
    directional: number;
  };
  custom: {
    size: string;
    quantity: number;
    description: string;
  };
}

export interface FlaggingData {
  services: {
    trafficControl: number;
    policeDetail: number;
    uniformedFlagger: number;
    trafficSupervisor: number;
  };
  equipment: {
    radioUnit: number;
    safetyVest: number;
    stopSlowPaddle: number;
    flags: number;
  };
}

export interface SaleItemsData {
  materials: {
    concrete: number;
    asphalt: number;
    gravel: number;
    sand: number;
  };
  tools: {
    shovels: number;
    rakes: number;
    wheelbarrows: number;
    safetyCones: number;
  };
  supplies: {
    paint: number;
    markers: number;
    tape: number;
    signs: number;
  };
}

export interface PatternsData {
  pavement: {
    milling: number;
    overlay: number;
    fullDepth: number;
    patching: number;
  };
  markings: {
    thermoplastic: number;
    paint: number;
    epoxy: number;
    preformed: number;
  };
  configurations: {
    laneClosure: number;
    shoulderWork: number;
    intersection: number;
    workZone: number;
  };
}

export interface EquipmentData {
  id: string;
  itemName: string;
  qty: number;
  months: number;
  rentPrice: number;
  reRentCost: number;
  reRent: boolean;
  isConfiguring?: boolean;
}

export interface FormData {
  // Admin Information (Step 1)
  contractNumber?: string;
  owner?: string;
  county?: string;
  branch?: string;
  township?: string;
  division?: string;
  estimator?: string;
  startDate?: string;
  endDate?: string;
  lettingDate?: string;
  srRoute?: string;
  dbePercentage?: string;
  contractor?: string;
  subcontractor?: string;
  laborRate?: string;
  fringeRate?: string;
  shopRate?: string;

  // MUTCD Signs (Step 2)
  signs?: SignData[];

  // Trip and Labor (Step 3)
  projectDays?: string;
  numberOfPersonnel?: string;
  numberOfTrucks?: string;
  trips?: string;
  additionalTrips?: string;
  totalTrips?: string;
  oneWayMileage?: string;
  oneWayTravelTime?: string;
  ratedHours?: string;
  additionalRatedHours?: string;
  totalRatedHours?: string;
  nonratedHours?: string;
  additionalNonRatedHours?: string;
  totalNonRatedHours?: string;
  totalHours?: string;

  // Mobilization (Step 3)
  mobilization?: string;
  fuelCost?: string;
  truckAndFuelCost?: string;

  // Bid Items (Step 4)
  equipment?: EquipmentData[];
  summary?: string;
  grossMargin?: string | number;
  mptData?: MPTData;
  equipmentRental?: EquipmentRentalData;
  permanentSigns?: PermanentSignsData;
  flagging?: FlaggingData;
  saleItems?: SaleItemsData;
  patterns?: PatternsData;

  // MPT items (direct fields for bid_estimates table)
  typeIii4ft?: string;
  wings6ft?: string;
  hStands?: string;
  posts?: string;
  sandBags?: string;
  covers?: string;
  springLoadedMetalStands?: string;
  hiVerticalPanels?: string;
  typeXiVerticalPanels?: string;
  bLites?: string;
  acLites?: string;
  hiSignsSqFt?: string;
  dgSignsSqFt?: string;
  specialSignsSqFt?: string;
  tma?: string;
  arrowBoard?: string;
  messageBoard?: string;
  speedTrailer?: string;
  pts?: string;

  // Financial calculations
  mptValue?: string;
  mptGrossProfit?: string;
  mptGmPercent?: string;
  permSignValue?: string;
  permSignGrossProfit?: string;
  permSignGmPercent?: string;
  rentalValue?: string;
  rentalGrossProfit?: string;
  rentalGmPercent?: string;

  // MPT Rental data
  mptRental?: boolean;
  targetMoic?: string;
  paybackPeriod?: string;
  annualUtilization?: string;
  dispatchFee?: string;
  mpgPerTruck?: string;
  rentalRevenue?: string;
  rentalCost?: string;
  rentalHours?: string;
  staticEquipmentInfo?: string;

  // Allow for additional string fields
  [key: string]:
    | string
    | number
    | boolean
    | SignData[]
    | EquipmentData[]
    | MPTData
    | EquipmentRentalData
    | PermanentSignsData
    | FlaggingData
    | SaleItemsData
    | PatternsData
    | undefined;
}

export default function ActiveBidPage() {
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
        <div className="flex flex-1 flex-col -mt-8">
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
                </div>

                {/* main steps */}
                <StepsMain />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
