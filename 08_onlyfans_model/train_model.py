import os
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np
import joblib # Added for saving the model

# Get the directory where the script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def train_model(data_path: str) -> LogisticRegression:
    """Train a churn prediction model on the provided CSV dataset."""
    print(f"Reading data from: {data_path}")
    df = pd.read_csv(data_path)
    X = df.drop('churned', axis=1)
    y = df['churned']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LogisticRegression(max_iter=200)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    print(f"Model Accuracy: {accuracy_score(y_test, preds):.4f}")
    return model

if __name__ == "__main__":
    data_file_name = 'sample_churn_data.csv'
    model_file_name = 'churn_model.pkl'

    # Construct absolute paths for data and model files
    data_file_path = os.path.join(SCRIPT_DIR, data_file_name)
    model_file_path = os.path.join(SCRIPT_DIR, model_file_name)

    if not os.path.exists(data_file_path):
        print(f"'{data_file_name}' not found. Generating synthetic data...")
        np.random.seed(42)
        df = pd.DataFrame({
            'messages_sent': np.random.randint(1, 50, 100),
            'tips_received': np.random.randint(0, 20, 100),
            'days_inactive': np.random.randint(0, 30, 100),
            'churned': np.random.randint(0, 2, 100)
        })
        df.to_csv(data_file_path, index=False)
        print(f"Synthetic data saved to '{data_file_path}'")
    else:
        print(f"Using existing data file: '{data_file_path}'")

    print("Training churn prediction model...")
    trained_model = train_model(data_file_path)

    print(f"Saving trained model to '{model_file_path}'...")
    joblib.dump(trained_model, model_file_path)
    print("Model saved successfully.")
    print("Churn model training script finished.")
