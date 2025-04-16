export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type JobStatus = 'Bid' | 'No Bid' | 'Unset';

export interface Database {
  public: {
    Tables: {
      available_jobs: {
        Row: {
          id: number
          status: JobStatus
          branch: string
          contract_number: string
          county: string
          due_date: string
          letting_date: string
          entry_date: string
          location: string
          owner: string
          platform: string
          requestor: string
          mpt: boolean
          flagging: boolean
          perm_signs: boolean
          equipment_rental: boolean
          other: boolean
          dbe_percentage: number | null
          no_bid_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          status?: JobStatus
          branch: string
          contract_number: string
          county: string
          due_date: string
          letting_date: string
          entry_date: string
          location: string
          owner: string
          platform: string
          requestor: string
          mpt?: boolean
          flagging?: boolean
          perm_signs?: boolean
          equipment_rental?: boolean
          other?: boolean
          dbe_percentage?: number | null
          no_bid_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          status?: JobStatus
          branch?: string
          contract_number?: string
          county?: string
          due_date?: string
          letting_date?: string
          entry_date?: string
          location?: string
          owner?: string
          platform?: string
          requestor?: string
          mpt?: boolean
          flagging?: boolean
          perm_signs?: boolean
          equipment_rental?: boolean
          other?: boolean
          dbe_percentage?: number | null
          no_bid_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      archived_available_jobs: {
        Row: {
          id: number
          original_id: number
          status: JobStatus
          branch: string
          contract_number: string
          county: string
          due_date: string
          letting_date: string
          entry_date: string
          location: string
          owner: string
          platform: string
          requestor: string
          mpt: boolean
          flagging: boolean
          perm_signs: boolean
          equipment_rental: boolean
          other: boolean
          dbe_percentage: number | null
          no_bid_reason: string | null
          created_at: string
          updated_at: string
          archived_at: string
        }
        Insert: {
          id?: number
          original_id: number
          status: JobStatus
          branch: string
          contract_number: string
          county: string
          due_date: string
          letting_date: string
          entry_date: string
          location: string
          owner: string
          platform: string
          requestor: string
          mpt?: boolean
          flagging?: boolean
          perm_signs?: boolean
          equipment_rental?: boolean
          other?: boolean
          dbe_percentage?: number | null
          no_bid_reason?: string | null
          created_at: string
          updated_at: string
          archived_at?: string
        }
        Update: {
          id?: number
          original_id?: number
          status?: JobStatus
          branch?: string
          contract_number?: string
          county?: string
          due_date?: string
          letting_date?: string
          entry_date?: string
          location?: string
          owner?: string
          platform?: string
          requestor?: string
          mpt?: boolean
          flagging?: boolean
          perm_signs?: boolean
          equipment_rental?: boolean
          other?: boolean
          dbe_percentage?: number | null
          no_bid_reason?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {
      // Define your views here if needed
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {
      // Define your functions here if needed
    }
    Enums: {
      job_status: JobStatus
    }
  }
}
