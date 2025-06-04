# load_to_db.py

import psycopg2
import csv

conn = psycopg2.connect(
    dbname='analytics_db', user='analytics_user', password='analytics_pass', host='localhost'
)
cursor = conn.cursor()

with open('../data/payments_transformed_2025_05.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)  # skip header
    for row in reader:
        cursor.execute(
            'INSERT INTO payments(month, subscriber_id, amount) VALUES(%s, %s, %s)',
            (row[2], row[0], row[1])
        )
conn.commit()
cursor.close()
conn.close()
print('Transformed data loaded into analytics_db.payments')
