-- Create takeoffs_l table for storing material takeoffs
CREATE TABLE takeoffs_l (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs_l(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  work_type TEXT NOT NULL,
  work_order_number TEXT,
  contracted_or_additional TEXT DEFAULT 'contracted',
  install_date DATE,
  pickup_date DATE,
  needed_by_date DATE,
  priority TEXT DEFAULT 'standard',
  notes TEXT,
  crew_notes TEXT,
  build_shop_notes TEXT,
  pm_notes TEXT,
  active_sections TEXT[] DEFAULT '{}',
  sign_rows JSONB DEFAULT '{}',
  default_sign_material TEXT DEFAULT 'PLASTIC',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on job_id for faster lookups
CREATE INDEX idx_takeoffs_l_job_id ON takeoffs_l(job_id);

-- Create index on status for filtering
CREATE INDEX idx_takeoffs_l_status ON takeoffs_l(status);

-- Enable RLS
ALTER TABLE takeoffs_l ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read/write their own takeoffs
CREATE POLICY "Users can view takeoffs for their jobs" ON takeoffs_l
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert takeoffs" ON takeoffs_l
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update takeoffs" ON takeoffs_l
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete takeoffs" ON takeoffs_l
  FOR DELETE USING (auth.uid() IS NOT NULL);