"use client";
import React, { useState, useEffect } from 'react';
import { 
  Download, Wallet, Landmark, BadgePercent, MapPin, Search
} from 'lucide-react';
import { getPayrollData } from '@/services/api';

export default function PayrollPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getPayrollData();
        setData(result);
      } catch (error) {
        console.error("Failed to load payroll data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-[#777A7C]">Loading payroll data...</div>;
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-semibold text-[#2D3032]">Payroll – My Payslip</h1>
        <button className="flex items-center gap-2 bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-xs font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Download Payslip
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Salary Card */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl p-8 border border-[#E6E3DE] shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="text-sm font-semibold text-[#777A7C] mb-1">{data.current.month}</div>
            <div className="text-xs font-medium text-[#9A9C9D] mb-6">Paid on {data.current.paidOn}</div>
            <div className="text-[13px] font-medium text-[#777A7C] mb-1">Net Salary</div>
            <div className="text-4xl font-bold text-[#2D3032] tracking-tight">{data.current.netSalary}</div>
          </div>
          <div className="self-end w-16 h-16 rounded-2xl bg-[#7A70C7]/10 flex items-center justify-center text-[#7A70C7]">
            <Wallet className="w-8 h-8" strokeWidth={1.5} />
          </div>
        </div>

        {/* Breakdown Cards */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-6">
          {/* Earnings */}
          <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col">
            <h3 className="text-xs font-semibold text-[#777A7C] mb-1 uppercase tracking-wider">Earnings</h3>
            <div className="text-2xl font-bold text-[#2D3032] mb-6">{data.current.earnings.total}</div>
            
            <div className="space-y-4 text-sm mt-auto">
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Basic Salary</span>
                <span className="font-semibold text-[#2D3032]">{data.current.earnings.basic}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">House Allowance</span>
                <span className="font-semibold text-[#2D3032]">{data.current.earnings.house}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Conveyance</span>
                <span className="font-semibold text-[#2D3032]">{data.current.earnings.conveyance}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Other Allowances</span>
                <span className="font-semibold text-[#2D3032]">{data.current.earnings.other}</span>
              </div>
              {data.current.earnings.tourReimbursement && (
                <div className="flex justify-between items-center bg-[#B5F12C]/10 p-2.5 rounded-lg border border-[#B5F12C]/20 mt-1">
                  <span className="text-brand-green font-bold">Tour Reimbursement</span>
                  <span className="font-extrabold text-[#151413]">{data.current.earnings.tourReimbursement}</span>
                </div>
              )}
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col">
            <h3 className="text-xs font-semibold text-[#777A7C] mb-1 uppercase tracking-wider">Deductions</h3>
            <div className="text-2xl font-bold text-[#E56B65] mb-6">{data.current.deductions.total}</div>
            
            <div className="space-y-4 text-sm mt-auto">
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Provident Fund</span>
                <span className="font-semibold text-[#2D3032]">{data.current.deductions.providentFund}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Professional Tax</span>
                <span className="font-semibold text-[#2D3032]">{data.current.deductions.professionalTax}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Income Tax</span>
                <span className="font-semibold text-[#2D3032]">{data.current.deductions.incomeTax}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Other Deductions</span>
                <span className="font-semibold text-[#2D3032]">{data.current.deductions.other}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm mt-2">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[15px] font-semibold text-[#2D3032]">Payslip History</h2>
          <button className="text-xs font-medium text-[#777A7C] hover:text-[#2D3032]">View all</button>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {data.history.map((record: any, i: number) => (
            <div key={i} className="flex flex-col items-center justify-center p-5 rounded-xl border border-[#E6E3DE] hover:border-[#7FAF3F] transition-colors group">
              <div className="text-xs font-medium text-[#777A7C] mb-2">{record.month}</div>
              <div className="text-lg font-bold text-[#2D3032] mb-4">{record.amount}</div>
              <button className="text-xs font-semibold text-[#7FAF3F] bg-[#7FAF3F]/10 px-4 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
