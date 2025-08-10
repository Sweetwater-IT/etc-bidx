-- Add the column with proper foreign key reference
ALTER TABLE files 
ADD COLUMN sign_order_id INTEGER REFERENCES sign_orders(id);

-- Create an index for better query performance
CREATE INDEX idx_files_sign_order_id ON files(sign_order_id);