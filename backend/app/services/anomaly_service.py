import math
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..models import Institution, Student, ValidationFlag, Course

class AnomalyService:
    @staticmethod
    def calculate_anomalies(db: Session) -> Dict[str, Any]:
        """
        Runs statistical outlier (z-score) and rule-based anomaly detection
        across all registered institutions. Updates their risk scores.
        """
        institutions = db.query(Institution).all()
        if not institutions:
            return {
                "mean_utilization": 0.0,
                "std_dev_utilization": 0.0,
                "high_risk_count": 0,
                "medium_risk_count": 0,
                "low_risk_count": 0,
                "anomalies": []
            }

        inst_data = []
        utilization_rates = []

        for inst in institutions:
            # Count actual enrolment (regular only for intake check)
            total_students = db.query(Student).filter(Student.institution_id == inst.id).count()
            regular_students = db.query(Student).filter(
                Student.institution_id == inst.id,
                Student.quota == "Regular"
            ).count()

            approved_intake = max(inst.approved_intake, 1)
            utilization = (regular_students / approved_intake) * 100.0
            utilization_rates.append(utilization)

            # Count flags
            flags = db.query(ValidationFlag).filter(ValidationFlag.institution_id == inst.id).all()
            critical_flags = [f for f in flags if f.severity == "CRITICAL"]
            error_flags = [f for f in flags if f.severity == "ERROR"]

            inst_data.append({
                "institution": inst,
                "actual_enrolment": total_students,
                "regular_enrolment": regular_students,
                "approved_intake": approved_intake,
                "utilization": utilization,
                "flags_count": len(flags),
                "critical_flags_count": len(critical_flags),
                "error_flags_count": len(error_flags),
            })

        # Calculate Mean and Standard Deviation of Utilization
        n = len(utilization_rates)
        mean_utilization = sum(utilization_rates) / n
        variance = sum((x - mean_utilization) ** 2 for x in utilization_rates) / (n if n > 1 else 1)
        std_dev = math.sqrt(variance) if variance > 0 else 1.0

        anomaly_items = []
        high_risk_count = 0
        medium_risk_count = 0
        low_risk_count = 0

        for item in inst_data:
            inst = item["institution"]
            util = item["utilization"]
            z_score = (util - mean_utilization) / (std_dev if std_dev > 0 else 1.0)
            
            reasons = []
            risk_score = 0.0

            # Rule 1: Excess regular enrolment (> 100% intake)
            if item["regular_enrolment"] > item["approved_intake"]:
                excess = item["regular_enrolment"] - item["approved_intake"]
                pct_excess = (excess / item["approved_intake"]) * 100
                risk_score += min(50.0, 20.0 + pct_excess * 1.5)
                reasons.append(f"Regular enrolment exceeds approved AICTE intake by +{excess} ({pct_excess:.1f}% overflow)")

            # Rule 2: Statistical outlier on utilization
            if z_score > 1.8:
                risk_score += min(30.0, z_score * 12.0)
                reasons.append(f"Statistical outlier: Capacity utilization ({util:.1f}%) is {z_score:.2f} standard deviations above national average")
            elif z_score < -2.0:
                risk_score += 15.0
                reasons.append(f"Abnormally low intake utilization ({util:.1f}%), potential ghost institution or reporting deficit")

            # Rule 3: Critical flags (duplicate APAARs across or within institutions)
            if item["critical_flags_count"] > 0:
                risk_score += min(40.0, item["critical_flags_count"] * 15.0)
                reasons.append(f"Detected {item['critical_flags_count']} critical duplicate APAAR ID violation(s)")

            # Rule 4: Data inconsistencies / format errors
            if item["error_flags_count"] > 0:
                risk_score += min(20.0, item["error_flags_count"] * 4.0)
                reasons.append(f"{item['error_flags_count']} student records flagged for validation errors (DOB/quota/format)")

            # Cap risk score between 0 and 100
            risk_score = max(5.0, min(100.0, round(risk_score, 1)))

            if risk_score >= 65:
                risk_level = "High"
                high_risk_count += 1
            elif risk_score >= 35:
                risk_level = "Medium"
                medium_risk_count += 1
            else:
                risk_level = "Low"
                low_risk_count += 1

            if not reasons:
                reasons.append("Enrolment within AICTE statutory limits; no critical validation anomalies detected")

            # Persist back to institution model
            inst.risk_score = risk_score
            inst.risk_level = risk_level

            anomaly_items.append({
                "institution_id": inst.id,
                "institution_name": inst.name,
                "state": inst.state,
                "approved_intake": item["approved_intake"],
                "actual_enrolment": item["actual_enrolment"],
                "utilization_rate": round(util, 1),
                "z_score": round(z_score, 2),
                "risk_score": risk_score,
                "risk_level": risk_level,
                "flags_count": item["flags_count"],
                "reasons": reasons
            })

        db.commit()

        # Sort anomalies by risk score descending
        anomaly_items.sort(key=lambda x: x["risk_score"], reverse=True)

        return {
            "mean_utilization": round(mean_utilization, 2),
            "std_dev_utilization": round(std_dev, 2),
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "anomalies": anomaly_items
        }

anomaly_service = AnomalyService()
