import os
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np

def train_model(data_path: str) -> LogisticRegression:
    """Train a churn prediction model on the provided CSV dataset."""
    df = pd.read_csv(data_path)
    X = df.drop('churned', axis=1)
    y = df['churned']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LogisticRegression(max_iter=200)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    print('Accuracy:', accuracy_score(y_test, preds))
    return model

if __name__ == "__main__":
    sample_file = 'sample_churn_data.csv'
    if not os.path.exists(sample_file):
        np.random.seed(42)
        df = pd.DataFrame({
            'messages_sent': np.random.randint(1, 50, 100),
            'tips_received': np.random.randint(0, 20, 100),
            'days_inactive': np.random.randint(0, 30, 100),
            'churned': np.random.randint(0, 2, 100)
        })
        df.to_csv(sample_file, index=False)
    train_model(sample_file)
