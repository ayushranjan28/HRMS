import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default api;
