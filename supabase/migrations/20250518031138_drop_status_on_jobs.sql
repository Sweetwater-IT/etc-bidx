alter table jobs drop column status;
ALTER TABLE job_numbers ALTER COLUMN sequential_number  DROP NOT NULL;
ALTER TABLE job_numbers ALTER COLUMN year  DROP NOT NULL;
ALTER TABLE job_numbers ALTER COLUMN owner_type  DROP NOT NULL;
ALTER TABLE job_numbers ALTER COLUMN branch_code  DROP NOT NULL;
ALTER TABLE mpt_static_equipment_info ALTER COLUMN payback_period DROP NOT NULL;

alter table jobs add column w9_added BOOLEAN;
alter table jobs add column eea_sharp_added BOOLEAN;
alter table jobs add column safety_program_added BOOLEAN;
alter table jobs add column sexual_harrassment_added BOOLEAN;
alter table jobs add column avenue_appeals_added BOOLEAN;
alter table jobs add column labor_group VARCHAR(55);
alter table files drop column job_number;
alter table files alter column file_type type text;