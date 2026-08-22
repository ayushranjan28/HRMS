"use client";
import React, { useState } from 'react';
import { Search, Filter, Check, X, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';

const mockLeaveRequests = [
  { id: 'REQ001', employee: 'Robert Fox', role: 'Marketing', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024a', type: 'Paid Time Off', dates: '22 Oct - 25 Oct 2025', days: 4, reason: 'Family vacation', appliedOn: '18 Oct 2025' },
  { id: 'REQ002', employee: 'Cody Fisher', role: 'HR Manager', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024b', type: 'Sick Leave', dates: '10 Nov 2025', days: 1, reason: 'Not feeling well', appliedOn: '10 Nov 2025', attachment: true },
  { id: 'REQ003', employee: 'Leslie Alexander', role: 'QA Tester', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024g', type: 'Unpaid Leave', dates: '01 Dec - 05 Dec 2025', days: 5, reason: 'Personal errands', appliedOn: '15 Nov 2025' },
];

export default function LeaveApprovalsPage() {
  const [requests, setRequests] = useState(mockLeaveRequests);
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean, reqId: string | null, action: 'approve' | 'reject' | null }>({ isOpen: false, reqId: null, action: null });
  const [comment, setComment] = useState('');

  const openReview = (reqId: string, action: 'approve' | 'reject') => {
    setReviewModal({ isOpen: true, reqId, action });
    setComment('');
  };

  const handleConfirm = () => {
    // In a real app, this would send an API request to the backend database
    setRequests(requests.filter(req => req.id !== reviewModal.reqId));
    setReviewModal({ isOpen: false, reqId: null, action: null });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-semibold text-[#2D3032]">Leave Approvals</h1>
          <p className="text-[#777A7C] text-sm mt-1">Review and manage employee time-off requests.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#E6E3DE] shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9C9D]" />
          <input 
            type="text" 
            placeholder="Search by employee name..." 
            className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg pl-10 pr-4 py-2 text-sm font-medium text-[#2D3032] outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors">
            <Filter className="w-4 h-4 text-[#777A7C]" /> Filter
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-[#E6E3DE] shadow-sm overflow-hidden">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarIcon className="w-12 h-12 text-[#9A9C9D] mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-[#2D3032]">All caught up!</h3>
            <p className="text-sm text-[#777A7C] mt-1">There are no pending leave requests to review.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#F7F5F1] text-[#777A7C] text-xs uppercase tracking-wider border-b border-[#E6E3DE]">
                <th className="py-4 px-6 font-semibold">Employee</th>
                <th className="py-4 px-6 font-semibold">Leave Type</th>
                <th className="py-4 px-6 font-semibold">Duration</th>
                <th className="py-4 px-6 font-semibold">Reason</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[#2D3032] divide-y divide-[#E6E3DE]">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-[#F7F5F1]/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img src={req.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-[#E6E3DE]" />
                      <div>
                        <div className="font-bold">{req.employee}</div>
                        <div className="text-[11px] text-[#777A7C] font-medium">{req.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold">{req.type}</span>
                    {req.attachment && <span className="block text-[10px] text-[#3B82F6] font-bold mt-1">📄 Medical Cert Attached</span>}
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-[#2D3032]">{req.days} Day{req.days > 1 ? 's' : ''}</div>
                    <div className="text-[11px] text-[#777A7C] mt-0.5">{req.dates}</div>
                  </td>
                  <td className="py-4 px-6 max-w-[200px]">
                    <div className="truncate text-sm" title={req.reason}>{req.reason}</div>
                    <div className="text-[10px] text-[#9A9C9D] mt-0.5">Applied: {req.appliedOn}</div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openReview(req.id, 'reject')}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#E56B65] hover:bg-[#E56B65]/10 transition-colors"
                        title="Reject"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => openReview(req.id, 'approve')}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#7FAF3F] hover:bg-[#7FAF3F]/10 transition-colors"
                        title="Approve"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review/Comment Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reviewModal.action === 'approve' ? 'bg-[#7FAF3F]/10 text-[#7FAF3F]' : 'bg-[#E56B65]/10 text-[#E56B65]'}`}>
                {reviewModal.action === 'approve' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#2D3032]">
                  {reviewModal.action === 'approve' ? 'Approve Leave' : 'Reject Leave'}
                </h2>
                <p className="text-xs text-[#777A7C]">This action will be sent to the database.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#777A7C] mb-2">
                  <MessageSquare className="w-3.5 h-3.5" /> Add Comment (Optional)
                </label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter remarks for the employee..."
                  rows={4}
                  className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#2D3032] rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setReviewModal({ isOpen: false, reqId: null, action: null })}
                  className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-lg text-sm font-semibold hover:bg-[#F7F5F1] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirm}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
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
