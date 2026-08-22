"use client";
import React, { useEffect, useState } from 'react';
import { Search, Filter, Check, X, Calendar as CalendarIcon, MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import * as api from '@/services/api';

export default function LeaveApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('Pending');

  // Modal Control
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean, reqId: string | null, action: 'approve' | 'reject' | null }>({ isOpen: false, reqId: null, action: null });
  const [comment, setComment] = useState('');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaves();
      setRequests(data || []);
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to retrieve leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const openReview = (reqId: string, action: 'approve' | 'reject') => {
    setReviewModal({ isOpen: true, reqId, action });
    setComment('');
  };

  const handleConfirm = async () => {
    if (!reviewModal.reqId || !reviewModal.action) return;

    if (reviewModal.action === 'reject' && !comment.trim()) {
      showToast('error', 'A rejection comment is required.');
      return;
    }

    try {
      if (reviewModal.action === 'approve') {
        await api.approveLeave(reviewModal.reqId, comment);
        showToast('success', 'Leave request approved!');
      } else {
        await api.rejectLeave(reviewModal.reqId, comment);
        showToast('success', 'Leave request rejected');
      }
      setReviewModal({ isOpen: false, reqId: null, action: null });
      loadRequests();
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || 'Failed to update leave request';
      showToast('error', errorMsg);
    }
  };

  // Filter requests
  const filtered = requests.filter(req => {
    const nameMatch = req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      req.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const typeMatch = selectedType === 'All' || req.leaveType === selectedType;
    const statusMatch = selectedStatus === 'All' || req.status.toLowerCase() === selectedStatus.toLowerCase();

    return nameMatch && typeMatch && statusMatch;
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
          <h1 className="text-[28px] font-semibold text-[#2D3032]">Leave Approvals</h1>
          <p className="text-[#777A7C] text-sm mt-1">Review and manage employee time-off requests.</p>
        </div>
        <button 
          onClick={loadRequests}
          className="p-2.5 bg-white border border-[#E6E3DE] rounded-lg hover:bg-[#F7F5F1] transition-all cursor-pointer w-fit ml-auto"
          title="Refresh list"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E6E3DE] shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9C9D]" />
          <input 
            type="text" 
            placeholder="Search by employee name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg pl-10 pr-4 py-2 text-sm font-medium text-[#2D3032] outline-none transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors outline-none cursor-pointer"
          >
            <option value="All">All Leave Types</option>
            <option value="Paid Time Off">Paid Time Off</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Unpaid Leave">Unpaid Leave</option>
            <option value="Casual Leave">Casual Leave</option>
          </select>

          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-[#E6E3DE] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-[#777A7C] font-semibold text-sm flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#7FAF3F]" />
            <span>Loading requests...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarIcon className="w-12 h-12 text-[#9A9C9D] mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-[#2D3032]">No leave requests</h3>
            <p className="text-sm text-[#777A7C] mt-1">There are no matching leave requests to display.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-[#F7F5F1] text-[#777A7C] text-xs uppercase tracking-wider border-b border-[#E6E3DE]">
                  <th className="py-4 px-6 font-semibold">Employee</th>
                  <th className="py-4 px-6 font-semibold">Leave Type</th>
                  <th className="py-4 px-6 font-semibold">Duration</th>
                  <th className="py-4 px-6 font-semibold">Reason</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[#2D3032] divide-y divide-[#E6E3DE]">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F7F5F1]/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={req.avatar || 'https://i.pravatar.cc/150'} 
                          alt="" 
                          className="w-9 h-9 rounded-full object-cover border border-[#E6E3DE]" 
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://i.pravatar.cc/150'; }}
                        />
                        <div>
                          <div className="font-bold text-sm text-[#2D3032]">{req.employeeName}</div>
                          <div className="text-[10px] text-[#777A7C] font-semibold">{req.role} • {req.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-xs text-[#2D3032]">{req.leaveType}</span>
                      {req.attachment && <span className="block text-[9px] text-[#3B82F6] font-bold mt-1">📄 Medical Certificate</span>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-xs text-[#2D3032]">{req.duration} Day{req.duration > 1 ? 's' : ''}</div>
                      <div className="text-[10px] text-[#777A7C] mt-0.5">{req.startDate} to {req.endDate}</div>
                    </td>
                    <td className="py-4 px-6 max-w-[220px] truncate" title={req.reason}>
                      <div className="text-xs font-semibold text-[#2D3032]">{req.reason}</div>
                      <div className="text-[9px] text-[#9A9C9D] mt-0.5">Applied: {req.appliedAt}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        req.status === 'Approved' ? 'bg-[#7FAF3F]/10 text-[#7FAF3F]' :
                        req.status === 'Pending' ? 'bg-[#E5A83B]/10 text-[#E5A83B]' :
                        'bg-[#E56B65]/10 text-[#E56B65]'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openReview(req.id, 'reject')}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#E56B65] hover:bg-[#E56B65]/10 transition-colors cursor-pointer"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openReview(req.id, 'approve')}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#7FAF3F] hover:bg-[#7FAF3F]/10 transition-colors cursor-pointer"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-[#9A9C9D] uppercase tracking-wider">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review/Comment Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reviewModal.action === 'approve' ? 'bg-[#7FAF3F]/10 text-[#7FAF3F]' : 'bg-[#E56B65]/10 text-[#E56B65]'}`}>
                {reviewModal.action === 'approve' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#2D3032]">
                  {reviewModal.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}
                </h2>
                <p className="text-xs text-[#777A7C]">Submit your final status assessment.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#777A7C] mb-2">
                  <MessageSquare className="w-3.5 h-3.5" /> Comments/Rejection Reason {reviewModal.action === 'reject' && '*'}
                </label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={reviewModal.action === 'approve' ? "Optional remarks for the employee..." : "Reason for rejection (Required)..."}
                  rows={4}
                  required={reviewModal.action === 'reject'}
                  className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#2D3032] rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setReviewModal({ isOpen: false, reqId: null, action: null })}
                  className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F7F5F1] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirm}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer ${
                    reviewModal.action === 'approve' ? 'bg-[#7FAF3F] hover:bg-[#668F2F]' : 'bg-[#E56B65] hover:bg-[#C9534E]'
                  }`}
                >
                  Confirm {reviewModal.action === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
