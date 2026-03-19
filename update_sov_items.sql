-- Alter the sov_items table to add uom columns and drop the old uom column
ALTER TABLE public.sov_items DROP COLUMN uom;
ALTER TABLE public.sov_items ADD COLUMN uom_1 text;
ALTER TABLE public.sov_items ADD COLUMN uom_2 text;
ALTER TABLE public.sov_items ADD COLUMN uom_3 text;
ALTER TABLE public.sov_items ADD COLUMN uom_4 text;
ALTER TABLE public.sov_items ADD COLUMN uom_5 text;
ALTER TABLE public.sov_items ADD COLUMN uom_6 text;

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0001',
    '0901-0001',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0002',
    '0901-0002',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0003',
    '0901-0003',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0004',
    '0901-0004',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0005',
    '0901-0005',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0006',
    '0901-0006',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0007',
    '0901-0007',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0008',
    '0901-0008',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0009',
    '0901-0009',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0010',
    '0901-0010',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0011',
    '0901-0011',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0012',
    '0901-0012',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0013',
    '0901-0013',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0014',
    '0901-0014',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0015',
    '0901-0015',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0016',
    '0901-0016',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0017',
    '0901-0017',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0018',
    '0901-0018',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0019',
    '0901-0019',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0020',
    '0901-0020',
    'MAINTENANCE AND PROTECTION OF TRAFFIC DURING CONSTRUCTION',
    'MAINTENANCE AND PROTECTION OF TRAFFIC',
    'MPT',
    'LUMP SUM',
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0240',
    '0901-0240',
    'ADD''L TRAFFIC CONTROL SIGNS',
    'ADD''L TRAFFIC CONTROL SIGNS',
    'MPT',
    NULL,
    'SQ. FT.',
    NULL,
    'EA/DAY',
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0241',
    'RENTAL',
    'ADD''L TRAFFIC CONTROL DEVICES, VERTICAL PANELS',
    'ADD''L TRAFFIC CONTROL DEVICES, VERTICAL PANELS',
    'MPT',
    NULL,
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0242',
    'RENTAL',
    'ADD''L TRAFFIC CONTROL DEVICES, DRUMS',
    'ADD''L TRAFFIC CONTROL DEVICES, DRUMS',
    'MPT',
    NULL,
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-0243',
    'RENTAL',
    'ADD''L TRAFFIC CONTROL DEVICES, CONES',
    'ADD''L TRAFFIC CONTROL DEVICES, CONES',
    'MPT',
    NULL,
    NULL,
    NULL,
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-LANE CLOSURE',
    'SERVICE',
    'LANE CLOSURE',
    'LANE CLOSURE',
    'LANE CLOSURE',
    'LUMP SUM',
    NULL,
    'PER HOUR',
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0901-FLAGGING',
    'SERVICE',
    'FLAGGING',
    'FLAGGING',
    'FLAGGING',
    'LUMP SUM',
    NULL,
    'PER HOUR',
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0931-0001',
    '0931-0001',
    'POST MOUNTED SIGNS, TYPE B',
    'POST MOUNTED SIGNS, TYPE B',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0931-0002',
    '0931-0002',
    'POST MOUNTED SIGNS, TYPE B, STEEL CHANNEL BAR POST',
    'POST MOUNTED SIGNS, TYPE B, STEEL CHANNEL BAR POST',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0931-0003',
    '0931-0003',
    'POST MOUNTED SIGNS, TYPE B, STEEL SQUARE POST',
    'POST MOUNTED SIGNS, TYPE B, STEEL SQUARE POST',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0932-0001',
    '0932-0001',
    'POST MOUNTED SIGNS, TYPE C',
    'POST MOUNTED SIGNS, TYPE C',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0935-0001',
    '0935-0001',
    'POST MOUNTED SIGNS, TYPE F',
    'POST MOUNTED SIGNS, TYPE F',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0941-0001',
    '0941-0001',
    'RESET POST MOUNTED SIGNS, TYPE B',
    'RESET POST MOUNTED SIGNS, TYPE B',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0942-0002',
    '0942-0002',
    'RESET POST MOUNTED SIGNS, TYPE C',
    'RESET POST MOUNTED SIGNS, TYPE C',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0945-0001',
    '0945-0001',
    'RESET POST MOUNTED SIGNS, TYPE F',
    'RESET POST MOUNTED SIGNS, TYPE F',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0971-0001',
    '0971-0001',
    'REMOVE POST MOUNTED SIGNS, TYPE B',
    'REMOVE POST MOUNTED SIGNS, TYPE B',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0972-0001',
    '0972-0001',
    'REMOVE POST MOUNTED SIGNS, TYPE C',
    'REMOVE POST MOUNTED SIGNS, TYPE C',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0975-0001',
    '0975-0001',
    'REMOVE POST MOUNTED SIGNS, TYPE F',
    'REMOVE POST MOUNTED SIGNS, TYPE F',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '2931-0001',
    '2931-0001',
    'POST MOUNTED SIGNS, TYPE B (IN SQ. METERS)',
    'POST MOUNTED SIGNS, TYPE B (IN SQ. METERS)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '2932-0001',
    '2932-0001',
    'POST MOUNTED SIGNS, TYPE C (IN SQ. METERS)',
    'POST MOUNTED SIGNS, TYPE C (IN SQ. METERS)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '2934-0002',
    '2934-0002',
    'POST MOUNTED SIGNS, TYPE E (IN SQ. METERS)',
    'POST MOUNTED SIGNS, TYPE E (IN SQ. METERS)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '2935-0001',
    '2935-0001',
    'POST MOUNTED SIGNS, TYPE F (IN SQ. METERS)',
    'POST MOUNTED SIGNS, TYPE F (IN SQ. METERS)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '2941-0001',
    '2941-0001',
    'RESET POST MOUNTED SIGNS, TYPE B',
    'RESET POST MOUNTED SIGNS, TYPE B',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '2942-0002',
    '2942-0002',
    'RESET POST MOUNTED SIGNS, TYPE C',
    'RESET POST MOUNTED SIGNS, TYPE C',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '2945-0001',
    '2945-0001',
    'RESET POST MOUNTED SIGNS, TYPE F',
    'RESET POST MOUNTED SIGNS, TYPE F',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '2971-0001',
    '2971-0001',
    'REMOVE POST MOUNTED SIGNS, TYPE B',
    'REMOVE POST MOUNTED SIGNS, TYPE B',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '2972-0001',
    '2972-0001',
    'REMOVE POST MOUNTED SIGNS, TYPE C',
    'REMOVE POST MOUNTED SIGNS, TYPE C',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '2975-0001',
    '2975-0001',
    'REMOVE POST MOUNTED SIGNS, TYPE F',
    'REMOVE POST MOUNTED SIGNS, TYPE F',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0100',
    '0937-0100',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE A, (Y/B)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE A, (Y/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0101',
    '0937-0101',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE A, (Y/Y)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE A, (Y/Y)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0102',
    '0937-0102',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE A, (W/B)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE A, (W/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0103',
    '0937-0103',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE A, (W/W)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE A, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0104',
    '0937-0104',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (Y/B)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (Y/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0105',
    '0937-0105',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (Y/Y)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (Y/Y)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0106',
    '0937-0106',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (W/B)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (W/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0107',
    '0937-0107',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (W/W)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0108',
    '0937-0108',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CS, (Y/B)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CS, (Y/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0109',
    '0937-0109',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CS, (Y/Y)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CS, (Y/Y)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0110',
    '0937-0110',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CS, (W/B)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CS, (W/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0111',
    '0937-0111',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CS, (W/W)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CS, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0112',
    '0937-0112',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE D, (Y/B)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE D, (Y/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0113',
    '0937-0113',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE D, (W/B)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE D, (W/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0114',
    '0937-0114',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE D, (W/W)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE D, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0115',
    '0937-0115',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE A, (Y/R)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE A, (Y/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0116',
    '0937-0116',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE A, (W/R)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE A, (W/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0117',
    '0937-0117',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (Y/R)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (Y/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0118',
    '0937-0118',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (W/R)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (W/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0119',
    '0937-0119',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CS, (Y/R)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CS, (Y/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0120',
    '0937-0120',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CS, (W/R)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CS, (W/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0121',
    '0937-0121',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE D, (Y/R)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE D, (Y/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0122',
    '0937-0122',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE D, (W/R',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE D, (W/R',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0123',
    '0937-0123',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (Y/W)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE B, (Y/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0124',
    '0937-0124',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE D, (Y/W)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE D, (Y/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0130',
    '0937-0130',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CW, (Y/B)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CW, (Y/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0131',
    '0937-0131',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CW, (Y/Y)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CW, (Y/Y)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0132',
    '0937-0132',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CW, (W/B)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CW, (W/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0133',
    '0937-0133',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CW, (W/W)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CW, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0134',
    '0937-0134',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CW, (Y/R)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CW, (Y/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0135',
    '0937-0135',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CW, (W/R)',
    'GUIDE RAIL MOUNTED DELINEATOR TYPE CW, (W/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0195',
    '0937-0195',
    'BARRIER MOUNTED DELINEATOR, SIDE MOUNT TYPE R, (W/W)',
    'BARRIER MOUNTED DELINEATOR, SIDE MOUNT TYPE R, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0196',
    '0937-0196',
    'BARRIER MOUNTED DELINEATOR, TOP MOUNT TYPE R, (W/W)',
    'BARRIER MOUNTED DELINEATOR, TOP MOUNT TYPE R, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0197',
    '0937-0197',
    'BARRIER MOUNTED DELINEATOR, TOP MOUNT TYPE R, (Y/B)',
    'BARRIER MOUNTED DELINEATOR, TOP MOUNT TYPE R, (Y/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0198',
    '0937-0198',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE R, (W/B)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE R, (W/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0199',
    '0937-0199',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE R, (Y/Y)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE R, (Y/Y)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0200',
    '0937-0200',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE R, (Y/B)',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE R, (Y/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0201',
    '0937-0201',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE R, (W/B)',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE R, (W/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0202',
    '0937-0202',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE O, (Y/B)',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE O, (Y/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0203',
    '0937-0203',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE O, (W/B)',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE O, (W/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0204',
    '0937-0204',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE P, (Y/B)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE P, (Y/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0205',
    '0937-0205',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE P, (W/B)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE P, (W/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0206',
    '0937-0206',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE P, (Y/Y)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE P, (Y/Y)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0207',
    '0937-0207',
    'BARRIER MOUNTED DELINEATOR, TOP AND SIDE-MOUNT TYPE R, (Y/B)',
    'BARRIER MOUNTED DELINEATOR, TOP AND SIDE-MOUNT TYPE R, (Y/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0208',
    '0937-0208',
    'BARRIER MOUNTED DELINEATOR, TOP AND SIDE-MOUNT TYPE R, (W/B)',
    'BARRIER MOUNTED DELINEATOR, TOP AND SIDE-MOUNT TYPE R, (W/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0209',
    '0937-0209',
    'BARRIER MOUNTED DELINEATOR, TOP AND SIDE-MOUNT TYPE R, (Y/Y)',
    'BARRIER MOUNTED DELINEATOR, TOP AND SIDE-MOUNT TYPE R, (Y/Y)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0210',
    '0937-0210',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE S, (Y/B)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE S, (Y/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0211',
    '0937-0211',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE S, (W/B)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE S, (W/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0212',
    '0937-0212',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE S, (Y/Y)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE S, (Y/Y)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0213',
    '0937-0213',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE WZ, (O/B)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE WZ, (O/B)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0214',
    '0937-0214',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE WZ, (O/O)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE WZ, (O/O)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0215',
    '0937-0215',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE R, (Y/R)',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE R, (Y/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0216',
    '0937-0216',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE R, (W/R)',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE R, (W/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0217',
    '0937-0217',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE O, (Y/R)',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE O, (Y/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0218',
    '0937-0218',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE O, (W/R)',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE O, (W/R)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0219',
    '0937-0219',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE O, (W/W)',
    'BARRIER MOUNTED DELINEATOR, SIDE-MOUNT TYPE O, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0220',
    '0937-0220',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-2, WHITE POST WITH WHITE/YELLOW SHEETING',
    'FLEX. DELINEATOR POST, TYPE SM-2, WHT POST W/ WHT/YELL SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0221',
    '0937-0221',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE P, (W/W)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE P, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0222',
    '0937-0222',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE S, WHITE POST WITH WHITE/RED SHEETING',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE S, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0230',
    '0937-0230',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE P, (W/W)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE P, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0231',
    '0937-0231',
    'BARRIER MOUNTED DELINEATOR, TOP AND SIDE-MOUNT TYPE R, (W/W)',
    'BARRIER MOUNTED DELINEATOR, TOP AND SIDE-MOUNT TYPE R, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0232',
    '0937-0232',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE S, (W/W)',
    'BARRIER MOUNTED DELINEATOR, TOP-MOUNT TYPE S, (W/W)',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0300',
    '0937-0300',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-1, WHITE POST WITH WHITE SHEETING',
    'FLEX. DELINEATOR POST, SM-1, WHT POST W/ WHT SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0301',
    '0937-0301',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-1, YELLOW POST WITH YELLOW SHEETING',
    'FLEX. DELINEATOR POST, SM-1, YELL POST W/ YELL SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0302',
    '0937-0302',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-1, RED POST WITH RED SHEETING',
    'FLEX. DELINEATOR POST, SM-1, R POST W/ R SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0303',
    '0937-0303',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-1, RED POST WITH WHITE SHEETING',
    'FLEX. DELINEATOR POST, SM-1, R POST W/ WHT SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0304',
    '0937-0304',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-1, RED POST WITH YELLOW SHEETING',
    'FLEX. DELINEATOR POST, SM-1, R POST W/ Y SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0310',
    '0937-0310',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-2, WHITE POST WITH WHITE/BLANK SHEETING',
    'FLEX. DELINEATOR POST, SM-2, WHT POST W/ WHT/BLANK SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0311',
    '0937-0311',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-2, WHITE POST WITH WHITE/RED SHEETING					',
    'FLEX. DELINEATOR POST, SM-2, WHT POST W/ WHT/R SHEETING					',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0312',
    '0937-0312',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-2, WHITE POST WITH WHITE/WHITE SHEETING',
    'FLEX. DELINEATOR POST, SM-2, WHT POST W/ WHT/WHT SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0313',
    '0937-0313',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-2, YELLOW POST WITH YELLOW/BLANK SHEETING',
    'FLEX. DELINEATOR POST, SM-2, Y POST W/ Y/BLANK SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0314',
    '0937-0314',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-2, YELLOW POST WITH YELLOW/YELLOW SHEETING',
    'FLEX. DELINEATOR POST, SM-2, Y POST W/ Y/Y SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0315',
    '0937-0315',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-2, YELLOW POST WITH YELLOW/RED SHEETING',
    'FLEX. DELINEATOR POST, SM-2, Y POST W/ Y/R SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0316',
    '0937-0316',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-2, RED POST WITH RED/BLANK SHEETING',
    'FLEX. DELINEATOR POST, SM-2, R POST W/ R/BLANK SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0317',
    '0937-0317',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-2, RED POST WITH RED/WHITE SHEETING',
    'FLEX. DELINEATOR POST, SM-2, R POST W/ R/WHT SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0318',
    '0937-0318',
    'FLEXIBLE DELINEATOR POST, SURFACE-MOUNT TYPE SM-2, RED POST WITH RED/YELLOW SHEETING',
    'FLEX. DELINEATOR POST, SM-2, R POST W/ R/Y SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0320',
    '0937-0320',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-1, WHITE POST WITH WHITE SHEETING',
    'FLEX. DELINEATOR POST, GM-1, WHT POST W/ WHT SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0321',
    '0937-0321',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-1, YELLOW POST WITH YELLOW SHEETING',
    'FLEX. DELINEATOR POST, GM-1, Y POST W/ Y SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0322',
    '0937-0322',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-1, RED POST WITH RED SHEETING',
    'FLEX. DELINEATOR POST, GM-1, R POST W/ R SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0323',
    '0937-0323',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-1, RED POST WITH WHITE SHEETING',
    'FLEX. DELINEATOR POST, GM-1, R POST W/ WHT SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0324',
    '0937-0324',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-1, RED POST WITH YELLOW SHEETING',
    'FLEX. DELINEATOR POST, GM-1, R POST W/ Y SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0330',
    '0937-0330',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-2, WHITE POST WITH WHITE/BLANK SHEETING',
    'FLEX. DELINEATOR POST, GM-2, WHT POST W/ WHT/BLANK SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0331',
    '0937-0331',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-2, WHITE POST WITH WHITE/RED SHEETING',
    'FLEX. DELINEATOR POST, GM-2, WHT POST W/ WHT/R SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0332',
    '0937-0332',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-2, WHITE POST WITH WHITE/WHITE SHEETING',
    'FLEX. DELINEATOR POST, GM-2, WHT POST W/ WHT/WHT SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0333',
    '0937-0333',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-2, YELLOW POST WITH YELLOW/BLANK SHEETING',
    'FLEX. DELINEATOR POST, GM-2, Y POST W/ Y/BLANK SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0334',
    '0937-0334',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-2, YELLOW POST WITH YELLOW/YELLOW SHEETING',
    'FLEX. DELINEATOR POST, GM-2, Y POST W/ Y/Y SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0335',
    '0937-0335',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-2, YELLOW POST WITH YELLOW/RED SHEETING',
    'FLEX. DELINEATOR POST, GM-2, Y POST W/ Y/R SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0336',
    '0937-0336',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-2, RED POST WITH RED/BLANK SHEETING',
    'FLEX. DELINEATOR POST, GM-2, R POST W/ R/BLANK SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0337',
    '0937-0337',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-2, RED POST WITH RED/WHITE SHEETING',
    'FLEX. DELINEATOR POST, GM-2, R POST W/ R/WHT SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0338',
    '0937-0338',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-2, RED POST WITH RED/YELLOW SHEETING',
    'FLEX. DELINEATOR POST, GM-2, R POST W/ R/Y SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0339',
    '0937-0339',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-2, RED POST WITH WHITE/BLANK SHEETING',
    'FLEX. DELINEATOR POST, GM-2, R POST W/ WHT/BLANK SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    '0937-0340',
    '0937-0340',
    'FLEXIBLE DELINEATOR POST, GROUND-MOUNT TYPE GM-2, RED POST WITH YELLOW/BLANK SHEETING',
    'FLEX. DELINEATOR POST, GM-2, R POST W/ Y/BLANK SHEETING',
    'PERMANENT SIGN',
    NULL,
    'SQ. FT',
    NULL,
    NULL,
    NULL,
    NULL
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    'SERVICE',
    'SERVICE',
    'SERVICE',
    'SERVICE',
    'SERVICE',
    'LUMP SUM',
    'SQ. FT',
    'PER HOUR',
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

INSERT INTO public.sov_items (
    item_number,
    display_item_number,
    description,
    display_name,
    work_type,
    uom_1,
    uom_2,
    uom_3,
    uom_4,
    uom_5,
    uom_6
) VALUES (
    'DELIVERY',
    'DELIVERY',
    'DELIVERY',
    'DELIVERY',
    'DELIVERY',
    'LUMP SUM',
    'SQ. FT',
    'PER HOUR',
    'EA/DAY',
    'EA/MO',
    'EA/WK'
);

