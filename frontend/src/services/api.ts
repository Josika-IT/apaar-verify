import axios from 'axios';
import {
  User,
  Student,
  InstitutionDashboardData,
  AicteDashboardData,
  ValidationReport,
  AnomalyReport,
  VerificationResult,
  AuditLog,
  Institution
} from '../types';

const API_BASE_URL = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('apaar_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/' && !currentPath.startsWith('/verify')) {
        localStorage.removeItem('apaar_token');
        localStorage.removeItem('apaar_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string; otp?: string; captcha?: string }) => {
    const response = await apiClient.post<{ access_token: string; token_type: string; user: User }>('/auth/login', credentials);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password-stub', { email });
    return response.data;
  },

  // Students
  getStudents: async (params?: {
    institution_id?: number;
    search?: string;
    status?: string;
    course?: string;
    quota?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get<Student[]>('/students', { params });
    return response.data;
  },
  getStudent: async (id: number) => {
    const response = await apiClient.get<Student>(`/students/${id}`);
    return response.data;
  },
  createStudent: async (data: Partial<Student>) => {
    const response = await apiClient.post<Student>('/students', data);
    return response.data;
  },
  updateStudent: async (id: number, data: Partial<Student>) => {
    const response = await apiClient.put<Student>(`/students/${id}`, data);
    return response.data;
  },
  bulkUploadStudents: async (formData: FormData, previewOnly: boolean = false, institutionId?: number) => {
    const params = new URLSearchParams();
    params.append('preview_only', String(previewOnly));
    if (institutionId) params.append('institution_id', String(institutionId));

    const response = await apiClient.post(`/students/bulk?${params.toString()}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getTemplateDownloadUrl: () => `${API_BASE_URL}/students/template`,

  // Dashboards
  getInstitutionDashboard: async (institutionId?: number) => {
    const response = await apiClient.get<InstitutionDashboardData>('/dashboard/institution', {
      params: institutionId ? { institution_id: institutionId } : {},
    });
    return response.data;
  },
  getAicteDashboard: async () => {
    const response = await apiClient.get<AicteDashboardData>('/dashboard/aicte');
    return response.data;
  },
  getInstitutions: async (params?: { state?: string; status?: string }) => {
    const response = await apiClient.get<Institution[]>('/dashboard/institutions', { params });
    return response.data;
  },

  // Validation
  getValidationReport: async (params?: { institution_id?: number; rule_name?: string; severity?: string }) => {
    const response = await apiClient.get<ValidationReport>('/validation/report', { params });
    return response.data;
  },
  runValidationAudit: async (institutionId?: number) => {
    const response = await apiClient.post('/validation/run-audit', null, {
      params: institutionId ? { institution_id: institutionId } : {},
    });
    return response.data;
  },
  updateFlagStatus: async (flagId: number, status: string) => {
    const response = await apiClient.put(`/validation/flags/${flagId}/status`, { status });
    return response.data;
  },

  // Anomalies
  getAnomalies: async () => {
    const response = await apiClient.get<AnomalyReport>('/anomalies');
    return response.data;
  },

  // Verification & Records
  verifyApaar: async (apaarId: string) => {
    const response = await apiClient.get<VerificationResult>(`/verify/${apaarId}`);
    return response.data;
  },
  getPdfRecordUrl: (apaarId: string) => `/records/${apaarId}/pdf`,

  // Reports
  getReportExportUrl: (reportType: string, format: 'csv' | 'pdf') => `${API_BASE_URL}/reports/${reportType}?format=${format}`,

  // Audit Logs
  getAuditLogs: async (params?: { action?: string; entity?: string; user_email?: string; skip?: number; limit?: number }) => {
    const response = await apiClient.get<AuditLog[]>('/audit-logs', { params });
    return response.data;
  },
};
