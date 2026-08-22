import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { compareSync } from 'bcryptjs';
import path from 'path';
import * as store from './store';
import { db, saveBase64File, ExpenseClaim, ExpenseCategory, ExpenseBill } from './db';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded bill files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Middleware to check admin role
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (store.activeSessionUser && store.activeSessionUser.role === 'HR') {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized. Admin role required.' });
  }
}

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Dayflow API is running' });
});

app.get('/api/dashboard', (req: Request, res: Response) => {
  res.json({
    kpis: {
      hours: '38h 15m',
      leavesAvailable: 18,
      nextHoliday: 4
    },
    attendanceOverview: [
      { name: 'Mon', Present: 22, 'Half-day': 2, Absent: 1, Leave: 1 },
      { name: 'Tue', Present: 23, 'Half-day': 1, Absent: 1, Leave: 1 },
      { name: 'Wed', Present: 24, 'Half-day': 0, Absent: 0, Leave: 2 },
      { name: 'Thu', Present: 22, 'Half-day': 2, Absent: 1, Leave: 1 },
      { name: 'Fri', Present: 21, 'Half-day': 3, Absent: 0, Leave: 2 }
    ],
    upcoming: [
      { type: 'video', title: 'Product sync meeting', time: '10:30 AM - 11:00 AM' },
      { type: 'calendar', title: 'HR policy update briefing', time: '02:00 PM - 02:30 PM' }
    ],
    recentActivity: [
      { type: 'checkin', text: 'Checked in at Koramangala Office', time: '09:12 AM' },
      { type: 'leave', text: 'Casual Leave request approved', time: 'Yesterday' },
      { type: 'payslip', text: 'July payslip is now available', time: '3 days ago' }
    ]
  });
});

// ================= AUTHENTICATION =================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  store.setActiveSessionUser(user);
  const employee = store.employees.find(e => e.id === user.employeeId);
  res.json({ user, employee });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  // Clear active session
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  if (!store.activeSessionUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const employee = store.employees.find(e => e.id === store.activeSessionUser.employeeId);
  res.json({ user: store.activeSessionUser, employee });
});

// Toggles active user role between HR and Employee
app.post('/api/auth/switch-role', (req: Request, res: Response) => {
  if (!store.activeSessionUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const userIdx = store.users.findIndex(u => u.id === store.activeSessionUser.id);
  if (userIdx !== -1) {
    const currentRole = store.users[userIdx].role;
    const newRole = currentRole === 'HR' ? 'Employee' : 'HR';
    store.users[userIdx].role = newRole;
    store.setActiveSessionUser(store.users[userIdx]);
    
    // Also toggle actual status of employee
    const empIdx = store.employees.findIndex(e => e.id === store.activeSessionUser.employeeId);
    if (empIdx !== -1 && newRole === 'HR') {
      store.employees[empIdx].status = 'Active';
    }
  }
  const employee = store.employees.find(e => e.id === store.activeSessionUser.employeeId);
  res.json({ user: store.activeSessionUser, employee });
});


// ================= EMPLOYEES =================
app.get('/api/employees', (req: Request, res: Response) => {
  let list = [...store.employees];

  // Filtering
  const { search, departmentId, designationId, status, employmentType, workLocation } = req.query;

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(e => 
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.employeeId.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  }

  if (departmentId && departmentId !== 'All Departments') {
    list = list.filter(e => e.departmentId === departmentId);
  }

  if (designationId) {
    list = list.filter(e => e.designationId === designationId);
  }

  if (status) {
    list = list.filter(e => e.status.toLowerCase() === (status as string).toLowerCase());
  }

  if (employmentType) {
    list = list.filter(e => e.employmentType === employmentType);
  }

  if (workLocation) {
    list = list.filter(e => e.workLocation === workLocation);
  }

  res.json(list);
});

app.get('/api/employees/:id', (req: Request, res: Response) => {
  const emp = store.employees.find(e => e.id === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  // Get linked details
  const attendanceLogs = store.attendance.filter(a => a.employeeId === emp.id);
  const leaveHistory = store.leaveRequests.filter(l => l.employeeId === emp.id);
  const balances = store.leaveBalances.filter(b => b.employeeId === emp.id);
  const payrollHistory = store.payrolls.filter(p => p.employeeId === emp.id);

  res.json({
    employee: emp,
    attendance: attendanceLogs,
    leaveRequests: leaveHistory,
    leaveBalances: balances,
    payroll: payrollHistory
  });
});

app.post('/api/employees', requireAdmin, (req: Request, res: Response) => {
  const { 
    employeeId, firstName, lastName, email, phone, dateOfBirth, gender,
    address, city, state, country, departmentId, designationId, managerId,
    joiningDate, employmentType, workLocation, status, profilePhoto,
    baseSalary, role
  } = req.body;

  // Validation
  if (!employeeId || !firstName || !lastName || !email || !joiningDate || !employmentType) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  // Duplicate ID & Email Check
  if (store.employees.some(e => e.employeeId === employeeId)) {
    return res.status(400).json({ error: 'Employee ID already exists' });
  }
  if (store.employees.some(e => e.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Corporate email already exists' });
  }

  const newEmp = store.addEmployee({
    employeeId,
    firstName,
    lastName,
    email,
    phone: phone || '',
    dateOfBirth: dateOfBirth || '',
    gender: gender || 'Male',
    address: address || '',
    city: city || '',
    state: state || '',
    country: country || '',
    departmentId: departmentId || 'D2',
    designationId: designationId || 'DS4',
    managerId: managerId || '',
    joiningDate,
    employmentType,
    workLocation: workLocation || 'Office',
    status: status || 'Active',
    profilePhoto: profilePhoto || 'https://i.pravatar.cc/150?u=' + Math.random(),
    baseSalary: parseFloat(baseSalary) || 4000,
    hra: Math.round((parseFloat(baseSalary) || 4000) * 0.25),
    allowances: Math.round((parseFloat(baseSalary) || 4000) * 0.10),
    role: role || 'Employee'
  } as any);

  // Notify admin
  store.notifications.push({
    id: `NOT${store.notifications.length + 1}`,
    userId: 'U1',
    title: 'New Employee Added',
    message: `${firstName} ${lastName} has been added to the directory.`,
    type: 'employee',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json(newEmp);
});

app.put('/api/employees/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const updated = store.updateEmployee(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

app.delete('/api/employees/:id', requireAdmin, (req: Request, res: Response) => {
  store.deactivateEmployee(req.params.id);
  res.json({ message: 'Employee deactivated successfully' });
});


// ================= ATTENDANCE =================
app.get('/api/attendance', (req: Request, res: Response) => {
  let list = [...store.attendance];
  const { date, status, employeeId } = req.query;

  if (date) {
    list = list.filter(a => a.date === date);
  }
  if (status) {
    list = list.filter(a => a.status === status);
  }
  if (employeeId) {
    list = list.filter(a => a.employeeId === employeeId);
  }

  // Populate employee details for display
  const result = list.map(a => {
    const emp = store.employees.find(e => e.id === a.employeeId);
    return {
      ...a,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      department: emp ? store.departments.find(d => d.id === emp.departmentId)?.name : 'Unknown'
    };
  });

  res.json(result);
});

app.post('/api/attendance', (req: Request, res: Response) => {
  const { employeeId, date, checkIn, checkOut, status, location } = req.body;
  
  if (!employeeId || !date || !checkIn) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const newRecord: store.Attendance = {
    id: `ATT${store.attendance.length + 1}`,
    employeeId,
    date,
    checkIn,
    checkOut: checkOut || '',
    totalHours: checkOut ? '8h 00m' : '--',
    status: status || 'Present',
    location: location || 'Bangalore Office'
  };

  store.attendance.push(newRecord);
  res.json(newRecord);
});

app.put('/api/attendance/:id', requireAdmin, (req: Request, res: Response) => {
  const recordIdx = store.attendance.findIndex(a => a.id === req.params.id);
  if (recordIdx === -1) {
    return res.status(404).json({ error: 'Attendance record not found' });
  }

  store.attendance[recordIdx] = {
    ...store.attendance[recordIdx],
    ...req.body
  };

  res.json(store.attendance[recordIdx]);
});


// ================= LEAVES =================
app.get('/api/leaves', (req: Request, res: Response) => {
  const result = store.leaveRequests.map(req => {
    const emp = store.employees.find(e => e.id === req.employeeId);
    return {
      ...req,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      role: emp ? store.designations.find(d => d.id === emp.designationId)?.name : 'Unknown',
      avatar: emp ? emp.profilePhoto : 'https://i.pravatar.cc/150',
      department: emp ? store.departments.find(d => d.id === emp.departmentId)?.name : 'Unknown'
    };
  });

  res.json(result);
});

app.post('/api/leaves', (req: Request, res: Response) => {
  const { employeeId, leaveType, startDate, endDate, duration, reason } = req.body;
  if (!employeeId || !leaveType || !startDate || !endDate || !duration || !reason) {
    return res.status(400).json({ error: 'Missing leave details' });
  }

  const newLeave: store.LeaveRequest = {
    id: `REQ00${store.leaveRequests.length + 1}`,
    employeeId,
    leaveType,
    startDate,
    endDate,
    duration: parseInt(duration),
    reason,
    status: 'Pending',
    appliedAt: new Date().toISOString().split('T')[0]
  };

  store.leaveRequests.unshift(newLeave);

  // Notify Admin
  const emp = store.employees.find(e => e.id === employeeId);
  store.notifications.push({
    id: `NOT${store.notifications.length + 1}`,
    userId: 'U1',
    title: 'New Leave Request',
    message: `${emp ? emp.firstName : 'Employee'} applied for ${leaveType} (${duration} days)`,
    type: 'leave',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json(newLeave);
});

app.put('/api/leaves/:id/approve', requireAdmin, (req: Request, res: Response) => {
  const { comment } = req.body;
  const leaveIdx = store.leaveRequests.findIndex(l => l.id === req.params.id);
  if (leaveIdx === -1) {
    return res.status(404).json({ error: 'Leave request not found' });
  }

  const request = store.leaveRequests[leaveIdx];
  request.status = 'Approved';
  request.reviewedAt = new Date().toISOString().split('T')[0];
  request.reviewedBy = store.activeSessionUser.employeeId;

  // Deduct Balance
  const balanceIdx = store.leaveBalances.findIndex(b => b.employeeId === request.employeeId && b.leaveType === request.leaveType);
  if (balanceIdx !== -1) {
    store.leaveBalances[balanceIdx].used += request.duration;
    store.leaveBalances[balanceIdx].remaining = Math.max(0, store.leaveBalances[balanceIdx].allocated - store.leaveBalances[balanceIdx].used);
  }

  // Auto-mark attendance for those days as On Leave
  let start = new Date(request.startDate);
  let end = new Date(request.endDate);
  while (start <= end) {
    const formattedDate = start.toISOString().split('T')[0];
    const exists = store.attendance.find(a => a.employeeId === request.employeeId && a.date === formattedDate);
    if (!exists) {
      store.attendance.push({
        id: `ATT${store.attendance.length + 1}`,
        employeeId: request.employeeId,
        date: formattedDate,
        checkIn: '--',
        checkOut: '--',
        totalHours: '--',
        status: 'On Leave',
        location: '--',
        remarks: `Leave approved: ${request.reason}`
      });
    } else {
      exists.status = 'On Leave';
    }
    start.setDate(start.getDate() + 1);
  }

  // Notify Employee
  store.notifications.push({
    id: `NOT${store.notifications.length + 1}`,
    userId: request.employeeId, // links to employee's user ID if matches
    title: 'Leave Request Approved',
    message: `Your request for ${request.leaveType} (${request.duration} days) was approved. ${comment ? 'Comment: ' + comment : ''}`,
    type: 'leave',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json(request);
});

app.put('/api/leaves/:id/reject', requireAdmin, (req: Request, res: Response) => {
  const { comment } = req.body;
  if (!comment) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  const leaveIdx = store.leaveRequests.findIndex(l => l.id === req.params.id);
  if (leaveIdx === -1) {
    return res.status(404).json({ error: 'Leave request not found' });
  }

  const request = store.leaveRequests[leaveIdx];
  request.status = 'Rejected';
  request.rejectionReason = comment;
  request.reviewedAt = new Date().toISOString().split('T')[0];
  request.reviewedBy = store.activeSessionUser.employeeId;

  // Notify Employee
  store.notifications.push({
    id: `NOT${store.notifications.length + 1}`,
    userId: request.employeeId,
    title: 'Leave Request Rejected',
    message: `Your request for ${request.leaveType} was rejected. Reason: ${comment}`,
    type: 'leave',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json(request);
});


// ================= PAYROLL =================
app.get('/api/payroll', (req: Request, res: Response) => {
  const { month } = req.query;

  // Determine user role
  const isAdmin = store.activeSessionUser && store.activeSessionUser.role === 'HR';

  if (isAdmin) {
    let list = [...store.payrolls];
    if (month) {
      list = list.filter(p => p.payrollMonth === month);
    }
    const result = list.map(p => {
      const emp = store.employees.find(e => e.id === p.employeeId);
      return {
        ...p,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
        employeeId: p.employeeId,
        department: emp ? store.departments.find(d => d.id === emp.departmentId)?.name : 'Unknown'
      };
    });
    return res.json(result);
  }

  // Employee Mode: Return `{ current: { month, paidOn, netSalary, earnings, deductions }, history }`
  const employeeId = store.activeSessionUser ? store.activeSessionUser.employeeId : 'EMP001';
  const employee = store.employees.find(e => e.id === employeeId);

  // Find payroll history for this employee
  const empPayrolls = store.payrolls.filter(p => p.employeeId === employeeId);

  // Default to a current month slip if none generated yet
  const activeMonthCode = '2026-07';
  const activeMonthName = 'July 2026';
  
  let currentPayroll = empPayrolls.find(p => p.payrollMonth === activeMonthCode);
  if (!currentPayroll) {
    const basic = employee ? employee.baseSalary : 4500;
    const allowances = employee ? employee.allowances : 1000;
    const gross = basic + allowances;
    const pf = Math.round(basic * 0.08);
    const tax = Math.round(gross * 0.12);
    const deductions = pf + tax;
    const net = gross - deductions;

    currentPayroll = {
      id: `PAY-${employeeId}-${activeMonthCode}`,
      employeeId,
      payrollMonth: activeMonthCode,
      basicSalary: basic,
      allowances,
      bonus: 0,
      overtime: 0,
      grossSalary: gross,
      tax,
      pf,
      otherDeductions: 0,
      totalDeductions: deductions,
      netSalary: net,
      status: 'Paid'
    };
  }

  // Now check for Tour Reimbursement claims linked to this slip!
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const parsedMonthNum = parseInt(currentPayroll.payrollMonth.split('-')[1] || '7');
  const currentMonthName = monthNames[parsedMonthNum - 1] || 'July';
  const currentYearName = currentPayroll.payrollMonth.split('-')[0] || '2026';

  const matchedClaims = db.getClaimsByEmployee(employeeId).filter(c => 
    c.payroll_added && 
    c.payroll_month === currentMonthName && 
    c.payroll_year === currentYearName
  );

  const tourReimbursementVal = matchedClaims.reduce((sum, c) => sum + (c.approved_total || 0), 0);

  const basicVal = currentPayroll.basicSalary;
  const allowancesVal = currentPayroll.allowances + currentPayroll.bonus + currentPayroll.overtime;
  
  const taxVal = currentPayroll.tax;
  const pfVal = currentPayroll.pf;
  const otherDedVal = currentPayroll.otherDeductions;

  const totalEarningsVal = basicVal + allowancesVal + tourReimbursementVal;
  const totalDeductionsVal = taxVal + pfVal + otherDedVal;
  const netSalaryVal = totalEarningsVal - totalDeductionsVal;

  const currentPayload = {
    month: `${currentMonthName} ${currentYearName}`,
    paidOn: currentPayroll.status === 'Paid' ? `30 ${currentMonthName.slice(0, 3)} ${currentYearName}` : 'Pending',
    netSalary: `$${netSalaryVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    earnings: {
      total: `$${totalEarningsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      basic: `$${basicVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      house: `$${Math.round(basicVal * 0.25).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      conveyance: `$${Math.round(basicVal * 0.10).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      other: `$${allowancesVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      tourReimbursement: tourReimbursementVal > 0 ? `$${tourReimbursementVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null
    },
    deductions: {
      total: `$${totalDeductionsVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      providentFund: `$${pfVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      professionalTax: `$200.00`,
      incomeTax: `$${taxVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      other: `$${otherDedVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  };

  const historyList = empPayrolls.map(p => {
    const pMonthNum = parseInt(p.payrollMonth.split('-')[1] || '7');
    const pMonthName = monthNames[pMonthNum - 1] || 'July';
    const pYear = p.payrollMonth.split('-')[0] || '2026';
    
    const pClaims = db.getClaimsByEmployee(employeeId).filter(c => 
      c.payroll_added && 
      c.payroll_month === pMonthName && 
      c.payroll_year === pYear
    );
    const pReimb = pClaims.reduce((sum, c) => sum + (c.approved_total || 0), 0);
    const pNet = p.netSalary + pReimb;

    return {
      month: `${pMonthName.slice(0, 3)} ${pYear}`,
      amount: `$${pNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    };
  });

  if (historyList.length === 0) {
    historyList.push({
      month: `${currentMonthName.slice(0, 3)} ${currentYearName}`,
      amount: `$${netSalaryVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    });
  }

  res.json({
    current: currentPayload,
    history: historyList
  });
});

app.post('/api/payroll/generate', requireAdmin, (req: Request, res: Response) => {
  const { month } = req.body;
  if (!month) {
    return res.status(400).json({ error: 'Payroll month is required (YYYY-MM)' });
  }

  // Remove existing drafts/unpaid records for this month
  store.payrolls.forEach((p, idx) => {
    if (p.payrollMonth === month && p.status !== 'Paid') {
      store.payrolls.splice(idx, 1);
    }
  });

  // Generate for all active employees
  const generated: store.Payroll[] = [];
  store.employees.filter(e => e.status !== 'Inactive').forEach(emp => {
    // Check if already paid
    const alreadyPaid = store.payrolls.some(p => p.employeeId === emp.id && p.payrollMonth === month && p.status === 'Paid');
    if (alreadyPaid) return;

    const basicSalary = emp.baseSalary;
    const allowances = emp.allowances;
    const bonus = 0;
    const overtime = 0;
    const grossSalary = basicSalary + allowances + bonus + overtime;

    const tax = Math.round(grossSalary * 0.12);
    const pf = Math.round(basicSalary * 0.08);
    const otherDeductions = 0;
    const totalDeductions = tax + pf + otherDeductions;
    const netSalary = grossSalary - totalDeductions;

    const pay: store.Payroll = {
      id: `PAY-${emp.id}-${month}`,
      employeeId: emp.id,
      payrollMonth: month,
      basicSalary,
      allowances,
      bonus,
      overtime,
      grossSalary,
      tax,
      pf,
      otherDeductions,
      totalDeductions,
      netSalary,
      status: 'Draft'
    };

    store.payrolls.push(pay);
    generated.push(pay);
  });

  // Notify admins
  store.notifications.push({
    id: `NOT${store.notifications.length + 1}`,
    userId: 'U1',
    title: 'Payroll Generated',
    message: `Payroll draft for ${month} has been generated for ${generated.length} employees.`,
    type: 'payroll',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json({ message: `Successfully generated payroll for ${generated.length} employees.`, generated });
});

app.put('/api/payroll/:id', requireAdmin, (req: Request, res: Response) => {
  const payIdx = store.payrolls.findIndex(p => p.id === req.params.id);
  if (payIdx === -1) {
    return res.status(404).json({ error: 'Payroll record not found' });
  }

  const current = store.payrolls[payIdx];
  const { basicSalary, allowances, bonus, overtime, tax, pf, otherDeductions, status } = req.body;

  const basic = basicSalary !== undefined ? parseFloat(basicSalary) : current.basicSalary;
  const allow = allowances !== undefined ? parseFloat(allowances) : current.allowances;
  const bon = bonus !== undefined ? parseFloat(bonus) : current.bonus;
  const ot = overtime !== undefined ? parseFloat(overtime) : current.overtime;
  const gross = basic + allow + bon + ot;

  const tx = tax !== undefined ? parseFloat(tax) : current.tax;
  const pFund = pf !== undefined ? parseFloat(pf) : current.pf;
  const ded = otherDeductions !== undefined ? parseFloat(otherDeductions) : current.otherDeductions;
  const totDed = tx + pFund + ded;
  const net = gross - totDed;

  store.payrolls[payIdx] = {
    ...current,
    basicSalary: basic,
    allowances: allow,
    bonus: bon,
    overtime: ot,
    grossSalary: gross,
    tax: tx,
    pf: pFund,
    otherDeductions: ded,
    totalDeductions: totDed,
    netSalary: net,
    status: status || current.status
  };

  res.json(store.payrolls[payIdx]);
});

app.put('/api/payroll/:id/approve', requireAdmin, (req: Request, res: Response) => {
  const payIdx = store.payrolls.findIndex(p => p.id === req.params.id);
  if (payIdx === -1) {
    return res.status(404).json({ error: 'Payroll record not found' });
  }

  store.payrolls[payIdx].status = 'Paid';

  // Notify Employee
  store.notifications.push({
    id: `NOT${store.notifications.length + 1}`,
    userId: store.payrolls[payIdx].employeeId,
    title: 'Payslip Available',
    message: `Your payslip for ${store.payrolls[payIdx].payrollMonth} is ready for download. Net salary: $${store.payrolls[payIdx].netSalary.toLocaleString()}`,
    type: 'payroll',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json(store.payrolls[payIdx]);
});


// ================= REPORTS & ANALYTICS =================
app.get('/api/reports/overview', (req: Request, res: Response) => {
  const totalEmployees = store.employees.filter(e => e.status !== 'Inactive').length;
  
  // Calculate average attendance rate
  const uniqueDays = Array.from(new Set(store.attendance.map(a => a.date)));
  let attendanceSum = 0;
  uniqueDays.forEach(d => {
    const presentOnDay = store.attendance.filter(a => a.date === d && (a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day' || a.status === 'Work From Home')).length;
    attendanceSum += (presentOnDay / totalEmployees) * 100;
  });
  const avgAttendance = uniqueDays.length > 0 ? Math.round(attendanceSum / uniqueDays.length) : 95;

  const totalLeaves = store.leaveRequests.filter(l => l.status === 'Approved').reduce((acc, curr) => acc + curr.duration, 0);
  
  // Total current month payroll (e.g. 2026-07)
  const currentMonthPayrolls = store.payrolls.filter(p => p.payrollMonth === '2026-07');
  const payrollCost = currentMonthPayrolls.reduce((acc, curr) => acc + curr.netSalary, 0);

  const overtimeHours = '32h 15m';

  res.json({
    kpis: {
      totalEmployees,
      avgAttendance: `${avgAttendance}%`,
      totalLeaves,
      payrollThisMonth: `$${payrollCost.toLocaleString()}`,
      overtimeHours
    }
  });
});

app.get('/api/reports/attendance', (req: Request, res: Response) => {
  // Return attendance trend
  const uniqueDays = Array.from(new Set(store.attendance.map(a => a.date))).sort();
  const trend = uniqueDays.slice(-5).map(d => {
    const totalCount = store.employees.filter(e => e.status !== 'Inactive').length;
    const present = store.attendance.filter(a => a.date === d && (a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day' || a.status === 'Work From Home')).length;
    return {
      name: d.split('-').slice(1).reverse().join(' '), // DD MM format
      value: Math.round((present / totalCount) * 100)
    };
  });

  res.json(trend);
});

app.get('/api/reports/leaves', (req: Request, res: Response) => {
  // Return leave types breakdown
  const counts = { 'Paid Time Off': 0, 'Sick Leave': 0, 'Unpaid Leave': 0, 'Casual Leave': 0, 'Other': 0 };
  store.leaveRequests.filter(l => l.status === 'Approved').forEach(l => {
    if (counts[l.leaveType] !== undefined) {
      counts[l.leaveType] += l.duration;
    }
  });

  res.json([
    { name: 'Paid Time Off', value: counts['Paid Time Off'] },
    { name: 'Sick Leave', value: counts['Sick Leave'] },
    { name: 'Unpaid Leave', value: counts['Unpaid Leave'] },
    { name: 'Casual Leave', value: counts['Casual Leave'] }
  ]);
});

app.get('/api/reports/payroll', (req: Request, res: Response) => {
  // Return department headcount and payroll breakdown
  const breakdown = store.departments.map(d => {
    const emps = store.employees.filter(e => e.departmentId === d.id && e.status !== 'Inactive');
    const totalPayroll = store.payrolls
      .filter(p => p.payrollMonth === '2026-07' && emps.some(e => e.id === p.employeeId))
      .reduce((acc, curr) => acc + curr.netSalary, 0);

    return {
      name: d.name,
      value: emps.length,
      payroll: totalPayroll,
      color: d.id === 'D1' ? '#7FAF3F' :
             d.id === 'D2' ? '#E5A83B' :
             d.id === 'D3' ? '#E56B65' :
             d.id === 'D4' ? '#7A70C7' : '#67AFA5'
    };
  });

  res.json(breakdown);
});


// ================= NOTIFICATIONS =================
app.get('/api/notifications', (req: Request, res: Response) => {
  const unread = store.notifications.filter(n => !n.isRead).length;
  res.json({ list: store.notifications, unread });
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const item = store.notifications.find(n => n.id === req.params.id);
  if (item) {
    item.isRead = true;
  }
  res.json({ success: true });
});

app.put('/api/notifications/read-all', (req: Request, res: Response) => {
  store.notifications.forEach(n => n.isRead = true);
  res.json({ success: true });
});


// ================= MESSAGES =================
app.get('/api/messages', (req: Request, res: Response) => {
  // Return all messages for simulated chat log
  const result = store.messages.map(m => {
    const sender = store.employees.find(e => e.id === m.senderId);
    return {
      ...m,
      senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'System',
      senderAvatar: sender ? sender.profilePhoto : 'https://i.pravatar.cc/150'
    };
  });

  const unreadCount = store.messages.filter(m => !m.isRead && m.receiverId === 'EMP001').length;
  res.json({ list: result, unreadCount });
});

app.post('/api/messages', (req: Request, res: Response) => {
  const { receiverId, message } = req.body;
  if (!receiverId || !message) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const newMsg: store.Message = {
    id: `MSG${store.messages.length + 1}`,
    senderId: store.activeSessionUser.employeeId,
    receiverId,
    message,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  store.messages.push(newMsg);
  res.json(newMsg);
});

app.put('/api/messages/:id/read', (req: Request, res: Response) => {
  const item = store.messages.find(m => m.id === req.params.id);
  if (item) {
    item.isRead = true;
  }
  res.json({ success: true });
});


// ================= SETTINGS =================
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({
    company: store.companySettings,
    departments: store.departments,
    designations: store.designations
  });
});

app.put('/api/settings', requireAdmin, (req: Request, res: Response) => {
  Object.assign(store.companySettings, req.body);
  res.json(store.companySettings);
});

app.post('/api/settings/departments', requireAdmin, (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Department name is required' });
  const dept = store.addDepartment(name, description || '');
  res.json(dept);
});

app.post('/api/settings/designations', requireAdmin, (req: Request, res: Response) => {
  const { name, departmentId } = req.body;
  if (!name || !departmentId) return res.status(400).json({ error: 'Name and Department ID are required' });
  const desig = store.addDesignation(name, departmentId);
  res.json(desig);
});


// ================= TOUR EXPENSE REIMBURSEMENT APIs =================

// Submit new claim (Employee)
app.post('/api/reimbursements', (req: Request, res: Response) => {
  const { 
    employeeId, employeeName, employeeDepartment, 
    tourTitle, destination, startDate, endDate, purpose, categories 
  } = req.body;

  if (!tourTitle || !destination || !startDate || !endDate || !categories || categories.length === 0) {
    return res.status(400).json({ error: 'Missing required tour or category receipts details.' });
  }

  // Calculate claimed total
  let totalClaimed = 0;
  categories.forEach((cat: any) => {
    cat.bills.forEach((bill: any) => {
      totalClaimed += Number(bill.amount || 0);
    });
  });

  const claimId = `CLM-${Date.now()}`;
  const newClaim: ExpenseClaim = {
    id: claimId,
    employee_id: employeeId || (store.activeSessionUser ? store.activeSessionUser.employeeId : 'EMP001'),
    employee_name: employeeName || 'Alex Martin',
    employee_department: employeeDepartment || 'Design',
    tour_title: tourTitle,
    destination,
    start_date: startDate,
    end_date: endDate,
    purpose: purpose || '',
    claimed_total: totalClaimed,
    approved_total: 0,
    status: 'pending',
    submitted_at: new Date().toISOString(),
    payroll_added: false
  };

  // Save claim
  db.saveClaim(newClaim);

  // Process categories and files
  categories.forEach((cat: any) => {
    const catId = `CAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    let catTotal = 0;
    cat.bills.forEach((bill: any) => {
      catTotal += Number(bill.amount || 0);
    });

    const newCategory: ExpenseCategory = {
      id: catId,
      expense_claim_id: claimId,
      category_name: cat.name,
      employee_category_total: catTotal,
      hr_category_total: 0,
      review_status: 'pending'
    };

    db.saveCategory(newCategory);

    cat.bills.forEach((bill: any) => {
      const savedFileName = saveBase64File(bill.name, bill.base64);
      const newBill: ExpenseBill = {
        id: `BIL-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        expense_claim_id: claimId,
        expense_category_id: catId,
        bill_file: savedFileName,
        original_file_name: bill.name,
        employee_amount: Number(bill.amount),
        hr_approved_amount: null,
        created_at: new Date().toISOString()
      };
      db.saveBill(newBill);
    });
  });

  // Push HR notification in store
  store.notifications.unshift({
    id: `NOT-${Date.now()}`,
    userId: 'U1', // Admin/HR user ID
    title: 'New Expense Claim Submitted',
    message: `${newClaim.employee_name} submitted a claim of ₹${newClaim.claimed_total.toLocaleString('en-IN')} for '${newClaim.tour_title}'.`,
    type: 'payroll',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, claimId });
});

// Get employee claims list
app.get('/api/reimbursements', (req: Request, res: Response) => {
  const empId = store.activeSessionUser ? store.activeSessionUser.employeeId : 'EMP001';
  const claims = db.getClaimsByEmployee(empId);
  res.json(claims);
});

// Get admin claims list (HR)
app.get('/api/admin/reimbursements', requireAdmin, (req: Request, res: Response) => {
  const claims = db.getClaims();
  res.json(claims);
});

// Get claim details (Employee & HR)
app.get('/api/reimbursements/:id', (req: Request, res: Response) => {
  const claim = db.getClaimById(req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim record not found.' });
  }

  const categories = db.getCategoriesByClaim(claim.id);
  const bills = db.getBillsByClaim(claim.id);

  res.json({ claim, categories, bills });
});

// Save category review (HR)
app.put('/api/admin/reimbursements/:id/category', requireAdmin, (req: Request, res: Response) => {
  const { categoryId, bills: billUpdates } = req.body;
  if (!categoryId || !billUpdates || !Array.isArray(billUpdates)) {
    return res.status(400).json({ error: 'Missing category updates.' });
  }

  // Update bills
  let hrCategoryTotal = 0;
  billUpdates.forEach((u: any) => {
    const dbBill = db.getBillsByClaim(req.params.id).find(b => b.id === u.id);
    if (dbBill) {
      dbBill.hr_approved_amount = u.hrApprovedAmount === null ? null : Number(u.hrApprovedAmount);
      db.saveBill(dbBill);
      if (dbBill.hr_approved_amount !== null) {
        hrCategoryTotal += dbBill.hr_approved_amount;
      }
    }
  });

  // Update category status
  const dbCategory = db.getCategoriesByClaim(req.params.id).find(c => c.id === categoryId);
  if (dbCategory) {
    dbCategory.hr_category_total = hrCategoryTotal;
    dbCategory.review_status = 'reviewed';
    dbCategory.reviewed_at = new Date().toISOString();
    db.saveCategory(dbCategory);
  }

  res.json({ success: true, hrCategoryTotal, reviewStatus: 'reviewed' });
});

// Finalize claim decision (HR)
app.post('/api/admin/reimbursements/:id/finalize', requireAdmin, (req: Request, res: Response) => {
  const { reason } = req.body;
  const claim = db.getClaimById(req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found.' });
  }

  const categories = db.getCategoriesByClaim(claim.id);
  const bills = db.getBillsByClaim(claim.id);

  // Double check that all categories are reviewed
  const unreviewedCat = categories.some(c => c.review_status !== 'reviewed');
  const unreviewedBill = bills.some(b => b.hr_approved_amount === null);
  if (unreviewedCat || unreviewedBill) {
    return res.status(400).json({ error: 'Please save reviews for all categories before making final decision.' });
  }

  // Calculate final approved total
  const finalApprovedTotal = categories.reduce((sum, c) => sum + (c.hr_category_total || 0), 0);

  // Categorize decision
  let decision: 'approved' | 'partially_approved' | 'rejected' = 'approved';
  if (finalApprovedTotal === 0) {
    decision = 'rejected';
  } else if (finalApprovedTotal < claim.claimed_total) {
    decision = 'partially_approved';
  }

  if (decision !== 'approved' && !reason?.trim()) {
    return res.status(400).json({ error: `Mandatory reason required for ${decision.replace('_', ' ')}.` });
  }

  claim.status = decision;
  claim.approved_total = finalApprovedTotal;
  claim.hr_reason = reason || '';
  claim.reviewed_at = new Date().toISOString();
  claim.reviewed_by = store.activeSessionUser ? store.activeSessionUser.employeeId : 'HR001';

  db.saveClaim(claim);

  // Push Employee notification in store
  store.notifications.unshift({
    id: `NOT-${Date.now()}`,
    userId: claim.employee_id, // Employee user ID
    title: `Tour Reimbursement ${decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Partially Approved'}`,
    message: `Your claim of ₹${claim.claimed_total.toLocaleString('en-IN')} for '${claim.tour_title}' has been reviewed: ${decision.toUpperCase()}. Approved amount: ₹${finalApprovedTotal.toLocaleString('en-IN')}.`,
    type: 'payroll',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, status: decision, approvedTotal: finalApprovedTotal });
});

// Link reimbursement to payroll period (HR)
app.post('/api/admin/reimbursements/:id/payroll', requireAdmin, (req: Request, res: Response) => {
  const { month, year } = req.body;
  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required.' });
  }

  const claim = db.getClaimById(req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found.' });
  }

  if (claim.status === 'pending' || claim.status === 'rejected') {
    return res.status(400).json({ error: 'Reimbursement claim must be approved or partially approved first.' });
  }

  // Update claim
  claim.payroll_added = true;
  claim.payroll_month = month;
  claim.payroll_year = year;
  claim.payroll_entry_id = `PAY-ENT-${Date.now()}`;
  db.saveClaim(claim);

  // Append to payroll array if exists
  const monthCode = `${year}-${month === 'January' ? '01' : month === 'February' ? '02' : month === 'March' ? '03' : month === 'April' ? '04' : month === 'May' ? '05' : month === 'June' ? '06' : month === 'July' ? '07' : month === 'August' ? '08' : month === 'September' ? '09' : month === 'October' ? '10' : month === 'November' ? '11' : '12'}`;
  const payrollRecord = store.payrolls.find(p => p.employeeId === claim.employee_id && p.payrollMonth === monthCode);
  if (payrollRecord) {
    payrollRecord.netSalary += claim.approved_total;
    payrollRecord.grossSalary += claim.approved_total;
  }

  res.json({ success: true, message: `Successfully linked reimbursement to ${month} ${year} payslip.` });
});


// ================= REIMBURSEMENTS (MOCK) =================
let reimbursements: any[] = [
  { id: 'REIM-001', employeeId: 'OIALMA20230002', date: '2026-08-15', category: 'Travel', amount: 350.00, status: 'Pending', description: 'Flight to NYC' },
  { id: 'REIM-002', employeeId: 'OIALMA20230002', date: '2026-08-16', category: 'Meals', amount: 45.50, status: 'Approved', description: 'Client Dinner' }
];

app.get('/api/reimbursements', (req: Request, res: Response) => {
  // Return just the current user's reimbursements (mocked as the first employee for now)
  const userReimbursements = reimbursements.filter(r => r.employeeId === (store.activeSessionUser?.employeeId || 'OIALMA20230002'));
  res.json(userReimbursements);
});

app.get('/api/admin/reimbursements', (req: Request, res: Response) => {
  // Return all reimbursements with employee names
  const enriched = reimbursements.map(r => {
    const emp = store.employees.find(e => e.id === r.employeeId);
    return { ...r, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown' };
  });
  res.json(enriched);
});

app.post('/api/reimbursements', (req: Request, res: Response) => {
  const { date, category, amount, description } = req.body;
  const newReimbursement = {
    id: `REIM-00${reimbursements.length + 1}`,
    employeeId: store.activeSessionUser?.employeeId || 'OIALMA20230002',
    date,
    category,
    amount: parseFloat(amount),
    status: 'Pending',
    description
  };
  reimbursements.push(newReimbursement);
  res.json(newReimbursement);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
