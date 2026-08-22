import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { compareSync, hashSync } from 'bcryptjs';
import path from 'path';
import prisma from './prisma';
import { Role, LeaveStatus, LeaveType, AttendanceStatus, CorrectionStatus } from '@prisma/client';
import * as store from './store';
import { db, saveBase64File, ExpenseClaim, ExpenseCategory, ExpenseBill } from './db';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8081;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded bill files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Active session tracking (kept in-memory for session management)
let activeSessionUser: any = null;

app.use(async (req, res, next) => {
  if (!activeSessionUser && req.headers['x-user-email']) {
    const email = req.headers['x-user-email'] as string;
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { privateInfo: true, salaryStructure: true },
      });
      if (user) {
        activeSessionUser = user;
      }
    } catch {
      // Store fallback
      const storeUser = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (storeUser) {
        const storeEmp = store.employees.find(e => e.id === storeUser.employeeId);
        activeSessionUser = {
          id: storeUser.id,
          role: storeUser.role === 'HR' ? 'HR_ADMIN' : 'EMPLOYEE',
          employeeId: storeUser.employeeId,
          email: storeUser.email,
          fullName: storeEmp ? `${storeEmp.firstName} ${storeEmp.lastName}` : storeUser.username,
        };
      }
    }
  }
  next();
});

// Middleware to check admin role
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (activeSessionUser && activeSessionUser.role === 'HR_ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized. Admin role required.' });
  }
}

// Helper: convert DB user to frontend-expected employee format
function userToEmployee(user: any) {
  const names = user.fullName.split(' ');
  const firstName = names[0] || '';
  const lastName = names.slice(1).join(' ') || '';
  return {
    id: user.employeeId,
    employeeId: user.employeeId,
    firstName,
    lastName,
    email: user.email,
    phone: user.privateInfo?.personalEmail || '',
    dateOfBirth: user.privateInfo?.dateOfBirth?.toISOString().split('T')[0] || '',
    gender: user.privateInfo?.gender || '',
    address: user.privateInfo?.residingAddress || '',
    city: '',
    state: '',
    country: user.privateInfo?.nationality || '',
    departmentId: user.department || '',
    designationId: user.jobTitle || '',
    managerId: '',
    joiningDate: user.privateInfo?.dateOfJoining?.toISOString().split('T')[0] || '',
    employmentType: 'Full Time',
    workLocation: user.location || '',
    status: 'Active',
    profilePhoto: user.avatarUrl || 'https://i.pravatar.cc/150',
    baseSalary: Number(user.salaryStructure?.monthlyWage || 0),
    hra: 0,
    allowances: 0,
    role: user.role === 'HR_ADMIN' ? 'HR' : 'Employee',
    createdAt: user.createdAt?.toISOString() || '',
    _dbId: user.id, // internal DB UUID
  };
}

// Helper: convert DB user to frontend-expected user format
function userToAuthUser(user: any) {
  return {
    id: user.id,
    username: user.fullName.split(' ')[0]?.toLowerCase() || '',
    email: user.email,
    role: user.role === 'HR_ADMIN' ? 'HR' : 'Employee',
    employeeId: user.employeeId,
    createdAt: user.createdAt?.toISOString() || '',
  };
}

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Dayflow API is running (PostgreSQL)' });
});

app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const totalEmployees = await prisma.user.count();
    const attendanceRecords = await prisma.attendance.findMany({ orderBy: { date: 'desc' }, take: 200 });
    const dateMap: Record<string, any> = {};
    for (const a of attendanceRecords) {
      const d = a.date.toISOString().split('T')[0];
      if (!dateMap[d]) dateMap[d] = { Present: 0, 'Half-day': 0, Absent: 0, Leave: 0 };
      if (a.status === 'PRESENT') dateMap[d].Present++;
      else if (a.status === 'HALF_DAY') dateMap[d]['Half-day']++;
      else if (a.status === 'ABSENT') dateMap[d].Absent++;
      else if (a.status === 'LEAVE') dateMap[d].Leave++;
    }
    const days = Object.keys(dateMap).sort().slice(-5);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    res.json({
      kpis: { hours: '38h 15m', leavesAvailable: 18, nextHoliday: 4 },
      attendanceOverview: days.map(d => ({ name: dayNames[new Date(d).getDay()], ...dateMap[d] })),
      upcoming: [{ type: 'video', title: 'Product sync meeting', time: '10:30 AM - 11:00 AM' }, { type: 'calendar', title: 'HR policy update briefing', time: '02:00 PM - 02:30 PM' }],
      recentActivity: [{ type: 'checkin', text: 'Checked in at Koramangala Office', time: '09:12 AM' }, { type: 'leave', text: 'Casual Leave request approved', time: 'Yesterday' }, { type: 'payslip', text: 'July payslip is now available', time: '3 days ago' }]
    });
  } catch {
    // Fallback: store-based dashboard
    const storeAtts = store.attendance;
    const dateMap: Record<string, any> = {};
    for (const a of storeAtts) {
      if (!dateMap[a.date]) dateMap[a.date] = { Present: 0, 'Half-day': 0, Absent: 0, Leave: 0 };
      if (a.status === 'Present') dateMap[a.date].Present++;
      else if (a.status === 'Half Day') dateMap[a.date]['Half-day']++;
      else if (a.status === 'Absent') dateMap[a.date].Absent++;
      else if (a.status === 'On Leave') dateMap[a.date].Leave++;
    }
    const days = Object.keys(dateMap).sort().slice(-5);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    res.json({
      kpis: { hours: '38h 15m', leavesAvailable: 18, nextHoliday: 4 },
      attendanceOverview: days.map(d => ({ name: dayNames[new Date(d).getDay()], ...dateMap[d] })),
      upcoming: [{ type: 'video', title: 'Product sync meeting', time: '10:30 AM - 11:00 AM' }],
      recentActivity: [{ type: 'checkin', text: 'Checked in at Office', time: '09:12 AM' }]
    });
  }
});

// ================= AUTHENTICATION =================
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password, username } = req.body;
  if ((!email && !username) || !password) {
    return res.status(400).json({ error: 'Credentials are required' });
  }

  const user = await prisma.user.findFirst({
    where: { 
      employeeId: (email || '').toUpperCase()
    },
    include: { privateInfo: true, salaryStructure: true },
  });

  if (!user || !compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  activeSessionUser = user;
  res.json({
    message: 'Logged in successfully',
    user: userToAuthUser(user),
    employee: userToEmployee(user),
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  activeSessionUser = null;
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  if (!activeSessionUser) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const user = await prisma.user.findUnique({
      where: { id: activeSessionUser.id },
      include: { privateInfo: true, salaryStructure: true },
    });
    if (!user) throw new Error('not found');
    res.json({ user: userToAuthUser(user), employee: userToEmployee(user) });
  } catch {
    // Fallback: return from active session + store
    const storeUser = store.users.find(u => u.id === activeSessionUser.id || u.email === activeSessionUser.email);
    const storeEmp = storeUser ? store.employees.find(e => e.id === storeUser.employeeId) : null;
    res.json({
      user: { id: activeSessionUser.id, username: storeUser?.username || '', email: activeSessionUser.email, role: activeSessionUser.role === 'HR_ADMIN' ? 'HR' : 'Employee', employeeId: activeSessionUser.employeeId, createdAt: '' },
      employee: storeEmp ? { id: storeEmp.id, employeeId: storeEmp.employeeId, firstName: storeEmp.firstName, lastName: storeEmp.lastName, email: storeEmp.email, departmentId: storeEmp.departmentId, designationId: storeEmp.designationId, profilePhoto: storeEmp.profilePhoto, baseSalary: storeEmp.baseSalary, role: storeUser?.role || 'Employee' } : {},
    });
  }
});

app.post('/api/auth/switch-role', async (req: Request, res: Response) => {
  if (!activeSessionUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const currentRole = activeSessionUser.role;
    const newRole = currentRole === 'HR_ADMIN' ? Role.EMPLOYEE : Role.HR_ADMIN;

    const updated = await prisma.user.update({
      where: { id: activeSessionUser.id },
      data: { role: newRole },
      include: { privateInfo: true, salaryStructure: true },
    });

    activeSessionUser = updated;
    res.json({ user: userToAuthUser(updated), employee: userToEmployee(updated) });
  } catch {
    // Store fallback
    const currentRole = activeSessionUser.role;
    const newRole = (currentRole === 'HR_ADMIN' || currentRole === 'HR') ? 'Employee' : 'HR';
    
    // Update activeSessionUser role
    activeSessionUser.role = newRole === 'HR' ? 'HR_ADMIN' : 'EMPLOYEE';
    
    // Find matching user in store to keep sync
    const storeUser = store.users.find(u => u.id === activeSessionUser.id || u.email === activeSessionUser.email);
    if (storeUser) {
      storeUser.role = newRole;
    }

    res.json({
      user: {
        id: activeSessionUser.id,
        username: storeUser?.username || '',
        email: activeSessionUser.email,
        role: newRole,
        employeeId: activeSessionUser.employeeId,
        createdAt: '',
      },
      employee: userToEmployee(activeSessionUser),
    });
  }
});



// ================= EMPLOYEES (ADMIN - from DB) =================
app.get('/api/employees', async (req: Request, res: Response) => {
  const { search, departmentId, status } = req.query;
  try {
    const users = await prisma.user.findMany({
      include: { privateInfo: true, salaryStructure: true },
      orderBy: { createdAt: 'asc' },
    });
    let list = users.map(userToEmployee);
    if (search) { const q = (search as string).toLowerCase(); list = list.filter(e => e.firstName.toLowerCase().includes(q) || e.lastName.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)); }
    if (departmentId && departmentId !== 'All Departments') list = list.filter(e => e.departmentId === departmentId);
    res.json(list);
  } catch {
    let list = [...store.employees];
    if (search) { const q = (search as string).toLowerCase(); list = list.filter(e => e.firstName.toLowerCase().includes(q) || e.lastName.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)); }
    if (status && status !== 'All') list = list.filter(e => e.status === status);
    res.json(list);
  }
});

app.get('/api/employees/:id', async (req: Request, res: Response) => {
  const user = await prisma.user.findFirst({
    where: { employeeId: req.params.id },
    include: {
      privateInfo: true,
      salaryStructure: { include: { components: true } },
      attendance: { orderBy: { date: 'desc' }, take: 30 },
      leaveRequests: { orderBy: { appliedOn: 'desc' } },
      leaveBalances: true,
      payrolls: { include: { items: true }, orderBy: { year: 'desc' } },
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const emp = userToEmployee(user);

  // Transform attendance to expected format
  const attendance = user.attendance.map(a => ({
    id: a.id,
    employeeId: user.employeeId,
    date: a.date.toISOString().split('T')[0],
    checkIn: a.checkIn ? a.checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--',
    checkOut: a.checkOut ? a.checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--',
    totalHours: `${Number(a.workHours).toFixed(0)}h`,
    status: a.status === 'PRESENT' ? 'Present' : a.status === 'HALF_DAY' ? 'Half Day' : a.status === 'LEAVE' ? 'On Leave' : 'Absent',
    location: user.location || '',
  }));

  const leaveTypeMap: Record<string, string> = {
    PAID_TIME_OFF: 'Paid Time Off', SICK_LEAVE: 'Sick Leave',
    UNPAID_LEAVE: 'Unpaid Leave', COMP_OFF: 'Casual Leave',
  };

  const leaveRequests = user.leaveRequests.map(l => ({
    id: l.id,
    employeeId: user.employeeId,
    leaveType: leaveTypeMap[l.type] || l.type,
    startDate: l.startDate.toISOString().split('T')[0],
    endDate: l.endDate.toISOString().split('T')[0],
    duration: Number(l.days),
    reason: l.reason,
    status: l.status === 'PENDING' ? 'Pending' : l.status === 'APPROVED' ? 'Approved' : 'Rejected',
    appliedAt: l.appliedOn.toISOString().split('T')[0],
  }));

  const leaveBalances = user.leaveBalances.map(b => ({
    id: b.id,
    employeeId: user.employeeId,
    leaveType: leaveTypeMap[b.type] || b.type,
    allocated: Number(b.totalDays),
    used: Number(b.usedDays),
    remaining: Number(b.totalDays) - Number(b.usedDays),
  }));

  const payroll = user.payrolls.map(p => ({
    id: p.id,
    employeeId: user.employeeId,
    payrollMonth: `${p.year}-${String(p.month).padStart(2, '0')}`,
    basicSalary: Number(p.grossSalary),
    allowances: 0,
    bonus: 0,
    overtime: 0,
    grossSalary: Number(p.grossSalary),
    tax: 0,
    pf: 0,
    otherDeductions: 0,
    totalDeductions: Number(p.totalDeductions),
    netSalary: Number(p.netSalary),
    status: p.paidOn ? 'Paid' : 'Draft',
  }));

  res.json({ employee: emp, attendance, leaveRequests, leaveBalances, payroll });
});

app.post('/api/employees', requireAdmin, async (req: Request, res: Response) => {
  const {
    employeeId, firstName, lastName, email, phone, dateOfBirth, gender,
    address, departmentId, designationId, managerId,
    joiningDate, employmentType, workLocation, profilePhoto,
    baseSalary, role,
  } = req.body;

  if (!employeeId || !firstName || !lastName || !email || !joiningDate) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  // Check duplicates
  const existing = await prisma.user.findFirst({
    where: { OR: [{ employeeId }, { email: email.toLowerCase() }] },
  });
  if (existing) {
    return res.status(400).json({ error: 'Employee ID or email already exists' });
  }

  const salary = parseFloat(baseSalary) || 4000;

  const newUser = await prisma.user.create({
    data: {
      employeeId,
      fullName: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      passwordHash: hashSync('password', 10),
      role: role === 'HR' ? Role.HR_ADMIN : Role.EMPLOYEE,
      department: departmentId || 'Engineering',
      jobTitle: designationId || 'Software Engineer',
      location: workLocation || 'Office',
      avatarUrl: profilePhoto || `https://i.pravatar.cc/150?u=${Math.random()}`,
      privateInfo: {
        create: {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          residingAddress: address || '',
          gender: gender || 'Male',
          dateOfJoining: new Date(joiningDate),
        },
      },
      salaryStructure: {
        create: {
          monthlyWage: salary,
          yearlyWage: salary * 12,
          components: {
            create: [
              { name: 'Basic Salary', category: 'EARNING', calculationType: 'FIXED', value: salary, calculatedAmount: salary },
            ],
          },
        },
      },
    },
    include: { privateInfo: true, salaryStructure: true },
  });

  // Create leave balances for the new employee
  const leaveTypes = [LeaveType.PAID_TIME_OFF, LeaveType.SICK_LEAVE, LeaveType.UNPAID_LEAVE, LeaveType.COMP_OFF];
  const leaveDays = [18, 10, 5, 6];
  for (let i = 0; i < leaveTypes.length; i++) {
    await prisma.leaveBalance.create({
      data: { userId: newUser.id, type: leaveTypes[i], totalDays: leaveDays[i], usedDays: 0, year: new Date().getFullYear() },
    });
  }

  // Add notification
  if (activeSessionUser) {
    await prisma.notification.create({
      data: {
        userId: activeSessionUser.id,
        type: 'GENERAL',
        title: 'New Employee Added',
        message: `${firstName} ${lastName} has been added to the directory.`,
      },
    });
  }

  res.json(userToEmployee(newUser));
});

app.put('/api/employees/:id', requireAdmin, async (req: Request, res: Response) => {
  const user = await prisma.user.findFirst({ where: { employeeId: req.params.id } });
  if (!user) return res.status(404).json({ error: 'Employee not found' });

  const { firstName, lastName, email, departmentId, designationId, workLocation, profilePhoto, baseSalary } = req.body;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(firstName && lastName ? { fullName: `${firstName} ${lastName}` } : {}),
      ...(email ? { email: email.toLowerCase() } : {}),
      ...(departmentId ? { department: departmentId } : {}),
      ...(designationId ? { jobTitle: designationId } : {}),
      ...(workLocation ? { location: workLocation } : {}),
      ...(profilePhoto ? { avatarUrl: profilePhoto } : {}),
      ...(baseSalary !== undefined ? {
        salaryStructure: {
          upsert: {
            create: { monthlyWage: Number(baseSalary), yearlyWage: Number(baseSalary) * 12 },
            update: { monthlyWage: Number(baseSalary), yearlyWage: Number(baseSalary) * 12 }
          }
        }
      } : {}),
    },
    include: { privateInfo: true, salaryStructure: true },
  });

  res.json(userToEmployee(updated));
});

app.delete('/api/employees/:id', requireAdmin, async (req: Request, res: Response) => {
  // "Deactivate" by deleting (or you could soft delete)
  const user = await prisma.user.findFirst({ where: { employeeId: req.params.id } });
  if (user) {
    await prisma.user.delete({ where: { id: user.id } });
  }
  res.json({ message: 'Employee deactivated successfully' });
});


// ================= ATTENDANCE (ADMIN - from DB / Store fallback) =================
app.get('/api/attendance', async (req: Request, res: Response) => {
  const { date, status, employeeId } = req.query;

  try {
    const where: any = {};
    if (date) where.date = new Date(date as string);
    if (status) { const sm: Record<string, string> = { Present: 'PRESENT', Absent: 'ABSENT', 'Half Day': 'HALF_DAY', 'On Leave': 'LEAVE' }; where.status = sm[status as string] || status; }
    if (employeeId) { const u = await prisma.user.findFirst({ where: { employeeId: employeeId as string } }); if (u) where.userId = u.id; }
    const records = await prisma.attendance.findMany({ where, include: { user: true }, orderBy: { date: 'desc' } });
    const result = records.map(a => ({
      id: a.id, employeeId: a.user.employeeId, date: a.date.toISOString().split('T')[0],
      checkIn: a.checkIn ? a.checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--',
      checkOut: a.checkOut ? a.checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--',
      totalHours: Number(a.workHours) > 0 ? `${Math.floor(Number(a.workHours))}h ${Math.round((Number(a.workHours) % 1) * 60)}m` : '--',
      status: a.status === 'PRESENT' ? 'Present' : a.status === 'HALF_DAY' ? 'Half Day' : a.status === 'LEAVE' ? 'On Leave' : 'Absent',
      location: a.user.location || 'Office', employeeName: a.user.fullName, department: a.user.department || 'Unknown',
    }));
    res.json(result);
  } catch {
    // Store fallback
    let list = [...store.attendance];
    if (date) list = list.filter(a => a.date === date);
    if (status && status !== 'All') list = list.filter(a => a.status === status);
    if (employeeId) list = list.filter(a => a.employeeId === employeeId);
    const result = list.map(a => {
      const emp = store.employees.find(e => e.id === a.employeeId);
      const dept = emp ? store.departments.find(d => d.id === emp.departmentId) : null;
      return { ...a, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown', department: dept?.name || 'Unknown' };
    });
    res.json(result);
  }
});

app.post('/api/attendance', async (req: Request, res: Response) => {
  const { employeeId, date, checkIn, checkOut, status } = req.body;
  if (!employeeId || !date || !checkIn) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const user = await prisma.user.findFirst({ where: { employeeId } });
  if (!user) return res.status(404).json({ error: 'Employee not found' });

  const statusMap: Record<string, AttendanceStatus> = {
    Present: AttendanceStatus.PRESENT,
    Absent: AttendanceStatus.ABSENT,
    'Half Day': AttendanceStatus.HALF_DAY,
    'On Leave': AttendanceStatus.LEAVE,
    Late: AttendanceStatus.PRESENT,
  };

  let workHours = 0;
  let extraHours = 0;
  let tTotalHours = '--';
  const cIn = new Date(`${date}T${checkIn}`);
  const cOut = checkOut ? new Date(`${date}T${checkOut}`) : null;
  
  if (cOut) {
    let ms = cOut.getTime() - cIn.getTime();
    if (ms < 0) ms += 24 * 60 * 60 * 1000; // handle overnight
    const hrs = ms / (1000 * 60 * 60);
    if (hrs > 8) {
      workHours = 8;
      extraHours = parseFloat((hrs - 8).toFixed(2));
    } else {
      workHours = parseFloat(hrs.toFixed(2));
    }
    const h = Math.floor(hrs);
    const m = Math.round((hrs % 1) * 60);
    tTotalHours = `${h}h ${String(m).padStart(2, '0')}m`;
  }

  const record = await prisma.attendance.create({
    data: {
      userId: user.id,
      date: new Date(date),
      checkIn: cIn,
      checkOut: cOut,
      status: statusMap[status] || AttendanceStatus.PRESENT,
      workHours,
      extraHours,
    },
  });

  res.json({
    id: record.id,
    employeeId,
    date,
    checkIn,
    checkOut: checkOut || '',
    totalHours: tTotalHours,
    status: status || 'Present',
    location: user.location || 'Office',
  });
});

app.get('/api/attendance/today', async (req: Request, res: Response) => {
  if (!activeSessionUser) return res.status(401).json({ error: 'Unauthorized' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  try {
    const record = await prisma.attendance.findFirst({
      where: {
        userId: activeSessionUser.id,
        date: { gte: today, lt: tomorrow },
      },
    });
    res.json({ record });
  } catch {
    const empId = activeSessionUser.employeeId || 'EMP001';
    const todayStr = new Date().toISOString().split('T')[0];
    const record = store.attendance.find(a => a.employeeId === empId && a.date === todayStr);
    res.json({ record: record ? { id: record.id, date: record.date, checkIn: record.checkIn, checkOut: record.checkOut, status: record.status } : null });
  }
});

app.post('/api/attendance/mark', async (req: Request, res: Response) => {
  if (!activeSessionUser) return res.status(401).json({ error: 'Unauthorized' });
  const { type, location } = req.body; // type = 'checkin' or 'checkout'
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  try {
    let record = await prisma.attendance.findFirst({
      where: { userId: activeSessionUser.id, date: { gte: today, lt: tomorrow } },
    });

    if (type === 'checkin') {
      if (record) return res.status(400).json({ error: 'Already checked in today' });
      record = await prisma.attendance.create({
        data: {
          userId: activeSessionUser.id,
          date: new Date(),
          checkIn: new Date(),
          status: AttendanceStatus.PRESENT,
        },
      });
    } else if (type === 'checkout') {
      if (!record) return res.status(400).json({ error: 'Not checked in yet' });
      if (record.checkOut) return res.status(400).json({ error: 'Already checked out today' });
      
      const cOut = new Date();
      let ms = cOut.getTime() - record.checkIn!.getTime();
      if (ms < 0) ms += 24 * 60 * 60 * 1000;
      const hrs = ms / (1000 * 60 * 60);
      
      let workHours = 0;
      let extraHours = 0;
      if (hrs > 8) {
        workHours = 8;
        extraHours = parseFloat((hrs - 8).toFixed(2));
      } else {
        workHours = parseFloat(hrs.toFixed(2));
      }

      record = await prisma.attendance.update({
        where: { id: record.id },
        data: {
          checkOut: cOut,
          workHours,
          extraHours,
        },
      });
    }

    res.json({ message: `Successfully ${type}ed`, record });
  } catch {
    // Store fallback
    const empId = activeSessionUser.employeeId || 'EMP001';
    const todayStr = new Date().toISOString().split('T')[0];
    let recordIdx = store.attendance.findIndex(a => a.employeeId === empId && a.date === todayStr);

    if (type === 'checkin') {
      if (recordIdx !== -1) return res.status(400).json({ error: 'Already checked in today' });
      const newAtt: store.Attendance = {
        id: `ATT-${Date.now()}`,
        employeeId: empId,
        date: todayStr,
        checkIn: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        checkOut: '',
        totalHours: '--',
        status: 'Present',
        location: location || 'Office',
      };
      store.attendance.push(newAtt);
      return res.json({ message: `Successfully checked in`, record: newAtt });
    } else if (type === 'checkout') {
      if (recordIdx === -1) return res.status(400).json({ error: 'Not checked in yet' });
      const record = store.attendance[recordIdx];
      if (record.checkOut && record.checkOut !== '--' && record.checkOut !== '') {
        return res.status(400).json({ error: 'Already checked out today' });
      }
      record.checkOut = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      record.totalHours = '8h 00m';
      return res.json({ message: `Successfully checked out`, record });
    }
  }
});

app.put('/api/attendance/:id', requireAdmin, async (req: Request, res: Response) => {
  const record = await prisma.attendance.findUnique({ where: { id: req.params.id } });
  if (!record) return res.status(404).json({ error: 'Attendance record not found' });

  const updated = await prisma.attendance.update({
    where: { id: req.params.id },
    data: req.body,
    include: { user: true },
  });

  res.json(updated);
});


// ================= ATTENDANCE REGULARIZATION (Store-based, no Prisma) =================

// Employee submits a correction request (store-based)
app.post('/api/attendance/regularization', (req: Request, res: Response) => {
  const { date, requestedStatus, reason } = req.body;
  if (!date || !requestedStatus || !reason) return res.status(400).json({ error: 'date, requestedStatus and reason are required' });
  if (!activeSessionUser) return res.status(401).json({ error: 'Unauthorized' });

  const empId = activeSessionUser.employeeId;
  const existing = store.attendance.find(a => a.employeeId === empId && a.date === date);
  const currentStatus = existing ? existing.status : 'Absent';

  const correction: store.AttendanceCorrection = {
    id: `CORR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    employeeId: empId,
    date,
    currentStatus,
    requestedStatus,
    reason,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.attendanceCorrections.push(correction);

  const emp = store.employees.find(e => e.id === empId);
  res.json({ ...correction, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : empId });
});

// Get regularization requests (employee sees own; HR sees all)
app.get('/api/attendance/regularization', (req: Request, res: Response) => {
  if (!activeSessionUser) return res.status(401).json({ error: 'Unauthorized' });
  const isHR = activeSessionUser.role === 'HR' || activeSessionUser.role === 'HR_ADMIN';
  let list = isHR
    ? [...store.attendanceCorrections]
    : store.attendanceCorrections.filter(c => c.employeeId === activeSessionUser.employeeId);
  if (req.query.status && req.query.status !== 'ALL') list = list.filter(c => c.status === req.query.status);
  const result = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(c => {
    const emp = store.employees.find(e => e.id === c.employeeId);
    const dept = emp ? store.departments.find(d => d.id === emp.departmentId) : null;
    return { ...c, employeeName: emp ? `${emp.firstName} ${emp.lastName}` : c.employeeId, department: dept?.name || 'Unknown' };
  });
  res.json(result);
});

// HR approves a regularization request
app.post('/api/attendance/regularization/:id/approve', (req: Request, res: Response) => {
  if (!activeSessionUser || (activeSessionUser.role !== 'HR' && activeSessionUser.role !== 'HR_ADMIN')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const idx = store.attendanceCorrections.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (store.attendanceCorrections[idx].status !== 'PENDING') return res.status(400).json({ error: 'Not pending' });

  store.attendanceCorrections[idx].status = 'APPROVED';
  store.attendanceCorrections[idx].adminComment = req.body.comment || undefined;
  store.attendanceCorrections[idx].updatedAt = new Date().toISOString();

  const correction = store.attendanceCorrections[idx];
  // Update or insert attendance record in store
  const existingIdx = store.attendance.findIndex(a => a.employeeId === correction.employeeId && a.date === correction.date);
  const newAtt: store.Attendance = {
    id: `ATT-CORR-${Date.now()}`,
    employeeId: correction.employeeId,
    date: correction.date,
    checkIn: correction.requestedStatus !== 'Absent' ? '09:00 AM' : '--',
    checkOut: correction.requestedStatus !== 'Absent' ? '06:00 PM' : '--',
    totalHours: correction.requestedStatus === 'Present' ? '9h 00m' : correction.requestedStatus === 'Half Day' ? '4h 30m' : '--',
    status: correction.requestedStatus as any,
    location: 'Office',
  };
  if (existingIdx >= 0) store.attendance[existingIdx] = newAtt;
  else store.attendance.push(newAtt);

  res.json({ success: true, correction: store.attendanceCorrections[idx] });
});

// HR rejects a regularization request
app.post('/api/attendance/regularization/:id/reject', (req: Request, res: Response) => {
  if (!activeSessionUser || (activeSessionUser.role !== 'HR' && activeSessionUser.role !== 'HR_ADMIN')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const idx = store.attendanceCorrections.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  store.attendanceCorrections[idx].status = 'REJECTED';
  store.attendanceCorrections[idx].adminComment = req.body.comment || undefined;
  store.attendanceCorrections[idx].updatedAt = new Date().toISOString();
  res.json({ success: true, correction: store.attendanceCorrections[idx] });
});

// ================= LEAVES (ADMIN - from DB) =================
app.get('/api/leaves', async (req: Request, res: Response) => {
  const leaves = await prisma.leaveRequest.findMany({
    include: { user: true },
    orderBy: { appliedOn: 'desc' },
  });

  const leaveTypeMap: Record<string, string> = {
    PAID_TIME_OFF: 'Paid Time Off', SICK_LEAVE: 'Sick Leave',
    UNPAID_LEAVE: 'Unpaid Leave', COMP_OFF: 'Casual Leave',
  };

  const result = leaves.map(l => ({
    id: l.id,
    employeeId: l.user.employeeId,
    leaveType: leaveTypeMap[l.type] || l.type,
    startDate: l.startDate.toISOString().split('T')[0],
    endDate: l.endDate.toISOString().split('T')[0],
    duration: Number(l.days),
    reason: l.reason,
    status: l.status === 'PENDING' ? 'Pending' : l.status === 'APPROVED' ? 'Approved' : 'Rejected',
    appliedAt: l.appliedOn.toISOString().split('T')[0],
    employeeName: l.user.fullName,
    role: l.user.jobTitle || 'Unknown',
    avatar: l.user.avatarUrl || 'https://i.pravatar.cc/150',
    department: l.user.department || 'Unknown',
  }));

  res.json(result);
});

app.post('/api/leaves', async (req: Request, res: Response) => {
  const { employeeId, leaveType, startDate, endDate, duration, reason } = req.body;
  if (!employeeId || !leaveType || !startDate || !endDate || !duration || !reason) {
    return res.status(400).json({ error: 'Missing leave details' });
  }

  const user = await prisma.user.findFirst({ where: { employeeId } });
  if (!user) return res.status(404).json({ error: 'Employee not found' });

  const typeMap: Record<string, LeaveType> = {
    'Paid Time Off': LeaveType.PAID_TIME_OFF,
    'Sick Leave': LeaveType.SICK_LEAVE,
    'Unpaid Leave': LeaveType.UNPAID_LEAVE,
    'Casual Leave': LeaveType.COMP_OFF,
  };

  const leave = await prisma.leaveRequest.create({
    data: {
      userId: user.id,
      type: typeMap[leaveType] || LeaveType.PAID_TIME_OFF,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      days: parseInt(duration),
      reason,
      status: LeaveStatus.PENDING,
    },
  });

  // Notify admin
  if (activeSessionUser) {
    await prisma.notification.create({
      data: {
        userId: activeSessionUser.id,
        type: 'LEAVE',
        title: 'New Leave Request',
        message: `${user.fullName} applied for ${leaveType} (${duration} days)`,
      },
    });
  }

  const leaveTypeMapReverse: Record<string, string> = {
    PAID_TIME_OFF: 'Paid Time Off', SICK_LEAVE: 'Sick Leave',
    UNPAID_LEAVE: 'Unpaid Leave', COMP_OFF: 'Casual Leave',
  };

  res.json({
    id: leave.id,
    employeeId,
    leaveType: leaveTypeMapReverse[leave.type] || leave.type,
    startDate,
    endDate,
    duration: parseInt(duration),
    reason,
    status: 'Pending',
    appliedAt: leave.appliedOn.toISOString().split('T')[0],
  });
});

app.put('/api/leaves/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  const { comment } = req.body;
  try {
    const leave = await prisma.leaveRequest.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    const updated = await prisma.leaveRequest.update({ where: { id: req.params.id }, data: { status: LeaveStatus.APPROVED, adminComment: comment || null } });
    await prisma.leaveBalance.updateMany({ where: { userId: leave.userId, type: leave.type, year: new Date().getFullYear() }, data: { usedDays: { increment: Number(leave.days) } } }).catch(() => {});
    const start = new Date(leave.startDate); const end = new Date(leave.endDate); const current = new Date(start);
    while (current <= end) { await prisma.attendance.upsert({ where: { userId_date: { userId: leave.userId, date: new Date(current) } }, update: { status: AttendanceStatus.LEAVE }, create: { userId: leave.userId, date: new Date(current), status: AttendanceStatus.LEAVE, workHours: 0 } }).catch(() => {}); current.setDate(current.getDate() + 1); }
    await prisma.notification.create({ data: { userId: leave.userId, type: 'LEAVE', title: 'Leave Request Approved', message: `Your leave request was approved.${comment ? ' Comment: ' + comment : ''}` } }).catch(() => {});
    const leaveTypeMap: Record<string, string> = { PAID_TIME_OFF: 'Paid Time Off', SICK_LEAVE: 'Sick Leave', UNPAID_LEAVE: 'Unpaid Leave', COMP_OFF: 'Casual Leave' };
    res.json({ id: updated.id, employeeId: leave.user.employeeId, leaveType: leaveTypeMap[updated.type] || updated.type, startDate: updated.startDate.toISOString().split('T')[0], endDate: updated.endDate.toISOString().split('T')[0], duration: Number(updated.days), reason: updated.reason, status: 'Approved', appliedAt: updated.appliedOn.toISOString().split('T')[0] });
  } catch {
    // Store fallback
    const leave = store.leaveRequests.find(l => l.id === req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    leave.status = 'Approved'; leave.reviewedAt = new Date().toISOString(); leave.reviewedBy = 'HR';
    res.json({ ...leave, status: 'Approved' });
  }
});

app.put('/api/leaves/:id/reject', requireAdmin, async (req: Request, res: Response) => {
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ error: 'Rejection reason is required' });
  try {
    const leave = await prisma.leaveRequest.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    const updated = await prisma.leaveRequest.update({ where: { id: req.params.id }, data: { status: LeaveStatus.REJECTED, adminComment: comment } });
    await prisma.notification.create({ data: { userId: leave.userId, type: 'LEAVE', title: 'Leave Request Rejected', message: `Your leave request was rejected. Reason: ${comment}` } }).catch(() => {});
    const leaveTypeMap: Record<string, string> = { PAID_TIME_OFF: 'Paid Time Off', SICK_LEAVE: 'Sick Leave', UNPAID_LEAVE: 'Unpaid Leave', COMP_OFF: 'Casual Leave' };
    res.json({ id: updated.id, employeeId: leave.user.employeeId, leaveType: leaveTypeMap[updated.type] || updated.type, startDate: updated.startDate.toISOString().split('T')[0], endDate: updated.endDate.toISOString().split('T')[0], duration: Number(updated.days), reason: updated.reason, status: 'Rejected', rejectionReason: comment, appliedAt: updated.appliedOn.toISOString().split('T')[0] });
  } catch {
    const leave = store.leaveRequests.find(l => l.id === req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    leave.status = 'Rejected'; leave.rejectionReason = comment; leave.reviewedAt = new Date().toISOString();
    res.json({ ...leave, status: 'Rejected', rejectionReason: comment });
  }
});


// ================= PAYROLL (ADMIN - from DB) =================
app.get('/api/payroll', async (req: Request, res: Response) => {
  const { month } = req.query;
  const isAdmin = activeSessionUser && (activeSessionUser.role === 'HR_ADMIN' || activeSessionUser.role === 'HR');

  if (isAdmin) {
    try {
      const where: any = {};
      if (month) { const [y, m] = (month as string).split('-'); where.year = parseInt(y); where.month = parseInt(m); }
      const payrolls = await prisma.payroll.findMany({ where, include: { user: true, items: true }, orderBy: { createdAt: 'desc' } });
      const result = payrolls.map(p => ({
        id: p.id,
        employeeId: p.user.employeeId,
        payrollMonth: `${p.year}-${String(p.month).padStart(2, '0')}`,
        basicSalary: Number(p.grossSalary),
        allowances: p.items.filter(i => i.category === 'EARNING' && i.name !== 'Basic Salary' && i.name !== 'Overtime Pay' && i.name !== 'Bonus').reduce((sum, i) => sum + Number(i.amount), 0),
        bonus: Number(p.items.find(i => i.name === 'Bonus')?.amount || 0),
        overtime: Number(p.items.find(i => i.name === 'Overtime Pay')?.amount || 0),
        grossSalary: Number(p.grossSalary),
        tax: Number(p.items.find(i => i.name.toLowerCase().includes('tax'))?.amount || 0),
        pf: Number(p.items.find(i => i.name.toLowerCase().includes('pf') || i.name.toLowerCase().includes('provident'))?.amount || 0),
        otherDeductions: p.items.filter(i => i.category === 'DEDUCTION' && !i.name.toLowerCase().includes('tax') && !i.name.toLowerCase().includes('pf') && !i.name.toLowerCase().includes('provident')).reduce((sum, i) => sum + Number(i.amount), 0),
        totalDeductions: Number(p.totalDeductions),
        netSalary: Number(p.netSalary),
        status: p.paidOn ? 'Approved' : 'Draft',
        employeeName: p.user.fullName,
        department: p.user.department || 'Unknown'
      }));
      return res.json(result);
    } catch {
      // Store fallback - generate payroll from employees
      const list = store.employees.map(emp => {
        const gross = emp.baseSalary || 4500;
        const pf = Math.round(gross * 0.08);
        const tax = Math.round(gross * 0.12);
        const deductions = pf + tax;
        return { id: `PAY-${emp.id}`, employeeId: emp.employeeId, payrollMonth: month || new Date().toISOString().slice(0,7), basicSalary: gross, allowances: emp.allowances || 0, bonus: 0, overtime: 0, grossSalary: gross, tax, pf, otherDeductions: 0, totalDeductions: deductions, netSalary: gross - deductions, status: 'Draft', employeeName: `${emp.firstName} ${emp.lastName}` };
      });
      return res.json(list);
    }
  }

  // Employee mode
  try {
    const empId = activeSessionUser ? activeSessionUser.employeeId : 'EMP001';
    const user = await prisma.user.findFirst({
      where: { employeeId: empId },
      include: {
        salaryStructure: { include: { components: true } },
        payrolls: { include: { items: true }, orderBy: { year: 'desc' } },
      },
    });

    if (!user) throw new Error('not found');

    const salary = user.salaryStructure;
    const basicVal = salary ? Number(salary.monthlyWage) : 4500;
    const allowancesVal = 0;
    const gross = basicVal + allowancesVal;
    const pfVal = Math.round(basicVal * 0.08);
    const taxVal = Math.round(gross * 0.12);
    const totalDeductions = pfVal + taxVal;
    const netSalary = gross - totalDeductions;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const currentPayload = {
      month: 'July 2026',
      paidOn: '30 Jul 2026',
      netSalary: `₹${netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      earnings: {
        total: `₹${gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        basic: `₹${basicVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        house: `₹${Math.round(basicVal * 0.25).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        conveyance: `₹${Math.round(basicVal * 0.10).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        other: '₹0.00',
      },
      deductions: {
        total: `₹${totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        providentFund: `₹${pfVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        professionalTax: '₹200.00',
        incomeTax: `₹${taxVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        other: '₹0.00',
      },
    };

    const historyList = user.payrolls.map(p => {
      const pGross = Number(p.grossSalary);
      const pTotalDed = Number(p.totalDeductions);
      const pNet = Number(p.netSalary);
      
      // Summing earnings from items
      const earningsItems = p.items.filter(i => i.category === 'EARNING');
      const basicEarn = earningsItems.find(i => i.name === 'Basic Salary')?.amount || (pGross * 0.5); // Fallback if no items
      const otherEarn = earningsItems.filter(i => i.name !== 'Basic Salary').reduce((s, i) => s + Number(i.amount), 0) || (pGross * 0.5);
      
      // Summing deductions from items
      const dedItems = p.items.filter(i => i.category === 'DEDUCTION');
      const pfDed = dedItems.find(i => i.name.toLowerCase().includes('pf') || i.name.toLowerCase().includes('provident'))?.amount || (pTotalDed * 0.4);
      const taxDed = dedItems.find(i => i.name.toLowerCase().includes('tax'))?.amount || (pTotalDed * 0.6);
      
      return {
        month: `${monthNames[p.month - 1]?.slice(0, 3)} ${p.year}`,
        paidOn: p.paidOn ? new Date(p.paidOn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending',
        amount: `₹${pNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        netSalary: `₹${pNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        earnings: {
          total: `₹${pGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          basic: `₹${Number(basicEarn).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          other: `₹${Number(otherEarn).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        },
        deductions: {
          total: `₹${pTotalDed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          providentFund: `₹${Number(pfDed).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          incomeTax: `₹${Number(taxDed).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          other: '₹0.00',
        }
      };
    });

    if (historyList.length === 0) {
      historyList.push({ 
        month: 'Jul 2026', 
        amount: `₹${netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        ...currentPayload
      });
    }

    res.json({ current: currentPayload, history: historyList });
  } catch {
    // Store fallback for employee payroll view
    const empId = activeSessionUser ? activeSessionUser.employeeId : 'EMP001';
    const emp = store.employees.find(e => e.id === empId);
    const basicVal = emp?.baseSalary || 4500;
    const gross = basicVal;
    const pfVal = Math.round(basicVal * 0.08);
    const taxVal = Math.round(gross * 0.12);
    const totalDeductions = pfVal + taxVal;
    const netSalary = gross - totalDeductions;
    const currentPayload = {
      month: 'July 2026',
      paidOn: '30 Jul 2026',
      netSalary: `₹${netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      earnings: {
        total: `₹${gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        basic: `₹${basicVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        house: `₹${Math.round(basicVal * 0.25).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        conveyance: `₹${Math.round(basicVal * 0.10).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        other: '₹0.00',
      },
      deductions: {
        total: `₹${totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        providentFund: `₹${pfVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        professionalTax: '₹200.00',
        incomeTax: `₹${taxVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        other: '₹0.00',
      },
    };
    const historyList: any[] = [];
    if (historyList.length === 0) {
      historyList.push({ month: 'Jul 2026', amount: `₹${netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, ...currentPayload });
    }
    res.json({ current: currentPayload, history: historyList });
  }
});

app.post('/api/payroll/generate', requireAdmin, async (req: Request, res: Response) => {
  const { month } = req.body;
  if (!month) return res.status(400).json({ error: 'Payroll month is required (YYYY-MM)' });

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr);
  const monthNum = parseInt(monthStr);

  const users = await prisma.user.findMany({
    include: { 
      salaryStructure: { include: { components: true } },
      attendance: {
        where: {
          date: {
            gte: new Date(year, monthNum - 1, 1),
            lt: new Date(year, monthNum, 1),
          }
        }
      }
    },
  });

  const generated: any[] = [];

  for (const user of users) {
    // Skip if already exists
    const existing = await prisma.payroll.findUnique({
      where: { userId_month_year: { userId: user.id, month: monthNum, year } },
    });
    if (existing) continue;

    const salary = user.salaryStructure;
    const basicSalary = salary ? Number(salary.monthlyWage) : 4000;
    const earnings = salary?.components.filter(c => c.category === 'EARNING') || [];
    const deductions = salary?.components.filter(c => c.category === 'DEDUCTION') || [];

    // Calculate Overtime
    const totalExtraHours = user.attendance.reduce((sum, a) => sum + Number(a.extraHours), 0);
    const hourlyRate = basicSalary / 160; // Assuming 160 working hours a month
    const overtimePay = Math.round(totalExtraHours * hourlyRate * 1.5); // 1.5x overtime rate

    const baseEarnings = earnings.reduce((sum, c) => sum + Number(c.calculatedAmount), 0) || basicSalary;
    const grossSalary = baseEarnings + overtimePay;
    const totalDeductions = deductions.reduce((sum, c) => sum + Number(c.calculatedAmount), 0) || Math.round(basicSalary * 0.2);
    const netSalary = grossSalary - totalDeductions;

    const payroll = await prisma.payroll.create({
      data: {
        userId: user.id,
        month: monthNum,
        year,
        grossSalary,
        totalDeductions,
        netSalary,
        items: {
          create: [
            ...earnings.map(c => ({ name: c.name, category: 'EARNING' as const, amount: Number(c.calculatedAmount) })),
            ...(overtimePay > 0 ? [{ name: 'Overtime Pay', category: 'EARNING' as const, amount: overtimePay }] : []),
            ...deductions.map(c => ({ name: c.name, category: 'DEDUCTION' as const, amount: Number(c.calculatedAmount) })),
          ],
        },
      },
    });

    generated.push(payroll);
  }

  if (activeSessionUser) {
    await prisma.notification.create({
      data: {
        userId: activeSessionUser.id,
        type: 'PAYROLL',
        title: 'Payroll Generated',
        message: `Payroll draft for ${month} generated for ${generated.length} employees.`,
      },
    });
  }

  res.json({ message: `Successfully generated payroll for ${generated.length} employees.`, generated });
});

app.put('/api/payroll/:id', requireAdmin, async (req: Request, res: Response) => {
  const payroll = await prisma.payroll.findUnique({ where: { id: req.params.id } });
  if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });

  const { grossSalary, totalDeductions, netSalary, status } = req.body;

  const updated = await prisma.payroll.update({
    where: { id: req.params.id },
    data: {
      ...(grossSalary !== undefined ? { grossSalary: parseFloat(grossSalary) } : {}),
      ...(totalDeductions !== undefined ? { totalDeductions: parseFloat(totalDeductions) } : {}),
      ...(netSalary !== undefined ? { netSalary: parseFloat(netSalary) } : {}),
      ...(status === 'Approved' ? { paidOn: new Date() } : {}),
    },
  });

  res.json(updated);
});

app.put('/api/payroll/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  const payroll = await prisma.payroll.findUnique({ where: { id: req.params.id }, include: { user: true } });
  if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });

  const updated = await prisma.payroll.update({
    where: { id: req.params.id },
    data: { paidOn: new Date() },
  });

  await prisma.notification.create({
    data: {
      userId: payroll.userId,
      type: 'PAYROLL',
      title: 'Payslip Available',
      message: `Your payslip for ${payroll.year}-${String(payroll.month).padStart(2, '0')} is ready. Net: ₹${Number(payroll.netSalary).toLocaleString('en-IN')}`,
    },
  });

  res.json({
    ...updated,
    status: 'Approved',
    employeeId: payroll.user.employeeId,
    payrollMonth: `${payroll.year}-${String(payroll.month).padStart(2, '0')}`,
  });
});


// ================= REPORTS (ADMIN - from DB) =================
app.get('/api/reports/overview', async (req: Request, res: Response) => {
  try {
    const totalEmployees = await prisma.user.count();
    const attendance = await prisma.attendance.findMany();
    const uniqueDays = [...new Set(attendance.map(a => a.date.toISOString().split('T')[0]))];
    let attendanceSum = 0;
    uniqueDays.forEach(d => { const present = attendance.filter(a => a.date.toISOString().split('T')[0] === d && (a.status === 'PRESENT' || a.status === 'HALF_DAY')).length; attendanceSum += (present / totalEmployees) * 100; });
    const avgAttendance = uniqueDays.length > 0 ? Math.round(attendanceSum / uniqueDays.length) : 95;
    const approvedLeaves = await prisma.leaveRequest.findMany({ where: { status: 'APPROVED' } });
    const totalLeaves = approvedLeaves.reduce((sum, l) => sum + Number(l.days), 0);
    const payrolls = await prisma.payroll.findMany({ where: { month: 7, year: 2026 } });
    const payrollCost = payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0);
    res.json({ kpis: { totalEmployees, avgAttendance: `${avgAttendance}%`, totalLeaves, payrollThisMonth: `₹${payrollCost.toLocaleString('en-IN')}`, overtimeHours: '32h 15m' } });
  } catch {
    const totalEmployees = store.employees.filter(e => e.status !== 'Inactive').length;
    const totalLeaves = store.leaveRequests.filter(l => l.status === 'Approved').length;
    const payrollCost = store.employees.reduce((sum, e) => sum + (e.baseSalary || 4500), 0);
    res.json({ kpis: { totalEmployees, avgAttendance: '94%', totalLeaves, payrollThisMonth: `₹${payrollCost.toLocaleString('en-IN')}`, overtimeHours: '32h 15m' } });
  }
});

app.get('/api/reports/attendance', async (req: Request, res: Response) => {
  try {
    const totalEmployees = await prisma.user.count();
    const attendance = await prisma.attendance.findMany({ orderBy: { date: 'asc' } });
    const uniqueDays = [...new Set(attendance.map(a => a.date.toISOString().split('T')[0]))].sort().slice(-5);
    const trend = uniqueDays.map(d => { const present = attendance.filter(a => a.date.toISOString().split('T')[0] === d && (a.status === 'PRESENT' || a.status === 'HALF_DAY')).length; return { name: d.split('-').slice(1).reverse().join(' '), value: Math.round((present / totalEmployees) * 100) }; });
    res.json(trend);
  } catch {
    const days = Object.keys(store.attendance.reduce((acc: any, a) => { acc[a.date] = true; return acc; }, {})).sort().slice(-5);
    const emp = store.employees.filter(e => e.status !== 'Inactive').length;
    const trend = days.map(d => { const present = store.attendance.filter(a => a.date === d && (a.status === 'Present' || a.status === 'Half Day')).length; return { name: d.split('-').slice(1).reverse().join(' '), value: emp > 0 ? Math.round((present / emp) * 100) : 90 }; });
    if (trend.length === 0) trend.push({ name: 'Today', value: 90 });
    res.json(trend);
  }
});

app.get('/api/reports/leaves', async (req: Request, res: Response) => {
  try {
    const approved = await prisma.leaveRequest.findMany({ where: { status: 'APPROVED' } });
    const counts: Record<string, number> = { 'Paid Time Off': 0, 'Sick Leave': 0, 'Unpaid Leave': 0, 'Casual Leave': 0 };
    const typeMap: Record<string, string> = { PAID_TIME_OFF: 'Paid Time Off', SICK_LEAVE: 'Sick Leave', UNPAID_LEAVE: 'Unpaid Leave', COMP_OFF: 'Casual Leave' };
    approved.forEach(l => { const name = typeMap[l.type] || 'Other'; if (counts[name] !== undefined) counts[name] += Number(l.days); });
    res.json(Object.entries(counts).map(([name, value]) => ({ name, value })));
  } catch {
    const counts: Record<string, number> = { 'Paid Time Off': 0, 'Sick Leave': 0, 'Unpaid Leave': 0, 'Casual Leave': 0 };
    store.leaveRequests.filter(l => l.status === 'Approved').forEach(l => { const name = l.leaveType; if (counts[name] !== undefined) counts[name] += l.duration; });
    res.json(Object.entries(counts).map(([name, value]) => ({ name, value })));
  }
});

app.get('/api/reports/payroll', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    const payrolls = await prisma.payroll.findMany({ where: { month: 7, year: 2026 } });
    const departments = [...new Set(users.map(u => u.department).filter(Boolean))];
    const colors = ['#7FAF3F', '#E5A83B', '#E56B65', '#7A70C7', '#67AFA5'];
    const breakdown = departments.map((dept, i) => { const deptUsers = users.filter(u => u.department === dept); const totalPayroll = payrolls.filter(p => deptUsers.some(u => u.id === p.userId)).reduce((sum, p) => sum + Number(p.netSalary), 0); return { name: dept, value: deptUsers.length, payroll: totalPayroll, color: colors[i % colors.length] }; });
    res.json(breakdown);
  } catch {
    const colors = ['#7FAF3F', '#E5A83B', '#E56B65', '#7A70C7', '#67AFA5'];
    const deptMap: Record<string, any> = {};
    store.employees.forEach(e => { const dept = store.departments.find(d => d.id === e.departmentId)?.name || 'Unknown'; if (!deptMap[dept]) deptMap[dept] = { name: dept, value: 0, payroll: 0 }; deptMap[dept].value++; deptMap[dept].payroll += (e.baseSalary || 4500) * 0.8; });
    res.json(Object.values(deptMap).map((d, i) => ({ ...d, color: colors[i % colors.length] })));
  }
});


// ================= NOTIFICATIONS (from DB) =================
app.get('/api/user-alerts', async (req: Request, res: Response) => {
  if (!activeSessionUser) return res.json({ list: [], unread: 0 });
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: activeSessionUser.id },
      orderBy: { createdAt: 'desc' },
    });
    const list = notifications.map(n => ({ id: n.id, userId: activeSessionUser.id, title: n.title, message: n.message, type: n.type.toLowerCase(), isRead: n.isRead, createdAt: n.createdAt.toISOString() }));
    res.json({ list, unread: list.filter(n => !n.isRead).length });
  } catch {
    // Store fallback
    const userId = activeSessionUser.id;
    const list = store.notifications.filter(n => n.userId === userId || n.userId === 'U1').slice(0, 20);
    res.json({ list, unread: list.filter(n => !n.isRead).length });
  }
});

app.put('/api/user-alerts/:id/read', async (req: Request, res: Response) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  } catch {
    const n = store.notifications.find(n => n.id === req.params.id);
    if (n) n.isRead = true;
  }
  res.json({ success: true });
});

app.put('/api/user-alerts/read-all', async (req: Request, res: Response) => {
  if (!activeSessionUser) return res.json({ success: false });
  try {
    await prisma.notification.updateMany({ where: { userId: activeSessionUser.id }, data: { isRead: true } });
  } catch {
    store.notifications.forEach(n => { if (n.userId === activeSessionUser.id || n.userId === 'U1') n.isRead = true; });
  }
  res.json({ success: true });
});


// ================= MESSAGES (kept in-memory) =================
app.get('/api/messages', (req: Request, res: Response) => {
  const result = store.messages.map(m => {
    const sender = store.employees.find(e => e.id === m.senderId);
    return {
      ...m,
      senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'System',
      senderAvatar: sender ? sender.profilePhoto : 'https://i.pravatar.cc/150',
    };
  });
  const unreadCount = store.messages.filter(m => !m.isRead && m.receiverId === 'EMP001').length;
  res.json({ list: result, unreadCount });
});

app.post('/api/messages', (req: Request, res: Response) => {
  const { receiverId, message } = req.body;
  if (!receiverId || !message) return res.status(400).json({ error: 'Missing parameters' });

  const newMsg: store.Message = {
    id: `MSG${store.messages.length + 1}`,
    senderId: activeSessionUser?.employeeId || 'EMP001',
    receiverId,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
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


// ================= SETTINGS (kept in-memory) =================
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({
    company: store.companySettings,
    departments: store.departments,
    designations: store.designations,
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


// ================= TOUR EXPENSE REIMBURSEMENT (kept using db.ts JSON) =================
app.post('/api/reimbursements', (req: Request, res: Response) => {
  const {
    employeeId, employeeName, employeeDepartment,
    tourTitle, destination, startDate, endDate, purpose, categories,
  } = req.body;

  if (!tourTitle || !destination || !startDate || !endDate || !categories || categories.length === 0) {
    return res.status(400).json({ error: 'Missing required tour or category receipts details.' });
  }

  let totalClaimed = 0;
  categories.forEach((cat: any) => {
    cat.bills.forEach((bill: any) => { totalClaimed += Number(bill.amount || 0); });
  });

  const claimId = `CLM-${Date.now()}`;
  const newClaim: ExpenseClaim = {
    id: claimId,
    employee_id: employeeId || (activeSessionUser ? activeSessionUser.employeeId : 'EMP001'),
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
    payroll_added: false,
  };

  db.saveClaim(newClaim);

  categories.forEach((cat: any) => {
    const catId = `CAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    let catTotal = 0;
    cat.bills.forEach((bill: any) => { catTotal += Number(bill.amount || 0); });

    const newCategory: ExpenseCategory = {
      id: catId,
      expense_claim_id: claimId,
      category_name: cat.name,
      employee_category_total: catTotal,
      hr_category_total: 0,
      review_status: 'pending',
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
        created_at: new Date().toISOString(),
      };
      db.saveBill(newBill);
    });
  });

  res.json({ success: true, claimId });
});

app.get('/api/reimbursements', (req: Request, res: Response) => {
  const empId = activeSessionUser ? activeSessionUser.employeeId : 'EMP001';
  res.json(db.getClaimsByEmployee(empId));
});

app.get('/api/admin/reimbursements', requireAdmin, (req: Request, res: Response) => {
  res.json(db.getClaims());
});

app.get('/api/reimbursements/:id', (req: Request, res: Response) => {
  const claim = db.getClaimById(req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim record not found.' });
  const categories = db.getCategoriesByClaim(claim.id);
  const bills = db.getBillsByClaim(claim.id);
  res.json({ claim, categories, bills });
});

app.put('/api/admin/reimbursements/:id/category', requireAdmin, (req: Request, res: Response) => {
  const { categoryId, bills: billUpdates } = req.body;
  if (!categoryId || !billUpdates || !Array.isArray(billUpdates)) {
    return res.status(400).json({ error: 'Missing category updates.' });
  }

  let hrCategoryTotal = 0;
  billUpdates.forEach((u: any) => {
    const dbBill = db.getBillsByClaim(req.params.id).find(b => b.id === u.id);
    if (dbBill) {
      dbBill.hr_approved_amount = u.hrApprovedAmount === null ? null : Number(u.hrApprovedAmount);
      db.saveBill(dbBill);
      if (dbBill.hr_approved_amount !== null) hrCategoryTotal += dbBill.hr_approved_amount;
    }
  });

  const dbCategory = db.getCategoriesByClaim(req.params.id).find(c => c.id === categoryId);
  if (dbCategory) {
    dbCategory.hr_category_total = hrCategoryTotal;
    dbCategory.review_status = 'reviewed';
    dbCategory.reviewed_at = new Date().toISOString();
    db.saveCategory(dbCategory);
  }

  res.json({ success: true, hrCategoryTotal, reviewStatus: 'reviewed' });
});

app.post('/api/admin/reimbursements/:id/finalize', requireAdmin, (req: Request, res: Response) => {
  const { reason } = req.body;
  const claim = db.getClaimById(req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });

  const categories = db.getCategoriesByClaim(claim.id);
  const bills = db.getBillsByClaim(claim.id);

  const unreviewedCat = categories.some(c => c.review_status !== 'reviewed');
  const unreviewedBill = bills.some(b => b.hr_approved_amount === null);
  if (unreviewedCat || unreviewedBill) {
    return res.status(400).json({ error: 'Please save reviews for all categories before making final decision.' });
  }

  const finalApprovedTotal = categories.reduce((sum, c) => sum + (c.hr_category_total || 0), 0);

  let decision: 'approved' | 'partially_approved' | 'rejected' = 'approved';
  if (finalApprovedTotal === 0) decision = 'rejected';
  else if (finalApprovedTotal < claim.claimed_total) decision = 'partially_approved';

  if (decision !== 'approved' && !reason?.trim()) {
    return res.status(400).json({ error: `Mandatory reason required for ${decision.replace('_', ' ')}.` });
  }

  claim.status = decision;
  claim.approved_total = finalApprovedTotal;
  claim.hr_reason = reason || '';
  claim.reviewed_at = new Date().toISOString();
  claim.reviewed_by = activeSessionUser ? activeSessionUser.employeeId : 'HR001';
  db.saveClaim(claim);

  res.json({ success: true, status: decision, approvedTotal: finalApprovedTotal });
});

app.post('/api/admin/reimbursements/:id/payroll', requireAdmin, (req: Request, res: Response) => {
  const { month, year } = req.body;
  if (!month || !year) return res.status(400).json({ error: 'Month and year are required.' });

  const claim = db.getClaimById(req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });

  if (claim.status === 'pending' || claim.status === 'rejected') {
    return res.status(400).json({ error: 'Reimbursement claim must be approved first.' });
  }

  claim.payroll_added = true;
  claim.payroll_month = month;
  claim.payroll_year = year;
  claim.payroll_entry_id = `PAY-ENT-${Date.now()}`;
  db.saveClaim(claim);

  res.json({ success: true, message: `Successfully linked reimbursement to ${month} ${year} payslip.` });
});




app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port} (PostgreSQL connected)`);
});
