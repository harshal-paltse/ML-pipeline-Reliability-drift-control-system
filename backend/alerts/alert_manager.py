import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import requests
from typing import Dict, Any

class AlertManager:
    def __init__(self):
        self.email_config = {
            'smtp_server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
            'smtp_port': int(os.getenv('SMTP_PORT', 587)),
            'username': os.getenv('EMAIL_USERNAME'),
            'password': os.getenv('EMAIL_PASSWORD'),
            'from_email': os.getenv('FROM_EMAIL'),
        }
        self.slack_webhook = os.getenv('SLACK_WEBHOOK_URL')

    def send_email_alert(self, subject: str, message: str, recipients: list):
        """Send email alert"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_config['from_email']
            msg['To'] = ', '.join(recipients)
            msg['Subject'] = subject

            msg.attach(MIMEText(message, 'html'))

            server = smtplib.SMTP(self.email_config['smtp_server'], self.email_config['smtp_port'])
            server.starttls()
            server.login(self.email_config['username'], self.email_config['password'])
            text = msg.as_string()
            server.sendmail(self.email_config['from_email'], recipients, text)
            server.quit()

            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    def send_slack_alert(self, message: str, channel: str = "#ml-alerts"):
        """Send Slack alert"""
        if not self.slack_webhook:
            return False

        try:
            payload = {
                "channel": channel,
                "text": message,
                "username": "ML Monitor",
                "icon_emoji": ":warning:"
            }
            response = requests.post(self.slack_webhook, json=payload)
            return response.status_code == 200
        except Exception as e:
            print(f"Failed to send Slack alert: {e}")
            return False

    def trigger_rollback(self, model_id: int):
        """Trigger automatic rollback"""
        # This would call the model rollback API
        # For now, just log the action
        print(f"Triggering rollback for model {model_id}")
        return True

    def trigger_retraining(self, model_name: str):
        """Trigger retraining pipeline"""
        # This would start a retraining job (e.g., via Airflow, Kubernetes Job)
        print(f"Triggering retraining for {model_name}")
        return True

    def handle_alert(self, alert_type: str, severity: str, details: Dict[str, Any]):
        """Handle different types of alerts"""
        message = f"🚨 {severity.upper()} ALERT: {alert_type}\n\n{details}"

        # Send notifications
        if severity in ['high', 'critical']:
            self.send_email_alert(
                f"ML Monitor: {alert_type} Alert",
                message,
                ["ml-team@company.com"]  # Configure recipients
            )
            self.send_slack_alert(message)

        # Trigger automated actions
        if alert_type == "drift" and severity == "critical":
            self.trigger_rollback(details.get('model_id'))
        elif alert_type == "performance" and severity == "critical":
            self.trigger_retraining(details.get('model_name'))

alert_manager = AlertManager()