"use client";
import React, { useEffect, useState } from 'react';
import { 
  Users, CheckCircle, Calendar, DollarSign, Download, 
  Calendar as CalendarIcon, Clock, RefreshCw, Loader2 
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import * as api from '@/services/api';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Attendance' | 'Leave' | 'Payroll'>('Overview');
  const [loading, setLoading] = useState(true);
  
  // States for dynamic data
  const [kpis, setKpis] = useState<any>({
    totalEmployees: 0,
    avgAttendance: '0%',
    totalLeaves: 0,
    payrollThisMonth: '$0',
    overtimeHours: '0h'
  });
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [leaveBreakdown, setLeaveBreakdown] = useState<any[]>([]);
  const [payrollBreakdown, setPayrollBreakdown] = useState<any[]>([]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const overview = await api.getReportsOverview();
      if (overview.kpis) {
        setKpis(overview.kpis);
      }

      const attTrend = await api.getReportsAttendance();
      setAttendanceTrend(attTrend || []);

      const lBreakdown = await api.getReportsLeaves();
      setLeaveBreakdown(lBreakdown || []);

      const pBreakdown = await api.getReportsPayroll();
      setPayrollBreakdown(pBreakdown || []);
    } catch (e) {
      console.error('Failed to load reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const handleExportData = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let fileName = '';

    if (activeTab === 'Attendance') {
      headers = ['Date Range', 'Attendance Percentage'];
      rows = attendanceTrend.map(t => [t.name, `${t.value}%`]);
      fileName = 'Attendance_Analytics';
    } else if (activeTab === 'Leave') {
      headers = ['Leave Type', 'Total Days Used'];
      rows = leaveBreakdown.map(l => [l.name, l.value]);
      fileName = 'Leave_Analytics';
    } else {
      headers = ['Department', 'Headcount', 'Salary Cost ($)'];
      rows = payrollBreakdown.map(p => [p.name, p.value, p.payroll]);
      fileName = 'Payroll_Headcount_Analytics';
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map((val: any) => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-semibold text-[#2D3032]">Reports & Analytics</h1>
          <p className="text-[#777A7C] text-sm mt-1">Real-time indicators across employees, leaves, attendance and payroll.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportData}
            className="flex items-center gap-2 bg-white border border-[#E6E3DE] rounded-lg px-4 py-2.5 text-xs font-semibold text-[#2D3032] hover:bg-[#F7F5F1] transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={loadReportData}
            className="p-2.5 bg-white border border-[#E6E3DE] rounded-lg hover:bg-[#F7F5F1] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-[#E6E3DE]">
        {(['Overview', 'Attendance', 'Leave', 'Payroll'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === tab ? 'text-[#7FAF3F]' : 'text-[#777A7C] hover:text-[#2D3032]'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7FAF3F] rounded-t-full"></div>}
          </button>
        ))}
      </div>

      {/* Loading overlay */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-2 text-[#777A7C] font-semibold">
          <Loader2 className="w-8 h-8 animate-spin text-[#7FAF3F]" />
          <span>Crunching system statistics...</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Employees', value: kpis.totalEmployees, color: '#7FAF3F' },
              { label: 'Avg Attendance', value: kpis.avgAttendance, color: '#67AFA5' },
              { label: 'Total Leaves', value: kpis.totalLeaves, color: '#E5A83B' },
              { label: 'Payroll This Month', value: kpis.payrollThisMonth, color: '#E56B65' },
              { label: 'Overtime Hours', value: kpis.overtimeHours, color: '#7A70C7' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-[#E6E3DE] shadow-sm">
                <span className="text-[10px] font-bold text-[#777A7C] uppercase block mb-2">{kpi.label}</span>
                <span className="text-2xl font-bold text-[#2D3032]">{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Tab Views */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
              {/* Attendance Trend */}
              <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col h-[320px]">
                <h2 className="text-[15px] font-bold text-[#2D3032] mb-6">Attendance Trend</h2>
                <div className="flex-1 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 10 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 10 }} domain={[50, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#7FAF3F" strokeWidth={3} dot={{ r: 4, fill: '#7FAF3F', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leave Breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col h-[320px]">
                <h2 className="text-[15px] font-bold text-[#2D3032] mb-6">Leaves Distribution</h2>
                <div className="flex-1 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaveBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 10 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 10 }} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="value" fill="#E5A83B" radius={[4,4,0,0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Headcount */}
              <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col h-[320px] relative">
                <h2 className="text-[15px] font-bold text-[#2D3032] mb-2">Department Headcount</h2>
                <div className="flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={payrollBreakdown} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                        {payrollBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                    <span className="text-2xl font-bold text-[#2D3032]">{kpis.totalEmployees}</span>
                    <span className="text-[9px] text-[#9A9C9D] font-bold uppercase tracking-wider">Total</span>
                  </div>
                </div>
                <div className="absolute right-4 top-16 space-y-2">
                  {payrollBreakdown.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-medium text-[#777A7C]">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Attendance' && (
            <div className="bg-white rounded-2xl p-8 border border-[#E6E3DE] shadow-sm flex flex-col h-[400px]">
              <h2 className="text-[16px] font-bold text-[#2D3032] mb-6">Detailed Attendance Analytics Trend (%)</h2>
              <div className="flex-1 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 11 }} domain={[50, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#7FAF3F" strokeWidth={4} dot={{ r: 6, fill: '#7FAF3F' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'Leave' && (
            <div className="bg-white rounded-2xl p-8 border border-[#E6E3DE] shadow-sm flex flex-col h-[400px]">
              <h2 className="text-[16px] font-bold text-[#2D3032] mb-6">Leaves Distribution by Categories (Total Days)</h2>
              <div className="flex-1 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaveBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#E5A83B" radius={[6,6,0,0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'Payroll' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Department Salary distribution */}
              <div className="bg-white rounded-2xl p-8 border border-[#E6E3DE] shadow-sm flex flex-col h-[400px] lg:col-span-2">
                <h2 className="text-[16px] font-bold text-[#2D3032] mb-6">Payroll Budget by Department ($)</h2>
                <div className="flex-1 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payrollBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="payroll" fill="#67AFA5" radius={[6,6,0,0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department breakdown List */}
              <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7FAF3F] border-b border-[#E6E3DE] pb-2">Budget Allocation</h3>
                <div className="divide-y divide-[#E6E3DE] max-h-[300px] overflow-y-auto">
                  {payrollBreakdown.map((dept, i) => (
                    <div key={i} className="flex justify-between py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }}></div>
                        <span className="font-bold text-[#2D3032]">{dept.name}</span>
                      </div>
                      <span className="font-extrabold text-[#777A7C]">${dept.payroll?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
