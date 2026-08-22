"use client";
import React from 'react';
import { 
  Users, CheckCircle, Calendar, DollarSign, Download, Calendar as CalendarIcon, Clock
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const attendanceTrend = [
  { name: '1 Apr', value: 85 },
  { name: '8 Apr', value: 92 },
  { name: '15 Apr', value: 88 },
  { name: '22 Apr', value: 95 },
  { name: '29 Apr', value: 90 },
];

const leaveTrend = [
  { name: 'Mon', Paid: 4, Sick: 2, Unpaid: 1 },
  { name: 'Tue', Paid: 2, Sick: 1, Unpaid: 0 },
  { name: 'Wed', Paid: 3, Sick: 3, Unpaid: 1 },
  { name: 'Thu', Paid: 5, Sick: 2, Unpaid: 0 },
  { name: 'Fri', Paid: 6, Sick: 4, Unpaid: 2 },
];

const departmentHeadcount = [
  { name: 'Design', value: 12, color: '#7FAF3F' },
  { name: 'Engineering', value: 16, color: '#E5A83B' },
  { name: 'HR', value: 4, color: '#E56B65' },
  { name: 'Finance', value: 6, color: '#7A70C7' },
  { name: 'Support', value: 10, color: '#67AFA5' },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-semibold text-[#2D3032]">Reports & Analytics (HR/Admin)</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-xs font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <div className="flex items-center gap-2 bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-xs font-medium text-[#2D3032]">
            <CalendarIcon className="w-4 h-4 text-[#777A7C]" />
            Apr 1 – Apr 30, 2024
          </div>
        </div>
      </div>

       {/* Tabs */}
       <div className="flex gap-8 border-b border-[#E6E3DE] mb-2">
        {['Overview', 'Attendance', 'Leave', 'Payroll'].map((tab, i) => (
          <button 
            key={tab}
            className={`pb-3 text-sm font-semibold transition-colors relative ${i === 0 ? 'text-[#7FAF3F]' : 'text-[#777A7C] hover:text-[#2D3032]'}`}
          >
            {tab}
            {i === 0 && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7FAF3F] rounded-t-full"></div>}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Employees', value: '48', icon: Users, color: '#7FAF3F' },
          { label: 'Avg Attendance', value: '89%', icon: CheckCircle, color: '#67AFA5' },
          { label: 'Total Leaves', value: '24', icon: Calendar, color: '#E5A83B' },
          { label: 'Payroll This Month', value: '$218,560', icon: DollarSign, color: '#E56B65' },
          { label: 'Overtime Hours', value: '32h 15m', icon: Clock, color: '#7A70C7' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-[#E6E3DE] shadow-sm">
            <div className="text-xs font-medium text-[#777A7C] mb-3">{kpi.label}</div>
            <div className="text-[26px] font-bold text-[#2D3032]">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-3 gap-6 mt-2">
        {/* Attendance Trend */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col h-[320px]">
          <h2 className="text-[15px] font-semibold text-[#2D3032] mb-6">Attendance Trend</h2>
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

        {/* Leave Trend */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col h-[320px]">
          <h2 className="text-[15px] font-semibold text-[#2D3032] mb-6">Leave Trend</h2>
          <div className="flex-1 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 10 }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="Paid" stackId="a" fill="#7FAF3F" radius={[0,0,4,4]} barSize={16} />
                <Bar dataKey="Sick" stackId="a" fill="#E5A83B" barSize={16} />
                <Bar dataKey="Unpaid" stackId="a" fill="#7A70C7" radius={[4,4,0,0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Headcount */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col h-[320px] relative">
          <h2 className="text-[15px] font-semibold text-[#2D3032] mb-2">Department Headcount</h2>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={departmentHeadcount} innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                  {departmentHeadcount.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
              <span className="text-3xl font-bold text-[#2D3032]">48</span>
              <span className="text-[10px] text-[#9A9C9D] uppercase tracking-wider">Total</span>
            </div>
          </div>
          <div className="absolute right-4 top-16 space-y-2">
            {departmentHeadcount.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-medium text-[#777A7C]">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                {d.name}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
