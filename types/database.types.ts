export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type JobStatus = 'Bid' | 'No Bid' | 'Unset';
export type Market = 'MOBILIZATION' | 'LOCAL' | 'CORE';

export interface Database {
  public: {
    Tables: {
      job_numbers: {
        Row: {
          id: number
          branch_code: string
          owner_type: string
          year: number
          sequential_number: number
          job_number: string
          is_assigned: boolean
          created_at: string
        }
        Insert: {
          id?: number
          branch_code: string
          owner_type: string
          year: number
          sequential_number: number
          job_number?: string
          is_assigned?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          branch_code?: string
          owner_type?: string
          year?: number
          sequential_number?: number
          job_number?: string
          is_assigned?: boolean
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: number
          job_number: string
          branch_code: string
          owner_type: string
          year: number
          sequential_number: number
          job_details: Json
          created_at: string
        }
        Insert: {
          id?: number
          job_number: string
          branch_code: string
          owner_type: string
          year: number
          sequential_number: number
          job_details?: Json
          created_at?: string
        }
        Update: {
          id?: number
          job_number?: string
          branch_code?: string
          owner_type?: string
          year?: number
          sequential_number?: number
          job_details?: Json
          created_at?: string
        }
      }
      contractors: {
        Row: {
          id: number
          name: string
          address_name: string | null
          address_contact: string | null
          address_type: number | null
          default_address: boolean | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          residential: boolean | null
          main_phone: string | null
          fax: string | null
          web: string | null
          credit_limit: number | null
          status: string | null
          active: boolean | null
          number: number | null
          payment_terms: string | null
          tax_exempt: boolean | null
          shipping_terms: string | null
          quick_books_class_name: string | null
          to_be_emailed: boolean | null
          to_be_printed: boolean | null
          created: string | null
          updated: string | null
          customer_number: string | null
          email: string | null
          display_name: string | null
        }
        Insert: {
          id?: number
          name: string
          address_name?: string | null
          address_contact?: string | null
          address_type?: number | null
          default_address?: boolean | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          residential?: boolean | null
          main_phone?: string | null
          fax?: string | null
          web?: string | null
          credit_limit?: number | null
          status?: string | null
          active?: boolean | null
          number?: number | null
          payment_terms?: string | null
          tax_exempt?: boolean | null
          shipping_terms?: string | null
          quick_books_class_name?: string | null
          to_be_emailed?: boolean | null
          to_be_printed?: boolean | null
          created?: string | null
          updated?: string | null
          customer_number?: string | null
          email?: string | null
          display_name?: string | null
        }
        Update: {
          id?: number
          name?: string
          address_name?: string | null
          address_contact?: string | null
          address_type?: number | null
          default_address?: boolean | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          residential?: boolean | null
          main_phone?: string | null
          fax?: string | null
          web?: string | null
          credit_limit?: number | null
          status?: string | null
          active?: boolean | null
          number?: number | null
          payment_terms?: string | null
          tax_exempt?: boolean | null
          shipping_terms?: string | null
          quick_books_class_name?: string | null
          to_be_emailed?: boolean | null
          to_be_printed?: boolean | null
          created?: string | null
          updated?: string | null
          customer_number?: string | null
          email?: string | null
          display_name?: string | null
        }
      }
      customer_contacts: {
        Row: {
          id: number
          contractor_id: number
          email: string | null
          phone: string | null
          created: string
          updated: string | null
          name: string | null
          role: string | null
        }
        Insert: {
          id?: number
          contractor_id: number
          email?: string | null
          phone?: string | null
          created?: string
          updated?: string | null
          name?: string | null
          role?: string | null
        }
        Update: {
          id?: number
          contractor_id?: number
          email?: string | null
          phone?: string | null
          created?: string
          updated?: string | null
          name?: string | null
          role?: string | null
        }
      }
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
      },
      bid_estimates: {
        Row: {
          // Trip and Labor fields
          number_of_personnel: number | null
          number_of_trucks: number | null
          trips: number | null
          additional_trips: number | null
          total_trips: number | null
          additional_rated_hours: number | null
          total_rated_hours: number | null
          additional_nonrated_hours: number | null
          total_nonrated_hours: number | null
          // Mobilization fields
          mobilization: number | null
          fuel_cost: number | null
          truck_and_fuel_cost: number | null
          // MPT Equipment fields
          type_iii_4ft: number
          wings_6ft: number
          h_stands: number
          posts: number
          sand_bags: number
          covers: number
          spring_loaded_metal_stands: number
          hi_vertical_panels: number
          type_xi_vertical_panels: number
          b_lites: number
          ac_lites: number
          hi_signs_sq_ft: number
          dg_signs_sq_ft: number
          special_signs_sq_ft: number
          tma: number
          arrow_board: number
          message_board: number
          speed_trailer: number
          pts: number
          mpt_value: number
          mpt_gross_profit: number
          mpt_gm_percent: number
          perm_sign_value: number
          perm_sign_gross_profit: number
          perm_sign_gm_percent: number
          rental_value: number
          rental_gross_profit: number
          rental_gm_percent: number
          created_at: string
          updated_at: string
          summary: string | null
          id: number
          status: string
          letting_date: string | null
          contract_number: string
          contractor: string | null
          subcontractor: string | null
          owner: string
          county: string
          branch: string
          division: string
          estimator: string
          start_date: string
          end_date: string
          project_days: number
          base_rate: number
          fringe_rate: number
          rt_miles: number
          rt_travel: number
          emergency_job: boolean
          rated_hours: number
          nonrated_hours: number
          total_hours: number
          phases: number
        }
        Insert: {
          id?: number
          status: string
          letting_date?: string | null
          contract_number: string
          contractor?: string | null
          subcontractor?: string | null
          owner: string
          county: string
          branch: string
          division: string
          estimator: string
          start_date: string
          end_date: string
          project_days: number
          base_rate: number
          fringe_rate: number
          rt_miles: number
          rt_travel: number
          emergency_job?: boolean
          rated_hours: number
          nonrated_hours: number
          total_hours: number
          phases: number
          // Trip and Labor fields
          number_of_personnel?: number | null
          number_of_trucks?: number | null
          trips?: number | null
          additional_trips?: number | null
          total_trips?: number | null
          additional_rated_hours?: number | null
          total_rated_hours?: number | null
          additional_nonrated_hours?: number | null
          total_nonrated_hours?: number | null
          // Mobilization fields
          mobilization?: number | null
          fuel_cost?: number | null
          truck_and_fuel_cost?: number | null
          // MPT Equipment fields
          type_iii_4ft: number
          wings_6ft: number
          h_stands: number
          posts: number
          sand_bags: number
          covers: number
          spring_loaded_metal_stands: number
          hi_vertical_panels: number
          type_xi_vertical_panels: number
          b_lites: number
          ac_lites: number
          hi_signs_sq_ft: number
          dg_signs_sq_ft: number
          special_signs_sq_ft: number
          tma: number
          arrow_board: number
          message_board: number
          speed_trailer: number
          pts: number
          mpt_value: number
          mpt_gross_profit: number
          mpt_gm_percent: number
          perm_sign_value: number
          perm_sign_gross_profit: number
          perm_sign_gm_percent: number
          rental_value: number
          rental_gross_profit: number
          rental_gm_percent: number
          created_at?: string
          updated_at?: string
          summary?: string | null
        }
        Update: {
          id?: number
          status?: string
          letting_date?: string | null
          contract_number?: string
          contractor?: string | null
          subcontractor?: string | null
          owner?: string
          county?: string
          branch?: string
          division?: string
          estimator?: string
          start_date?: string
          end_date?: string
          project_days?: number
          base_rate?: number
          fringe_rate?: number
          rt_miles?: number
          rt_travel?: number
          emergency_job?: boolean
          rated_hours?: number
          nonrated_hours?: number
          total_hours?: number
          phases?: number
          // Trip and Labor fields
          number_of_personnel?: number | null
          number_of_trucks?: number | null
          trips?: number | null
          additional_trips?: number | null
          total_trips?: number | null
          additional_rated_hours?: number | null
          total_rated_hours?: number | null
          additional_nonrated_hours?: number | null
          total_nonrated_hours?: number | null
          // Mobilization fields
          mobilization?: number | null
          fuel_cost?: number | null
          truck_and_fuel_cost?: number | null
          // MPT Equipment fields
          type_iii_4ft?: number
          wings_6ft?: number
          h_stands?: number
          posts?: number
          sand_bags?: number
          covers?: number
          spring_loaded_metal_stands?: number
          hi_vertical_panels?: number
          type_xi_vertical_panels?: number
          b_lites?: number
          ac_lites?: number
          hi_signs_sq_ft?: number
          dg_signs_sq_ft?: number
          special_signs_sq_ft?: number
          tma?: number
          arrow_board?: number
          message_board?: number
          speed_trailer?: number
          pts?: number
          mpt_value?: number
          mpt_gross_profit?: number
          mpt_gm_percent?: number
          perm_sign_value?: number
          perm_sign_gross_profit?: number
          perm_sign_gm_percent?: number
          rental_value?: number
          rental_gross_profit?: number
          rental_gm_percent?: number
          created_at?: string
          updated_at?: string
          summary?: string | null
        }
      },
      bid_estimate_signs: {
        Row: {
          id: string
          bid_estimate_id: number
          designation: string
          dimensions: string
          sheeting: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bid_estimate_id: number
          designation: string
          dimensions: string
          sheeting: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bid_estimate_id?: number
          designation?: string
          dimensions?: string
          sheeting?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      },
      bid_estimate_items: {
        Row: {
          id: string
          bid_estimate_id: number
          category: string
          subcategory: string
          item_key: string
          value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bid_estimate_id: number
          category: string
          subcategory: string
          item_key: string
          value: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bid_estimate_id?: number
          category?: string
          subcategory?: string
          item_key?: string
          value?: number
          created_at?: string
          updated_at?: string
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
      job_status: JobStatus,
      market: Market
    }
  }
}
