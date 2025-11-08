# agent/models.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SystemMetrics(BaseModel):
    overall_health: int
    services_monitored: int
    active_incidents: int
    avg_response_time: float
    data_freshness: str