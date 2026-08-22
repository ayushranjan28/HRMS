import { hashSync } from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'HR' | 'Employee';
  employeeId: string;
  createdAt: string;
}

export interface Employee {
  id: string; // matches employee_id
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  country: string;
  departmentId: string;
  designationId: string;
  managerId: string;
  joiningDate: string;
  employmentType: 'Full Time' | 'Part Time' | 'Contract' | 'Intern';
  workLocation: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  profilePhoto: string;
  baseSalary: number;
  hra: number;
  allowances: number;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface Designation {
  id: string;
  name: string;
  departmentId: string;
  status: 'Active' | 'Inactive';
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:MM AM/PM
  checkOut: string; // HH:MM AM/PM
  totalHours: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Work From Home' | 'On Leave';
  location: string;
  remarks?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'Paid Time Off' | 'Sick Leave' | 'Unpaid Leave' | 'Casual Leave' | 'Other';
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  attachment?: boolean;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  rejectionReason?: string;
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveType: string;
  allocated: number;
  used: number;
  remaining: number;
}

export interface Payroll {
  id: string;
  employeeId: string;
  payrollMonth: string; // YYYY-MM (e.g. 2026-08)
  basicSalary: number;
  allowances: number;
  bonus: number;
  overtime: number;
  grossSalary: number;
  tax: number;
  pf: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: 'Draft' | 'Processing' | 'Approved' | 'Paid';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'leave' | 'attendance' | 'employee' | 'payroll' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  logo: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  currency: string;
  workHoursStart: string;
  workHoursEnd: string;
  lateThresholdMinutes: number;
}

// In-Memory Database Arrays
export let departments: Department[] = [
  { id: 'D1', name: 'Design', description: 'User Experience and Interface design team', status: 'Active' },
  { id: 'D2', name: 'Engineering', description: 'Product developers, QA, infrastructure', status: 'Active' },
  { id: 'D3', name: 'HR', description: 'Human Resource Management and Talent Acquisition', status: 'Active' },
  { id: 'D4', name: 'Finance', description: 'Financial accounting, payroll, budgeting', status: 'Active' },
  { id: 'D5', name: 'Support', description: 'Customer support and client relations', status: 'Active' }
];

export let designations: Designation[] = [
  { id: 'DS1', name: 'UI/UX Designer', departmentId: 'D1', status: 'Active' },
  { id: 'DS2', name: 'Product Manager', departmentId: 'D1', status: 'Active' },
  { id: 'DS3', name: 'Engineering Lead', departmentId: 'D2', status: 'Active' },
  { id: 'DS4', name: 'Software Engineer', departmentId: 'D2', status: 'Active' },
  { id: 'DS5', name: 'QA Tester', departmentId: 'D2', status: 'Active' },
  { id: 'DS6', name: 'HR Manager', departmentId: 'D3', status: 'Active' },
  { id: 'DS7', name: 'Support Specialist', departmentId: 'D5', status: 'Active' },
  { id: 'DS8', name: 'Marketing Lead', departmentId: 'D1', status: 'Active' }
];

export let employees: Employee[] = [
  {
    id: 'EMP001',
    employeeId: 'EMP001',
    firstName: 'Alex',
    lastName: 'Martin',
    email: 'alex@dayflow.com',
    phone: '+91 98765 43210',
    dateOfBirth: '1992-04-12',
    gender: 'Male',
    address: '12th Main Road, HSR Layout',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    departmentId: 'D1',
    designationId: 'DS1',
    managerId: 'EMP002',
    joiningDate: '2022-03-01',
    employmentType: 'Full Time',
    workLocation: 'Bangalore',
    status: 'Active',
    profilePhoto: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    baseSalary: 6000,
    hra: 1500,
    allowances: 700,
    createdAt: new Date().toISOString()
  },
  {
    id: 'EMP002',
    employeeId: 'EMP002',
    firstName: 'Jane',
    lastName: 'Cooper',
    email: 'jane@dayflow.com',
    phone: '+1 (555) 019-2834',
    dateOfBirth: '1988-08-24',
    gender: 'Female',
    address: '42 Main St',
    city: 'San Francisco',
    state: 'California',
    country: 'USA',
    departmentId: 'D2',
    designationId: 'DS3',
    managerId: '',
    joiningDate: '2020-01-15',
    employmentType: 'Full Time',
    workLocation: 'Remote',
    status: 'Active',
    profilePhoto: 'https://i.pravatar.cc/150?u=a042581f4e29026024f',
    baseSalary: 8500,
    hra: 2000,
    allowances: 1000,
    createdAt: new Date().toISOString()
  },
  {
    id: 'EMP003',
    employeeId: 'EMP003',
    firstName: 'Robert',
    lastName: 'Fox',
    email: 'robert@dayflow.com',
    phone: '+1 (555) 014-9988',
    dateOfBirth: '1995-11-03',
    gender: 'Male',
    address: '742 Evergreen Terrace',
    city: 'New York',
    state: 'New York',
    country: 'USA',
    departmentId: 'D1',
    designationId: 'DS8',
    managerId: 'EMP001',
    joiningDate: '2023-06-10',
    employmentType: 'Full Time',
    workLocation: 'New York',
    status: 'Inactive',
    profilePhoto: 'https://i.pravatar.cc/150?u=a042581f4e29026024a',
    baseSalary: 5000,
    hra: 1200,
    allowances: 500,
    createdAt: new Date().toISOString()
  },
  {
    id: 'EMP004',
    employeeId: 'EMP004',
    firstName: 'Cody',
    lastName: 'Fisher',
    email: 'cody@dayflow.com',
    phone: '+91 99988 77766',
    dateOfBirth: '1990-01-30',
    gender: 'Male',
    address: 'Koramangala 4th Block',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    departmentId: 'D3',
    designationId: 'DS6',
    managerId: '',
    joiningDate: '2021-08-20',
    employmentType: 'Full Time',
    workLocation: 'Bangalore',
    status: 'Active',
    profilePhoto: 'https://i.pravatar.cc/150?u=a042581f4e29026024b',
    baseSalary: 5500,
    hra: 1400,
    allowances: 600,
    createdAt: new Date().toISOString()
  },
  {
    id: 'EMP005',
    employeeId: 'EMP005',
    firstName: 'Esther',
    lastName: 'Howard',
    email: 'esther@dayflow.com',
    phone: '+44 20 7946 0958',
    dateOfBirth: '1991-05-18',
    gender: 'Female',
    address: '10 Downing Street',
    city: 'London',
    state: 'London',
    country: 'UK',
    departmentId: 'D1',
    designationId: 'DS2',
    managerId: 'EMP001',
    joiningDate: '2022-09-01',
    employmentType: 'Full Time',
    workLocation: 'London',
    status: 'Active',
    profilePhoto: 'https://i.pravatar.cc/150?u=a042581f4e29026024c',
    baseSalary: 7500,
    hra: 1800,
    allowances: 900,
    createdAt: new Date().toISOString()
  },
  {
    id: 'EMP006',
    employeeId: 'EMP006',
    firstName: 'Brooklyn',
    lastName: 'Simmons',
    email: 'brooklyn@dayflow.com',
    phone: '+91 91122 33344',
    dateOfBirth: '1996-07-07',
    gender: 'Female',
    address: 'Electronic City Phase 1',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    departmentId: 'D2',
    designationId: 'DS4',
    managerId: 'EMP002',
    joiningDate: '2024-02-15',
    employmentType: 'Full Time',
    workLocation: 'Bangalore',
    status: 'Active',
    profilePhoto: 'https://i.pravatar.cc/150?u=a042581f4e29026024e',
    baseSalary: 6200,
    hra: 1550,
    allowances: 650,
    createdAt: new Date().toISOString()
  },
  {
    id: 'EMP007',
    employeeId: 'EMP007',
    firstName: 'Leslie',
    lastName: 'Alexander',
    email: 'leslie@dayflow.com',
    phone: '+1 (555) 017-4822',
    dateOfBirth: '1994-03-25',
    gender: 'Female',
    address: 'Broadway Apt 4',
    city: 'San Francisco',
    state: 'California',
    country: 'USA',
    departmentId: 'D2',
    designationId: 'DS5',
    managerId: 'EMP002',
    joiningDate: '2023-11-01',
    employmentType: 'Contract',
    workLocation: 'Remote',
    status: 'On Leave',
    profilePhoto: 'https://i.pravatar.cc/150?u=a042581f4e29026024g',
    baseSalary: 4800,
    hra: 1100,
    allowances: 400,
    createdAt: new Date().toISOString()
  },
  {
    id: 'EMP008',
    employeeId: 'EMP008',
    firstName: 'Jenny',
    lastName: 'Wilson',
    email: 'jenny@dayflow.com',
    phone: '+1 (555) 016-5531',
    dateOfBirth: '1993-10-15',
    gender: 'Female',
    address: 'Central Park West',
    city: 'New York',
    state: 'New York',
    country: 'USA',
    departmentId: 'D5',
    designationId: 'DS7',
    managerId: '',
    joiningDate: '2022-07-20',
    employmentType: 'Full Time',
    workLocation: 'New York',
    status: 'Inactive',
    profilePhoto: 'https://i.pravatar.cc/150?u=a042581f4e29026024h',
    baseSalary: 4500,
    hra: 1000,
    allowances: 350,
    createdAt: new Date().toISOString()
  }
];

export let users: User[] = [
  {
    id: 'U1',
    username: 'alex',
    email: 'alex@dayflow.com',
    passwordHash: hashSync('password', 10),
    role: 'HR',
    employeeId: 'EMP001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'U2',
    username: 'jane',
    email: 'jane@dayflow.com',
    passwordHash: hashSync('password', 10),
    role: 'Employee',
    employeeId: 'EMP002',
    createdAt: new Date().toISOString()
  },
  {
    id: 'U3',
    username: 'cody',
    email: 'cody@dayflow.com',
    passwordHash: hashSync('password', 10),
    role: 'HR',
    employeeId: 'EMP004',
    createdAt: new Date().toISOString()
  }
];

// Active user session simulation (defaulting to Alex HR)
export let activeSessionUser: User = users[0];

export function setActiveSessionUser(user: User) {
  activeSessionUser = user;
}

// Attendance Records (last few days + today)
export let attendance: Attendance[] = [
  // EMP001 (Alex)
  { id: 'ATT001', employeeId: 'EMP001', date: '2026-08-20', checkIn: '09:12 AM', checkOut: '06:05 PM', totalHours: '8h 53m', status: 'Present', location: 'Bangalore Office' },
  { id: 'ATT002', employeeId: 'EMP001', date: '2026-08-21', checkIn: '09:05 AM', checkOut: '06:00 PM', totalHours: '8h 55m', status: 'Present', location: 'Bangalore Office' },
  { id: 'ATT003', employeeId: 'EMP001', date: '2026-08-22', checkIn: '09:12 AM', checkOut: '', totalHours: '--', status: 'Present', location: 'Bangalore Office' },
  
  // EMP002 (Jane)
  { id: 'ATT004', employeeId: 'EMP002', date: '2026-08-20', checkIn: '08:55 AM', checkOut: '05:30 PM', totalHours: '8h 35m', status: 'Present', location: 'Remote' },
  { id: 'ATT005', employeeId: 'EMP002', date: '2026-08-21', checkIn: '09:00 AM', checkOut: '05:45 PM', totalHours: '8h 45m', status: 'Present', location: 'Remote' },
  { id: 'ATT006', employeeId: 'EMP002', date: '2026-08-22', checkIn: '08:45 AM', checkOut: '', totalHours: '--', status: 'Present', location: 'Remote' },

  // EMP006 (Brooklyn)
  { id: 'ATT007', employeeId: 'EMP006', date: '2026-08-21', checkIn: '09:42 AM', checkOut: '06:15 PM', totalHours: '8h 33m', status: 'Late', location: 'Bangalore Office' },
  { id: 'ATT008', employeeId: 'EMP006', date: '2026-08-22', checkIn: '09:40 AM', checkOut: '', totalHours: '--', status: 'Late', location: 'Bangalore Office' },

  // EMP007 (Leslie - On Leave)
  { id: 'ATT009', employeeId: 'EMP007', date: '2026-08-21', checkIn: '--', checkOut: '--', totalHours: '--', status: 'On Leave', location: '--' },
  { id: 'ATT010', employeeId: 'EMP007', date: '2026-08-22', checkIn: '--', checkOut: '--', totalHours: '--', status: 'On Leave', location: '--' }
];

// Leave Balances
export let leaveBalances: LeaveBalance[] = [];

// Helper to initialize leave balances
export function initLeaveBalances() {
  employees.forEach(emp => {
    const existing = leaveBalances.filter(b => b.employeeId === emp.employeeId);
    if (existing.length === 0) {
      leaveBalances.push({ id: `LB-${emp.employeeId}-PTO`, employeeId: emp.employeeId, leaveType: 'Paid Time Off', allocated: 18, used: 2, remaining: 16 });
      leaveBalances.push({ id: `LB-${emp.employeeId}-SL`, employeeId: emp.employeeId, leaveType: 'Sick Leave', allocated: 10, used: 1, remaining: 9 });
      leaveBalances.push({ id: `LB-${emp.employeeId}-UL`, employeeId: emp.employeeId, leaveType: 'Unpaid Leave', allocated: 5, used: 0, remaining: 5 });
      leaveBalances.push({ id: `LB-${emp.employeeId}-CL`, employeeId: emp.employeeId, leaveType: 'Casual Leave', allocated: 6, used: 1, remaining: 5 });
    }
  });
}
initLeaveBalances();

// Leave Requests
export let leaveRequests: LeaveRequest[] = [
  {
    id: 'REQ001',
    employeeId: 'EMP003', // Robert Fox
    leaveType: 'Paid Time Off',
    startDate: '2026-10-22',
    endDate: '2026-10-25',
    duration: 4,
    reason: 'Family vacation trip to Hawaii',
    status: 'Pending',
    appliedAt: '2026-08-18'
  },
  {
    id: 'REQ002',
    employeeId: 'EMP004', // Cody Fisher
    leaveType: 'Sick Leave',
    startDate: '2026-08-20',
    endDate: '2026-08-20',
    duration: 1,
    reason: 'Dental surgery and post-op checkup',
    attachment: true,
    status: 'Pending',
    appliedAt: '2026-08-19'
  },
  {
    id: 'REQ003',
    employeeId: 'EMP007', // Leslie Alexander
    leaveType: 'Unpaid Leave',
    startDate: '2026-09-01',
    endDate: '2026-09-05',
    duration: 5,
    reason: 'Family emergencies at hometown',
    status: 'Pending',
    appliedAt: '2026-08-15'
  },
  {
    id: 'REQ004',
    employeeId: 'EMP006', // Brooklyn
    leaveType: 'Casual Leave',
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    duration: 2,
    reason: 'Moving to new apartment',
    status: 'Approved',
    appliedAt: '2026-08-05',
    reviewedAt: '2026-08-06',
    reviewedBy: 'EMP001'
  }
];

// Payroll history + current month
export let payrolls: Payroll[] = [
  {
    id: 'PAY001',
    employeeId: 'EMP001',
    payrollMonth: '2026-07',
    basicSalary: 6000,
    allowances: 700,
    bonus: 200,
    overtime: 150,
    grossSalary: 7050,
    tax: 705,
    pf: 480,
    otherDeductions: 100,
    totalDeductions: 1285,
    netSalary: 5765,
    status: 'Paid'
  },
  {
    id: 'PAY002',
    employeeId: 'EMP002',
    payrollMonth: '2026-07',
    basicSalary: 8500,
    allowances: 1000,
    bonus: 500,
    overtime: 0,
    grossSalary: 10000,
    tax: 1200,
    pf: 600,
    otherDeductions: 150,
    totalDeductions: 1950,
    netSalary: 8050,
    status: 'Paid'
  }
];

// Notifications
export let notifications: Notification[] = [
  { id: 'NOT001', userId: 'U1', title: 'New Leave Request', message: 'Robert Fox applied for Paid Time Off (4 days)', type: 'leave', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'NOT002', userId: 'U1', title: 'Leave Application', message: 'Cody Fisher submitted a Sick Leave certificate', type: 'leave', isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'NOT003', userId: 'U1', title: 'Late Attendance', message: 'Brooklyn Simmons checked in late today', type: 'attendance', isRead: true, createdAt: new Date(Date.now() - 14400000).toISOString() }
];

// Messages
export let messages: Message[] = [
  { id: 'MSG001', senderId: 'EMP002', receiverId: 'EMP001', message: 'Hey Alex, review the engineering headcount report?', isRead: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'MSG002', senderId: 'EMP001', receiverId: 'EMP002', message: 'Sure Jane, checking it right now.', isRead: true, createdAt: new Date(Date.now() - 1500000).toISOString() },
  { id: 'MSG003', senderId: 'EMP004', receiverId: 'EMP001', message: 'Hey, did we finalize the candidate for the senior developer role?', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() }
];

// Company Settings
export let companySettings: CompanySettings = {
  companyName: 'Dayflow Technologies',
  logo: 'https://i.ibb.co/6P0Y6XQ/dayflow-logo.png',
  email: 'hr@dayflow.com',
  phone: '+91 80 4910 2000',
  address: 'No 45, Green Glades, 80 Feet Road, Koramangala, Bangalore - 560034',
  timezone: 'Asia/Kolkata',
  currency: 'USD',
  workHoursStart: '09:00 AM',
  workHoursEnd: '06:00 PM',
  lateThresholdMinutes: 15
};

// State Mutator Functions to implement standard CRUD on memory arrays:
export function addEmployee(emp: Omit<Employee, 'id' | 'createdAt'>): Employee {
  const newEmp: Employee = {
    ...emp,
    id: emp.employeeId,
    createdAt: new Date().toISOString()
  };
  employees.push(newEmp);
  
  // Also create user log
  const username = emp.firstName.toLowerCase();
  const newUser: User = {
    id: `U${users.length + 1}`,
    username,
    email: emp.email,
    passwordHash: hashSync('password', 10),
    role: (emp as any).role || 'Employee',
    employeeId: newEmp.id,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);

  // Initialize leave balances
  leaveBalances.push({ id: `LB-${newEmp.id}-PTO`, employeeId: newEmp.id, leaveType: 'Paid Time Off', allocated: 18, used: 0, remaining: 18 });
  leaveBalances.push({ id: `LB-${newEmp.id}-SL`, employeeId: newEmp.id, leaveType: 'Sick Leave', allocated: 10, used: 0, remaining: 10 });
  leaveBalances.push({ id: `LB-${newEmp.id}-UL`, employeeId: newEmp.id, leaveType: 'Unpaid Leave', allocated: 5, used: 0, remaining: 5 });
  leaveBalances.push({ id: `LB-${newEmp.id}-CL`, employeeId: newEmp.id, leaveType: 'Casual Leave', allocated: 6, used: 0, remaining: 6 });

  return newEmp;
}

export function updateEmployee(id: string, empUpdate: Partial<Employee>): Employee {
  const idx = employees.findIndex(e => e.id === id);
  if (idx === -1) throw new Error('Employee not found');
  employees[idx] = { ...employees[idx], ...empUpdate, employeeId: id, id };
  return employees[idx];
}

export function deactivateEmployee(id: string): void {
  const idx = employees.findIndex(e => e.id === id);
  if (idx !== -1) {
    employees[idx].status = 'Inactive';
  }
}

export function addDepartment(name: string, description: string): Department {
  const dept: Department = { id: `D${departments.length + 1}`, name, description, status: 'Active' };
  departments.push(dept);
  return dept;
}

export function addDesignation(name: string, departmentId: string): Designation {
  const desig: Designation = { id: `DS${designations.length + 1}`, name, departmentId, status: 'Active' };
  designations.push(desig);
  return desig;
}
