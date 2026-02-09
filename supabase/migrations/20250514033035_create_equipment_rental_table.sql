-- Create equipment_rental_entries table
CREATE TABLE IF NOT EXISTS equipment_rental_entries (
    id SERIAL PRIMARY KEY,
    bid_estimate_id INTEGER REFERENCES bid_estimates(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER,
    months NUMERIC(5, 2),
    rent_price NUMERIC(10, 2),
    re_rent_price NUMERIC(10, 2),
    re_rent_for_current_job BOOLEAN,
    total_cost NUMERIC(12, 2),
    useful_life_yrs NUMERIC(5, 2),
    revenue NUMERIC(12, 2),
    gross_profit NUMERIC(12, 2),
    gross_profit_margin NUMERIC(6, 2),
    cost NUMERIC(12, 2),
    
    -- Check constraint to ensure only one parent
    CONSTRAINT check_single_parent CHECK (
        (bid_estimate_id IS NOT NULL AND job_id IS NULL) OR 
        (bid_estimate_id IS NULL AND job_id IS NOT NULL)
    )
);

-- Create unique index using COALESCE
CREATE UNIQUE INDEX unique_equipment_rental_entry ON equipment_rental_entries (
    COALESCE(bid_estimate_id, 0),
    COALESCE(job_id, 0),
    name
);

-- Create indices for foreign keys
CREATE INDEX idx_equipment_rental_entries_bid_estimate ON equipment_rental_entries (bid_estimate_id);
CREATE INDEX idx_equipment_rental_entries_job ON equipment_rental_entries (job_id);