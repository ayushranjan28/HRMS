"use client";
import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Clock, Calendar, CheckCircle, 
  XCircle, Filter, Download
} from 'lucide-react';
import { getLeaveData } from '@/services/api';

export default function LeavePage() {
  const [activeTab, setActiveTab] = useState<'my' | 'apply'>('apply');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getLeaveData();
        setData(result);
      } catch (error) {
        console.error("Failed to load leave data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-[#777A7C]">Loading leave data...</div>;
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-semibold text-[#2D3032]">
          Leave & Time-off {activeTab === 'my' ? '– My Leave Requests' : '– Apply Leave'}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-[#E6E3DE]">
        <button 
          onClick={() => setActiveTab('my')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'my' ? 'text-[#7FAF3F]' : 'text-[#777A7C] hover:text-[#2D3032]'}`}
        >
          My Leaves
          {activeTab === 'my' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7FAF3F] rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('apply')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'apply' ? 'text-[#7FAF3F]' : 'text-[#777A7C] hover:text-[#2D3032]'}`}
        >
          Apply Leave
          {activeTab === 'apply' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7FAF3F] rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'apply' ? <ApplyLeave balances={data.balances} /> : <MyLeaves history={data.history} />}
    </div>
  );
}

function ApplyLeave({ balances }: { balances: any }) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: Leave Balances */}
      <div className="col-span-4 bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col h-fit">
        <h2 className="text-[15px] font-semibold text-[#2D3032] mb-6">Leave Balance</h2>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#7FAF3F]/10 flex items-center justify-center text-[#7FAF3F] shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-[#2D3032]">Paid Leave</span>
                <span className="text-[#2D3032] font-semibold">{balances.paid.used} <span className="text-[#9A9C9D] font-normal">/ {balances.paid.total} days</span></span>
              </div>
              <div className="h-1.5 bg-[#F7F5F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#7FAF3F] rounded-full" style={{ width: balances.paid.percentage }}></div>
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
                <span className="text-[#2D3032] font-semibold">{balances.sick.used} <span className="text-[#9A9C9D] font-normal">/ {balances.sick.total} days</span></span>
              </div>
              <div className="h-1.5 bg-[#F7F5F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#E5A83B] rounded-full" style={{ width: balances.sick.percentage }}></div>
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
                <span className="text-[#2D3032] font-semibold">{balances.unpaid.used} <span className="text-[#9A9C9D] font-normal">/ {balances.unpaid.total} days</span></span>
              </div>
              <div className="h-1.5 bg-[#F7F5F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#7A70C7] rounded-full" style={{ width: balances.unpaid.percentage }}></div>
              </div>
            </div>
          </div>

           <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#67AFA5]/10 flex items-center justify-center text-[#67AFA5] shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-[#2D3032]">Comp Off</span>
                <span className="text-[#2D3032] font-semibold">{balances.compOff.used} <span className="text-[#9A9C9D] font-normal">/ {balances.compOff.total} days</span></span>
              </div>
              <div className="h-1.5 bg-[#F7F5F1] rounded-full overflow-hidden">
                <div className="h-full bg-[#67AFA5] rounded-full" style={{ width: balances.compOff.percentage }}></div>
              </div>
            </div>
          </div>
        </div>
        <button className="mt-8 w-full text-xs font-semibold text-[#2D3032] bg-[#F7F5F1] py-2.5 rounded-lg hover:bg-[#E6E3DE] transition-colors">
          View all balances →
        </button>
      </div>

      {/* Right: Application Form */}
      <div className="col-span-8 bg-white rounded-2xl p-8 border border-[#E6E3DE] shadow-sm">
        <h2 className="text-[15px] font-semibold text-[#2D3032] mb-6">Apply for Leave</h2>
        
        <form className="space-y-6 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-[#777A7C] mb-1.5">Leave Type *</label>
            <select className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-3 text-sm font-medium text-[#2D3032] outline-none transition-colors">
              <option>Paid Leave</option>
              <option>Sick Leave</option>
              <option>Unpaid Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#777A7C] mb-1.5">Date Range *</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9C9D]" />
                <input type="text" value="25 Apr 2024" readOnly className="w-full bg-[#F7F5F1] border border-transparent rounded-lg pl-9 pr-4 py-3 text-sm font-medium text-[#2D3032] outline-none" />
              </div>
              <span className="text-[#9A9C9D]">→</span>
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9C9D]" />
                <input type="text" value="27 Apr 2024" readOnly className="w-full bg-[#F7F5F1] border border-transparent rounded-lg pl-9 pr-4 py-3 text-sm font-medium text-[#2D3032] outline-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#777A7C] mb-1.5">Number of Days</label>
            <input type="text" value="3 days" readOnly className="w-full bg-white border border-[#E6E3DE] rounded-lg px-4 py-3 text-sm font-semibold text-[#2D3032] outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#777A7C] mb-1.5">Reason / Remarks *</label>
            <textarea rows={4} placeholder="Family function..." className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-3 text-sm text-[#2D3032] outline-none transition-colors resize-none"></textarea>
            <div className="text-right text-[10px] text-[#9A9C9D] mt-1">0/200</div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6E3DE]">
            <button type="button" className="px-5 py-2.5 text-sm font-semibold text-[#777A7C] hover:bg-[#F7F5F1] rounded-lg transition-colors">
              Cancel
            </button>
            <button type="button" className="px-5 py-2.5 bg-[#7FAF3F] hover:bg-[#668F2F] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MyLeaves({ history }: { history: any }) {
  const iconMap: any = { Briefcase, Clock, Calendar, CheckCircle };
  
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm">
       <div className="flex justify-end mb-5">
        <button className="flex items-center gap-2 bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-xs font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-[#9A9C9D] text-xs border-b border-[#E6E3DE]">
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Date Range</th>
            <th className="pb-3 font-medium text-center">Days</th>
            <th className="pb-3 font-medium text-center">Status</th>
            <th className="pb-3 font-medium">Applied On</th>
            <th className="pb-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="text-[#2D3032]">
          {history.map((row: any, i: number) => {
            const Icon = iconMap[row.icon] || Calendar;
            return (
              <tr key={i} className="border-b border-[#E6E3DE] last:border-0 hover:bg-[#F7F5F1]/50">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center`} style={{ backgroundColor: row.bg, color: row.color }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">{row.type}</span>
                  </div>
                </td>
                <td className="py-4 text-[#777A7C] font-medium">{row.dates}</td>
                <td className="py-4 text-center font-bold text-[#2D3032]">{row.days}</td>
                <td className="py-4 text-center">
                  {row.status === 'Approved' ? (
                    <span className="bg-[#7FAF3F]/10 text-[#7FAF3F] px-2.5 py-1 rounded-md text-[11px] font-bold">Approved</span>
                  ) : row.status === 'Pending' ? (
                    <span className="bg-[#E5A83B]/10 text-[#E5A83B] px-2.5 py-1 rounded-md text-[11px] font-bold">Pending</span>
                  ) : (
                    <span className="bg-[#E56B65]/10 text-[#E56B65] px-2.5 py-1 rounded-md text-[11px] font-bold">Rejected</span>
                  )}
                </td>
                <td className="py-4 text-[#777A7C] text-xs font-medium">{row.applied}</td>
                <td className="py-4 text-right">
                  <button className="p-1.5 rounded hover:bg-[#E6E3DE] text-[#9A9C9D] transition-colors">
                    <Filter className="w-4 h-4 opacity-50" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
