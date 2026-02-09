-- Create mpt_rental_entries table
CREATE TABLE IF NOT EXISTS mpt_rental_entries (
    id SERIAL PRIMARY KEY,
    bid_estimate_id INTEGER REFERENCES bid_estimates(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    target_moic INTEGER,
    payback_period INTEGER,
    annual_utilization NUMERIC(5, 2),
    dispatch_fee NUMERIC(10, 2),
    mpg_per_truck NUMERIC(10, 2),
    
    -- Financial totals
    revenue NUMERIC(12, 2),
    cost NUMERIC(12, 2),
    gross_profit NUMERIC(12, 2),
    hours NUMERIC(10, 2),
    
    -- Check constraint to ensure only one parent
    CONSTRAINT check_single_parent CHECK (
        (bid_estimate_id IS NOT NULL AND job_id IS NULL) OR 
        (bid_estimate_id IS NULL AND job_id IS NOT NULL)
    )
);

-- Create unique index using COALESCE
CREATE UNIQUE INDEX unique_mpt_rental_entry ON mpt_rental_entries (
    COALESCE(bid_estimate_id, 0),
    COALESCE(job_id, 0)
);

-- Create indices for foreign keys
CREATE INDEX idx_mpt_rental_entries_bid_estimate ON mpt_rental_entries (bid_estimate_id);
CREATE INDEX idx_mpt_rental_entries_job ON mpt_rental_entries (job_id);
