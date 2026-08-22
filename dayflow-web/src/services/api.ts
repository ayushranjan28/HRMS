import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to add auth info (if needed, here we simulate with simple active session)
api.interceptors.request.use((config) => {
  // Can retrieve JWT or user info from localStorage if stored
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('dayflow_user');
    if (user) {
      config.headers['X-User-Email'] = JSON.parse(user).email;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Authentication
export const login = async (credentials: { email: string; password?: string }) => {
  const response = await api.post('/auth/login', credentials);
  if (typeof window !== 'undefined') {
    localStorage.setItem('dayflow_user', JSON.stringify(response.data.user));
    localStorage.setItem('dayflow_employee', JSON.stringify(response.data.employee));
  }
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dayflow_user');
    localStorage.removeItem('dayflow_employee');
  }
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const switchRole = async () => {
  const response = await api.post('/auth/switch-role');
  if (typeof window !== 'undefined') {
    localStorage.setItem('dayflow_user', JSON.stringify(response.data.user));
    localStorage.setItem('dayflow_employee', JSON.stringify(response.data.employee));
  }
  return response.data;
};

// Employees
export const getEmployees = async (params?: any) => {
  const response = await api.get('/employees', { params });
  return response.data;
};

export const getEmployeeDetail = async (id: string) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

export const addEmployee = async (data: any) => {
  const response = await api.post('/employees', data);
  return response.data;
};

export const updateEmployee = async (id: string, data: any) => {
  const response = await api.put(`/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id: string) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
};

// Attendance
export const getAttendance = async (params?: any) => {
  const response = await api.get('/attendance', { params });
  return response.data;
};

export const logAttendance = async (data: any) => {
  const response = await api.post('/attendance', data);
  return response.data;
};

export const updateAttendance = async (id: string, data: any) => {
  const response = await api.put(`/attendance/${id}`, data);
  return response.data;
};

// Leaves
export const getLeaves = async () => {
  const response = await api.get('/leaves');
  return response.data;
};

export const applyLeave = async (data: any) => {
  const response = await api.post('/leaves', data);
  return response.data;
};

export const approveLeave = async (id: string, comment?: string) => {
  const response = await api.put(`/leaves/${id}/approve`, { comment });
  return response.data;
};

export const rejectLeave = async (id: string, comment: string) => {
  const response = await api.put(`/leaves/${id}/reject`, { comment });
  return response.data;
};

// Payroll
export const getPayroll = async (params?: { month: string }) => {
  const response = await api.get('/payroll', { params });
  return response.data;
};

export const generatePayroll = async (month: string) => {
  const response = await api.post('/payroll/generate', { month });
  return response.data;
};

export const updatePayroll = async (id: string, data: any) => {
  const response = await api.put(`/payroll/${id}`, data);
  return response.data;
};

export const approvePayroll = async (id: string) => {
  const response = await api.put(`/payroll/${id}/approve`);
  return response.data;
};

// Reports
export const getReportsOverview = async () => {
  const response = await api.get('/reports/overview');
  return response.data;
};

export const getReportsAttendance = async () => {
  const response = await api.get('/reports/attendance');
  return response.data;
};

export const getReportsLeaves = async () => {
  const response = await api.get('/reports/leaves');
  return response.data;
};

export const getReportsPayroll = async () => {
  const response = await api.get('/reports/payroll');
  return response.data;
};

// Notifications
export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (id: string) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};

// Messages
export const getMessages = async () => {
  const response = await api.get('/messages');
  return response.data;
};

export const sendMessage = async (receiverId: string, message: string) => {
  const response = await api.post('/messages', { receiverId, message });
  return response.data;
};

// Settings
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (data: any) => {
  const response = await api.put('/settings', data);
  return response.data;
};

export const addDepartment = async (name: string, description: string) => {
  const response = await api.post('/settings/departments', { name, description });
  return response.data;
};

export const addDesignation = async (name: string, departmentId: string) => {
  const response = await api.post('/settings/designations', { name, departmentId });
  return response.data;
};

// Keep original backward compatibility
export const getDashboardData = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export const getAttendanceData = async () => {
  const response = await api.get('/attendance');
  return response.data;
};

export const getLeaveData = async () => {
  const response = await api.get('/leave');
  return response.data;
};

export const getPayrollData = async () => {
  const response = await api.get('/payroll');
  return response.data;
};

// Tour Reimbursement
export const submitReimbursement = async (payload: any) => {
  const response = await api.post('/reimbursements', payload);
  return response.data;
};

export const getReimbursements = async () => {
  const response = await api.get('/reimbursements');
  return response.data;
};

export const getAdminReimbursements = async () => {
  const response = await api.get('/admin/reimbursements');
  return response.data;
};

export const getReimbursementById = async (id: string) => {
  const response = await api.get(`/reimbursements/${id}`);
  return response.data;
};

export const saveCategoryReview = async (claimId: string, categoryId: string, bills: any[]) => {
  const response = await api.put(`/admin/reimbursements/${claimId}/category`, { categoryId, bills });
  return response.data;
};

export const finalizeReimbursement = async (claimId: string, reason?: string) => {
  const response = await api.post(`/admin/reimbursements/${claimId}/finalize`, { reason });
  return response.data;
};

export const addReimbursementToPayroll = async (claimId: string, month: string, year: string) => {
  const response = await api.post(`/admin/reimbursements/${claimId}/payroll`, { month, year });
  return response.data;
};

export default api;
