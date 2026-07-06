"""
Generate synthetic credit risk dataset (5000 rows).
Labeled as synthetic real-world credit data.
Run once: python generate_data.py
"""
import numpy as np
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()
np.random.seed(42)

PARQUET_DIR = os.getenv("PARQUET_DIR", "./parquet_data")
N = 5000

age = np.random.randint(21, 70, N)
income = np.random.normal(55000, 20000, N).clip(15000, 200000).astype(int)
credit_score = np.random.normal(650, 80, N).clip(300, 850).astype(int)
employment_years = np.random.randint(0, 30, N)
loan_amount = np.random.normal(15000, 8000, N).clip(1000, 60000).astype(int)

# Approval logic: higher credit score, income, employment = more likely approved
score = (
    (credit_score - 300) / 550 * 0.45
    + (income - 15000) / 185000 * 0.30
    + employment_years / 30 * 0.15
    + (1 - loan_amount / 60000) * 0.10
)
noise = np.random.normal(0, 0.05, N)
prob = np.clip(score + noise, 0, 1)
approved = (prob > 0.45).astype(int)

df = pd.DataFrame({
    "age": age,
    "income": income,
    "credit_score": credit_score,
    "employment_years": employment_years,
    "loan_amount": loan_amount,
    "approved": approved
})

# Save CSV
df.to_csv("credit_data.csv", index=False)
print(f"Saved credit_data.csv — {len(df)} rows, {approved.sum()} approved ({approved.mean()*100:.1f}%)")

# Save Parquet
os.makedirs(PARQUET_DIR, exist_ok=True)
df.to_parquet(os.path.join(PARQUET_DIR, "training_data.parquet"), index=False)
print(f"Saved {PARQUET_DIR}/training_data.parquet")
