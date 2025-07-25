# extract_of_data.py

import requests
import csv

OF_API_URL = 'https://api.onlyfans.com/v2'  # hypothetical endpoint
API_KEY = '<your_of_api_key>'

def extract_payments():
    headers = {'Authorization': f'Bearer {API_KEY}'}
    response = requests.get(f'{OF_API_URL}/payments', headers=headers)
    data = response.json()

    with open('../data/raw_payments_2025_05.csv', 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['subscriber_id', 'amount', 'date'])
        for rec in data['payments']:
            writer.writerow([rec['subscriber_id'], rec['amount'], rec['date']])
    print('Payments data extracted to raw_payments_2025_05.csv')

if __name__ == '__main__':
    extract_payments()
