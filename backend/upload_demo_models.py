"""
Auto-upload all 5 demo models to the platform via API.
Run after create_demo_models.py
"""
import requests, time, sys

BASE     = "http://localhost:8000"
FEATURES = "age,annual_income_inr,cibil_score,employment_years,loan_amount_inr,existing_loans,loan_tenure_months"

# Login
r = requests.post(f"{BASE}/auth/login",
    json={"username": "admin", "password": "admin123"})
if r.status_code != 200:
    print("Login failed:", r.text); sys.exit(1)
token = r.json()["access_token"]
H = {"Authorization": f"Bearer {token}"}
print("Logged in as admin\n")

MODELS = [
    {
        "file":  "demo_models/model1_good_randomforest.joblib",
        "name":  "Good RandomForest",
        "notes": "Well-tuned: n_estimators=100, max_depth=8, class_weight=balanced, random_state=42. Expected score: 90+",
    },
    {
        "file":  "demo_models/model2_buggy_randomforest.joblib",
        "name":  "Buggy RandomForest",
        "notes": "Intentional bugs: n_estimators=3, max_depth=30, no random_state. Expected score: 55-65",
    },
    {
        "file":  "demo_models/model3_logreg_no_scaler.joblib",
        "name":  "LogisticRegression (No Scaler)",
        "notes": "Scaling conflict: LogReg trained without StandardScaler. Expected score: ~70",
    },
    {
        "file":        "demo_models/model4_logreg_with_scaler.joblib",
        "scaler_file": "demo_models/model4_scaler.joblib",
        "name":        "LogisticRegression (With Scaler)",
        "notes":       "Correct setup: scaled + class_weight=balanced. Expected score: 85+",
    },
    {
        "file":  "demo_models/model5_gradientboosting.joblib",
        "name":  "GradientBoosting (Best)",
        "notes": "Best quality: n_estimators=100, max_depth=4, learning_rate=0.1. Expected score: 95+",
    },
]

uploaded_ids = []

for i, m in enumerate(MODELS, 1):
    print(f"[{i}/5] Uploading: {m['name']} ...")
    files = {"model_file": (m["file"].split("/")[-1],
                            open(m["file"], "rb"),
                            "application/octet-stream")}
    if "scaler_file" in m:
        files["scaler_file"] = (m["scaler_file"].split("/")[-1],
                                open(m["scaler_file"], "rb"),
                                "application/octet-stream")

    resp = requests.post(f"{BASE}/models/upload",
        headers=H,
        data={"name": m["name"], "notes": m["notes"], "feature_names": FEATURES},
        files=files
    )
    if resp.status_code == 200:
        mid = resp.json()["id"]
        uploaded_ids.append(mid)
        print(f"     Uploaded — model_id={mid}  version={resp.json()['version']}")
    else:
        print(f"     FAILED: {resp.text[:200]}")
        uploaded_ids.append(None)

print(f"\nAll uploads done. {sum(1 for x in uploaded_ids if x)} / {len(MODELS)} succeeded.\n")

# Activate Model 1 (Good RandomForest) as the live prediction model
if uploaded_ids[0]:
    act = requests.post(f"{BASE}/models/uploaded/{uploaded_ids[0]}/activate", headers=H)
    print(f"Activated Model 1 (Good RandomForest) as live model: {act.json()}")

# Trigger analysis on all uploaded models
print("\nTriggering pipeline analysis on all models...")
analysis_ids = []
for mid in uploaded_ids:
    if mid is None:
        analysis_ids.append(None)
        continue
    ar = requests.post(f"{BASE}/pipeline/analyze/{mid}", headers=H)
    if ar.status_code == 200:
        aid = ar.json()["analysis_id"]
        analysis_ids.append(aid)
        print(f"  model_id={mid} -> analysis_id={aid} started")
    else:
        analysis_ids.append(None)
        print(f"  model_id={mid} -> analysis trigger failed: {ar.text[:100]}")

# Poll until all analyses complete
print("\nWaiting for analyses to complete...")
pending = {aid: mid for aid, mid in zip(analysis_ids, uploaded_ids) if aid}
done    = {}
for attempt in range(30):
    time.sleep(2)
    still_pending = {}
    for aid, mid in pending.items():
        res = requests.get(f"{BASE}/pipeline/analysis/{aid}", headers=H).json()
        if res["status"] == "done":
            done[aid] = res
            print(f"  analysis_id={aid} DONE — score={res['overall_score']:.0f}  "
                  f"bugs={len(res['bugs'])}  conflicts={len(res['conflicts'])}  "
                  f"warnings={len(res['warnings'])}")
        elif res["status"] == "failed":
            print(f"  analysis_id={aid} FAILED: {res.get('error_message','')}")
        else:
            still_pending[aid] = mid
    pending = still_pending
    if not pending:
        break

print(f"\n{'='*60}")
print(f"COMPLETE — {len(done)}/{len(analysis_ids)} analyses finished")
print(f"{'='*60}\n")

for aid, res in done.items():
    score = res["overall_score"]
    bar   = "█" * int(score / 5)
    color = "GOOD" if score >= 80 else "WARN" if score >= 60 else "POOR"
    print(f"  [{color}] {bar} {score:.0f}/100")
    if res["bugs"]:
        for b in res["bugs"]:
            print(f"         BUG [{b['severity'].upper()}] {b['title']}")
    if res["conflicts"]:
        for c in res["conflicts"]:
            print(f"         CONFLICT: {c['type']}")
    print()

print("Open http://localhost:5173/pipeline to see results in the UI")
print("Open http://localhost:5173/models  to manage models")
print("Open http://localhost:5173         to make predictions")
