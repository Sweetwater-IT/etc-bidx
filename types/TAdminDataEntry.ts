export type AdminDataEntry = {
  id: number;
  bid_estimate_id: number | null;
  job_id: number | null;
  contract_number: string | null;
  estimator: string | null;
  division: 'PUBLIC' | 'PRIVATE' | null;
  bid_date: string | null; // fechas como string (ISO) en DB
  owner: 'PENNDOT' | 'TURNPIKE' | 'PRIVATE' | 'OTHER' | 'SEPTA' | null;
  county: any; // o tu tipo County si ya lo tipaste igual en DB
  sr_route: string | null;
  location: string | null;
  dbe: string | null;
  start_date: string | null;
  end_date: string | null;
  winter_start: string | null;
  winter_end: string | null;
  ow_travel_time_mins: number | null;
  ow_mileage: number | null;
  fuel_cost_per_gallon: number | null;
  emergency_job: boolean;
  rated: 'RATED' | 'NON-RATED' | null;
  emergency_fields: any;
};
