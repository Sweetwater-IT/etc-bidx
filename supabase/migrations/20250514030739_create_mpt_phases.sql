-- Create mpt_phases table with individual columns for standard equipment
CREATE TABLE IF NOT EXISTS mpt_phases (
    id SERIAL PRIMARY KEY,
    mpt_rental_entry_id INTEGER NOT NULL REFERENCES mpt_rental_entries(id) ON DELETE CASCADE,
    phase_index INTEGER NOT NULL,
    name VARCHAR(255),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    personnel INTEGER,
    days INTEGER,
    emergency Boolean,
    number_trucks INTEGER,
    additional_rated_hours NUMERIC(10, 2),
    additional_non_rated_hours NUMERIC(10, 2),
    maintenance_trips INTEGER,
    
    -- Standard equipment quantities as individual columns
    hivp_quantity INTEGER DEFAULT 0,
    post_quantity INTEGER DEFAULT 0,
    covers_quantity INTEGER DEFAULT 0,
    h_stand_quantity INTEGER DEFAULT 0,
    sharps_quantity INTEGER DEFAULT 0,
    b_lights_quantity INTEGER DEFAULT 0,
    sandbag_quantity INTEGER DEFAULT 0,
    ac_lights_quantity INTEGER DEFAULT 0,
    type_xivp_quantity INTEGER DEFAULT 0,
    metal_stands_quantity INTEGER DEFAULT 0,
    six_foot_wings_quantity INTEGER DEFAULT 0,
    four_foot_type_iii_quantity INTEGER DEFAULT 0,
    
    -- Store custom light and drum items as JSONB
    custom_light_and_drum_items JSONB,
    
    -- Unique constraint for phase index within each rental
    UNIQUE(mpt_rental_entry_id, phase_index)
);

-- Create index for foreign key
CREATE INDEX idx_mpt_phases_rental ON mpt_phases (mpt_rental_entry_id);
