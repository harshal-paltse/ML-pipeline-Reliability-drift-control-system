try:
    from evidently import ColumnMapping
    from evidently.report import Report
    from evidently.metrics import ColumnDriftMetric, DatasetDriftMetric
    EVIDENTLY_AVAILABLE = True
except ImportError:
    EVIDENTLY_AVAILABLE = False
    print("Warning: Evidently AI not available (likely due to litestar/multipart conflict). Drift detection will be disabled.")
import pandas as pd
import numpy as np
from pathlib import Path

def detect_data_drift(reference_path: str = "data/training/reference.parquet",
                     current_path: str = "data/inference/current.parquet"):
    """
    Detect data drift using Evidently
    """

    if not EVIDENTLY_AVAILABLE:
        return {"drift_detected": False, "dataset_drift": 0.0, "message": "Evidently AI not installed"}
    
    try:
        # Load reference and current data
        reference_data = pd.read_parquet(reference_path)
        current_data = pd.read_parquet(current_path)

        # Define column mapping
        column_mapping = ColumnMapping()
        column_mapping.target = 'target'  # Adjust based on your data
        column_mapping.prediction = None
        column_mapping.numerical_features = reference_data.select_dtypes(include=[np.number]).columns.tolist()
        column_mapping.categorical_features = reference_data.select_dtypes(include=['object']).columns.tolist()

        # Create drift report — dynamically use all numerical columns
        numerical_cols = column_mapping.numerical_features or []
        metrics_list = [DatasetDriftMetric()] + [
            ColumnDriftMetric(column_name=col) for col in numerical_cols[:10]  # cap at 10 columns
        ]

        report = Report(metrics=metrics_list)

        report.run(reference_data=reference_data, current_data=current_data, column_mapping=column_mapping)

        # Extract drift metrics
        drift_results = {
            'dataset_drift': report.as_dict()['metrics'][0]['result']['drift_share'],
            'drift_detected': report.as_dict()['metrics'][0]['result']['dataset_drift'],
            'column_drift': {}
        }

        # Add column-specific drift
        for i, metric in enumerate(report.as_dict()['metrics'][1:], 1):
            column_name = metric['metric_args']['column_name']
            drift_results['column_drift'][column_name] = {
                'drift_detected': metric['result']['drift_detected'],
                'drift_score': metric['result']['drift_score']
            }

        return drift_results

    except Exception as e:
        return {"error": str(e), "drift_detected": False}