"use client";
import React, { useEffect, useState } from 'react';
import { 
  Calendar as CalendarIcon, Clock, CheckCircle, 
  UserX, Download, Search, ChevronLeft, ChevronRight,
  Filter
} from 'lucide-react';
import { getAttendanceData } from '@/services/api';

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getAttendanceData();
        setData(result);
      } catch (error) {
        console.error("Failed to load attendance data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-[#777A7C]">Loading attendance...</div>;
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-semibold text-[#2D3032]">
          Attendance {activeTab === 'my' ? '– My Attendance' : '– Team Attendance'}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-[#E6E3DE]">
        <button 
          onClick={() => setActiveTab('my')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'my' ? 'text-[#7FAF3F]' : 'text-[#777A7C] hover:text-[#2D3032]'}`}
        >
          My Attendance
          {activeTab === 'my' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7FAF3F] rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('team')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'team' ? 'text-[#7FAF3F]' : 'text-[#777A7C] hover:text-[#2D3032]'}`}
        >
          Team Attendance
          {activeTab === 'team' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7FAF3F] rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'my' ? <MyAttendance data={data.myAttendance} /> : <TeamAttendance data={data.teamAttendance} />}
    </div>
  );
}

function MyAttendance({ data }: { data: any }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex items-center justify-end gap-3">
        <button className="flex items-center gap-2 bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-xs font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
        <div className="flex items-center gap-2 bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-xs font-medium text-[#2D3032]">
          <CalendarIcon className="w-4 h-4 text-[#777A7C]" />
          Apr 20 – Apr 26, 2024
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Present', value: data.kpis.present, icon: CheckCircle, color: '#7FAF3F', bg: '#7FAF3F/10' },
          { label: 'Half-days', value: data.kpis.halfDays, icon: Clock, color: '#E5A83B', bg: '#E5A83B/10' },
          { label: 'Absent', value: data.kpis.absent, icon: UserX, color: '#E56B65', bg: '#E56B65/10' },
          { label: 'Working Hours', value: data.kpis.workingHours, sub: 'This Week', icon: Clock, color: '#E5A83B', bg: '#E5A83B/10' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-[#E6E3DE] shadow-sm flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-[#2D3032]">{kpi.value}</div>
              <div className="text-xs font-medium text-[#777A7C] mt-1">{kpi.label}</div>
              {kpi.sub && <div className="text-[10px] text-[#9A9C9D] mt-0.5">{kpi.sub}</div>}
            </div>
            <div className={`flex items-center justify-center w-12 h-12 rounded-full`} style={{ backgroundColor: kpi.bg, color: kpi.color }}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm min-h-[400px] flex items-center justify-center text-[#9A9C9D]">
          Calendar Component Placeholder
        </div>
        
        <div className="col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm">
             <div className="flex justify-between items-center mb-5">
              <h2 className="text-[15px] font-semibold text-[#2D3032]">Today's Details</h2>
              <div className="bg-[#7FAF3F]/10 text-[#7FAF3F] px-2 py-0.5 rounded text-[11px] font-semibold">Present</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F7F5F1]">
                <div className="text-[11px] text-[#777A7C] mb-1">Check In</div>
                <div className="text-lg font-bold text-[#2D3032]">{data.today.checkIn}</div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F7F5F1]">
                <div className="text-[11px] text-[#777A7C] mb-1">Check Out</div>
                <div className="text-lg font-bold text-[#2D3032]">{data.today.checkOut}</div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F7F5F1]">
                <div className="text-[11px] text-[#777A7C] mb-1">Total Hours</div>
                <div className="text-lg font-bold text-[#2D3032]">{data.today.totalHours}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex-1">
             <div className="flex justify-between items-center mb-5">
              <h2 className="text-[15px] font-semibold text-[#2D3032]">This Week Summary</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[#9A9C9D] text-xs border-b border-[#E6E3DE]">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Check-in</th>
                  <th className="pb-3 font-medium">Check-out</th>
                  <th className="pb-3 font-medium text-right">Hours</th>
                </tr>
              </thead>
              <tbody className="text-[#2D3032]">
                {data.thisWeek.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-[#E6E3DE] last:border-0">
                    <td className="py-3 font-medium">{row.date}</td>
                    <td className={`py-3 font-semibold ${row.color}`}>{row.status}</td>
                    <td className="py-3 text-[#777A7C]">{row.in}</td>
                    <td className="py-3 text-[#777A7C]">{row.out}</td>
                    <td className="py-3 text-right font-medium">{row.hrs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamAttendance({ data }: { data: any }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select className="bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-xs font-medium text-[#2D3032] outline-none">
            <option>All Departments</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-xs font-medium text-[#2D3032]">
            <CalendarIcon className="w-4 h-4 text-[#777A7C]" />
            Apr 20 – Apr 26, 2024
          </div>
          <div className="flex border border-[#E6E3DE] rounded-lg bg-white overflow-hidden">
            <button className="px-2 py-2 hover:bg-[#F7F5F1] border-r border-[#E6E3DE]"><ChevronLeft className="w-4 h-4" /></button>
            <button className="px-2 py-2 hover:bg-[#F7F5F1]"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[#9A9C9D] text-xs border-b border-[#E6E3DE]">
              <th className="pb-3 font-medium">Employee</th>
              <th className="pb-3 font-medium">Department</th>
              <th className="pb-3 font-medium text-center">Present</th>
              <th className="pb-3 font-medium text-center">Half-day</th>
              <th className="pb-3 font-medium text-center">Absent</th>
              <th className="pb-3 font-medium text-center">Leave</th>
              <th className="pb-3 font-medium text-right">Working Hours</th>
            </tr>
          </thead>
          <tbody className="text-[#2D3032]">
            {data.map((row: any, i: number) => (
              <tr key={i} className="border-b border-[#E6E3DE] last:border-0 hover:bg-[#F7F5F1]/50">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                    <span className="font-semibold">{row.name}</span>
                  </div>
                </td>
                <td className="py-3 text-[#777A7C]">{row.dept}</td>
                <td className="py-3 text-center text-[#7FAF3F] font-bold">{row.p}</td>
                <td className="py-3 text-center text-[#E5A83B] font-bold">{row.h}</td>
                <td className="py-3 text-center text-[#E56B65] font-bold">{row.a}</td>
                <td className="py-3 text-center text-[#7A70C7] font-bold">{row.l}</td>
                <td className="py-3 text-right font-medium">{row.hrs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
