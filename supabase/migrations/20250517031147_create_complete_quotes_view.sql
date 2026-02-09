CREATE OR REPLACE VIEW quotes_complete AS
SELECT
    q.id AS quote_id,
    q.quote_number,
    q.status,
    q.from_email,
    q.subject,
    q.body,
    q.date_sent,
    q.response_token,
    q.custom_terms_conditions,
    q.payment_terms,
    q.county,
    q.state_route,
    q.ecms_po_number,
    q.notes,
    q.bedford_sell_sheet,
    q.flagging_price_list,
    q.flagging_service_area,
    q.standard_terms,
    q.rental_agreements,
    q.equipment_sale,
    q.flagging_terms,
    q.created_at AS quote_created_at,
    q.updated_at AS quote_updated_at,
    
    -- Estimate or Job Information
    q.estimate_id,
    be.contract_number AS estimate_contract_number,
    q.job_id,
    jn.job_number ,
    
    -- Customer Information
    jsonb_agg(DISTINCT jsonb_build_object(
        'contractor_id', c.id,
        'name', c.name,
        'address_name', c.address_name,
        'address_contact', c.address_contact,
        'address_type', c.address_type,
        'address', c.address,
        'city', c.city,
        'state', c.state,
        'zip', c.zip,
        'main_phone', c.main_phone,
        'fax', c.fax,
        'web', c.web,
        'payment_terms', c.payment_terms,
        'customer_number', c.number
    )) FILTER (WHERE c.id IS NOT NULL) AS customers,
    
    -- Recipients Information
    jsonb_agg(DISTINCT jsonb_build_object(
        'recipient_id', qr.id,
        'email', qr.email,
        'cc', qr.cc,
        'bcc', qr.bcc,
        'point_of_contact', qr.point_of_contact,
        'contact_id', qr.customer_contacts_id,
        'contact_name', cc.name,
        'contact_email', cc.email,
        'contact_phone', cc.phone,
        'contact_role', cc.role
    )) FILTER (WHERE qr.id IS NOT NULL) AS recipients,
    
    -- Point of Contact
    (SELECT jsonb_build_object(
        'email', poc.email,
        'contact_id', poc.customer_contacts_id,
        'contact_name', cc_poc.name,
        'contact_phone', cc_poc.phone,
        'contact_role', cc_poc.role
    )
    FROM quote_recipients poc
    LEFT JOIN customer_contacts cc_poc ON poc.customer_contacts_id = cc_poc.id
    WHERE poc.quote_id = q.id AND poc.point_of_contact = true
    LIMIT 1) AS point_of_contact,
    
    -- Quote Items
    jsonb_agg(DISTINCT jsonb_build_object(
        'item_id', qi.id,
        'item_number', qi.item_number,
        'description', qi.description,
        'uom', qi.uom,
        'notes', qi.notes,
        'quantity', qi.quantity,
        'unit_price', qi.unit_price,
        'discount', qi.discount,
        'discount_type', qi.discount_type,
        'associated_items', (
            SELECT jsonb_agg(jsonb_build_object(
                'id', ai.id,
                'item_number', ai.item_number,
                'description', ai.description,
                'uom', ai.uom,
                'quantity', ai.quantity,
                'unit_price', ai.unit_price,
                'notes', ai.notes
            ))
            FROM associated_items ai
            WHERE ai.quote_item_id = qi.id
        )
    )) FILTER (WHERE qi.id IS NOT NULL) AS quote_items,
    
    -- Attached Files
    jsonb_agg(DISTINCT jsonb_build_object(
        'file_id', f.id,
        'file_name', f.filename
    )) FILTER (WHERE f.id IS NOT NULL) AS attached_files

FROM quotes q
LEFT JOIN bid_estimates be ON q.estimate_id = be.id
LEFT JOIN jobs j ON q.job_id = j.id
INNER JOIN job_numbers jn ON jn.id = j.job_number_id
LEFT JOIN quotes_customers qc ON q.id = qc.quote_id
LEFT JOIN contractors c ON qc.contractor_id = c.id
LEFT JOIN quote_recipients qr ON q.id = qr.quote_id
LEFT JOIN customer_contacts cc ON qr.customer_contacts_id = cc.id
LEFT JOIN quote_items qi ON q.id = qi.quote_id
LEFT JOIN files f ON q.id = f.quote_id

GROUP BY 
    q.id, 
    q.quote_number,
    q.status,
    q.from_email,
    q.subject,
    q.body,
    q.date_sent,
    q.response_token,
    q.custom_terms_conditions,
    q.payment_terms,
    q.county,
    q.state_route,
    q.ecms_po_number,
    q.notes,
    q.bedford_sell_sheet,
    q.flagging_price_list,
    q.flagging_service_area,
    q.standard_terms,
    q.rental_agreements,
    q.equipment_sale,
    q.flagging_terms,
    q.created_at,
    q.updated_at,
    q.estimate_id,
    be.contract_number,
    q.job_id,
    jn.job_number;