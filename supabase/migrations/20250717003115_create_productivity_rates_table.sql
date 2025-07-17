CREATE TABLE IF NOT EXISTS productivity_rates (
    id SERIAL PRIMARY KEY,
    type_b_install DECIMAL(10, 2),
    type_b_reset DECIMAL(10, 2),
    type_b_remove DECIMAL(10, 2),
    type_f_install DECIMAL(10, 2),
    type_f_reset DECIMAL(10, 2),
    type_f_remove DECIMAL(10, 2),
    type_c_install DECIMAL(10, 2),
    max_daily_hours DECIMAL(10, 2),
    flex_delineator DECIMAL(10, 2)
);


INSERT INTO items (name, price) VALUES
('HI_REFLECTIVE_STRIPS', 5.28),
('FYG_REFLECTIVE_STRIPS', 7.81),
('STIFFENER_PER_INCH', 0.75),
('JENNY_BRACKET', 90.00),
('TMZ_BRACKET', 50.00),
('PERM_SIGN_PRICE_SQ_FT', 12.00),
('WOOD_POST_METAL_SLEEVE', 200.00);
INSERT INTO items (name, price) VALUES ('PERM_SIGN_COST_SQ_FT', 6.65);

CREATE TABLE IF NOT EXISTS general_static_assumptions (
    id SERIAL PRIMARY KEY,
    material_markup DECIMAL(10, 2),
    truck_dispatch_fee DECIMAL(10, 2),
    target_moic INTEGER,
    mpg_per_truck DECIMAL(10, 2),
    payback_period INTEGER,
    annual_utilization DECIMAL(10, 2)
);

INSERT INTO general_static_assumptions (material_markup, truck_dispatch_fee, target_moic, mpg_per_truck, payback_period, annual_utilization) VALUES (55, 50, 2, 8, 5, .75);