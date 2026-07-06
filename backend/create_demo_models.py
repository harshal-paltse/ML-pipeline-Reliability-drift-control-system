"""
Generate 5 demo ML models for the Pipeline Analyzer.
Each model has different quality levels to showcase different analysis results.

Run: python create_demo_models.py
"""
import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score

np.random.seed(42)
os.makedirs("demo_models", exist_ok=True)

# ── Generate realistic Indian credit risk dataset ─────────────────────────────
N = 2000
print("Generating Indian credit risk dataset...")

age              = np.random.randint(21, 65, N)
annual_income    = np.random.normal(600000, 250000, N).clip(120000, 3000000).astype(int)
cibil_score      = np.random.normal(680, 90, N).clip(300, 900).astype(int)
employment_years = np.random.randint(0, 25, N)
loan_amount      = np.random.normal(500000, 300000, N).clip(50000, 5000000).astype(int)
existing_loans   = np.random.randint(0, 5, N)
loan_tenure      = np.random.choice([12, 24, 36, 48, 60, 84, 120], N)

# Realistic approval logic
score = (
    (cibil_score - 300) / 600 * 0.40
    + (annual_income - 120000) / 2880000 * 0.25
    + employment_years / 25 * 0.15
    + (1 - loan_amount / 5000000) * 0.10
    + (1 - existing_loans / 5) * 0.10
)
noise    = np.random.normal(0, 0.06, N)
prob     = np.clip(score + noise, 0, 1)
approved = (prob > 0.48).astype(int)

X_full = np.column_stack([age, annual_income, cibil_score, employment_years,
                           loan_amount, existing_loans, loan_tenure])
y_full = approved

FEATURES = ["age", "annual_income_inr", "cibil_score", "employment_years",
            "loan_amount_inr", "existing_loans", "loan_tenure_months"]

X_train, X_test, y_train, y_test = train_test_split(
    X_full, y_full, test_size=0.2, random_state=42, stratify=y_full
)

print(f"Dataset: {N} rows | Approval rate: {approved.mean()*100:.1f}%")
print(f"Train: {len(X_train)} | Test: {len(X_test)}")
print()

models_info = []

# =============================================================================
# MODEL 1 — Good RandomForest (production-ready, high score expected)
# =============================================================================
print("=" * 60)
print("MODEL 1: Good RandomForest (production-ready)")
print("=" * 60)

clf1 = RandomForestClassifier(
    n_estimators=100,
    max_depth=8,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)
clf1.fit(X_train, y_train)
acc1 = accuracy_score(y_test, clf1.predict(X_test))
f1_1 = f1_score(y_test, clf1.predict(X_test))

joblib.dump(clf1, "demo_models/model1_good_randomforest.joblib")
print(f"Accuracy: {acc1:.4f}  F1: {f1_1:.4f}")
print("Expected analysis: HIGH score (~90+), few warnings only")
models_info.append({
    "file": "demo_models/model1_good_randomforest.joblib",
    "name": "Good RandomForest (Production Ready)",
    "features": ",".join(FEATURES),
    "notes": "Well-tuned RandomForest. n_estimators=100, max_depth=8, class_weight=balanced, random_state=42. Expected score: 90+"
})
print()

# =============================================================================
# MODEL 2 — Buggy RandomForest (many issues — low score expected)
# =============================================================================
print("=" * 60)
print("MODEL 2: Buggy RandomForest (many issues)")
print("=" * 60)

clf2 = RandomForestClassifier(
    n_estimators=3,       # BUG: too low
    max_depth=30,         # BUG: too deep, overfitting
    # no random_state     # BUG: not reproducible
    # no class_weight     # WARNING: imbalanced data
)
clf2.fit(X_train, y_train)
acc2 = accuracy_score(y_test, clf2.predict(X_test))
f1_2 = f1_score(y_test, clf2.predict(X_test))

joblib.dump(clf2, "demo_models/model2_buggy_randomforest.joblib")
print(f"Accuracy: {acc2:.4f}  F1: {f1_2:.4f}")
print("Expected analysis: LOW score (~50-65), 2-3 bugs detected")
models_info.append({
    "file": "demo_models/model2_buggy_randomforest.joblib",
    "name": "Buggy RandomForest (Needs Fixing)",
    "features": ",".join(FEATURES),
    "notes": "n_estimators=3 (too low), max_depth=30 (overfitting), no random_state, no class_weight. Expected score: 50-65"
})
print()

# =============================================================================
# MODEL 3 — LogisticRegression WITHOUT scaler (conflict)
# =============================================================================
print("=" * 60)
print("MODEL 3: LogisticRegression without scaler (conflict)")
print("=" * 60)

clf3 = LogisticRegression(
    max_iter=1000,
    random_state=42,
    # no class_weight  # WARNING
    # C=1.0 default is fine
)
clf3.fit(X_train, y_train)   # trained on unscaled data — conflict
acc3 = accuracy_score(y_test, clf3.predict(X_test))
f1_3 = f1_score(y_test, clf3.predict(X_test))

joblib.dump(clf3, "demo_models/model3_logreg_no_scaler.joblib")
print(f"Accuracy: {acc3:.4f}  F1: {f1_3:.4f}")
print("Expected analysis: MEDIUM score (~70), scaling conflict detected")
models_info.append({
    "file": "demo_models/model3_logreg_no_scaler.joblib",
    "name": "LogisticRegression (No Scaler - Conflict)",
    "features": ",".join(FEATURES),
    "notes": "LogisticRegression trained without StandardScaler. Scaling conflict will be detected. Expected score: 70"
})
print()

# =============================================================================
# MODEL 4 — LogisticRegression WITH scaler (good, with scaler file)
# =============================================================================
print("=" * 60)
print("MODEL 4: LogisticRegression WITH scaler (correct setup)")
print("=" * 60)

scaler4 = StandardScaler()
X_train_s = scaler4.fit_transform(X_train)
X_test_s  = scaler4.transform(X_test)

clf4 = LogisticRegression(
    C=1.0,
    max_iter=1000,
    class_weight="balanced",
    random_state=42
)
clf4.fit(X_train_s, y_train)
acc4 = accuracy_score(y_test, clf4.predict(X_test_s))
f1_4 = f1_score(y_test, clf4.predict(X_test_s))

joblib.dump(clf4,    "demo_models/model4_logreg_with_scaler.joblib")
joblib.dump(scaler4, "demo_models/model4_scaler.joblib")
print(f"Accuracy: {acc4:.4f}  F1: {f1_4:.4f}")
print("Expected analysis: HIGH score (~85+), scaler file available")
models_info.append({
    "file":        "demo_models/model4_logreg_with_scaler.joblib",
    "scaler_file": "demo_models/model4_scaler.joblib",
    "name":        "LogisticRegression (With Scaler - Correct)",
    "features":    ",".join(FEATURES),
    "notes":       "Properly scaled LogisticRegression with class_weight=balanced. Upload both model + scaler files. Expected score: 85+"
})
print()

# =============================================================================
# MODEL 5 — GradientBoosting (best model, very high score)
# =============================================================================
print("=" * 60)
print("MODEL 5: GradientBoosting (best quality)")
print("=" * 60)

clf5 = GradientBoostingClassifier(
    n_estimators=100,
    max_depth=4,
    learning_rate=0.1,
    subsample=0.8,
    random_state=42
)
clf5.fit(X_train, y_train)
acc5 = accuracy_score(y_test, clf5.predict(X_test))
f1_5 = f1_score(y_test, clf5.predict(X_test))

joblib.dump(clf5, "demo_models/model5_gradientboosting.joblib")
print(f"Accuracy: {acc5:.4f}  F1: {f1_5:.4f}")
print("Expected analysis: VERY HIGH score (~95+), minimal issues")
models_info.append({
    "file": "demo_models/model5_gradientboosting.joblib",
    "name": "GradientBoosting (Best Quality)",
    "features": ",".join(FEATURES),
    "notes": "Well-tuned GradientBoosting. n_estimators=100, max_depth=4, learning_rate=0.1. Expected score: 95+"
})
print()

# =============================================================================
# Print upload instructions
# =============================================================================
print("=" * 60)
print("ALL DEMO MODELS CREATED SUCCESSFULLY")
print("=" * 60)
print()
print("Files saved in: demo_models/")
print()

for i, m in enumerate(models_info, 1):
    print(f"MODEL {i}: {m['name']}")
    print(f"  File:     {m['file']}")
    if "scaler_file" in m:
        print(f"  Scaler:   {m['scaler_file']}")
    print(f"  Features: {m['features']}")
    print(f"  Notes:    {m['notes']}")
    print()

print("HOW TO USE:")
print("1. Go to http://localhost:5173/models")
print("2. Upload each .joblib file")
print("3. Set feature names: age,annual_income_inr,cibil_score,employment_years,loan_amount_inr,existing_loans,loan_tenure_months")
print("4. For Model 4: also upload model4_scaler.joblib as the scaler file")
print("5. Go to http://localhost:5173/pipeline")
print("6. Select a model and click 'Run Analysis'")
print()
print("EXPECTED SCORES:")
print("  Model 1 (Good RF):          ~90+  — few warnings")
print("  Model 2 (Buggy RF):         ~55   — 2-3 bugs detected, code rewritten")
print("  Model 3 (LR no scaler):     ~70   — scaling conflict")
print("  Model 4 (LR with scaler):   ~85+  — clean")
print("  Model 5 (GradientBoosting): ~95+  — best quality")
