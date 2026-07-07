"""
Unit tests for the monitoring module.
Covers performance_monitor and drift_detector behaviour
with mocked database sessions and data.
"""
import pytest
from unittest.mock import MagicMock, patch


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_log(prediction: str, actual=None, confidence: float = 0.85):
    """Build a minimal InferenceLog mock."""
    log = MagicMock()
    log.prediction = {"prediction": prediction, "actual": actual}
    log.confidence = confidence
    return log


# ── performance_monitor ────────────────────────────────────────────────────────

class TestMonitorModelPerformance:

    def _run(self, logs, task_type="classification"):
        from monitoring.performance_monitor import monitor_model_performance
        db = MagicMock()
        db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = logs
        return monitor_model_performance(model_id=1, db=db, task_type=task_type)

    def test_no_logs_returns_error(self):
        result = self._run([])
        assert "error" in result

    def test_confidence_metrics_always_present(self):
        logs = [_make_log("Approved", confidence=0.9), _make_log("Rejected", confidence=0.6)]
        result = self._run(logs)
        assert "avg_confidence" in result
        assert "low_confidence_ratio" in result
        assert result["total_predictions"] == 2

    def test_labeled_classification_metrics(self):
        logs = [
            _make_log("Approved", actual="Approved", confidence=0.92),
            _make_log("Rejected", actual="Rejected", confidence=0.78),
            _make_log("Approved", actual="Approved", confidence=0.88),
        ]
        result = self._run(logs)
        assert "accuracy" in result
        assert result["accuracy"] == pytest.approx(1.0)
        assert result["labeled_sample_size"] == 3

    def test_mixed_labeled_unlabeled_no_crash(self):
        """Unlabeled rows must not cause sklearn to crash."""
        logs = [
            _make_log("Approved", actual="Approved", confidence=0.9),
            _make_log("Approved", actual=None,       confidence=0.7),   # no ground truth
            _make_log("Rejected", actual="Rejected", confidence=0.8),
        ]
        result = self._run(logs)
        assert "error" not in result
        assert result["labeled_sample_size"] == 2

    def test_fully_unlabeled_skips_supervised_metrics(self):
        logs = [_make_log("Approved", actual=None), _make_log("Rejected", actual=None)]
        result = self._run(logs)
        assert "accuracy" not in result
        assert result["labeled_sample_size"] == 0

    def test_low_confidence_ratio_calculation(self):
        logs = [
            _make_log("Approved", confidence=0.3),   # below 0.5
            _make_log("Approved", confidence=0.4),   # below 0.5
            _make_log("Rejected", confidence=0.9),
            _make_log("Rejected", confidence=0.8),
        ]
        result = self._run(logs)
        assert result["low_confidence_ratio"] == pytest.approx(0.5)


# ── drift_detector ────────────────────────────────────────────────────────────

class TestDetectDataDrift:

    def test_returns_error_dict_when_evidently_unavailable(self):
        """If Evidently is not installed the function must still return a dict."""
        with patch("monitoring.drift_detector.EVIDENTLY_AVAILABLE", False):
            from monitoring.drift_detector import detect_data_drift
            result = detect_data_drift()
        assert isinstance(result, dict)
        assert result["drift_detected"] is False

    def test_returns_error_dict_when_data_missing(self):
        """Missing parquet files must return an error dict, not raise."""
        from monitoring.drift_detector import detect_data_drift
        result = detect_data_drift(
            reference_path="nonexistent/ref.parquet",
            current_path="nonexistent/cur.parquet",
        )
        assert isinstance(result, dict)
        assert "error" in result or result["drift_detected"] is False
