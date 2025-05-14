-- Step 1: Create the new status enum
CREATE TYPE bid_estimate_status AS ENUM ('DRAFT', 'PENDING', 'WON', 'LOST');

-- Step 2: Begin transaction for safety
BEGIN;

-- Step 3: Drop the trigger temporarily
DROP TRIGGER IF EXISTS trigger_update_updated_at ON bid_estimates;

-- Step 4: Drop all unnecessary columns
ALTER TABLE bid_estimates 
DROP COLUMN IF EXISTS letting_date,
DROP COLUMN IF EXISTS contract_number,
DROP COLUMN IF EXISTS contractor,
DROP COLUMN IF EXISTS subcontractor,
DROP COLUMN IF EXISTS owner,
DROP COLUMN IF EXISTS county,
DROP COLUMN IF EXISTS branch,
DROP COLUMN IF EXISTS division,
DROP COLUMN IF EXISTS estimator,
DROP COLUMN IF EXISTS start_date,
DROP COLUMN IF EXISTS end_date,
DROP COLUMN IF EXISTS project_days,
DROP COLUMN IF EXISTS base_rate,
DROP COLUMN IF EXISTS fringe_rate,
DROP COLUMN IF EXISTS rt_miles,
DROP COLUMN IF EXISTS rt_travel,
DROP COLUMN IF EXISTS emergency_job,
DROP COLUMN IF EXISTS rated_hours,
DROP COLUMN IF EXISTS nonrated_hours,
DROP COLUMN IF EXISTS total_hours,
DROP COLUMN IF EXISTS phases,
DROP COLUMN IF EXISTS type_iii_4ft,
DROP COLUMN IF EXISTS wings_6ft,
DROP COLUMN IF EXISTS h_stands,
DROP COLUMN IF EXISTS posts,
DROP COLUMN IF EXISTS sand_bags,
DROP COLUMN IF EXISTS covers,
DROP COLUMN IF EXISTS spring_loaded_metal_stands,
DROP COLUMN IF EXISTS hi_vertical_panels,
DROP COLUMN IF EXISTS type_xi_vertical_panels,
DROP COLUMN IF EXISTS b_lites,
DROP COLUMN IF EXISTS ac_lites,
DROP COLUMN IF EXISTS hi_signs_sq_ft,
DROP COLUMN IF EXISTS dg_signs_sq_ft,
DROP COLUMN IF EXISTS special_signs_sq_ft,
DROP COLUMN IF EXISTS tma,
DROP COLUMN IF EXISTS arrow_board,
DROP COLUMN IF EXISTS message_board,
DROP COLUMN IF EXISTS speed_trailer,
DROP COLUMN IF EXISTS pts,
DROP COLUMN IF EXISTS mpt_value,
DROP COLUMN IF EXISTS mpt_gross_profit,
DROP COLUMN IF EXISTS mpt_gm_percent,
DROP COLUMN IF EXISTS perm_sign_value,
DROP COLUMN IF EXISTS perm_sign_gross_profit,
DROP COLUMN IF EXISTS perm_sign_gm_percent,
DROP COLUMN IF EXISTS rental_value,
DROP COLUMN IF EXISTS rental_gross_profit,
DROP COLUMN IF EXISTS rental_gm_percent,
DROP COLUMN IF EXISTS updated_at,
DROP COLUMN IF EXISTS deleted_at,
DROP COLUMN IF EXISTS number_of_personnel,
DROP COLUMN IF EXISTS number_of_trucks,
DROP COLUMN IF EXISTS trips,
DROP COLUMN IF EXISTS additional_trips,
DROP COLUMN IF EXISTS total_trips,
DROP COLUMN IF EXISTS additional_rated_hours,
DROP COLUMN IF EXISTS total_rated_hours,
DROP COLUMN IF EXISTS additional_nonrated_hours,
DROP COLUMN IF EXISTS total_nonrated_hours,
DROP COLUMN IF EXISTS mobilization,
DROP COLUMN IF EXISTS fuel_cost,
DROP COLUMN IF EXISTS truck_and_fuel_cost,
DROP COLUMN IF EXISTS summary;

-- Step 5: Add the financial columns if they don't exist
ALTER TABLE bid_estimates 
ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS total_gross_profit NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Step 6: Alter the status column to use the new enum
ALTER TABLE bid_estimates 
DROP COLUMN status;

ALTER TABLE bid_estimates 
ADD COLUMN status bid_estimate_status NOT NULL DEFAULT 'DRAFT';

-- Step 7: Commit the transaction
COMMIT;

CREATE INDEX IF NOT EXISTS idx_bid_estimates_archived ON bid_estimates (archived);