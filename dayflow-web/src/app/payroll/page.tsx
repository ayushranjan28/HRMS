"use client";
import React, { useState, useEffect } from 'react';
import { 
  Download, Wallet, Landmark, BadgePercent, MapPin, Search
} from 'lucide-react';
import { getPayrollData } from '@/services/api';

export default function PayrollPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getPayrollData();
        
        // The backend returns { current, history } for employees
        if (result && result.current && Array.isArray(result.history)) {
          setData(result);
        } else {
          // Fallback mock data if API returns empty array or different structure
          setData({
            current: {
              month: 'July 2024',
              paidOn: 'July 28, 2024',
              netSalary: '₹4,250.00',
              earnings: { total: '₹5,000.00', basic: '₹3,500.00', house: '₹800.00', conveyance: '₹200.00', other: '₹500.00' },
              deductions: { total: '₹750.00', providentFund: '₹250.00', professionalTax: '₹50.00', incomeTax: '₹400.00', other: '₹50.00' }
            },
            history: [
              { month: 'June 2024', amount: '₹4,250.00' },
              { month: 'May 2024', amount: '₹4,250.00' }
            ]
          });
        }
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

  const activeRecord = selectedRecord || data.current;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-semibold text-[#2D3032]">Payroll – My Payslip</h1>
        <button 
          onClick={() => setSelectedRecord(null)}
          className={`text-xs font-medium px-4 py-1.5 rounded-lg transition-colors ${!selectedRecord ? 'bg-[#7FAF3F] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          View Current Month
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Salary Card */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl p-8 border border-[#E6E3DE] shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="text-sm font-semibold text-[#777A7C] mb-1">{activeRecord.month}</div>
            <div className="text-xs font-medium text-[#9A9C9D] mb-6">Paid on {activeRecord.paidOn}</div>
            <div className="text-[13px] font-medium text-[#777A7C] mb-1">Net Salary</div>
            <div className="text-4xl font-bold text-[#2D3032] tracking-tight">{activeRecord.netSalary}</div>
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
            <div className="text-2xl font-bold text-[#2D3032] mb-6">{activeRecord.earnings.total}</div>
            
            <div className="space-y-4 text-sm mt-auto">
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Basic Salary</span>
                <span className="font-semibold text-[#2D3032]">{activeRecord.earnings.basic}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">House Allowance</span>
                <span className="font-semibold text-[#2D3032]">{activeRecord.earnings.house || '₹0.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Conveyance</span>
                <span className="font-semibold text-[#2D3032]">{activeRecord.earnings.conveyance || '₹0.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Other Allowances</span>
                <span className="font-semibold text-[#2D3032]">{activeRecord.earnings.other}</span>
              </div>
              {activeRecord.earnings.tourReimbursement && (
                <div className="flex justify-between items-center bg-[#B5F12C]/10 p-2.5 rounded-lg border border-[#B5F12C]/20 mt-1">
                  <span className="text-brand-green font-bold">Tour Reimbursement</span>
                  <span className="font-extrabold text-[#151413]">{activeRecord.earnings.tourReimbursement}</span>
                </div>
              )}
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col">
            <h3 className="text-xs font-semibold text-[#777A7C] mb-1 uppercase tracking-wider">Deductions</h3>
            <div className="text-2xl font-bold text-[#E56B65] mb-6">{activeRecord.deductions.total}</div>
            
            <div className="space-y-4 text-sm mt-auto">
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Provident Fund</span>
                <span className="font-semibold text-[#2D3032]">{activeRecord.deductions.providentFund}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Professional Tax</span>
                <span className="font-semibold text-[#2D3032]">{activeRecord.deductions.professionalTax || '₹200.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Income Tax</span>
                <span className="font-semibold text-[#2D3032]">{activeRecord.deductions.incomeTax}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777A7C] font-medium">Other Deductions</span>
                <span className="font-semibold text-[#2D3032]">{activeRecord.deductions.other}</span>
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
            <div 
              key={i} 
              onClick={() => setSelectedRecord(record)}
              className={`flex flex-col items-center justify-center p-5 rounded-xl border transition-colors group cursor-pointer ${selectedRecord?.month === record.month ? 'border-[#7FAF3F] bg-[#7FAF3F]/5' : 'border-[#E6E3DE] hover:border-[#7FAF3F]'}`}
            >
              <div className="text-xs font-medium text-[#777A7C] mb-2">{record.month}</div>
              <div className="text-lg font-bold text-[#2D3032] mb-4">{record.amount}</div>
              <button className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-opacity ${selectedRecord?.month === record.month ? 'text-[#7FAF3F] bg-[#7FAF3F]/10 opacity-100' : 'text-[#7FAF3F] bg-[#7FAF3F]/10 opacity-0 group-hover:opacity-100'}`}>
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
