export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_data_entries: {
        Row: {
          bid_date: string | null
          bid_estimate_id: number | null
          contract_number: string
          county: Json | null
          dbe: string | null
          division: Database["public"]["Enums"]["division_type"] | null
          emergency_fields: Json | null
          emergency_job: boolean | null
          end_date: string | null
          estimator: string | null
          fuel_cost_per_gallon: number | null
          id: number
          job_id: number | null
          location: string | null
          ow_mileage: number | null
          ow_travel_time_mins: number | null
          owner: Database["public"]["Enums"]["owner_type"] | null
          rated: Database["public"]["Enums"]["rated_type"] | null
          sr_route: string | null
          start_date: string | null
          winter_end: string | null
          winter_start: string | null
        }
        Insert: {
          bid_date?: string | null
          bid_estimate_id?: number | null
          contract_number: string
          county?: Json | null
          dbe?: string | null
          division?: Database["public"]["Enums"]["division_type"] | null
          emergency_fields?: Json | null
          emergency_job?: boolean | null
          end_date?: string | null
          estimator?: string | null
          fuel_cost_per_gallon?: number | null
          id?: number
          job_id?: number | null
          location?: string | null
          ow_mileage?: number | null
          ow_travel_time_mins?: number | null
          owner?: Database["public"]["Enums"]["owner_type"] | null
          rated?: Database["public"]["Enums"]["rated_type"] | null
          sr_route?: string | null
          start_date?: string | null
          winter_end?: string | null
          winter_start?: string | null
        }
        Update: {
          bid_date?: string | null
          bid_estimate_id?: number | null
          contract_number?: string
          county?: Json | null
          dbe?: string | null
          division?: Database["public"]["Enums"]["division_type"] | null
          emergency_fields?: Json | null
          emergency_job?: boolean | null
          end_date?: string | null
          estimator?: string | null
          fuel_cost_per_gallon?: number | null
          id?: number
          job_id?: number | null
          location?: string | null
          ow_mileage?: number | null
          ow_travel_time_mins?: number | null
          owner?: Database["public"]["Enums"]["owner_type"] | null
          rated?: Database["public"]["Enums"]["rated_type"] | null
          sr_route?: string | null
          start_date?: string | null
          winter_end?: string | null
          winter_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_data_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "bid_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_data_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_data_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "admin_data_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_data_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_data_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_list"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_available_jobs: {
        Row: {
          archived_at: string | null
          branch: string
          contract_number: string
          county: string
          created_at: string
          dbe_percentage: number | null
          deleted_at: string | null
          due_date: string
          entry_date: string
          equipment_rental: boolean
          flagging: boolean
          id: number
          letting_date: string
          location: string
          mpt: boolean
          no_bid_reason: string | null
          original_id: number
          other: boolean
          owner: string
          perm_signs: boolean
          platform: string
          requestor: string
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          branch: string
          contract_number: string
          county: string
          created_at: string
          dbe_percentage?: number | null
          deleted_at?: string | null
          due_date: string
          entry_date: string
          equipment_rental?: boolean
          flagging?: boolean
          id?: number
          letting_date: string
          location: string
          mpt?: boolean
          no_bid_reason?: string | null
          original_id: number
          other?: boolean
          owner: string
          perm_signs?: boolean
          platform: string
          requestor: string
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Update: {
          archived_at?: string | null
          branch?: string
          contract_number?: string
          county?: string
          created_at?: string
          dbe_percentage?: number | null
          deleted_at?: string | null
          due_date?: string
          entry_date?: string
          equipment_rental?: boolean
          flagging?: boolean
          id?: number
          letting_date?: string
          location?: string
          mpt?: boolean
          no_bid_reason?: string | null
          original_id?: number
          other?: boolean
          owner?: string
          perm_signs?: boolean
          platform?: string
          requestor?: string
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: []
      }
      available_jobs: {
        Row: {
          branch: string
          contract_number: string
          county: string
          created_at: string | null
          dbe_percentage: number | null
          due_date: string
          entry_date: string
          equipment_rental: boolean
          flagging: boolean
          id: number
          letting_date: string
          location: string
          mpt: boolean
          no_bid_reason: string | null
          other: boolean
          owner: string
          perm_signs: boolean
          platform: string
          requestor: string
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string | null
        }
        Insert: {
          branch: string
          contract_number: string
          county: string
          created_at?: string | null
          dbe_percentage?: number | null
          due_date: string
          entry_date: string
          equipment_rental?: boolean
          flagging?: boolean
          id?: number
          letting_date: string
          location: string
          mpt?: boolean
          no_bid_reason?: string | null
          other?: boolean
          owner: string
          perm_signs?: boolean
          platform: string
          requestor: string
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string | null
        }
        Update: {
          branch?: string
          contract_number?: string
          county?: string
          created_at?: string | null
          dbe_percentage?: number | null
          due_date?: string
          entry_date?: string
          equipment_rental?: boolean
          flagging?: boolean
          id?: number
          letting_date?: string
          location?: string
          mpt?: boolean
          no_bid_reason?: string | null
          other?: boolean
          owner?: string
          perm_signs?: boolean
          platform?: string
          requestor?: string
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      bid_estimates: {
        Row: {
          archived: boolean | null
          created_at: string | null
          id: number
          status: Database["public"]["Enums"]["bid_estimate_status"]
          total_cost: number | null
          total_gross_profit: number | null
          total_revenue: number | null
        }
        Insert: {
          archived?: boolean | null
          created_at?: string | null
          id?: number
          status?: Database["public"]["Enums"]["bid_estimate_status"]
          total_cost?: number | null
          total_gross_profit?: number | null
          total_revenue?: number | null
        }
        Update: {
          archived?: boolean | null
          created_at?: string | null
          id?: number
          status?: Database["public"]["Enums"]["bid_estimate_status"]
          total_cost?: number | null
          total_gross_profit?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      bid_item_numbers: {
        Row: {
          description: string | null
          grouping: string | null
          id: number
          is_custom: boolean | null
          item_number: string | null
          uom: string | null
        }
        Insert: {
          description?: string | null
          grouping?: string | null
          id?: number
          is_custom?: boolean | null
          item_number?: string | null
          uom?: string | null
        }
        Update: {
          description?: string | null
          grouping?: string | null
          id?: number
          is_custom?: boolean | null
          item_number?: string | null
          uom?: string | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          id: number
          name: string | null
          shop_rate: number | null
        }
        Insert: {
          address?: string | null
          id?: number
          name?: string | null
          shop_rate?: number | null
        }
        Update: {
          address?: string | null
          id?: number
          name?: string | null
          shop_rate?: number | null
        }
        Relationships: []
      }
      contractors: {
        Row: {
          active: boolean | null
          address: string | null
          address_contact: string | null
          address_name: string | null
          address_type: number | null
          city: string | null
          created: string | null
          credit_limit: number | null
          customer_number: string | null
          default_address: boolean | null
          display_name: string | null
          email: string | null
          fax: string | null
          id: number
          main_phone: string | null
          name: string | null
          number: number | null
          payment_terms: string | null
          quick_books_class_name: string | null
          residential: boolean | null
          shipping_terms: string | null
          state: string | null
          status: string | null
          tax_exempt: boolean | null
          to_be_emailed: boolean | null
          to_be_printed: boolean | null
          updated: string | null
          web: string | null
          zip: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          address_contact?: string | null
          address_name?: string | null
          address_type?: number | null
          city?: string | null
          created?: string | null
          credit_limit?: number | null
          customer_number?: string | null
          default_address?: boolean | null
          display_name?: string | null
          email?: string | null
          fax?: string | null
          id: number
          main_phone?: string | null
          name?: string | null
          number?: number | null
          payment_terms?: string | null
          quick_books_class_name?: string | null
          residential?: boolean | null
          shipping_terms?: string | null
          state?: string | null
          status?: string | null
          tax_exempt?: boolean | null
          to_be_emailed?: boolean | null
          to_be_printed?: boolean | null
          updated?: string | null
          web?: string | null
          zip?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          address_contact?: string | null
          address_name?: string | null
          address_type?: number | null
          city?: string | null
          created?: string | null
          credit_limit?: number | null
          customer_number?: string | null
          default_address?: boolean | null
          display_name?: string | null
          email?: string | null
          fax?: string | null
          id?: number
          main_phone?: string | null
          name?: string | null
          number?: number | null
          payment_terms?: string | null
          quick_books_class_name?: string | null
          residential?: boolean | null
          shipping_terms?: string | null
          state?: string | null
          status?: string | null
          tax_exempt?: boolean | null
          to_be_emailed?: boolean | null
          to_be_printed?: boolean | null
          updated?: string | null
          web?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      counties: {
        Row: {
          branch: number | null
          district: number | null
          flagging_base_rate: number | null
          flagging_fringe_rate: number | null
          flagging_non_rated_target_gm: number | null
          flagging_rate: number | null
          flagging_rated_target_gm: number | null
          fringe_rate: number | null
          fuel: number | null
          id: number
          insurance: number | null
          labor_rate: number | null
          market: Database["public"]["Enums"]["market"] | null
          name: string | null
        }
        Insert: {
          branch?: number | null
          district?: number | null
          flagging_base_rate?: number | null
          flagging_fringe_rate?: number | null
          flagging_non_rated_target_gm?: number | null
          flagging_rate?: number | null
          flagging_rated_target_gm?: number | null
          fringe_rate?: number | null
          fuel?: number | null
          id?: number
          insurance?: number | null
          labor_rate?: number | null
          market?: Database["public"]["Enums"]["market"] | null
          name?: string | null
        }
        Update: {
          branch?: number | null
          district?: number | null
          flagging_base_rate?: number | null
          flagging_fringe_rate?: number | null
          flagging_non_rated_target_gm?: number | null
          flagging_rate?: number | null
          flagging_rated_target_gm?: number | null
          fringe_rate?: number | null
          fuel?: number | null
          id?: number
          insurance?: number | null
          labor_rate?: number | null
          market?: Database["public"]["Enums"]["market"] | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_branch"
            columns: ["branch"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_contacts: {
        Row: {
          contractor_id: number
          created: string
          email: string | null
          id: number
          name: string | null
          phone: string | null
          role: string | null
          updated: string | null
          is_deleted: boolean
        }
        Insert: {
          contractor_id: number
          created?: string
          email?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          role?: string | null
          is_deleted?: boolean
          updated?: string | null
        }
        Update: {
          contractor_id?: number
          created?: string
          email?: string | null
          id?: number
          name?: string | null
          phone?: string | null
          role?: string | null
          updated?: string | null
          is_deleted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "customer_contacts_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_rental_entries: {
        Row: {
          bid_estimate_id: number | null
          cost: number | null
          gross_profit: number | null
          gross_profit_margin: number | null
          id: number
          job_id: number | null
          months: number | null
          name: string
          quantity: number | null
          re_rent_for_current_job: boolean | null
          re_rent_price: number | null
          rent_price: number | null
          revenue: number | null
          total_cost: number | null
          useful_life_yrs: number | null
        }
        Insert: {
          bid_estimate_id?: number | null
          cost?: number | null
          gross_profit?: number | null
          gross_profit_margin?: number | null
          id?: number
          job_id?: number | null
          months?: number | null
          name: string
          quantity?: number | null
          re_rent_for_current_job?: boolean | null
          re_rent_price?: number | null
          rent_price?: number | null
          revenue?: number | null
          total_cost?: number | null
          useful_life_yrs?: number | null
        }
        Update: {
          bid_estimate_id?: number | null
          cost?: number | null
          gross_profit?: number | null
          gross_profit_margin?: number | null
          id?: number
          job_id?: number | null
          months?: number | null
          name?: string
          quantity?: number | null
          re_rent_for_current_job?: boolean | null
          re_rent_price?: number | null
          rent_price?: number | null
          revenue?: number | null
          total_cost?: number | null
          useful_life_yrs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_rental_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "bid_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_rental_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_rental_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "equipment_rental_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_rental_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_rental_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_list"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          contract_number: string | null
          file_data: string | null
          file_size: number | null
          file_type: string | null
          filename: string
          id: number
          job_id: number | null
          job_number: string | null
          upload_date: string | null
        }
        Insert: {
          contract_number?: string | null
          file_data?: string | null
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: number
          job_id?: number | null
          job_number?: string | null
          upload_date?: string | null
        }
        Update: {
          contract_number?: string | null
          file_data?: string | null
          file_size?: number | null
          file_type?: string | null
          filename?: string
          id?: number
          job_id?: number | null
          job_number?: string | null
          upload_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_list"
            referencedColumns: ["id"]
          },
        ]
      }
      flagging: {
        Row: {
          fuel_economy_mpg: number
          general_liability: number
          id: number
          truck_dispatch_fee: number
          worker_comp: number
        }
        Insert: {
          fuel_economy_mpg: number
          general_liability: number
          id?: number
          truck_dispatch_fee: number
          worker_comp: number
        }
        Update: {
          fuel_economy_mpg?: number
          general_liability?: number
          id?: number
          truck_dispatch_fee?: number
          worker_comp?: number
        }
        Relationships: []
      }
      flagging_entries: {
        Row: {
          additional_equipment_cost: number | null
          arrow_boards_cost: number | null
          arrow_boards_include_in_lump_sum: boolean | null
          arrow_boards_quantity: number | null
          bid_estimate_id: number | null
          cost: number | null
          fuel_cost_per_gallon: number | null
          fuel_economy_mpg: number | null
          general_liability: number | null
          gross_profit: number | null
          hours: number | null
          id: number
          job_id: number | null
          markup_rate: number | null
          message_boards_cost: number | null
          message_boards_include_in_lump_sum: boolean | null
          message_boards_quantity: number | null
          number_trucks: number | null
          on_site_job_hours: number | null
          personnel: number | null
          revenue: number | null
          standard_lump_sum: number | null
          standard_pricing: boolean | null
          tma_cost: number | null
          tma_include_in_lump_sum: boolean | null
          tma_quantity: number | null
          truck_dispatch_fee: number | null
          worker_comp: number | null
        }
        Insert: {
          additional_equipment_cost?: number | null
          arrow_boards_cost?: number | null
          arrow_boards_include_in_lump_sum?: boolean | null
          arrow_boards_quantity?: number | null
          bid_estimate_id?: number | null
          cost?: number | null
          fuel_cost_per_gallon?: number | null
          fuel_economy_mpg?: number | null
          general_liability?: number | null
          gross_profit?: number | null
          hours?: number | null
          id?: number
          job_id?: number | null
          markup_rate?: number | null
          message_boards_cost?: number | null
          message_boards_include_in_lump_sum?: boolean | null
          message_boards_quantity?: number | null
          number_trucks?: number | null
          on_site_job_hours?: number | null
          personnel?: number | null
          revenue?: number | null
          standard_lump_sum?: number | null
          standard_pricing?: boolean | null
          tma_cost?: number | null
          tma_include_in_lump_sum?: boolean | null
          tma_quantity?: number | null
          truck_dispatch_fee?: number | null
          worker_comp?: number | null
        }
        Update: {
          additional_equipment_cost?: number | null
          arrow_boards_cost?: number | null
          arrow_boards_include_in_lump_sum?: boolean | null
          arrow_boards_quantity?: number | null
          bid_estimate_id?: number | null
          cost?: number | null
          fuel_cost_per_gallon?: number | null
          fuel_economy_mpg?: number | null
          general_liability?: number | null
          gross_profit?: number | null
          hours?: number | null
          id?: number
          job_id?: number | null
          markup_rate?: number | null
          message_boards_cost?: number | null
          message_boards_include_in_lump_sum?: boolean | null
          message_boards_quantity?: number | null
          number_trucks?: number | null
          on_site_job_hours?: number | null
          personnel?: number | null
          revenue?: number | null
          standard_lump_sum?: number | null
          standard_pricing?: boolean | null
          tma_cost?: number | null
          tma_include_in_lump_sum?: boolean | null
          tma_quantity?: number | null
          truck_dispatch_fee?: number | null
          worker_comp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flagging_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "bid_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flagging_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flagging_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "flagging_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flagging_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flagging_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_list"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          depreciation_rate_useful_life: number | null
          id: number
          last_updated: string | null
          name: string | null
          payback_period: number | null
          price: number | null
        }
        Insert: {
          depreciation_rate_useful_life?: number | null
          id?: number
          last_updated?: string | null
          name?: string | null
          payback_period?: number | null
          price?: number | null
        }
        Update: {
          depreciation_rate_useful_life?: number | null
          id?: number
          last_updated?: string | null
          name?: string | null
          payback_period?: number | null
          price?: number | null
        }
        Relationships: []
      }
      job_numbers: {
        Row: {
          branch_code: string
          created_at: string | null
          id: number
          is_assigned: boolean | null
          job_number: string | null
          owner_type: string
          sequential_number: number
          year: number
        }
        Insert: {
          branch_code: string
          created_at?: string | null
          id?: number
          is_assigned?: boolean | null
          job_number?: string | null
          owner_type: string
          sequential_number: number
          year: number
        }
        Update: {
          branch_code?: string
          created_at?: string | null
          id?: number
          is_assigned?: boolean | null
          job_number?: string | null
          owner_type?: string
          sequential_number?: number
          year?: number
        }
        Relationships: []
      }
      jobs: {
        Row: {
          archived: boolean | null
          bid_number: string | null
          billing_status: Database["public"]["Enums"]["project_status"] | null
          certified_payroll:
            | Database["public"]["Enums"]["certified_payroll_status"]
            | null
          created_at: string | null
          estimate_id: number | null
          id: number
          job_number_id: number | null
          notes: string | null
          overdays: number | null
          project_status: Database["public"]["Enums"]["project_status"] | null
          status: string | null
        }
        Insert: {
          archived?: boolean | null
          bid_number?: string | null
          billing_status?: Database["public"]["Enums"]["project_status"] | null
          certified_payroll?:
            | Database["public"]["Enums"]["certified_payroll_status"]
            | null
          created_at?: string | null
          estimate_id?: number | null
          id?: number
          job_number_id?: number | null
          notes?: string | null
          overdays?: number | null
          project_status?: Database["public"]["Enums"]["project_status"] | null
          status?: string | null
        }
        Update: {
          archived?: boolean | null
          bid_number?: string | null
          billing_status?: Database["public"]["Enums"]["project_status"] | null
          certified_payroll?:
            | Database["public"]["Enums"]["certified_payroll_status"]
            | null
          created_at?: string | null
          estimate_id?: number | null
          id?: number
          job_number_id?: number | null
          notes?: string | null
          overdays?: number | null
          project_status?: Database["public"]["Enums"]["project_status"] | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "bid_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "jobs_job_number_id_fkey"
            columns: ["job_number_id"]
            isOneToOne: false
            referencedRelation: "job_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      mpt_phases: {
        Row: {
          ac_lights_quantity: number | null
          additional_non_rated_hours: number | null
          additional_rated_hours: number | null
          b_lights_quantity: number | null
          covers_quantity: number | null
          custom_light_and_drum_items: Json | null
          days: number | null
          end_date: string | null
          four_foot_type_iii_quantity: number | null
          h_stand_quantity: number | null
          hivp_quantity: number | null
          id: number
          maintenance_trips: number | null
          metal_stands_quantity: number | null
          mpt_rental_entry_id: number
          name: string | null
          number_trucks: number | null
          personnel: number | null
          phase_index: number
          post_quantity: number | null
          sandbag_quantity: number | null
          sharps_quantity: number | null
          six_foot_wings_quantity: number | null
          start_date: string | null
          type_xivp_quantity: number | null
        }
        Insert: {
          ac_lights_quantity?: number | null
          additional_non_rated_hours?: number | null
          additional_rated_hours?: number | null
          b_lights_quantity?: number | null
          covers_quantity?: number | null
          custom_light_and_drum_items?: Json | null
          days?: number | null
          end_date?: string | null
          four_foot_type_iii_quantity?: number | null
          h_stand_quantity?: number | null
          hivp_quantity?: number | null
          id?: number
          maintenance_trips?: number | null
          metal_stands_quantity?: number | null
          mpt_rental_entry_id: number
          name?: string | null
          number_trucks?: number | null
          personnel?: number | null
          phase_index: number
          post_quantity?: number | null
          sandbag_quantity?: number | null
          sharps_quantity?: number | null
          six_foot_wings_quantity?: number | null
          start_date?: string | null
          type_xivp_quantity?: number | null
        }
        Update: {
          ac_lights_quantity?: number | null
          additional_non_rated_hours?: number | null
          additional_rated_hours?: number | null
          b_lights_quantity?: number | null
          covers_quantity?: number | null
          custom_light_and_drum_items?: Json | null
          days?: number | null
          end_date?: string | null
          four_foot_type_iii_quantity?: number | null
          h_stand_quantity?: number | null
          hivp_quantity?: number | null
          id?: number
          maintenance_trips?: number | null
          metal_stands_quantity?: number | null
          mpt_rental_entry_id?: number
          name?: string | null
          number_trucks?: number | null
          personnel?: number | null
          phase_index?: number
          post_quantity?: number | null
          sandbag_quantity?: number | null
          sharps_quantity?: number | null
          six_foot_wings_quantity?: number | null
          start_date?: string | null
          type_xivp_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mpt_phases_mpt_rental_entry_id_fkey"
            columns: ["mpt_rental_entry_id"]
            isOneToOne: false
            referencedRelation: "mpt_rental_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      mpt_primary_signs: {
        Row: {
          associated_structure: string | null
          b_lights: number | null
          contract_number: string | null
          covers: number | null
          description: string | null
          designation: string | null
          height: number | null
          id: number
          is_custom: boolean | null
          phase_id: number
          phase_index: number
          quantity: number | null
          sheeting: Database["public"]["Enums"]["sheeting_type"] | null
          sign_id: string
          width: number | null
        }
        Insert: {
          associated_structure?: string | null
          b_lights?: number | null
          contract_number?: string | null
          covers?: number | null
          description?: string | null
          designation?: string | null
          height?: number | null
          id?: number
          is_custom?: boolean | null
          phase_id: number
          phase_index: number
          quantity?: number | null
          sheeting?: Database["public"]["Enums"]["sheeting_type"] | null
          sign_id: string
          width?: number | null
        }
        Update: {
          associated_structure?: string | null
          b_lights?: number | null
          contract_number?: string | null
          covers?: number | null
          description?: string | null
          designation?: string | null
          height?: number | null
          id?: number
          is_custom?: boolean | null
          phase_id?: number
          phase_index?: number
          quantity?: number | null
          sheeting?: Database["public"]["Enums"]["sheeting_type"] | null
          sign_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mpt_primary_signs_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "mpt_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      mpt_rental_entries: {
        Row: {
          annual_utilization: number | null
          bid_estimate_id: number | null
          cost: number | null
          dispatch_fee: number | null
          gross_profit: number | null
          hours: number | null
          id: number
          job_id: number | null
          mpg_per_truck: number | null
          payback_period: number | null
          revenue: number | null
          target_moic: number | null
        }
        Insert: {
          annual_utilization?: number | null
          bid_estimate_id?: number | null
          cost?: number | null
          dispatch_fee?: number | null
          gross_profit?: number | null
          hours?: number | null
          id?: number
          job_id?: number | null
          mpg_per_truck?: number | null
          payback_period?: number | null
          revenue?: number | null
          target_moic?: number | null
        }
        Update: {
          annual_utilization?: number | null
          bid_estimate_id?: number | null
          cost?: number | null
          dispatch_fee?: number | null
          gross_profit?: number | null
          hours?: number | null
          id?: number
          job_id?: number | null
          mpg_per_truck?: number | null
          payback_period?: number | null
          revenue?: number | null
          target_moic?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mpt_rental_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "bid_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpt_rental_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpt_rental_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "mpt_rental_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpt_rental_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpt_rental_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_list"
            referencedColumns: ["id"]
          },
        ]
      }
      mpt_secondary_signs: {
        Row: {
          contract_number: string | null
          description: string | null
          designation: string | null
          height: number | null
          id: number
          is_custom: boolean | null
          phase_id: number
          primary_sign_id: string
          sheeting: Database["public"]["Enums"]["sheeting_type"] | null
          sign_id: string
          width: number | null
        }
        Insert: {
          contract_number?: string | null
          description?: string | null
          designation?: string | null
          height?: number | null
          id?: number
          is_custom?: boolean | null
          phase_id: number
          primary_sign_id: string
          sheeting?: Database["public"]["Enums"]["sheeting_type"] | null
          sign_id: string
          width?: number | null
        }
        Update: {
          contract_number?: string | null
          description?: string | null
          designation?: string | null
          height?: number | null
          id?: number
          is_custom?: boolean | null
          phase_id?: number
          primary_sign_id?: string
          sheeting?: Database["public"]["Enums"]["sheeting_type"] | null
          sign_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mpt_secondary_signs_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "mpt_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      mpt_static_equipment_info: {
        Row: {
          discount_rate: number
          equipment_type: string
          id: number
          mpt_rental_entry_id: number | null
          payback_period: number
          price: number
          useful_life: number
        }
        Insert: {
          discount_rate: number
          equipment_type: string
          id?: number
          mpt_rental_entry_id?: number | null
          payback_period: number
          price: number
          useful_life: number
        }
        Update: {
          discount_rate?: number
          equipment_type?: string
          id?: number
          mpt_rental_entry_id?: number | null
          payback_period?: number
          price?: number
          useful_life?: number
        }
        Relationships: [
          {
            foreignKeyName: "mpt_static_equipment_info_mpt_rental_entry_id_fkey"
            columns: ["mpt_rental_entry_id"]
            isOneToOne: false
            referencedRelation: "mpt_rental_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      project_metadata: {
        Row: {
          bid_estimate_id: number | null
          contractor_id: number | null
          customer_contract_number: string | null
          id: number
          job_id: number | null
          pm_email: string | null
          pm_phone: string | null
          project_manager: string | null
          subcontractor_id: number | null
        }
        Insert: {
          bid_estimate_id?: number | null
          contractor_id?: number | null
          customer_contract_number?: string | null
          id?: number
          job_id?: number | null
          pm_email?: string | null
          pm_phone?: string | null
          project_manager?: string | null
          subcontractor_id?: number | null
        }
        Update: {
          bid_estimate_id?: number | null
          contractor_id?: number | null
          customer_contract_number?: string | null
          id?: number
          job_id?: number | null
          pm_email?: string | null
          pm_phone?: string | null
          project_manager?: string | null
          subcontractor_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_metadata_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "bid_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_metadata_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_metadata_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "project_metadata_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_metadata_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_metadata_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_metadata_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_metadata_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          bid_estimate_id: number | null
          customer: string | null
          id: number
          item_number: string | null
          job_id: number | null
          markup_percentage: number | null
          name: string | null
          quantity: number | null
          quote_price: number | null
          status: Database["public"]["Enums"]["sale_item_status"]
          vendor: string | null
        }
        Insert: {
          bid_estimate_id?: number | null
          customer?: string | null
          id?: number
          item_number?: string | null
          job_id?: number | null
          markup_percentage?: number | null
          name?: string | null
          quantity?: number | null
          quote_price?: number | null
          status?: Database["public"]["Enums"]["sale_item_status"]
          vendor?: string | null
        }
        Update: {
          bid_estimate_id?: number | null
          customer?: string | null
          id?: number
          item_number?: string | null
          job_id?: number | null
          markup_percentage?: number | null
          name?: string | null
          quantity?: number | null
          quote_price?: number | null
          status?: Database["public"]["Enums"]["sale_item_status"]
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "bid_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "sale_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_list"
            referencedColumns: ["id"]
          },
        ]
      }
      service_work_entries: {
        Row: {
          additional_equipment_cost: number | null
          arrow_boards_cost: number | null
          arrow_boards_include_in_lump_sum: boolean | null
          arrow_boards_quantity: number | null
          bid_estimate_id: number | null
          cost: number | null
          fuel_cost_per_gallon: number | null
          fuel_economy_mpg: number | null
          general_liability: number | null
          gross_profit: number | null
          hours: number | null
          id: number
          job_id: number | null
          markup_rate: number | null
          message_boards_cost: number | null
          message_boards_include_in_lump_sum: boolean | null
          message_boards_quantity: number | null
          number_trucks: number | null
          on_site_job_hours: number | null
          personnel: number | null
          revenue: number | null
          standard_lump_sum: number | null
          standard_pricing: boolean | null
          tma_cost: number | null
          tma_include_in_lump_sum: boolean | null
          tma_quantity: number | null
          truck_dispatch_fee: number | null
          worker_comp: number | null
        }
        Insert: {
          additional_equipment_cost?: number | null
          arrow_boards_cost?: number | null
          arrow_boards_include_in_lump_sum?: boolean | null
          arrow_boards_quantity?: number | null
          bid_estimate_id?: number | null
          cost?: number | null
          fuel_cost_per_gallon?: number | null
          fuel_economy_mpg?: number | null
          general_liability?: number | null
          gross_profit?: number | null
          hours?: number | null
          id?: number
          job_id?: number | null
          markup_rate?: number | null
          message_boards_cost?: number | null
          message_boards_include_in_lump_sum?: boolean | null
          message_boards_quantity?: number | null
          number_trucks?: number | null
          on_site_job_hours?: number | null
          personnel?: number | null
          revenue?: number | null
          standard_lump_sum?: number | null
          standard_pricing?: boolean | null
          tma_cost?: number | null
          tma_include_in_lump_sum?: boolean | null
          tma_quantity?: number | null
          truck_dispatch_fee?: number | null
          worker_comp?: number | null
        }
        Update: {
          additional_equipment_cost?: number | null
          arrow_boards_cost?: number | null
          arrow_boards_include_in_lump_sum?: boolean | null
          arrow_boards_quantity?: number | null
          bid_estimate_id?: number | null
          cost?: number | null
          fuel_cost_per_gallon?: number | null
          fuel_economy_mpg?: number | null
          general_liability?: number | null
          gross_profit?: number | null
          hours?: number | null
          id?: number
          job_id?: number | null
          markup_rate?: number | null
          message_boards_cost?: number | null
          message_boards_include_in_lump_sum?: boolean | null
          message_boards_quantity?: number | null
          number_trucks?: number | null
          on_site_job_hours?: number | null
          personnel?: number | null
          revenue?: number | null
          standard_lump_sum?: number | null
          standard_pricing?: boolean | null
          tma_cost?: number | null
          tma_include_in_lump_sum?: boolean | null
          tma_quantity?: number | null
          truck_dispatch_fee?: number | null
          worker_comp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_work_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "bid_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_work_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_work_entries_bid_estimate_id_fkey"
            columns: ["bid_estimate_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["estimate_id"]
          },
          {
            foreignKeyName: "service_work_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_work_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_work_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_list"
            referencedColumns: ["id"]
          },
        ]
      }
      sign_designations: {
        Row: {
          description: string
          designation: string | null
          id: number
          sheeting: string
        }
        Insert: {
          description: string
          designation?: string | null
          id?: number
          sheeting: string
        }
        Update: {
          description?: string
          designation?: string | null
          id?: number
          sheeting?: string
        }
        Relationships: []
      }
      sign_dimension_options: {
        Row: {
          dimension_id: number
          is_shared_use_path: boolean | null
          sign_designation_id: number
        }
        Insert: {
          dimension_id: number
          is_shared_use_path?: boolean | null
          sign_designation_id: number
        }
        Update: {
          dimension_id?: number
          is_shared_use_path?: boolean | null
          sign_designation_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sign_dimension_options_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "sign_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sign_dimension_options_sign_designation_id_fkey"
            columns: ["sign_designation_id"]
            isOneToOne: false
            referencedRelation: "sign_designations"
            referencedColumns: ["id"]
          },
        ]
      }
      sign_dimensions: {
        Row: {
          height: number | null
          id: number
          width: number | null
        }
        Insert: {
          height?: number | null
          id?: number
          width?: number | null
        }
        Update: {
          height?: number | null
          id?: number
          width?: number | null
        }
        Relationships: []
      }
      subcontractors: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          email: string | null
          id: number
          name: string | null
          password: string | null
          role: string | null
          username: string | null
        }
        Insert: {
          email?: string | null
          id?: number
          name?: string | null
          password?: string | null
          role?: string | null
          username?: string | null
        }
        Update: {
          email?: string | null
          id?: number
          name?: string | null
          password?: string | null
          role?: string | null
          username?: string | null
        }
        Relationships: []
      }
      won_bid_items: {
        Row: {
          aia_billing: boolean | null
          bid_item_id: number
          contract_value: number
          id: number
          job_id: number
          quantity: number
        }
        Insert: {
          aia_billing?: boolean | null
          bid_item_id: number
          contract_value: number
          id?: number
          job_id: number
          quantity: number
        }
        Update: {
          aia_billing?: boolean | null
          bid_item_id?: number
          contract_value?: number
          id?: number
          job_id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "won_bid_items_bid_item_id_fkey"
            columns: ["bid_item_id"]
            isOneToOne: false
            referencedRelation: "bid_item_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "won_bid_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "won_bid_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "won_bid_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs_list"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      estimate_complete: {
        Row: {
          admin_data: Json | null
          archived: boolean | null
          contractor_name: string | null
          created_at: string | null
          customer_contract_number: string | null
          equipment_rental: Json | null
          flagging: Json | null
          id: number | null
          mpt_rental: Json | null
          pm_email: string | null
          pm_phone: string | null
          project_manager: string | null
          sale_items: Json | null
          service_work: Json | null
          status: Database["public"]["Enums"]["bid_estimate_status"] | null
          subcontractor_name: string | null
          total_cost: number | null
          total_days: number | null
          total_gross_profit: number | null
          total_hours: number | null
          total_phases: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      jobs_complete: {
        Row: {
          admin_data: Json | null
          archived: boolean | null
          bid_number: string | null
          billing_status: Database["public"]["Enums"]["project_status"] | null
          branch_code: string | null
          certified_payroll:
            | Database["public"]["Enums"]["certified_payroll_status"]
            | null
          contractor_name: string | null
          created_at: string | null
          customer_contract_number: string | null
          equipment_rental: Json | null
          estimate_created_at: string | null
          estimate_id: number | null
          estimate_status:
            | Database["public"]["Enums"]["bid_estimate_status"]
            | null
          flagging: Json | null
          id: number | null
          job_number: string | null
          job_summary: Json | null
          job_year: number | null
          mpt_rental: Json | null
          notes: string | null
          overdays: number | null
          owner_type: string | null
          pm_email: string | null
          pm_phone: string | null
          project_manager: string | null
          project_status: Database["public"]["Enums"]["project_status"] | null
          sale_items: Json | null
          sequential_number: number | null
          service_work: Json | null
          subcontractor_name: string | null
          total_cost: number | null
          total_days: number | null
          total_gross_profit: number | null
          total_hours: number | null
          total_phases: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      jobs_list: {
        Row: {
          archived: boolean | null
          bid_number: string | null
          billing_status: Database["public"]["Enums"]["project_status"] | null
          branch: string | null
          branch_code: string | null
          certified_payroll:
            | Database["public"]["Enums"]["certified_payroll_status"]
            | null
          contract_number: string | null
          contractor: string | null
          county: string | null
          created_at: string | null
          end_date: string | null
          estimator: string | null
          gross_margin_percent: number | null
          id: number | null
          job_number: string | null
          letting_date: string | null
          overdays: number | null
          owner: Database["public"]["Enums"]["owner_type"] | null
          owner_type: string | null
          project_days: number | null
          project_manager: string | null
          project_status: Database["public"]["Enums"]["project_status"] | null
          start_date: string | null
          subcontractor: string | null
          total_cost: number | null
          total_gross_profit: number | null
          total_hours: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_phases_with_signs: {
        Args: { p_mpt_rental_id: number }
        Returns: Json
      }
    }
    Enums: {
      bid_estimate_status: "DRAFT" | "PENDING" | "WON" | "LOST"
      certified_payroll_status: "STATE" | "FEDERAL" | "N/A"
      division_type: "PUBLIC" | "PRIVATE"
      job_status: "Bid" | "No Bid" | "Unset"
      market: "MOBILIZATION" | "LOCAL" | "CORE"
      owner_type: "PENNDOT" | "TURNPIKE" | "PRIVATE" | "OTHER" | "SEPTA"
      project_status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE"
      rated_type: "RATED" | "NON-RATED"
      sale_item_status: "won" | "lost" | "pending"
      sheeting_type: "HI" | "DG" | "Special"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bid_estimate_status: ["DRAFT", "PENDING", "WON", "LOST"],
      certified_payroll_status: ["STATE", "FEDERAL", "N/A"],
      division_type: ["PUBLIC", "PRIVATE"],
      job_status: ["Bid", "No Bid", "Unset"],
      market: ["MOBILIZATION", "LOCAL", "CORE"],
      owner_type: ["PENNDOT", "TURNPIKE", "PRIVATE", "OTHER", "SEPTA"],
      project_status: ["NOT_STARTED", "IN_PROGRESS", "COMPLETE"],
      rated_type: ["RATED", "NON-RATED"],
      sale_item_status: ["won", "lost", "pending"],
      sheeting_type: ["HI", "DG", "Special"],
    },
  },
} as const
