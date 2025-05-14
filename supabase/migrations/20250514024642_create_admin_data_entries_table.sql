CREATE TYPE division_type AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE owner_type AS ENUM ('PENNDOT', 'TURNPIKE', 'PRIVATE', 'OTHER', 'SEPTA');
CREATE TYPE rated_type AS ENUM ('RATED', 'NON-RATED');

-- Create admin_data_entries table
CREATE TABLE IF NOT EXISTS admin_data_entries (
    id SERIAL PRIMARY KEY,
    bid_estimate_id INTEGER REFERENCES bid_estimates(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    contract_number VARCHAR(50) NOT NULL,
    estimator VARCHAR(255),
    division division_type,
    bid_date TIMESTAMP,
    owner owner_type,
    county JSONB,
    sr_route VARCHAR(100),
    location VARCHAR(255),
    dbe VARCHAR(50),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    winter_start TIMESTAMP,
    winter_end TIMESTAMP,
    ow_travel_time_mins INTEGER,
    ow_mileage NUMERIC(10, 2),
    fuel_cost_per_gallon NUMERIC(10, 2),
    emergency_job BOOLEAN DEFAULT FALSE,
    rated rated_type,
    emergency_fields JSONB,
    
    -- Check constraint to ensure only one parent
    CONSTRAINT check_single_parent CHECK (
        (bid_estimate_id IS NOT NULL AND job_id IS NULL) OR 
        (bid_estimate_id IS NULL AND job_id IS NOT NULL)
    )
);

-- Create the unique index using COALESCE
CREATE UNIQUE INDEX unique_admin_data_entry ON admin_data_entries (
    COALESCE(bid_estimate_id, 0),
    COALESCE(job_id, 0)
);

-- Create indices for foreign keys
CREATE INDEX idx_admin_data_entries_bid_estimate ON admin_data_entries (bid_estimate_id);
CREATE INDEX idx_admin_data_entries_job ON admin_data_entries (job_id);