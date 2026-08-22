"use client";
import React, { useEffect, useState } from 'react';
import { Search, Filter, RefreshCw, PlusCircle, Check, FileText, Edit, Download, Loader2 } from 'lucide-react';
import * as api from '@/services/api';

export default function PayrollControl() {
  const [payroll, setPayroll] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<any>(null);

  // Form state
  const [formPay, setFormPay] = useState({
    basicSalary: 0,
    allowances: 0,
    bonus: 0,
    overtime: 0,
    tax: 0,
    pf: 0,
    otherDeductions: 0,
    status: 'Draft'
  });

  // Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPayroll({ month: selectedMonth });
      setPayroll(data || []);

      const emps = await api.getEmployees();
      setEmployees(emps || []);

      const settings = await api.getSettings();
      setDepartments(settings.departments || []);
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to retrieve payroll logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      await api.generatePayroll(selectedMonth);
      showToast('success', `Payroll sheets generated successfully for ${selectedMonth}!`);
      loadData();
    } catch (e) {
      showToast('error', 'Failed to generate payroll sheets');
      setLoading(false);
    }
  };

  const handleEditClick = (rec: any) => {
    setActiveRecord(rec);
    setFormPay({
      basicSalary: rec.basicSalary || 0,
      allowances: rec.allowances || 0,
      bonus: rec.bonus || 0,
      overtime: rec.overtime || 0,
      tax: rec.tax || 0,
      pf: rec.pf || 0,
      otherDeductions: rec.otherDeductions || 0,
      status: rec.status
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord) return;

    try {
      await api.updatePayroll(activeRecord.id, formPay);
      showToast('success', 'Payroll line item adjusted successfully!');
      setIsEditModalOpen(false);
      loadData();
    } catch (e) {
      showToast('error', 'Failed to adjust payroll');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approvePayroll(id);
      showToast('success', 'Payroll approved successfully!');
      loadData();
    } catch (e) {
      showToast('error', 'Failed to approve payroll');
    }
  };

  const handleViewPayslip = (rec: any) => {
    // Find matching employee details
    const emp = employees.find(e => e.id === rec.employeeId);
    setActiveRecord({
      ...rec,
      empPhoto: emp?.profilePhoto,
      empEmail: emp?.email,
      empPhone: emp?.phone,
      empJoining: emp?.joiningDate
    });
    setIsPayslipModalOpen(true);
  };

  const handleExportCSV = () => {
    if (payroll.length === 0) return;
    const headers = ['Employee Name', 'Employee ID', 'Department', 'Basic Salary', 'Allowances', 'Gross Salary', 'Total Deductions', 'Net Salary', 'Status'];
    const rows = payroll.map(p => [
      p.employeeName,
      p.employeeId,
      p.department,
      p.basicSalary,
      p.allowances,
      p.grossSalary,
      p.totalDeductions,
      p.netSalary,
      p.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_Payroll_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter list
  const filtered = payroll.filter(p => {
    const searchMatch = p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || p.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const deptMatch = selectedDept === 'All' || p.department === selectedDept;
    return searchMatch && deptMatch;
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
          <h1 className="text-[28px] font-semibold text-[#2D3032]">Payroll Control</h1>
          <p className="text-[#777A7C] text-sm mt-1">Manage payroll accounting, allowance parameters, and generate payslips.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-[#7FAF3F] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#668F2F] transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" /> Generate Payroll
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

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E6E3DE] shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#777A7C] uppercase tracking-wider">Period:</span>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#F7F5F1] border border-transparent rounded-lg px-4 py-1.5 text-sm font-semibold text-[#2D3032] outline-none cursor-pointer focus:border-[#7FAF3F]"
          >
            <option value="2026-07">July 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-09">September 2026</option>
          </select>
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
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-[#E6E3DE] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[#777A7C] font-semibold text-sm flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#7FAF3F]" />
            <span>Calculating Payroll...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base font-bold text-[#2D3032]">No payroll records</p>
            <p className="text-xs text-[#777A7C] mt-1">Generate payroll drafts or change period filtering.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-[#F7F5F1] text-[#777A7C] text-xs uppercase tracking-wider border-b border-[#E6E3DE]">
                  <th className="py-4 px-6 font-semibold">Employee</th>
                  <th className="py-4 px-6 font-semibold">Base Salary</th>
                  <th className="py-4 px-6 font-semibold">Allowances</th>
                  <th className="py-4 px-6 font-semibold">Overtime / Bonuses</th>
                  <th className="py-4 px-6 font-semibold">Deductions</th>
                  <th className="py-4 px-6 font-semibold">Tax & PF</th>
                  <th className="py-4 px-6 font-semibold">Net Salary</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[#2D3032] divide-y divide-[#E6E3DE]">
                {filtered.map((rec) => {
                  const otBonus = (rec.overtime || 0) + (rec.bonus || 0);
                  const taxPF = (rec.tax || 0) + (rec.pf || 0);
                  return (
                    <tr key={rec.id} className="hover:bg-[#F7F5F1]/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#2D3032]">{rec.employeeName}</div>
                        <div className="text-[10px] text-[#777A7C] font-semibold">{rec.employeeId} • {rec.department}</div>
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold">₹{rec.basicSalary?.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-xs">₹{rec.allowances?.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-xs font-medium text-[#7FAF3F]">+₹{otBonus?.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-xs text-[#E56B65] font-semibold">-₹{rec.otherDeductions?.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-xs text-[#E56B65]">-₹{taxPF?.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-sm font-bold text-[#2D3032]">₹{rec.netSalary?.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          rec.status === 'Approved' ? 'bg-[#7FAF3F]/10 text-[#7FAF3F]' :
                          'bg-[#E5A83B]/10 text-[#E5A83B]'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleViewPayslip(rec)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#777A7C] hover:bg-[#F7F5F1] transition-all cursor-pointer"
                            title="View/Print Payslip"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {rec.status !== 'Approved' && (
                            <>
                              <button 
                                onClick={() => handleEditClick(rec)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#7FAF3F] hover:bg-[#7FAF3F]/10 transition-all cursor-pointer"
                                title="Edit Pay Items"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleApprove(rec.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#7FAF3F] hover:bg-[#7FAF3F]/10 transition-all cursor-pointer"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= EDIT PAYROLL MODAL ================= */}
      {isEditModalOpen && activeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-[#2D3032] mb-1">Adjust Pay Parameters</h2>
            <p className="text-xs text-[#777A7C] mb-6">Manually adjust items for {activeRecord.employeeName}.</p>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Basic Salary (₹)</label>
                  <input type="number" value={formPay.basicSalary} onChange={(e) => setFormPay(prev => ({ ...prev, basicSalary: parseFloat(e.target.value) || 0 }))} className="w-full bg-[#F7F5F1] rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Allowances (₹)</label>
                  <input type="number" value={formPay.allowances} onChange={(e) => setFormPay(prev => ({ ...prev, allowances: parseFloat(e.target.value) || 0 }))} className="w-full bg-[#F7F5F1] rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Bonus (₹)</label>
                  <input type="number" value={formPay.bonus} onChange={(e) => setFormPay(prev => ({ ...prev, bonus: parseFloat(e.target.value) || 0 }))} className="w-full bg-[#F7F5F1] rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Overtime (₹)</label>
                  <input type="number" value={formPay.overtime} onChange={(e) => setFormPay(prev => ({ ...prev, overtime: parseFloat(e.target.value) || 0 }))} className="w-full bg-[#F7F5F1] rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Tax (₹)</label>
                  <input type="number" value={formPay.tax} onChange={(e) => setFormPay(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))} className="w-full bg-[#F7F5F1] rounded-lg px-2 py-2 text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">PF (₹)</label>
                  <input type="number" value={formPay.pf} onChange={(e) => setFormPay(prev => ({ ...prev, pf: parseFloat(e.target.value) || 0 }))} className="w-full bg-[#F7F5F1] rounded-lg px-2 py-2 text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Other Ded (₹)</label>
                  <input type="number" value={formPay.otherDeductions} onChange={(e) => setFormPay(prev => ({ ...prev, otherDeductions: parseFloat(e.target.value) || 0 }))} className="w-full bg-[#F7F5F1] rounded-lg px-2 py-2 text-xs outline-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-[#E6E3DE]">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F7F5F1] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#7FAF3F] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#668F2F] transition-all cursor-pointer active:scale-95 shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PAYSLIP PRINT MODAL ================= */}
      {isPayslipModalOpen && activeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full mx-4 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-[#E6E3DE] pb-4 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-[#2D3032] tracking-tight">Dayflow Technologies</h2>
                <p className="text-[10px] text-[#777A7C] mt-0.5">Koramangala 80 Feet Road, Bangalore, KA, India</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#7FAF3F] uppercase tracking-wider block">Official Payslip</span>
                <span className="text-[10px] text-[#777A7C] font-semibold">{activeRecord.payrollMonth} Period</span>
              </div>
            </div>

            {/* Employee metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-[#F7F5F1]/30 p-4 rounded-2xl border border-[#E6E3DE] mb-6">
              <div>
                <span className="text-[9px] font-bold text-[#777A7C] uppercase tracking-wider block">Employee Details</span>
                <span className="font-bold text-[#2D3032] block mt-0.5">{activeRecord.employeeName}</span>
                <span className="text-[#777A7C]">{activeRecord.department} • ID: {activeRecord.employeeId}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-[#777A7C] uppercase tracking-wider block">Pay Date</span>
                <span className="font-semibold text-[#2D3032] block mt-0.5">30th {activeRecord.payrollMonth.split('-')[1]}, {activeRecord.payrollMonth.split('-')[0]}</span>
                <span className="text-xs font-bold text-[#7FAF3F]">Status: APPROVED</span>
              </div>
            </div>

            {/* Earnings and Deductions details */}
            <div className="grid grid-cols-2 gap-6 border-b border-[#E6E3DE] pb-4 mb-4">
              {/* Earnings */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#7FAF3F] uppercase tracking-wider block border-b border-[#E6E3DE] pb-1">Earnings</span>
                <div className="flex justify-between text-xs">
                  <span className="text-[#777A7C]">Basic Salary</span>
                  <span className="font-semibold">₹{activeRecord.basicSalary?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-[#E6E3DE]/50">
                  <span className="text-[#777A7C] font-medium text-xs flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#E5A83B]"></div> Allowances</span>
                  <span className="font-semibold">₹{activeRecord.allowances?.toLocaleString('en-IN')}</span>
                </div>
                {activeRecord.bonus > 0 && (
                  <div className="flex justify-between items-center py-2.5 border-b border-[#E6E3DE]/50">
                    <span className="text-[#777A7C] font-medium text-xs flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7FAF3F]"></div> Bonus</span>
                    <span className="font-semibold">₹{activeRecord.bonus?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {activeRecord.overtime > 0 && (
                  <div className="flex justify-between items-center py-2.5 border-b border-[#E6E3DE]/50">
                    <span className="text-[#777A7C] font-medium text-xs flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7A70C7]"></div> Overtime</span>
                    <span className="font-semibold">₹{activeRecord.overtime?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 bg-[#F7F5F1] rounded-b-xl text-xs font-bold text-[#2D3032]">
                  <span>Gross Earnings</span>
                  <span>₹{activeRecord.grossSalary?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#E56B65] uppercase tracking-wider block border-b border-[#E6E3DE] pb-1">Deductions</span>
                <div className="p-3 text-xs">
                  <div className="flex justify-between items-center py-2.5 border-b border-[#E6E3DE]/50">
                    <span className="text-[#777A7C] font-medium text-xs flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#E56B65]"></div> Income Tax</span>
                    <span className="font-semibold">₹{activeRecord.tax?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-[#E6E3DE]/50">
                    <span className="text-[#777A7C] font-medium text-xs flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#E56B65]"></div> Provident Fund</span>
                    <span className="font-semibold">₹{activeRecord.pf?.toLocaleString('en-IN')}</span>
                  </div>
                  {activeRecord.otherDeductions > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-[#E6E3DE]/50">
                      <span className="text-[#777A7C] font-medium text-xs flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#E56B65]"></div> Other Deductions</span>
                      <span className="font-semibold">₹{activeRecord.otherDeductions?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center p-3 bg-[#E56B65]/5 rounded-b-xl text-xs font-bold text-[#E56B65]">
                  <span>Total Deductions</span>
                  <span>-₹{activeRecord.totalDeductions?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Net pay summary */}
            <div className="bg-[#7FAF3F]/10 border border-[#7FAF3F]/30 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#7FAF3F] uppercase tracking-wider block">Net Payable Amount</span>
                <span className="text-[9px] text-[#777A7C] block mt-0.5">Calculated Net = Gross - Total Deductions</span>
              </div>
              <span className="text-2xl font-bold text-[#7FAF3F]">₹{activeRecord.netSalary?.toLocaleString('en-IN')}</span>
            </div>

            {/* Modal actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-[#E6E3DE]">
              <button 
                onClick={() => setIsPayslipModalOpen(false)}
                className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F7F5F1] transition-all cursor-pointer"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-[#2D3032] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition-all cursor-pointer active:scale-95 shadow-md"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
