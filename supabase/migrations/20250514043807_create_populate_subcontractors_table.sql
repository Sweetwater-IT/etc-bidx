-- Create subcontractors table
CREATE TABLE IF NOT EXISTS subcontractors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Insert subcontractors with CAPS names
INSERT INTO subcontractors (name) VALUES 
    ('ETC'),
    ('ATLAS'),
    ('ROADSAFE'),
    ('RAE-LYNN'),
    ('UNKNOWN'),
    ('OTHER');