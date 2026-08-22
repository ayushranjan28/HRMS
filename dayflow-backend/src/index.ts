import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Dayflow API is running' });
});

// Employee Dashboard API
app.get('/api/dashboard', (req: Request, res: Response) => {
  res.json({
    kpis: { present: 142, hours: '6h 42m', leavesAvailable: 14, nextHoliday: 12 },
    attendanceOverview: [
      { name: 'Mon 20', Present: 8, 'Half-day': 0, Absent: 0, Leave: 0 },
      { name: 'Tue 21', Present: 10, 'Half-day': 0, Absent: 0, Leave: 0 },
      { name: 'Wed 22', Present: 11, 'Half-day': 0, Absent: 0, Leave: 0 },
      { name: 'Thu 23', Present: 9, 'Half-day': 0, Absent: 0, Leave: 0 },
      { name: 'Fri 24', Present: 0, 'Half-day': 6, Absent: 0, Leave: 0 },
      { name: 'Sat 25', Present: 0, 'Half-day': 0, Absent: 2, Leave: 0 },
      { name: 'Sun 26', Present: 0, 'Half-day': 0, Absent: 0, Leave: 3 },
    ],
    upcoming: [
      { title: 'Team Meeting', time: 'Today, 11:00 AM', type: 'video' },
      { title: 'Project Review', time: 'Today, 03:00 PM', type: 'calendar' },
      { title: 'One to One', time: 'Tomorrow, 10:30 AM', type: 'calendar' }
    ],
    recentActivity: [
      { text: 'You checked in', time: 'Today, 09:12 AM', type: 'checkin' },
      { text: 'Leave request approved', time: '2 hours ago', type: 'leave' },
      { text: 'Payslip for April is available', time: '1 day ago', type: 'payslip' }
    ]
  });
});

// Attendance API
app.get('/api/attendance', (req: Request, res: Response) => {
  res.json({
    myAttendance: {
      kpis: { present: 22, halfDays: 3, absent: 1, workingHours: '132h 45m' },
      today: { checkIn: '09:12 AM', checkOut: '06:05 PM', totalHours: '8h 53m' },
      thisWeek: [
        { date: 'Mon, 20 Apr', status: 'Present', in: '09:12 AM', out: '06:05 PM', hrs: '8h 53m', color: 'text-[#7FAF3F]' },
        { date: 'Tue, 21 Apr', status: 'Present', in: '09:05 AM', out: '06:00 PM', hrs: '8h 55m', color: 'text-[#7FAF3F]' },
        { date: 'Wed, 22 Apr', status: 'Leave', in: '--', out: '--', hrs: '--', color: 'text-[#7A70C7]' },
        { date: 'Thu, 23 Apr', status: 'Present', in: '09:10 AM', out: '06:15 PM', hrs: '9h 05m', color: 'text-[#7FAF3F]' }
      ]
    },
    teamAttendance: [
      { name: 'Alex Martin', dept: 'Design', p: '✓', h: '-', a: '-', l: '-', hrs: '42h 30m' },
      { name: 'Jane Cooper', dept: 'Engineering', p: '✓', h: '1', a: '-', l: '-', hrs: '40h 12m' },
      { name: 'Robert Fox', dept: 'Marketing', p: '✓', h: '-', a: '1', l: '-', hrs: '38h 45m' },
      { name: 'Cody Fisher', dept: 'HR', p: '-', h: '-', a: '-', l: '1', hrs: '36h 00m' }
    ]
  });
});

// Leave API
app.get('/api/leave', (req: Request, res: Response) => {
  res.json({
    balances: {
      paid: { used: 12, total: 18, percentage: '66%' },
      sick: { used: 6, total: 10, percentage: '60%' },
      unpaid: { used: 2, total: 5, percentage: '40%' },
      compOff: { used: 4, total: 6, percentage: '66%' }
    },
    history: [
      { type: 'Paid Leave', icon: 'Briefcase', color: '#7FAF3F', bg: '#7FAF3F/10', dates: '15 Apr - 17 Apr 2024', days: 3, status: 'Approved', applied: '10 Apr 2024' },
      { type: 'Sick Leave', icon: 'Clock', color: '#E5A83B', bg: '#E5A83B/10', dates: '08 Apr - 08 Apr 2024', days: 1, status: 'Approved', applied: '07 Apr 2024' },
      { type: 'Unpaid Leave', icon: 'Calendar', color: '#7A70C7', bg: '#7A70C7/10', dates: '02 Apr - 03 Apr 2024', days: 2, status: 'Approved', applied: '01 Apr 2024' },
      { type: 'Paid Leave', icon: 'Briefcase', color: '#7FAF3F', bg: '#7FAF3F/10', dates: '12 Mar - 13 Mar 2024', days: 2, status: 'Rejected', applied: '09 Mar 2024' },
      { type: 'Comp Off', icon: 'CheckCircle', color: '#67AFA5', bg: '#67AFA5/10', dates: '28 Feb 2024', days: 1, status: 'Approved', applied: '25 Feb 2024' },
      { type: 'Sick Leave', icon: 'Clock', color: '#E5A83B', bg: '#E5A83B/10', dates: '16 Feb 2024', days: 1, status: 'Rejected', applied: '14 Feb 2024' }
    ]
  });
});

// Payroll API
app.get('/api/payroll', (req: Request, res: Response) => {
  res.json({
    current: {
      month: 'April 2024',
      paidOn: '30 Apr 2024',
      netSalary: '$4,560.00',
      earnings: {
        total: '$6,200.00',
        basic: '$4,000.00',
        house: '$1,200.00',
        conveyance: '$500.00',
        other: '$500.00'
      },
      deductions: {
        total: '$1,640.00',
        providentFund: '$480.00',
        professionalTax: '$200.00',
        incomeTax: '$800.00',
        other: '$160.00'
      }
    },
    history: [
      { month: 'Mar 2024', amount: '$4,560.00' },
      { month: 'Feb 2024', amount: '$4,560.00' },
      { month: 'Jan 2024', amount: '$4,560.00' },
      { month: 'Dec 2023', amount: '$4,560.00' },
      { month: 'Nov 2023', amount: '$4,560.00' }
    ]
  });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
