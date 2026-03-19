import csv
import os

# Path to the CSV file
csv_path = '/Users/kenny/Downloads/sov_items_rows - sov_items_rows.csv (1).csv'

# Output SQL file
sql_file = 'update_sov_items.sql'

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    return s.replace("'", "''")

def generate_sql():
    with open(sql_file, 'w') as f:
        # Write the ALTER statements
        f.write("-- Alter the sov_items table to add uom columns and drop the old uom column\n")
        f.write("ALTER TABLE public.sov_items DROP COLUMN uom;\n")
        f.write("ALTER TABLE public.sov_items ADD COLUMN uom_1 text;\n")
        f.write("ALTER TABLE public.sov_items ADD COLUMN uom_2 text;\n")
        f.write("ALTER TABLE public.sov_items ADD COLUMN uom_3 text;\n")
        f.write("ALTER TABLE public.sov_items ADD COLUMN uom_4 text;\n")
        f.write("ALTER TABLE public.sov_items ADD COLUMN uom_5 text;\n")
        f.write("ALTER TABLE public.sov_items ADD COLUMN uom_6 text;\n\n")

        # Read and process CSV
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                item_number = row['item_number'].strip()
                display_item_number = row['display_item_number'].strip()
                description = escape_sql_string(row['description'])
                display_name = escape_sql_string(row['display_name'])
                work_type = row['work_type']

                # Collect non-empty uoms
                uoms = []
                for i in range(1, 7):
                    uom_key = f'uom_{i}'
                    uom_value = row.get(uom_key, '').strip()
                    uoms.append(f"'{escape_sql_string(uom_value)}'" if uom_value else 'NULL')

                # Generate INSERT statement
                insert_sql = f"""INSERT INTO public.sov_items (
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
    '{escape_sql_string(item_number)}',
    '{escape_sql_string(display_item_number)}',
    '{description}',
    '{display_name}',
    '{escape_sql_string(work_type)}',
    {uoms[0]},
    {uoms[1]},
    {uoms[2]},
    {uoms[3]},
    {uoms[4]},
    {uoms[5]}
);"""

                f.write(insert_sql + "\n\n")

if __name__ == '__main__':
    generate_sql()
    print(f"SQL file generated: {sql_file}")