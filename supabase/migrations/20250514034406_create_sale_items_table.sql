-- Create the sale_item_status enum
CREATE TYPE sale_item_status AS ENUM ('won', 'lost', 'pending');

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    bid_estimate_id INTEGER REFERENCES bid_estimates(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    item_number VARCHAR(50),
    vendor VARCHAR(50),
    quantity INTEGER,
    quote_price NUMERIC,
    markup_percentage NUMERIC,
    name VARCHAR(255),
    status sale_item_status DEFAULT 'pending' NOT NULL,
    customer VARCHAR(255),
    
    -- Modified check constraint to allow both to be null or ensure only one parent is set
    CONSTRAINT check_parent_relationship CHECK (
        (bid_estimate_id IS NULL AND job_id IS NULL) OR
        (bid_estimate_id IS NOT NULL AND job_id IS NULL) OR 
        (bid_estimate_id IS NULL AND job_id IS NOT NULL)
    )
);

-- Create unique index using COALESCE - this will allow multiple standalone items
CREATE UNIQUE INDEX unique_sale_item_entry ON sale_items (
    COALESCE(bid_estimate_id, 0),
    COALESCE(job_id, 0),
    id  -- Including id to ensure uniqueness for standalone items
);

-- Create indices for foreign keys
CREATE INDEX idx_sale_items_bid_estimate ON sale_items (bid_estimate_id);
CREATE INDEX idx_sale_items_job ON sale_items (job_id);