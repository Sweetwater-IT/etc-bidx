-- Add assigned_to column to sign_orders table
ALTER TABLE sign_orders ADD COLUMN assigned_to TEXT;

-- Update existing records to have NULL in the assigned_to column
UPDATE sign_orders SET assigned_to = NULL WHERE assigned_to IS NULL;

-- Add comment to the column
COMMENT ON COLUMN sign_orders.assigned_to IS 'Person assigned to handle this sign order';
