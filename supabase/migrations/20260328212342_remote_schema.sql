create extension if not exists "pgjwt" with schema "extensions";

create extension if not exists "vector" with schema "extensions";

drop extension if exists "pg_net";

create type "public"."bid_estimate_status" as enum ('UNSET', 'DRAFT', 'PENDING', 'WON', 'LOST');

create type "public"."certified_payroll_status" as enum ('STATE', 'FEDERAL', 'N/A');

create type "public"."division_type" as enum ('PUBLIC', 'PRIVATE');

create type "public"."job_status" as enum ('Bid', 'No Bid', 'Unset');

create type "public"."market" as enum ('MOBILIZATION', 'LOCAL', 'CORE');

create type "public"."owner_type" as enum ('PENNDOT', 'TURNPIKE', 'PRIVATE', 'OTHER', 'SEPTA');

create type "public"."pickup_condition_enum" as enum ('good', 'serviceable', 'damaged', 'missing');

create type "public"."project_status" as enum ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE');

create type "public"."rated_type" as enum ('RATED', 'NON-RATED');

create type "public"."sale_item_status" as enum ('won', 'lost', 'pending');

create type "public"."sheeting_type" as enum ('HI', 'DG', 'Special', 'DGXI', 'DGVII', 'FYG');

create sequence "public"."admin_data_entries_id_seq";

create sequence "public"."archived_available_jobs_id_seq";

create sequence "public"."associated_items_id_seq";

create sequence "public"."available_jobs_id_seq";

create sequence "public"."bid_estimates_id_seq";

create sequence "public"."bid_item_numbers_id_seq";

create sequence "public"."bid_notes_id_seq";

create sequence "public"."branches_id_seq";

create sequence "public"."counties_id_seq";

create sequence "public"."custom_dimensions_id_seq";

create sequence "public"."customer_contacts_id_seq";

create sequence "public"."equipment_rental_entries_id_seq";

create sequence "public"."files_id_seq";

create sequence "public"."flagging_entries_id_seq";

create sequence "public"."flagging_id_seq";

create sequence "public"."general_static_assumptions_id_seq";

create sequence "public"."items_id_seq";

create sequence "public"."job_numbers_id_seq";

create sequence "public"."jobs_id_seq";

create sequence "public"."mpt_phases_id_seq";

create sequence "public"."mpt_primary_signs_id_seq";

create sequence "public"."mpt_rental_entries_id_seq";

create sequence "public"."mpt_secondary_signs_id_seq";

create sequence "public"."mpt_static_equipment_info_id_seq";

create sequence "public"."owners_id_seq";

create sequence "public"."permanent_sign_items_id_seq";

create sequence "public"."permanent_signs_entries_id_seq";

create sequence "public"."permanent_signs_id_seq";

create sequence "public"."productivity_rates_id_seq";

create sequence "public"."project_metadata_id_seq";

create sequence "public"."pts_kits_id_seq";

create sequence "public"."quote_items_id_seq";

create sequence "public"."quote_recipients_id_seq";

create sequence "public"."quote_sequential_numbers_id_seq";

create sequence "public"."quotes_customers_id_seq";

create sequence "public"."quotes_id_seq";

create sequence "public"."rental_items_id_seq";

create sequence "public"."sale_items_id_seq";

create sequence "public"."service_work_entries_id_seq";

create sequence "public"."sign_designations_id_seq";

create sequence "public"."sign_dimensions_2_id_seq";

create sequence "public"."sign_dimensions_id_seq";

create sequence "public"."sign_orders_id_seq";

create sequence "public"."subcontractors_id_seq";

create sequence "public"."users_id_seq";

create sequence "public"."won_bid_items_id_seq";


  create table "public"."admin_data_entries" (
    "id" integer not null default nextval('public.admin_data_entries_id_seq'::regclass),
    "bid_estimate_id" integer,
    "job_id" integer,
    "contract_number" character varying(50) not null,
    "estimator" character varying(255),
    "division" public.division_type,
    "bid_date" timestamp without time zone,
    "owner" public.owner_type,
    "county" jsonb,
    "sr_route" character varying(100),
    "location" character varying(255),
    "dbe" character varying(50),
    "start_date" timestamp without time zone,
    "end_date" timestamp without time zone,
    "winter_start" timestamp without time zone,
    "winter_end" timestamp without time zone,
    "ow_travel_time_mins" integer,
    "ow_mileage" numeric(10,2),
    "fuel_cost_per_gallon" numeric(10,2),
    "emergency_job" boolean default false,
    "rated" public.rated_type,
    "emergency_fields" jsonb,
    "etc_rep" character varying(100)
      );


alter table "public"."admin_data_entries" enable row level security;


  create table "public"."archived_available_jobs" (
    "id" integer not null default nextval('public.archived_available_jobs_id_seq'::regclass),
    "original_id" integer not null,
    "status" public.job_status not null,
    "branch" character varying(100) not null,
    "contract_number" character varying(50) not null,
    "county" character varying(100) not null,
    "due_date" timestamp with time zone not null,
    "letting_date" timestamp with time zone not null,
    "entry_date" date not null,
    "location" text not null,
    "owner" character varying(100) not null,
    "platform" character varying(50) not null,
    "requestor" character varying(100) not null,
    "mpt" boolean not null default false,
    "flagging" boolean not null default false,
    "perm_signs" boolean not null default false,
    "equipment_rental" boolean not null default false,
    "other" boolean not null default false,
    "dbe_percentage" numeric(5,2),
    "no_bid_reason" text,
    "created_at" timestamp with time zone not null,
    "updated_at" timestamp with time zone not null,
    "archived_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "deleted_at" timestamp with time zone,
    "state_route" text
      );


alter table "public"."archived_available_jobs" enable row level security;


  create table "public"."associated_items" (
    "id" integer not null default nextval('public.associated_items_id_seq'::regclass),
    "quote_item_id" integer,
    "item_number" character varying(100),
    "description" text,
    "uom" character varying(50),
    "quantity" numeric(10,2),
    "unit_price" numeric(10,2),
    "notes" text,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP
      );


alter table "public"."associated_items" enable row level security;


  create table "public"."available_jobs" (
    "id" integer not null default nextval('public.available_jobs_id_seq'::regclass),
    "status" public.job_status not null default 'Bid'::public.job_status,
    "branch" character varying(100) not null,
    "contract_number" character varying(50) not null,
    "county" character varying(100) not null,
    "due_date" timestamp with time zone not null,
    "letting_date" timestamp with time zone not null,
    "entry_date" date not null,
    "location" text not null,
    "owner" character varying(100) not null,
    "platform" character varying(50) not null,
    "requestor" character varying(100) not null,
    "mpt" boolean not null default false,
    "flagging" boolean not null default false,
    "perm_signs" boolean not null default false,
    "equipment_rental" boolean not null default false,
    "other" boolean not null default false,
    "dbe_percentage" numeric(5,2),
    "no_bid_reason" text,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "state_route" text,
    "archived" boolean not null default false
      );


alter table "public"."available_jobs" enable row level security;


  create table "public"."bid_estimates" (
    "id" integer not null default nextval('public.bid_estimates_id_seq'::regclass),
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "total_revenue" numeric(10,2),
    "total_cost" numeric(10,2),
    "total_gross_profit" numeric(10,2),
    "status" public.bid_estimate_status not null default 'DRAFT'::public.bid_estimate_status,
    "archived" boolean default false,
    "contract_number" character varying(255),
    "notes" text,
    "deleted" boolean default false
      );


alter table "public"."bid_estimates" enable row level security;


  create table "public"."bid_estimates_deleted" (
    "id" integer not null default nextval('public.bid_estimates_id_seq'::regclass),
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "total_revenue" numeric(10,2),
    "total_cost" numeric(10,2),
    "total_gross_profit" numeric(10,2),
    "status" public.bid_estimate_status not null default 'DRAFT'::public.bid_estimate_status,
    "archived" boolean default false,
    "contract_number" character varying(255),
    "notes" text,
    "deleted" boolean default false,
    "relations" jsonb
      );



  create table "public"."bid_item_numbers" (
    "id" integer not null default nextval('public.bid_item_numbers_id_seq'::regclass),
    "item_number" character varying(20),
    "description" character varying(255),
    "uom" character varying(20),
    "grouping" text,
    "is_custom" boolean
      );


alter table "public"."bid_item_numbers" enable row level security;


  create table "public"."branches" (
    "id" integer not null default nextval('public.branches_id_seq'::regclass),
    "name" character varying(55),
    "address" character varying(255),
    "shop_rate" numeric(10,2),
    "branch_code" text
      );


alter table "public"."branches" enable row level security;


  create table "public"."change_orders" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" uuid not null,
    "co_number" text not null,
    "description" text,
    "status" text not null default 'approved'::text,
    "amount" numeric(12,2) not null default 0,
    "submitted_date" date,
    "approved_date" date,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."contractors" (
    "id" integer not null,
    "name" text,
    "address_name" text,
    "address_contact" text,
    "address_type" integer,
    "default_address" boolean,
    "address" text,
    "city" text,
    "state" text,
    "zip" text,
    "residential" boolean,
    "main_phone" text,
    "fax" text,
    "web" text,
    "credit_limit" numeric,
    "status" text,
    "active" boolean,
    "number" integer,
    "payment_terms" text,
    "tax_exempt" boolean,
    "shipping_terms" text,
    "quick_books_class_name" text,
    "to_be_emailed" boolean,
    "to_be_printed" boolean,
    "created" timestamp without time zone,
    "updated" timestamp without time zone,
    "customer_number" text,
    "email" text,
    "display_name" text,
    "is_deleted" boolean default false,
    "would_like_to_apply_for_credit" boolean,
    "bill_to_street" text,
    "bill_to_city" text,
    "bill_to_state" text,
    "bill_to_zip" text
      );


alter table "public"."contractors" enable row level security;


  create table "public"."counties" (
    "id" integer not null default nextval('public.counties_id_seq'::regclass),
    "name" character varying(55),
    "district" integer,
    "branch" integer,
    "labor_rate" numeric(10,2),
    "fringe_rate" numeric(10,2),
    "market" public.market default 'LOCAL'::public.market,
    "flagging_rate" numeric(10,2),
    "insurance" numeric(10,2),
    "fuel" numeric(10,2),
    "flagging_non_rated_target_gm" numeric(10,2),
    "flagging_rated_target_gm" numeric(10,2),
    "flagging_base_rate" numeric(10,2),
    "flagging_fringe_rate" numeric(10,2)
      );


alter table "public"."counties" enable row level security;


  create table "public"."custom_dimensions" (
    "id" bigint not null default nextval('public.custom_dimensions_id_seq'::regclass),
    "dimension_label" character varying(255) not null,
    "square_footage" numeric(10,2) not null,
    "created_at" timestamp without time zone default now()
      );



  create table "public"."custom_sov_items" (
    "id" bigint generated always as identity not null,
    "job_id" uuid not null,
    "item_number" text not null,
    "display_item_number" text not null,
    "description" text not null,
    "display_name" text not null,
    "work_type" text not null,
    "uom_1" text,
    "uom_2" text,
    "uom_3" text,
    "uom_4" text,
    "uom_5" text,
    "uom_6" text,
    "uom_7" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."customer_contacts" (
    "id" integer not null default nextval('public.customer_contacts_id_seq'::regclass),
    "contractor_id" integer not null,
    "email" text,
    "phone" text,
    "created" timestamp without time zone not null default now(),
    "updated" timestamp without time zone,
    "name" text,
    "role" text,
    "is_deleted" boolean default false
      );


alter table "public"."customer_contacts" enable row level security;


  create table "public"."documents_l" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" uuid not null,
    "file_name" text not null,
    "file_path" text not null,
    "file_type" text,
    "file_size" bigint,
    "uploaded_at" timestamp with time zone not null default now(),
    "uploaded_by" uuid,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."equipment_rental_entries" (
    "id" integer not null default nextval('public.equipment_rental_entries_id_seq'::regclass),
    "bid_estimate_id" integer,
    "job_id" integer,
    "name" character varying(255) not null,
    "quantity" integer,
    "months" numeric(5,2),
    "rent_price" numeric(10,2),
    "re_rent_price" numeric(10,2),
    "re_rent_for_current_job" boolean,
    "total_cost" numeric(12,2),
    "useful_life_yrs" numeric(5,2),
    "revenue" numeric(12,2),
    "gross_profit" numeric(12,2),
    "gross_profit_margin" numeric(6,2),
    "cost" numeric(12,2),
    "notes" text,
    "item_number" character varying(255)
      );


alter table "public"."equipment_rental_entries" enable row level security;


  create table "public"."expenses" (
    "expense_id" text,
    "amount" numeric(16,2),
    "approve" boolean,
    "approved_amount" numeric(18,0),
    "approver_id" text,
    "assignment" text,
    "billable" boolean,
    "business_purpose" text,
    "city" text,
    "comments" text,
    "created_by_id" text,
    "amount_type" text,
    "currency_code" text,
    "customer_id" text,
    "distance1" text,
    "distance" numeric(16,2),
    "end_date" date,
    "exchange_rate" numeric(14,4),
    "expense" text,
    "expense_pay_code_id" text,
    "expense_report_id" text,
    "new_expense_type" text,
    "financial_status" text,
    "from_address" text,
    "home_amount" numeric(16,2),
    "last_modified_by_id" text,
    "expense_line" text,
    "local_amount" numeric(16,2),
    "manager_id" text,
    "manager_approved" boolean,
    "pay_code" text,
    "payment_type" text,
    "project_id" text,
    "reimbursable" boolean,
    "reject" boolean,
    "rejected_amount" numeric(18,0),
    "requested_amount" numeric(16,2),
    "start_date" date,
    "state" text,
    "task_id" text,
    "to_address" text,
    "transaction_date" date,
    "vat_included" boolean,
    "vat_amount" numeric(10,2),
    "vendor_description" text,
    "worker_id" text,
    "zzdeprecated_reimburse_not_personal" boolean,
    "zzdeprecated_expense_type" text,
    "zzdeprecated_amount_calc" numeric(16,2)
      );



  create table "public"."files" (
    "id" integer not null default nextval('public.files_id_seq'::regclass),
    "filename" character varying(255) not null,
    "file_type" text,
    "upload_date" timestamp without time zone default CURRENT_TIMESTAMP,
    "file_size" bigint,
    "contract_number" text,
    "job_id" integer,
    "quote_id" integer,
    "bid_estimate_id" integer,
    "file_path" text,
    "file_url" text,
    "sign_order_id" integer
      );


alter table "public"."files" enable row level security;


  create table "public"."flagging" (
    "id" integer not null default nextval('public.flagging_id_seq'::regclass),
    "fuel_economy_mpg" numeric(10,2) not null,
    "truck_dispatch_fee" numeric(10,2) not null,
    "worker_comp" numeric(10,2) not null,
    "general_liability" numeric(10,2) not null
      );


alter table "public"."flagging" enable row level security;


  create table "public"."flagging_entries" (
    "id" integer not null default nextval('public.flagging_entries_id_seq'::regclass),
    "bid_estimate_id" integer,
    "job_id" integer,
    "standard_pricing" boolean,
    "standard_lump_sum" numeric(10,2),
    "number_trucks" integer,
    "fuel_economy_mpg" numeric(10,2),
    "personnel" integer,
    "on_site_job_hours" numeric(10,2),
    "additional_equipment_cost" numeric(10,2),
    "fuel_cost_per_gallon" numeric(10,2),
    "truck_dispatch_fee" numeric(10,2),
    "worker_comp" numeric(10,2),
    "general_liability" numeric(10,2),
    "markup_rate" numeric(10,2),
    "arrow_boards_cost" numeric(10,2),
    "arrow_boards_quantity" integer,
    "arrow_boards_include_in_lump_sum" boolean,
    "message_boards_cost" numeric(10,2),
    "message_boards_quantity" integer,
    "message_boards_include_in_lump_sum" boolean,
    "tma_cost" numeric(10,2),
    "tma_quantity" integer,
    "tma_include_in_lump_sum" boolean,
    "revenue" numeric(12,2),
    "cost" numeric(12,2),
    "gross_profit" numeric(12,2),
    "hours" numeric(10,2)
      );


alter table "public"."flagging_entries" enable row level security;


  create table "public"."general_static_assumptions" (
    "id" integer not null default nextval('public.general_static_assumptions_id_seq'::regclass),
    "material_markup" numeric(10,2),
    "truck_dispatch_fee" numeric(10,2),
    "target_moic" integer,
    "mpg_per_truck" numeric(10,2),
    "payback_period" integer,
    "annual_utilization" numeric(10,2)
      );


alter table "public"."general_static_assumptions" enable row level security;


  create table "public"."items" (
    "id" integer not null default nextval('public.items_id_seq'::regclass),
    "name" character varying(55),
    "price" numeric(10,2),
    "depreciation_rate_useful_life" integer,
    "last_updated" character varying(55) default CURRENT_TIMESTAMP,
    "payback_period" integer
      );


alter table "public"."items" enable row level security;


  create table "public"."job_numbers" (
    "id" integer not null default nextval('public.job_numbers_id_seq'::regclass),
    "branch_code" character varying(2),
    "owner_type" character varying(2),
    "year" integer,
    "sequential_number" integer,
    "job_number" character varying(15),
    "is_assigned" boolean default false,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."job_numbers" enable row level security;


  create table "public"."jobs" (
    "id" integer not null default nextval('public.jobs_id_seq'::regclass),
    "created_at" timestamp with time zone default now(),
    "estimate_id" integer,
    "billing_status" public.project_status default 'NOT_STARTED'::public.project_status,
    "project_status" public.project_status default 'NOT_STARTED'::public.project_status,
    "job_number_id" integer,
    "overdays" integer,
    "notes" text,
    "bid_number" character varying(255),
    "certified_payroll" public.certified_payroll_status default 'N/A'::public.certified_payroll_status,
    "archived" boolean default false,
    "w9_added" boolean,
    "eea_sharp_added" boolean,
    "safety_program_added" boolean,
    "sexual_harrassment_added" boolean,
    "avenue_appeals_added" boolean,
    "labor_group" character varying(55),
    "deleted" boolean default false,
    "notes_jsonb" jsonb default '[]'::jsonb,
    "reserved_job_number" character varying(32)
      );


alter table "public"."jobs" enable row level security;


  create table "public"."jobs_deleted" (
    "id" integer not null default nextval('public.jobs_id_seq'::regclass),
    "created_at" timestamp with time zone default now(),
    "estimate_id" integer,
    "billing_status" public.project_status default 'NOT_STARTED'::public.project_status,
    "project_status" public.project_status default 'NOT_STARTED'::public.project_status,
    "job_number_id" integer,
    "overdays" integer,
    "notes" text,
    "bid_number" character varying(255),
    "certified_payroll" public.certified_payroll_status default 'N/A'::public.certified_payroll_status,
    "archived" boolean default false,
    "w9_added" boolean,
    "eea_sharp_added" boolean,
    "safety_program_added" boolean,
    "sexual_harrassment_added" boolean,
    "avenue_appeals_added" boolean,
    "labor_group" character varying(55),
    "deleted" boolean default false,
    "notes_jsonb" jsonb default '[]'::jsonb,
    "reserved_job_number" character varying(32),
    "relations" jsonb
      );



  create table "public"."jobs_l" (
    "id" uuid not null,
    "created_by" uuid,
    "assigned_pm" uuid,
    "assigned_billing" uuid,
    "project_name" text,
    "contract_number" text,
    "customer_name" text,
    "customer_job_number" text,
    "project_owner" text,
    "etc_job_number" text,
    "etc_branch" text,
    "county" text,
    "state_route" text,
    "contract_status" text,
    "project_status" text,
    "billing_status" text,
    "certified_payroll_type" text,
    "shop_rate" numeric(14,4),
    "state_base_rate" numeric(14,4),
    "state_fringe_rate" numeric(14,4),
    "federal_base_rate" numeric(14,4),
    "federal_fringe_rate" numeric(14,4),
    "project_start_date" date,
    "project_end_date" date,
    "additional_notes" text,
    "archived" boolean not null default false,
    "created_at" timestamp with time zone not null,
    "updated_at" timestamp with time zone not null,
    "customer_id" bigint,
    "version" integer not null default 1,
    "state_flagging_base_rate" numeric(14,4),
    "state_flagging_fringe_rate" numeric(14,4),
    "federal_flagging_base_rate" numeric(14,4),
    "federal_flagging_fringe_rate" numeric(14,4),
    "etc_project_manager" text,
    "etc_billing_manager" text,
    "etc_project_manager_email" text,
    "etc_billing_manager_email" text,
    "customer_pm" text,
    "customer_pm_email" text,
    "customer_pm_phone" text,
    "certified_payroll_contact" text,
    "certified_payroll_email" text,
    "certified_payroll_phone" text,
    "customer_billing_contact" text,
    "customer_billing_email" text,
    "customer_billing_phone" text,
    "sov_items" jsonb,
    "approver_pm_user_id" uuid,
    "approved_at" timestamp with time zone,
    "approved_by" uuid,
    "approval_notes" text,
    "rejected_at" timestamp with time zone,
    "rejected_by" uuid,
    "rejection_reason" text,
    "rejection_notes" text,
    "submitted_for_approval_at" timestamp with time zone,
    "submitted_for_approval_by" uuid,
    "extension_date" date,
    "internal_id" text,
    "customer_pm_first_name" text,
    "customer_pm_last_name" text,
    "certified_payroll_contact_first_name" text,
    "certified_payroll_contact_last_name" text,
    "customer_billing_contact_first_name" text,
    "customer_billing_contact_last_name" text
      );



  create table "public"."kg_edges" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "source_id" uuid,
    "target_id" uuid,
    "relationship" text not null,
    "properties" jsonb,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."kg_nodes" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "type" text not null,
    "label" text,
    "properties" jsonb,
    "embedding" extensions.vector(1536),
    "created_at" timestamp with time zone default now()
      );



  create table "public"."kit_variants" (
    "id" bigint generated by default as identity not null,
    "kit_id" bigint not null,
    "variant_label" text not null,
    "description" text,
    "finished" boolean default false,
    "blights" integer default 0,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."mpt_phases" (
    "id" integer not null default nextval('public.mpt_phases_id_seq'::regclass),
    "mpt_rental_entry_id" integer not null,
    "phase_index" integer not null,
    "name" character varying(255),
    "start_date" timestamp without time zone,
    "end_date" timestamp without time zone,
    "personnel" integer,
    "days" integer,
    "number_trucks" integer,
    "additional_rated_hours" numeric(10,2),
    "additional_non_rated_hours" numeric(10,2),
    "maintenance_trips" integer,
    "hivp_quantity" integer default 0,
    "post_quantity" integer default 0,
    "covers_quantity" integer default 0,
    "h_stand_quantity" integer default 0,
    "sharps_quantity" integer default 0,
    "b_lights_quantity" integer default 0,
    "sandbag_quantity" integer default 0,
    "ac_lights_quantity" integer default 0,
    "type_xivp_quantity" integer default 0,
    "metal_stands_quantity" integer default 0,
    "six_foot_wings_quantity" integer default 0,
    "four_foot_type_iii_quantity" integer default 0,
    "custom_light_and_drum_items" jsonb,
    "emergency" boolean not null default false,
    "item_name" text,
    "item_number" text
      );


alter table "public"."mpt_phases" enable row level security;


  create table "public"."mpt_primary_signs" (
    "id" integer not null default nextval('public.mpt_primary_signs_id_seq'::regclass),
    "phase_id" integer not null,
    "sign_id" text not null,
    "width" numeric(10,2),
    "height" numeric(10,2),
    "quantity" integer,
    "sheeting" public.sheeting_type,
    "is_custom" boolean default false,
    "designation" text,
    "description" text,
    "associated_structure" text,
    "b_lights" integer default 0,
    "covers" integer default 0,
    "display_structure" character varying(255),
    "substrate" character varying(100),
    "b_lights_color" character varying(100),
    "stiffener" boolean
      );


alter table "public"."mpt_primary_signs" enable row level security;


  create table "public"."mpt_rental_entries" (
    "id" integer not null default nextval('public.mpt_rental_entries_id_seq'::regclass),
    "bid_estimate_id" integer,
    "job_id" integer,
    "target_moic" integer,
    "payback_period" integer,
    "annual_utilization" numeric(5,2),
    "dispatch_fee" numeric(10,2),
    "mpg_per_truck" numeric(10,2),
    "revenue" numeric(12,2),
    "cost" numeric(12,2),
    "gross_profit" numeric(12,2),
    "hours" numeric(10,2)
      );


alter table "public"."mpt_rental_entries" enable row level security;


  create table "public"."mpt_secondary_signs" (
    "id" integer not null default nextval('public.mpt_secondary_signs_id_seq'::regclass),
    "phase_id" integer,
    "sign_id" text not null,
    "primary_sign_id" text not null,
    "width" numeric(10,2),
    "height" numeric(10,2),
    "sheeting" public.sheeting_type,
    "is_custom" boolean default false,
    "designation" text,
    "description" text,
    "substrate" character varying(100)
      );


alter table "public"."mpt_secondary_signs" enable row level security;


  create table "public"."mpt_static_equipment_info" (
    "id" integer not null default nextval('public.mpt_static_equipment_info_id_seq'::regclass),
    "mpt_rental_entry_id" integer,
    "equipment_type" character varying(255) not null,
    "price" numeric(10,2) not null,
    "discount_rate" numeric(5,2) not null,
    "useful_life" integer not null,
    "payback_period" integer
      );


alter table "public"."mpt_static_equipment_info" enable row level security;


  create table "public"."mutcd_signs" (
    "mutcd_code" text not null,
    "description" text not null,
    "manufacturing_process" text not null default 'FINISHED'::text,
    "sign_shape" text not null default 'RECTANGLE'::text,
    "sign_type" text not null,
    "type" text not null default 'PRODUCT'::text,
    "vendor" text not null default 'GRIMCO'::text,
    "unit_of_measure" text not null default 'EA'::text,
    "variants" jsonb not null default '[]'::jsonb,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
      );


alter table "public"."mutcd_signs" enable row level security;


  create table "public"."notes" (
    "id" integer not null default nextval('public.bid_notes_id_seq'::regclass),
    "bid_id" integer,
    "text" text not null,
    "created_at" timestamp with time zone default now(),
    "user_email" text default '-'::text,
    "quote_id" integer,
    "sign_id" integer
      );


alter table "public"."notes" enable row level security;


  create table "public"."owners" (
    "id" integer not null default nextval('public.owners_id_seq'::regclass),
    "name" character varying(255) not null
      );


alter table "public"."owners" enable row level security;


  create table "public"."pata_kit_contents" (
    "id" uuid not null default gen_random_uuid(),
    "pata_kit_code" character varying(255) not null,
    "sign_designation" character varying(255) not null,
    "quantity" integer default 0,
    "blight_quantity" integer default 0,
    "created_at" timestamp without time zone default now(),
    "kit_variant_id" bigint
      );



  create table "public"."pata_kits" (
    "id" uuid not null default gen_random_uuid(),
    "code" character varying(50) not null,
    "created_at" timestamp without time zone default now(),
    "description" text,
    "finished" boolean default false,
    "blights" integer default 0,
    "has_variants" boolean default false,
    "team_check" boolean default false,
    "page" integer,
    "image_url" text,
    "reviewed" boolean default false
      );



  create table "public"."permanent_sign_items" (
    "id" integer not null default nextval('public.permanent_sign_items_id_seq'::regclass),
    "item_number" character varying(50),
    "description" text,
    "display_name" character varying(255),
    "notes" text,
    "uom" character varying(50),
    "type" text not null default 'post'::text
      );



  create table "public"."permanent_signs" (
    "id" integer not null default nextval('public.permanent_signs_id_seq'::regclass),
    "permanent_signs_entry_id" integer not null,
    "item_type" character varying(30) not null,
    "item_number" character varying(100),
    "personnel" integer default 0,
    "number_trucks" integer default 0,
    "number_trips" integer default 0,
    "install_hours_required" numeric(10,2) default 0,
    "quantity" integer default 0,
    "perm_sign_bolts" integer,
    "productivity_rate" numeric(10,4),
    "type" character(1),
    "sign_sq_footage" numeric(10,2),
    "perm_sign_price_sq_ft" numeric(10,2),
    "standard_pricing" boolean default true,
    "custom_margin" numeric(8,4),
    "separate_mobilization" boolean default false,
    "perm_sign_cost_sq_ft" numeric(10,2),
    "hi_reflective_strips" integer,
    "fyg_reflective_strips" integer,
    "jenny_brackets" integer,
    "stiffener_inches" numeric(10,2),
    "tmz_brackets" integer,
    "anti_theft_bolts" integer,
    "chevron_brackets" integer,
    "street_name_cross_brackets" integer,
    "is_remove" boolean,
    "flexible_delineator_cost" numeric(10,2),
    "additional_items" jsonb default '[]'::jsonb,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now(),
    "custom_item_type_name" character varying
      );


alter table "public"."permanent_signs" enable row level security;


  create table "public"."permanent_signs_entries" (
    "id" integer not null default nextval('public.permanent_signs_entries_id_seq'::regclass),
    "bid_estimate_id" integer not null,
    "permanent_signs_info" jsonb not null default '{}'::jsonb,
    "created_at" timestamp without time zone default now()
      );


alter table "public"."permanent_signs_entries" enable row level security;


  create table "public"."pickup_takeoff_items_l" (
    "id" uuid not null default gen_random_uuid(),
    "pickup_takeoff_id" uuid not null,
    "parent_item_id" uuid not null,
    "sign_condition" public.pickup_condition_enum,
    "structure_condition" public.pickup_condition_enum,
    "light_condition" public.pickup_condition_enum,
    "pickup_images" text[] default '{}'::text[],
    "return_details" jsonb default '{}'::jsonb,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."pickup_takeoffs_l" (
    "id" uuid not null default gen_random_uuid(),
    "parent_takeoff_id" uuid not null,
    "job_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."pickup_work_orders_l" (
    "id" uuid not null default gen_random_uuid(),
    "pickup_takeoff_id" uuid not null,
    "job_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."productivity_rates" (
    "id" integer not null default nextval('public.productivity_rates_id_seq'::regclass),
    "type_b_install" numeric(10,2),
    "type_b_reset" numeric(10,2),
    "type_b_remove" numeric(10,2),
    "type_f_install" numeric(10,2),
    "type_f_reset" numeric(10,2),
    "type_f_remove" numeric(10,2),
    "type_c_install" numeric(10,2),
    "max_daily_hours" numeric(10,2),
    "flex_delineator" numeric(10,2)
      );


alter table "public"."productivity_rates" enable row level security;


  create table "public"."project_managers" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "branch_id" integer,
    "first_name" text,
    "last_name" text
      );



  create table "public"."project_metadata" (
    "id" integer not null default nextval('public.project_metadata_id_seq'::regclass),
    "bid_estimate_id" integer,
    "job_id" integer,
    "project_manager" character varying(255),
    "pm_email" character varying(255),
    "pm_phone" character varying(50),
    "customer_contract_number" character varying(100),
    "contractor_id" integer,
    "subcontractor_id" integer
      );


alter table "public"."project_metadata" enable row level security;


  create table "public"."pts_kit_contents" (
    "id" uuid not null default gen_random_uuid(),
    "pts_kit_code" character varying(255) not null,
    "sign_designation" character varying(255) not null,
    "quantity" integer default 0,
    "created_at" timestamp without time zone default now(),
    "kit_variant_id" bigint
      );



  create table "public"."pts_kits" (
    "id" integer not null default nextval('public.pts_kits_id_seq'::regclass),
    "code" character varying(20) not null,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "description" text,
    "finished" boolean default false,
    "blights" integer default 0,
    "has_variants" boolean default false,
    "team_check" boolean default false,
    "page" integer,
    "image_url" text,
    "reviewed" boolean default false
      );



  create table "public"."quote_items" (
    "id" integer not null default nextval('public.quote_items_id_seq'::regclass),
    "quote_id" integer,
    "item_number" character varying(100),
    "description" text,
    "uom" character varying(50),
    "notes" text,
    "quantity" numeric(10,2),
    "unit_price" numeric(10,2),
    "discount" numeric(10,2),
    "discount_type" character varying(10),
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "confirmed" boolean default false,
    "tax" integer,
    "is_tax_percentage" boolean default false
      );


alter table "public"."quote_items" enable row level security;


  create table "public"."quote_recipients" (
    "id" integer not null default nextval('public.quote_recipients_id_seq'::regclass),
    "quote_id" integer,
    "customer_contacts_id" integer,
    "email" character varying(255),
    "cc" boolean default false,
    "bcc" boolean default false,
    "point_of_contact" boolean default false,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP
      );


alter table "public"."quote_recipients" enable row level security;


  create table "public"."quote_sequential_numbers" (
    "id" integer not null default nextval('public.quote_sequential_numbers_id_seq'::regclass),
    "created_at" timestamp without time zone not null default now(),
    "used" boolean default false
      );


alter table "public"."quote_sequential_numbers" enable row level security;


  create table "public"."quotes" (
    "id" integer not null default nextval('public.quotes_id_seq'::regclass),
    "from_email" character varying(255),
    "subject" character varying(255),
    "body" text,
    "estimate_id" integer,
    "job_id" integer,
    "date_sent" timestamp with time zone,
    "response_token" character varying(255),
    "status" character varying(50),
    "quote_number" character varying(100),
    "custom_terms_conditions" text,
    "payment_terms" character varying(255),
    "county" character varying(100),
    "state_route" character varying(100),
    "ecms_po_number" character varying(100),
    "bedford_sell_sheet" boolean default false,
    "flagging_price_list" boolean default false,
    "flagging_service_area" boolean default false,
    "standard_terms" boolean default false,
    "rental_agreements" boolean default false,
    "equipment_sale" boolean default false,
    "flagging_terms" boolean default false,
    "created_at" timestamp with time zone,
    "updated_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "etc_job_number" text,
    "type_quote" text,
    "customer_job_number" text,
    "purchase_order" text,
    "township" text,
    "sr_route" text,
    "job_address" text,
    "ecsm_contract_number" text,
    "bid_date" date,
    "start_date" date,
    "end_date" date,
    "duration" integer,
    "job_number" text,
    "customer_name" text,
    "customer_email" text,
    "customer_phone" text,
    "customer_address" text,
    "etc_point_of_contact" text,
    "etc_poc_email" text,
    "etc_poc_phone_number" text,
    "etc_branch" text,
    "customer" text,
    "customer_contact" text,
    "selectedfilesids" jsonb default '[]'::jsonb,
    "aditionalfiles" boolean default false,
    "aditionalterms" boolean default false,
    "pdf_url" text,
    "comments" text,
    "digital_signature" text,
    "notes" text,
    "exclusionstext" text,
    "tax_rate" numeric default 0,
    "aditionalexclusions" boolean default false,
    "termstext" text,
    "exclusionsText" text,
    "aditionalExclusions" boolean,
    "aditionalFiles" boolean,
    "aditionalTerms" boolean default false,
    "termsText" text,
    "user_created" text,
    "user_sent" text,
    "created_by_name" text
      );


alter table "public"."quotes" enable row level security;


  create table "public"."quotes_customers" (
    "id" integer not null default nextval('public.quotes_customers_id_seq'::regclass),
    "quote_id" integer,
    "contractor_id" integer
      );


alter table "public"."quotes_customers" enable row level security;


  create table "public"."rental_items" (
    "id" integer not null default nextval('public.rental_items_id_seq'::regclass),
    "item_number" character varying(50),
    "item_description" character varying(255),
    "display_name" character varying(255),
    "notes" text,
    "uom_1" character varying(50),
    "uom_2" character varying(50),
    "uom_3" character varying(50)
      );



  create table "public"."sale_item_entries" (
    "id" bigint generated by default as identity not null,
    "name" character varying(255) not null default ''::character varying,
    "total_cost" numeric(12,2),
    "revenue" numeric(12,2),
    "gross_profit" numeric(12,2),
    "gross_profit_margin" numeric(6,2),
    "cost" numeric(12,2),
    "notes" text,
    "item_number" character varying(255),
    "display_name" character varying(255),
    "bid_estimate_id" integer,
    "job_id" integer,
    "quantity" integer,
    "vendor" text,
    "quote_price" numeric(12,2),
    "markup_percentage" numeric(5,2)
      );



  create table "public"."sale_items" (
    "id" integer not null default nextval('public.sale_items_id_seq'::regclass),
    "item_number" character varying(50),
    "display_name" character varying(255),
    "uom" character varying(50),
    "notes" text,
    "item_description" text
      );



  create table "public"."service_work_entries" (
    "id" integer not null default nextval('public.service_work_entries_id_seq'::regclass),
    "bid_estimate_id" integer,
    "job_id" integer,
    "standard_pricing" boolean,
    "standard_lump_sum" numeric(10,2),
    "number_trucks" integer,
    "fuel_economy_mpg" numeric(10,2),
    "personnel" integer,
    "on_site_job_hours" numeric(10,2),
    "additional_equipment_cost" numeric(10,2),
    "fuel_cost_per_gallon" numeric(10,2),
    "truck_dispatch_fee" numeric(10,2),
    "worker_comp" numeric(10,2),
    "general_liability" numeric(10,2),
    "markup_rate" numeric(10,2),
    "arrow_boards_cost" numeric(10,2),
    "arrow_boards_quantity" integer,
    "arrow_boards_include_in_lump_sum" boolean,
    "message_boards_cost" numeric(10,2),
    "message_boards_quantity" integer,
    "message_boards_include_in_lump_sum" boolean,
    "tma_cost" numeric(10,2),
    "tma_quantity" integer,
    "tma_include_in_lump_sum" boolean,
    "revenue" numeric(12,2),
    "cost" numeric(12,2),
    "gross_profit" numeric(12,2),
    "hours" numeric(10,2)
      );


alter table "public"."service_work_entries" enable row level security;


  create table "public"."sign_designations" (
    "id" integer not null default nextval('public.sign_designations_id_seq'::regclass),
    "designation" character varying(100),
    "description" character varying(100) not null,
    "sheeting" character varying(2) not null
      );


alter table "public"."sign_designations" enable row level security;


  create table "public"."sign_dimension_options" (
    "sign_designation_id" integer not null,
    "dimension_id" integer not null,
    "is_shared_use_path" boolean default false
      );


alter table "public"."sign_dimension_options" enable row level security;


  create table "public"."sign_dimensions" (
    "id" integer not null default nextval('public.sign_dimensions_id_seq'::regclass),
    "width" numeric(10,2),
    "height" numeric(10,2)
      );


alter table "public"."sign_dimensions" enable row level security;


  create table "public"."sign_dimensions_2" (
    "id" integer not null default nextval('public.sign_dimensions_2_id_seq'::regclass),
    "dimension_label" text not null,
    "square_footage" numeric(10,3),
    "created_at" timestamp with time zone default now()
      );



  create table "public"."sign_orders" (
    "id" integer not null default nextval('public.sign_orders_id_seq'::regclass),
    "requestor" character varying(255),
    "contractor_id" integer,
    "order_date" timestamp without time zone,
    "need_date" timestamp without time zone,
    "sale" boolean,
    "rental" boolean,
    "job_number" character varying(100),
    "signs" jsonb,
    "status" character varying(55),
    "start_date" character varying(55),
    "end_date" character varying(55),
    "contract_number" text,
    "perm_signs" boolean,
    "assigned_to" text,
    "shop_status" character varying(20),
    "order_number" character varying(20),
    "order_status" character varying(25),
    "target_date" timestamp without time zone,
    "archived" boolean default false,
    "created_at" timestamp with time zone default now(),
    "notes" jsonb default '[]'::jsonb,
    "contact_id" integer
      );


alter table "public"."sign_orders" enable row level security;


  create table "public"."sign_production" (
    "id" uuid not null default gen_random_uuid(),
    "date" date not null,
    "employee" text not null,
    "dimension_l" numeric not null,
    "dimension_w" numeric not null,
    "sqft" numeric not null,
    "type" text not null,
    "quantity" integer not null,
    "total_sqft" numeric not null,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."signs_all" (
    "id" text not null,
    "designation" text not null,
    "description" text not null,
    "category" text not null,
    "sizes" text[] not null,
    "sheeting" text not null,
    "kits" text[] not null,
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
    "image_url" text,
    "image_uploaded_at" timestamp without time zone
      );



  create table "public"."sov_entries" (
    "id" bigint generated always as identity not null,
    "job_id" uuid not null,
    "sov_item_id" bigint,
    "quantity" numeric(14,4),
    "unit_price" numeric(14,4),
    "extended_price" numeric(14,4),
    "retainage_type" text default 'percent'::text,
    "retainage_value" numeric(14,4) default 0,
    "retainage_amount" numeric(14,4) default 0,
    "notes" text,
    "sort_order" integer,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "custom_sov_item_id" bigint,
    "display_name_override" text,
    "uom_override" text
      );



  create table "public"."sov_items" (
    "id" bigint generated always as identity not null,
    "item_number" text not null,
    "display_item_number" text not null,
    "description" text not null,
    "display_name" text not null,
    "work_type" text not null,
    "uom_1" text,
    "uom_2" text,
    "uom_3" text,
    "uom_4" text,
    "uom_5" text,
    "uom_6" text,
    "uom_7" text
      );



  create table "public"."sov_items_l" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" uuid not null,
    "item_number" text not null,
    "description" text not null,
    "uom" text not null,
    "quantity" numeric(14,4) not null default 0,
    "unit_price" numeric(14,4) not null default 0,
    "extended_price" numeric(14,2) not null default 0,
    "retainage_type" text,
    "retainage_value" numeric(10,4) default 0,
    "retainage_amount" numeric(14,2) default 0,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "notes" text
      );



  create table "public"."subcontractors" (
    "id" integer not null default nextval('public.subcontractors_id_seq'::regclass),
    "name" character varying(255) not null
      );


alter table "public"."subcontractors" enable row level security;


  create table "public"."takeoff_items_l" (
    "id" uuid not null default gen_random_uuid(),
    "takeoff_id" uuid not null,
    "product_name" text not null,
    "category" text not null,
    "unit" text not null,
    "quantity" numeric(12,4) not null default 0,
    "requisition_type" text not null default 'none'::text,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "in_stock_qty" numeric(12,4) default 0,
    "to_order_qty" numeric(12,4) default 0,
    "inventory_status" text not null default 'pending_review'::text,
    "material" text,
    "sign_details" jsonb,
    "sign_description" text,
    "sheeting" text,
    "width_inches" numeric(8,2),
    "height_inches" numeric(8,2),
    "sqft" numeric(12,4),
    "total_sqft" numeric(12,4),
    "load_order" integer default 1,
    "cover" boolean default true,
    "secondary_signs" jsonb,
    "deleted_at" timestamp with time zone,
    "deleted_by" uuid
      );



  create table "public"."takeoffs_l" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" uuid not null,
    "work_type" text,
    "title" text not null,
    "status" text not null default 'draft'::text,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "install_date" date,
    "pickup_date" date,
    "contracted_or_additional" text,
    "work_order_number" text,
    "work_order_id" uuid,
    "needed_by_date" date,
    "revision_of_takeoff_id" uuid,
    "revision_number" integer default 1,
    "chain_root_takeoff_id" uuid,
    "destination" text,
    "default_sign_material" text,
    "priority" text,
    "crew_notes" text,
    "build_shop_notes" text,
    "canceled_at" timestamp with time zone,
    "canceled_by" uuid,
    "cancel_reason" text,
    "cancel_notes" text,
    "active_sections" text[] default '{}'::text[],
    "sign_rows" jsonb default '{}'::jsonb,
    "pm_notes" text,
    "is_multi_day_job" boolean not null default false,
    "end_date" date,
    "active_permanent_items" text[] default '{}'::text[],
    "permanent_sign_rows" jsonb default '{}'::jsonb,
    "permanent_entry_rows" jsonb default '{}'::jsonb,
    "default_permanent_sign_material" text default 'ALUMINUM'::text,
    "vehicle_items" jsonb default '[]'::jsonb,
    "rolling_stock_items" jsonb default '[]'::jsonb,
    "additional_items" jsonb default '[]'::jsonb,
    "is_pickup" boolean not null default false,
    "parent_takeoff_id" uuid,
    "return_inventory_submitted_at" timestamp with time zone
      );



  create table "public"."users" (
    "name" character varying(55),
    "email" character varying(55),
    "role" character varying(55),
    "password" character varying(255),
    "username" character varying(55),
    "id" integer not null default nextval('public.users_id_seq'::regclass),
    "branch_id" integer,
    "user_id" uuid
      );


alter table "public"."users" enable row level security;


  create table "public"."won_bid_items" (
    "id" integer not null default nextval('public.won_bid_items_id_seq'::regclass),
    "job_id" integer not null,
    "bid_item_id" integer not null,
    "quantity" numeric(10,2) not null,
    "contract_value" numeric(12,2) not null,
    "aia_billing" boolean,
    "backlog" boolean default false,
    "unit_price" numeric(12,2)
      );


alter table "public"."won_bid_items" enable row level security;


  create table "public"."work_order_items_l" (
    "id" uuid not null default gen_random_uuid(),
    "work_order_id" uuid not null,
    "description" text not null,
    "contract_quantity" numeric(12,4) not null default 0,
    "work_order_quantity" numeric(12,4) not null default 0,
    "uom" text not null,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "notes" text,
    "deleted_at" timestamp with time zone,
    "sov_item_id" bigint,
    "item_number" text,
    "pickup_condition" public.pickup_condition_enum,
    "pickup_images" text[] default '{}'::text[]
      );



  create table "public"."work_orders_l" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" uuid not null,
    "wo_number" integer,
    "description" text,
    "status" text not null default 'draft'::text,
    "scheduled_date" date,
    "assigned_to" text,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "title" text not null default 'New Work Order'::text,
    "needed_by_date" date,
    "percent_complete" numeric(5,2) default 0,
    "created_by" text not null,
    "updated_at" timestamp with time zone not null default now(),
    "branch" text,
    "contracted_or_additional" text not null default 'contracted'::text,
    "takeoff_id" uuid,
    "customer_poc_phone" text,
    "canceled_at" timestamp with time zone,
    "canceled_by" uuid,
    "cancel_reason" text,
    "deleted_at" timestamp with time zone,
    "is_pickup" boolean not null default false,
    "parent_work_order_id" uuid
      );


alter sequence "public"."admin_data_entries_id_seq" owned by "public"."admin_data_entries"."id";

alter sequence "public"."archived_available_jobs_id_seq" owned by "public"."archived_available_jobs"."id";

alter sequence "public"."associated_items_id_seq" owned by "public"."associated_items"."id";

alter sequence "public"."available_jobs_id_seq" owned by "public"."available_jobs"."id";

alter sequence "public"."bid_estimates_id_seq" owned by "public"."bid_estimates"."id";

alter sequence "public"."bid_item_numbers_id_seq" owned by "public"."bid_item_numbers"."id";

alter sequence "public"."bid_notes_id_seq" owned by "public"."notes"."id";

alter sequence "public"."branches_id_seq" owned by "public"."branches"."id";

alter sequence "public"."counties_id_seq" owned by "public"."counties"."id";

alter sequence "public"."custom_dimensions_id_seq" owned by "public"."custom_dimensions"."id";

alter sequence "public"."customer_contacts_id_seq" owned by "public"."customer_contacts"."id";

alter sequence "public"."equipment_rental_entries_id_seq" owned by "public"."equipment_rental_entries"."id";

alter sequence "public"."files_id_seq" owned by "public"."files"."id";

alter sequence "public"."flagging_entries_id_seq" owned by "public"."flagging_entries"."id";

alter sequence "public"."flagging_id_seq" owned by "public"."flagging"."id";

alter sequence "public"."general_static_assumptions_id_seq" owned by "public"."general_static_assumptions"."id";

alter sequence "public"."items_id_seq" owned by "public"."items"."id";

alter sequence "public"."job_numbers_id_seq" owned by "public"."job_numbers"."id";

alter sequence "public"."jobs_id_seq" owned by "public"."jobs"."id";

alter sequence "public"."mpt_phases_id_seq" owned by "public"."mpt_phases"."id";

alter sequence "public"."mpt_primary_signs_id_seq" owned by "public"."mpt_primary_signs"."id";

alter sequence "public"."mpt_rental_entries_id_seq" owned by "public"."mpt_rental_entries"."id";

alter sequence "public"."mpt_secondary_signs_id_seq" owned by "public"."mpt_secondary_signs"."id";

alter sequence "public"."mpt_static_equipment_info_id_seq" owned by "public"."mpt_static_equipment_info"."id";

alter sequence "public"."owners_id_seq" owned by "public"."owners"."id";

alter sequence "public"."permanent_sign_items_id_seq" owned by "public"."permanent_sign_items"."id";

alter sequence "public"."permanent_signs_entries_id_seq" owned by "public"."permanent_signs_entries"."id";

alter sequence "public"."permanent_signs_id_seq" owned by "public"."permanent_signs"."id";

alter sequence "public"."productivity_rates_id_seq" owned by "public"."productivity_rates"."id";

alter sequence "public"."project_metadata_id_seq" owned by "public"."project_metadata"."id";

alter sequence "public"."pts_kits_id_seq" owned by "public"."pts_kits"."id";

alter sequence "public"."quote_items_id_seq" owned by "public"."quote_items"."id";

alter sequence "public"."quote_recipients_id_seq" owned by "public"."quote_recipients"."id";

alter sequence "public"."quote_sequential_numbers_id_seq" owned by "public"."quote_sequential_numbers"."id";

alter sequence "public"."quotes_customers_id_seq" owned by "public"."quotes_customers"."id";

alter sequence "public"."quotes_id_seq" owned by "public"."quotes"."id";

alter sequence "public"."rental_items_id_seq" owned by "public"."rental_items"."id";

alter sequence "public"."sale_items_id_seq" owned by "public"."sale_items"."id";

alter sequence "public"."service_work_entries_id_seq" owned by "public"."service_work_entries"."id";

alter sequence "public"."sign_designations_id_seq" owned by "public"."sign_designations"."id";

alter sequence "public"."sign_dimensions_2_id_seq" owned by "public"."sign_dimensions_2"."id";

alter sequence "public"."sign_dimensions_id_seq" owned by "public"."sign_dimensions"."id";

alter sequence "public"."sign_orders_id_seq" owned by "public"."sign_orders"."id";

alter sequence "public"."subcontractors_id_seq" owned by "public"."subcontractors"."id";

alter sequence "public"."users_id_seq" owned by "public"."users"."id";

alter sequence "public"."won_bid_items_id_seq" owned by "public"."won_bid_items"."id";

CREATE UNIQUE INDEX admin_data_entries_job_id_unique ON public.admin_data_entries USING btree (job_id);

CREATE UNIQUE INDEX admin_data_entries_pkey ON public.admin_data_entries USING btree (id);

CREATE UNIQUE INDEX archived_available_jobs_pkey ON public.archived_available_jobs USING btree (id);

CREATE UNIQUE INDEX associated_items_pkey ON public.associated_items USING btree (id);

CREATE UNIQUE INDEX available_jobs_pkey ON public.available_jobs USING btree (id);

CREATE INDEX bid_estimates_deleted_archived_idx ON public.bid_estimates_deleted USING btree (archived);

CREATE INDEX bid_estimates_deleted_contract_number_idx ON public.bid_estimates_deleted USING btree (contract_number);

CREATE UNIQUE INDEX bid_estimates_deleted_contract_number_key ON public.bid_estimates_deleted USING btree (contract_number);

CREATE INDEX bid_estimates_deleted_deleted_idx ON public.bid_estimates_deleted USING btree (deleted);

CREATE UNIQUE INDEX bid_estimates_deleted_pkey ON public.bid_estimates_deleted USING btree (id);

CREATE UNIQUE INDEX bid_estimates_pkey ON public.bid_estimates USING btree (id);

CREATE UNIQUE INDEX bid_item_numbers_pkey ON public.bid_item_numbers USING btree (id);

CREATE UNIQUE INDEX bid_notes_pkey ON public.notes USING btree (id);

CREATE UNIQUE INDEX branches_pkey ON public.branches USING btree (id);

CREATE INDEX change_orders_approved_date_idx ON public.change_orders USING btree (approved_date DESC);

CREATE INDEX change_orders_job_id_idx ON public.change_orders USING btree (job_id);

CREATE UNIQUE INDEX change_orders_pkey ON public.change_orders USING btree (id);

CREATE INDEX change_orders_status_idx ON public.change_orders USING btree (status);

CREATE INDEX change_orders_submitted_date_idx ON public.change_orders USING btree (submitted_date DESC);

CREATE UNIQUE INDEX contractors_pkey ON public.contractors USING btree (id);

CREATE UNIQUE INDEX counties_pkey ON public.counties USING btree (id);

CREATE UNIQUE INDEX custom_dimensions_dimension_label_key ON public.custom_dimensions USING btree (dimension_label);

CREATE UNIQUE INDEX custom_dimensions_pkey ON public.custom_dimensions USING btree (id);

CREATE UNIQUE INDEX custom_sov_items_job_id_display_item_number_idx ON public.custom_sov_items USING btree (job_id, display_item_number);

CREATE UNIQUE INDEX custom_sov_items_job_id_item_number_key ON public.custom_sov_items USING btree (job_id, item_number);

CREATE UNIQUE INDEX custom_sov_items_pkey ON public.custom_sov_items USING btree (id);

CREATE UNIQUE INDEX customer_contacts_pkey ON public.customer_contacts USING btree (id);

CREATE UNIQUE INDEX documents_file_path_key ON public.documents_l USING btree (file_path);

CREATE UNIQUE INDEX documents_pkey ON public.documents_l USING btree (id);

CREATE UNIQUE INDEX equipment_rental_entries_pkey ON public.equipment_rental_entries USING btree (id);

CREATE UNIQUE INDEX files_pkey ON public.files USING btree (id);

CREATE UNIQUE INDEX flagging_entries_pkey ON public.flagging_entries USING btree (id);

CREATE UNIQUE INDEX flagging_pkey ON public.flagging USING btree (id);

CREATE UNIQUE INDEX general_static_assumptions_pkey ON public.general_static_assumptions USING btree (id);

CREATE INDEX idx_admin_data_entries_bid_estimate ON public.admin_data_entries USING btree (bid_estimate_id);

CREATE INDEX idx_admin_data_entries_job ON public.admin_data_entries USING btree (job_id);

CREATE INDEX idx_archived_available_jobs_archived_at ON public.archived_available_jobs USING btree (archived_at);

CREATE INDEX idx_archived_available_jobs_original_id ON public.archived_available_jobs USING btree (original_id);

CREATE INDEX idx_associated_items_quote_item_id ON public.associated_items USING btree (quote_item_id);

CREATE INDEX idx_available_jobs_contract_number ON public.available_jobs USING btree (contract_number);

CREATE INDEX idx_available_jobs_due_date ON public.available_jobs USING btree (due_date);

CREATE INDEX idx_bid_estimates_archived ON public.bid_estimates USING btree (archived);

CREATE INDEX idx_bid_estimates_contract_number ON public.bid_estimates USING btree (contract_number);

CREATE INDEX idx_bid_estimates_deleted ON public.bid_estimates USING btree (deleted);

CREATE INDEX idx_documents_file_path ON public.documents_l USING btree (file_path);

CREATE INDEX idx_documents_file_type ON public.documents_l USING btree (file_type);

CREATE INDEX idx_documents_job_id ON public.documents_l USING btree (job_id);

CREATE INDEX idx_documents_uploaded_at ON public.documents_l USING btree (uploaded_at DESC);

CREATE INDEX idx_equipment_rental_entries_bid_estimate ON public.equipment_rental_entries USING btree (bid_estimate_id);

CREATE INDEX idx_equipment_rental_entries_job ON public.equipment_rental_entries USING btree (job_id);

CREATE INDEX idx_files_contract_number ON public.files USING btree (contract_number);

CREATE INDEX idx_files_job ON public.files USING btree (job_id);

CREATE INDEX idx_files_quote_id ON public.files USING btree (quote_id);

CREATE INDEX idx_files_sign_order_id ON public.files USING btree (sign_order_id);

CREATE INDEX idx_flagging_entries_bid_estimate ON public.flagging_entries USING btree (bid_estimate_id);

CREATE INDEX idx_flagging_entries_job ON public.flagging_entries USING btree (job_id);

CREATE INDEX idx_jobs_archived ON public.jobs USING btree (archived);

CREATE INDEX idx_jobs_billing_status ON public.jobs USING btree (billing_status);

CREATE INDEX idx_jobs_complete_billing ON public.jobs USING btree (billing_status);

CREATE INDEX idx_jobs_complete_created ON public.jobs USING btree (created_at);

CREATE INDEX idx_jobs_complete_status ON public.jobs USING btree (project_status);

CREATE INDEX idx_jobs_contract_number ON public.jobs_l USING btree (contract_number);

CREATE INDEX idx_jobs_created_at ON public.jobs_l USING btree (created_at);

CREATE INDEX idx_jobs_customer_name ON public.jobs_l USING btree (customer_name);

CREATE INDEX idx_jobs_dates ON public.jobs_l USING btree (project_start_date, project_end_date);

CREATE INDEX idx_jobs_deleted ON public.jobs USING btree (deleted);

CREATE INDEX idx_jobs_estimate ON public.jobs USING btree (estimate_id);

CREATE INDEX idx_jobs_internal_id ON public.jobs_l USING btree (internal_id);

CREATE INDEX idx_jobs_job_number ON public.jobs USING btree (job_number_id);

CREATE INDEX idx_jobs_project_name ON public.jobs_l USING btree (project_name);

CREATE INDEX idx_jobs_project_status ON public.jobs USING btree (project_status);

CREATE INDEX idx_jobs_statuses ON public.jobs_l USING btree (contract_status, project_status, billing_status);

CREATE INDEX idx_kg_edges_rel ON public.kg_edges USING btree (relationship);

CREATE INDEX idx_kg_edges_source ON public.kg_edges USING btree (source_id);

CREATE INDEX idx_kg_edges_target ON public.kg_edges USING btree (target_id);

CREATE INDEX idx_kg_nodes_label ON public.kg_nodes USING btree (label);

CREATE INDEX idx_kg_nodes_type ON public.kg_nodes USING btree (type);

CREATE INDEX idx_kit_variants_kit_id ON public.kit_variants USING btree (kit_id);

CREATE INDEX idx_mpt_phases_rental ON public.mpt_phases USING btree (mpt_rental_entry_id);

CREATE INDEX idx_mpt_rental_entries_bid_estimate ON public.mpt_rental_entries USING btree (bid_estimate_id);

CREATE INDEX idx_mpt_rental_entries_job ON public.mpt_rental_entries USING btree (job_id);

CREATE INDEX idx_mutcd_signs_code ON public.mutcd_signs USING btree (mutcd_code);

CREATE INDEX idx_mutcd_signs_variants_gin ON public.mutcd_signs USING gin (variants);

CREATE INDEX idx_pata_kit_contents_code ON public.pata_kit_contents USING btree (pata_kit_code);

CREATE INDEX idx_permanent_sign_items_type ON public.permanent_sign_items USING btree (type);

CREATE INDEX idx_permanent_signs_entries_estimate_id ON public.permanent_signs_entries USING btree (bid_estimate_id);

CREATE INDEX idx_permanent_signs_entry_id ON public.permanent_signs USING btree (permanent_signs_entry_id);

CREATE INDEX idx_permanent_signs_item_type ON public.permanent_signs USING btree (item_type);

CREATE INDEX idx_permanent_signs_quantity ON public.permanent_signs USING btree (quantity);

CREATE INDEX idx_permanent_signs_sign_sq_footage ON public.permanent_signs USING btree (sign_sq_footage);

CREATE INDEX idx_permanent_signs_type ON public.permanent_signs USING btree (type);

CREATE INDEX idx_primary_signs_phase ON public.mpt_primary_signs USING btree (phase_id);

CREATE INDEX idx_project_metadata_bid_estimate ON public.project_metadata USING btree (bid_estimate_id);

CREATE INDEX idx_project_metadata_contractor ON public.project_metadata USING btree (contractor_id);

CREATE INDEX idx_project_metadata_job ON public.project_metadata USING btree (job_id);

CREATE INDEX idx_project_metadata_subcontractor ON public.project_metadata USING btree (subcontractor_id);

CREATE INDEX idx_pts_kit_contents_code ON public.pts_kit_contents USING btree (pts_kit_code);

CREATE INDEX idx_quote_items_quote_id ON public.quote_items USING btree (quote_id);

CREATE INDEX idx_quote_recipients_quote_id ON public.quote_recipients USING btree (quote_id);

CREATE INDEX idx_quote_sequential_numbers_used ON public.quote_sequential_numbers USING btree (used);

CREATE INDEX idx_quotes_date_sent ON public.quotes USING btree (date_sent);

CREATE INDEX idx_quotes_quote_number ON public.quotes USING btree (quote_number);

CREATE INDEX idx_quotes_status ON public.quotes USING btree (status);

CREATE INDEX idx_sale_item_entries_bid_estimate ON public.sale_item_entries USING btree (bid_estimate_id);

CREATE INDEX idx_sale_item_entries_job ON public.sale_item_entries USING btree (job_id);

CREATE INDEX idx_secondary_signs_phase ON public.mpt_secondary_signs USING btree (phase_id);

CREATE INDEX idx_service_work_entries_bid_estimate ON public.service_work_entries USING btree (bid_estimate_id);

CREATE INDEX idx_service_work_entries_job ON public.service_work_entries USING btree (job_id);

CREATE INDEX idx_sign_designations ON public.sign_designations USING btree (designation);

CREATE INDEX idx_sign_dimension_options_dim_id ON public.sign_dimension_options USING btree (dimension_id);

CREATE INDEX idx_sign_dimension_options_sign_id ON public.sign_dimension_options USING btree (sign_designation_id);

CREATE INDEX idx_sign_dimensions_size ON public.sign_dimensions USING btree (width, height);

CREATE INDEX idx_sign_orders_shop_status ON public.sign_orders USING btree (shop_status);

CREATE INDEX idx_sign_production_date ON public.sign_production USING btree (date);

CREATE INDEX idx_sign_production_employee ON public.sign_production USING btree (employee);

CREATE INDEX idx_sign_production_type ON public.sign_production USING btree (type);

CREATE INDEX idx_signs_category ON public.signs_all USING btree (category);

CREATE INDEX idx_signs_image_url ON public.signs_all USING btree (image_url);

CREATE INDEX idx_signs_kits ON public.signs_all USING gin (kits);

CREATE INDEX idx_sov_entries_job_id ON public.sov_entries USING btree (job_id);

CREATE INDEX idx_sov_entries_sort_order ON public.sov_entries USING btree (job_id, sort_order);

CREATE INDEX idx_sov_entries_sov_item_id ON public.sov_entries USING btree (sov_item_id);

CREATE INDEX idx_sov_items_created_at ON public.sov_items_l USING btree (created_at DESC);

CREATE INDEX idx_sov_items_item_number ON public.sov_items_l USING btree (item_number);

CREATE INDEX idx_sov_items_job_id ON public.sov_items_l USING btree (job_id);

CREATE INDEX idx_sov_items_sort_order ON public.sov_items_l USING btree (sort_order);

CREATE INDEX idx_static_equipment_rental ON public.mpt_static_equipment_info USING btree (mpt_rental_entry_id);

CREATE INDEX idx_takeoff_items_l_category ON public.takeoff_items_l USING btree (category);

CREATE INDEX idx_takeoff_items_l_created_at ON public.takeoff_items_l USING btree (created_at);

CREATE INDEX idx_takeoff_items_l_inventory_status ON public.takeoff_items_l USING btree (inventory_status);

CREATE INDEX idx_takeoff_items_l_load_order ON public.takeoff_items_l USING btree (load_order);

CREATE INDEX idx_takeoff_items_l_product_name ON public.takeoff_items_l USING btree (product_name);

CREATE INDEX idx_takeoff_items_l_takeoff_id ON public.takeoff_items_l USING btree (takeoff_id);

CREATE INDEX idx_takeoffs_l_install_date ON public.takeoffs_l USING btree (install_date);

CREATE INDEX idx_takeoffs_l_is_pickup ON public.takeoffs_l USING btree (is_pickup);

CREATE INDEX idx_takeoffs_l_job_id ON public.takeoffs_l USING btree (job_id);

CREATE INDEX idx_takeoffs_l_needed_by_date ON public.takeoffs_l USING btree (needed_by_date);

CREATE INDEX idx_takeoffs_l_parent_takeoff_id ON public.takeoffs_l USING btree (parent_takeoff_id);

CREATE INDEX idx_takeoffs_l_revision_chain ON public.takeoffs_l USING btree (chain_root_takeoff_id);

CREATE INDEX idx_takeoffs_l_status ON public.takeoffs_l USING btree (status);

CREATE INDEX idx_takeoffs_l_work_order_id ON public.takeoffs_l USING btree (work_order_id);

CREATE INDEX idx_wo_items_created_at ON public.work_order_items_l USING btree (created_at);

CREATE INDEX idx_wo_items_description ON public.work_order_items_l USING btree (description);

CREATE INDEX idx_wo_items_sort_order ON public.work_order_items_l USING btree (sort_order);

CREATE INDEX idx_wo_items_work_order_id ON public.work_order_items_l USING btree (work_order_id);

CREATE INDEX idx_won_bid_items_bid_item_id ON public.won_bid_items USING btree (bid_item_id);

CREATE INDEX idx_won_bid_items_job_id ON public.won_bid_items USING btree (job_id);

CREATE INDEX idx_work_order_items_l_pickup_condition ON public.work_order_items_l USING btree (pickup_condition);

CREATE INDEX idx_work_orders_l_created_at ON public.work_orders_l USING btree (created_at);

CREATE INDEX idx_work_orders_l_is_pickup ON public.work_orders_l USING btree (is_pickup);

CREATE INDEX idx_work_orders_l_job_id ON public.work_orders_l USING btree (job_id);

CREATE INDEX idx_work_orders_l_needed_by_date ON public.work_orders_l USING btree (needed_by_date);

CREATE INDEX idx_work_orders_l_parent_work_order_id ON public.work_orders_l USING btree (parent_work_order_id);

CREATE INDEX idx_work_orders_l_scheduled_date ON public.work_orders_l USING btree (scheduled_date);

CREATE INDEX idx_work_orders_l_status ON public.work_orders_l USING btree (status);

CREATE INDEX idx_work_orders_l_takeoff_id ON public.work_orders_l USING btree (takeoff_id);

CREATE INDEX idx_work_orders_l_wo_number ON public.work_orders_l USING btree (wo_number);

CREATE UNIQUE INDEX items_pkey ON public.items USING btree (id);

CREATE UNIQUE INDEX job_numbers_branch_code_owner_type_year_sequential_number_key ON public.job_numbers USING btree (branch_code, owner_type, year, sequential_number);

CREATE UNIQUE INDEX job_numbers_job_number_key ON public.job_numbers USING btree (job_number);

CREATE UNIQUE INDEX job_numbers_pkey ON public.job_numbers USING btree (id);

CREATE INDEX jobs_deleted_archived_idx ON public.jobs_deleted USING btree (archived);

CREATE INDEX jobs_deleted_billing_status_idx ON public.jobs_deleted USING btree (billing_status);

CREATE INDEX jobs_deleted_billing_status_idx1 ON public.jobs_deleted USING btree (billing_status);

CREATE INDEX jobs_deleted_created_at_idx ON public.jobs_deleted USING btree (created_at);

CREATE INDEX jobs_deleted_deleted_idx ON public.jobs_deleted USING btree (deleted);

CREATE INDEX jobs_deleted_estimate_id_idx ON public.jobs_deleted USING btree (estimate_id);

CREATE INDEX jobs_deleted_job_number_id_idx ON public.jobs_deleted USING btree (job_number_id);

CREATE UNIQUE INDEX jobs_deleted_pkey ON public.jobs_deleted USING btree (id);

CREATE INDEX jobs_deleted_project_status_idx ON public.jobs_deleted USING btree (project_status);

CREATE INDEX jobs_deleted_project_status_idx1 ON public.jobs_deleted USING btree (project_status);

CREATE UNIQUE INDEX jobs_l_pkey ON public.jobs_l USING btree (id);

CREATE UNIQUE INDEX jobs_pkey ON public.jobs USING btree (id);

CREATE UNIQUE INDEX kg_edges_pkey ON public.kg_edges USING btree (id);

CREATE UNIQUE INDEX kg_nodes_pkey ON public.kg_nodes USING btree (id);

CREATE UNIQUE INDEX kg_nodes_type_label_key ON public.kg_nodes USING btree (type, label);

CREATE UNIQUE INDEX kit_variants_kit_id_variant_label_key ON public.kit_variants USING btree (kit_id, variant_label);

CREATE UNIQUE INDEX kit_variants_pkey ON public.kit_variants USING btree (id);

CREATE UNIQUE INDEX mpt_phases_mpt_rental_entry_id_phase_index_key ON public.mpt_phases USING btree (mpt_rental_entry_id, phase_index);

CREATE UNIQUE INDEX mpt_phases_pkey ON public.mpt_phases USING btree (id);

CREATE UNIQUE INDEX mpt_primary_signs_phase_id_sign_id_key ON public.mpt_primary_signs USING btree (phase_id, sign_id);

CREATE UNIQUE INDEX mpt_primary_signs_pkey ON public.mpt_primary_signs USING btree (id);

CREATE UNIQUE INDEX mpt_rental_entries_pkey ON public.mpt_rental_entries USING btree (id);

CREATE UNIQUE INDEX mpt_secondary_signs_phase_id_sign_id_key ON public.mpt_secondary_signs USING btree (phase_id, sign_id);

CREATE UNIQUE INDEX mpt_secondary_signs_pkey ON public.mpt_secondary_signs USING btree (id);

CREATE UNIQUE INDEX mpt_static_equipment_info_mpt_rental_entry_id_equipment_typ_key ON public.mpt_static_equipment_info USING btree (mpt_rental_entry_id, equipment_type);

CREATE UNIQUE INDEX mpt_static_equipment_info_pkey ON public.mpt_static_equipment_info USING btree (id);

CREATE UNIQUE INDEX mutcd_signs_pkey ON public.mutcd_signs USING btree (mutcd_code);

CREATE UNIQUE INDEX owners_pkey ON public.owners USING btree (id);

CREATE UNIQUE INDEX pata_kit_contents_pata_kit_code_sign_designation_key ON public.pata_kit_contents USING btree (pata_kit_code, sign_designation);

CREATE UNIQUE INDEX pata_kit_contents_pkey ON public.pata_kit_contents USING btree (id);

CREATE UNIQUE INDEX pata_kits_pkey ON public.pata_kits USING btree (id);

CREATE UNIQUE INDEX permanent_sign_items_pkey ON public.permanent_sign_items USING btree (id);

CREATE UNIQUE INDEX permanent_signs_entries_bid_estimate_id_key ON public.permanent_signs_entries USING btree (bid_estimate_id);

CREATE UNIQUE INDEX permanent_signs_entries_pkey ON public.permanent_signs_entries USING btree (id);

CREATE UNIQUE INDEX permanent_signs_pkey ON public.permanent_signs USING btree (id);

CREATE UNIQUE INDEX pickup_takeoff_items_l_pkey ON public.pickup_takeoff_items_l USING btree (id);

CREATE UNIQUE INDEX pickup_takeoffs_l_pkey ON public.pickup_takeoffs_l USING btree (id);

CREATE UNIQUE INDEX pickup_work_orders_l_pkey ON public.pickup_work_orders_l USING btree (id);

CREATE UNIQUE INDEX productivity_rates_pkey ON public.productivity_rates USING btree (id);

CREATE UNIQUE INDEX project_managers_pkey ON public.project_managers USING btree (id);

CREATE UNIQUE INDEX project_metadata_bid_estimate_id_unique ON public.project_metadata USING btree (bid_estimate_id);

CREATE UNIQUE INDEX project_metadata_job_id_unique ON public.project_metadata USING btree (job_id);

CREATE UNIQUE INDEX project_metadata_pkey ON public.project_metadata USING btree (id);

CREATE UNIQUE INDEX pts_kit_contents_pkey ON public.pts_kit_contents USING btree (id);

CREATE UNIQUE INDEX pts_kit_contents_pts_kit_code_sign_designation_key ON public.pts_kit_contents USING btree (pts_kit_code, sign_designation);

CREATE UNIQUE INDEX pts_kits_code_key ON public.pts_kits USING btree (code);

CREATE UNIQUE INDEX pts_kits_pkey ON public.pts_kits USING btree (id);

CREATE UNIQUE INDEX quote_items_pkey ON public.quote_items USING btree (id);

CREATE UNIQUE INDEX quote_recipients_pkey ON public.quote_recipients USING btree (id);

CREATE UNIQUE INDEX quote_sequential_numbers_pkey ON public.quote_sequential_numbers USING btree (id);

CREATE UNIQUE INDEX quotes_customers_pkey ON public.quotes_customers USING btree (id);

CREATE UNIQUE INDEX quotes_customers_quote_id_contractor_id_key ON public.quotes_customers USING btree (quote_id, contractor_id);

CREATE UNIQUE INDEX quotes_pkey ON public.quotes USING btree (id);

CREATE UNIQUE INDEX quotes_response_token_key ON public.quotes USING btree (response_token);

CREATE UNIQUE INDEX rental_items_pkey ON public.rental_items USING btree (id);

CREATE UNIQUE INDEX sale_item_entries_pkey ON public.sale_item_entries USING btree (id);

CREATE UNIQUE INDEX sale_items_pkey ON public.sale_items USING btree (id);

CREATE UNIQUE INDEX service_work_entries_pkey ON public.service_work_entries USING btree (id);

CREATE UNIQUE INDEX sign_designations_pkey ON public.sign_designations USING btree (id);

CREATE UNIQUE INDEX sign_dimension_options_pkey ON public.sign_dimension_options USING btree (sign_designation_id, dimension_id);

CREATE UNIQUE INDEX sign_dimensions_2_dimension_label_key ON public.sign_dimensions_2 USING btree (dimension_label);

CREATE UNIQUE INDEX sign_dimensions_2_pkey ON public.sign_dimensions_2 USING btree (id);

CREATE UNIQUE INDEX sign_dimensions_pkey ON public.sign_dimensions USING btree (id);

CREATE UNIQUE INDEX sign_dimensions_width_height_key ON public.sign_dimensions USING btree (width, height);

CREATE UNIQUE INDEX sign_orders_pkey ON public.sign_orders USING btree (id);

CREATE UNIQUE INDEX sign_production_pkey ON public.sign_production USING btree (id);

CREATE UNIQUE INDEX signs_designation_key ON public.signs_all USING btree (designation);

CREATE UNIQUE INDEX signs_pkey ON public.signs_all USING btree (id);

CREATE UNIQUE INDEX sov_entries_job_id_custom_sov_item_id_key ON public.sov_entries USING btree (job_id, custom_sov_item_id) WHERE (custom_sov_item_id IS NOT NULL);

CREATE UNIQUE INDEX sov_entries_job_id_sov_item_id_key ON public.sov_entries USING btree (job_id, sov_item_id);

CREATE UNIQUE INDEX sov_entries_pkey ON public.sov_entries USING btree (id);

CREATE UNIQUE INDEX sov_items_l_pkey ON public.sov_items_l USING btree (id);

CREATE UNIQUE INDEX sov_items_pkey ON public.sov_items USING btree (id);

CREATE UNIQUE INDEX subcontractors_name_key ON public.subcontractors USING btree (name);

CREATE UNIQUE INDEX subcontractors_pkey ON public.subcontractors USING btree (id);

CREATE UNIQUE INDEX takeoff_items_l_pkey ON public.takeoff_items_l USING btree (id);

CREATE UNIQUE INDEX takeoffs_l_pkey ON public.takeoffs_l USING btree (id);

CREATE UNIQUE INDEX uk_contract_number ON public.bid_estimates USING btree (contract_number);

CREATE UNIQUE INDEX unique_admin_data_bid_estimate_id ON public.admin_data_entries USING btree (bid_estimate_id);

CREATE UNIQUE INDEX unique_admin_data_entry ON public.admin_data_entries USING btree (COALESCE(bid_estimate_id, 0), COALESCE(job_id, 0));

CREATE UNIQUE INDEX unique_equipment_rental_entry ON public.equipment_rental_entries USING btree (COALESCE(bid_estimate_id, 0), COALESCE(job_id, 0), name);

CREATE UNIQUE INDEX unique_flagging_bid_estimate_id ON public.flagging_entries USING btree (bid_estimate_id);

CREATE UNIQUE INDEX unique_flagging_entry ON public.flagging_entries USING btree (COALESCE(bid_estimate_id, 0), COALESCE(job_id, 0));

CREATE UNIQUE INDEX unique_mpt_rental_bid_estimate_id ON public.mpt_rental_entries USING btree (bid_estimate_id);

CREATE UNIQUE INDEX unique_mpt_rental_entry ON public.mpt_rental_entries USING btree (COALESCE(bid_estimate_id, 0), COALESCE(job_id, 0));

CREATE UNIQUE INDEX unique_project_metadata_entry ON public.project_metadata USING btree (COALESCE(bid_estimate_id, 0), COALESCE(job_id, 0));

CREATE UNIQUE INDEX unique_sale_item_entry ON public.sale_item_entries USING btree (COALESCE(bid_estimate_id, 0), COALESCE(job_id, 0), name);

CREATE UNIQUE INDEX unique_service_work_bid_estimate_id ON public.service_work_entries USING btree (bid_estimate_id);

CREATE UNIQUE INDEX unique_service_work_entry ON public.service_work_entries USING btree (COALESCE(bid_estimate_id, 0), COALESCE(job_id, 0));

CREATE UNIQUE INDEX uq_takeoffs_l_one_pickup_per_parent ON public.takeoffs_l USING btree (parent_takeoff_id) WHERE ((is_pickup = true) AND (parent_takeoff_id IS NOT NULL));

CREATE UNIQUE INDEX uq_work_orders_l_one_pickup_per_parent ON public.work_orders_l USING btree (parent_work_order_id) WHERE ((is_pickup = true) AND (parent_work_order_id IS NOT NULL));

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX won_bid_items_pkey ON public.won_bid_items USING btree (id);

CREATE UNIQUE INDEX work_order_items_l_pkey ON public.work_order_items_l USING btree (id);

CREATE UNIQUE INDEX work_orders_l_pkey ON public.work_orders_l USING btree (id);

CREATE UNIQUE INDEX work_orders_l_takeoff_wo_number_key ON public.work_orders_l USING btree (takeoff_id, wo_number);

alter table "public"."admin_data_entries" add constraint "admin_data_entries_pkey" PRIMARY KEY using index "admin_data_entries_pkey";

alter table "public"."archived_available_jobs" add constraint "archived_available_jobs_pkey" PRIMARY KEY using index "archived_available_jobs_pkey";

alter table "public"."associated_items" add constraint "associated_items_pkey" PRIMARY KEY using index "associated_items_pkey";

alter table "public"."available_jobs" add constraint "available_jobs_pkey" PRIMARY KEY using index "available_jobs_pkey";

alter table "public"."bid_estimates" add constraint "bid_estimates_pkey" PRIMARY KEY using index "bid_estimates_pkey";

alter table "public"."bid_estimates_deleted" add constraint "bid_estimates_deleted_pkey" PRIMARY KEY using index "bid_estimates_deleted_pkey";

alter table "public"."bid_item_numbers" add constraint "bid_item_numbers_pkey" PRIMARY KEY using index "bid_item_numbers_pkey";

alter table "public"."branches" add constraint "branches_pkey" PRIMARY KEY using index "branches_pkey";

alter table "public"."change_orders" add constraint "change_orders_pkey" PRIMARY KEY using index "change_orders_pkey";

alter table "public"."contractors" add constraint "contractors_pkey" PRIMARY KEY using index "contractors_pkey";

alter table "public"."counties" add constraint "counties_pkey" PRIMARY KEY using index "counties_pkey";

alter table "public"."custom_dimensions" add constraint "custom_dimensions_pkey" PRIMARY KEY using index "custom_dimensions_pkey";

alter table "public"."custom_sov_items" add constraint "custom_sov_items_pkey" PRIMARY KEY using index "custom_sov_items_pkey";

alter table "public"."customer_contacts" add constraint "customer_contacts_pkey" PRIMARY KEY using index "customer_contacts_pkey";

alter table "public"."documents_l" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."equipment_rental_entries" add constraint "equipment_rental_entries_pkey" PRIMARY KEY using index "equipment_rental_entries_pkey";

alter table "public"."files" add constraint "files_pkey" PRIMARY KEY using index "files_pkey";

alter table "public"."flagging" add constraint "flagging_pkey" PRIMARY KEY using index "flagging_pkey";

alter table "public"."flagging_entries" add constraint "flagging_entries_pkey" PRIMARY KEY using index "flagging_entries_pkey";

alter table "public"."general_static_assumptions" add constraint "general_static_assumptions_pkey" PRIMARY KEY using index "general_static_assumptions_pkey";

alter table "public"."items" add constraint "items_pkey" PRIMARY KEY using index "items_pkey";

alter table "public"."job_numbers" add constraint "job_numbers_pkey" PRIMARY KEY using index "job_numbers_pkey";

alter table "public"."jobs" add constraint "jobs_pkey" PRIMARY KEY using index "jobs_pkey";

alter table "public"."jobs_deleted" add constraint "jobs_deleted_pkey" PRIMARY KEY using index "jobs_deleted_pkey";

alter table "public"."jobs_l" add constraint "jobs_l_pkey" PRIMARY KEY using index "jobs_l_pkey";

alter table "public"."kg_edges" add constraint "kg_edges_pkey" PRIMARY KEY using index "kg_edges_pkey";

alter table "public"."kg_nodes" add constraint "kg_nodes_pkey" PRIMARY KEY using index "kg_nodes_pkey";

alter table "public"."kit_variants" add constraint "kit_variants_pkey" PRIMARY KEY using index "kit_variants_pkey";

alter table "public"."mpt_phases" add constraint "mpt_phases_pkey" PRIMARY KEY using index "mpt_phases_pkey";

alter table "public"."mpt_primary_signs" add constraint "mpt_primary_signs_pkey" PRIMARY KEY using index "mpt_primary_signs_pkey";

alter table "public"."mpt_rental_entries" add constraint "mpt_rental_entries_pkey" PRIMARY KEY using index "mpt_rental_entries_pkey";

alter table "public"."mpt_secondary_signs" add constraint "mpt_secondary_signs_pkey" PRIMARY KEY using index "mpt_secondary_signs_pkey";

alter table "public"."mpt_static_equipment_info" add constraint "mpt_static_equipment_info_pkey" PRIMARY KEY using index "mpt_static_equipment_info_pkey";

alter table "public"."mutcd_signs" add constraint "mutcd_signs_pkey" PRIMARY KEY using index "mutcd_signs_pkey";

alter table "public"."notes" add constraint "bid_notes_pkey" PRIMARY KEY using index "bid_notes_pkey";

alter table "public"."owners" add constraint "owners_pkey" PRIMARY KEY using index "owners_pkey";

alter table "public"."pata_kit_contents" add constraint "pata_kit_contents_pkey" PRIMARY KEY using index "pata_kit_contents_pkey";

alter table "public"."pata_kits" add constraint "pata_kits_pkey" PRIMARY KEY using index "pata_kits_pkey";

alter table "public"."permanent_sign_items" add constraint "permanent_sign_items_pkey" PRIMARY KEY using index "permanent_sign_items_pkey";

alter table "public"."permanent_signs" add constraint "permanent_signs_pkey" PRIMARY KEY using index "permanent_signs_pkey";

alter table "public"."permanent_signs_entries" add constraint "permanent_signs_entries_pkey" PRIMARY KEY using index "permanent_signs_entries_pkey";

alter table "public"."pickup_takeoff_items_l" add constraint "pickup_takeoff_items_l_pkey" PRIMARY KEY using index "pickup_takeoff_items_l_pkey";

alter table "public"."pickup_takeoffs_l" add constraint "pickup_takeoffs_l_pkey" PRIMARY KEY using index "pickup_takeoffs_l_pkey";

alter table "public"."pickup_work_orders_l" add constraint "pickup_work_orders_l_pkey" PRIMARY KEY using index "pickup_work_orders_l_pkey";

alter table "public"."productivity_rates" add constraint "productivity_rates_pkey" PRIMARY KEY using index "productivity_rates_pkey";

alter table "public"."project_managers" add constraint "project_managers_pkey" PRIMARY KEY using index "project_managers_pkey";

alter table "public"."project_metadata" add constraint "project_metadata_pkey" PRIMARY KEY using index "project_metadata_pkey";

alter table "public"."pts_kit_contents" add constraint "pts_kit_contents_pkey" PRIMARY KEY using index "pts_kit_contents_pkey";

alter table "public"."pts_kits" add constraint "pts_kits_pkey" PRIMARY KEY using index "pts_kits_pkey";

alter table "public"."quote_items" add constraint "quote_items_pkey" PRIMARY KEY using index "quote_items_pkey";

alter table "public"."quote_recipients" add constraint "quote_recipients_pkey" PRIMARY KEY using index "quote_recipients_pkey";

alter table "public"."quote_sequential_numbers" add constraint "quote_sequential_numbers_pkey" PRIMARY KEY using index "quote_sequential_numbers_pkey";

alter table "public"."quotes" add constraint "quotes_pkey" PRIMARY KEY using index "quotes_pkey";

alter table "public"."quotes_customers" add constraint "quotes_customers_pkey" PRIMARY KEY using index "quotes_customers_pkey";

alter table "public"."rental_items" add constraint "rental_items_pkey" PRIMARY KEY using index "rental_items_pkey";

alter table "public"."sale_item_entries" add constraint "sale_item_entries_pkey" PRIMARY KEY using index "sale_item_entries_pkey";

alter table "public"."sale_items" add constraint "sale_items_pkey" PRIMARY KEY using index "sale_items_pkey";

alter table "public"."service_work_entries" add constraint "service_work_entries_pkey" PRIMARY KEY using index "service_work_entries_pkey";

alter table "public"."sign_designations" add constraint "sign_designations_pkey" PRIMARY KEY using index "sign_designations_pkey";

alter table "public"."sign_dimension_options" add constraint "sign_dimension_options_pkey" PRIMARY KEY using index "sign_dimension_options_pkey";

alter table "public"."sign_dimensions" add constraint "sign_dimensions_pkey" PRIMARY KEY using index "sign_dimensions_pkey";

alter table "public"."sign_dimensions_2" add constraint "sign_dimensions_2_pkey" PRIMARY KEY using index "sign_dimensions_2_pkey";

alter table "public"."sign_orders" add constraint "sign_orders_pkey" PRIMARY KEY using index "sign_orders_pkey";

alter table "public"."sign_production" add constraint "sign_production_pkey" PRIMARY KEY using index "sign_production_pkey";

alter table "public"."signs_all" add constraint "signs_pkey" PRIMARY KEY using index "signs_pkey";

alter table "public"."sov_entries" add constraint "sov_entries_pkey" PRIMARY KEY using index "sov_entries_pkey";

alter table "public"."sov_items" add constraint "sov_items_pkey" PRIMARY KEY using index "sov_items_pkey";

alter table "public"."sov_items_l" add constraint "sov_items_l_pkey" PRIMARY KEY using index "sov_items_l_pkey";

alter table "public"."subcontractors" add constraint "subcontractors_pkey" PRIMARY KEY using index "subcontractors_pkey";

alter table "public"."takeoff_items_l" add constraint "takeoff_items_l_pkey" PRIMARY KEY using index "takeoff_items_l_pkey";

alter table "public"."takeoffs_l" add constraint "takeoffs_l_pkey" PRIMARY KEY using index "takeoffs_l_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."won_bid_items" add constraint "won_bid_items_pkey" PRIMARY KEY using index "won_bid_items_pkey";

alter table "public"."work_order_items_l" add constraint "work_order_items_l_pkey" PRIMARY KEY using index "work_order_items_l_pkey";

alter table "public"."work_orders_l" add constraint "work_orders_l_pkey" PRIMARY KEY using index "work_orders_l_pkey";

alter table "public"."admin_data_entries" add constraint "admin_data_entries_bid_estimate_id_fkey" FOREIGN KEY (bid_estimate_id) REFERENCES public.bid_estimates(id) ON DELETE CASCADE not valid;

alter table "public"."admin_data_entries" validate constraint "admin_data_entries_bid_estimate_id_fkey";

alter table "public"."admin_data_entries" add constraint "admin_data_entries_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."admin_data_entries" validate constraint "admin_data_entries_job_id_fkey";

alter table "public"."admin_data_entries" add constraint "admin_data_entries_job_id_unique" UNIQUE using index "admin_data_entries_job_id_unique";

alter table "public"."admin_data_entries" add constraint "check_single_parent" CHECK ((((bid_estimate_id IS NOT NULL) AND (job_id IS NULL)) OR ((bid_estimate_id IS NULL) AND (job_id IS NOT NULL)))) not valid;

alter table "public"."admin_data_entries" validate constraint "check_single_parent";

alter table "public"."admin_data_entries" add constraint "unique_admin_data_bid_estimate_id" UNIQUE using index "unique_admin_data_bid_estimate_id";

alter table "public"."archived_available_jobs" add constraint "archived_available_jobs_dbe_percentage_check" CHECK (((dbe_percentage >= (0)::numeric) AND (dbe_percentage <= (100)::numeric))) not valid;

alter table "public"."archived_available_jobs" validate constraint "archived_available_jobs_dbe_percentage_check";

alter table "public"."associated_items" add constraint "associated_items_quote_item_id_fkey" FOREIGN KEY (quote_item_id) REFERENCES public.quote_items(id) ON DELETE CASCADE not valid;

alter table "public"."associated_items" validate constraint "associated_items_quote_item_id_fkey";

alter table "public"."available_jobs" add constraint "available_jobs_dbe_percentage_check" CHECK (((dbe_percentage >= (0)::numeric) AND (dbe_percentage <= (100)::numeric))) not valid;

alter table "public"."available_jobs" validate constraint "available_jobs_dbe_percentage_check";

alter table "public"."available_jobs" add constraint "due_date_before_letting" CHECK ((due_date <= letting_date)) not valid;

alter table "public"."available_jobs" validate constraint "due_date_before_letting";

alter table "public"."bid_estimates" add constraint "uk_contract_number" UNIQUE using index "uk_contract_number";

alter table "public"."bid_estimates_deleted" add constraint "bid_estimates_deleted_contract_number_key" UNIQUE using index "bid_estimates_deleted_contract_number_key";

alter table "public"."change_orders" add constraint "change_orders_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs_l(id) ON DELETE CASCADE not valid;

alter table "public"."change_orders" validate constraint "change_orders_job_id_fkey";

alter table "public"."counties" add constraint "fk_branch" FOREIGN KEY (branch) REFERENCES public.branches(id) not valid;

alter table "public"."counties" validate constraint "fk_branch";

alter table "public"."custom_dimensions" add constraint "custom_dimensions_dimension_label_key" UNIQUE using index "custom_dimensions_dimension_label_key";

alter table "public"."custom_sov_items" add constraint "custom_sov_items_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs_l(id) ON DELETE CASCADE not valid;

alter table "public"."custom_sov_items" validate constraint "custom_sov_items_job_id_fkey";

alter table "public"."custom_sov_items" add constraint "custom_sov_items_job_id_item_number_key" UNIQUE using index "custom_sov_items_job_id_item_number_key";

alter table "public"."customer_contacts" add constraint "customer_contacts_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE CASCADE not valid;

alter table "public"."customer_contacts" validate constraint "customer_contacts_contractor_id_fkey";

alter table "public"."documents_l" add constraint "documents_file_path_key" UNIQUE using index "documents_file_path_key";

alter table "public"."documents_l" add constraint "documents_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs_l(id) ON DELETE CASCADE not valid;

alter table "public"."documents_l" validate constraint "documents_job_id_fkey";

alter table "public"."documents_l" add constraint "documents_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) not valid;

alter table "public"."documents_l" validate constraint "documents_uploaded_by_fkey";

alter table "public"."equipment_rental_entries" add constraint "check_single_parent" CHECK ((((bid_estimate_id IS NOT NULL) AND (job_id IS NULL)) OR ((bid_estimate_id IS NULL) AND (job_id IS NOT NULL)))) not valid;

alter table "public"."equipment_rental_entries" validate constraint "check_single_parent";

alter table "public"."equipment_rental_entries" add constraint "equipment_rental_entries_bid_estimate_id_fkey" FOREIGN KEY (bid_estimate_id) REFERENCES public.bid_estimates(id) ON DELETE CASCADE not valid;

alter table "public"."equipment_rental_entries" validate constraint "equipment_rental_entries_bid_estimate_id_fkey";

alter table "public"."equipment_rental_entries" add constraint "equipment_rental_entries_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."equipment_rental_entries" validate constraint "equipment_rental_entries_job_id_fkey";

alter table "public"."files" add constraint "files_bid_estimate_id_fkey" FOREIGN KEY (bid_estimate_id) REFERENCES public.bid_estimates(id) not valid;

alter table "public"."files" validate constraint "files_bid_estimate_id_fkey";

alter table "public"."files" add constraint "files_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."files" validate constraint "files_job_id_fkey";

alter table "public"."files" add constraint "files_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL not valid;

alter table "public"."files" validate constraint "files_quote_id_fkey";

alter table "public"."files" add constraint "files_sign_order_id_fkey" FOREIGN KEY (sign_order_id) REFERENCES public.sign_orders(id) not valid;

alter table "public"."files" validate constraint "files_sign_order_id_fkey";

alter table "public"."flagging_entries" add constraint "check_single_parent" CHECK ((((bid_estimate_id IS NOT NULL) AND (job_id IS NULL)) OR ((bid_estimate_id IS NULL) AND (job_id IS NOT NULL)))) not valid;

alter table "public"."flagging_entries" validate constraint "check_single_parent";

alter table "public"."flagging_entries" add constraint "flagging_entries_bid_estimate_id_fkey" FOREIGN KEY (bid_estimate_id) REFERENCES public.bid_estimates(id) ON DELETE CASCADE not valid;

alter table "public"."flagging_entries" validate constraint "flagging_entries_bid_estimate_id_fkey";

alter table "public"."flagging_entries" add constraint "flagging_entries_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."flagging_entries" validate constraint "flagging_entries_job_id_fkey";

alter table "public"."flagging_entries" add constraint "unique_flagging_bid_estimate_id" UNIQUE using index "unique_flagging_bid_estimate_id";

alter table "public"."job_numbers" add constraint "job_numbers_branch_code_owner_type_year_sequential_number_key" UNIQUE using index "job_numbers_branch_code_owner_type_year_sequential_number_key";

alter table "public"."job_numbers" add constraint "job_numbers_job_number_key" UNIQUE using index "job_numbers_job_number_key";

alter table "public"."jobs" add constraint "jobs_estimate_id_fkey" FOREIGN KEY (estimate_id) REFERENCES public.bid_estimates(id) not valid;

alter table "public"."jobs" validate constraint "jobs_estimate_id_fkey";

alter table "public"."jobs" add constraint "jobs_job_number_id_fkey" FOREIGN KEY (job_number_id) REFERENCES public.job_numbers(id) not valid;

alter table "public"."jobs" validate constraint "jobs_job_number_id_fkey";

alter table "public"."kg_edges" add constraint "kg_edges_source_id_fkey" FOREIGN KEY (source_id) REFERENCES public.kg_nodes(id) ON DELETE CASCADE not valid;

alter table "public"."kg_edges" validate constraint "kg_edges_source_id_fkey";

alter table "public"."kg_edges" add constraint "kg_edges_target_id_fkey" FOREIGN KEY (target_id) REFERENCES public.kg_nodes(id) ON DELETE CASCADE not valid;

alter table "public"."kg_edges" validate constraint "kg_edges_target_id_fkey";

alter table "public"."kg_nodes" add constraint "kg_nodes_type_label_key" UNIQUE using index "kg_nodes_type_label_key";

alter table "public"."kit_variants" add constraint "kit_variants_kit_id_variant_label_key" UNIQUE using index "kit_variants_kit_id_variant_label_key";

alter table "public"."mpt_phases" add constraint "mpt_phases_mpt_rental_entry_id_fkey" FOREIGN KEY (mpt_rental_entry_id) REFERENCES public.mpt_rental_entries(id) ON DELETE CASCADE not valid;

alter table "public"."mpt_phases" validate constraint "mpt_phases_mpt_rental_entry_id_fkey";

alter table "public"."mpt_phases" add constraint "mpt_phases_mpt_rental_entry_id_phase_index_key" UNIQUE using index "mpt_phases_mpt_rental_entry_id_phase_index_key";

alter table "public"."mpt_primary_signs" add constraint "mpt_primary_signs_phase_id_fkey" FOREIGN KEY (phase_id) REFERENCES public.mpt_phases(id) ON DELETE CASCADE not valid;

alter table "public"."mpt_primary_signs" validate constraint "mpt_primary_signs_phase_id_fkey";

alter table "public"."mpt_primary_signs" add constraint "mpt_primary_signs_phase_id_sign_id_key" UNIQUE using index "mpt_primary_signs_phase_id_sign_id_key";

alter table "public"."mpt_rental_entries" add constraint "check_single_parent" CHECK ((((bid_estimate_id IS NOT NULL) AND (job_id IS NULL)) OR ((bid_estimate_id IS NULL) AND (job_id IS NOT NULL)))) not valid;

alter table "public"."mpt_rental_entries" validate constraint "check_single_parent";

alter table "public"."mpt_rental_entries" add constraint "mpt_rental_entries_bid_estimate_id_fkey" FOREIGN KEY (bid_estimate_id) REFERENCES public.bid_estimates(id) ON DELETE CASCADE not valid;

alter table "public"."mpt_rental_entries" validate constraint "mpt_rental_entries_bid_estimate_id_fkey";

alter table "public"."mpt_rental_entries" add constraint "mpt_rental_entries_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."mpt_rental_entries" validate constraint "mpt_rental_entries_job_id_fkey";

alter table "public"."mpt_rental_entries" add constraint "unique_mpt_rental_bid_estimate_id" UNIQUE using index "unique_mpt_rental_bid_estimate_id";

alter table "public"."mpt_secondary_signs" add constraint "mpt_secondary_signs_phase_id_fkey" FOREIGN KEY (phase_id) REFERENCES public.mpt_phases(id) ON DELETE CASCADE not valid;

alter table "public"."mpt_secondary_signs" validate constraint "mpt_secondary_signs_phase_id_fkey";

alter table "public"."mpt_secondary_signs" add constraint "mpt_secondary_signs_phase_id_sign_id_key" UNIQUE using index "mpt_secondary_signs_phase_id_sign_id_key";

alter table "public"."mpt_static_equipment_info" add constraint "mpt_static_equipment_info_mpt_rental_entry_id_equipment_typ_key" UNIQUE using index "mpt_static_equipment_info_mpt_rental_entry_id_equipment_typ_key";

alter table "public"."mpt_static_equipment_info" add constraint "mpt_static_equipment_info_mpt_rental_entry_id_fkey" FOREIGN KEY (mpt_rental_entry_id) REFERENCES public.mpt_rental_entries(id) ON DELETE CASCADE not valid;

alter table "public"."mpt_static_equipment_info" validate constraint "mpt_static_equipment_info_mpt_rental_entry_id_fkey";

alter table "public"."notes" add constraint "bid_notes_bid_id_fkey" FOREIGN KEY (bid_id) REFERENCES public.bid_estimates(id) ON DELETE CASCADE not valid;

alter table "public"."notes" validate constraint "bid_notes_bid_id_fkey";

alter table "public"."notes" add constraint "notes_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."notes" validate constraint "notes_quote_id_fkey";

alter table "public"."notes" add constraint "notes_sign_id_fkey" FOREIGN KEY (sign_id) REFERENCES public.sign_orders(id) not valid;

alter table "public"."notes" validate constraint "notes_sign_id_fkey";

alter table "public"."pata_kit_contents" add constraint "pata_kit_contents_pata_kit_code_sign_designation_key" UNIQUE using index "pata_kit_contents_pata_kit_code_sign_designation_key";

alter table "public"."permanent_signs" add constraint "permanent_signs_permanent_signs_entry_id_fkey" FOREIGN KEY (permanent_signs_entry_id) REFERENCES public.permanent_signs_entries(id) ON DELETE CASCADE not valid;

alter table "public"."permanent_signs" validate constraint "permanent_signs_permanent_signs_entry_id_fkey";

alter table "public"."permanent_signs" add constraint "valid_item_type" CHECK (((item_type)::text = ANY (ARRAY[('pmsTypeB'::character varying)::text, ('pmsTypeF'::character varying)::text, ('resetTypeB'::character varying)::text, ('resetTypeF'::character varying)::text, ('removeTypeB'::character varying)::text, ('removeTypeF'::character varying)::text, ('pmsTypeC'::character varying)::text, ('flexibleDelineator'::character varying)::text]))) not valid;

alter table "public"."permanent_signs" validate constraint "valid_item_type";

alter table "public"."permanent_signs" add constraint "valid_type_field" CHECK (((type = ANY (ARRAY['B'::bpchar, 'F'::bpchar])) OR (type IS NULL))) not valid;

alter table "public"."permanent_signs" validate constraint "valid_type_field";

alter table "public"."permanent_signs_entries" add constraint "permanent_signs_entries_bid_estimate_id_fkey" FOREIGN KEY (bid_estimate_id) REFERENCES public.bid_estimates(id) ON DELETE CASCADE not valid;

alter table "public"."permanent_signs_entries" validate constraint "permanent_signs_entries_bid_estimate_id_fkey";

alter table "public"."permanent_signs_entries" add constraint "permanent_signs_entries_bid_estimate_id_key" UNIQUE using index "permanent_signs_entries_bid_estimate_id_key";

alter table "public"."pickup_takeoff_items_l" add constraint "pickup_takeoff_items_l_pickup_takeoff_id_fkey" FOREIGN KEY (pickup_takeoff_id) REFERENCES public.pickup_takeoffs_l(id) not valid;

alter table "public"."pickup_takeoff_items_l" validate constraint "pickup_takeoff_items_l_pickup_takeoff_id_fkey";

alter table "public"."pickup_takeoffs_l" add constraint "pickup_takeoffs_l_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs_l(id) ON DELETE CASCADE not valid;

alter table "public"."pickup_takeoffs_l" validate constraint "pickup_takeoffs_l_job_id_fkey";

alter table "public"."pickup_work_orders_l" add constraint "pickup_work_orders_l_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs_l(id) ON DELETE CASCADE not valid;

alter table "public"."pickup_work_orders_l" validate constraint "pickup_work_orders_l_job_id_fkey";

alter table "public"."pickup_work_orders_l" add constraint "pickup_work_orders_l_pickup_takeoff_id_fkey" FOREIGN KEY (pickup_takeoff_id) REFERENCES public.pickup_takeoffs_l(id) not valid;

alter table "public"."pickup_work_orders_l" validate constraint "pickup_work_orders_l_pickup_takeoff_id_fkey";

alter table "public"."project_managers" add constraint "project_managers_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id) not valid;

alter table "public"."project_managers" validate constraint "project_managers_branch_id_fkey";

alter table "public"."project_metadata" add constraint "check_single_parent" CHECK ((((bid_estimate_id IS NOT NULL) AND (job_id IS NULL)) OR ((bid_estimate_id IS NULL) AND (job_id IS NOT NULL)))) not valid;

alter table "public"."project_metadata" validate constraint "check_single_parent";

alter table "public"."project_metadata" add constraint "project_metadata_bid_estimate_id_fkey" FOREIGN KEY (bid_estimate_id) REFERENCES public.bid_estimates(id) ON DELETE CASCADE not valid;

alter table "public"."project_metadata" validate constraint "project_metadata_bid_estimate_id_fkey";

alter table "public"."project_metadata" add constraint "project_metadata_bid_estimate_id_unique" UNIQUE using index "project_metadata_bid_estimate_id_unique";

alter table "public"."project_metadata" add constraint "project_metadata_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) not valid;

alter table "public"."project_metadata" validate constraint "project_metadata_contractor_id_fkey";

alter table "public"."project_metadata" add constraint "project_metadata_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."project_metadata" validate constraint "project_metadata_job_id_fkey";

alter table "public"."project_metadata" add constraint "project_metadata_job_id_unique" UNIQUE using index "project_metadata_job_id_unique";

alter table "public"."project_metadata" add constraint "project_metadata_subcontractor_id_fkey" FOREIGN KEY (subcontractor_id) REFERENCES public.subcontractors(id) not valid;

alter table "public"."project_metadata" validate constraint "project_metadata_subcontractor_id_fkey";

alter table "public"."pts_kit_contents" add constraint "pts_kit_contents_pts_kit_code_sign_designation_key" UNIQUE using index "pts_kit_contents_pts_kit_code_sign_designation_key";

alter table "public"."pts_kits" add constraint "pts_kits_code_key" UNIQUE using index "pts_kits_code_key";

alter table "public"."quote_items" add constraint "quote_items_discount_type_check" CHECK (((discount_type)::text = ANY (ARRAY[('dollar'::character varying)::text, ('percentage'::character varying)::text]))) not valid;

alter table "public"."quote_items" validate constraint "quote_items_discount_type_check";

alter table "public"."quote_items" add constraint "quote_items_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE not valid;

alter table "public"."quote_items" validate constraint "quote_items_quote_id_fkey";

alter table "public"."quote_recipients" add constraint "quote_recipients_check" CHECK (((customer_contacts_id IS NOT NULL) OR ((email IS NOT NULL) AND ((email)::text <> ''::text)))) not valid;

alter table "public"."quote_recipients" validate constraint "quote_recipients_check";

alter table "public"."quote_recipients" add constraint "quote_recipients_customer_contacts_id_fkey" FOREIGN KEY (customer_contacts_id) REFERENCES public.customer_contacts(id) ON DELETE SET NULL not valid;

alter table "public"."quote_recipients" validate constraint "quote_recipients_customer_contacts_id_fkey";

alter table "public"."quote_recipients" add constraint "quote_recipients_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE not valid;

alter table "public"."quote_recipients" validate constraint "quote_recipients_quote_id_fkey";

alter table "public"."quotes" add constraint "quotes_estimate_id_fkey" FOREIGN KEY (estimate_id) REFERENCES public.bid_estimates(id) not valid;

alter table "public"."quotes" validate constraint "quotes_estimate_id_fkey";

alter table "public"."quotes" add constraint "quotes_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) not valid;

alter table "public"."quotes" validate constraint "quotes_job_id_fkey";

alter table "public"."quotes" add constraint "quotes_response_token_key" UNIQUE using index "quotes_response_token_key";

alter table "public"."quotes" add constraint "quotes_status_check" CHECK (((status)::text = ANY (ARRAY['Not Sent'::text, 'Sent'::text, 'Accepted'::text, 'DRAFT'::text, 'Declined'::text]))) not valid;

alter table "public"."quotes" validate constraint "quotes_status_check";

alter table "public"."quotes_customers" add constraint "quotes_customers_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE CASCADE not valid;

alter table "public"."quotes_customers" validate constraint "quotes_customers_contractor_id_fkey";

alter table "public"."quotes_customers" add constraint "quotes_customers_quote_id_contractor_id_key" UNIQUE using index "quotes_customers_quote_id_contractor_id_key";

alter table "public"."quotes_customers" add constraint "quotes_customers_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE not valid;

alter table "public"."quotes_customers" validate constraint "quotes_customers_quote_id_fkey";

alter table "public"."sale_item_entries" add constraint "check_single_parent" CHECK ((((bid_estimate_id IS NOT NULL) AND (job_id IS NULL)) OR ((bid_estimate_id IS NULL) AND (job_id IS NOT NULL)))) not valid;

alter table "public"."sale_item_entries" validate constraint "check_single_parent";

alter table "public"."sale_item_entries" add constraint "sale_item_entries_bid_estimate_id_fkey" FOREIGN KEY (bid_estimate_id) REFERENCES public.bid_estimates(id) ON DELETE CASCADE not valid;

alter table "public"."sale_item_entries" validate constraint "sale_item_entries_bid_estimate_id_fkey";

alter table "public"."sale_item_entries" add constraint "sale_item_entries_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."sale_item_entries" validate constraint "sale_item_entries_job_id_fkey";

alter table "public"."service_work_entries" add constraint "check_single_parent" CHECK ((((bid_estimate_id IS NOT NULL) AND (job_id IS NULL)) OR ((bid_estimate_id IS NULL) AND (job_id IS NOT NULL)))) not valid;

alter table "public"."service_work_entries" validate constraint "check_single_parent";

alter table "public"."service_work_entries" add constraint "service_work_entries_bid_estimate_id_fkey" FOREIGN KEY (bid_estimate_id) REFERENCES public.bid_estimates(id) ON DELETE CASCADE not valid;

alter table "public"."service_work_entries" validate constraint "service_work_entries_bid_estimate_id_fkey";

alter table "public"."service_work_entries" add constraint "service_work_entries_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."service_work_entries" validate constraint "service_work_entries_job_id_fkey";

alter table "public"."service_work_entries" add constraint "unique_service_work_bid_estimate_id" UNIQUE using index "unique_service_work_bid_estimate_id";

alter table "public"."sign_dimension_options" add constraint "sign_dimension_options_dimension_id_fkey" FOREIGN KEY (dimension_id) REFERENCES public.sign_dimensions(id) not valid;

alter table "public"."sign_dimension_options" validate constraint "sign_dimension_options_dimension_id_fkey";

alter table "public"."sign_dimension_options" add constraint "sign_dimension_options_sign_designation_id_fkey" FOREIGN KEY (sign_designation_id) REFERENCES public.sign_designations(id) not valid;

alter table "public"."sign_dimension_options" validate constraint "sign_dimension_options_sign_designation_id_fkey";

alter table "public"."sign_dimensions" add constraint "sign_dimensions_width_height_key" UNIQUE using index "sign_dimensions_width_height_key";

alter table "public"."sign_dimensions_2" add constraint "sign_dimensions_2_dimension_label_key" UNIQUE using index "sign_dimensions_2_dimension_label_key";

alter table "public"."sign_orders" add constraint "sign_orders_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.customer_contacts(id) not valid;

alter table "public"."sign_orders" validate constraint "sign_orders_contact_id_fkey";

alter table "public"."sign_orders" add constraint "sign_orders_contractor_id_fkey" FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) not valid;

alter table "public"."sign_orders" validate constraint "sign_orders_contractor_id_fkey";

alter table "public"."sign_production" add constraint "sign_production_type_check" CHECK ((type = ANY (ARRAY['sale'::text, 'mpt'::text]))) not valid;

alter table "public"."sign_production" validate constraint "sign_production_type_check";

alter table "public"."signs_all" add constraint "signs_designation_key" UNIQUE using index "signs_designation_key";

alter table "public"."sov_entries" add constraint "sov_entries_custom_sov_item_id_fkey" FOREIGN KEY (custom_sov_item_id) REFERENCES public.custom_sov_items(id) ON DELETE CASCADE not valid;

alter table "public"."sov_entries" validate constraint "sov_entries_custom_sov_item_id_fkey";

alter table "public"."sov_entries" add constraint "sov_entries_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs_l(id) ON DELETE CASCADE not valid;

alter table "public"."sov_entries" validate constraint "sov_entries_job_id_fkey";

alter table "public"."sov_entries" add constraint "sov_entries_job_id_sov_item_id_key" UNIQUE using index "sov_entries_job_id_sov_item_id_key";

alter table "public"."sov_entries" add constraint "sov_entries_single_master_reference_check" CHECK ((num_nonnulls(sov_item_id, custom_sov_item_id) = 1)) not valid;

alter table "public"."sov_entries" validate constraint "sov_entries_single_master_reference_check";

alter table "public"."sov_items_l" add constraint "sov_items_l_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs_l(id) ON DELETE CASCADE not valid;

alter table "public"."sov_items_l" validate constraint "sov_items_l_job_id_fkey";

alter table "public"."sov_items_l" add constraint "sov_items_l_retainage_type_check" CHECK (((retainage_type = ANY (ARRAY['percent'::text, 'fixed'::text, 'none'::text])) OR (retainage_type IS NULL))) not valid;

alter table "public"."sov_items_l" validate constraint "sov_items_l_retainage_type_check";

alter table "public"."subcontractors" add constraint "subcontractors_name_key" UNIQUE using index "subcontractors_name_key";

alter table "public"."takeoff_items_l" add constraint "takeoff_items_l_in_stock_qty_check" CHECK ((in_stock_qty >= (0)::numeric)) not valid;

alter table "public"."takeoff_items_l" validate constraint "takeoff_items_l_in_stock_qty_check";

alter table "public"."takeoff_items_l" add constraint "takeoff_items_l_inventory_status_check" CHECK ((inventory_status = ANY (ARRAY['pending_review'::text, 'in_stock'::text, 'low_stock'::text, 'out_of_stock'::text, 'ordered'::text, 'backordered'::text, 'canceled'::text]))) not valid;

alter table "public"."takeoff_items_l" validate constraint "takeoff_items_l_inventory_status_check";

alter table "public"."takeoff_items_l" add constraint "takeoff_items_l_load_order_check" CHECK (((load_order IS NULL) OR (load_order >= 1))) not valid;

alter table "public"."takeoff_items_l" validate constraint "takeoff_items_l_load_order_check";

alter table "public"."takeoff_items_l" add constraint "takeoff_items_l_quantity_check" CHECK ((quantity >= (0)::numeric)) not valid;

alter table "public"."takeoff_items_l" validate constraint "takeoff_items_l_quantity_check";

alter table "public"."takeoff_items_l" add constraint "takeoff_items_l_requisition_type_check" CHECK ((requisition_type = ANY (ARRAY['none'::text, 'requisition'::text, 'purchase_order'::text, 'stock'::text, 'other'::text]))) not valid;

alter table "public"."takeoff_items_l" validate constraint "takeoff_items_l_requisition_type_check";

alter table "public"."takeoff_items_l" add constraint "takeoff_items_l_to_order_qty_check" CHECK ((to_order_qty >= (0)::numeric)) not valid;

alter table "public"."takeoff_items_l" validate constraint "takeoff_items_l_to_order_qty_check";

alter table "public"."takeoffs_l" add constraint "fk_takeoff_job" FOREIGN KEY (job_id) REFERENCES public.jobs_l(id) ON DELETE CASCADE not valid;

alter table "public"."takeoffs_l" validate constraint "fk_takeoff_job";

alter table "public"."takeoffs_l" add constraint "fk_takeoff_revision" FOREIGN KEY (revision_of_takeoff_id) REFERENCES public.takeoffs_l(id) ON DELETE SET NULL not valid;

alter table "public"."takeoffs_l" validate constraint "fk_takeoff_revision";

alter table "public"."takeoffs_l" add constraint "fk_takeoff_root" FOREIGN KEY (chain_root_takeoff_id) REFERENCES public.takeoffs_l(id) ON DELETE SET NULL not valid;

alter table "public"."takeoffs_l" validate constraint "fk_takeoff_root";

alter table "public"."takeoffs_l" add constraint "takeoffs_l_contracted_or_additional_check" CHECK ((contracted_or_additional = ANY (ARRAY['contracted'::text, 'additional'::text, 'extra'::text]))) not valid;

alter table "public"."takeoffs_l" validate constraint "takeoffs_l_contracted_or_additional_check";

alter table "public"."takeoffs_l" add constraint "takeoffs_l_destination_check" CHECK ((destination = ANY (ARRAY['build_shop'::text, 'field'::text, 'customer'::text, 'other'::text]))) not valid;

alter table "public"."takeoffs_l" validate constraint "takeoffs_l_destination_check";

alter table "public"."takeoffs_l" add constraint "takeoffs_l_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs_l(id) ON DELETE CASCADE not valid;

alter table "public"."takeoffs_l" validate constraint "takeoffs_l_job_id_fkey";

alter table "public"."takeoffs_l" add constraint "takeoffs_l_no_self_parent_check" CHECK (((parent_takeoff_id IS NULL) OR (parent_takeoff_id <> id))) not valid;

alter table "public"."takeoffs_l" validate constraint "takeoffs_l_no_self_parent_check";

alter table "public"."takeoffs_l" add constraint "takeoffs_l_parent_takeoff_id_fkey" FOREIGN KEY (parent_takeoff_id) REFERENCES public.takeoffs_l(id) ON DELETE SET NULL not valid;

alter table "public"."takeoffs_l" validate constraint "takeoffs_l_parent_takeoff_id_fkey";

alter table "public"."takeoffs_l" add constraint "takeoffs_l_priority_check" CHECK ((priority = ANY (ARRAY['standard'::text, 'high'::text, 'urgent'::text, 'low'::text]))) not valid;

alter table "public"."takeoffs_l" validate constraint "takeoffs_l_priority_check";

alter table "public"."takeoffs_l" add constraint "takeoffs_l_revision_number_check" CHECK ((revision_number >= 1)) not valid;

alter table "public"."takeoffs_l" validate constraint "takeoffs_l_revision_number_check";

alter table "public"."takeoffs_l" add constraint "takeoffs_l_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'in_progress'::text, 'complete'::text, 'canceled'::text, 'rejected'::text]))) not valid;

alter table "public"."takeoffs_l" validate constraint "takeoffs_l_status_check";

alter table "public"."takeoffs_l" add constraint "takeoffs_l_work_type_check" CHECK ((work_type = ANY (ARRAY['MPT'::text, 'PERMANENT_SIGNS'::text, 'FLAGGING'::text, 'LANE_CLOSURE'::text, 'SERVICE'::text, 'DELIVERY'::text, 'RENTAL'::text]))) not valid;

alter table "public"."takeoffs_l" validate constraint "takeoffs_l_work_type_check";

alter table "public"."users" add constraint "users_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id) not valid;

alter table "public"."users" validate constraint "users_branch_id_fkey";

alter table "public"."won_bid_items" add constraint "won_bid_items_bid_item_id_fkey" FOREIGN KEY (bid_item_id) REFERENCES public.bid_item_numbers(id) not valid;

alter table "public"."won_bid_items" validate constraint "won_bid_items_bid_item_id_fkey";

alter table "public"."won_bid_items" add constraint "won_bid_items_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."won_bid_items" validate constraint "won_bid_items_job_id_fkey";

alter table "public"."work_order_items_l" add constraint "work_order_items_l_contract_quantity_check" CHECK ((contract_quantity >= (0)::numeric)) not valid;

alter table "public"."work_order_items_l" validate constraint "work_order_items_l_contract_quantity_check";

alter table "public"."work_order_items_l" add constraint "work_order_items_l_sort_order_check" CHECK ((sort_order >= 0)) not valid;

alter table "public"."work_order_items_l" validate constraint "work_order_items_l_sort_order_check";

alter table "public"."work_order_items_l" add constraint "work_order_items_l_work_order_id_fkey" FOREIGN KEY (work_order_id) REFERENCES public.work_orders_l(id) ON DELETE CASCADE not valid;

alter table "public"."work_order_items_l" validate constraint "work_order_items_l_work_order_id_fkey";

alter table "public"."work_order_items_l" add constraint "work_order_items_l_work_order_quantity_check" CHECK ((work_order_quantity >= (0)::numeric)) not valid;

alter table "public"."work_order_items_l" validate constraint "work_order_items_l_work_order_quantity_check";

alter table "public"."work_orders_l" add constraint "work_orders_l_branch_check" CHECK ((branch = ANY (ARRAY['Hatfield'::text, 'Turbotville'::text, 'West'::text, 'Other'::text]))) not valid;

alter table "public"."work_orders_l" validate constraint "work_orders_l_branch_check";

alter table "public"."work_orders_l" add constraint "work_orders_l_contracted_or_additional_check" CHECK ((contracted_or_additional = ANY (ARRAY['contracted'::text, 'additional'::text, 'extra'::text]))) not valid;

alter table "public"."work_orders_l" validate constraint "work_orders_l_contracted_or_additional_check";

alter table "public"."work_orders_l" add constraint "work_orders_l_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs_l(id) ON DELETE CASCADE not valid;

alter table "public"."work_orders_l" validate constraint "work_orders_l_job_id_fkey";

alter table "public"."work_orders_l" add constraint "work_orders_l_no_self_parent_check" CHECK (((parent_work_order_id IS NULL) OR (parent_work_order_id <> id))) not valid;

alter table "public"."work_orders_l" validate constraint "work_orders_l_no_self_parent_check";

alter table "public"."work_orders_l" add constraint "work_orders_l_parent_work_order_id_fkey" FOREIGN KEY (parent_work_order_id) REFERENCES public.work_orders_l(id) ON DELETE SET NULL not valid;

alter table "public"."work_orders_l" validate constraint "work_orders_l_parent_work_order_id_fkey";

alter table "public"."work_orders_l" add constraint "work_orders_l_percent_complete_check" CHECK (((percent_complete >= (0)::numeric) AND (percent_complete <= (100)::numeric))) not valid;

alter table "public"."work_orders_l" validate constraint "work_orders_l_percent_complete_check";

alter table "public"."work_orders_l" add constraint "work_orders_l_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'in_progress'::text, 'on_hold'::text, 'complete'::text, 'canceled'::text, 'rejected'::text]))) not valid;

alter table "public"."work_orders_l" validate constraint "work_orders_l_status_check";

alter table "public"."work_orders_l" add constraint "work_orders_l_takeoff_wo_number_key" UNIQUE using index "work_orders_l_takeoff_wo_number_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_generate_job_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only generate if job_number is NULL or empty
  IF NEW.job_number IS NULL OR NEW.job_number = '' THEN
    NEW.job_number := NEW.branch_code || '-' || NEW.owner_type || '-' || 
                      NEW.year::text || '-' || LPAD(NEW.sequential_number::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_bid_and_relations(p_bid_id integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$declare
  v_contract_number text;
  v_relations jsonb;
begin
  -- Obtener el contract_number antes de borrar el bid_estimate
  select contract_number
  into v_contract_number
  from available_jobs
  where id = p_bid_id;

  -- Construir JSON de todas las relaciones
  v_relations := jsonb_build_object(
    'equipment_rental_entries', (select jsonb_agg(e.*) from equipment_rental_entries e where e.bid_estimate_id = p_bid_id),
    'files', (select jsonb_agg(f.*) from files f where f.bid_estimate_id = p_bid_id),
    'flagging_entries', (select jsonb_agg(fg.*) from flagging_entries fg where fg.bid_estimate_id = p_bid_id),
    'mpt_rental_entries', (select jsonb_agg(m.*) from mpt_rental_entries m where m.bid_estimate_id = p_bid_id),
    'permanent_signs_entries', (select jsonb_agg(p.*) from permanent_signs_entries p where p.bid_estimate_id = p_bid_id),
    'project_metadata', (select jsonb_agg(pm.*) from project_metadata pm where pm.bid_estimate_id = p_bid_id),
    'sale_items', (select jsonb_agg(s.*) from sale_items s where s.bid_estimate_id = p_bid_id),
    'service_work_entries', (select jsonb_agg(sw.*) from service_work_entries sw where sw.bid_estimate_id = p_bid_id),
    'notes', (select jsonb_agg(n.*) from notes n where n.bid_id = p_bid_id),
'admin_data_entries', (
  select jsonb_agg(a.*)
  from admin_data_entries a
  where a.bid_estimate_id = p_bid_id
     or a.job_id in (
       select j.id
       from jobs j
       where j.estimate_id = p_bid_id
     )
)
  );

  -- Insertar bid_estimate en bid_estimates_deleted con todas sus relaciones
  insert into bid_estimates_deleted
  select *, v_relations as relations
  from bid_estimates
  where id = p_bid_id;

  -- Borrar relaciones
  delete from equipment_rental_entries where bid_estimate_id = p_bid_id;
  delete from files where bid_estimate_id = p_bid_id;
  delete from flagging_entries where bid_estimate_id = p_bid_id;
  delete from mpt_rental_entries where bid_estimate_id = p_bid_id;
  delete from permanent_signs_entries where bid_estimate_id = p_bid_id;
  delete from project_metadata where bid_estimate_id = p_bid_id;
  delete from sale_items where bid_estimate_id = p_bid_id;
  delete from service_work_entries where bid_estimate_id = p_bid_id;
  delete from notes where bid_id = p_bid_id;
delete from jobs where estimate_id = p_bid_id;

  -- Borrar bid_estimate
  delete from bid_estimates where id = p_bid_id;
end;$function$
;

CREATE OR REPLACE FUNCTION public.delete_estimate_complete(p_estimate_id integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$declare
  v_relations jsonb;
begin
  v_relations := jsonb_build_object(
    'permanent_signs', (select jsonb_agg(p.*) from permanent_signs p where p.permanent_signs_entry_id = p_estimate_id),
    'sale_items', (select jsonb_agg(s.*) from sale_items s where s.bid_estimate_id = p_estimate_id),
    'equipment_rental_entries', (select jsonb_agg(e.*) from equipment_rental_entries e where e.bid_estimate_id = p_estimate_id),
    'service_work_entries', (select jsonb_agg(sw.*) from service_work_entries sw where sw.bid_estimate_id = p_estimate_id),
    'flagging_entries', (select jsonb_agg(f.*) from flagging_entries f where f.bid_estimate_id = p_estimate_id),
    'files', (select jsonb_agg(fl.*) from files fl where fl.bid_estimate_id = p_estimate_id),
    'project_metadata', (select jsonb_agg(pm.*) from project_metadata pm where pm.bid_estimate_id = p_estimate_id),
    'notes', (select jsonb_agg(n.*) from notes n where n.bid_id = p_estimate_id),
    'mpt_rental_entries', (select jsonb_agg(mr.*) from mpt_rental_entries mr where mr.bid_estimate_id = p_estimate_id),
    'mpt_phases', (select jsonb_agg(mp.*) from mpt_phases mp where mp.mpt_rental_entry_id in (
                      select mr.id from mpt_rental_entries mr where mr.bid_estimate_id = p_estimate_id
                   )),
    'admin_data_entries', (
      select jsonb_agg(a.*)
      from admin_data_entries a
      where a.bid_estimate_id = p_estimate_id
         or a.job_id in (
           select j.id
           from jobs j
           where j.estimate_id = p_estimate_id
         )
    )
  );

  -- Insertar en bid_estimates_deleted con todas las relaciones
  insert into bid_estimates_deleted
  select *, v_relations as relations
  from bid_estimates
  where id = p_estimate_id;

  -- Borrar relaciones
  delete from permanent_signs where permanent_signs_entry_id = p_estimate_id;
  delete from sale_items where bid_estimate_id = p_estimate_id;
  delete from equipment_rental_entries where bid_estimate_id = p_estimate_id;
  delete from service_work_entries where bid_estimate_id = p_estimate_id;
  delete from flagging_entries where bid_estimate_id = p_estimate_id;
  delete from files where bid_estimate_id = p_estimate_id;
  delete from project_metadata where bid_estimate_id = p_estimate_id;
  delete from notes where bid_id = p_estimate_id;
  delete from mpt_phases where mpt_rental_entry_id in (select id from mpt_rental_entries where bid_estimate_id = p_estimate_id);
  delete from mpt_rental_entries where bid_estimate_id = p_estimate_id;
  delete from jobs where estimate_id = p_estimate_id;

  -- Borrar el bid_estimate principal
  delete from bid_estimates where id = p_estimate_id;
end;$function$
;

CREATE OR REPLACE FUNCTION public.delete_job_cascade(p_job_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$declare
  v_relations jsonb;
begin
  -- Construir JSON con todas las relaciones
v_relations := jsonb_build_object(
    'equipment_rental_entries', (select jsonb_agg(e.*) from equipment_rental_entries e where e.job_id = p_job_id),
    'files', (select jsonb_agg(f.*) from files f where f.job_id = p_job_id),
    'flagging_entries', (select jsonb_agg(fg.*) from flagging_entries fg where fg.job_id = p_job_id),
    'mpt_rental_entries', (select jsonb_agg(m.*) from mpt_rental_entries m where m.job_id = p_job_id),
    'permanent_signs_entries', (
      select jsonb_agg(p.*) 
      from permanent_signs_entries p 
      where p.bid_estimate_id in (select estimate_id from jobs where id = p_job_id)
    ),
    'project_metadata', (select jsonb_agg(pm.*) from project_metadata pm where pm.job_id = p_job_id),
    'sale_items', (select jsonb_agg(s.*) from sale_items s where s.job_id = p_job_id),
    'service_work_entries', (select jsonb_agg(sw.*) from service_work_entries sw where sw.job_id = p_job_id),
    'won_bid_items', (select jsonb_agg(w.*) from won_bid_items w where w.job_id = p_job_id),
    'quotes', (select jsonb_agg(q.*) from quotes q where q.job_id = p_job_id),
    'admin_data_entries', (
      select jsonb_agg(a.*)
      from admin_data_entries a
      where a.job_id = p_job_id
         or a.bid_estimate_id in (select estimate_id from jobs where id = p_job_id)
    )
);

  -- Insertar en jobs_deleted con todas las relaciones
  insert into jobs_deleted
  select *, v_relations as relations
  from jobs 
  where id = p_job_id or estimate_id in (select estimate_id from jobs where id = p_job_id);

  -- Borrar registros relacionados
  delete from equipment_rental_entries where job_id = p_job_id;
  delete from files where job_id = p_job_id;
  delete from flagging_entries where job_id = p_job_id;
  delete from mpt_rental_entries where job_id = p_job_id;
  delete from permanent_signs_entries where bid_estimate_id in (select estimate_id from jobs where id = p_job_id);
  delete from project_metadata where job_id = p_job_id;
  delete from sale_items where job_id = p_job_id;
  delete from service_work_entries where job_id = p_job_id;
  delete from won_bid_items where job_id = p_job_id;

  -- Borrar también las quotes relacionadas
  delete from quotes where job_id = p_job_id;

  -- Finalmente, borrar de jobs
  delete from jobs where id = p_job_id;
end;$function$
;

CREATE OR REPLACE FUNCTION public.email_exists_in_auth(email_input text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = email_input
  );
$function$
;

create or replace view "public"."estimate_complete" as  WITH phase_aggregations AS (
         SELECT mpt_phases.mpt_rental_entry_id,
            count(*) AS phase_count,
            sum(mpt_phases.days) AS total_days,
            sum(mpt_phases.additional_rated_hours) AS total_rated_hours,
            sum(mpt_phases.additional_non_rated_hours) AS total_non_rated_hours,
            json_agg(json_build_object('id', mpt_phases.id, 'name', mpt_phases.name, 'startDate', mpt_phases.start_date, 'endDate', mpt_phases.end_date, 'personnel', mpt_phases.personnel, 'days', mpt_phases.days, 'numberTrucks', mpt_phases.number_trucks, 'itemName', mpt_phases.item_name, 'itemNumber', mpt_phases.item_number, 'additionalRatedHours', mpt_phases.additional_rated_hours, 'additionalNonRatedHours', mpt_phases.additional_non_rated_hours, 'maintenanceTrips', mpt_phases.maintenance_trips, 'standardEquipment', json_build_object('fourFootTypeIII', json_build_object('quantity', mpt_phases.four_foot_type_iii_quantity), 'hStand', json_build_object('quantity', mpt_phases.h_stand_quantity), 'sixFootWings', json_build_object('quantity', mpt_phases.six_foot_wings_quantity), 'post', json_build_object('quantity', mpt_phases.post_quantity), 'sandbag', json_build_object('quantity', mpt_phases.sandbag_quantity), 'covers', json_build_object('quantity', mpt_phases.covers_quantity), 'metalStands', json_build_object('quantity', mpt_phases.metal_stands_quantity), 'HIVP', json_build_object('quantity', mpt_phases.hivp_quantity), 'TypeXIVP', json_build_object('quantity', mpt_phases.type_xivp_quantity), 'BLights', json_build_object('quantity', mpt_phases.b_lights_quantity), 'ACLights', json_build_object('quantity', mpt_phases.ac_lights_quantity), 'sharps', json_build_object('quantity', mpt_phases.sharps_quantity)), 'customLightAndDrumItems', mpt_phases.custom_light_and_drum_items, 'signs', COALESCE(phase_signs.all_signs, '[]'::json), 'emergency', mpt_phases.emergency) ORDER BY mpt_phases.phase_index) AS phases
           FROM (public.mpt_phases
             LEFT JOIN ( SELECT p.id AS phase_id,
                    ( SELECT json_agg(combined.combined_signs) AS json_agg
                           FROM ( SELECT json_build_object('id', ps.sign_id, 'width', ps.width, 'height', ps.height, 'quantity', ps.quantity, 'sheeting', ps.sheeting, 'isCustom', ps.is_custom, 'designation', ps.designation, 'description', ps.description, 'associatedStructure', ps.associated_structure, 'displayStructure', ps.display_structure, 'bLights', ps.b_lights, 'bLightsColor', ps.b_lights_color, 'covers', ps.covers, 'substrate', ps.substrate, 'stiffener', ps.stiffener) AS combined_signs
                                   FROM public.mpt_primary_signs ps
                                  WHERE (ps.phase_id = p.id)
                                UNION ALL
                                 SELECT json_build_object('id', ss.sign_id, 'width', ss.width, 'height', ss.height, 'sheeting', ss.sheeting, 'isCustom', ss.is_custom, 'designation', ss.designation, 'description', ss.description, 'primarySignId', ss.primary_sign_id, 'substrate', ss.substrate) AS combined_signs
                                   FROM public.mpt_secondary_signs ss
                                  WHERE (ss.phase_id = p.id)) combined) AS all_signs
                   FROM public.mpt_phases p
                  WHERE (p.mpt_rental_entry_id IS NOT NULL)
                  GROUP BY p.id) phase_signs ON ((mpt_phases.id = phase_signs.phase_id)))
          GROUP BY mpt_phases.mpt_rental_entry_id
        ), static_equipment_json AS (
         SELECT mpt_static_equipment_info.mpt_rental_entry_id,
            json_object_agg(mpt_static_equipment_info.equipment_type, json_build_object('price', mpt_static_equipment_info.price, 'discountRate', mpt_static_equipment_info.discount_rate, 'usefulLife', mpt_static_equipment_info.useful_life, 'paybackPeriod', mpt_static_equipment_info.payback_period)) AS static_equipment_info
           FROM public.mpt_static_equipment_info
          GROUP BY mpt_static_equipment_info.mpt_rental_entry_id
        )
 SELECT be.id,
    be.status,
    be.total_revenue,
    be.total_cost,
    be.total_gross_profit,
    be.created_at,
    be.archived,
    be.deleted,
    be.notes,
    json_build_object('contractNumber', ad.contract_number, 'estimator', ad.estimator, 'division', ad.division, 'lettingDate', ad.bid_date, 'owner', ad.owner, 'county', (ad.county)::json, 'srRoute', ad.sr_route, 'location', ad.location, 'dbe', ad.dbe, 'startDate', ad.start_date, 'endDate', ad.end_date, 'winterStart', ad.winter_start, 'winterEnd', ad.winter_end, 'owTravelTimeMins', ad.ow_travel_time_mins, 'owMileage', ad.ow_mileage, 'fuelCostPerGallon', ad.fuel_cost_per_gallon, 'emergencyJob', ad.emergency_job, 'rated', ad.rated, 'emergencyFields', ad.emergency_fields, 'etcRep', ad.etc_rep) AS admin_data,
        CASE
            WHEN (mpr.id IS NOT NULL) THEN json_build_object('targetMOIC', mpr.target_moic, 'paybackPeriod', mpr.payback_period, 'annualUtilization', mpr.annual_utilization, 'dispatchFee', mpr.dispatch_fee, 'mpgPerTruck', mpr.mpg_per_truck, 'staticEquipmentInfo', sei.static_equipment_info, 'phases', pa.phases, '_summary', json_build_object('revenue', mpr.revenue, 'cost', mpr.cost, 'grossProfit', mpr.gross_profit, 'hours', mpr.hours))
            ELSE NULL::json
        END AS mpt_rental,
    COALESCE(( SELECT json_agg(json_build_object('name', equipment_rental_entries.name, 'quantity', equipment_rental_entries.quantity, 'months', equipment_rental_entries.months, 'rentPrice', equipment_rental_entries.rent_price, 'reRentPrice', equipment_rental_entries.re_rent_price, 'reRentForCurrentJob', equipment_rental_entries.re_rent_for_current_job, 'totalCost', equipment_rental_entries.total_cost, 'usefulLifeYrs', equipment_rental_entries.useful_life_yrs, 'revenue', equipment_rental_entries.revenue, 'grossProfit', equipment_rental_entries.gross_profit, 'grossProfitMargin', equipment_rental_entries.gross_profit_margin, 'cost', equipment_rental_entries.cost, 'notes', equipment_rental_entries.notes)) AS json_agg
           FROM public.equipment_rental_entries
          WHERE (equipment_rental_entries.bid_estimate_id = be.id)), '[]'::json) AS equipment_rental,
        CASE
            WHEN (f.id IS NOT NULL) THEN json_build_object('standardPricing', f.standard_pricing, 'standardLumpSum', f.standard_lump_sum, 'numberTrucks', f.number_trucks, 'fuelEconomyMPG', f.fuel_economy_mpg, 'personnel', f.personnel, 'onSiteJobHours', f.on_site_job_hours, 'additionalEquipmentCost', f.additional_equipment_cost, 'fuelCostPerGallon', f.fuel_cost_per_gallon, 'truckDispatchFee', f.truck_dispatch_fee, 'workerComp', f.worker_comp, 'generalLiability', f.general_liability, 'markupRate', f.markup_rate, 'arrowBoards', json_build_object('quantity', f.arrow_boards_quantity, 'cost', f.arrow_boards_cost, 'includeInLumpSum', f.arrow_boards_include_in_lump_sum), 'messageBoards', json_build_object('quantity', f.message_boards_quantity, 'cost', f.message_boards_cost, 'includeInLumpSum', f.message_boards_include_in_lump_sum), 'TMA', json_build_object('quantity', f.tma_quantity, 'cost', f.tma_cost, 'includeInLumpSum', f.tma_include_in_lump_sum), 'revenue', f.revenue, 'cost', f.cost, 'grossProfit', f.gross_profit, 'hours', f.hours)
            ELSE NULL::json
        END AS flagging,
        CASE
            WHEN (sw.id IS NOT NULL) THEN json_build_object('standardPricing', sw.standard_pricing, 'standardLumpSum', sw.standard_lump_sum, 'numberTrucks', sw.number_trucks, 'fuelEconomyMPG', sw.fuel_economy_mpg, 'personnel', sw.personnel, 'onSiteJobHours', sw.on_site_job_hours, 'additionalEquipmentCost', sw.additional_equipment_cost, 'fuelCostPerGallon', sw.fuel_cost_per_gallon, 'truckDispatchFee', sw.truck_dispatch_fee, 'workerComp', sw.worker_comp, 'generalLiability', sw.general_liability, 'markupRate', sw.markup_rate, 'arrowBoards', json_build_object('quantity', sw.arrow_boards_quantity, 'cost', sw.arrow_boards_cost, 'includeInLumpSum', sw.arrow_boards_include_in_lump_sum), 'messageBoards', json_build_object('quantity', sw.message_boards_quantity, 'cost', sw.message_boards_cost, 'includeInLumpSum', sw.message_boards_include_in_lump_sum), 'TMA', json_build_object('quantity', sw.tma_quantity, 'cost', sw.tma_cost, 'includeInLumpSum', sw.tma_include_in_lump_sum), 'revenue', sw.revenue, 'cost', sw.cost, 'grossProfit', sw.gross_profit, 'hours', sw.hours)
            ELSE NULL::json
        END AS service_work,
    COALESCE(( SELECT json_agg(json_build_object('id', sie.id, 'name', sie.name, 'total_cost', sie.total_cost, 'revenue', sie.revenue, 'gross_profit', sie.gross_profit, 'gross_profit_margin', sie.gross_profit_margin, 'cost', sie.total_cost, 'notes', sie.notes, 'item_number', sie.item_number, 'display_name', sie.name, 'bid_estimate_id', sie.bid_estimate_id, 'job_id', sie.job_id, 'quantity', sie.quantity, 'vendor', sie.vendor, 'quote_price', sie.quote_price, 'markup_percentage', sie.markup_percentage)) AS json_agg
           FROM public.sale_item_entries sie
          WHERE (sie.bid_estimate_id = be.id)), '[]'::json) AS sale_items,
        CASE
            WHEN (pse.id IS NOT NULL) THEN json_build_object('maxDailyHours', ((pse.permanent_signs_info ->> 'maxDailyHours'::text))::numeric, 'itemMarkup', ((pse.permanent_signs_info ->> 'itemMarkup'::text))::numeric, 'equipmentData', (pse.permanent_signs_info -> 'equipmentData'::text), 'productivityRates', (pse.permanent_signs_info -> 'productivityRates'::text), 'signItems', COALESCE(( SELECT json_agg(json_build_object('id', (ps.id)::text, 'itemNumber', ps.item_number, 'personnel', ps.personnel, 'numberTrucks', ps.number_trucks, 'numberTrips', ps.number_trips, 'installHoursRequired', ps.install_hours_required, 'quantity', ps.quantity, 'permSignBolts', ps.perm_sign_bolts, 'productivityRate', ps.productivity_rate, 'type', ps.type, 'signSqFootage', ps.sign_sq_footage, 'permSignPriceSqFt', ps.perm_sign_price_sq_ft, 'standardPricing', ps.standard_pricing, 'customMargin', ps.custom_margin, 'separateMobilization', ps.separate_mobilization, 'permSignCostSqFt', ps.perm_sign_cost_sq_ft, 'hiReflectiveStrips', ps.hi_reflective_strips, 'fygReflectiveStrips', ps.fyg_reflective_strips, 'jennyBrackets', ps.jenny_brackets, 'stiffenerSqInches', ps.stiffener_inches, 'tmzBrackets', ps.tmz_brackets, 'antiTheftBolts', ps.anti_theft_bolts, 'chevronBrackets', ps.chevron_brackets, 'streetNameCrossBrackets', ps.street_name_cross_brackets, 'isRemove', ps.is_remove, 'flexibleDelineatorCost', ps.flexible_delineator_cost, 'additionalItems', ps.additional_items) ORDER BY ps.id) AS json_agg
               FROM public.permanent_signs ps
              WHERE (ps.permanent_signs_entry_id = pse.id)), '[]'::json))
            ELSE NULL::json
        END AS permanent_signs,
    pm.project_manager,
    pm.pm_email,
    pm.pm_phone,
    pm.customer_contract_number,
    c.name AS contractor_name,
    s.name AS subcontractor_name,
    pa.phase_count AS total_phases,
    pa.total_days,
    (pa.total_rated_hours + pa.total_non_rated_hours) AS total_hours
   FROM ((((((((((public.bid_estimates be
     LEFT JOIN public.admin_data_entries ad ON ((be.id = ad.bid_estimate_id)))
     LEFT JOIN public.mpt_rental_entries mpr ON ((be.id = mpr.bid_estimate_id)))
     LEFT JOIN phase_aggregations pa ON ((mpr.id = pa.mpt_rental_entry_id)))
     LEFT JOIN static_equipment_json sei ON ((mpr.id = sei.mpt_rental_entry_id)))
     LEFT JOIN public.flagging_entries f ON ((be.id = f.bid_estimate_id)))
     LEFT JOIN public.service_work_entries sw ON ((be.id = sw.bid_estimate_id)))
     LEFT JOIN public.project_metadata pm ON ((be.id = pm.bid_estimate_id)))
     LEFT JOIN public.contractors c ON ((pm.contractor_id = c.id)))
     LEFT JOIN public.subcontractors s ON ((pm.subcontractor_id = s.id)))
     LEFT JOIN public.permanent_signs_entries pse ON ((be.id = pse.bid_estimate_id)));


CREATE OR REPLACE FUNCTION public.execute_custom_sql(sql_query text)
 RETURNS TABLE(result json)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY EXECUTE format('SELECT row_to_json(t) AS result FROM (%s) t', sql_query);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_phases_with_signs(p_mpt_rental_id integer)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'name', p.name,
      'startDate', p.start_date,
      'endDate', p.end_date,
      'personnel', p.personnel,
      'days', p.days,
      'numberTrucks', p.number_trucks,
      'additionalRatedHours', p.additional_rated_hours,
      'additionalNonRatedHours', p.additional_non_rated_hours,
      'maintenanceTrips', p.maintenance_trips,
      'standardEquipment', json_build_object(
        'fourFootTypeIII', json_build_object('quantity', p.four_foot_type_iii_quantity),
        'hStand', json_build_object('quantity', p.h_stand_quantity),
        'sixFootWings', json_build_object('quantity', p.six_foot_wings_quantity),
        'post', json_build_object('quantity', p.post_quantity),
        'sandbag', json_build_object('quantity', p.sandbag_quantity),
        'covers', json_build_object('quantity', p.covers_quantity),
        'metalStands', json_build_object('quantity', p.metal_stands_quantity),
        'HIVP', json_build_object('quantity', p.hivp_quantity),
        'TypeXIVP', json_build_object('quantity', p.type_xivp_quantity),
        'BLights', json_build_object('quantity', p.b_lights_quantity),
        'ACLights', json_build_object('quantity', p.ac_lights_quantity),
        'sharps', json_build_object('quantity', p.sharps_quantity)
      ),
      'customLightAndDrumItems', p.custom_light_and_drum_items,
      'signs', coalesce(array_to_json(array_cat(
        COALESCE(
          (SELECT array_agg(
            json_build_object(
              'id', ps.sign_id,
              'width', ps.width,
              'height', ps.height,
              'quantity', ps.quantity,
              'sheeting', ps.sheeting,
              'isCustom', ps.is_custom,
              'designation', ps.designation,
              'description', ps.description,
              'associatedStructure', ps.associated_structure,
              'bLights', ps.b_lights,
              'covers', ps.covers
            )
          )
          FROM mpt_primary_signs ps
          WHERE ps.phase_id = p.id),
          ARRAY[]::json[]
        ),
        COALESCE(
          (SELECT array_agg(
            json_build_object(
              'id', ss.sign_id,
              'width', ss.width,
              'height', ss.height,
              'sheeting', ss.sheeting,
              'isCustom', ss.is_custom,
              'designation', ss.designation,
              'description', ss.description,
              'primarySignId', ss.primary_sign_id
            )
          )
          FROM mpt_secondary_signs ss
          WHERE ss.phase_id = p.id),
          ARRAY[]::json[]
        )
      )), '[]'::json)
    ) ORDER BY p.phase_index
  ) INTO result
  FROM mpt_phases p
  WHERE p.mpt_rental_entry_id = p_mpt_rental_id;
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$
;

create or replace view "public"."jobs_complete" as  WITH estimate_data AS (
         SELECT estimate_complete.id,
            estimate_complete.status,
            estimate_complete.total_revenue,
            estimate_complete.total_cost,
            estimate_complete.total_gross_profit,
            estimate_complete.created_at,
            estimate_complete.archived,
            estimate_complete.deleted,
            estimate_complete.notes,
            estimate_complete.admin_data,
            estimate_complete.mpt_rental,
            estimate_complete.equipment_rental,
            estimate_complete.flagging,
            estimate_complete.service_work,
            estimate_complete.sale_items,
            estimate_complete.permanent_signs,
            estimate_complete.project_manager,
            estimate_complete.pm_email,
            estimate_complete.pm_phone,
            estimate_complete.customer_contract_number,
            estimate_complete.contractor_name,
            estimate_complete.subcontractor_name,
            estimate_complete.total_phases,
            estimate_complete.total_days,
            estimate_complete.total_hours
           FROM public.estimate_complete
        )
 SELECT j.id,
    j.billing_status,
    j.project_status,
    j.overdays,
    j.notes,
    j.bid_number,
    j.certified_payroll,
    j.created_at,
    j.archived,
    j.deleted,
    jn.job_number,
    jn.branch_code,
    jn.owner_type,
    jn.year AS job_year,
    jn.sequential_number,
    e.id AS estimate_id,
    e.status AS estimate_status,
    e.total_revenue,
    e.total_cost,
    e.total_gross_profit,
    e.created_at AS estimate_created_at,
    e.notes AS estimate_notes,
    COALESCE(
        CASE
            WHEN (ade_job.id IS NOT NULL) THEN to_jsonb(json_build_object('contractNumber', ade_job.contract_number, 'estimator', ade_job.estimator, 'division', (ade_job.division)::text, 'lettingDate', ade_job.bid_date, 'owner', (ade_job.owner)::text, 'county', ade_job.county, 'srRoute', ade_job.sr_route, 'location', ade_job.location, 'dbe', ade_job.dbe, 'startDate', ade_job.start_date, 'endDate', ade_job.end_date, 'winterStart', ade_job.winter_start, 'winterEnd', ade_job.winter_end, 'owTravelTimeMins', ade_job.ow_travel_time_mins, 'owMileage', ade_job.ow_mileage, 'fuelCostPerGallon', ade_job.fuel_cost_per_gallon, 'emergencyJob', ade_job.emergency_job, 'rated', (ade_job.rated)::text, 'emergencyFields', ade_job.emergency_fields))
            ELSE NULL::jsonb
        END, (e.admin_data)::jsonb) AS admin_data,
    e.mpt_rental,
    e.equipment_rental,
    e.flagging,
    e.service_work,
    e.sale_items,
    e.permanent_signs,
    COALESCE(pm_job.project_manager, e.project_manager) AS project_manager,
    COALESCE(pm_job.pm_email, e.pm_email) AS pm_email,
    COALESCE(pm_job.pm_phone, e.pm_phone) AS pm_phone,
    COALESCE(pm_job.customer_contract_number, e.customer_contract_number) AS customer_contract_number,
    e.contractor_name,
    e.subcontractor_name,
    e.total_phases,
    e.total_days,
    e.total_hours,
    json_build_object('jobNumber', jn.job_number, 'contractNumber', COALESCE(ade_job.contract_number, ((e.admin_data ->> 'contractNumber'::text))::character varying), 'estimator', COALESCE(ade_job.estimator, ((e.admin_data ->> 'estimator'::text))::character varying), 'owner', COALESCE((ade_job.owner)::text, (e.admin_data ->> 'owner'::text)), 'county', COALESCE((ade_job.county)::text, (e.admin_data ->> 'county'::text)), 'branch', jn.branch_code, 'startDate', COALESCE((ade_job.start_date)::text, (e.admin_data ->> 'startDate'::text)), 'endDate', COALESCE((ade_job.end_date)::text, (e.admin_data ->> 'endDate'::text)), 'projectDays', e.total_days, 'totalHours', e.total_hours, 'revenue', e.total_revenue, 'cost', e.total_cost, 'grossProfit', e.total_gross_profit, 'jobStatus', j.project_status, 'billingStatus', j.billing_status, 'certifiedPayroll', j.certified_payroll, 'overdays', j.overdays) AS job_summary
   FROM ((((public.jobs j
     LEFT JOIN public.job_numbers jn ON ((j.job_number_id = jn.id)))
     LEFT JOIN estimate_data e ON ((j.estimate_id = e.id)))
     LEFT JOIN public.admin_data_entries ade_job ON ((ade_job.job_id = j.id)))
     LEFT JOIN public.project_metadata pm_job ON ((pm_job.job_id = j.id)))
  ORDER BY j.created_at DESC;


create or replace view "public"."jobs_list" as  SELECT j.id,
    j.billing_status,
    j.project_status,
    j.overdays,
    j.bid_number,
    j.certified_payroll,
    j.created_at,
    j.archived,
    jn.job_number,
    jn.branch_code,
    jn.owner_type,
    e.contract_number,
    e.estimator,
    e.letting_date,
    e.owner,
    e.county,
    e.branch,
    e.start_date,
    e.end_date,
    e.project_days,
    e.total_hours,
    e.total_revenue,
    e.total_cost,
    e.total_gross_profit,
    e.contractor,
    e.subcontractor,
    e.project_manager,
        CASE
            WHEN (e.total_revenue > (0)::numeric) THEN round(((e.total_gross_profit / e.total_revenue) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS gross_margin_percent
   FROM ((public.jobs j
     LEFT JOIN public.job_numbers jn ON ((j.job_number_id = jn.id)))
     LEFT JOIN ( SELECT be.id,
            ad.contract_number,
            ad.estimator,
            ad.bid_date AS letting_date,
            ad.owner,
            ((ad.county)::json ->> 'name'::text) AS county,
            ((ad.county)::json ->> 'branch'::text) AS branch,
            ad.start_date,
            ad.end_date,
            be.total_revenue,
            be.total_cost,
            be.total_gross_profit,
            pm.project_manager,
            c.name AS contractor,
            s.name AS subcontractor,
            pa.total_days AS project_days,
            (pa.total_rated_hours + pa.total_non_rated_hours) AS total_hours
           FROM (((((public.bid_estimates be
             LEFT JOIN public.admin_data_entries ad ON ((be.id = ad.bid_estimate_id)))
             LEFT JOIN public.project_metadata pm ON ((be.id = pm.bid_estimate_id)))
             LEFT JOIN public.contractors c ON ((pm.contractor_id = c.id)))
             LEFT JOIN public.subcontractors s ON ((pm.subcontractor_id = s.id)))
             LEFT JOIN ( SELECT mpt_phases.mpt_rental_entry_id,
                    sum(mpt_phases.days) AS total_days,
                    sum(mpt_phases.additional_rated_hours) AS total_rated_hours,
                    sum(mpt_phases.additional_non_rated_hours) AS total_non_rated_hours
                   FROM public.mpt_phases
                  GROUP BY mpt_phases.mpt_rental_entry_id) pa ON ((pa.mpt_rental_entry_id = ( SELECT mpt_rental_entries.id
                   FROM public.mpt_rental_entries
                  WHERE (mpt_rental_entries.bid_estimate_id = be.id)))))) e ON ((j.estimate_id = e.id)));


CREATE OR REPLACE FUNCTION public.kg_query(query_text text DEFAULT NULL::text, contract_number text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  result json;
begin
  -- 1. Exact contract number match (inside properties)
  if contract_number is not null then
    select json_agg(row_to_json(n)) into result
    from kg_nodes n
    where n.type = 'Bid'
      and (n.properties->>'contract_number') = contract_number;

    return coalesce(result, '[]'::json);
  end if;

  -- 2. Keyword search in label OR properties
  if query_text is not null then
    select json_agg(json_build_object(
      'node', row_to_json(n),
      'outgoing', (
        select json_agg(json_build_object(
          'rel', e.relationship,
          'target', row_to_json(t)
        ))
        from kg_edges e
        join kg_nodes t on e.target_id = t.id
        where e.source_id = n.id
      )
    )) into result
    from kg_nodes n
    where n.label ilike '%' || query_text || '%'
       or n.properties::text ilike '%' || query_text || '%'
    limit 30;
  end if;

  return coalesce(result, '[]'::json);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_custom_sov_items_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := NOW();   -- Fixed: := is required for assignment in PL/pgSQL
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_documents_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := NOW();   -- Fixed: use := for assignment in PL/pgSQL
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_modified_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_overdays_on_date_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    updated_days_diff INTEGER;
    original_days_diff INTEGER;
    overdays_amount INTEGER;
    original_job_id INTEGER;
BEGIN
    -- Only proceed if start_date or end_date was actually changed and job_id is not null
    IF (TG_OP = 'UPDATE' AND NEW.job_id IS NOT NULL AND 
        (OLD.start_date IS DISTINCT FROM NEW.start_date OR OLD.end_date IS DISTINCT FROM NEW.end_date)) THEN
        
        -- Calculate days difference for the updated entry (only if both dates exist)
        IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
            -- Use DATE() to ensure we're working with dates only, not timestamps
            updated_days_diff := (DATE(NEW.end_date) - DATE(NEW.start_date))::INTEGER;
            
            -- Ensure we have a valid number (not negative)
            IF updated_days_diff < 0 THEN
                updated_days_diff := 0;
            END IF;
        ELSE
            -- If either date is null, set overdays to 0 and exit
            UPDATE jobs 
            SET overdays = 0
            WHERE id = NEW.job_id;
            RETURN NEW;
        END IF;
        
        -- Find the original admin_data_entries record with the same contract_number
        SELECT 
            (DATE(ade.end_date) - DATE(ade.start_date))::INTEGER,
            ade.job_id
        INTO original_days_diff, original_job_id
        FROM admin_data_entries ade
        WHERE ade.contract_number = NEW.contract_number 
          AND ade.job_id IS NOT NULL
          AND ade.start_date IS NOT NULL 
          AND ade.end_date IS NOT NULL
          AND ade.id != NEW.id  -- Exclude the current record being updated
        ORDER BY ade.id ASC  -- Use id for ordering
        LIMIT 1;
        
        -- Calculate overdays amount, defaulting to 0 if we can't calculate
        IF original_days_diff IS NOT NULL AND updated_days_diff > original_days_diff THEN
            overdays_amount := updated_days_diff - original_days_diff;
        ELSE
            overdays_amount := 0;
        END IF;
        
        -- Ensure overdays_amount is never NULL
        IF overdays_amount IS NULL THEN
            overdays_amount := 0;
        END IF;
        
        -- Update the jobs table for the current job
        UPDATE jobs 
        SET overdays = overdays_amount
        WHERE id = NEW.job_id;
        
        RAISE NOTICE 'Updated job % overdays to % (original: % days, updated: % days)', 
            NEW.job_id, overdays_amount, COALESCE(original_days_diff, 0), updated_days_diff;
        
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_sov_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := NOW();   -- Fixed: use := for assignment in PL/pgSQL
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_takeoff_item_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := NOW();   -- Fixed: use := for assignment in PL/pgSQL
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_takeoff_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := NOW();   -- ← Use := here
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_work_order_item_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := NOW();   -- Fixed: use := for assignment in PL/pgSQL
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_work_order_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at := NOW();   -- Fixed: use := for assignment in PL/pgSQL
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."admin_data_entries" to "anon";

grant insert on table "public"."admin_data_entries" to "anon";

grant references on table "public"."admin_data_entries" to "anon";

grant select on table "public"."admin_data_entries" to "anon";

grant trigger on table "public"."admin_data_entries" to "anon";

grant truncate on table "public"."admin_data_entries" to "anon";

grant update on table "public"."admin_data_entries" to "anon";

grant delete on table "public"."admin_data_entries" to "authenticated";

grant insert on table "public"."admin_data_entries" to "authenticated";

grant references on table "public"."admin_data_entries" to "authenticated";

grant select on table "public"."admin_data_entries" to "authenticated";

grant trigger on table "public"."admin_data_entries" to "authenticated";

grant truncate on table "public"."admin_data_entries" to "authenticated";

grant update on table "public"."admin_data_entries" to "authenticated";

grant delete on table "public"."admin_data_entries" to "service_role";

grant insert on table "public"."admin_data_entries" to "service_role";

grant references on table "public"."admin_data_entries" to "service_role";

grant select on table "public"."admin_data_entries" to "service_role";

grant trigger on table "public"."admin_data_entries" to "service_role";

grant truncate on table "public"."admin_data_entries" to "service_role";

grant update on table "public"."admin_data_entries" to "service_role";

grant delete on table "public"."archived_available_jobs" to "anon";

grant insert on table "public"."archived_available_jobs" to "anon";

grant references on table "public"."archived_available_jobs" to "anon";

grant select on table "public"."archived_available_jobs" to "anon";

grant trigger on table "public"."archived_available_jobs" to "anon";

grant truncate on table "public"."archived_available_jobs" to "anon";

grant update on table "public"."archived_available_jobs" to "anon";

grant delete on table "public"."archived_available_jobs" to "authenticated";

grant insert on table "public"."archived_available_jobs" to "authenticated";

grant references on table "public"."archived_available_jobs" to "authenticated";

grant select on table "public"."archived_available_jobs" to "authenticated";

grant trigger on table "public"."archived_available_jobs" to "authenticated";

grant truncate on table "public"."archived_available_jobs" to "authenticated";

grant update on table "public"."archived_available_jobs" to "authenticated";

grant delete on table "public"."archived_available_jobs" to "service_role";

grant insert on table "public"."archived_available_jobs" to "service_role";

grant references on table "public"."archived_available_jobs" to "service_role";

grant select on table "public"."archived_available_jobs" to "service_role";

grant trigger on table "public"."archived_available_jobs" to "service_role";

grant truncate on table "public"."archived_available_jobs" to "service_role";

grant update on table "public"."archived_available_jobs" to "service_role";

grant delete on table "public"."associated_items" to "anon";

grant insert on table "public"."associated_items" to "anon";

grant references on table "public"."associated_items" to "anon";

grant select on table "public"."associated_items" to "anon";

grant trigger on table "public"."associated_items" to "anon";

grant truncate on table "public"."associated_items" to "anon";

grant update on table "public"."associated_items" to "anon";

grant delete on table "public"."associated_items" to "authenticated";

grant insert on table "public"."associated_items" to "authenticated";

grant references on table "public"."associated_items" to "authenticated";

grant select on table "public"."associated_items" to "authenticated";

grant trigger on table "public"."associated_items" to "authenticated";

grant truncate on table "public"."associated_items" to "authenticated";

grant update on table "public"."associated_items" to "authenticated";

grant delete on table "public"."associated_items" to "service_role";

grant insert on table "public"."associated_items" to "service_role";

grant references on table "public"."associated_items" to "service_role";

grant select on table "public"."associated_items" to "service_role";

grant trigger on table "public"."associated_items" to "service_role";

grant truncate on table "public"."associated_items" to "service_role";

grant update on table "public"."associated_items" to "service_role";

grant delete on table "public"."available_jobs" to "anon";

grant insert on table "public"."available_jobs" to "anon";

grant references on table "public"."available_jobs" to "anon";

grant select on table "public"."available_jobs" to "anon";

grant trigger on table "public"."available_jobs" to "anon";

grant truncate on table "public"."available_jobs" to "anon";

grant update on table "public"."available_jobs" to "anon";

grant delete on table "public"."available_jobs" to "authenticated";

grant insert on table "public"."available_jobs" to "authenticated";

grant references on table "public"."available_jobs" to "authenticated";

grant select on table "public"."available_jobs" to "authenticated";

grant trigger on table "public"."available_jobs" to "authenticated";

grant truncate on table "public"."available_jobs" to "authenticated";

grant update on table "public"."available_jobs" to "authenticated";

grant delete on table "public"."available_jobs" to "service_role";

grant insert on table "public"."available_jobs" to "service_role";

grant references on table "public"."available_jobs" to "service_role";

grant select on table "public"."available_jobs" to "service_role";

grant trigger on table "public"."available_jobs" to "service_role";

grant truncate on table "public"."available_jobs" to "service_role";

grant update on table "public"."available_jobs" to "service_role";

grant delete on table "public"."bid_estimates" to "anon";

grant insert on table "public"."bid_estimates" to "anon";

grant references on table "public"."bid_estimates" to "anon";

grant select on table "public"."bid_estimates" to "anon";

grant trigger on table "public"."bid_estimates" to "anon";

grant truncate on table "public"."bid_estimates" to "anon";

grant update on table "public"."bid_estimates" to "anon";

grant delete on table "public"."bid_estimates" to "authenticated";

grant insert on table "public"."bid_estimates" to "authenticated";

grant references on table "public"."bid_estimates" to "authenticated";

grant select on table "public"."bid_estimates" to "authenticated";

grant trigger on table "public"."bid_estimates" to "authenticated";

grant truncate on table "public"."bid_estimates" to "authenticated";

grant update on table "public"."bid_estimates" to "authenticated";

grant delete on table "public"."bid_estimates" to "service_role";

grant insert on table "public"."bid_estimates" to "service_role";

grant references on table "public"."bid_estimates" to "service_role";

grant select on table "public"."bid_estimates" to "service_role";

grant trigger on table "public"."bid_estimates" to "service_role";

grant truncate on table "public"."bid_estimates" to "service_role";

grant update on table "public"."bid_estimates" to "service_role";

grant delete on table "public"."bid_estimates_deleted" to "anon";

grant insert on table "public"."bid_estimates_deleted" to "anon";

grant references on table "public"."bid_estimates_deleted" to "anon";

grant select on table "public"."bid_estimates_deleted" to "anon";

grant trigger on table "public"."bid_estimates_deleted" to "anon";

grant truncate on table "public"."bid_estimates_deleted" to "anon";

grant update on table "public"."bid_estimates_deleted" to "anon";

grant delete on table "public"."bid_estimates_deleted" to "authenticated";

grant insert on table "public"."bid_estimates_deleted" to "authenticated";

grant references on table "public"."bid_estimates_deleted" to "authenticated";

grant select on table "public"."bid_estimates_deleted" to "authenticated";

grant trigger on table "public"."bid_estimates_deleted" to "authenticated";

grant truncate on table "public"."bid_estimates_deleted" to "authenticated";

grant update on table "public"."bid_estimates_deleted" to "authenticated";

grant delete on table "public"."bid_estimates_deleted" to "service_role";

grant insert on table "public"."bid_estimates_deleted" to "service_role";

grant references on table "public"."bid_estimates_deleted" to "service_role";

grant select on table "public"."bid_estimates_deleted" to "service_role";

grant trigger on table "public"."bid_estimates_deleted" to "service_role";

grant truncate on table "public"."bid_estimates_deleted" to "service_role";

grant update on table "public"."bid_estimates_deleted" to "service_role";

grant delete on table "public"."bid_item_numbers" to "anon";

grant insert on table "public"."bid_item_numbers" to "anon";

grant references on table "public"."bid_item_numbers" to "anon";

grant select on table "public"."bid_item_numbers" to "anon";

grant trigger on table "public"."bid_item_numbers" to "anon";

grant truncate on table "public"."bid_item_numbers" to "anon";

grant update on table "public"."bid_item_numbers" to "anon";

grant delete on table "public"."bid_item_numbers" to "authenticated";

grant insert on table "public"."bid_item_numbers" to "authenticated";

grant references on table "public"."bid_item_numbers" to "authenticated";

grant select on table "public"."bid_item_numbers" to "authenticated";

grant trigger on table "public"."bid_item_numbers" to "authenticated";

grant truncate on table "public"."bid_item_numbers" to "authenticated";

grant update on table "public"."bid_item_numbers" to "authenticated";

grant delete on table "public"."bid_item_numbers" to "service_role";

grant insert on table "public"."bid_item_numbers" to "service_role";

grant references on table "public"."bid_item_numbers" to "service_role";

grant select on table "public"."bid_item_numbers" to "service_role";

grant trigger on table "public"."bid_item_numbers" to "service_role";

grant truncate on table "public"."bid_item_numbers" to "service_role";

grant update on table "public"."bid_item_numbers" to "service_role";

grant delete on table "public"."branches" to "anon";

grant insert on table "public"."branches" to "anon";

grant references on table "public"."branches" to "anon";

grant select on table "public"."branches" to "anon";

grant trigger on table "public"."branches" to "anon";

grant truncate on table "public"."branches" to "anon";

grant update on table "public"."branches" to "anon";

grant delete on table "public"."branches" to "authenticated";

grant insert on table "public"."branches" to "authenticated";

grant references on table "public"."branches" to "authenticated";

grant select on table "public"."branches" to "authenticated";

grant trigger on table "public"."branches" to "authenticated";

grant truncate on table "public"."branches" to "authenticated";

grant update on table "public"."branches" to "authenticated";

grant delete on table "public"."branches" to "service_role";

grant insert on table "public"."branches" to "service_role";

grant references on table "public"."branches" to "service_role";

grant select on table "public"."branches" to "service_role";

grant trigger on table "public"."branches" to "service_role";

grant truncate on table "public"."branches" to "service_role";

grant update on table "public"."branches" to "service_role";

grant delete on table "public"."change_orders" to "anon";

grant insert on table "public"."change_orders" to "anon";

grant references on table "public"."change_orders" to "anon";

grant select on table "public"."change_orders" to "anon";

grant trigger on table "public"."change_orders" to "anon";

grant truncate on table "public"."change_orders" to "anon";

grant update on table "public"."change_orders" to "anon";

grant delete on table "public"."change_orders" to "authenticated";

grant insert on table "public"."change_orders" to "authenticated";

grant references on table "public"."change_orders" to "authenticated";

grant select on table "public"."change_orders" to "authenticated";

grant trigger on table "public"."change_orders" to "authenticated";

grant truncate on table "public"."change_orders" to "authenticated";

grant update on table "public"."change_orders" to "authenticated";

grant delete on table "public"."change_orders" to "service_role";

grant insert on table "public"."change_orders" to "service_role";

grant references on table "public"."change_orders" to "service_role";

grant select on table "public"."change_orders" to "service_role";

grant trigger on table "public"."change_orders" to "service_role";

grant truncate on table "public"."change_orders" to "service_role";

grant update on table "public"."change_orders" to "service_role";

grant delete on table "public"."contractors" to "anon";

grant insert on table "public"."contractors" to "anon";

grant references on table "public"."contractors" to "anon";

grant select on table "public"."contractors" to "anon";

grant trigger on table "public"."contractors" to "anon";

grant truncate on table "public"."contractors" to "anon";

grant update on table "public"."contractors" to "anon";

grant delete on table "public"."contractors" to "authenticated";

grant insert on table "public"."contractors" to "authenticated";

grant references on table "public"."contractors" to "authenticated";

grant select on table "public"."contractors" to "authenticated";

grant trigger on table "public"."contractors" to "authenticated";

grant truncate on table "public"."contractors" to "authenticated";

grant update on table "public"."contractors" to "authenticated";

grant delete on table "public"."contractors" to "service_role";

grant insert on table "public"."contractors" to "service_role";

grant references on table "public"."contractors" to "service_role";

grant select on table "public"."contractors" to "service_role";

grant trigger on table "public"."contractors" to "service_role";

grant truncate on table "public"."contractors" to "service_role";

grant update on table "public"."contractors" to "service_role";

grant delete on table "public"."counties" to "anon";

grant insert on table "public"."counties" to "anon";

grant references on table "public"."counties" to "anon";

grant select on table "public"."counties" to "anon";

grant trigger on table "public"."counties" to "anon";

grant truncate on table "public"."counties" to "anon";

grant update on table "public"."counties" to "anon";

grant delete on table "public"."counties" to "authenticated";

grant insert on table "public"."counties" to "authenticated";

grant references on table "public"."counties" to "authenticated";

grant select on table "public"."counties" to "authenticated";

grant trigger on table "public"."counties" to "authenticated";

grant truncate on table "public"."counties" to "authenticated";

grant update on table "public"."counties" to "authenticated";

grant delete on table "public"."counties" to "service_role";

grant insert on table "public"."counties" to "service_role";

grant references on table "public"."counties" to "service_role";

grant select on table "public"."counties" to "service_role";

grant trigger on table "public"."counties" to "service_role";

grant truncate on table "public"."counties" to "service_role";

grant update on table "public"."counties" to "service_role";

grant delete on table "public"."custom_dimensions" to "anon";

grant insert on table "public"."custom_dimensions" to "anon";

grant references on table "public"."custom_dimensions" to "anon";

grant select on table "public"."custom_dimensions" to "anon";

grant trigger on table "public"."custom_dimensions" to "anon";

grant truncate on table "public"."custom_dimensions" to "anon";

grant update on table "public"."custom_dimensions" to "anon";

grant delete on table "public"."custom_dimensions" to "authenticated";

grant insert on table "public"."custom_dimensions" to "authenticated";

grant references on table "public"."custom_dimensions" to "authenticated";

grant select on table "public"."custom_dimensions" to "authenticated";

grant trigger on table "public"."custom_dimensions" to "authenticated";

grant truncate on table "public"."custom_dimensions" to "authenticated";

grant update on table "public"."custom_dimensions" to "authenticated";

grant delete on table "public"."custom_dimensions" to "service_role";

grant insert on table "public"."custom_dimensions" to "service_role";

grant references on table "public"."custom_dimensions" to "service_role";

grant select on table "public"."custom_dimensions" to "service_role";

grant trigger on table "public"."custom_dimensions" to "service_role";

grant truncate on table "public"."custom_dimensions" to "service_role";

grant update on table "public"."custom_dimensions" to "service_role";

grant delete on table "public"."custom_sov_items" to "anon";

grant insert on table "public"."custom_sov_items" to "anon";

grant references on table "public"."custom_sov_items" to "anon";

grant select on table "public"."custom_sov_items" to "anon";

grant trigger on table "public"."custom_sov_items" to "anon";

grant truncate on table "public"."custom_sov_items" to "anon";

grant update on table "public"."custom_sov_items" to "anon";

grant delete on table "public"."custom_sov_items" to "authenticated";

grant insert on table "public"."custom_sov_items" to "authenticated";

grant references on table "public"."custom_sov_items" to "authenticated";

grant select on table "public"."custom_sov_items" to "authenticated";

grant trigger on table "public"."custom_sov_items" to "authenticated";

grant truncate on table "public"."custom_sov_items" to "authenticated";

grant update on table "public"."custom_sov_items" to "authenticated";

grant delete on table "public"."custom_sov_items" to "service_role";

grant insert on table "public"."custom_sov_items" to "service_role";

grant references on table "public"."custom_sov_items" to "service_role";

grant select on table "public"."custom_sov_items" to "service_role";

grant trigger on table "public"."custom_sov_items" to "service_role";

grant truncate on table "public"."custom_sov_items" to "service_role";

grant update on table "public"."custom_sov_items" to "service_role";

grant delete on table "public"."customer_contacts" to "anon";

grant insert on table "public"."customer_contacts" to "anon";

grant references on table "public"."customer_contacts" to "anon";

grant select on table "public"."customer_contacts" to "anon";

grant trigger on table "public"."customer_contacts" to "anon";

grant truncate on table "public"."customer_contacts" to "anon";

grant update on table "public"."customer_contacts" to "anon";

grant delete on table "public"."customer_contacts" to "authenticated";

grant insert on table "public"."customer_contacts" to "authenticated";

grant references on table "public"."customer_contacts" to "authenticated";

grant select on table "public"."customer_contacts" to "authenticated";

grant trigger on table "public"."customer_contacts" to "authenticated";

grant truncate on table "public"."customer_contacts" to "authenticated";

grant update on table "public"."customer_contacts" to "authenticated";

grant delete on table "public"."customer_contacts" to "service_role";

grant insert on table "public"."customer_contacts" to "service_role";

grant references on table "public"."customer_contacts" to "service_role";

grant select on table "public"."customer_contacts" to "service_role";

grant trigger on table "public"."customer_contacts" to "service_role";

grant truncate on table "public"."customer_contacts" to "service_role";

grant update on table "public"."customer_contacts" to "service_role";

grant delete on table "public"."documents_l" to "anon";

grant insert on table "public"."documents_l" to "anon";

grant references on table "public"."documents_l" to "anon";

grant select on table "public"."documents_l" to "anon";

grant trigger on table "public"."documents_l" to "anon";

grant truncate on table "public"."documents_l" to "anon";

grant update on table "public"."documents_l" to "anon";

grant delete on table "public"."documents_l" to "authenticated";

grant insert on table "public"."documents_l" to "authenticated";

grant references on table "public"."documents_l" to "authenticated";

grant select on table "public"."documents_l" to "authenticated";

grant trigger on table "public"."documents_l" to "authenticated";

grant truncate on table "public"."documents_l" to "authenticated";

grant update on table "public"."documents_l" to "authenticated";

grant delete on table "public"."documents_l" to "service_role";

grant insert on table "public"."documents_l" to "service_role";

grant references on table "public"."documents_l" to "service_role";

grant select on table "public"."documents_l" to "service_role";

grant trigger on table "public"."documents_l" to "service_role";

grant truncate on table "public"."documents_l" to "service_role";

grant update on table "public"."documents_l" to "service_role";

grant delete on table "public"."equipment_rental_entries" to "anon";

grant insert on table "public"."equipment_rental_entries" to "anon";

grant references on table "public"."equipment_rental_entries" to "anon";

grant select on table "public"."equipment_rental_entries" to "anon";

grant trigger on table "public"."equipment_rental_entries" to "anon";

grant truncate on table "public"."equipment_rental_entries" to "anon";

grant update on table "public"."equipment_rental_entries" to "anon";

grant delete on table "public"."equipment_rental_entries" to "authenticated";

grant insert on table "public"."equipment_rental_entries" to "authenticated";

grant references on table "public"."equipment_rental_entries" to "authenticated";

grant select on table "public"."equipment_rental_entries" to "authenticated";

grant trigger on table "public"."equipment_rental_entries" to "authenticated";

grant truncate on table "public"."equipment_rental_entries" to "authenticated";

grant update on table "public"."equipment_rental_entries" to "authenticated";

grant delete on table "public"."equipment_rental_entries" to "service_role";

grant insert on table "public"."equipment_rental_entries" to "service_role";

grant references on table "public"."equipment_rental_entries" to "service_role";

grant select on table "public"."equipment_rental_entries" to "service_role";

grant trigger on table "public"."equipment_rental_entries" to "service_role";

grant truncate on table "public"."equipment_rental_entries" to "service_role";

grant update on table "public"."equipment_rental_entries" to "service_role";

grant delete on table "public"."expenses" to "anon";

grant insert on table "public"."expenses" to "anon";

grant references on table "public"."expenses" to "anon";

grant select on table "public"."expenses" to "anon";

grant trigger on table "public"."expenses" to "anon";

grant truncate on table "public"."expenses" to "anon";

grant update on table "public"."expenses" to "anon";

grant delete on table "public"."expenses" to "authenticated";

grant insert on table "public"."expenses" to "authenticated";

grant references on table "public"."expenses" to "authenticated";

grant select on table "public"."expenses" to "authenticated";

grant trigger on table "public"."expenses" to "authenticated";

grant truncate on table "public"."expenses" to "authenticated";

grant update on table "public"."expenses" to "authenticated";

grant delete on table "public"."expenses" to "service_role";

grant insert on table "public"."expenses" to "service_role";

grant references on table "public"."expenses" to "service_role";

grant select on table "public"."expenses" to "service_role";

grant trigger on table "public"."expenses" to "service_role";

grant truncate on table "public"."expenses" to "service_role";

grant update on table "public"."expenses" to "service_role";

grant delete on table "public"."files" to "anon";

grant insert on table "public"."files" to "anon";

grant references on table "public"."files" to "anon";

grant select on table "public"."files" to "anon";

grant trigger on table "public"."files" to "anon";

grant truncate on table "public"."files" to "anon";

grant update on table "public"."files" to "anon";

grant delete on table "public"."files" to "authenticated";

grant insert on table "public"."files" to "authenticated";

grant references on table "public"."files" to "authenticated";

grant select on table "public"."files" to "authenticated";

grant trigger on table "public"."files" to "authenticated";

grant truncate on table "public"."files" to "authenticated";

grant update on table "public"."files" to "authenticated";

grant delete on table "public"."files" to "service_role";

grant insert on table "public"."files" to "service_role";

grant references on table "public"."files" to "service_role";

grant select on table "public"."files" to "service_role";

grant trigger on table "public"."files" to "service_role";

grant truncate on table "public"."files" to "service_role";

grant update on table "public"."files" to "service_role";

grant delete on table "public"."flagging" to "anon";

grant insert on table "public"."flagging" to "anon";

grant references on table "public"."flagging" to "anon";

grant select on table "public"."flagging" to "anon";

grant trigger on table "public"."flagging" to "anon";

grant truncate on table "public"."flagging" to "anon";

grant update on table "public"."flagging" to "anon";

grant delete on table "public"."flagging" to "authenticated";

grant insert on table "public"."flagging" to "authenticated";

grant references on table "public"."flagging" to "authenticated";

grant select on table "public"."flagging" to "authenticated";

grant trigger on table "public"."flagging" to "authenticated";

grant truncate on table "public"."flagging" to "authenticated";

grant update on table "public"."flagging" to "authenticated";

grant delete on table "public"."flagging" to "service_role";

grant insert on table "public"."flagging" to "service_role";

grant references on table "public"."flagging" to "service_role";

grant select on table "public"."flagging" to "service_role";

grant trigger on table "public"."flagging" to "service_role";

grant truncate on table "public"."flagging" to "service_role";

grant update on table "public"."flagging" to "service_role";

grant delete on table "public"."flagging_entries" to "anon";

grant insert on table "public"."flagging_entries" to "anon";

grant references on table "public"."flagging_entries" to "anon";

grant select on table "public"."flagging_entries" to "anon";

grant trigger on table "public"."flagging_entries" to "anon";

grant truncate on table "public"."flagging_entries" to "anon";

grant update on table "public"."flagging_entries" to "anon";

grant delete on table "public"."flagging_entries" to "authenticated";

grant insert on table "public"."flagging_entries" to "authenticated";

grant references on table "public"."flagging_entries" to "authenticated";

grant select on table "public"."flagging_entries" to "authenticated";

grant trigger on table "public"."flagging_entries" to "authenticated";

grant truncate on table "public"."flagging_entries" to "authenticated";

grant update on table "public"."flagging_entries" to "authenticated";

grant delete on table "public"."flagging_entries" to "service_role";

grant insert on table "public"."flagging_entries" to "service_role";

grant references on table "public"."flagging_entries" to "service_role";

grant select on table "public"."flagging_entries" to "service_role";

grant trigger on table "public"."flagging_entries" to "service_role";

grant truncate on table "public"."flagging_entries" to "service_role";

grant update on table "public"."flagging_entries" to "service_role";

grant delete on table "public"."general_static_assumptions" to "anon";

grant insert on table "public"."general_static_assumptions" to "anon";

grant references on table "public"."general_static_assumptions" to "anon";

grant select on table "public"."general_static_assumptions" to "anon";

grant trigger on table "public"."general_static_assumptions" to "anon";

grant truncate on table "public"."general_static_assumptions" to "anon";

grant update on table "public"."general_static_assumptions" to "anon";

grant delete on table "public"."general_static_assumptions" to "authenticated";

grant insert on table "public"."general_static_assumptions" to "authenticated";

grant references on table "public"."general_static_assumptions" to "authenticated";

grant select on table "public"."general_static_assumptions" to "authenticated";

grant trigger on table "public"."general_static_assumptions" to "authenticated";

grant truncate on table "public"."general_static_assumptions" to "authenticated";

grant update on table "public"."general_static_assumptions" to "authenticated";

grant delete on table "public"."general_static_assumptions" to "service_role";

grant insert on table "public"."general_static_assumptions" to "service_role";

grant references on table "public"."general_static_assumptions" to "service_role";

grant select on table "public"."general_static_assumptions" to "service_role";

grant trigger on table "public"."general_static_assumptions" to "service_role";

grant truncate on table "public"."general_static_assumptions" to "service_role";

grant update on table "public"."general_static_assumptions" to "service_role";

grant delete on table "public"."items" to "anon";

grant insert on table "public"."items" to "anon";

grant references on table "public"."items" to "anon";

grant select on table "public"."items" to "anon";

grant trigger on table "public"."items" to "anon";

grant truncate on table "public"."items" to "anon";

grant update on table "public"."items" to "anon";

grant delete on table "public"."items" to "authenticated";

grant insert on table "public"."items" to "authenticated";

grant references on table "public"."items" to "authenticated";

grant select on table "public"."items" to "authenticated";

grant trigger on table "public"."items" to "authenticated";

grant truncate on table "public"."items" to "authenticated";

grant update on table "public"."items" to "authenticated";

grant delete on table "public"."items" to "service_role";

grant insert on table "public"."items" to "service_role";

grant references on table "public"."items" to "service_role";

grant select on table "public"."items" to "service_role";

grant trigger on table "public"."items" to "service_role";

grant truncate on table "public"."items" to "service_role";

grant update on table "public"."items" to "service_role";

grant delete on table "public"."job_numbers" to "anon";

grant insert on table "public"."job_numbers" to "anon";

grant references on table "public"."job_numbers" to "anon";

grant select on table "public"."job_numbers" to "anon";

grant trigger on table "public"."job_numbers" to "anon";

grant truncate on table "public"."job_numbers" to "anon";

grant update on table "public"."job_numbers" to "anon";

grant delete on table "public"."job_numbers" to "authenticated";

grant insert on table "public"."job_numbers" to "authenticated";

grant references on table "public"."job_numbers" to "authenticated";

grant select on table "public"."job_numbers" to "authenticated";

grant trigger on table "public"."job_numbers" to "authenticated";

grant truncate on table "public"."job_numbers" to "authenticated";

grant update on table "public"."job_numbers" to "authenticated";

grant delete on table "public"."job_numbers" to "service_role";

grant insert on table "public"."job_numbers" to "service_role";

grant references on table "public"."job_numbers" to "service_role";

grant select on table "public"."job_numbers" to "service_role";

grant trigger on table "public"."job_numbers" to "service_role";

grant truncate on table "public"."job_numbers" to "service_role";

grant update on table "public"."job_numbers" to "service_role";

grant delete on table "public"."jobs" to "anon";

grant insert on table "public"."jobs" to "anon";

grant references on table "public"."jobs" to "anon";

grant select on table "public"."jobs" to "anon";

grant trigger on table "public"."jobs" to "anon";

grant truncate on table "public"."jobs" to "anon";

grant update on table "public"."jobs" to "anon";

grant delete on table "public"."jobs" to "authenticated";

grant insert on table "public"."jobs" to "authenticated";

grant references on table "public"."jobs" to "authenticated";

grant select on table "public"."jobs" to "authenticated";

grant trigger on table "public"."jobs" to "authenticated";

grant truncate on table "public"."jobs" to "authenticated";

grant update on table "public"."jobs" to "authenticated";

grant delete on table "public"."jobs" to "service_role";

grant insert on table "public"."jobs" to "service_role";

grant references on table "public"."jobs" to "service_role";

grant select on table "public"."jobs" to "service_role";

grant trigger on table "public"."jobs" to "service_role";

grant truncate on table "public"."jobs" to "service_role";

grant update on table "public"."jobs" to "service_role";

grant delete on table "public"."jobs_deleted" to "anon";

grant insert on table "public"."jobs_deleted" to "anon";

grant references on table "public"."jobs_deleted" to "anon";

grant select on table "public"."jobs_deleted" to "anon";

grant trigger on table "public"."jobs_deleted" to "anon";

grant truncate on table "public"."jobs_deleted" to "anon";

grant update on table "public"."jobs_deleted" to "anon";

grant delete on table "public"."jobs_deleted" to "authenticated";

grant insert on table "public"."jobs_deleted" to "authenticated";

grant references on table "public"."jobs_deleted" to "authenticated";

grant select on table "public"."jobs_deleted" to "authenticated";

grant trigger on table "public"."jobs_deleted" to "authenticated";

grant truncate on table "public"."jobs_deleted" to "authenticated";

grant update on table "public"."jobs_deleted" to "authenticated";

grant delete on table "public"."jobs_deleted" to "service_role";

grant insert on table "public"."jobs_deleted" to "service_role";

grant references on table "public"."jobs_deleted" to "service_role";

grant select on table "public"."jobs_deleted" to "service_role";

grant trigger on table "public"."jobs_deleted" to "service_role";

grant truncate on table "public"."jobs_deleted" to "service_role";

grant update on table "public"."jobs_deleted" to "service_role";

grant delete on table "public"."jobs_l" to "anon";

grant insert on table "public"."jobs_l" to "anon";

grant references on table "public"."jobs_l" to "anon";

grant select on table "public"."jobs_l" to "anon";

grant trigger on table "public"."jobs_l" to "anon";

grant truncate on table "public"."jobs_l" to "anon";

grant update on table "public"."jobs_l" to "anon";

grant delete on table "public"."jobs_l" to "authenticated";

grant insert on table "public"."jobs_l" to "authenticated";

grant references on table "public"."jobs_l" to "authenticated";

grant select on table "public"."jobs_l" to "authenticated";

grant trigger on table "public"."jobs_l" to "authenticated";

grant truncate on table "public"."jobs_l" to "authenticated";

grant update on table "public"."jobs_l" to "authenticated";

grant delete on table "public"."jobs_l" to "service_role";

grant insert on table "public"."jobs_l" to "service_role";

grant references on table "public"."jobs_l" to "service_role";

grant select on table "public"."jobs_l" to "service_role";

grant trigger on table "public"."jobs_l" to "service_role";

grant truncate on table "public"."jobs_l" to "service_role";

grant update on table "public"."jobs_l" to "service_role";

grant delete on table "public"."kg_edges" to "anon";

grant insert on table "public"."kg_edges" to "anon";

grant references on table "public"."kg_edges" to "anon";

grant select on table "public"."kg_edges" to "anon";

grant trigger on table "public"."kg_edges" to "anon";

grant truncate on table "public"."kg_edges" to "anon";

grant update on table "public"."kg_edges" to "anon";

grant delete on table "public"."kg_edges" to "authenticated";

grant insert on table "public"."kg_edges" to "authenticated";

grant references on table "public"."kg_edges" to "authenticated";

grant select on table "public"."kg_edges" to "authenticated";

grant trigger on table "public"."kg_edges" to "authenticated";

grant truncate on table "public"."kg_edges" to "authenticated";

grant update on table "public"."kg_edges" to "authenticated";

grant delete on table "public"."kg_edges" to "service_role";

grant insert on table "public"."kg_edges" to "service_role";

grant references on table "public"."kg_edges" to "service_role";

grant select on table "public"."kg_edges" to "service_role";

grant trigger on table "public"."kg_edges" to "service_role";

grant truncate on table "public"."kg_edges" to "service_role";

grant update on table "public"."kg_edges" to "service_role";

grant delete on table "public"."kg_nodes" to "anon";

grant insert on table "public"."kg_nodes" to "anon";

grant references on table "public"."kg_nodes" to "anon";

grant select on table "public"."kg_nodes" to "anon";

grant trigger on table "public"."kg_nodes" to "anon";

grant truncate on table "public"."kg_nodes" to "anon";

grant update on table "public"."kg_nodes" to "anon";

grant delete on table "public"."kg_nodes" to "authenticated";

grant insert on table "public"."kg_nodes" to "authenticated";

grant references on table "public"."kg_nodes" to "authenticated";

grant select on table "public"."kg_nodes" to "authenticated";

grant trigger on table "public"."kg_nodes" to "authenticated";

grant truncate on table "public"."kg_nodes" to "authenticated";

grant update on table "public"."kg_nodes" to "authenticated";

grant delete on table "public"."kg_nodes" to "service_role";

grant insert on table "public"."kg_nodes" to "service_role";

grant references on table "public"."kg_nodes" to "service_role";

grant select on table "public"."kg_nodes" to "service_role";

grant trigger on table "public"."kg_nodes" to "service_role";

grant truncate on table "public"."kg_nodes" to "service_role";

grant update on table "public"."kg_nodes" to "service_role";

grant delete on table "public"."kit_variants" to "anon";

grant insert on table "public"."kit_variants" to "anon";

grant references on table "public"."kit_variants" to "anon";

grant select on table "public"."kit_variants" to "anon";

grant trigger on table "public"."kit_variants" to "anon";

grant truncate on table "public"."kit_variants" to "anon";

grant update on table "public"."kit_variants" to "anon";

grant delete on table "public"."kit_variants" to "authenticated";

grant insert on table "public"."kit_variants" to "authenticated";

grant references on table "public"."kit_variants" to "authenticated";

grant select on table "public"."kit_variants" to "authenticated";

grant trigger on table "public"."kit_variants" to "authenticated";

grant truncate on table "public"."kit_variants" to "authenticated";

grant update on table "public"."kit_variants" to "authenticated";

grant delete on table "public"."kit_variants" to "service_role";

grant insert on table "public"."kit_variants" to "service_role";

grant references on table "public"."kit_variants" to "service_role";

grant select on table "public"."kit_variants" to "service_role";

grant trigger on table "public"."kit_variants" to "service_role";

grant truncate on table "public"."kit_variants" to "service_role";

grant update on table "public"."kit_variants" to "service_role";

grant delete on table "public"."mpt_phases" to "anon";

grant insert on table "public"."mpt_phases" to "anon";

grant references on table "public"."mpt_phases" to "anon";

grant select on table "public"."mpt_phases" to "anon";

grant trigger on table "public"."mpt_phases" to "anon";

grant truncate on table "public"."mpt_phases" to "anon";

grant update on table "public"."mpt_phases" to "anon";

grant delete on table "public"."mpt_phases" to "authenticated";

grant insert on table "public"."mpt_phases" to "authenticated";

grant references on table "public"."mpt_phases" to "authenticated";

grant select on table "public"."mpt_phases" to "authenticated";

grant trigger on table "public"."mpt_phases" to "authenticated";

grant truncate on table "public"."mpt_phases" to "authenticated";

grant update on table "public"."mpt_phases" to "authenticated";

grant delete on table "public"."mpt_phases" to "service_role";

grant insert on table "public"."mpt_phases" to "service_role";

grant references on table "public"."mpt_phases" to "service_role";

grant select on table "public"."mpt_phases" to "service_role";

grant trigger on table "public"."mpt_phases" to "service_role";

grant truncate on table "public"."mpt_phases" to "service_role";

grant update on table "public"."mpt_phases" to "service_role";

grant delete on table "public"."mpt_primary_signs" to "anon";

grant insert on table "public"."mpt_primary_signs" to "anon";

grant references on table "public"."mpt_primary_signs" to "anon";

grant select on table "public"."mpt_primary_signs" to "anon";

grant trigger on table "public"."mpt_primary_signs" to "anon";

grant truncate on table "public"."mpt_primary_signs" to "anon";

grant update on table "public"."mpt_primary_signs" to "anon";

grant delete on table "public"."mpt_primary_signs" to "authenticated";

grant insert on table "public"."mpt_primary_signs" to "authenticated";

grant references on table "public"."mpt_primary_signs" to "authenticated";

grant select on table "public"."mpt_primary_signs" to "authenticated";

grant trigger on table "public"."mpt_primary_signs" to "authenticated";

grant truncate on table "public"."mpt_primary_signs" to "authenticated";

grant update on table "public"."mpt_primary_signs" to "authenticated";

grant delete on table "public"."mpt_primary_signs" to "service_role";

grant insert on table "public"."mpt_primary_signs" to "service_role";

grant references on table "public"."mpt_primary_signs" to "service_role";

grant select on table "public"."mpt_primary_signs" to "service_role";

grant trigger on table "public"."mpt_primary_signs" to "service_role";

grant truncate on table "public"."mpt_primary_signs" to "service_role";

grant update on table "public"."mpt_primary_signs" to "service_role";

grant delete on table "public"."mpt_rental_entries" to "anon";

grant insert on table "public"."mpt_rental_entries" to "anon";

grant references on table "public"."mpt_rental_entries" to "anon";

grant select on table "public"."mpt_rental_entries" to "anon";

grant trigger on table "public"."mpt_rental_entries" to "anon";

grant truncate on table "public"."mpt_rental_entries" to "anon";

grant update on table "public"."mpt_rental_entries" to "anon";

grant delete on table "public"."mpt_rental_entries" to "authenticated";

grant insert on table "public"."mpt_rental_entries" to "authenticated";

grant references on table "public"."mpt_rental_entries" to "authenticated";

grant select on table "public"."mpt_rental_entries" to "authenticated";

grant trigger on table "public"."mpt_rental_entries" to "authenticated";

grant truncate on table "public"."mpt_rental_entries" to "authenticated";

grant update on table "public"."mpt_rental_entries" to "authenticated";

grant delete on table "public"."mpt_rental_entries" to "service_role";

grant insert on table "public"."mpt_rental_entries" to "service_role";

grant references on table "public"."mpt_rental_entries" to "service_role";

grant select on table "public"."mpt_rental_entries" to "service_role";

grant trigger on table "public"."mpt_rental_entries" to "service_role";

grant truncate on table "public"."mpt_rental_entries" to "service_role";

grant update on table "public"."mpt_rental_entries" to "service_role";

grant delete on table "public"."mpt_secondary_signs" to "anon";

grant insert on table "public"."mpt_secondary_signs" to "anon";

grant references on table "public"."mpt_secondary_signs" to "anon";

grant select on table "public"."mpt_secondary_signs" to "anon";

grant trigger on table "public"."mpt_secondary_signs" to "anon";

grant truncate on table "public"."mpt_secondary_signs" to "anon";

grant update on table "public"."mpt_secondary_signs" to "anon";

grant delete on table "public"."mpt_secondary_signs" to "authenticated";

grant insert on table "public"."mpt_secondary_signs" to "authenticated";

grant references on table "public"."mpt_secondary_signs" to "authenticated";

grant select on table "public"."mpt_secondary_signs" to "authenticated";

grant trigger on table "public"."mpt_secondary_signs" to "authenticated";

grant truncate on table "public"."mpt_secondary_signs" to "authenticated";

grant update on table "public"."mpt_secondary_signs" to "authenticated";

grant delete on table "public"."mpt_secondary_signs" to "service_role";

grant insert on table "public"."mpt_secondary_signs" to "service_role";

grant references on table "public"."mpt_secondary_signs" to "service_role";

grant select on table "public"."mpt_secondary_signs" to "service_role";

grant trigger on table "public"."mpt_secondary_signs" to "service_role";

grant truncate on table "public"."mpt_secondary_signs" to "service_role";

grant update on table "public"."mpt_secondary_signs" to "service_role";

grant delete on table "public"."mpt_static_equipment_info" to "anon";

grant insert on table "public"."mpt_static_equipment_info" to "anon";

grant references on table "public"."mpt_static_equipment_info" to "anon";

grant select on table "public"."mpt_static_equipment_info" to "anon";

grant trigger on table "public"."mpt_static_equipment_info" to "anon";

grant truncate on table "public"."mpt_static_equipment_info" to "anon";

grant update on table "public"."mpt_static_equipment_info" to "anon";

grant delete on table "public"."mpt_static_equipment_info" to "authenticated";

grant insert on table "public"."mpt_static_equipment_info" to "authenticated";

grant references on table "public"."mpt_static_equipment_info" to "authenticated";

grant select on table "public"."mpt_static_equipment_info" to "authenticated";

grant trigger on table "public"."mpt_static_equipment_info" to "authenticated";

grant truncate on table "public"."mpt_static_equipment_info" to "authenticated";

grant update on table "public"."mpt_static_equipment_info" to "authenticated";

grant delete on table "public"."mpt_static_equipment_info" to "service_role";

grant insert on table "public"."mpt_static_equipment_info" to "service_role";

grant references on table "public"."mpt_static_equipment_info" to "service_role";

grant select on table "public"."mpt_static_equipment_info" to "service_role";

grant trigger on table "public"."mpt_static_equipment_info" to "service_role";

grant truncate on table "public"."mpt_static_equipment_info" to "service_role";

grant update on table "public"."mpt_static_equipment_info" to "service_role";

grant delete on table "public"."mutcd_signs" to "anon";

grant insert on table "public"."mutcd_signs" to "anon";

grant references on table "public"."mutcd_signs" to "anon";

grant select on table "public"."mutcd_signs" to "anon";

grant trigger on table "public"."mutcd_signs" to "anon";

grant truncate on table "public"."mutcd_signs" to "anon";

grant update on table "public"."mutcd_signs" to "anon";

grant delete on table "public"."mutcd_signs" to "authenticated";

grant insert on table "public"."mutcd_signs" to "authenticated";

grant references on table "public"."mutcd_signs" to "authenticated";

grant select on table "public"."mutcd_signs" to "authenticated";

grant trigger on table "public"."mutcd_signs" to "authenticated";

grant truncate on table "public"."mutcd_signs" to "authenticated";

grant update on table "public"."mutcd_signs" to "authenticated";

grant delete on table "public"."mutcd_signs" to "service_role";

grant insert on table "public"."mutcd_signs" to "service_role";

grant references on table "public"."mutcd_signs" to "service_role";

grant select on table "public"."mutcd_signs" to "service_role";

grant trigger on table "public"."mutcd_signs" to "service_role";

grant truncate on table "public"."mutcd_signs" to "service_role";

grant update on table "public"."mutcd_signs" to "service_role";

grant delete on table "public"."notes" to "anon";

grant insert on table "public"."notes" to "anon";

grant references on table "public"."notes" to "anon";

grant select on table "public"."notes" to "anon";

grant trigger on table "public"."notes" to "anon";

grant truncate on table "public"."notes" to "anon";

grant update on table "public"."notes" to "anon";

grant delete on table "public"."notes" to "authenticated";

grant insert on table "public"."notes" to "authenticated";

grant references on table "public"."notes" to "authenticated";

grant select on table "public"."notes" to "authenticated";

grant trigger on table "public"."notes" to "authenticated";

grant truncate on table "public"."notes" to "authenticated";

grant update on table "public"."notes" to "authenticated";

grant delete on table "public"."notes" to "service_role";

grant insert on table "public"."notes" to "service_role";

grant references on table "public"."notes" to "service_role";

grant select on table "public"."notes" to "service_role";

grant trigger on table "public"."notes" to "service_role";

grant truncate on table "public"."notes" to "service_role";

grant update on table "public"."notes" to "service_role";

grant delete on table "public"."owners" to "anon";

grant insert on table "public"."owners" to "anon";

grant references on table "public"."owners" to "anon";

grant select on table "public"."owners" to "anon";

grant trigger on table "public"."owners" to "anon";

grant truncate on table "public"."owners" to "anon";

grant update on table "public"."owners" to "anon";

grant delete on table "public"."owners" to "authenticated";

grant insert on table "public"."owners" to "authenticated";

grant references on table "public"."owners" to "authenticated";

grant select on table "public"."owners" to "authenticated";

grant trigger on table "public"."owners" to "authenticated";

grant truncate on table "public"."owners" to "authenticated";

grant update on table "public"."owners" to "authenticated";

grant delete on table "public"."owners" to "service_role";

grant insert on table "public"."owners" to "service_role";

grant references on table "public"."owners" to "service_role";

grant select on table "public"."owners" to "service_role";

grant trigger on table "public"."owners" to "service_role";

grant truncate on table "public"."owners" to "service_role";

grant update on table "public"."owners" to "service_role";

grant delete on table "public"."pata_kit_contents" to "anon";

grant insert on table "public"."pata_kit_contents" to "anon";

grant references on table "public"."pata_kit_contents" to "anon";

grant select on table "public"."pata_kit_contents" to "anon";

grant trigger on table "public"."pata_kit_contents" to "anon";

grant truncate on table "public"."pata_kit_contents" to "anon";

grant update on table "public"."pata_kit_contents" to "anon";

grant delete on table "public"."pata_kit_contents" to "authenticated";

grant insert on table "public"."pata_kit_contents" to "authenticated";

grant references on table "public"."pata_kit_contents" to "authenticated";

grant select on table "public"."pata_kit_contents" to "authenticated";

grant trigger on table "public"."pata_kit_contents" to "authenticated";

grant truncate on table "public"."pata_kit_contents" to "authenticated";

grant update on table "public"."pata_kit_contents" to "authenticated";

grant delete on table "public"."pata_kit_contents" to "service_role";

grant insert on table "public"."pata_kit_contents" to "service_role";

grant references on table "public"."pata_kit_contents" to "service_role";

grant select on table "public"."pata_kit_contents" to "service_role";

grant trigger on table "public"."pata_kit_contents" to "service_role";

grant truncate on table "public"."pata_kit_contents" to "service_role";

grant update on table "public"."pata_kit_contents" to "service_role";

grant delete on table "public"."pata_kits" to "anon";

grant insert on table "public"."pata_kits" to "anon";

grant references on table "public"."pata_kits" to "anon";

grant select on table "public"."pata_kits" to "anon";

grant trigger on table "public"."pata_kits" to "anon";

grant truncate on table "public"."pata_kits" to "anon";

grant update on table "public"."pata_kits" to "anon";

grant delete on table "public"."pata_kits" to "authenticated";

grant insert on table "public"."pata_kits" to "authenticated";

grant references on table "public"."pata_kits" to "authenticated";

grant select on table "public"."pata_kits" to "authenticated";

grant trigger on table "public"."pata_kits" to "authenticated";

grant truncate on table "public"."pata_kits" to "authenticated";

grant update on table "public"."pata_kits" to "authenticated";

grant delete on table "public"."pata_kits" to "service_role";

grant insert on table "public"."pata_kits" to "service_role";

grant references on table "public"."pata_kits" to "service_role";

grant select on table "public"."pata_kits" to "service_role";

grant trigger on table "public"."pata_kits" to "service_role";

grant truncate on table "public"."pata_kits" to "service_role";

grant update on table "public"."pata_kits" to "service_role";

grant delete on table "public"."permanent_sign_items" to "anon";

grant insert on table "public"."permanent_sign_items" to "anon";

grant references on table "public"."permanent_sign_items" to "anon";

grant select on table "public"."permanent_sign_items" to "anon";

grant trigger on table "public"."permanent_sign_items" to "anon";

grant truncate on table "public"."permanent_sign_items" to "anon";

grant update on table "public"."permanent_sign_items" to "anon";

grant delete on table "public"."permanent_sign_items" to "authenticated";

grant insert on table "public"."permanent_sign_items" to "authenticated";

grant references on table "public"."permanent_sign_items" to "authenticated";

grant select on table "public"."permanent_sign_items" to "authenticated";

grant trigger on table "public"."permanent_sign_items" to "authenticated";

grant truncate on table "public"."permanent_sign_items" to "authenticated";

grant update on table "public"."permanent_sign_items" to "authenticated";

grant delete on table "public"."permanent_sign_items" to "service_role";

grant insert on table "public"."permanent_sign_items" to "service_role";

grant references on table "public"."permanent_sign_items" to "service_role";

grant select on table "public"."permanent_sign_items" to "service_role";

grant trigger on table "public"."permanent_sign_items" to "service_role";

grant truncate on table "public"."permanent_sign_items" to "service_role";

grant update on table "public"."permanent_sign_items" to "service_role";

grant delete on table "public"."permanent_signs" to "anon";

grant insert on table "public"."permanent_signs" to "anon";

grant references on table "public"."permanent_signs" to "anon";

grant select on table "public"."permanent_signs" to "anon";

grant trigger on table "public"."permanent_signs" to "anon";

grant truncate on table "public"."permanent_signs" to "anon";

grant update on table "public"."permanent_signs" to "anon";

grant delete on table "public"."permanent_signs" to "authenticated";

grant insert on table "public"."permanent_signs" to "authenticated";

grant references on table "public"."permanent_signs" to "authenticated";

grant select on table "public"."permanent_signs" to "authenticated";

grant trigger on table "public"."permanent_signs" to "authenticated";

grant truncate on table "public"."permanent_signs" to "authenticated";

grant update on table "public"."permanent_signs" to "authenticated";

grant delete on table "public"."permanent_signs" to "service_role";

grant insert on table "public"."permanent_signs" to "service_role";

grant references on table "public"."permanent_signs" to "service_role";

grant select on table "public"."permanent_signs" to "service_role";

grant trigger on table "public"."permanent_signs" to "service_role";

grant truncate on table "public"."permanent_signs" to "service_role";

grant update on table "public"."permanent_signs" to "service_role";

grant delete on table "public"."permanent_signs_entries" to "anon";

grant insert on table "public"."permanent_signs_entries" to "anon";

grant references on table "public"."permanent_signs_entries" to "anon";

grant select on table "public"."permanent_signs_entries" to "anon";

grant trigger on table "public"."permanent_signs_entries" to "anon";

grant truncate on table "public"."permanent_signs_entries" to "anon";

grant update on table "public"."permanent_signs_entries" to "anon";

grant delete on table "public"."permanent_signs_entries" to "authenticated";

grant insert on table "public"."permanent_signs_entries" to "authenticated";

grant references on table "public"."permanent_signs_entries" to "authenticated";

grant select on table "public"."permanent_signs_entries" to "authenticated";

grant trigger on table "public"."permanent_signs_entries" to "authenticated";

grant truncate on table "public"."permanent_signs_entries" to "authenticated";

grant update on table "public"."permanent_signs_entries" to "authenticated";

grant delete on table "public"."permanent_signs_entries" to "service_role";

grant insert on table "public"."permanent_signs_entries" to "service_role";

grant references on table "public"."permanent_signs_entries" to "service_role";

grant select on table "public"."permanent_signs_entries" to "service_role";

grant trigger on table "public"."permanent_signs_entries" to "service_role";

grant truncate on table "public"."permanent_signs_entries" to "service_role";

grant update on table "public"."permanent_signs_entries" to "service_role";

grant delete on table "public"."pickup_takeoff_items_l" to "anon";

grant insert on table "public"."pickup_takeoff_items_l" to "anon";

grant references on table "public"."pickup_takeoff_items_l" to "anon";

grant select on table "public"."pickup_takeoff_items_l" to "anon";

grant trigger on table "public"."pickup_takeoff_items_l" to "anon";

grant truncate on table "public"."pickup_takeoff_items_l" to "anon";

grant update on table "public"."pickup_takeoff_items_l" to "anon";

grant delete on table "public"."pickup_takeoff_items_l" to "authenticated";

grant insert on table "public"."pickup_takeoff_items_l" to "authenticated";

grant references on table "public"."pickup_takeoff_items_l" to "authenticated";

grant select on table "public"."pickup_takeoff_items_l" to "authenticated";

grant trigger on table "public"."pickup_takeoff_items_l" to "authenticated";

grant truncate on table "public"."pickup_takeoff_items_l" to "authenticated";

grant update on table "public"."pickup_takeoff_items_l" to "authenticated";

grant delete on table "public"."pickup_takeoff_items_l" to "service_role";

grant insert on table "public"."pickup_takeoff_items_l" to "service_role";

grant references on table "public"."pickup_takeoff_items_l" to "service_role";

grant select on table "public"."pickup_takeoff_items_l" to "service_role";

grant trigger on table "public"."pickup_takeoff_items_l" to "service_role";

grant truncate on table "public"."pickup_takeoff_items_l" to "service_role";

grant update on table "public"."pickup_takeoff_items_l" to "service_role";

grant delete on table "public"."pickup_takeoffs_l" to "anon";

grant insert on table "public"."pickup_takeoffs_l" to "anon";

grant references on table "public"."pickup_takeoffs_l" to "anon";

grant select on table "public"."pickup_takeoffs_l" to "anon";

grant trigger on table "public"."pickup_takeoffs_l" to "anon";

grant truncate on table "public"."pickup_takeoffs_l" to "anon";

grant update on table "public"."pickup_takeoffs_l" to "anon";

grant delete on table "public"."pickup_takeoffs_l" to "authenticated";

grant insert on table "public"."pickup_takeoffs_l" to "authenticated";

grant references on table "public"."pickup_takeoffs_l" to "authenticated";

grant select on table "public"."pickup_takeoffs_l" to "authenticated";

grant trigger on table "public"."pickup_takeoffs_l" to "authenticated";

grant truncate on table "public"."pickup_takeoffs_l" to "authenticated";

grant update on table "public"."pickup_takeoffs_l" to "authenticated";

grant delete on table "public"."pickup_takeoffs_l" to "service_role";

grant insert on table "public"."pickup_takeoffs_l" to "service_role";

grant references on table "public"."pickup_takeoffs_l" to "service_role";

grant select on table "public"."pickup_takeoffs_l" to "service_role";

grant trigger on table "public"."pickup_takeoffs_l" to "service_role";

grant truncate on table "public"."pickup_takeoffs_l" to "service_role";

grant update on table "public"."pickup_takeoffs_l" to "service_role";

grant delete on table "public"."pickup_work_orders_l" to "anon";

grant insert on table "public"."pickup_work_orders_l" to "anon";

grant references on table "public"."pickup_work_orders_l" to "anon";

grant select on table "public"."pickup_work_orders_l" to "anon";

grant trigger on table "public"."pickup_work_orders_l" to "anon";

grant truncate on table "public"."pickup_work_orders_l" to "anon";

grant update on table "public"."pickup_work_orders_l" to "anon";

grant delete on table "public"."pickup_work_orders_l" to "authenticated";

grant insert on table "public"."pickup_work_orders_l" to "authenticated";

grant references on table "public"."pickup_work_orders_l" to "authenticated";

grant select on table "public"."pickup_work_orders_l" to "authenticated";

grant trigger on table "public"."pickup_work_orders_l" to "authenticated";

grant truncate on table "public"."pickup_work_orders_l" to "authenticated";

grant update on table "public"."pickup_work_orders_l" to "authenticated";

grant delete on table "public"."pickup_work_orders_l" to "service_role";

grant insert on table "public"."pickup_work_orders_l" to "service_role";

grant references on table "public"."pickup_work_orders_l" to "service_role";

grant select on table "public"."pickup_work_orders_l" to "service_role";

grant trigger on table "public"."pickup_work_orders_l" to "service_role";

grant truncate on table "public"."pickup_work_orders_l" to "service_role";

grant update on table "public"."pickup_work_orders_l" to "service_role";

grant delete on table "public"."productivity_rates" to "anon";

grant insert on table "public"."productivity_rates" to "anon";

grant references on table "public"."productivity_rates" to "anon";

grant select on table "public"."productivity_rates" to "anon";

grant trigger on table "public"."productivity_rates" to "anon";

grant truncate on table "public"."productivity_rates" to "anon";

grant update on table "public"."productivity_rates" to "anon";

grant delete on table "public"."productivity_rates" to "authenticated";

grant insert on table "public"."productivity_rates" to "authenticated";

grant references on table "public"."productivity_rates" to "authenticated";

grant select on table "public"."productivity_rates" to "authenticated";

grant trigger on table "public"."productivity_rates" to "authenticated";

grant truncate on table "public"."productivity_rates" to "authenticated";

grant update on table "public"."productivity_rates" to "authenticated";

grant delete on table "public"."productivity_rates" to "service_role";

grant insert on table "public"."productivity_rates" to "service_role";

grant references on table "public"."productivity_rates" to "service_role";

grant select on table "public"."productivity_rates" to "service_role";

grant trigger on table "public"."productivity_rates" to "service_role";

grant truncate on table "public"."productivity_rates" to "service_role";

grant update on table "public"."productivity_rates" to "service_role";

grant delete on table "public"."project_managers" to "anon";

grant insert on table "public"."project_managers" to "anon";

grant references on table "public"."project_managers" to "anon";

grant select on table "public"."project_managers" to "anon";

grant trigger on table "public"."project_managers" to "anon";

grant truncate on table "public"."project_managers" to "anon";

grant update on table "public"."project_managers" to "anon";

grant delete on table "public"."project_managers" to "authenticated";

grant insert on table "public"."project_managers" to "authenticated";

grant references on table "public"."project_managers" to "authenticated";

grant select on table "public"."project_managers" to "authenticated";

grant trigger on table "public"."project_managers" to "authenticated";

grant truncate on table "public"."project_managers" to "authenticated";

grant update on table "public"."project_managers" to "authenticated";

grant delete on table "public"."project_managers" to "service_role";

grant insert on table "public"."project_managers" to "service_role";

grant references on table "public"."project_managers" to "service_role";

grant select on table "public"."project_managers" to "service_role";

grant trigger on table "public"."project_managers" to "service_role";

grant truncate on table "public"."project_managers" to "service_role";

grant update on table "public"."project_managers" to "service_role";

grant delete on table "public"."project_metadata" to "anon";

grant insert on table "public"."project_metadata" to "anon";

grant references on table "public"."project_metadata" to "anon";

grant select on table "public"."project_metadata" to "anon";

grant trigger on table "public"."project_metadata" to "anon";

grant truncate on table "public"."project_metadata" to "anon";

grant update on table "public"."project_metadata" to "anon";

grant delete on table "public"."project_metadata" to "authenticated";

grant insert on table "public"."project_metadata" to "authenticated";

grant references on table "public"."project_metadata" to "authenticated";

grant select on table "public"."project_metadata" to "authenticated";

grant trigger on table "public"."project_metadata" to "authenticated";

grant truncate on table "public"."project_metadata" to "authenticated";

grant update on table "public"."project_metadata" to "authenticated";

grant delete on table "public"."project_metadata" to "service_role";

grant insert on table "public"."project_metadata" to "service_role";

grant references on table "public"."project_metadata" to "service_role";

grant select on table "public"."project_metadata" to "service_role";

grant trigger on table "public"."project_metadata" to "service_role";

grant truncate on table "public"."project_metadata" to "service_role";

grant update on table "public"."project_metadata" to "service_role";

grant delete on table "public"."pts_kit_contents" to "anon";

grant insert on table "public"."pts_kit_contents" to "anon";

grant references on table "public"."pts_kit_contents" to "anon";

grant select on table "public"."pts_kit_contents" to "anon";

grant trigger on table "public"."pts_kit_contents" to "anon";

grant truncate on table "public"."pts_kit_contents" to "anon";

grant update on table "public"."pts_kit_contents" to "anon";

grant delete on table "public"."pts_kit_contents" to "authenticated";

grant insert on table "public"."pts_kit_contents" to "authenticated";

grant references on table "public"."pts_kit_contents" to "authenticated";

grant select on table "public"."pts_kit_contents" to "authenticated";

grant trigger on table "public"."pts_kit_contents" to "authenticated";

grant truncate on table "public"."pts_kit_contents" to "authenticated";

grant update on table "public"."pts_kit_contents" to "authenticated";

grant delete on table "public"."pts_kit_contents" to "service_role";

grant insert on table "public"."pts_kit_contents" to "service_role";

grant references on table "public"."pts_kit_contents" to "service_role";

grant select on table "public"."pts_kit_contents" to "service_role";

grant trigger on table "public"."pts_kit_contents" to "service_role";

grant truncate on table "public"."pts_kit_contents" to "service_role";

grant update on table "public"."pts_kit_contents" to "service_role";

grant delete on table "public"."pts_kits" to "anon";

grant insert on table "public"."pts_kits" to "anon";

grant references on table "public"."pts_kits" to "anon";

grant select on table "public"."pts_kits" to "anon";

grant trigger on table "public"."pts_kits" to "anon";

grant truncate on table "public"."pts_kits" to "anon";

grant update on table "public"."pts_kits" to "anon";

grant delete on table "public"."pts_kits" to "authenticated";

grant insert on table "public"."pts_kits" to "authenticated";

grant references on table "public"."pts_kits" to "authenticated";

grant select on table "public"."pts_kits" to "authenticated";

grant trigger on table "public"."pts_kits" to "authenticated";

grant truncate on table "public"."pts_kits" to "authenticated";

grant update on table "public"."pts_kits" to "authenticated";

grant delete on table "public"."pts_kits" to "service_role";

grant insert on table "public"."pts_kits" to "service_role";

grant references on table "public"."pts_kits" to "service_role";

grant select on table "public"."pts_kits" to "service_role";

grant trigger on table "public"."pts_kits" to "service_role";

grant truncate on table "public"."pts_kits" to "service_role";

grant update on table "public"."pts_kits" to "service_role";

grant delete on table "public"."quote_items" to "anon";

grant insert on table "public"."quote_items" to "anon";

grant references on table "public"."quote_items" to "anon";

grant select on table "public"."quote_items" to "anon";

grant trigger on table "public"."quote_items" to "anon";

grant truncate on table "public"."quote_items" to "anon";

grant update on table "public"."quote_items" to "anon";

grant delete on table "public"."quote_items" to "authenticated";

grant insert on table "public"."quote_items" to "authenticated";

grant references on table "public"."quote_items" to "authenticated";

grant select on table "public"."quote_items" to "authenticated";

grant trigger on table "public"."quote_items" to "authenticated";

grant truncate on table "public"."quote_items" to "authenticated";

grant update on table "public"."quote_items" to "authenticated";

grant delete on table "public"."quote_items" to "service_role";

grant insert on table "public"."quote_items" to "service_role";

grant references on table "public"."quote_items" to "service_role";

grant select on table "public"."quote_items" to "service_role";

grant trigger on table "public"."quote_items" to "service_role";

grant truncate on table "public"."quote_items" to "service_role";

grant update on table "public"."quote_items" to "service_role";

grant delete on table "public"."quote_recipients" to "anon";

grant insert on table "public"."quote_recipients" to "anon";

grant references on table "public"."quote_recipients" to "anon";

grant select on table "public"."quote_recipients" to "anon";

grant trigger on table "public"."quote_recipients" to "anon";

grant truncate on table "public"."quote_recipients" to "anon";

grant update on table "public"."quote_recipients" to "anon";

grant delete on table "public"."quote_recipients" to "authenticated";

grant insert on table "public"."quote_recipients" to "authenticated";

grant references on table "public"."quote_recipients" to "authenticated";

grant select on table "public"."quote_recipients" to "authenticated";

grant trigger on table "public"."quote_recipients" to "authenticated";

grant truncate on table "public"."quote_recipients" to "authenticated";

grant update on table "public"."quote_recipients" to "authenticated";

grant delete on table "public"."quote_recipients" to "service_role";

grant insert on table "public"."quote_recipients" to "service_role";

grant references on table "public"."quote_recipients" to "service_role";

grant select on table "public"."quote_recipients" to "service_role";

grant trigger on table "public"."quote_recipients" to "service_role";

grant truncate on table "public"."quote_recipients" to "service_role";

grant update on table "public"."quote_recipients" to "service_role";

grant delete on table "public"."quote_sequential_numbers" to "anon";

grant insert on table "public"."quote_sequential_numbers" to "anon";

grant references on table "public"."quote_sequential_numbers" to "anon";

grant select on table "public"."quote_sequential_numbers" to "anon";

grant trigger on table "public"."quote_sequential_numbers" to "anon";

grant truncate on table "public"."quote_sequential_numbers" to "anon";

grant update on table "public"."quote_sequential_numbers" to "anon";

grant delete on table "public"."quote_sequential_numbers" to "authenticated";

grant insert on table "public"."quote_sequential_numbers" to "authenticated";

grant references on table "public"."quote_sequential_numbers" to "authenticated";

grant select on table "public"."quote_sequential_numbers" to "authenticated";

grant trigger on table "public"."quote_sequential_numbers" to "authenticated";

grant truncate on table "public"."quote_sequential_numbers" to "authenticated";

grant update on table "public"."quote_sequential_numbers" to "authenticated";

grant delete on table "public"."quote_sequential_numbers" to "service_role";

grant insert on table "public"."quote_sequential_numbers" to "service_role";

grant references on table "public"."quote_sequential_numbers" to "service_role";

grant select on table "public"."quote_sequential_numbers" to "service_role";

grant trigger on table "public"."quote_sequential_numbers" to "service_role";

grant truncate on table "public"."quote_sequential_numbers" to "service_role";

grant update on table "public"."quote_sequential_numbers" to "service_role";

grant delete on table "public"."quotes" to "anon";

grant insert on table "public"."quotes" to "anon";

grant references on table "public"."quotes" to "anon";

grant select on table "public"."quotes" to "anon";

grant trigger on table "public"."quotes" to "anon";

grant truncate on table "public"."quotes" to "anon";

grant update on table "public"."quotes" to "anon";

grant delete on table "public"."quotes" to "authenticated";

grant insert on table "public"."quotes" to "authenticated";

grant references on table "public"."quotes" to "authenticated";

grant select on table "public"."quotes" to "authenticated";

grant trigger on table "public"."quotes" to "authenticated";

grant truncate on table "public"."quotes" to "authenticated";

grant update on table "public"."quotes" to "authenticated";

grant delete on table "public"."quotes" to "service_role";

grant insert on table "public"."quotes" to "service_role";

grant references on table "public"."quotes" to "service_role";

grant select on table "public"."quotes" to "service_role";

grant trigger on table "public"."quotes" to "service_role";

grant truncate on table "public"."quotes" to "service_role";

grant update on table "public"."quotes" to "service_role";

grant delete on table "public"."quotes_customers" to "anon";

grant insert on table "public"."quotes_customers" to "anon";

grant references on table "public"."quotes_customers" to "anon";

grant select on table "public"."quotes_customers" to "anon";

grant trigger on table "public"."quotes_customers" to "anon";

grant truncate on table "public"."quotes_customers" to "anon";

grant update on table "public"."quotes_customers" to "anon";

grant delete on table "public"."quotes_customers" to "authenticated";

grant insert on table "public"."quotes_customers" to "authenticated";

grant references on table "public"."quotes_customers" to "authenticated";

grant select on table "public"."quotes_customers" to "authenticated";

grant trigger on table "public"."quotes_customers" to "authenticated";

grant truncate on table "public"."quotes_customers" to "authenticated";

grant update on table "public"."quotes_customers" to "authenticated";

grant delete on table "public"."quotes_customers" to "service_role";

grant insert on table "public"."quotes_customers" to "service_role";

grant references on table "public"."quotes_customers" to "service_role";

grant select on table "public"."quotes_customers" to "service_role";

grant trigger on table "public"."quotes_customers" to "service_role";

grant truncate on table "public"."quotes_customers" to "service_role";

grant update on table "public"."quotes_customers" to "service_role";

grant delete on table "public"."rental_items" to "anon";

grant insert on table "public"."rental_items" to "anon";

grant references on table "public"."rental_items" to "anon";

grant select on table "public"."rental_items" to "anon";

grant trigger on table "public"."rental_items" to "anon";

grant truncate on table "public"."rental_items" to "anon";

grant update on table "public"."rental_items" to "anon";

grant delete on table "public"."rental_items" to "authenticated";

grant insert on table "public"."rental_items" to "authenticated";

grant references on table "public"."rental_items" to "authenticated";

grant select on table "public"."rental_items" to "authenticated";

grant trigger on table "public"."rental_items" to "authenticated";

grant truncate on table "public"."rental_items" to "authenticated";

grant update on table "public"."rental_items" to "authenticated";

grant delete on table "public"."rental_items" to "service_role";

grant insert on table "public"."rental_items" to "service_role";

grant references on table "public"."rental_items" to "service_role";

grant select on table "public"."rental_items" to "service_role";

grant trigger on table "public"."rental_items" to "service_role";

grant truncate on table "public"."rental_items" to "service_role";

grant update on table "public"."rental_items" to "service_role";

grant delete on table "public"."sale_item_entries" to "anon";

grant insert on table "public"."sale_item_entries" to "anon";

grant references on table "public"."sale_item_entries" to "anon";

grant select on table "public"."sale_item_entries" to "anon";

grant trigger on table "public"."sale_item_entries" to "anon";

grant truncate on table "public"."sale_item_entries" to "anon";

grant update on table "public"."sale_item_entries" to "anon";

grant delete on table "public"."sale_item_entries" to "authenticated";

grant insert on table "public"."sale_item_entries" to "authenticated";

grant references on table "public"."sale_item_entries" to "authenticated";

grant select on table "public"."sale_item_entries" to "authenticated";

grant trigger on table "public"."sale_item_entries" to "authenticated";

grant truncate on table "public"."sale_item_entries" to "authenticated";

grant update on table "public"."sale_item_entries" to "authenticated";

grant delete on table "public"."sale_item_entries" to "service_role";

grant insert on table "public"."sale_item_entries" to "service_role";

grant references on table "public"."sale_item_entries" to "service_role";

grant select on table "public"."sale_item_entries" to "service_role";

grant trigger on table "public"."sale_item_entries" to "service_role";

grant truncate on table "public"."sale_item_entries" to "service_role";

grant update on table "public"."sale_item_entries" to "service_role";

grant delete on table "public"."sale_items" to "anon";

grant insert on table "public"."sale_items" to "anon";

grant references on table "public"."sale_items" to "anon";

grant select on table "public"."sale_items" to "anon";

grant trigger on table "public"."sale_items" to "anon";

grant truncate on table "public"."sale_items" to "anon";

grant update on table "public"."sale_items" to "anon";

grant delete on table "public"."sale_items" to "authenticated";

grant insert on table "public"."sale_items" to "authenticated";

grant references on table "public"."sale_items" to "authenticated";

grant select on table "public"."sale_items" to "authenticated";

grant trigger on table "public"."sale_items" to "authenticated";

grant truncate on table "public"."sale_items" to "authenticated";

grant update on table "public"."sale_items" to "authenticated";

grant delete on table "public"."sale_items" to "service_role";

grant insert on table "public"."sale_items" to "service_role";

grant references on table "public"."sale_items" to "service_role";

grant select on table "public"."sale_items" to "service_role";

grant trigger on table "public"."sale_items" to "service_role";

grant truncate on table "public"."sale_items" to "service_role";

grant update on table "public"."sale_items" to "service_role";

grant delete on table "public"."service_work_entries" to "anon";

grant insert on table "public"."service_work_entries" to "anon";

grant references on table "public"."service_work_entries" to "anon";

grant select on table "public"."service_work_entries" to "anon";

grant trigger on table "public"."service_work_entries" to "anon";

grant truncate on table "public"."service_work_entries" to "anon";

grant update on table "public"."service_work_entries" to "anon";

grant delete on table "public"."service_work_entries" to "authenticated";

grant insert on table "public"."service_work_entries" to "authenticated";

grant references on table "public"."service_work_entries" to "authenticated";

grant select on table "public"."service_work_entries" to "authenticated";

grant trigger on table "public"."service_work_entries" to "authenticated";

grant truncate on table "public"."service_work_entries" to "authenticated";

grant update on table "public"."service_work_entries" to "authenticated";

grant delete on table "public"."service_work_entries" to "service_role";

grant insert on table "public"."service_work_entries" to "service_role";

grant references on table "public"."service_work_entries" to "service_role";

grant select on table "public"."service_work_entries" to "service_role";

grant trigger on table "public"."service_work_entries" to "service_role";

grant truncate on table "public"."service_work_entries" to "service_role";

grant update on table "public"."service_work_entries" to "service_role";

grant delete on table "public"."sign_designations" to "anon";

grant insert on table "public"."sign_designations" to "anon";

grant references on table "public"."sign_designations" to "anon";

grant select on table "public"."sign_designations" to "anon";

grant trigger on table "public"."sign_designations" to "anon";

grant truncate on table "public"."sign_designations" to "anon";

grant update on table "public"."sign_designations" to "anon";

grant delete on table "public"."sign_designations" to "authenticated";

grant insert on table "public"."sign_designations" to "authenticated";

grant references on table "public"."sign_designations" to "authenticated";

grant select on table "public"."sign_designations" to "authenticated";

grant trigger on table "public"."sign_designations" to "authenticated";

grant truncate on table "public"."sign_designations" to "authenticated";

grant update on table "public"."sign_designations" to "authenticated";

grant delete on table "public"."sign_designations" to "service_role";

grant insert on table "public"."sign_designations" to "service_role";

grant references on table "public"."sign_designations" to "service_role";

grant select on table "public"."sign_designations" to "service_role";

grant trigger on table "public"."sign_designations" to "service_role";

grant truncate on table "public"."sign_designations" to "service_role";

grant update on table "public"."sign_designations" to "service_role";

grant delete on table "public"."sign_dimension_options" to "anon";

grant insert on table "public"."sign_dimension_options" to "anon";

grant references on table "public"."sign_dimension_options" to "anon";

grant select on table "public"."sign_dimension_options" to "anon";

grant trigger on table "public"."sign_dimension_options" to "anon";

grant truncate on table "public"."sign_dimension_options" to "anon";

grant update on table "public"."sign_dimension_options" to "anon";

grant delete on table "public"."sign_dimension_options" to "authenticated";

grant insert on table "public"."sign_dimension_options" to "authenticated";

grant references on table "public"."sign_dimension_options" to "authenticated";

grant select on table "public"."sign_dimension_options" to "authenticated";

grant trigger on table "public"."sign_dimension_options" to "authenticated";

grant truncate on table "public"."sign_dimension_options" to "authenticated";

grant update on table "public"."sign_dimension_options" to "authenticated";

grant delete on table "public"."sign_dimension_options" to "service_role";

grant insert on table "public"."sign_dimension_options" to "service_role";

grant references on table "public"."sign_dimension_options" to "service_role";

grant select on table "public"."sign_dimension_options" to "service_role";

grant trigger on table "public"."sign_dimension_options" to "service_role";

grant truncate on table "public"."sign_dimension_options" to "service_role";

grant update on table "public"."sign_dimension_options" to "service_role";

grant delete on table "public"."sign_dimensions" to "anon";

grant insert on table "public"."sign_dimensions" to "anon";

grant references on table "public"."sign_dimensions" to "anon";

grant select on table "public"."sign_dimensions" to "anon";

grant trigger on table "public"."sign_dimensions" to "anon";

grant truncate on table "public"."sign_dimensions" to "anon";

grant update on table "public"."sign_dimensions" to "anon";

grant delete on table "public"."sign_dimensions" to "authenticated";

grant insert on table "public"."sign_dimensions" to "authenticated";

grant references on table "public"."sign_dimensions" to "authenticated";

grant select on table "public"."sign_dimensions" to "authenticated";

grant trigger on table "public"."sign_dimensions" to "authenticated";

grant truncate on table "public"."sign_dimensions" to "authenticated";

grant update on table "public"."sign_dimensions" to "authenticated";

grant delete on table "public"."sign_dimensions" to "service_role";

grant insert on table "public"."sign_dimensions" to "service_role";

grant references on table "public"."sign_dimensions" to "service_role";

grant select on table "public"."sign_dimensions" to "service_role";

grant trigger on table "public"."sign_dimensions" to "service_role";

grant truncate on table "public"."sign_dimensions" to "service_role";

grant update on table "public"."sign_dimensions" to "service_role";

grant delete on table "public"."sign_dimensions_2" to "anon";

grant insert on table "public"."sign_dimensions_2" to "anon";

grant references on table "public"."sign_dimensions_2" to "anon";

grant select on table "public"."sign_dimensions_2" to "anon";

grant trigger on table "public"."sign_dimensions_2" to "anon";

grant truncate on table "public"."sign_dimensions_2" to "anon";

grant update on table "public"."sign_dimensions_2" to "anon";

grant delete on table "public"."sign_dimensions_2" to "authenticated";

grant insert on table "public"."sign_dimensions_2" to "authenticated";

grant references on table "public"."sign_dimensions_2" to "authenticated";

grant select on table "public"."sign_dimensions_2" to "authenticated";

grant trigger on table "public"."sign_dimensions_2" to "authenticated";

grant truncate on table "public"."sign_dimensions_2" to "authenticated";

grant update on table "public"."sign_dimensions_2" to "authenticated";

grant delete on table "public"."sign_dimensions_2" to "service_role";

grant insert on table "public"."sign_dimensions_2" to "service_role";

grant references on table "public"."sign_dimensions_2" to "service_role";

grant select on table "public"."sign_dimensions_2" to "service_role";

grant trigger on table "public"."sign_dimensions_2" to "service_role";

grant truncate on table "public"."sign_dimensions_2" to "service_role";

grant update on table "public"."sign_dimensions_2" to "service_role";

grant delete on table "public"."sign_orders" to "anon";

grant insert on table "public"."sign_orders" to "anon";

grant references on table "public"."sign_orders" to "anon";

grant select on table "public"."sign_orders" to "anon";

grant trigger on table "public"."sign_orders" to "anon";

grant truncate on table "public"."sign_orders" to "anon";

grant update on table "public"."sign_orders" to "anon";

grant delete on table "public"."sign_orders" to "authenticated";

grant insert on table "public"."sign_orders" to "authenticated";

grant references on table "public"."sign_orders" to "authenticated";

grant select on table "public"."sign_orders" to "authenticated";

grant trigger on table "public"."sign_orders" to "authenticated";

grant truncate on table "public"."sign_orders" to "authenticated";

grant update on table "public"."sign_orders" to "authenticated";

grant delete on table "public"."sign_orders" to "service_role";

grant insert on table "public"."sign_orders" to "service_role";

grant references on table "public"."sign_orders" to "service_role";

grant select on table "public"."sign_orders" to "service_role";

grant trigger on table "public"."sign_orders" to "service_role";

grant truncate on table "public"."sign_orders" to "service_role";

grant update on table "public"."sign_orders" to "service_role";

grant delete on table "public"."sign_production" to "anon";

grant insert on table "public"."sign_production" to "anon";

grant references on table "public"."sign_production" to "anon";

grant select on table "public"."sign_production" to "anon";

grant trigger on table "public"."sign_production" to "anon";

grant truncate on table "public"."sign_production" to "anon";

grant update on table "public"."sign_production" to "anon";

grant delete on table "public"."sign_production" to "authenticated";

grant insert on table "public"."sign_production" to "authenticated";

grant references on table "public"."sign_production" to "authenticated";

grant select on table "public"."sign_production" to "authenticated";

grant trigger on table "public"."sign_production" to "authenticated";

grant truncate on table "public"."sign_production" to "authenticated";

grant update on table "public"."sign_production" to "authenticated";

grant delete on table "public"."sign_production" to "service_role";

grant insert on table "public"."sign_production" to "service_role";

grant references on table "public"."sign_production" to "service_role";

grant select on table "public"."sign_production" to "service_role";

grant trigger on table "public"."sign_production" to "service_role";

grant truncate on table "public"."sign_production" to "service_role";

grant update on table "public"."sign_production" to "service_role";

grant delete on table "public"."signs_all" to "anon";

grant insert on table "public"."signs_all" to "anon";

grant references on table "public"."signs_all" to "anon";

grant select on table "public"."signs_all" to "anon";

grant trigger on table "public"."signs_all" to "anon";

grant truncate on table "public"."signs_all" to "anon";

grant update on table "public"."signs_all" to "anon";

grant delete on table "public"."signs_all" to "authenticated";

grant insert on table "public"."signs_all" to "authenticated";

grant references on table "public"."signs_all" to "authenticated";

grant select on table "public"."signs_all" to "authenticated";

grant trigger on table "public"."signs_all" to "authenticated";

grant truncate on table "public"."signs_all" to "authenticated";

grant update on table "public"."signs_all" to "authenticated";

grant delete on table "public"."signs_all" to "service_role";

grant insert on table "public"."signs_all" to "service_role";

grant references on table "public"."signs_all" to "service_role";

grant select on table "public"."signs_all" to "service_role";

grant trigger on table "public"."signs_all" to "service_role";

grant truncate on table "public"."signs_all" to "service_role";

grant update on table "public"."signs_all" to "service_role";

grant delete on table "public"."sov_entries" to "anon";

grant insert on table "public"."sov_entries" to "anon";

grant references on table "public"."sov_entries" to "anon";

grant select on table "public"."sov_entries" to "anon";

grant trigger on table "public"."sov_entries" to "anon";

grant truncate on table "public"."sov_entries" to "anon";

grant update on table "public"."sov_entries" to "anon";

grant delete on table "public"."sov_entries" to "authenticated";

grant insert on table "public"."sov_entries" to "authenticated";

grant references on table "public"."sov_entries" to "authenticated";

grant select on table "public"."sov_entries" to "authenticated";

grant trigger on table "public"."sov_entries" to "authenticated";

grant truncate on table "public"."sov_entries" to "authenticated";

grant update on table "public"."sov_entries" to "authenticated";

grant delete on table "public"."sov_entries" to "service_role";

grant insert on table "public"."sov_entries" to "service_role";

grant references on table "public"."sov_entries" to "service_role";

grant select on table "public"."sov_entries" to "service_role";

grant trigger on table "public"."sov_entries" to "service_role";

grant truncate on table "public"."sov_entries" to "service_role";

grant update on table "public"."sov_entries" to "service_role";

grant delete on table "public"."sov_items" to "anon";

grant insert on table "public"."sov_items" to "anon";

grant references on table "public"."sov_items" to "anon";

grant select on table "public"."sov_items" to "anon";

grant trigger on table "public"."sov_items" to "anon";

grant truncate on table "public"."sov_items" to "anon";

grant update on table "public"."sov_items" to "anon";

grant delete on table "public"."sov_items" to "authenticated";

grant insert on table "public"."sov_items" to "authenticated";

grant references on table "public"."sov_items" to "authenticated";

grant select on table "public"."sov_items" to "authenticated";

grant trigger on table "public"."sov_items" to "authenticated";

grant truncate on table "public"."sov_items" to "authenticated";

grant update on table "public"."sov_items" to "authenticated";

grant delete on table "public"."sov_items" to "service_role";

grant insert on table "public"."sov_items" to "service_role";

grant references on table "public"."sov_items" to "service_role";

grant select on table "public"."sov_items" to "service_role";

grant trigger on table "public"."sov_items" to "service_role";

grant truncate on table "public"."sov_items" to "service_role";

grant update on table "public"."sov_items" to "service_role";

grant delete on table "public"."sov_items_l" to "anon";

grant insert on table "public"."sov_items_l" to "anon";

grant references on table "public"."sov_items_l" to "anon";

grant select on table "public"."sov_items_l" to "anon";

grant trigger on table "public"."sov_items_l" to "anon";

grant truncate on table "public"."sov_items_l" to "anon";

grant update on table "public"."sov_items_l" to "anon";

grant delete on table "public"."sov_items_l" to "authenticated";

grant insert on table "public"."sov_items_l" to "authenticated";

grant references on table "public"."sov_items_l" to "authenticated";

grant select on table "public"."sov_items_l" to "authenticated";

grant trigger on table "public"."sov_items_l" to "authenticated";

grant truncate on table "public"."sov_items_l" to "authenticated";

grant update on table "public"."sov_items_l" to "authenticated";

grant delete on table "public"."sov_items_l" to "service_role";

grant insert on table "public"."sov_items_l" to "service_role";

grant references on table "public"."sov_items_l" to "service_role";

grant select on table "public"."sov_items_l" to "service_role";

grant trigger on table "public"."sov_items_l" to "service_role";

grant truncate on table "public"."sov_items_l" to "service_role";

grant update on table "public"."sov_items_l" to "service_role";

grant delete on table "public"."subcontractors" to "anon";

grant insert on table "public"."subcontractors" to "anon";

grant references on table "public"."subcontractors" to "anon";

grant select on table "public"."subcontractors" to "anon";

grant trigger on table "public"."subcontractors" to "anon";

grant truncate on table "public"."subcontractors" to "anon";

grant update on table "public"."subcontractors" to "anon";

grant delete on table "public"."subcontractors" to "authenticated";

grant insert on table "public"."subcontractors" to "authenticated";

grant references on table "public"."subcontractors" to "authenticated";

grant select on table "public"."subcontractors" to "authenticated";

grant trigger on table "public"."subcontractors" to "authenticated";

grant truncate on table "public"."subcontractors" to "authenticated";

grant update on table "public"."subcontractors" to "authenticated";

grant delete on table "public"."subcontractors" to "service_role";

grant insert on table "public"."subcontractors" to "service_role";

grant references on table "public"."subcontractors" to "service_role";

grant select on table "public"."subcontractors" to "service_role";

grant trigger on table "public"."subcontractors" to "service_role";

grant truncate on table "public"."subcontractors" to "service_role";

grant update on table "public"."subcontractors" to "service_role";

grant delete on table "public"."takeoff_items_l" to "anon";

grant insert on table "public"."takeoff_items_l" to "anon";

grant references on table "public"."takeoff_items_l" to "anon";

grant select on table "public"."takeoff_items_l" to "anon";

grant trigger on table "public"."takeoff_items_l" to "anon";

grant truncate on table "public"."takeoff_items_l" to "anon";

grant update on table "public"."takeoff_items_l" to "anon";

grant delete on table "public"."takeoff_items_l" to "authenticated";

grant insert on table "public"."takeoff_items_l" to "authenticated";

grant references on table "public"."takeoff_items_l" to "authenticated";

grant select on table "public"."takeoff_items_l" to "authenticated";

grant trigger on table "public"."takeoff_items_l" to "authenticated";

grant truncate on table "public"."takeoff_items_l" to "authenticated";

grant update on table "public"."takeoff_items_l" to "authenticated";

grant delete on table "public"."takeoff_items_l" to "service_role";

grant insert on table "public"."takeoff_items_l" to "service_role";

grant references on table "public"."takeoff_items_l" to "service_role";

grant select on table "public"."takeoff_items_l" to "service_role";

grant trigger on table "public"."takeoff_items_l" to "service_role";

grant truncate on table "public"."takeoff_items_l" to "service_role";

grant update on table "public"."takeoff_items_l" to "service_role";

grant delete on table "public"."takeoffs_l" to "anon";

grant insert on table "public"."takeoffs_l" to "anon";

grant references on table "public"."takeoffs_l" to "anon";

grant select on table "public"."takeoffs_l" to "anon";

grant trigger on table "public"."takeoffs_l" to "anon";

grant truncate on table "public"."takeoffs_l" to "anon";

grant update on table "public"."takeoffs_l" to "anon";

grant delete on table "public"."takeoffs_l" to "authenticated";

grant insert on table "public"."takeoffs_l" to "authenticated";

grant references on table "public"."takeoffs_l" to "authenticated";

grant select on table "public"."takeoffs_l" to "authenticated";

grant trigger on table "public"."takeoffs_l" to "authenticated";

grant truncate on table "public"."takeoffs_l" to "authenticated";

grant update on table "public"."takeoffs_l" to "authenticated";

grant delete on table "public"."takeoffs_l" to "service_role";

grant insert on table "public"."takeoffs_l" to "service_role";

grant references on table "public"."takeoffs_l" to "service_role";

grant select on table "public"."takeoffs_l" to "service_role";

grant trigger on table "public"."takeoffs_l" to "service_role";

grant truncate on table "public"."takeoffs_l" to "service_role";

grant update on table "public"."takeoffs_l" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."won_bid_items" to "anon";

grant insert on table "public"."won_bid_items" to "anon";

grant references on table "public"."won_bid_items" to "anon";

grant select on table "public"."won_bid_items" to "anon";

grant trigger on table "public"."won_bid_items" to "anon";

grant truncate on table "public"."won_bid_items" to "anon";

grant update on table "public"."won_bid_items" to "anon";

grant delete on table "public"."won_bid_items" to "authenticated";

grant insert on table "public"."won_bid_items" to "authenticated";

grant references on table "public"."won_bid_items" to "authenticated";

grant select on table "public"."won_bid_items" to "authenticated";

grant trigger on table "public"."won_bid_items" to "authenticated";

grant truncate on table "public"."won_bid_items" to "authenticated";

grant update on table "public"."won_bid_items" to "authenticated";

grant delete on table "public"."won_bid_items" to "service_role";

grant insert on table "public"."won_bid_items" to "service_role";

grant references on table "public"."won_bid_items" to "service_role";

grant select on table "public"."won_bid_items" to "service_role";

grant trigger on table "public"."won_bid_items" to "service_role";

grant truncate on table "public"."won_bid_items" to "service_role";

grant update on table "public"."won_bid_items" to "service_role";

grant delete on table "public"."work_order_items_l" to "anon";

grant insert on table "public"."work_order_items_l" to "anon";

grant references on table "public"."work_order_items_l" to "anon";

grant select on table "public"."work_order_items_l" to "anon";

grant trigger on table "public"."work_order_items_l" to "anon";

grant truncate on table "public"."work_order_items_l" to "anon";

grant update on table "public"."work_order_items_l" to "anon";

grant delete on table "public"."work_order_items_l" to "authenticated";

grant insert on table "public"."work_order_items_l" to "authenticated";

grant references on table "public"."work_order_items_l" to "authenticated";

grant select on table "public"."work_order_items_l" to "authenticated";

grant trigger on table "public"."work_order_items_l" to "authenticated";

grant truncate on table "public"."work_order_items_l" to "authenticated";

grant update on table "public"."work_order_items_l" to "authenticated";

grant delete on table "public"."work_order_items_l" to "service_role";

grant insert on table "public"."work_order_items_l" to "service_role";

grant references on table "public"."work_order_items_l" to "service_role";

grant select on table "public"."work_order_items_l" to "service_role";

grant trigger on table "public"."work_order_items_l" to "service_role";

grant truncate on table "public"."work_order_items_l" to "service_role";

grant update on table "public"."work_order_items_l" to "service_role";

grant delete on table "public"."work_orders_l" to "anon";

grant insert on table "public"."work_orders_l" to "anon";

grant references on table "public"."work_orders_l" to "anon";

grant select on table "public"."work_orders_l" to "anon";

grant trigger on table "public"."work_orders_l" to "anon";

grant truncate on table "public"."work_orders_l" to "anon";

grant update on table "public"."work_orders_l" to "anon";

grant delete on table "public"."work_orders_l" to "authenticated";

grant insert on table "public"."work_orders_l" to "authenticated";

grant references on table "public"."work_orders_l" to "authenticated";

grant select on table "public"."work_orders_l" to "authenticated";

grant trigger on table "public"."work_orders_l" to "authenticated";

grant truncate on table "public"."work_orders_l" to "authenticated";

grant update on table "public"."work_orders_l" to "authenticated";

grant delete on table "public"."work_orders_l" to "service_role";

grant insert on table "public"."work_orders_l" to "service_role";

grant references on table "public"."work_orders_l" to "service_role";

grant select on table "public"."work_orders_l" to "service_role";

grant trigger on table "public"."work_orders_l" to "service_role";

grant truncate on table "public"."work_orders_l" to "service_role";

grant update on table "public"."work_orders_l" to "service_role";


  create policy "select"
  on "public"."admin_data_entries"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."archived_available_jobs"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."associated_items"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."available_jobs"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."bid_estimates"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."bid_item_numbers"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."branches"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."contractors"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "counties"
  on "public"."counties"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."counties"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."customer_contacts"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."equipment_rental_entries"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."files"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."flagging"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."flagging_entries"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."general_static_assumptions"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."items"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."job_numbers"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."jobs"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."mpt_phases"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."mpt_primary_signs"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."mpt_rental_entries"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."mpt_secondary_signs"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."mpt_static_equipment_info"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow anon full access"
  on "public"."mutcd_signs"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "select"
  on "public"."notes"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."owners"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."permanent_signs"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."permanent_signs_entries"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."productivity_rates"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."project_metadata"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."quote_items"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."quote_recipients"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."quote_sequential_numbers"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."quotes"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."quotes_customers"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."service_work_entries"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."sign_designations"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."sign_dimension_options"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."sign_dimensions"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."sign_orders"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."subcontractors"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Each user deletes only their own 1"
  on "public"."users"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Each user deletes only their own"
  on "public"."users"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Each user inserts only their own 1"
  on "public"."users"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Each user inserts only their own"
  on "public"."users"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Each user updates only their own 1"
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Each user updates only their own"
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can delete their own data"
  on "public"."users"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can insert their own data"
  on "public"."users"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can select their own data"
  on "public"."users"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can update their own data"
  on "public"."users"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id));



  create policy "select"
  on "public"."users"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "select"
  on "public"."won_bid_items"
  as permissive
  for all
  to public
using (true)
with check (true);


CREATE TRIGGER trigger_update_overdays AFTER UPDATE ON public.admin_data_entries FOR EACH ROW EXECUTE FUNCTION public.update_overdays_on_date_change();

CREATE TRIGGER update_associated_items_modtime BEFORE UPDATE ON public.associated_items FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER custom_sov_items_set_updated_at BEFORE UPDATE ON public.custom_sov_items FOR EACH ROW EXECUTE FUNCTION public.set_custom_sov_items_updated_at();

CREATE TRIGGER trig_documents_update_timestamp BEFORE UPDATE ON public.documents_l FOR EACH ROW EXECUTE FUNCTION public.update_documents_timestamp();

CREATE TRIGGER generate_job_number_on_insert BEFORE INSERT ON public.job_numbers FOR EACH ROW EXECUTE FUNCTION public.auto_generate_job_number();

CREATE TRIGGER update_quote_items_modtime BEFORE UPDATE ON public.quote_items FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_quote_recipients_modtime BEFORE UPDATE ON public.quote_recipients FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_quotes_modtime BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER trig_sov_items_update_timestamp BEFORE UPDATE ON public.sov_items_l FOR EACH ROW EXECUTE FUNCTION public.update_sov_timestamp();

CREATE TRIGGER trig_work_order_item_update_timestamp BEFORE UPDATE ON public.work_order_items_l FOR EACH ROW EXECUTE FUNCTION public.update_work_order_item_timestamp();

CREATE TRIGGER trig_work_order_update_timestamp BEFORE UPDATE ON public.work_orders_l FOR EACH ROW EXECUTE FUNCTION public.update_work_order_timestamp();


  create policy "Allow delete own files"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'files'::text));



  create policy "Allow public access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'files'::text));



  create policy "Allow public uploads"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'files'::text));



