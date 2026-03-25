# Production `_l` Schema Plan

This document maps the new production/shop workflow tables to the existing `_l`
data model in this repo.

## Constraints

- Do not modify existing `sign_*` tables.
- If sign-side schema changes are needed, create parallel `sign_*_l` tables.
- Prefer linking new production tables to existing `_l` tables:
  - `jobs_l`
  - `takeoffs_l`
  - `takeoff_items_l`
  - `work_orders_l`
  - `work_order_items_l`

## Existing `_l` Base Tables

Observed from current migrations, app usage, and live Supabase inspection:

- `jobs_l`
  - UUID primary key
  - used broadly as the root job record for `/l` flows
  - live columns observed:
    - `id`
    - `internal_id`
    - `project_name`
    - `etc_job_number`
    - `etc_branch`
    - `customer_name`
    - `customer_id`
    - `customer_job_number`
    - `customer_pm`
    - `customer_pm_email`
    - `project_owner`
    - `contract_number`
    - `county`
    - `state_route`
    - `project_status`
    - `contract_status`
    - `billing_status`
    - `assigned_pm`
    - `assigned_billing`
    - `sov_items`
    - approval and audit fields including `created_by`, `approved_by`, `rejected_by`
- `takeoffs_l`
  - `id UUID PK`
  - `job_id UUID REFERENCES jobs_l(id)`
  - important fields already present:
    - `title`
    - `work_type`
    - `work_order_number`
    - `work_order_id`
    - `install_date`
    - `pickup_date`
    - `end_date`
    - `needed_by_date`
    - `priority`
    - `notes`
    - `crew_notes`
    - `build_shop_notes`
    - `pm_notes`
    - `destination`
    - `is_pickup`
    - `parent_takeoff_id`
    - `revision_number`
    - `chain_root_takeoff_id`
    - `status`
- `takeoff_items_l`
  - `id UUID PK`
  - `takeoff_id UUID REFERENCES takeoffs_l(id)`
  - important fields already present:
    - `product_name`
    - `category`
    - `quantity`
    - `material`
    - `notes`
    - `sign_details JSONB`
    - `sign_description`
    - `sheeting`
    - `width_inches`
    - `height_inches`
    - `sqft`
    - `total_sqft`
    - `secondary_signs JSONB`
    - `pickup_condition`
    - `cover`
- `work_orders_l`
  - live columns observed:
    - `id`
    - `job_id`
    - `takeoff_id`
    - `parent_work_order_id`
    - `wo_number`
    - `title`
    - `description`
    - `branch`
    - `contracted_or_additional`
    - `assigned_to`
    - `customer_poc_phone`
    - `needed_by_date`
    - `scheduled_date`
    - `percent_complete`
    - `status`
    - `notes`
    - `is_pickup`
    - `created_by`
    - `created_at`
    - `updated_at`
    - soft-delete/cancel fields including `deleted_at`, `canceled_at`, `canceled_by`, `cancel_reason`
- `work_order_items_l`
  - live columns observed:
    - `id`
    - `work_order_id`
    - `sov_item_id`
    - `item_number`
    - `description`
    - `contract_quantity`
    - `work_order_quantity`
    - `uom`
    - `sort_order`
    - `notes`
    - `pickup_condition`
    - `pickup_images`
    - `created_at`
    - `updated_at`
    - `deleted_at`

## New Tables To Add

### 1. `build_requests_l`

Purpose:
- one production/build workflow record per submitted `_l` takeoff
- tracks build-shop lifecycle without changing existing sign tables

Relationships:
- `job_id UUID NOT NULL REFERENCES jobs_l(id) ON DELETE CASCADE`
- `takeoff_id UUID NOT NULL REFERENCES takeoffs_l(id) ON DELETE CASCADE`
- `work_order_id UUID NULL REFERENCES work_orders_l(id) ON DELETE SET NULL`
- optional future link:
  - `sign_order_l_id UUID NULL REFERENCES sign_orders_l(id) ON DELETE SET NULL`

Recommended columns:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `job_id UUID NOT NULL`
- `takeoff_id UUID NOT NULL`
- `work_order_id UUID NULL`
- `sign_order_l_id UUID NULL`
- `branch TEXT NULL`
- `requested_by UUID NULL`
- `requested_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `priority TEXT NOT NULL DEFAULT 'standard'`
- `status TEXT NOT NULL DEFAULT 'new'`
- `pm_notes TEXT NULL`
- `builder_notes TEXT NULL`
- `inventory_notes TEXT NULL`
- `rejection_reason TEXT NULL`
- `assigned_builder UUID NULL`
- `signs_ordered_at TIMESTAMPTZ NULL`
- `signs_ready_at TIMESTAMPTZ NULL`
- `materials_received BOOLEAN NOT NULL DEFAULT false`
- `build_started_at TIMESTAMPTZ NULL`
- `completed_at TIMESTAMPTZ NULL`
- `completed_by UUID NULL`
- `archived_at TIMESTAMPTZ NULL`
- `canceled_at TIMESTAMPTZ NULL`
- `cancel_reason TEXT NULL`
- `cancel_notes TEXT NULL`
- `revision_number INTEGER NOT NULL DEFAULT 1`
- `chain_root_takeoff_id UUID NOT NULL`
- `superseded_by_takeoff_id UUID NULL REFERENCES takeoffs_l(id) ON DELETE SET NULL`
- `last_snapshot_json JSONB NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Recommended status values:
- `new`
- `under_review`
- `awaiting_signs`
- `materials_ready`
- `build_queue`
- `in_build`
- `ready_for_pm`
- `completed`
- `rejected`
- `superseded`

Recommended indexes:
- `(job_id)`
- `(takeoff_id)`
- `(work_order_id)`
- `(status)`
- `(archived_at)`
- `(branch)`
- unique partial index on active request per takeoff:
  - unique `(takeoff_id)` where `archived_at is null` and status not in `('rejected','superseded')`

### 2. `build_request_items_l`

Purpose:
- frozen/working production copy of takeoff line items for build workflow
- preserves build-specific overrides without mutating `takeoff_items_l`

Relationships:
- `build_request_id UUID NOT NULL REFERENCES build_requests_l(id) ON DELETE CASCADE`
- `takeoff_item_id UUID NULL REFERENCES takeoff_items_l(id) ON DELETE SET NULL`

Recommended columns:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `build_request_id UUID NOT NULL`
- `takeoff_item_id UUID NULL`
- `product_name TEXT NOT NULL`
- `category TEXT NOT NULL`
- `quantity NUMERIC(12,4) NOT NULL DEFAULT 0`
- `material TEXT NULL`
- `structure_type TEXT NULL`
- `order_type TEXT NOT NULL DEFAULT 'none'`
- `order_required BOOLEAN NOT NULL DEFAULT false`
- `order_quantity NUMERIC(12,4) NOT NULL DEFAULT 0`
- `order_face_qty NUMERIC(12,4) NOT NULL DEFAULT 0`
- `order_full_qty NUMERIC(12,4) NOT NULL DEFAULT 0`
- `in_stock BOOLEAN NOT NULL DEFAULT false`
- `line_notes TEXT NOT NULL DEFAULT ''`
- `notes_json JSONB NULL DEFAULT '[]'::jsonb`
- `diff_status TEXT NOT NULL DEFAULT 'unchanged'`
- `diff_details JSONB NULL DEFAULT '{}'::jsonb`
- `material_override TEXT NULL`
- `structure_override TEXT NULL`
- `legend_override TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Recommended indexes:
- `(build_request_id)`
- `(takeoff_item_id)`
- `(order_required)`
- `(category)`

### 3. Optional Future `sign_*_l` Tables

Only create these if the new `/l` production UI truly needs sign-side workflow
separate from the legacy sign tables.

#### `sign_orders_l`

Purpose:
- `_l` parallel to legacy `sign_orders`
- supports sign shop workflow without changing existing sign tables

Recommended relationships:
- `job_id UUID NULL REFERENCES jobs_l(id) ON DELETE SET NULL`
- `work_order_id UUID NULL REFERENCES work_orders_l(id) ON DELETE SET NULL`
- `build_request_id UUID NULL REFERENCES build_requests_l(id) ON DELETE SET NULL`

Recommended columns:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `order_number TEXT NOT NULL`
- `order_type TEXT NOT NULL`
- `status TEXT NOT NULL DEFAULT 'submitted'`
- `created_by UUID NULL`
- `assigned_to UUID NULL`
- `customer_name TEXT NULL`
- `customer_contact TEXT NULL`
- `notes TEXT NULL`
- `submitted_date TIMESTAMPTZ NULL`
- `completed_date TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

#### `sign_order_items_l`

Purpose:
- `_l` parallel to legacy `sign_order_items`
- structured production lines for sign manufacturing and purchasing

Recommended relationships:
- `sign_order_l_id UUID NOT NULL REFERENCES sign_orders_l(id) ON DELETE CASCADE`
- optional link back to source item:
  - `takeoff_item_id UUID NULL REFERENCES takeoff_items_l(id) ON DELETE SET NULL`

Recommended columns:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `sign_order_l_id UUID NOT NULL`
- `takeoff_item_id UUID NULL`
- `sign_designation TEXT NOT NULL DEFAULT ''`
- `description TEXT NULL`
- `legend TEXT NULL`
- `dimension_label TEXT NULL`
- `width NUMERIC(8,2) NOT NULL DEFAULT 0`
- `height NUMERIC(8,2) NOT NULL DEFAULT 0`
- `sheeting TEXT NOT NULL DEFAULT ''`
- `substrate TEXT NOT NULL DEFAULT ''`
- `structure TEXT NULL`
- `required_quantity NUMERIC(12,4) NOT NULL DEFAULT 0`
- `in_stock NUMERIC(12,4) NOT NULL DEFAULT 0`
- `to_order NUMERIC(12,4) NOT NULL DEFAULT 0`
- `to_mfg NUMERIC(12,4) NOT NULL DEFAULT 0`
- `sqft_per_sign NUMERIC(12,4) NOT NULL DEFAULT 0`
- `total_sqft NUMERIC(12,4) NOT NULL DEFAULT 0`
- `procurement_status TEXT NOT NULL DEFAULT 'pending'`
- `line_status TEXT NOT NULL DEFAULT 'queued'`
- `assigned_to UUID NULL`
- `completed_at TIMESTAMPTZ NULL`
- `completed_by UUID NULL`
- `sort_order INTEGER NOT NULL DEFAULT 0`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

## Recommended First Implementation Slice

Build the first `/l` production release using only:

- `build_requests_l`
- `build_request_items_l`

Use existing tables as inputs:

- `jobs_l`
- `takeoffs_l`
- `takeoff_items_l`
- `work_orders_l`

This gives us:

- build shop board/list workflow
- build request detail page
- production snapshot of takeoff items
- no changes to existing `sign_*` tables

## Open Questions

- Where is the migration for `work_orders_l` and `work_order_items_l`?
  - current APIs use them, but they were not found under `supabase/migrations`
- Should user references in new `_l` tables point to auth users, `users`, or remain plain text initially?
  - current repo mixes these patterns
- Do we want sign shop in phase 1, or build shop only?
  - build shop can ship first without any new `sign_*_l` tables
