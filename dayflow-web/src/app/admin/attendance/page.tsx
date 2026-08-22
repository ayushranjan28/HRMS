"use client";
import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar as CalendarIcon, Download, Plus, Edit2, Check, RefreshCw, Loader2 } from 'lucide-react';
import * as api from '@/services/api';

export default function AllAttendance() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [formRecord, setFormRecord] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00 AM',
    checkOut: '06:00 PM',
    status: 'Present',
    location: 'Office'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const atts = await api.getAttendance({ date: selectedDate });
      setAttendance(atts || []);
      
      const emps = await api.getEmployees();
      setEmployees(emps || []);

      const settings = await api.getSettings();
      setDepartments(settings.departments || []);
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to retrieve attendance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleExportCSV = () => {
    if (attendance.length === 0) return;
    const headers = ['Employee Name', 'Employee ID', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Location'];
    const rows = attendance.map(a => [
      a.employeeName,
      a.employeeId,
      a.date,
      a.checkIn,
      a.checkOut,
      a.totalHours,
      a.status,
      a.location
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecord.employeeId || !formRecord.date || !formRecord.checkIn) {
      showToast('error', 'Please fill in required fields');
      return;
    }

    try {
      await api.logAttendance(formRecord);
      showToast('success', 'Attendance logged successfully');
      setIsAddModalOpen(false);
      loadData();
    } catch (e) {
      showToast('error', 'Failed to log attendance');
    }
  };

  const handleEditClick = (rec: any) => {
    setEditingRecord(rec);
    setFormRecord({
      employeeId: rec.employeeId,
      date: rec.date,
      checkIn: rec.checkIn || '09:00 AM',
      checkOut: rec.checkOut || '06:00 PM',
      status: rec.status,
      location: rec.location || 'Office'
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      // Calculate total hours worked mock-up
      let totalHrs = '--';
      if (formRecord.checkIn && formRecord.checkOut && formRecord.checkIn !== '--' && formRecord.checkOut !== '--') {
        totalHrs = '8h 00m'; // simulated calculation
      }

      await api.updateAttendance(editingRecord.id, {
        ...formRecord,
        totalHours: totalHrs
      });
      showToast('success', 'Attendance record corrected successfully!');
      setIsEditModalOpen(false);
      loadData();
    } catch (e) {
      showToast('error', 'Failed to update attendance');
    }
  };

  // KPI calculations based on currently loaded date
  const presentCount = attendance.filter(a => a.status === 'Present' || a.status === 'Work From Home').length;
  const lateCount = attendance.filter(a => a.status === 'Late').length;
  const leaveCount = attendance.filter(a => a.status === 'On Leave').length;
  const wfhCount = attendance.filter(a => a.status === 'Work From Home').length;
  const absentCount = employees.filter(emp => emp.status !== 'Inactive' && !attendance.some(a => a.employeeId === emp.id)).length;

  // Filter list
  const filtered = attendance.filter(a => {
    const searchMatch = a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || a.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const deptMatch = selectedDept === 'All' || a.department === selectedDept;
    const statusMatch = selectedStatus === 'All' || a.status.toLowerCase() === selectedStatus.toLowerCase();
    return searchMatch && deptMatch && statusMatch;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto relative">
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 rounded-2xl px-6 py-4 text-white text-sm font-semibold shadow-2xl transition-all duration-300 transform translate-y-0 ${
          toastMsg.type === 'success' ? 'bg-[#7FAF3F]' : 'bg-[#E56B65]'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-semibold text-[#2D3032]">All Attendance</h1>
          <p className="text-[#777A7C] text-sm mt-1">Monitor and manage employee daily clock logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#7FAF3F] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#668F2F] transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Mark Attendance
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-[#E6E3DE] text-[#2D3032] rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#F7F5F1] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={loadData}
            className="p-2.5 bg-white border border-[#E6E3DE] rounded-lg hover:bg-[#F7F5F1] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Present Today', value: presentCount, color: '#7FAF3F' },
          { label: 'Absent Today', value: absentCount, color: '#E56B65' },
          { label: 'Late Arrivals', value: lateCount, color: '#E5A83B' },
          { label: 'On Leave', value: leaveCount, color: '#7A70C7' },
          { label: 'Work From Home', value: wfhCount, color: '#67AFA5' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-[#E6E3DE] shadow-sm">
            <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block mb-2">{kpi.label}</span>
            <span className="text-2xl font-bold text-[#2D3032]" style={{ color: kpi.value > 0 ? kpi.color : undefined }}>
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E6E3DE] shadow-sm">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-4 h-4 text-[#777A7C]" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#F7F5F1] border border-transparent rounded-lg px-3 py-1.5 text-sm font-semibold text-[#2D3032] outline-none cursor-pointer focus:border-[#7FAF3F] transition-colors"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <input 
            type="text" 
            placeholder="Search employee..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-48 bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-3 py-1.5 text-sm font-semibold outline-none transition-colors"
          />
          <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors outline-none cursor-pointer"
          >
            <option value="All">All Departments</option>
            {departments.map(d => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-auto bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
            <option value="Work From Home">WFH</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-white rounded-2xl border border-[#E6E3DE] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[#777A7C] font-semibold text-sm flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#7FAF3F]" />
            <span>Fetching logs...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base font-bold text-[#2D3032]">No attendance records</p>
            <p className="text-xs text-[#777A7C] mt-1">No logs match the chosen date or filter combination.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-[#F7F5F1] text-[#777A7C] text-xs uppercase tracking-wider border-b border-[#E6E3DE]">
                  <th className="py-4 px-6 font-semibold">Employee</th>
                  <th className="py-4 px-6 font-semibold">Employee ID</th>
                  <th className="py-4 px-6 font-semibold">Date</th>
                  <th className="py-4 px-6 font-semibold">Check In</th>
                  <th className="py-4 px-6 font-semibold">Check Out</th>
                  <th className="py-4 px-6 font-semibold">Hours Worked</th>
                  <th className="py-4 px-6 font-semibold">Location</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[#2D3032] divide-y divide-[#E6E3DE]">
                {filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#F7F5F1]/30 transition-colors">
                    <td className="py-4 px-6 font-bold">{rec.employeeName}</td>
                    <td className="py-4 px-6 text-xs text-[#777A7C] font-semibold">{rec.employeeId}</td>
                    <td className="py-4 px-6 text-xs">{rec.date}</td>
                    <td className="py-4 px-6 text-xs font-semibold text-[#2D3032]">{rec.checkIn || '--'}</td>
                    <td className="py-4 px-6 text-xs font-semibold text-[#2D3032]">{rec.checkOut || '--'}</td>
                    <td className="py-4 px-6 text-xs font-bold">{rec.totalHours || '--'}</td>
                    <td className="py-4 px-6 text-xs text-[#777A7C] font-semibold">{rec.location}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        rec.status === 'Present' ? 'bg-[#7FAF3F]/10 text-[#7FAF3F]' :
                        rec.status === 'Late' ? 'bg-[#E5A83B]/10 text-[#E5A83B]' :
                        rec.status === 'On Leave' ? 'bg-[#7A70C7]/10 text-[#7A70C7]' :
                        'bg-[#E56B65]/10 text-[#E56B65]'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleEditClick(rec)}
                        className="text-[#7FAF3F] hover:text-[#668F2F] font-bold text-xs flex items-center justify-end gap-1 cursor-pointer ml-auto"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD/EDIT LOG MODAL ================= */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-[#2D3032] mb-1">
              {isAddModalOpen ? 'Mark Attendance' : 'Adjust Attendance Log'}
            </h2>
            <p className="text-xs text-[#777A7C] mb-6">Manually adjust clock parameters for employee records.</p>
            
            <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Employee ID *</label>
                <select 
                  name="employeeId" 
                  value={formRecord.employeeId} 
                  onChange={(e) => setFormRecord(prev => ({ ...prev, employeeId: e.target.value }))}
                  required
                  disabled={isEditModalOpen}
                  className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Date *</label>
                <input 
                  type="date" 
                  value={formRecord.date}
                  onChange={(e) => setFormRecord(prev => ({ ...prev, date: e.target.value }))}
                  required
                  className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Check In Time</label>
                  <input 
                    type="text" 
                    value={formRecord.checkIn}
                    onChange={(e) => setFormRecord(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                    placeholder="09:00 AM"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Check Out Time</label>
                  <input 
                    type="text" 
                    value={formRecord.checkOut}
                    onChange={(e) => setFormRecord(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                    placeholder="06:00 PM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Status</label>
                  <select 
                    value={formRecord.status}
                    onChange={(e) => setFormRecord(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Work From Home">WFH</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Location</label>
                  <input 
                    type="text" 
                    value={formRecord.location}
                    onChange={(e) => setFormRecord(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                    placeholder="Office"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F7F5F1] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#7FAF3F] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#668F2F] transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Confirm Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
