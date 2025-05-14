-- Create the enums
CREATE TYPE project_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE');
CREATE TYPE certified_payroll_status AS ENUM ('STATE', 'FEDERAL', 'N/A');

-- Update the jobs table
ALTER TABLE jobs
-- Add new columns
ADD COLUMN IF NOT EXISTS estimate_id INTEGER REFERENCES bid_estimates(id),
ADD COLUMN IF NOT EXISTS billing_status project_status DEFAULT 'NOT_STARTED',
ADD COLUMN IF NOT EXISTS project_status project_status DEFAULT 'NOT_STARTED',
ADD COLUMN IF NOT EXISTS job_number_id INTEGER REFERENCES job_numbers(id),
ADD COLUMN IF NOT EXISTS overdays INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS bid_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS certified_payroll certified_payroll_status DEFAULT 'N/A',
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Make sure created_at exists and is TIMESTAMPTZ
ALTER TABLE jobs 
ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Add indices for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_estimate ON jobs(estimate_id);
CREATE INDEX IF NOT EXISTS idx_jobs_job_number ON jobs(job_number_id);
CREATE INDEX IF NOT EXISTS idx_jobs_billing_status ON jobs(billing_status);
CREATE INDEX IF NOT EXISTS idx_jobs_project_status ON jobs(project_status);
CREATE INDEX IF NOT EXISTS idx_jobs_archived ON jobs(archived);

-- Drop the foreign key constraint on files table first
ALTER TABLE files 
DROP CONSTRAINT IF EXISTS files_job_number_fkey;

-- Now you can drop the old columns from jobs table
ALTER TABLE jobs
DROP COLUMN IF EXISTS job_number,
DROP COLUMN IF EXISTS branch_code,
DROP COLUMN IF EXISTS owner_type,
DROP COLUMN IF EXISTS year,
DROP COLUMN IF EXISTS sequential_number,
DROP COLUMN IF EXISTS job_details;

-- If you need to add a new foreign key from files to jobs using job_id instead
ALTER TABLE files
ADD COLUMN IF NOT EXISTS job_id INTEGER REFERENCES jobs(id);
CREATE INDEX IF NOT EXISTS idx_files_job ON files(job_id);