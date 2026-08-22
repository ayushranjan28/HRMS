import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, AttendanceStatus, LeaveStatus, LeaveType } from '@prisma/client';
import { hashSync } from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.$transaction([
    prisma.payrollItem.deleteMany(),
    prisma.payroll.deleteMany(),
    prisma.salaryComponent.deleteMany(),
    prisma.salaryStructure.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.document.deleteMany(),
    prisma.calendarEvent.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.leaveBalance.deleteMany(),
    prisma.leaveRequest.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.privateInfo.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ── Users (combines old Employee + User) ──
  const alex = await prisma.user.create({
    data: {
      employeeId: 'EMP001',
      fullName: 'Alex Martin',
      email: 'alex@dayflow.com',
      passwordHash: hashSync('password', 10),
      role: Role.HR_ADMIN,
      department: 'Design',
      jobTitle: 'UI/UX Designer',
      location: 'Bangalore',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
      privateInfo: {
        create: {
          dateOfBirth: new Date('1992-04-12'),
          residingAddress: '12th Main Road, HSR Layout',
          nationality: 'Indian',
          personalEmail: 'alex.personal@gmail.com',
          gender: 'Male',
          dateOfJoining: new Date('2022-03-01'),
        },
      },
      salaryStructure: {
        create: {
          monthlyWage: 6000,
          yearlyWage: 72000,
          components: {
            create: [
              { name: 'Basic Salary', category: 'EARNING', calculationType: 'FIXED', value: 6000, calculatedAmount: 6000 },
              { name: 'HRA', category: 'EARNING', calculationType: 'PERCENTAGE', calculationBase: 'BASIC', value: 25, calculatedAmount: 1500 },
              { name: 'Allowances', category: 'EARNING', calculationType: 'FIXED', value: 700, calculatedAmount: 700 },
              { name: 'PF', category: 'DEDUCTION', calculationType: 'PERCENTAGE', calculationBase: 'BASIC', value: 8, calculatedAmount: 480 },
              { name: 'Tax', category: 'DEDUCTION', calculationType: 'PERCENTAGE', calculationBase: 'WAGE', value: 12, calculatedAmount: 705 },
            ],
          },
        },
      },
    },
  });

  const jane = await prisma.user.create({
    data: {
      employeeId: 'EMP002',
      fullName: 'Jane Cooper',
      email: 'jane@dayflow.com',
      passwordHash: hashSync('password', 10),
      role: Role.EMPLOYEE,
      department: 'Engineering',
      jobTitle: 'Engineering Lead',
      location: 'Remote',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024f',
      privateInfo: {
        create: {
          dateOfBirth: new Date('1988-08-24'),
          residingAddress: '42 Main St',
          nationality: 'American',
          gender: 'Female',
          dateOfJoining: new Date('2020-01-15'),
        },
      },
      salaryStructure: {
        create: {
          monthlyWage: 8500,
          yearlyWage: 102000,
          components: {
            create: [
              { name: 'Basic Salary', category: 'EARNING', calculationType: 'FIXED', value: 8500, calculatedAmount: 8500 },
              { name: 'HRA', category: 'EARNING', calculationType: 'PERCENTAGE', calculationBase: 'BASIC', value: 25, calculatedAmount: 2000 },
              { name: 'Allowances', category: 'EARNING', calculationType: 'FIXED', value: 1000, calculatedAmount: 1000 },
              { name: 'PF', category: 'DEDUCTION', calculationType: 'PERCENTAGE', calculationBase: 'BASIC', value: 8, calculatedAmount: 600 },
              { name: 'Tax', category: 'DEDUCTION', calculationType: 'PERCENTAGE', calculationBase: 'WAGE', value: 12, calculatedAmount: 1200 },
            ],
          },
        },
      },
    },
  });

  const robert = await prisma.user.create({
    data: {
      employeeId: 'EMP003',
      fullName: 'Robert Fox',
      email: 'robert@dayflow.com',
      passwordHash: hashSync('password', 10),
      role: Role.EMPLOYEE,
      department: 'Design',
      jobTitle: 'Marketing Lead',
      location: 'New York',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024a',
      managerId: alex.id,
      privateInfo: {
        create: {
          dateOfBirth: new Date('1995-11-03'),
          residingAddress: '742 Evergreen Terrace',
          nationality: 'American',
          gender: 'Male',
          dateOfJoining: new Date('2023-06-10'),
        },
      },
      salaryStructure: {
        create: {
          monthlyWage: 5000,
          yearlyWage: 60000,
          components: {
            create: [
              { name: 'Basic Salary', category: 'EARNING', calculationType: 'FIXED', value: 5000, calculatedAmount: 5000 },
              { name: 'HRA', category: 'EARNING', calculationType: 'PERCENTAGE', calculationBase: 'BASIC', value: 25, calculatedAmount: 1200 },
              { name: 'Allowances', category: 'EARNING', calculationType: 'FIXED', value: 500, calculatedAmount: 500 },
            ],
          },
        },
      },
    },
  });

  const cody = await prisma.user.create({
    data: {
      employeeId: 'OICOFI20200001',
      fullName: 'Cody Fisher',
      email: 'cody@dayflow.com',
      passwordHash: hashSync('password', 10),
      role: Role.HR_ADMIN,
      department: 'HR',
      jobTitle: 'HR Manager',
      location: 'Bangalore',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024b',
      privateInfo: {
        create: {
          dateOfBirth: new Date('1990-01-30'),
          residingAddress: 'Koramangala 4th Block',
          nationality: 'Indian',
          gender: 'Male',
          dateOfJoining: new Date('2020-08-20'),
        },
      },
      salaryStructure: {
        create: {
          monthlyWage: 5500,
          yearlyWage: 66000,
          components: {
            create: [
              { name: 'Basic Salary', category: 'EARNING', calculationType: 'FIXED', value: 5500, calculatedAmount: 5500 },
              { name: 'HRA', category: 'EARNING', calculationType: 'PERCENTAGE', calculationBase: 'BASIC', value: 25, calculatedAmount: 1400 },
              { name: 'Allowances', category: 'EARNING', calculationType: 'FIXED', value: 600, calculatedAmount: 600 },
            ],
          },
        },
      },
    },
  });

  const esther = await prisma.user.create({
    data: {
      employeeId: 'EMP005',
      fullName: 'Esther Howard',
      email: 'esther@dayflow.com',
      passwordHash: hashSync('password', 10),
      role: Role.EMPLOYEE,
      department: 'Design',
      jobTitle: 'Product Manager',
      location: 'London',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024c',
      managerId: alex.id,
      privateInfo: {
        create: {
          dateOfBirth: new Date('1991-05-18'),
          residingAddress: '10 Downing Street',
          nationality: 'British',
          gender: 'Female',
          dateOfJoining: new Date('2022-09-01'),
        },
      },
      salaryStructure: {
        create: {
          monthlyWage: 7500,
          yearlyWage: 90000,
          components: {
            create: [
              { name: 'Basic Salary', category: 'EARNING', calculationType: 'FIXED', value: 7500, calculatedAmount: 7500 },
              { name: 'Allowances', category: 'EARNING', calculationType: 'FIXED', value: 900, calculatedAmount: 900 },
            ],
          },
        },
      },
    },
  });

  const brooklyn = await prisma.user.create({
    data: {
      employeeId: 'EMP006',
      fullName: 'Brooklyn Simmons',
      email: 'brooklyn@dayflow.com',
      passwordHash: hashSync('password', 10),
      role: Role.EMPLOYEE,
      department: 'Engineering',
      jobTitle: 'Software Engineer',
      location: 'Bangalore',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024e',
      managerId: jane.id,
      privateInfo: {
        create: {
          dateOfBirth: new Date('1996-07-07'),
          residingAddress: 'Electronic City Phase 1',
          nationality: 'Indian',
          gender: 'Female',
          dateOfJoining: new Date('2024-02-15'),
        },
      },
      salaryStructure: {
        create: {
          monthlyWage: 6200,
          yearlyWage: 74400,
          components: {
            create: [
              { name: 'Basic Salary', category: 'EARNING', calculationType: 'FIXED', value: 6200, calculatedAmount: 6200 },
              { name: 'Allowances', category: 'EARNING', calculationType: 'FIXED', value: 650, calculatedAmount: 650 },
            ],
          },
        },
      },
    },
  });

  const leslie = await prisma.user.create({
    data: {
      employeeId: 'EMP007',
      fullName: 'Leslie Alexander',
      email: 'leslie@dayflow.com',
      passwordHash: hashSync('password', 10),
      role: Role.EMPLOYEE,
      department: 'Engineering',
      jobTitle: 'QA Tester',
      location: 'Remote',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024g',
      managerId: jane.id,
      privateInfo: {
        create: {
          dateOfBirth: new Date('1994-03-25'),
          residingAddress: 'Broadway Apt 4',
          nationality: 'American',
          gender: 'Female',
          dateOfJoining: new Date('2023-11-01'),
        },
      },
      salaryStructure: {
        create: {
          monthlyWage: 4800,
          yearlyWage: 57600,
          components: {
            create: [
              { name: 'Basic Salary', category: 'EARNING', calculationType: 'FIXED', value: 4800, calculatedAmount: 4800 },
              { name: 'Allowances', category: 'EARNING', calculationType: 'FIXED', value: 400, calculatedAmount: 400 },
            ],
          },
        },
      },
    },
  });

  const jenny = await prisma.user.create({
    data: {
      employeeId: 'EMP008',
      fullName: 'Jenny Wilson',
      email: 'jenny@dayflow.com',
      passwordHash: hashSync('password', 10),
      role: Role.EMPLOYEE,
      department: 'Support',
      jobTitle: 'Support Specialist',
      location: 'New York',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024h',
      privateInfo: {
        create: {
          dateOfBirth: new Date('1993-10-15'),
          residingAddress: 'Central Park West',
          nationality: 'American',
          gender: 'Female',
          dateOfJoining: new Date('2022-07-20'),
        },
      },
      salaryStructure: {
        create: {
          monthlyWage: 4500,
          yearlyWage: 54000,
          components: {
            create: [
              { name: 'Basic Salary', category: 'EARNING', calculationType: 'FIXED', value: 4500, calculatedAmount: 4500 },
              { name: 'Allowances', category: 'EARNING', calculationType: 'FIXED', value: 350, calculatedAmount: 350 },
            ],
          },
        },
      },
    },
  });

  // ── Attendance ──
  const attendanceData = [
    { userId: alex.id, date: new Date('2026-08-20'), checkIn: new Date('2026-08-20T09:12:00'), checkOut: new Date('2026-08-20T18:05:00'), status: AttendanceStatus.PRESENT, workHours: 8.88 },
    { userId: alex.id, date: new Date('2026-08-21'), checkIn: new Date('2026-08-21T09:05:00'), checkOut: new Date('2026-08-21T18:00:00'), status: AttendanceStatus.PRESENT, workHours: 8.92 },
    { userId: alex.id, date: new Date('2026-08-22'), checkIn: new Date('2026-08-22T09:12:00'), status: AttendanceStatus.PRESENT, workHours: 0 },
    { userId: jane.id, date: new Date('2026-08-20'), checkIn: new Date('2026-08-20T08:55:00'), checkOut: new Date('2026-08-20T17:30:00'), status: AttendanceStatus.PRESENT, workHours: 8.58 },
    { userId: jane.id, date: new Date('2026-08-21'), checkIn: new Date('2026-08-21T09:00:00'), checkOut: new Date('2026-08-21T17:45:00'), status: AttendanceStatus.PRESENT, workHours: 8.75 },
    { userId: jane.id, date: new Date('2026-08-22'), checkIn: new Date('2026-08-22T08:45:00'), status: AttendanceStatus.PRESENT, workHours: 0 },
    { userId: brooklyn.id, date: new Date('2026-08-21'), checkIn: new Date('2026-08-21T09:42:00'), checkOut: new Date('2026-08-21T18:15:00'), status: AttendanceStatus.PRESENT, workHours: 8.55 },
    { userId: brooklyn.id, date: new Date('2026-08-22'), checkIn: new Date('2026-08-22T09:40:00'), status: AttendanceStatus.PRESENT, workHours: 0 },
    { userId: leslie.id, date: new Date('2026-08-21'), status: AttendanceStatus.LEAVE, workHours: 0 },
    { userId: leslie.id, date: new Date('2026-08-22'), status: AttendanceStatus.LEAVE, workHours: 0 },
  ];

  for (const att of attendanceData) {
    await prisma.attendance.create({ data: att });
  }

  // ── Leave Requests ──
  await prisma.leaveRequest.createMany({
    data: [
      { userId: robert.id, type: LeaveType.PAID_TIME_OFF, startDate: new Date('2026-10-22'), endDate: new Date('2026-10-25'), days: 4, reason: 'Family vacation trip to Hawaii', status: LeaveStatus.PENDING },
      { userId: cody.id, type: LeaveType.SICK_LEAVE, startDate: new Date('2026-08-20'), endDate: new Date('2026-08-20'), days: 1, reason: 'Dental surgery and post-op checkup', status: LeaveStatus.PENDING },
      { userId: leslie.id, type: LeaveType.UNPAID_LEAVE, startDate: new Date('2026-09-01'), endDate: new Date('2026-09-05'), days: 5, reason: 'Family emergencies at hometown', status: LeaveStatus.PENDING },
      { userId: brooklyn.id, type: LeaveType.PAID_TIME_OFF, startDate: new Date('2026-08-10'), endDate: new Date('2026-08-11'), days: 2, reason: 'Moving to new apartment', status: LeaveStatus.APPROVED },
    ],
  });

  // ── Leave Balances ──
  const allUsers = [alex, jane, robert, cody, esther, brooklyn, leslie, jenny];
  for (const u of allUsers) {
    await prisma.leaveBalance.createMany({
      data: [
        { userId: u.id, type: LeaveType.PAID_TIME_OFF, totalDays: 18, usedDays: 2, year: 2026 },
        { userId: u.id, type: LeaveType.SICK_LEAVE, totalDays: 10, usedDays: 1, year: 2026 },
        { userId: u.id, type: LeaveType.UNPAID_LEAVE, totalDays: 5, usedDays: 0, year: 2026 },
        { userId: u.id, type: LeaveType.COMP_OFF, totalDays: 6, usedDays: 1, year: 2026 },
      ],
    });
  }

  // ── Payroll ──
  const alexPayroll = await prisma.payroll.create({
    data: {
      userId: alex.id,
      month: 7,
      year: 2026,
      grossSalary: 7050,
      totalDeductions: 1285,
      netSalary: 5765,
      paidOn: new Date('2026-07-30'),
      items: {
        create: [
          { name: 'Basic Salary', category: 'EARNING', amount: 6000 },
          { name: 'Allowances', category: 'EARNING', amount: 700 },
          { name: 'Bonus', category: 'EARNING', amount: 200 },
          { name: 'Overtime', category: 'EARNING', amount: 150 },
          { name: 'Tax', category: 'DEDUCTION', amount: 705 },
          { name: 'PF', category: 'DEDUCTION', amount: 480 },
          { name: 'Other', category: 'DEDUCTION', amount: 100 },
        ],
      },
    },
  });

  const janePayroll = await prisma.payroll.create({
    data: {
      userId: jane.id,
      month: 7,
      year: 2026,
      grossSalary: 10000,
      totalDeductions: 1950,
      netSalary: 8050,
      paidOn: new Date('2026-07-30'),
      items: {
        create: [
          { name: 'Basic Salary', category: 'EARNING', amount: 8500 },
          { name: 'Allowances', category: 'EARNING', amount: 1000 },
          { name: 'Bonus', category: 'EARNING', amount: 500 },
          { name: 'Tax', category: 'DEDUCTION', amount: 1200 },
          { name: 'PF', category: 'DEDUCTION', amount: 600 },
          { name: 'Other', category: 'DEDUCTION', amount: 150 },
        ],
      },
    },
  });

  // ── Notifications ──
  await prisma.notification.createMany({
    data: [
      { userId: alex.id, type: 'LEAVE', title: 'New Leave Request', message: 'Robert Fox applied for Paid Time Off (4 days)', isRead: false },
      { userId: alex.id, type: 'LEAVE', title: 'Leave Application', message: 'Cody Fisher submitted a Sick Leave certificate', isRead: false },
      { userId: alex.id, type: 'ATTENDANCE', title: 'Late Attendance', message: 'Brooklyn Simmons checked in late today', isRead: true },
    ],
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
