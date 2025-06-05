ALTER TABLE bid_estimates ADD COLUMN notes text;

ADD COLUMN bid_estimate_id INTEGER REFERENCES bid_estimates(id);