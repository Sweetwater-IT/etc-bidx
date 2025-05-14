-- Create static equipment info table (normalized)
CREATE TABLE IF NOT EXISTS mpt_static_equipment_info (
    id SERIAL PRIMARY KEY,
    mpt_rental_entry_id INTEGER REFERENCES mpt_rental_entries(id) ON DELETE CASCADE,
    equipment_type VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    discount_rate NUMERIC(5, 2) NOT NULL,
    useful_life INTEGER NOT NULL,
    payback_period INTEGER NOT NULL,
    
    -- Unique constraint to ensure one entry per equipment type per rental
    UNIQUE(mpt_rental_entry_id, equipment_type)
);

-- Create index for foreign key
CREATE INDEX idx_static_equipment_rental ON mpt_static_equipment_info (mpt_rental_entry_id);
