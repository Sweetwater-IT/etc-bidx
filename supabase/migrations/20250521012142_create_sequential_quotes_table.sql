drop view quotes_complete;

-- Create the sequential numbers table if it doesn't exist
CREATE TABLE IF NOT EXISTS quote_sequential_numbers (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

-- Create an index on the used column if you'll query by it
CREATE INDEX IF NOT EXISTS idx_quote_sequential_numbers_used 
ON quote_sequential_numbers(used);