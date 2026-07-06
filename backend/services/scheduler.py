"""
Background Scheduler - Runs monitoring checks automatically
"""
import threading
import time
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from database.models import Model
from services.health_monitor import health_monitor

class MonitoringScheduler:
    def __init__(self, interval_minutes: int = 5):
        self.interval_minutes = interval_minutes
        self.running = False
        self.thread = None
    
    def start(self):
        """Start the background monitoring scheduler"""
        if self.running:
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._run_monitoring_loop, daemon=True)
        self.thread.start()
        print(f"✅ Background monitoring started (checking every {self.interval_minutes} minutes)")
    
    def stop(self):
        """Stop the background monitoring scheduler"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        print("⏹️ Background monitoring stopped")
    
    def _run_monitoring_loop(self):
        """Main monitoring loop"""
        while self.running:
            try:
                self._run_monitoring_checks()
            except Exception as e:
                print(f"❌ Error in monitoring check: {e}")
            
            # Wait for next check
            time.sleep(self.interval_minutes * 60)
    
    def _run_monitoring_checks(self):
        """
        Step 4: Run automatic monitoring checks
        
        Checks:
        - Data drift
        - Feature quality
        - Model confidence
        - Overall health
        """
        db: Session = SessionLocal()
        try:
            # Get active model
            active_model = db.query(Model).filter(Model.is_active == 1).first()
            
            if not active_model:
                print("⚠️ No active model found for monitoring")
                return
            
            print(f"🔍 Running monitoring checks for model {active_model.name} (v{active_model.version})...")
            
            # Calculate health score
            health = health_monitor.calculate_health_score(active_model.id, db)
            print(f"📊 Health Status: {health['status'].upper()} (Score: {health['score']})")
            
            if health['issues']:
                print(f"⚠️ Issues found: {', '.join(health['issues'])}")
            
            # Check and create alerts
            alerts_created = health_monitor.check_and_alert(active_model.id, db)
            
            if alerts_created:
                print(f"🚨 Created alerts: {', '.join(alerts_created)}")
            
            print("✅ Monitoring check completed")
        
        finally:
            db.close()

# Global scheduler instance
monitoring_scheduler = MonitoringScheduler(interval_minutes=5)
