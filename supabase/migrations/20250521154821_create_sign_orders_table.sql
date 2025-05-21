CREATE TABLE IF NOT EXISTS sign_orders (
    id SERIAL PRIMARY KEY,
    requestor VARCHAR(255),
    contractor_id INTEGER,
    order_date TIMESTAMP,
    need_date TIMESTAMP,
    job_type VARCHAR(100),
    sale BOOLEAN,
    rental BOOLEAN,
    job_number VARCHAR(100),
    signs JSONB,
    FOREIGN KEY (contractor_id) REFERENCES contractors(id)
);

ALTER TABLE sign_orders ADD Column status VARCHAR(55);
ALTER TABLE sign_orders drop column job_type;
ALTER TABLE sign_orders ADD COLUMN start_date VARCHAR(55);
ALTER TABLE sign_orders ADD COLUMN end_date VARCHAR(55);