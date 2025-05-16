ALTER TABLE bid_estimates
ADD COLUMN contract_number VARCHAR(255);

CREATE INDEX idx_bid_estimates_contract_number ON bid_estimates(contract_number);

-- Add a unique constraint on bid_estimate_id in admin_data_entries table
ALTER TABLE admin_data_entries
ADD CONSTRAINT unique_admin_data_bid_estimate_id UNIQUE (bid_estimate_id);

-- For mpt_rental_entries
ALTER TABLE mpt_rental_entries
ADD CONSTRAINT unique_mpt_rental_bid_estimate_id UNIQUE (bid_estimate_id);

-- For flagging_entries
ALTER TABLE flagging_entries
ADD CONSTRAINT unique_flagging_bid_estimate_id UNIQUE (bid_estimate_id);

-- For service_work_entries
ALTER TABLE service_work_entries
ADD CONSTRAINT unique_service_work_bid_estimate_id UNIQUE (bid_estimate_id);