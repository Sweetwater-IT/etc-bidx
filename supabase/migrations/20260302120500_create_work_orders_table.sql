-- Create work_orders table for storing work orders generated from takeoffs
CREATE TABLE work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs_l(id) ON DELETE CASCADE,
  takeoff_id UUID NOT NULL REFERENCES takeoffs_l(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  work_type TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on job_id for faster lookups
CREATE INDEX idx_work_orders_job_id ON work_orders(job_id);

-- Create index on takeoff_id
CREATE INDEX idx_work_orders_takeoff_id ON work_orders(takeoff_id);

-- Create index on status for filtering
CREATE INDEX idx_work_orders_status ON work_orders(status);

-- Enable RLS
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read/write their own work orders
CREATE POLICY "Users can view work orders for their jobs" ON work_orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert work orders" ON work_orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update work orders" ON work_orders
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete work orders" ON work_orders
  FOR DELETE USING (auth.uid() IS NOT NULL);