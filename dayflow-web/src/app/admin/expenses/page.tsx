"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronRight, Wallet, Users, BarChart, Clock } from 'lucide-react';
import { getAdminReimbursements } from '@/services/api';

export default function AdminExpensesDashboard() {
  const router = useRouter();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const loadClaims = async () => {
    setLoading(true);
    try {
      const data = await getAdminReimbursements();
      data.sort((a: any, b: any) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      });
      setClaims(data);
    } catch (e) {
      console.error("Failed to load admin claims list:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const getFilteredClaims = () => {
    return claims.filter(c => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesDept = deptFilter === 'all' || c.employee_department.toLowerCase() === deptFilter.toLowerCase();
      const matchesDate = !dateFilter || c.submitted_at.startsWith(dateFilter);
      
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        c.employee_name.toLowerCase().includes(search) ||
        c.employee_id.toLowerCase().includes(search) ||
        c.tour_title.toLowerCase().includes(search) ||
        c.id.toLowerCase().includes(search);

      return matchesStatus && matchesDept && matchesDate && matchesSearch;
    });
  };

  const filtered = getFilteredClaims();

  const totalClaims = claims.length;
  const pendingClaims = claims.filter(c => c.status === 'pending').length;
  const approvedSum = claims
    .filter(c => c.status === 'approved' || c.status === 'partially_approved')
    .reduce((sum, c) => sum + c.approved_total, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-[#B5F12C]/12 text-[#151413]';
      case 'partially_approved':
        return 'bg-[#CAB5F5]/12 text-[#412A6E]';
      case 'rejected':
        return 'bg-[#E96C6C]/12 text-[#6E1F1F]';
      default:
        return 'bg-[#FAA276]/12 text-[#6B3012] font-semibold animate-pulse';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      
      <div className="mb-2">
        <h1 className="text-[28px] font-semibold text-[#2D3032]">Expense Claims Management</h1>
        <p className="text-[#777A7C] text-sm mt-1">Review and process tour expense reimbursement requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#777A7C] mb-2 uppercase tracking-wider">Pending Approvals</div>
            <div className="text-3xl font-black text-[#FAA276] tracking-tight">{pendingClaims}</div>
            <div className="text-[10px] text-[#9A9C9D] mt-1">Requires HR validation</div>
          </div>
          <div className="w-12 h-12 bg-[#FAA276]/10 text-[#FAA276] rounded-xl flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#777A7C] mb-2 uppercase tracking-wider">Total Claims</div>
            <div className="text-3xl font-black text-[#2D3032] tracking-tight">{totalClaims}</div>
            <div className="text-[10px] text-[#9A9C9D] mt-1">All employee submissions</div>
          </div>
          <div className="w-12 h-12 bg-[#CAB5F5]/10 text-[#CAB5F5] rounded-xl flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#777A7C] mb-2 uppercase tracking-wider">Total Reimbursed</div>
            <div className="text-3xl font-black text-brand-green tracking-tight">₹{approvedSum.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-[#9A9C9D] mt-1">Added to payslip slips</div>
          </div>
          <div className="w-12 h-12 bg-[#B5F12C]/10 text-[#B5F12C] rounded-xl flex items-center justify-center">
            <Wallet size={20} />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E6E3DE] shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9C9D]" />
          <input 
            type="text" 
            placeholder="Search by Employee, Tour, or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg pl-10 pr-4 py-2.5 text-xs font-semibold text-[#2D3032] outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#E6E3DE] rounded-lg px-2.5 py-1">
            <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mr-1">Status</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-[#2D3032] outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="partially_approved">Partially Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#E6E3DE] rounded-lg px-2.5 py-1">
            <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mr-1">Dept</span>
            <select 
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-[#2D3032] outline-none cursor-pointer"
            >
              <option value="all">All Depts</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
              <option value="Product">Product</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#E6E3DE] rounded-lg px-2.5 py-1">
            <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mr-1">Submitted On</span>
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-[#2D3032] outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-[#E6E3DE] shadow-sm p-6 overflow-hidden">
        {loading ? (
          <div className="text-center p-12 text-[#777A7C] text-xs">Loading employee claims...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-16 text-[#777A7C]">
            <p className="text-xs font-semibold text-[#2D3032]">No claims match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-[#2D3032] border-collapse">
              <thead>
                <tr className="border-b border-[#E6E3DE] text-left text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Claim ID</th>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Tour Title</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4 text-right">Claimed (₹)</th>
                  <th className="p-4 text-right">Approved (₹)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((claim) => (
                  <tr 
                    key={claim.id} 
                    className={`hover:bg-[#FAF7F2]/50 transition-colors ${
                      claim.status === 'pending' ? 'bg-[#FAA276]/5 border-l-4 border-l-[#FAA276]' : ''
                    }`}
                  >
                    <td className="p-4 font-mono font-bold text-gray-500">{claim.id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-text-primary">{claim.employee_name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{claim.employee_id} • {claim.employee_department}</div>
                    </td>
                    <td className="p-4 font-semibold text-text-primary">
                      {claim.tour_title}
                      <div className="text-[10px] text-gray-400 mt-0.5">{claim.destination}</div>
                    </td>
                    <td className="p-4 text-[#777A7C]">
                      {new Date(claim.submitted_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 text-right font-bold">
                      ₹{claim.claimed_total.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right font-bold text-brand-green">
                      {claim.status === 'pending' ? '—' : `₹${claim.approved_total.toLocaleString('en-IN')}`}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase ${getStatusBadge(claim.status)}`}>
                        {claim.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => router.push(`/admin/expenses/${claim.id}`)}
                        className="flex items-center gap-1.5 bg-[#FAF7F2] hover:bg-[#E6E3DE] text-[#2D3032] py-2 px-4 rounded-xl border border-[#E6E3DE] text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Review <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
