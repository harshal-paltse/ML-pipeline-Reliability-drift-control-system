
import sys
import traceback

print("1. Importing fastapi...")
try:
    from fastapi import FastAPI
    print("   Success")
except:
    traceback.print_exc()

print("\n2. Importing database.connection...")
try:
    from database.connection import create_tables
    print("   Success")
except:
    traceback.print_exc()

print("\n3. Importing api.routes (routers)...")
try:
    from api.routes import (
        data_router,
        monitoring_router,
        models_router,
        alerts_router,
        predictions_router,
        health_router
    )
    print("   Success")
except:
    traceback.print_exc()

print("\n4. Importing services.scheduler...")
try:
    from services.scheduler import monitoring_scheduler
    print("   Success")
except:
    traceback.print_exc()

print("\nDone.")
