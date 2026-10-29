export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'aicte_admin' | 'institution_admin' | 'verifier';
  institution_id?: number | null;
  institution_name?: string | null;
  is_active: boolean;
}

export interface Student {
  id: number;
  institution_id: number;
  institution_name?: string;
  apaar_id: string;
  student_id: string;
  name: string;
  dob: string;
  gender: string;
  course: string;
  branch: string;
  year_of_study: number;
  admission_date: string;
  category: string;
  quota: string;
  oci_status: boolean;
  foreign_national: boolean;
  nationality: string;
  consent_flag: boolean;
  verification_status: 'Verified' | 'Pending' | 'Flagged';
  validation_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  course_name: string;
  branch_name: string;
  approved_intake: number;
  duration_years: number;
  actual_enrolment?: number;
}

export interface Institution {
  id: number;
  aicte_code: string;
  name: string;
  state: string;
  city: string;
  type: string;
  approved_intake: number;
  actual_enrolment: number;
  supernumerary_count: number;
  status: string;
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  created_at: string;
  courses?: Course[];
}

export interface ValidationFlag {
  id: number;
  student_id?: number | null;
  student_name?: string | null;
  institution_id: number;
  institution_name?: string;
  apaar_id: string;
  rule_name: string;
  severity: 'CRITICAL' | 'ERROR' | 'WARNING';
  message: string;
  details?: string | null;
  status: 'OPEN' | 'RESOLVED' | 'ACKNOWLEDGED';
  created_at: string;
}

export interface ValidationReport {
  total_flags: number;
  critical_count: number;
  error_count: number;
  warning_count: number;
  duplicate_internal_count: number;
  duplicate_cross_count: number;
  excess_intake_count: number;
  format_error_count: number;
  inconsistency_count: number;
  flags: ValidationFlag[];
}

export interface CourseIntakeStat {
  course_id?: number;
  course: string;
  branch: string;
  approved_intake: number;
  actual_enrolment: number;
  regular_count: number;
  supernumerary_count: number;
  nri_count: number;
  excess_count: number;
}

export interface InstitutionDashboardData {
  institution_id: number;
  institution_name: string;
  aicte_code: string;
  total_approved_intake: number;
  total_actual_enrolment: number;
  regular_enrolment: number;
  supernumerary_seats: number;
  nri_count: number;
  oci_count: number;
  foreign_national_count: number;
  flags_count: number;
  critical_alerts: number;
  course_breakdown: CourseIntakeStat[];
  category_distribution: Record<string, number>;
  gender_distribution: Record<string, number>;
  recent_flags: ValidationFlag[];
}

export interface StateStat {
  state: string;
  institutions_count: number;
  approved_intake: number;
  actual_enrolment: number;
  excess_count: number;
  flagged_institutions: number;
}

export interface AicteDashboardData {
  total_institutions: number;
  total_approved_intake: number;
  total_actual_enrolment: number;
  total_supernumerary: number;
  total_nri_fn: number;
  total_flags: number;
  excess_enrolment_institutions_count: number;
  high_risk_institutions_count: number;
  state_breakdown: StateStat[];
  top_excess_institutions: Institution[];
  recent_flags: ValidationFlag[];
  enrolment_trends: Array<{ academic_year: string; approved: number; enrolled: number }>;
}

export interface AnomalyItem {
  institution_id: number;
  institution_name: string;
  state: string;
  approved_intake: number;
  actual_enrolment: number;
  utilization_rate: number;
  z_score: number;
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  flags_count: number;
  reasons: string[];
}

export interface AnomalyReport {
  mean_utilization: number;
  std_dev_utilization: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  anomalies: AnomalyItem[];
}

export interface VerificationResult {
  is_valid: boolean;
  apaar_id: string;
  student_id_masked?: string;
  name_masked?: string;
  dob_masked?: string;
  gender?: string;
  institution_name?: string;
  aicte_code?: string;
  course?: string;
  branch?: string;
  year_of_study?: number;
  admission_date?: string;
  verification_status: string;
  consent_granted: boolean;
  consent_notice: string;
  verification_timestamp: string;
  qr_payload?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  user_email: string;
  user_role: string;
  institution_id?: number | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  details?: string | null;
  ip_address: string;
  timestamp: string;
}
