"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  CalendarCheck, Clock, Briefcase, Palmtree, 
  LogIn, Calendar, FileText, CheckCircle, 
  ChevronRight, Megaphone, Video, Plus, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDashboardData, getTodayAttendance, markAttendance, createCalendarEvent } from '@/services/api';

const COLORS = {
  Present: '#7FAF3F',
  'Half-day': '#E5A83B',
  Absent: '#E56B65',
  Leave: '#7A70C7'
};

export default function EmployeeDashboard() {
  const [data, setData] = useState<any>(null);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [markingStatus, setMarkingStatus] = useState(false);

  // Calendar Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    type: 'MEETING',
    description: ''
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [result, attendanceResult] = await Promise.all([
          getDashboardData(),
          getTodayAttendance(),
        ]);
        setData(result);
        setTodayRecord(attendanceResult?.record || null);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleMarkAttendance = async (type: 'checkin' | 'checkout') => {
    setMarkingStatus(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setMarkingStatus(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          const res = await markAttendance(type, loc);
          setTodayRecord(res.record);
        } catch (error: any) {
          alert(error?.response?.data?.error || "Failed to mark attendance");
        } finally {
          setMarkingStatus(false);
        }
      },
      (error) => {
        alert("Failed to get location. Please allow location access to mark attendance.");
        setMarkingStatus(false);
      }
    );
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await createCalendarEvent(formData);
      setIsModalOpen(false);
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        type: 'MEETING',
        description: ''
      });
      // Refresh dashboard data to show the new event
      const result = await getDashboardData();
      setData(result);
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to schedule meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-[#777A7C]">Loading dashboard...</div>;
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-2">
        <h1 className="text-[28px] font-semibold text-[#2D3032] flex items-center gap-2">
          Good morning, <span className="text-[#7FAF3F]">Alex</span> <span className="text-xl">👋</span>
        </h1>
        <p className="text-[#777A7C] text-sm mt-1">Here's what's happening with your work today.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Status */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E3DE] shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#777A7C] mb-2">
              <span className={`w-2 h-2 rounded-full ${todayRecord?.checkIn && !todayRecord?.checkOut ? 'bg-[#7FAF3F]' : todayRecord?.checkOut ? 'bg-[#E5A83B]' : 'bg-[#E56B65]'}`}></span> Today's Status
            </div>
            <div className="text-2xl font-bold text-[#2D3032]">
              {todayRecord?.checkIn && !todayRecord?.checkOut ? 'Checked In' : todayRecord?.checkOut ? 'Checked Out' : 'Not Checked In'}
            </div>
            <div className="text-xs text-[#9A9C9D] mt-1">
              {todayRecord?.checkIn ? `At ${new Date(todayRecord.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Use button to mark attendance'}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {!todayRecord?.checkIn && (
              <button 
                onClick={() => handleMarkAttendance('checkin')}
                disabled={markingStatus}
                className="bg-[#7FAF3F] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#668F2F] disabled:opacity-50 transition-all shadow-sm"
              >
                {markingStatus ? 'Checking In...' : 'Check In'}
              </button>
            )}
            {todayRecord?.checkIn && !todayRecord?.checkOut && (
              <button 
                onClick={() => handleMarkAttendance('checkout')}
                disabled={markingStatus}
                className="bg-[#E5A83B] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#C88A2E] disabled:opacity-50 transition-all shadow-sm"
              >
                {markingStatus ? 'Checking Out...' : 'Check Out'}
              </button>
            )}
            {todayRecord?.checkOut && (
              <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-4 border-[#7FAF3F]/20 text-[#7FAF3F]">
                <CalendarCheck className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E3DE] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-[#777A7C] mb-2">Working Hours</div>
            <div className="text-2xl font-bold text-[#2D3032]">{data.kpis.hours}</div>
            <div className="text-xs text-[#9A9C9D] mt-1">Today</div>
          </div>
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-4 border-[#E5A83B]/20 text-[#E5A83B]">
             <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
              <path className="text-[#E5A83B]" strokeDasharray="60, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Leave Balance */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E3DE] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-[#777A7C] mb-2">Leave Balance</div>
            <div className="text-2xl font-bold text-[#2D3032]">{data.kpis.leavesAvailable}</div>
            <div className="text-xs text-[#9A9C9D] mt-1">Days available</div>
          </div>
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#7A70C7]/10 text-[#7A70C7]">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Next Holiday */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E3DE] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-[#777A7C] mb-2">Next Holiday</div>
            <div className="text-2xl font-bold text-[#2D3032]">{data.kpis.nextHoliday}</div>
            <div className="text-xs text-[#9A9C9D] mt-1">Days to go</div>
          </div>
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#E56B65]/10 text-[#E56B65]">
            <Palmtree className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN - 7 cols */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          
          {/* Attendance Overview Chart */}
          <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col min-h-[340px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[15px] font-semibold text-[#2D3032]">Attendance Overview</h2>
              <select className="bg-[#F7F5F1] text-xs font-medium text-[#2D3032] py-1.5 px-3 rounded-lg border-none outline-none cursor-pointer">
                <option>This Week</option>
              </select>
            </div>
            
            <div className="flex-1 flex gap-4">
              <div className="flex-1 min-w-0 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.attendanceOverview} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 10 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9A9C9D', fontSize: 10 }} ticks={[0, 5, 10, 15]} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="Present" stackId="a" fill={COLORS.Present} radius={[4,4,4,4]} barSize={12} />
                    <Bar dataKey="Half-day" stackId="a" fill={COLORS['Half-day']} radius={[4,4,4,4]} barSize={12} />
                    <Bar dataKey="Absent" stackId="a" fill={COLORS.Absent} radius={[4,4,4,4]} barSize={12} />
                    <Bar dataKey="Leave" stackId="a" fill={COLORS.Leave} radius={[4,4,4,4]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-6 text-[11px] font-medium text-[#777A7C] pl-6">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7FAF3F]"></span> Present</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#E5A83B]"></span> Half-day</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#E56B65]"></span> Absent</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7A70C7]"></span> Leave</div>
                </div>
              </div>

              {/* Summary Totals */}
              <div className="w-[140px] bg-[#2D3032] rounded-xl p-4 flex flex-col justify-between text-white shrink-0 shadow-lg">
                <div>
                  <div className="text-2xl font-bold text-[#7FAF3F]">22</div>
                  <div className="text-[11px] text-gray-400">Present</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#E5A83B]">2</div>
                  <div className="text-[11px] text-gray-400">Half-day</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#E56B65]">1</div>
                  <div className="text-[11px] text-gray-400">Absent</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#7A70C7]">1</div>
                  <div className="text-[11px] text-gray-400">Leave</div>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Balance List */}
          <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[15px] font-semibold text-[#2D3032]">Leave Balance</h2>
              <button className="text-xs font-medium text-[#777A7C] hover:text-[#2D3032]">View all</button>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#7FAF3F]/10 flex items-center justify-center text-[#7FAF3F] shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-[#2D3032]">Paid Leave</span>
                    <span className="text-[#2D3032] font-semibold">12 <span className="text-[#9A9C9D] font-normal">/ 18 days</span></span>
                  </div>
                  <div className="h-1.5 bg-[#F7F5F1] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7FAF3F] rounded-full" style={{ width: '66%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#E5A83B]/10 flex items-center justify-center text-[#E5A83B] shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-[#2D3032]">Sick Leave</span>
                    <span className="text-[#2D3032] font-semibold">6 <span className="text-[#9A9C9D] font-normal">/ 10 days</span></span>
                  </div>
                  <div className="h-1.5 bg-[#F7F5F1] rounded-full overflow-hidden">
                    <div className="h-full bg-[#E5A83B] rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#7A70C7]/10 flex items-center justify-center text-[#7A70C7] shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-[#2D3032]">Unpaid Leave</span>
                    <span className="text-[#2D3032] font-semibold">2 <span className="text-[#9A9C9D] font-normal">/ 5 days</span></span>
                  </div>
                  <div className="h-1.5 bg-[#F7F5F1] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7A70C7] rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN - 5 cols */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          
          <div className="grid grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm">
              <h2 className="text-[15px] font-semibold text-[#2D3032] mb-5">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#E6E3DE] hover:border-[#7FAF3F] hover:bg-[#F7F5F1] transition-colors text-center">
                  <div className="w-8 h-8 rounded-full bg-[#7FAF3F]/10 flex items-center justify-center text-[#7FAF3F] mb-2">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[#2D3032]">Check In</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#E6E3DE] hover:border-[#E56B65] hover:bg-[#F7F5F1] transition-colors text-center">
                  <div className="w-8 h-8 rounded-full bg-[#E56B65]/10 flex items-center justify-center text-[#E56B65] mb-2">
                    <Palmtree className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[#2D3032]">Apply Leave</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#E6E3DE] hover:border-[#7A70C7] hover:bg-[#F7F5F1] transition-colors text-center">
                  <div className="w-8 h-8 rounded-full bg-[#7A70C7]/10 flex items-center justify-center text-[#7A70C7] mb-2">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[#2D3032]">View Payslip</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#E6E3DE] hover:border-[#3B82F6] hover:bg-[#F7F5F1] transition-colors text-center">
                  <div className="w-8 h-8 rounded-full bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] mb-2">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[#2D3032]">Attendance</span>
                </button>
              </div>
            </div>

            {/* Upcoming Schedule */}
            <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-[15px] font-semibold text-[#2D3032]">Upcoming</h2>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsModalOpen(true)} className="text-[#7A70C7] hover:text-[#685db5] bg-[#7A70C7]/10 p-1.5 rounded-lg transition-colors" title="Schedule Meeting">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {(data.upcoming || [
                  { type: 'video', title: 'Weekly Sync', time: '10:00 AM - 11:00 AM' },
                  { type: 'calendar', title: 'Product Review', time: '2:00 PM - 3:30 PM' }
                ]).map((item: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'video' ? 'bg-[#67AFA5]/10 text-[#67AFA5]' : 'bg-[#E5A83B]/10 text-[#E5A83B]'
                    }`}>
                      {item.type === 'video' ? <Video className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#2D3032]">{item.title}</div>
                      <div className="text-[11px] text-[#9A9C9D] mt-0.5">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/calendar" className="mt-auto w-full bg-[#F7F5F1] hover:bg-[#E6E3DE] text-[#2D3032] text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1">
                View Calendar <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-[15px] font-semibold text-[#2D3032]">Recent Activity</h2>
                <button className="text-xs font-medium text-[#777A7C] hover:text-[#2D3032]">View all</button>
              </div>
              
              <div className="relative border-l-2 border-[#F7F5F1] ml-3 space-y-6">
                {(data.recentActivity || [
                  { type: 'checkin', text: 'Checked in for the day', time: '09:12 AM' },
                  { type: 'payslip', text: 'Payslip generated for June', time: 'Yesterday' }
                ]).map((activity: any, i: number) => {
                  const colors: any = { checkin: '#7FAF3F', leave: '#E5A83B', payslip: '#7A70C7' };
                  const color = colors[activity.type] || '#9A9C9D';
                  return (
                    <div key={i} className="relative pl-5">
                      <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-[3px]" style={{ borderColor: color }}></div>
                      <div className="text-[13px] font-medium text-[#2D3032]">{activity.text}</div>
                      <div className="text-[11px] text-[#9A9C9D] mt-1">{activity.time}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-[15px] font-semibold text-[#2D3032]">Announcements</h2>
                <button className="text-xs font-medium text-[#777A7C] hover:text-[#2D3032]">View all</button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-[#7FAF3F]/5 rounded-xl p-4 border border-[#7FAF3F]/10">
                  <div className="flex items-start gap-3">
                    <Megaphone className="w-4 h-4 text-[#7FAF3F] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[13px] font-semibold text-[#2D3032] mb-1">Independence Day Holiday</div>
                      <div className="text-[11px] text-[#777A7C] leading-snug">Office will remain closed on 15th Aug 2024.</div>
                      <div className="text-[10px] text-[#9A9C9D] mt-2">2 days ago</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#E56B65]/5 rounded-xl p-4 border border-[#E56B65]/10">
                  <div className="flex items-start gap-3">
                    <Megaphone className="w-4 h-4 text-[#E56B65] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[13px] font-semibold text-[#2D3032] mb-1">New Work From Home Policy</div>
                      <div className="text-[11px] text-[#777A7C] leading-snug">Please review the updated WFH policy.</div>
                      <div className="text-[10px] text-[#9A9C9D] mt-2">5 days ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Schedule Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[#E6E3DE]">
              <h2 className="text-xl font-bold text-[#2D3032]">Schedule Event</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#9A9C9D] hover:text-[#2D3032] transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-[#2D3032] mb-1.5">Event Title *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Team Weekly Sync"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] focus:border-[#7A70C7] focus:ring-1 focus:ring-[#7A70C7] outline-none transition-all text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#2D3032] mb-1.5">Event Type *</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] focus:border-[#7A70C7] focus:ring-1 focus:ring-[#7A70C7] outline-none transition-all text-sm bg-white"
                    >
                      <option value="MEETING">Meeting</option>
                      <option value="VIDEO">Video Call</option>
                      <option value="REMINDER">Reminder</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[13px] font-semibold text-[#2D3032] mb-1.5">Date *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] focus:border-[#7A70C7] focus:ring-1 focus:ring-[#7A70C7] outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#2D3032] mb-1.5">Start Time *</label>
                    <input 
                      type="time" 
                      required
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] focus:border-[#7A70C7] focus:ring-1 focus:ring-[#7A70C7] outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#2D3032] mb-1.5">End Time *</label>
                    <input 
                      type="time" 
                      required
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] focus:border-[#7A70C7] focus:ring-1 focus:ring-[#7A70C7] outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#2D3032] mb-1.5">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Add event details, agenda, or video links..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] focus:border-[#7A70C7] focus:ring-1 focus:ring-[#7A70C7] outline-none transition-all text-sm resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-[#777A7C] hover:bg-[#F7F5F1] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl font-medium bg-[#7A70C7] hover:bg-[#685db5] text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
