from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import AnomalyReportResponse
from ..services.auth import get_current_user
from ..services.anomaly_service import anomaly_service

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])

@router.get("", response_model=AnomalyReportResponse)
def get_anomalies(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes statistical z-scores and rule-based risk factors for intake anomalies.
    Returns categorized risk scores (Low, Medium, High) with root-cause indicators.
    """
    report = anomaly_service.calculate_anomalies(db)
    return report
