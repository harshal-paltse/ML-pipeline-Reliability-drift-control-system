"""
ML Pipeline Analyzer -- inspects uploaded models, finds bugs/conflicts,
scores quality, and rewrites the full pipeline code.
"""
import os, hashlib, logging, inspect, textwrap
from datetime import datetime
from typing import Any, Dict, List, Tuple
import numpy as np

logger = logging.getLogger(__name__)

# ── Severity levels ───────────────────────────────────────────────────────────
CRITICAL = "critical"
HIGH     = "high"
MEDIUM   = "medium"
LOW      = "low"
INFO     = "info"


def _short_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:8]


# ═══════════════════════════════════════════════════════════════════════════════
# 1. MODEL INTROSPECTION
# ═══════════════════════════════════════════════════════════════════════════════

def introspect_model(clf, feature_names: List[str]) -> Dict:
    """Extract all inspectable properties from a loaded model."""
    info = {
        "class_name":    type(clf).__name__,
        "module":        type(clf).__module__,
        "params":        {},
        "has_predict_proba": hasattr(clf, "predict_proba"),
        "has_feature_importances": hasattr(clf, "feature_importances_"),
        "has_coef": hasattr(clf, "coef_"),
        "is_fitted": False,
        "n_features": None,
        "n_classes": None,
        "feature_importances": {},
        "estimator_type": getattr(clf, "_estimator_type", "unknown"),
    }

    # Hyperparameters
    try:
        info["params"] = clf.get_params()
    except Exception:
        pass

    # Fitted state
    try:
        from sklearn.utils.validation import check_is_fitted
        check_is_fitted(clf)
        info["is_fitted"] = True
    except Exception:
        info["is_fitted"] = False

    # n_features
    for attr in ("n_features_in_", "n_features_"):
        if hasattr(clf, attr):
            info["n_features"] = getattr(clf, attr)
            break

    # n_classes
    if hasattr(clf, "classes_"):
        info["n_classes"] = len(clf.classes_)

    # Feature importances
    if hasattr(clf, "feature_importances_") and feature_names:
        imps = clf.feature_importances_
        if len(imps) == len(feature_names):
            info["feature_importances"] = dict(zip(feature_names, [round(float(v), 4) for v in imps]))

    return info


# ═══════════════════════════════════════════════════════════════════════════════
# 2. BUG & CONFLICT DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

def detect_bugs(clf, feature_names: List[str], info: Dict) -> Tuple[List, List, List]:
    """
    Returns (bugs, conflicts, warnings).
    Each bug: {severity, category, title, detail, fix}
    Each conflict: {type, description, resolution}
    Each warning: {category, message}
    """
    bugs      = []
    conflicts = []
    warnings  = []

    # ── Bug 1: Model not fitted ───────────────────────────────────────────────
    if not info["is_fitted"]:
        bugs.append({
            "severity": CRITICAL,
            "category": "model_state",
            "title":    "Model is not fitted",
            "detail":   "The model has not been trained (fit() was never called). It cannot make predictions.",
            "fix":      "Call model.fit(X_train, y_train) before saving with joblib.dump()."
        })

    # ── Bug 2: Feature count mismatch ─────────────────────────────────────────
    if info["n_features"] and len(feature_names) != info["n_features"]:
        bugs.append({
            "severity": CRITICAL,
            "category": "feature_mismatch",
            "title":    f"Feature count mismatch: declared {len(feature_names)}, model expects {info['n_features']}",
            "detail":   f"You declared {len(feature_names)} feature names but the model was trained on {info['n_features']} features.",
            "fix":      f"Update feature_names to exactly {info['n_features']} names matching training order."
        })

    # ── Bug 3: No predict_proba ───────────────────────────────────────────────
    if not info["has_predict_proba"]:
        bugs.append({
            "severity": HIGH,
            "category": "missing_capability",
            "title":    "Model lacks predict_proba -- confidence scores unavailable",
            "detail":   f"{info['class_name']} does not support probability estimates. Confidence will always be 0.5.",
            "fix":      "Use a probabilistic classifier (RandomForest, LogisticRegression, GradientBoosting) or wrap with CalibratedClassifierCV."
        })

    # ── Bug 4: Binary classification check ───────────────────────────────────
    if info["n_classes"] and info["n_classes"] > 2:
        warnings.append({
            "category": "multiclass",
            "message":  f"Model has {info['n_classes']} classes. Platform is optimised for binary classification. Multi-class output will use max probability."
        })

    # ── Bug 5: Hyperparameter issues ─────────────────────────────────────────
    params = info.get("params", {})

    if "n_estimators" in params and params["n_estimators"] < 10:
        bugs.append({
            "severity": HIGH,
            "category": "hyperparameter",
            "title":    f"n_estimators={params['n_estimators']} is dangerously low",
            "detail":   "Too few estimators causes high variance and poor generalisation.",
            "fix":      "Set n_estimators >= 100 for production models."
        })

    if "max_depth" in params and params["max_depth"] is not None and params["max_depth"] > 20:
        bugs.append({
            "severity": MEDIUM,
            "category": "hyperparameter",
            "title":    f"max_depth={params['max_depth']} may cause overfitting",
            "detail":   "Very deep trees memorise training data and generalise poorly.",
            "fix":      "Set max_depth between 5–15 for most tabular datasets."
        })

    if "random_state" not in params or params.get("random_state") is None:
        warnings.append({
            "category": "reproducibility",
            "message":  "No random_state set -- results are not reproducible across runs."
        })

    if "C" in params and params["C"] > 1000:
        bugs.append({
            "severity": MEDIUM,
            "category": "hyperparameter",
            "title":    f"Regularisation C={params['C']} is very high (near zero regularisation)",
            "detail":   "High C in LogisticRegression/SVM means almost no regularisation, risking overfitting.",
            "fix":      "Use C between 0.01 and 10 for most problems."
        })

    # ── Bug 6: Feature importance all zeros ───────────────────────────────────
    if info["has_feature_importances"] and info["feature_importances"]:
        zero_feats = [f for f, v in info["feature_importances"].items() if v == 0.0]
        if len(zero_feats) == len(feature_names):
            bugs.append({
                "severity": HIGH,
                "category": "feature_quality",
                "title":    "All feature importances are zero",
                "detail":   "The model learned nothing from any feature. Training data may be constant or corrupted.",
                "fix":      "Check training data for constant columns, data leakage, or incorrect labels."
            })
        elif zero_feats:
            warnings.append({
                "category": "feature_quality",
                "message":  f"Features with zero importance (unused): {', '.join(zero_feats)}. Consider removing them."
            })

    # ── Bug 7: Duplicate feature names ────────────────────────────────────────
    if len(feature_names) != len(set(feature_names)):
        from collections import Counter
        dupes = [f for f, c in Counter(feature_names).items() if c > 1]
        bugs.append({
            "severity": CRITICAL,
            "category": "feature_names",
            "title":    f"Duplicate feature names: {dupes}",
            "detail":   "Duplicate feature names cause ambiguous column selection and wrong predictions.",
            "fix":      "Ensure all feature names are unique."
        })

    # ── Bug 8: Empty feature names ────────────────────────────────────────────
    empty = [i for i, f in enumerate(feature_names) if not f.strip()]
    if empty:
        bugs.append({
            "severity": HIGH,
            "category": "feature_names",
            "title":    f"Empty feature name(s) at position(s): {empty}",
            "detail":   "Empty feature names will cause KeyError during prediction.",
            "fix":      "Provide meaningful names for all features."
        })

    # ── Conflict 1: Scaler mismatch ───────────────────────────────────────────
    model_name = info["class_name"]
    tree_models = {"RandomForestClassifier", "GradientBoostingClassifier",
                   "DecisionTreeClassifier", "ExtraTreesClassifier", "XGBClassifier"}
    scale_needed = {"LogisticRegression", "SVC", "SVR", "KNeighborsClassifier",
                    "MLPClassifier", "LinearSVC"}

    if model_name in scale_needed:
        conflicts.append({
            "type":        "scaling_required",
            "description": f"{model_name} is sensitive to feature scale but no scaler was uploaded.",
            "resolution":  "Upload a fitted StandardScaler or MinMaxScaler alongside the model."
        })

    if model_name in tree_models:
        warnings.append({
            "category": "scaling",
            "message":  f"{model_name} is scale-invariant. A scaler is not needed but won't cause errors."
        })

    # ── Conflict 2: Class imbalance warning ───────────────────────────────────
    if "class_weight" in params and params["class_weight"] is None and info["n_classes"] == 2:
        warnings.append({
            "category": "class_balance",
            "message":  "class_weight=None -- if your dataset is imbalanced, set class_weight='balanced'."
        })

    return bugs, conflicts, warnings


# ═══════════════════════════════════════════════════════════════════════════════
# 3. QUALITY SCORING
# ═══════════════════════════════════════════════════════════════════════════════

def compute_quality_scores(bugs: List, conflicts: List, warnings: List, info: Dict) -> Dict:
    """Compute 0–100 scores for each quality dimension."""

    # Code quality: penalise bugs by severity
    severity_penalty = {CRITICAL: 30, HIGH: 15, MEDIUM: 8, LOW: 3}
    code_penalty = sum(severity_penalty.get(b["severity"], 0) for b in bugs)
    code_quality = max(0.0, 100.0 - code_penalty)

    # Data quality: based on feature issues
    data_bugs = [b for b in bugs if b["category"] in ("feature_mismatch", "feature_names", "feature_quality")]
    data_penalty = sum(severity_penalty.get(b["severity"], 0) for b in data_bugs)
    data_quality = max(0.0, 100.0 - data_penalty)

    # Model health: fitted state + predict_proba + importances
    model_health = 100.0
    if not info["is_fitted"]:       model_health -= 50
    if not info["has_predict_proba"]: model_health -= 20
    if not info["has_feature_importances"]: model_health -= 10
    model_health = max(0.0, model_health)

    # Pipeline score: conflicts + warnings
    pipeline_penalty = len(conflicts) * 10 + len(warnings) * 3
    pipeline_score = max(0.0, 100.0 - pipeline_penalty)

    overall = round((code_quality * 0.35 + data_quality * 0.25 + model_health * 0.25 + pipeline_score * 0.15), 1)

    return {
        "overall_score":  overall,
        "code_quality":   round(code_quality, 1),
        "data_quality":   round(data_quality, 1),
        "model_health":   round(model_health, 1),
        "pipeline_score": round(pipeline_score, 1),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 4. PIPELINE CODE REWRITER
# ═══════════════════════════════════════════════════════════════════════════════

def rewrite_pipeline(clf, feature_names: List[str], info: Dict, bugs: List) -> Tuple[str, str, List]:
    """
    Generate a complete, production-ready ML pipeline Python script
    that fixes all detected bugs and follows best practices.
    Returns (code, summary, diff_lines).
    """
    model_class = info["class_name"]
    module      = info["module"]
    params      = info.get("params", {})

    # Fix hyperparameters
    fixed_params = dict(params)
    fixes_applied = []

    if fixed_params.get("n_estimators", 100) < 10:
        fixed_params["n_estimators"] = 100
        fixes_applied.append("Increased n_estimators to 100")

    if fixed_params.get("max_depth") and fixed_params["max_depth"] > 20:
        fixed_params["max_depth"] = 10
        fixes_applied.append("Reduced max_depth to 10 to prevent overfitting")

    if fixed_params.get("random_state") is None:
        fixed_params["random_state"] = 42
        fixes_applied.append("Added random_state=42 for reproducibility")

    if fixed_params.get("C", 1.0) > 1000:
        fixed_params["C"] = 1.0
        fixes_applied.append("Reset C=1.0 (removed excessive regularisation)")

    # Build param string
    def fmt_val(v):
        if isinstance(v, str): return f'"{v}"'
        return str(v)

    param_str = ", ".join(f"{k}={fmt_val(v)}" for k, v in fixed_params.items()
                          if v is not None and k not in ("base_estimator",))

    needs_scaler = model_class in {"LogisticRegression", "SVC", "SVR",
                                   "KNeighborsClassifier", "MLPClassifier"}

    feature_list = repr(feature_names)

    code = f'''"""
ML Pipeline -- Auto-generated by ML Drift Control Platform
Model: {model_class}
Generated: {datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}
Fixes applied: {len(fixes_applied)}
"""

# ── Imports ───────────────────────────────────────────────────────────────────
import os
import logging
import warnings
import numpy as np
import pandas as pd
import joblib
from datetime import datetime
from typing import Tuple, Dict, List, Optional

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score,
    classification_report, confusion_matrix
)
from sklearn.pipeline import Pipeline
from sklearn.utils.class_weight import compute_class_weight
from {module} import {model_class}

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
FEATURE_NAMES  = {feature_list}
TARGET_COLUMN  = "target"          # change to your label column name
TEST_SIZE      = 0.20
RANDOM_STATE   = 42
MODEL_OUT_PATH = "model_fixed.joblib"
SCALER_OUT_PATH= "scaler.joblib"


# ── 1. Data Loading ───────────────────────────────────────────────────────────
def load_data(path: str) -> pd.DataFrame:
    """Load CSV or Parquet. Validates required columns exist."""
    if path.endswith(".parquet"):
        df = pd.read_parquet(path)
    else:
        df = pd.read_csv(path)

    missing = [c for c in FEATURE_NAMES + [TARGET_COLUMN] if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns: {{missing}}")

    logger.info(f"Loaded {{len(df)}} rows, {{len(df.columns)}} columns")
    return df


# ── 2. Data Validation ────────────────────────────────────────────────────────
def validate_data(df: pd.DataFrame) -> pd.DataFrame:
    """Check for nulls, constants, duplicates, and class imbalance."""
    issues = []

    # Null check
    null_rates = df[FEATURE_NAMES].isnull().mean()
    high_null = null_rates[null_rates > 0.4]
    if not high_null.empty:
        issues.append(f"High null rate features: {{high_null.to_dict()}}")

    # Constant columns
    constants = [f for f in FEATURE_NAMES if df[f].nunique() <= 1]
    if constants:
        issues.append(f"Constant (zero-variance) features: {{constants}}")

    # Duplicate rows
    dupes = df.duplicated().sum()
    if dupes > 0:
        logger.warning(f"{{dupes}} duplicate rows found -- dropping them")
        df = df.drop_duplicates()

    # Class imbalance
    class_counts = df[TARGET_COLUMN].value_counts()
    imbalance_ratio = class_counts.min() / class_counts.max()
    if imbalance_ratio < 0.3:
        logger.warning(f"Class imbalance detected (ratio={{imbalance_ratio:.2f}}). Consider class_weight='balanced'.")

    for issue in issues:
        logger.warning(f"Data issue: {{issue}}")

    return df


# ── 3. Preprocessing ──────────────────────────────────────────────────────────
def preprocess(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, Optional[StandardScaler]]:
    """Fill nulls, encode target, optionally scale features."""
    df = df.copy()

    # Fill nulls with median
    for col in FEATURE_NAMES:
        if df[col].isnull().any():
            df[col] = df[col].fillna(df[col].median())

    X = df[FEATURE_NAMES].values
    y = df[TARGET_COLUMN].values

    # Encode string labels
    if y.dtype == object:
        le = LabelEncoder()
        y  = le.fit_transform(y)
        logger.info(f"Encoded labels: {{dict(zip(le.classes_, le.transform(le.classes_)))}}")

    scaler = None
    {"# Scale features (required for distance/gradient-based models)" if needs_scaler else "# Tree-based model -- scaling not required"}
    {"scaler = StandardScaler()" if needs_scaler else ""}
    {"X = scaler.fit_transform(X)" if needs_scaler else ""}

    return X, y, scaler


# ── 4. Model Training ─────────────────────────────────────────────────────────
def train(X: np.ndarray, y: np.ndarray) -> {model_class}:
    """Train with cross-validation and return the best model."""
    # Compute class weights for imbalanced data
    classes = np.unique(y)
    weights = compute_class_weight("balanced", classes=classes, y=y)
    class_weight_dict = dict(zip(classes.tolist(), weights.tolist()))

    model = {model_class}({param_str})

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring="f1", n_jobs=-1)
    logger.info(f"CV F1: {{cv_scores.mean():.4f}} ± {{cv_scores.std():.4f}}")

    # Final fit on full training data
    model.fit(X, y)
    return model


# ── 5. Evaluation ─────────────────────────────────────────────────────────────
def evaluate(model, X_test: np.ndarray, y_test: np.ndarray) -> Dict:
    """Compute full evaluation metrics."""
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None

    metrics = {{
        "accuracy":  round(float(accuracy_score(y_test, y_pred)), 4),
        "f1_score":  round(float(f1_score(y_test, y_pred, average="weighted")), 4),
        "roc_auc":   round(float(roc_auc_score(y_test, y_prob)), 4) if y_prob is not None else None,
    }}

    logger.info(f"Test metrics: {{metrics}}")
    logger.info("\\n" + classification_report(y_test, y_pred))
    return metrics


# ── 6. Feature Importance ─────────────────────────────────────────────────────
def log_feature_importance(model) -> None:
    if hasattr(model, "feature_importances_"):
        imps = sorted(zip(FEATURE_NAMES, model.feature_importances_), key=lambda x: -x[1])
        logger.info("Feature importances:")
        for name, imp in imps:
            bar = "█" * int(imp * 40)
            logger.info(f"  {{name:<30}} {{bar}} {{imp:.4f}}")


# ── 7. Save ───────────────────────────────────────────────────────────────────
def save_artifacts(model, scaler: Optional[StandardScaler]) -> None:
    joblib.dump(model, MODEL_OUT_PATH)
    logger.info(f"Model saved → {{MODEL_OUT_PATH}}")
    if scaler is not None:
        joblib.dump(scaler, SCALER_OUT_PATH)
        logger.info(f"Scaler saved → {{SCALER_OUT_PATH}}")


# ── 8. Full Pipeline ──────────────────────────────────────────────────────────
def run_pipeline(data_path: str) -> Dict:
    logger.info("=" * 60)
    logger.info(f"Starting ML Pipeline -- {{datetime.utcnow().isoformat()}}")
    logger.info("=" * 60)

    df      = load_data(data_path)
    df      = validate_data(df)
    X, y, scaler = preprocess(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    model   = train(X_train, y_train)
    metrics = evaluate(model, X_test, y_test)
    log_feature_importance(model)
    save_artifacts(model, scaler)

    logger.info("Pipeline complete.")
    return metrics


if __name__ == "__main__":
    import sys
    data_path = sys.argv[1] if len(sys.argv) > 1 else "data.csv"
    run_pipeline(data_path)
'''

    # Build summary
    summary_lines = [
        f"Fixed {len(fixes_applied)} hyperparameter issue(s).",
        *[f"  • {f}" for f in fixes_applied],
        "",
        "Added:",
        "  • Full data validation (null rates, constants, duplicates, class imbalance)",
        "  • StratifiedKFold cross-validation (5 folds)",
        "  • Class weight computation for imbalanced datasets",
        "  • ROC-AUC evaluation metric",
        "  • Feature importance logging",
        "  • Proper train/test split with stratification",
        "  • Artifact saving (model + scaler)",
    ]
    if needs_scaler:
        summary_lines.append("  • StandardScaler added (required for this model type)")

    summary = "\n".join(summary_lines)

    # Build diff (simplified line-by-line diff)
    diff_lines = []
    for line in code.split("\n")[:80]:
        diff_lines.append({"type": "add", "line": line})

    return code, summary, diff_lines


# ═══════════════════════════════════════════════════════════════════════════════
# 5. SUGGESTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def generate_suggestions(clf, info: Dict, bugs: List) -> List[Dict]:
    """Generate actionable improvement suggestions."""
    suggestions = []
    model_class = info["class_name"]
    params      = info.get("params", {})

    suggestions.append({
        "priority": "high",
        "title":    "Add cross-validation before deployment",
        "detail":   "Use StratifiedKFold(n_splits=5) to get reliable performance estimates. Single train/test splits can be misleading."
    })

    if model_class == "RandomForestClassifier":
        suggestions.append({
            "priority": "medium",
            "title":    "Try GradientBoostingClassifier or XGBoost",
            "detail":   "Gradient boosting often outperforms random forests on tabular data with proper tuning."
        })

    if not params.get("class_weight"):
        suggestions.append({
            "priority": "medium",
            "title":    "Set class_weight='balanced' for imbalanced datasets",
            "detail":   "If your approval rate is below 30% or above 70%, balanced class weights improve minority class recall."
        })

    suggestions.append({
        "priority": "medium",
        "title":    "Add SHAP explainability",
        "detail":   "Use shap.TreeExplainer (for tree models) to generate per-prediction explanations for regulatory compliance."
    })

    suggestions.append({
        "priority": "low",
        "title":    "Implement model versioning with MLflow",
        "detail":   "Track experiments, parameters, and metrics with MLflow for full audit trail."
    })

    suggestions.append({
        "priority": "low",
        "title":    "Add input validation schema",
        "detail":   "Use pydantic or pandera to validate incoming prediction requests against expected feature ranges."
    })

    return suggestions


# ═══════════════════════════════════════════════════════════════════════════════
# 6. MAIN ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

def run_full_analysis(clf, feature_names: List[str], model_id: int, username: str) -> Dict:
    """
    Run the complete analysis pipeline on an uploaded model.
    Returns a dict ready to be stored in PipelineAnalysis.
    """
    logger.info(f"Starting pipeline analysis for model_id={model_id}")

    # Step 1: Introspect
    info = introspect_model(clf, feature_names)

    # Step 2: Detect bugs
    bugs, conflicts, warnings = detect_bugs(clf, feature_names, info)

    # Step 3: Score
    scores = compute_quality_scores(bugs, conflicts, warnings, info)

    # Step 4: Suggestions
    suggestions = generate_suggestions(clf, info, bugs)

    # Step 5: Rewrite pipeline
    code, summary, diff = rewrite_pipeline(clf, feature_names, info, bugs)

    # Step 6: Version hash
    commit_hash = _short_hash(code + str(datetime.utcnow()))

    result = {
        "model_type":      info["class_name"],
        "hyperparameters": info["params"],
        "feature_stats":   info["feature_importances"],
        "class_balance":   {"n_classes": info["n_classes"]},
        "bugs":            bugs,
        "conflicts":       conflicts,
        "warnings":        warnings,
        "suggestions":     suggestions,
        "rewritten_code":  code,
        "rewrite_summary": summary,
        "diff_lines":      diff,
        "commit_hash":     commit_hash,
        **scores,
        "status":          "done",
    }

    logger.info(
        f"Analysis complete -- score={scores['overall_score']}, "
        f"bugs={len(bugs)}, conflicts={len(conflicts)}, warnings={len(warnings)}"
    )
    return result
