-- Create flagging_entries table
CREATE TABLE IF NOT EXISTS flagging_entries (
    id SERIAL PRIMARY KEY,
    bid_estimate_id INTEGER REFERENCES bid_estimates(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    standard_pricing BOOLEAN,
    standard_lump_sum NUMERIC(10, 2),
    number_trucks INTEGER,
    fuel_economy_mpg NUMERIC(10, 2),
    personnel INTEGER,
    on_site_job_hours NUMERIC(10, 2),
    additional_equipment_cost NUMERIC(10, 2),
    fuel_cost_per_gallon NUMERIC(10, 2),
    truck_dispatch_fee NUMERIC(10, 2),
    worker_comp NUMERIC(10, 2),
    general_liability NUMERIC(10, 2),
    markup_rate NUMERIC(10, 2),
    
    -- Arrow boards broken out from JSONB
    arrow_boards_cost NUMERIC(10, 2),
    arrow_boards_quantity INTEGER,
    arrow_boards_include_in_lump_sum BOOLEAN,
    
    -- Message boards broken out from JSONB
    message_boards_cost NUMERIC(10, 2),
    message_boards_quantity INTEGER,
    message_boards_include_in_lump_sum BOOLEAN,
    
    -- TMA broken out from JSONB
    tma_cost NUMERIC(10, 2),
    tma_quantity INTEGER,
    tma_include_in_lump_sum BOOLEAN,
    
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
CREATE UNIQUE INDEX unique_flagging_entry ON flagging_entries (
    COALESCE(bid_estimate_id, 0),
    COALESCE(job_id, 0)
);

-- Create indices for foreign keys
CREATE INDEX idx_flagging_entries_bid_estimate ON flagging_entries (bid_estimate_id);
CREATE INDEX idx_flagging_entries_job ON flagging_entries (job_id);

-- Create service_work_entries table (identical structure)
CREATE TABLE IF NOT EXISTS service_work_entries (
    id SERIAL PRIMARY KEY,
    bid_estimate_id INTEGER REFERENCES bid_estimates(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    standard_pricing BOOLEAN,
    standard_lump_sum NUMERIC(10, 2),
    number_trucks INTEGER,
    fuel_economy_mpg NUMERIC(10, 2),
    personnel INTEGER,
    on_site_job_hours NUMERIC(10, 2),
    additional_equipment_cost NUMERIC(10, 2),
    fuel_cost_per_gallon NUMERIC(10, 2),
    truck_dispatch_fee NUMERIC(10, 2),
    worker_comp NUMERIC(10, 2),
    general_liability NUMERIC(10, 2),
    markup_rate NUMERIC(10, 2),
    
    -- Arrow boards broken out from JSONB
    arrow_boards_cost NUMERIC(10, 2),
    arrow_boards_quantity INTEGER,
    arrow_boards_include_in_lump_sum BOOLEAN,
    
    -- Message boards broken out from JSONB
    message_boards_cost NUMERIC(10, 2),
    message_boards_quantity INTEGER,
    message_boards_include_in_lump_sum BOOLEAN,
    
    -- TMA broken out from JSONB
    tma_cost NUMERIC(10, 2),
    tma_quantity INTEGER,
    tma_include_in_lump_sum BOOLEAN,
    
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
CREATE UNIQUE INDEX unique_service_work_entry ON service_work_entries (
    COALESCE(bid_estimate_id, 0),
    COALESCE(job_id, 0)
);

-- Create indices for foreign keys
CREATE INDEX idx_service_work_entries_bid_estimate ON service_work_entries (bid_estimate_id);
CREATE INDEX idx_service_work_entries_job ON service_work_entries (job_id);