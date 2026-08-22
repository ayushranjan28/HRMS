"use client";
import React, { useEffect, useState } from 'react';
import {
  Search, Calendar as CalendarIcon, Download, Plus, Edit2,
  RefreshCw, Loader2, CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';
import * as api from '@/services/api';

const STATUS_BADGE: Record<string, string> = {
  Present:      'bg-[#7FAF3F]/10 text-[#7FAF3F]',
  Late:         'bg-[#E5A83B]/10 text-[#E5A83B]',
  'On Leave':   'bg-[#7A70C7]/10 text-[#7A70C7]',
  Absent:       'bg-[#E56B65]/10 text-[#E56B65]',
  'Half Day':   'bg-[#67AFA5]/10 text-[#67AFA5]',
  'Work From Home': 'bg-[#6B98D4]/10 text-[#6B98D4]',
};

const CORR_BADGE: Record<string, string> = {
  PENDING:  'bg-[#E5A83B]/10 text-[#E5A83B]',
  APPROVED: 'bg-[#7FAF3F]/10 text-[#7FAF3F]',
  REJECTED: 'bg-[#E56B65]/10 text-[#E56B65]',
};

export default function AllAttendance() {
  const [activeTab, setActiveTab] = useState<'logs' | 'corrections'>('logs');

  // Attendance Logs state
  const [attendance,   setAttendance]   = useState<any[]>([]);
  const [employees,    setEmployees]    = useState<any[]>([]);
  const [departments,  setDepartments]  = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Add/Edit modal
  const [isAddModalOpen,  setIsAddModalOpen]  = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord,   setEditingRecord]   = useState<any>(null);
  const [formRecord, setFormRecord] = useState({
    employeeId: '', date: new Date().toISOString().split('T')[0],
    checkIn: '09:00 AM', checkOut: '06:00 PM', status: 'Present', location: 'Office'
  });

  // Corrections state
  const [corrections,    setCorrections]    = useState<any[]>([]);
  const [corrsLoading,   setCorrsLoading]   = useState(false);
  const [corrFilter,     setCorrFilter]     = useState<'ALL'|'PENDING'|'APPROVED'|'REJECTED'>('ALL');
  const [corrSearch,     setCorrSearch]     = useState('');
  const [actioningId,    setActioningId]    = useState<string|null>(null);
  const [rejectModal,    setRejectModal]    = useState<{ id: string; name: string }|null>(null);
  const [rejectComment,  setRejectComment]  = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success'|'error'; text: string }|null>(null);

  const showToast = (type: 'success'|'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // ─── Loaders ──────────────────────────────────────────────────────────────
  const loadAttendance = async () => {
    setLoading(true);
    try {
      const [atts, emps, settings] = await Promise.all([
        api.getAttendance({ date: selectedDate }),
        api.getEmployees(),
        api.getSettings(),
      ]);
      setAttendance(atts || []);
      setEmployees(emps || []);
      setDepartments(settings?.departments || []);
    } catch { showToast('error', 'Failed to load attendance logs'); }
    finally   { setLoading(false); }
  };

  const loadCorrections = async () => {
    setCorrsLoading(true);
    try {
      const data = await api.getRegularizations();
      setCorrections(data || []);
    } catch { showToast('error', 'Failed to load correction requests'); }
    finally   { setCorrsLoading(false); }
  };

  useEffect(() => { loadAttendance(); }, [selectedDate]);
  useEffect(() => { if (activeTab === 'corrections') loadCorrections(); }, [activeTab]);

  // ─── Attendance Actions ───────────────────────────────────────────────────
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecord.employeeId || !formRecord.date || !formRecord.checkIn) {
      return showToast('error', 'Please fill in required fields');
    }
    try {
      await api.logAttendance(formRecord);
      showToast('success', 'Attendance logged successfully');
      setIsAddModalOpen(false);
      loadAttendance();
    } catch { showToast('error', 'Failed to log attendance'); }
  };

  const handleEditClick = (rec: any) => {
    setEditingRecord(rec);
    setFormRecord({ employeeId: rec.employeeId, date: rec.date, checkIn: rec.checkIn || '09:00 AM', checkOut: rec.checkOut || '06:00 PM', status: rec.status, location: rec.location || 'Office' });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      await api.updateAttendance(editingRecord.id, { ...formRecord, totalHours: '8h 00m' });
      showToast('success', 'Attendance record updated!');
      setIsEditModalOpen(false);
      loadAttendance();
    } catch { showToast('error', 'Failed to update attendance'); }
  };

  const handleExportCSV = () => {
    if (!attendance.length) return;
    const headers = ['Employee Name','Employee ID','Date','Check In','Check Out','Total Hours','Status','Location'];
    const rows = attendance.map(a => [a.employeeName, a.employeeId, a.date, a.checkIn, a.checkOut, a.totalHours, a.status, a.location]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `Attendance_${selectedDate}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // ─── Correction Actions ───────────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    setActioningId(id);
    try {
      await api.approveRegularization(id);
      showToast('success', 'Correction request approved — attendance updated!');
      loadCorrections();
      if (activeTab === 'logs') loadAttendance();
    } catch { showToast('error', 'Failed to approve request'); }
    finally { setActioningId(null); }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    setActioningId(rejectModal.id);
    try {
      await api.rejectRegularization(rejectModal.id, rejectComment);
      showToast('success', 'Correction request rejected.');
      setRejectModal(null); setRejectComment('');
      loadCorrections();
    } catch { showToast('error', 'Failed to reject request'); }
    finally { setActioningId(null); }
  };

  // ─── Computed ─────────────────────────────────────────────────────────────
  const presentCount = attendance.filter(a => a.status === 'Present' || a.status === 'Work From Home').length;
  const lateCount    = attendance.filter(a => a.status === 'Late').length;
  const leaveCount   = attendance.filter(a => a.status === 'On Leave').length;
  const wfhCount     = attendance.filter(a => a.status === 'Work From Home').length;
  const absentCount  = employees.filter(e => e.status !== 'Inactive' && !attendance.some(a => a.employeeId === e.id)).length;
  const pendingCorrCount = corrections.filter(c => c.status === 'PENDING').length;

  const filtered = attendance.filter(a => {
    const s = a.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || a.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const d = selectedDept === 'All' || a.department === selectedDept;
    const st = selectedStatus === 'All' || a.status?.toLowerCase() === selectedStatus.toLowerCase();
    return s && d && st;
  });

  const filteredCorrs = corrections.filter(c => {
    const statusOk = corrFilter === 'ALL' || c.status === corrFilter;
    const searchOk = !corrSearch || c.employeeName?.toLowerCase().includes(corrSearch.toLowerCase()) || c.employeeId?.toLowerCase().includes(corrSearch.toLowerCase());
    return statusOk && searchOk;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto relative">
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 rounded-2xl px-6 py-4 text-white text-sm font-semibold shadow-2xl transition-all ${toastMsg.type === 'success' ? 'bg-[#7FAF3F]' : 'bg-[#E56B65]'}`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-semibold text-[#2D3032]">Attendance</h1>
          <p className="text-[#777A7C] text-sm mt-1">Monitor daily logs and review correction requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-[#7FAF3F] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#668F2F] transition-all shadow-sm cursor-pointer active:scale-95">
            <Plus className="w-4 h-4" /> Mark Attendance
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-white border border-[#E6E3DE] text-[#2D3032] rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#F7F5F1] transition-all cursor-pointer">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={loadAttendance} className="p-2.5 bg-white border border-[#E6E3DE] rounded-lg hover:bg-[#F7F5F1] transition-all cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Present',         value: presentCount,     color: '#7FAF3F' },
          { label: 'Absent',          value: absentCount,      color: '#E56B65' },
          { label: 'Late',            value: lateCount,        color: '#E5A83B' },
          { label: 'On Leave',        value: leaveCount,       color: '#7A70C7' },
          { label: 'WFH',             value: wfhCount,         color: '#67AFA5' },
          { label: 'Pending Corrections', value: pendingCorrCount, color: '#E5A83B' },
        ].map((k, i) => (
          <div key={i} className={`bg-white rounded-2xl p-5 border shadow-sm ${i === 5 && pendingCorrCount > 0 ? 'border-[#E5A83B]/40' : 'border-[#E6E3DE]'}`}>
            <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block mb-2">{k.label}</span>
            <span className="text-2xl font-bold text-[#2D3032]" style={{ color: k.value > 0 ? k.color : undefined }}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#F7F5F1] p-1 rounded-xl w-fit border border-[#E6E3DE]">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'logs' ? 'bg-white text-[#2D3032] shadow-sm' : 'text-[#777A7C] hover:text-[#2D3032]'}`}
        >
          All Logs
        </button>
        <button
          onClick={() => setActiveTab('corrections')}
          className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'corrections' ? 'bg-white text-[#2D3032] shadow-sm' : 'text-[#777A7C] hover:text-[#2D3032]'}`}
        >
          Correction Requests
          {pendingCorrCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E5A83B] text-white text-[9px] font-bold">
              {pendingCorrCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── ALL LOGS TAB ─── */}
      {activeTab === 'logs' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E6E3DE] shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-[#777A7C]" />
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="bg-[#F7F5F1] border border-transparent rounded-lg px-3 py-1.5 text-sm font-semibold text-[#2D3032] outline-none cursor-pointer focus:border-[#7FAF3F] transition-colors" />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <input type="text" placeholder="Search employee..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-3 py-1.5 text-sm font-semibold outline-none transition-colors" />
              <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                className="w-full sm:w-auto bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors outline-none cursor-pointer">
                <option value="All">All Departments</option>
                {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
                className="w-full sm:w-auto bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors outline-none cursor-pointer">
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

          <div className="bg-white rounded-2xl border border-[#E6E3DE] shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center gap-2 text-[#777A7C]">
                <Loader2 className="w-6 h-6 animate-spin text-[#7FAF3F]" />
                <span className="text-sm font-semibold">Fetching logs...</span>
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
                      <th className="py-4 px-6 font-semibold">ID</th>
                      <th className="py-4 px-6 font-semibold">Date</th>
                      <th className="py-4 px-6 font-semibold">Check In</th>
                      <th className="py-4 px-6 font-semibold">Check Out</th>
                      <th className="py-4 px-6 font-semibold">Hours</th>
                      <th className="py-4 px-6 font-semibold">Location</th>
                      <th className="py-4 px-6 font-semibold">Status</th>
                      <th className="py-4 px-6 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#2D3032] divide-y divide-[#E6E3DE]">
                    {filtered.map(rec => (
                      <tr key={rec.id} className="hover:bg-[#F7F5F1]/30 transition-colors">
                        <td className="py-4 px-6 font-bold">{rec.employeeName}</td>
                        <td className="py-4 px-6 text-xs text-[#777A7C] font-semibold">{rec.employeeId}</td>
                        <td className="py-4 px-6 text-xs">{rec.date}</td>
                        <td className="py-4 px-6 text-xs font-semibold">{rec.checkIn || '--'}</td>
                        <td className="py-4 px-6 text-xs font-semibold">{rec.checkOut || '--'}</td>
                        <td className="py-4 px-6 text-xs font-bold">{rec.totalHours || '--'}</td>
                        <td className="py-4 px-6 text-xs text-[#777A7C] font-semibold">{rec.location}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${STATUS_BADGE[rec.status] || 'bg-gray-100 text-gray-600'}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button onClick={() => handleEditClick(rec)} className="text-[#7FAF3F] hover:text-[#668F2F] font-bold text-xs flex items-center justify-end gap-1 cursor-pointer ml-auto">
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
        </>
      )}

      {/* ─── CORRECTIONS TAB ─── */}
      {activeTab === 'corrections' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E6E3DE] shadow-sm">
            <div className="flex items-center gap-2">
              {(['ALL','PENDING','APPROVED','REJECTED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setCorrFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    corrFilter === f
                      ? f === 'PENDING' ? 'bg-[#E5A83B] text-white' : f === 'APPROVED' ? 'bg-[#7FAF3F] text-white' : f === 'REJECTED' ? 'bg-[#E56B65] text-white' : 'bg-[#2D3032] text-white'
                      : 'bg-[#F7F5F1] text-[#777A7C] hover:text-[#2D3032]'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search employee..."
              value={corrSearch}
              onChange={e => setCorrSearch(e.target.value)}
              className="w-full sm:w-56 bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-3 py-1.5 text-sm font-semibold outline-none transition-colors"
            />
          </div>

          <div className="bg-white rounded-2xl border border-[#E6E3DE] shadow-sm overflow-hidden">
            {corrsLoading ? (
              <div className="py-20 text-center flex flex-col items-center gap-2 text-[#777A7C]">
                <Loader2 className="w-6 h-6 animate-spin text-[#7FAF3F]" />
                <span className="text-sm font-semibold">Loading requests...</span>
              </div>
            ) : filteredCorrs.length === 0 ? (
              <div className="py-20 text-center">
                <AlertCircle className="w-10 h-10 text-[#E6E3DE] mx-auto mb-3" />
                <p className="text-base font-bold text-[#2D3032]">No correction requests</p>
                <p className="text-xs text-[#777A7C] mt-1">Employee regularization requests will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F7F5F1] text-[#777A7C] text-xs uppercase tracking-wider border-b border-[#E6E3DE]">
                      <th className="py-4 px-6 font-semibold">Employee</th>
                      <th className="py-4 px-6 font-semibold">Date</th>
                      <th className="py-4 px-6 font-semibold">Current → Requested</th>
                      <th className="py-4 px-6 font-semibold">Reason</th>
                      <th className="py-4 px-6 font-semibold">Submitted</th>
                      <th className="py-4 px-6 font-semibold">Status</th>
                      <th className="py-4 px-6 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#2D3032] divide-y divide-[#E6E3DE]">
                    {filteredCorrs.map(c => (
                      <tr key={c.id} className="hover:bg-[#F7F5F1]/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-sm">{c.employeeName}</div>
                          <div className="text-[10px] text-[#777A7C] font-semibold mt-0.5">{c.employeeId} · {c.department}</div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-sm">{c.date}</td>
                        <td className="py-4 px-6 text-xs">
                          <span className="font-bold text-[#E56B65]">{c.currentStatus}</span>
                          <span className="mx-2 text-[#777A7C]">→</span>
                          <span className="font-bold text-[#7FAF3F]">{c.requestedStatus}</span>
                        </td>
                        <td className="py-4 px-6 text-xs text-[#777A7C] max-w-[200px]">
                          <span className="line-clamp-2 whitespace-normal">{c.reason}</span>
                        </td>
                        <td className="py-4 px-6 text-xs text-[#777A7C]">{new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${CORR_BADGE[c.status]}`}>
                            {c.status === 'PENDING'  && <Clock        className="w-2.5 h-2.5" />}
                            {c.status === 'APPROVED' && <CheckCircle  className="w-2.5 h-2.5" />}
                            {c.status === 'REJECTED' && <XCircle      className="w-2.5 h-2.5" />}
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {c.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(c.id)}
                                disabled={actioningId === c.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#7FAF3F] text-white rounded-lg text-xs font-bold hover:bg-[#668F2F] transition-all cursor-pointer disabled:opacity-60 active:scale-95"
                              >
                                {actioningId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                Approve
                              </button>
                              <button
                                onClick={() => { setRejectModal({ id: c.id, name: c.employeeName }); setRejectComment(''); }}
                                disabled={actioningId === c.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#E56B65] text-white rounded-lg text-xs font-bold hover:bg-[#C94E49] transition-all cursor-pointer disabled:opacity-60 active:scale-95"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#777A7C] font-semibold">{c.adminComment || '—'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── ADD / EDIT ATTENDANCE MODAL ─── */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative">
            <h2 className="text-xl font-bold text-[#2D3032] mb-1">
              {isAddModalOpen ? 'Mark Attendance' : 'Adjust Attendance Log'}
            </h2>
            <p className="text-xs text-[#777A7C] mb-6">Manually adjust clock parameters for employee records.</p>
            <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Employee ID *</label>
                <select
                  value={formRecord.employeeId}
                  onChange={e => setFormRecord(p => ({ ...p, employeeId: e.target.value }))}
                  required disabled={isEditModalOpen}
                  className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Date *</label>
                <input type="date" value={formRecord.date} onChange={e => setFormRecord(p => ({ ...p, date: e.target.value }))} required
                  className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Check In</label>
                  <input type="text" value={formRecord.checkIn} onChange={e => setFormRecord(p => ({ ...p, checkIn: e.target.value }))} placeholder="09:00 AM"
                    className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Check Out</label>
                  <input type="text" value={formRecord.checkOut} onChange={e => setFormRecord(p => ({ ...p, checkOut: e.target.value }))} placeholder="06:00 PM"
                    className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Status</label>
                  <select value={formRecord.status} onChange={e => setFormRecord(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors">
                    <option>Present</option><option>Late</option><option>Absent</option>
                    <option>Half Day</option><option>Work From Home</option><option>On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Location</label>
                  <input type="text" value={formRecord.location} onChange={e => setFormRecord(p => ({ ...p, location: e.target.value }))} placeholder="Office"
                    className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F7F5F1] transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-[#7FAF3F] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#668F2F] transition-all cursor-pointer shadow-md active:scale-95">
                  Confirm Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REJECT CONFIRMATION MODAL ─── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#E56B65]/10 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-[#E56B65]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#2D3032]">Reject Request</h2>
                <p className="text-xs text-[#777A7C]">For {rejectModal.name}</p>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Reason (optional)</label>
              <textarea
                value={rejectComment}
                onChange={e => setRejectComment(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={3}
                className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#E56B65] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F7F5F1] transition-all cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!!actioningId}
                className="flex-1 bg-[#E56B65] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#C94E49] transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-60"
              >
                {actioningId ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Rejecting...</span> : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
