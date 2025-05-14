-- Create project_metadata table
CREATE TABLE IF NOT EXISTS project_metadata (
    id SERIAL PRIMARY KEY,
    bid_estimate_id INTEGER REFERENCES bid_estimates(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    project_manager VARCHAR(255),
    pm_email VARCHAR(255),
    pm_phone VARCHAR(50),
    customer_contract_number VARCHAR(100),
    contractor_id INTEGER REFERENCES contractors(id),
    
    -- Check constraint to ensure only one parent
    CONSTRAINT check_single_parent CHECK (
        (bid_estimate_id IS NOT NULL AND job_id IS NULL) OR 
        (bid_estimate_id IS NULL AND job_id IS NOT NULL)
    )
);

-- Create unique index using COALESCE
CREATE UNIQUE INDEX unique_project_metadata_entry ON project_metadata (
    COALESCE(bid_estimate_id, 0),
    COALESCE(job_id, 0)
);

-- Create indices for foreign keys
CREATE INDEX idx_project_metadata_bid_estimate ON project_metadata (bid_estimate_id);
CREATE INDEX idx_project_metadata_job ON project_metadata (job_id);
CREATE INDEX idx_project_metadata_contractor ON project_metadata (contractor_id);