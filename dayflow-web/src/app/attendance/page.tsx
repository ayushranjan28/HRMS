"use client";
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FilePen, CheckCircle, XCircle, Clock, Loader2, X } from 'lucide-react';
import * as api from '@/services/api';

const STATUS_STYLES: Record<string, string> = {
  Present:   'bg-[#7FAF3F]/10 text-[#7FAF3F]',
  'Half Day':'bg-[#E5A83B]/10 text-[#E5A83B]',
  'On Leave':'bg-[#7A70C7]/10 text-[#7A70C7]',
  Absent:    'bg-[#E56B65]/10 text-[#E56B65]',
};

const CORRECTION_STYLES: Record<string, string> = {
  PENDING:  'bg-[#E5A83B]/10 text-[#E5A83B]',
  APPROVED: 'bg-[#7FAF3F]/10 text-[#7FAF3F]',
  REJECTED: 'bg-[#E56B65]/10 text-[#E56B65]',
};

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end   = new Date(year, month + 1, 0);
  return {
    startStr: start.toISOString().split('T')[0],
    endStr:   end.toISOString().split('T')[0],
    label: start.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  };
}

export default function AttendancePage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [records,      setRecords]      = useState<any[]>([]);
  const [corrections,  setCorrections]  = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [toastMsg,     setToastMsg]     = useState<{ type: 'success'|'error'; text: string }|null>(null);

  // Modal state
  const [showModal,   setShowModal]   = useState(false);
  const [formDate,    setFormDate]    = useState('');
  const [formStatus,  setFormStatus]  = useState('Present');
  const [formReason,  setFormReason]  = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const { startStr, label } = getMonthRange(year, month);

  const showToast = (type: 'success'|'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dayflow_user') || '{}') : {};
      const [atts, corrs] = await Promise.all([
        api.getAttendance({ employeeId: user.employeeId }),
        api.getRegularizations(),
      ]);
      // Filter to selected month
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      setRecords((atts || []).filter((r: any) => r.date?.startsWith(monthStr)));
      setCorrections(corrs || []);
    } catch {
      showToast('error', 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formReason.trim()) {
      showToast('error', 'Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitRegularization({ date: formDate, requestedStatus: formStatus, reason: formReason.trim() });
      showToast('success', 'Correction request submitted!');
      setShowModal(false);
      setFormDate(''); setFormReason(''); setFormStatus('Present');
      loadData();
    } catch {
      showToast('error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // KPIs
  const presentCount  = records.filter(r => r.status === 'Present').length;
  const leaveCount    = records.filter(r => r.status === 'On Leave').length;
  const workingDays   = records.length;
  const pendingCorrs  = corrections.filter(c => c.status === 'PENDING').length;

  const handleExport = () => {
    if (!records.length) return;
    const headers = ['Date','Check In','Check Out','Work Hours','Status'];
    const rows = records.map(r => [r.date, r.checkIn, r.checkOut, r.totalHours, r.status]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `Attendance_${label.replace(' ', '_')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto relative">
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 rounded-2xl px-6 py-4 text-white text-sm font-semibold shadow-2xl transition-all ${
          toastMsg.type === 'success' ? 'bg-[#7FAF3F]' : 'bg-[#E56B65]'
        }`}>{toastMsg.text}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-[28px] font-semibold text-[#2D3032]">My Attendance</h1>
          <p className="text-[#777A7C] text-sm mt-1">View your clock-in history and request corrections.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#7FAF3F] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#668F2F] transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <FilePen className="w-4 h-4" /> Regularize Attendance
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-xs font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Days Present',     value: presentCount,  color: '#7FAF3F' },
          { label: 'On Leave',         value: leaveCount,    color: '#7A70C7' },
          { label: 'Working Days',     value: workingDays,   color: '#2D3032' },
          { label: 'Pending Requests', value: pendingCorrs,  color: '#E5A83B' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-[#E6E3DE] shadow-sm">
            <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block mb-2">{k.label}</span>
            <span className="text-2xl font-bold" style={{ color: k.value > 0 ? k.color : undefined }}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col gap-6">
        {/* Month Nav */}
        <div className="flex items-center gap-4 border-b border-[#E6E3DE] pb-6">
          <div className="flex items-center border border-[#E6E3DE] rounded-lg bg-white overflow-hidden shadow-sm shrink-0">
            <button onClick={prevMonth} className="px-3 py-2 hover:bg-[#F7F5F1] border-r border-[#E6E3DE] transition-colors">
              <ChevronLeft className="w-4 h-4 text-[#2D3032]" />
            </button>
            <span className="px-4 py-2 text-sm font-semibold text-[#2D3032] min-w-[160px] text-center">{label}</span>
            <button onClick={nextMonth} className="px-3 py-2 hover:bg-[#F7F5F1] border-l border-[#E6E3DE] transition-colors">
              <ChevronRight className="w-4 h-4 text-[#2D3032]" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center flex flex-col items-center gap-2 text-[#777A7C]">
            <Loader2 className="w-6 h-6 animate-spin text-[#7FAF3F]" />
            <span className="text-sm font-semibold">Loading attendance records...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base font-bold text-[#2D3032]">No records for {label}</p>
            <p className="text-xs text-[#777A7C] mt-1">Clock-in logs for this month will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[#9A9C9D] text-xs border-b border-[#E6E3DE]">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Check In</th>
                  <th className="pb-3 font-semibold">Check Out</th>
                  <th className="pb-3 font-semibold">Work Hours</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Correct</th>
                </tr>
              </thead>
              <tbody className="text-[#2D3032]">
                {records.map((row, i) => (
                  <tr key={i} className="border-b border-[#E6E3DE] last:border-0 hover:bg-[#F7F5F1]/50 transition-colors">
                    <td className="py-4 font-semibold">{row.date}</td>
                    <td className="py-4 text-[#777A7C] font-medium">{row.checkIn || '--'}</td>
                    <td className="py-4 text-[#777A7C] font-medium">{row.checkOut || '--'}</td>
                    <td className="py-4 font-bold">{row.totalHours || '--'}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${STATUS_STYLES[row.status] || 'bg-gray-100 text-gray-600'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {(row.status === 'Absent' || row.checkIn === '--') && (
                        <button
                          onClick={() => { setFormDate(row.date); setShowModal(true); }}
                          className="text-[#7FAF3F] hover:text-[#668F2F] text-xs font-bold cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <FilePen className="w-3.5 h-3.5" /> Request
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Correction Requests History */}
      {corrections.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm">
          <h2 className="text-base font-bold text-[#2D3032] mb-4">My Correction Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[#9A9C9D] text-xs border-b border-[#E6E3DE]">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Current → Requested</th>
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody className="text-[#2D3032] divide-y divide-[#E6E3DE]">
                {corrections.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7F5F1]/50 transition-colors">
                    <td className="py-3 font-semibold">{c.date}</td>
                    <td className="py-3 text-xs text-[#777A7C]">
                      <span className="font-semibold text-[#E56B65]">{c.currentStatus}</span>
                      <span className="mx-1.5">→</span>
                      <span className="font-semibold text-[#7FAF3F]">{c.requestedStatus}</span>
                    </td>
                    <td className="py-3 text-xs text-[#777A7C] max-w-[200px] truncate">{c.reason}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${CORRECTION_STYLES[c.status]}`}>
                        {c.status === 'PENDING'  && <Clock       className="w-2.5 h-2.5" />}
                        {c.status === 'APPROVED' && <CheckCircle className="w-2.5 h-2.5" />}
                        {c.status === 'REJECTED' && <XCircle     className="w-2.5 h-2.5" />}
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-[#777A7C]">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== REGULARIZATION MODAL ========== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative">
            <button
              onClick={() => { setShowModal(false); setFormDate(''); setFormReason(''); setFormStatus('Present'); }}
              className="absolute top-5 right-5 text-[#777A7C] hover:text-[#2D3032] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#2D3032]">Request Attendance Correction</h2>
              <p className="text-xs text-[#777A7C] mt-1">Submit a regularization request for a missed or incorrect attendance entry.</p>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Requested Status *</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value)}
                  className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                >
                  <option value="Present">Present</option>
                  <option value="Half Day">Half Day</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Reason *</label>
                <textarea
                  value={formReason}
                  onChange={e => setFormReason(e.target.value)}
                  placeholder="e.g. Forgot to check in, system was down..."
                  rows={3}
                  required
                  className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormDate(''); setFormReason(''); }}
                  className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F7F5F1] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#7FAF3F] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#668F2F] transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</span> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
