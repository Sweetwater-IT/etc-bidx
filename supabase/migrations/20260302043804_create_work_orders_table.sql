-- Create work_orders table for storing work orders
CREATE TABLE work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  takeoff_id UUID NOT NULL REFERENCES takeoffs_l(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  wo_number TEXT,
  notes TEXT,
  contracted_or_additional TEXT DEFAULT 'contracted',
  customer_poc_phone TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on takeoff_id for faster lookups
CREATE INDEX idx_work_orders_takeoff_id ON work_orders(takeoff_id);

-- Create index on status for filtering
CREATE INDEX idx_work_orders_status ON work_orders(status);

-- Enable RLS
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read/write work orders
CREATE POLICY "Users can view work orders" ON work_orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert work orders" ON work_orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update work orders" ON work_orders
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete work orders" ON work_orders
  FOR DELETE USING (auth.uid() IS NOT NULL);