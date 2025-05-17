-- Create quotes table
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    from_email VARCHAR(255),
    subject VARCHAR(255),
    body TEXT,
    estimate_id INTEGER REFERENCES bid_estimates(id),
    job_id INTEGER REFERENCES jobs(id),
    date_sent TIMESTAMP,
    response_token VARCHAR(255) UNIQUE,
    status VARCHAR(50) CHECK (status IN ('Not Sent', 'Sent', 'Accepted')),
    quote_number VARCHAR(100),
    notes TEXT,
    custom_terms_conditions TEXT,
    payment_terms VARCHAR(255),
    county VARCHAR(100),
    state_route VARCHAR(100),
    ecms_po_number VARCHAR(100),
    
    -- Attachment boolean flags
    bedford_sell_sheet BOOLEAN DEFAULT FALSE,
    flagging_price_list BOOLEAN DEFAULT FALSE,
    flagging_service_area BOOLEAN DEFAULT FALSE,
    
    -- Terms boolean flags
    standard_terms BOOLEAN DEFAULT FALSE,
    rental_agreements BOOLEAN DEFAULT FALSE,
    equipment_sale BOOLEAN DEFAULT FALSE,
    flagging_terms BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quotes_customers junction table
CREATE TABLE quotes_customers (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES quotes(id) ON DELETE CASCADE,
    contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
    UNIQUE(quote_id, contractor_id)
);

-- Create quote recipients table
CREATE TABLE quote_recipients (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES quotes(id) ON DELETE CASCADE,
    customer_contacts_id INTEGER REFERENCES customer_contacts(id) ON DELETE SET NULL,
    email VARCHAR(255),
    cc BOOLEAN DEFAULT FALSE,
    bcc BOOLEAN DEFAULT FALSE,
    point_of_contact BOOLEAN DEFAULT FALSE,
    
    CHECK (
        (customer_contacts_id IS NOT NULL) OR 
        (email IS NOT NULL AND email != '')
    ),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quote_items table
CREATE TABLE quote_items (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES quotes(id) ON DELETE CASCADE,
    item_number VARCHAR(100),
    description TEXT,
    uom VARCHAR(50),
    notes TEXT,
    quantity NUMERIC(10, 2),
    unit_price NUMERIC(10, 2),
    discount NUMERIC(10, 2),
    discount_type VARCHAR(10) CHECK (discount_type IN ('dollar', 'percentage')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create associated_items table for nested items
CREATE TABLE associated_items (
    id SERIAL PRIMARY KEY,
    quote_item_id INTEGER REFERENCES quote_items(id) ON DELETE CASCADE,
    item_number VARCHAR(100),
    description TEXT,
    uom VARCHAR(50),
    quantity NUMERIC(10, 2),
    unit_price NUMERIC(10, 2),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add quote_id to files table (assuming files table already exists)
ALTER TABLE files ADD COLUMN quote_id INTEGER REFERENCES quotes(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_date_sent ON quotes(date_sent);
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quote_recipients_quote_id ON quote_recipients(quote_id);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_associated_items_quote_item_id ON associated_items(quote_item_id);
CREATE INDEX idx_files_quote_id ON files(quote_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotes_modtime
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_quote_recipients_modtime
    BEFORE UPDATE ON quote_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_quote_items_modtime
    BEFORE UPDATE ON quote_items
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_associated_items_modtime
    BEFORE UPDATE ON associated_items
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();