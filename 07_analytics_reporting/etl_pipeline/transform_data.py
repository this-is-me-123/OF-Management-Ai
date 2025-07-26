# transform_data.py

import pandas as pd

def transform_payments():
    df = pd.read_csv('../data/raw_payments_2025_05.csv')
    df['amount'] = df['amount'].astype(float)
    df['month'] = pd.to_datetime(df['date']).dt.month
    df.to_csv('../data/payments_transformed_2025_05.csv', index=False)
    print('Payments data transformed and saved')

if __name__ == '__main__':
    transform_payments()
