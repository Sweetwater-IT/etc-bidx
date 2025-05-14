-- Create sheeting_type enum
CREATE TYPE sheeting_type AS ENUM ('HI', 'DG', 'Special');

-- Create mpt_primary_signs table
CREATE TABLE IF NOT EXISTS mpt_primary_signs (
    id SERIAL PRIMARY KEY,
    phase_id INTEGER NOT NULL REFERENCES mpt_phases(id) ON DELETE CASCADE,
    sign_id TEXT NOT NULL,
    phase_index INTEGER NOT NULL,
    contract_number VARCHAR(255),
    width NUMERIC(10, 2),
    height NUMERIC(10, 2),
    quantity INTEGER,
    sheeting sheeting_type,
    is_custom BOOLEAN DEFAULT FALSE,
    designation TEXT,
    description TEXT,
    associated_structure TEXT,
    b_lights INTEGER DEFAULT 0,
    covers INTEGER DEFAULT 0,
    
    -- Unique constraint for sign within phase
    UNIQUE(phase_id, sign_id)
);

-- Create index for foreign key
CREATE INDEX idx_primary_signs_phase ON mpt_primary_signs (phase_id);

-- Create mpt_secondary_signs table
CREATE TABLE IF NOT EXISTS mpt_secondary_signs (
    id SERIAL PRIMARY KEY,
    phase_id INTEGER NOT NULL REFERENCES mpt_phases(id) ON DELETE CASCADE,
    sign_id TEXT NOT NULL,
    primary_sign_id TEXT NOT NULL,
    contract_number VARCHAR(255),
    width NUMERIC(10, 2),
    height NUMERIC(10, 2),
    sheeting sheeting_type,
    is_custom BOOLEAN DEFAULT FALSE,
    designation TEXT,
    description TEXT,
    
    -- Unique constraint for sign within phase
    UNIQUE(phase_id, sign_id)
);

-- Create index for foreign key
CREATE INDEX idx_secondary_signs_phase ON mpt_secondary_signs (phase_id);