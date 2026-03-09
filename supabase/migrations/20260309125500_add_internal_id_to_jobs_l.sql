-- Add internal_id column to jobs_l table for structured contract and job IDs
ALTER TABLE jobs_l ADD COLUMN internal_id TEXT;

-- Create index on internal_id for faster lookups
CREATE INDEX idx_jobs_internal_id ON jobs_l(internal_id);

-- Add comment explaining the column purpose
COMMENT ON COLUMN jobs_l.internal_id IS 'Structured internal identifier (C-0001 for contracts, J-0001 for jobs)';