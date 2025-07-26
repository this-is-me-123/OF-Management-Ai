# detect_anomalies.py

import pandas as pd
from sklearn.ensemble import IsolationForest

df = pd.read_csv('../data/payments_transformed_2025_05.csv')

clf = IsolationForest(contamination=0.05)
df['anomaly'] = clf.fit_predict(df[['amount']])
anomalies = df[df['anomaly'] == -1]
print('Anomalous payment records:')
print(anomalies)
