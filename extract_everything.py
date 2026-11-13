import openpyxl
import re

print("Loading Excel file...")
wb = openpyxl.load_workbook('الاساس.xlsx', data_only=True)
ws = wb['Sheet1']

sql_statements = ["TRUNCATE public.employees;"]

# Start from row 5 (Headers are on row 4)
for row in ws.iter_rows(min_row=5, values_only=True):
    # Check if row is empty or missing name
    emp_num = str(row[2]).replace('.0', '').strip() if row[2] else ''
    name = str(row[3]).strip() if row[3] else ''
    
    if not emp_num or not name or emp_num == 'None' or name == 'None':
        continue
        
    name_en = str(row[4]).strip() if row[4] else ''
    missing_docs = str(row[5]).strip() if row[5] else ''
    stopped = str(row[7]).strip() if row[7] else ''
    position = str(row[9]).strip() if row[9] else ''
    nationality = str(row[10]).strip() if row[10] else ''
    joining_date = str(row[11]).strip() if row[11] else ''
    rig_raw = str(row[12]).strip() if row[12] else ''
    passport = str(row[13]).strip() if row[13] else ''
    nat_id = str(row[14]).strip() if row[14] else ''
    phone = str(row[15]).strip() if row[15] else ''
    address = str(row[17]).strip() if row[17] else ''
    emergency = str(row[18]).strip() if row[18] else ''
    birth = str(row[19]).strip() if row[19] else ''

    # CLEAN THE RIG
    rig = "UNASSIGNED"
    if rig_raw and rig_raw != 'None':
        rig_clean = rig_raw.replace('ب', 'B').replace('B ', 'B').strip()
        if rig_clean in ['L', 'l', 'LAHEEB', 'laheeb', 'الهيب', 'لهيب', 'ساحة اللهيب']:
            rig = 'LAHEEB'
        elif re.match(r'^B(1[0-1]|[2-9])$', rig_clean, re.IGNORECASE):
            rig = rig_clean.upper()
        else:
            rig = "UNASSIGNED"

    # Clean strings for SQL
    def clean(val):
        if val == 'None' or not val: return ''
        return str(val).replace("'", "''")

    name = clean(name)
    name_en = clean(name_en)
    position = clean(position)
    nationality = clean(nationality)
    passport = clean(passport)
    nat_id = clean(nat_id)
    phone = clean(phone)
    address = clean(address)
    emergency = clean(emergency)
    birth = clean(birth)
    missing_docs = clean(missing_docs)
    joining_date = clean(joining_date)

    is_suspended = 'true' if stopped.upper() == 'STOPPED' else 'false'

    # Build SQL
    sql = f"INSERT INTO public.employees (employee_number, name, name_en, position, nationality, rig, passport_id, national_id, phone, address, emergency_phone, birth_date_location, missing_documents, joining_date, is_suspended) VALUES ('{emp_num}', '{name}', '{name_en}', '{position}', '{nationality}', '{rig}', '{passport}', '{nat_id}', '{phone}', '{address}', '{emergency}', '{birth}', '{missing_docs}', '{joining_date}', {is_suspended});"
    sql_statements.append(sql)

with open('import_all.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_statements))

print(f"Done! Processed {len(sql_statements)-1} employees.")
print("Generated import_all.sql")
