import smtplib
import logging
import os
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class AlertManager:
    """Dispatches alerts via email and Slack, and triggers automated responses."""

    def __init__(self) -> None:
        self.email_config = {
            "smtp_server": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
            "smtp_port": int(os.getenv("SMTP_PORT", 587)),
            "username": os.getenv("EMAIL_USERNAME"),
            "password": os.getenv("EMAIL_PASSWORD"),
            "from_email": os.getenv("FROM_EMAIL"),
        }
        self.slack_webhook = os.getenv("SLACK_WEBHOOK_URL")
        # Comma-separated list of alert recipients from env
        self._recipients: List[str] = [
            r.strip()
            for r in os.getenv("ALERT_RECIPIENTS", "").split(",")
            if r.strip()
        ]

    def send_email_alert(self, subject: str, message: str, recipients: List[str]) -> bool:
        """Send an HTML email alert to the given recipients."""
        if not recipients:
            logger.warning("send_email_alert called with empty recipients list — skipping.")
            return False
        if not self.email_config["username"] or not self.email_config["password"]:
            logger.warning("Email credentials not configured — skipping email alert.")
            return False
        try:
            msg = MIMEMultipart()
            msg["From"] = self.email_config["from_email"]
            msg["To"] = ", ".join(recipients)
            msg["Subject"] = subject
            msg.attach(MIMEText(message, "html"))

            with smtplib.SMTP(self.email_config["smtp_server"], self.email_config["smtp_port"]) as server:
                server.starttls()
                server.login(self.email_config["username"], self.email_config["password"])
                server.sendmail(self.email_config["from_email"], recipients, msg.as_string())

            logger.info("Email alert sent to %s", recipients)
            return True
        except Exception:
            logger.exception("Failed to send email alert.")
            return False

    def send_slack_alert(self, message: str, channel: str = "#ml-alerts") -> bool:
        """Post an alert to Slack via an incoming webhook."""
        if not self.slack_webhook:
            logger.debug("SLACK_WEBHOOK_URL not set — skipping Slack alert.")
            return False
        try:
            payload = {
                "channel": channel,
                "text": message,
                "username": "ML Monitor",
                "icon_emoji": ":warning:",
            }
            response = requests.post(self.slack_webhook, json=payload, timeout=10)
            response.raise_for_status()
            logger.info("Slack alert sent to %s.", channel)
            return True
        except Exception:
            logger.exception("Failed to send Slack alert.")
            return False

    def trigger_rollback(self, model_id: int) -> bool:
        """Trigger automatic model rollback (extend to call orchestration API)."""
        logger.warning("Triggering rollback for model_id=%s", model_id)
        return True

    def trigger_retraining(self, model_name: str) -> bool:
        """Trigger retraining pipeline (extend to call Airflow/Kubernetes)."""
        logger.warning("Triggering retraining for model=%s", model_name)
        return True

    def handle_alert(self, alert_type: str, severity: str, details: Dict[str, Any]) -> None:
        """Route an alert to the appropriate notification channels and automated actions."""
        message = f"🚨 *{severity.upper()} ALERT — {alert_type}*\n\n{details}"
        logger.info("Handling alert: type=%s severity=%s", alert_type, severity)

        if severity in ("high", "critical"):
            recipients = self._recipients or []
            self.send_email_alert(f"ML Monitor: {alert_type} Alert", message, recipients)
            self.send_slack_alert(message)

        if alert_type == "drift" and severity == "critical":
            self.trigger_rollback(details.get("model_id", 0))
        elif alert_type == "performance" and severity == "critical":
            self.trigger_retraining(details.get("model_name", "unknown"))


alert_manager = AlertManager()