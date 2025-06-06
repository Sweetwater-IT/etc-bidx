ALTER TABLE bid_estimates ADD COLUMN notes text;

ALTER TABLE files ADD COLUMN bid_estimate_id INTEGER REFERENCES bid_estimates(id);