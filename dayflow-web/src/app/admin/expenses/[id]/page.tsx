"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, AlertTriangle, XCircle, FileText, 
  Eye, Wallet, Calendar, User, Plane, ArrowLeft, RefreshCw
} from 'lucide-react';
import { 
  getReimbursementById, saveCategoryReview, 
  finalizeReimbursement, addReimbursementToPayroll 
} from '@/services/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminClaimReviewPage({ params }: PageProps) {
  const router = useRouter();
  const { id: claimId } = use(params);

  // States
  const [claim, setClaim] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active review category state
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  
  // Working draft HR approved amounts for currently selected category
  const [draftAmounts, setDraftAmounts] = useState<{ [billId: string]: string }>({});
  const [savingCategory, setSavingCategory] = useState(false);
  const [categorySavedMsg, setCategorySavedMsg] = useState('');

  // Bill zoom lightbox navigator
  const [zoomBillIndex, setZoomBillIndex] = useState<number | null>(null);
  const [zoomBillCategory, setZoomBillCategory] = useState<string | null>(null);

  // Final Decision States
  const [hrReason, setHrReason] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Payroll Integration States
  const [showPayrollDrawer, setShowPayrollDrawer] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState('August');
  const [payrollYear, setPayrollYear] = useState('2026');
  const [submittingPayroll, setSubmittingPayroll] = useState(false);

  const loadClaimDetail = async () => {
    setLoading(true);
    try {
      const data = await getReimbursementById(claimId);
      setClaim(data.claim);
      setCategories(data.categories);
      setBills(data.bills);
    } catch (e) {
      console.error(e);
      alert("Failed to load claim details.");
      router.push('/admin/expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claimId) {
      loadClaimDetail();
    }
  }, [claimId]);

  // Load draft values when active category index changes
  useEffect(() => {
    if (categories.length > 0) {
      const activeCat = categories[activeCategoryIndex];
      const catBills = bills.filter(b => b.expense_category_id === activeCat.id);
      
      const drafts: { [billId: string]: string } = {};
      catBills.forEach(b => {
        drafts[b.id] = b.hr_approved_amount === null ? '' : String(b.hr_approved_amount);
      });
      setDraftAmounts(drafts);
      setCategorySavedMsg('');
    }
  }, [activeCategoryIndex, categories, bills]);

  if (loading || !claim) {
    return <div className="text-center p-12 text-[#777A7C] text-xs">Loading claim detail reviews...</div>;
  }

  const activeCategory = categories[activeCategoryIndex];
  const activeBills = bills.filter(b => b.expense_category_id === activeCategory.id);

  const handleHRApprovedAmountChange = (billId: string, employeeAmount: number, val: string) => {
    if (val.startsWith('-')) return;

    const numericVal = val === '' ? '' : Number(val);
    if (numericVal !== '' && numericVal > employeeAmount) {
      alert(`Approved amount cannot exceed the employee's claimed bill amount (Claimed: ₹${employeeAmount}).`);
      return;
    }

    setDraftAmounts(prev => ({
      ...prev,
      [billId]: val
    }));
  };

  const getDraftCategoryTotal = () => {
    return Object.values(draftAmounts).reduce((sum, val) => sum + Number(val || 0), 0);
  };

  const handleSaveCategoryClick = async () => {
    setSavingCategory(true);
    setCategorySavedMsg('');

    const billPayloads = activeBills.map(b => ({
      id: b.id,
      hrApprovedAmount: draftAmounts[b.id] === '' ? null : Number(draftAmounts[b.id])
    }));

    try {
      const response = await saveCategoryReview(claimId, activeCategory.id, billPayloads);
      
      setCategories((prev: any[]) => {
        const updated = [...prev];
        updated[activeCategoryIndex] = {
          ...updated[activeCategoryIndex],
          hr_category_total: response.hrCategoryTotal,
          review_status: response.reviewStatus
        };
        return updated;
      });

      setBills((prev: any[]) => {
        const updated = [...prev];
        billPayloads.forEach(payload => {
          const index = updated.findIndex(b => b.id === payload.id);
          if (index >= 0) {
            updated[index].hr_approved_amount = payload.hrApprovedAmount;
          }
        });
        return updated;
      });

      setCategorySavedMsg(`${activeCategory.category_name} review saved successfully.`);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || "Failed to save category review.");
    } finally {
      setSavingCategory(false);
    }
  };

  const getOverallHRTotal = () => {
    return categories.reduce((sum, cat) => sum + (cat.hr_category_total || 0), 0);
  };

  const getOverallClaimsDifference = () => {
    return claim.claimed_total - getOverallHRTotal();
  };

  const isReadyForFinalDecision = () => {
    const unreviewedCategory = categories.some(c => c.review_status !== 'reviewed');
    const unreviewedBill = bills.some(b => b.hr_approved_amount === null);
    return !unreviewedCategory && !unreviewedBill;
  };

  const determineDecisionType = () => {
    const hrTotal = getOverallHRTotal();
    if (hrTotal === claim.claimed_total) {
      return 'approved';
    } else if (hrTotal === 0) {
      return 'rejected';
    } else {
      return 'partially_approved';
    }
  };

  const handleFinalizeClick = (e: React.FormEvent) => {
    e.preventDefault();
    const type = determineDecisionType();
    if (type !== 'approved' && !hrReason.trim()) {
      alert(`Reason for ${type === 'rejected' ? 'Rejection' : 'Partial Approval'} is mandatory.`);
      return;
    }
    setShowDecisionModal(true);
  };

  const confirmFinalDecision = async () => {
    setSubmittingDecision(true);
    try {
      const response = await finalizeReimbursement(claimId, hrReason);
      setClaim((prev: any) => ({
        ...prev,
        status: response.status,
        approved_total: response.approvedTotal,
        hr_reason: hrReason
      }));
      setShowDecisionModal(false);
      alert(`Claim finalized successfully as ${response.status.replace('_', ' ')}.`);
      loadClaimDetail();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || "Failed to finalize claim decision.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleAddPayrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayroll(true);
    try {
      const response = await addReimbursementToPayroll(claimId, payrollMonth, payrollYear);
      alert(response.message);
      setShowPayrollDrawer(false);
      loadClaimDetail();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || "Failed to add reimbursement to payroll.");
    } finally {
      setSubmittingPayroll(false);
    }
  };

  const handleOpenLightbox = (categoryId: string, index: number) => {
    setZoomBillCategory(categoryId);
    setZoomBillIndex(index);
  };

  const getZoomedBillDetails = () => {
    if (zoomBillIndex === null || !zoomBillCategory) return null;
    const catBills = bills.filter(b => b.expense_category_id === zoomBillCategory);
    return {
      bill: catBills[zoomBillIndex],
      totalBills: catBills.length
    };
  };

  const zoomed = getZoomedBillDetails();

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b pb-5 mb-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/admin/expenses')} 
            className="p-2.5 bg-white border border-[#E6E3DE] rounded-xl hover:bg-[#F7F5F1] transition-all text-[#2D3032]"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-[#2D3032] flex items-center gap-2">
              Review Claim: <span className="font-mono text-gray-500">{claim.id}</span>
            </h1>
            <p className="text-xs text-[#777A7C] mt-0.5">Evaluate employee tour receipts individually.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase ${
            claim.status === 'approved' ? 'bg-[#B5F12C]/12 text-[#151413]' :
            claim.status === 'partially_approved' ? 'bg-[#CAB5F5]/12 text-[#412A6E]' :
            claim.status === 'rejected' ? 'bg-[#E96C6C]/12 text-[#6E1F1F]' :
            'bg-[#FAA276]/12 text-[#6B3012]'
          }`}>
            {claim.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white rounded-[28px] border border-[#E6E3DE] shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#9A9C9D] mb-3 flex items-center gap-1">
                <Plane size={12} /> Tour Information
              </h3>
              <div className="space-y-2 text-xs text-[#2D3032]">
                <div><strong>Title:</strong> {claim.tour_title}</div>
                <div><strong>Destination:</strong> {claim.destination}</div>
                <div><strong>Dates:</strong> {new Date(claim.start_date).toLocaleDateString()} - {new Date(claim.end_date).toLocaleDateString()}</div>
                <div><strong>Purpose:</strong> {claim.purpose || 'N/A'}</div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#9A9C9D] mb-3 flex items-center gap-1">
                <User size={12} /> Employee Profile
              </h3>
              <div className="space-y-2 text-xs text-[#2D3032]">
                <div><strong>Name:</strong> {claim.employee_name}</div>
                <div><strong>ID:</strong> {claim.employee_id}</div>
                <div><strong>Department:</strong> {claim.employee_department}</div>
                <div><strong>Submitted On:</strong> {new Date(claim.submitted_at).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Core REVIEW TABLE category-by-category */}
          <div className="bg-white rounded-[28px] border border-[#E6E3DE] shadow-sm p-6 overflow-hidden">
            
            <div className="flex flex-wrap items-center gap-2 border-b pb-4 mb-6">
              {categories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeCategoryIndex === idx
                      ? 'bg-[#151413] text-white shadow-sm'
                      : 'bg-[#F7F5F1] hover:bg-[#E6E3DE] text-[#2D3032]'
                  }`}
                >
                  {cat.category_name}
                  <span className="text-[10px]">
                    {cat.review_status === 'reviewed' ? '✓' : '•'}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#2D3032]">{activeCategory.category_name} bills</h3>
                <p className="text-[10px] text-[#777A7C] mt-0.5">Inspect documents and enter approved amounts.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-medium block">Employee category claimed</span>
                <span className="text-xs font-extrabold text-[#2D3032]">₹{activeCategory.employee_category_total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {categorySavedMsg && (
              <div className="bg-[#B5F12C]/15 border border-[#B5F12C]/30 text-text-primary text-[11px] font-semibold p-3 rounded-xl mb-4 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-brand-green" />
                {categorySavedMsg}
              </div>
            )}

            <table className="w-full text-xs text-[#2D3032] border-collapse">
              <thead>
                <tr className="border-b border-[#E6E3DE] text-left text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Bill Receipt</th>
                  <th className="p-4 text-right">Claimed (₹)</th>
                  <th className="p-4 text-right">Approved (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeBills.map((bill, idx) => (
                  <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div 
                        className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        onClick={() => handleOpenLightbox(activeCategory.id, idx)}
                      >
                        {bill.bill_file.endsWith('.pdf') ? <FileText size={16} /> : <img src={`http://localhost:8081/uploads/${bill.bill_file}`} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-semibold truncate max-w-[200px]" title={bill.original_file_name}>
                          Bill {idx + 1} ({bill.original_file_name})
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenLightbox(activeCategory.id, idx)}
                          className="text-[10px] font-bold text-[#7FAF3F] mt-0.5 hover:underline"
                        >
                          View receipt & inspect
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold">
                      ₹{bill.employee_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end items-center">
                        <div className="relative w-full max-w-[120px]">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="Not reviewed"
                            disabled={claim.status !== 'pending'}
                            value={draftAmounts[bill.id] ?? ''}
                            onKeyDown={(e) => {
                              if (e.key === '-' || e.key === 'e') e.preventDefault();
                            }}
                            onChange={(e) => handleHRApprovedAmountChange(bill.id, bill.employee_amount, e.target.value)}
                            className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg pl-6 pr-3 py-2 text-xs font-bold text-[#2D3032] outline-none transition-colors disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeBills.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-400 italic">No bills uploaded in this category.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {claim.status === 'pending' && activeBills.length > 0 && (
              <div className="mt-6 flex justify-between items-center border-t pt-4">
                <div className="text-xs text-[#777A7C]">
                  Category draft total: <strong className="text-[#2D3032] font-black text-sm ml-1">₹{getDraftCategoryTotal().toLocaleString('en-IN')}</strong>
                </div>

                <button
                  type="button"
                  disabled={savingCategory}
                  onClick={handleSaveCategoryClick}
                  className="px-6 py-2.5 bg-[#151413] hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  {savingCategory ? 'Saving...' : `Save ${activeCategory.category_name} Review — ₹${getDraftCategoryTotal().toLocaleString('en-IN')}`}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-[#FAF7F2] rounded-[28px] border border-[#E6E3DE] p-6 space-y-5">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#2D3032]">Review Summary</h2>
            
            <div className="space-y-3.5 border-b pb-4 mb-4">
              {categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${cat.review_status === 'reviewed' ? 'bg-brand-green' : 'bg-[#FAA276]'}`}></span>
                    <span className="text-[#777A7C] font-semibold">{cat.category_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#2D3032]">
                      {cat.review_status === 'reviewed' ? `₹${cat.hr_category_total.toLocaleString('en-IN')}` : '—'}
                    </span>
                    <span className="text-[10px] text-gray-400 block">Claimed: ₹{cat.employee_category_total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#777A7C] font-semibold">Employee Claimed</span>
                <span className="font-extrabold text-[#2D3032]">₹{claim.claimed_total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777A7C] font-semibold">HR Reimbursed</span>
                <span className="font-black text-brand-green">₹{getOverallHRTotal().toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-[#777A7C] font-semibold">Difference Adjusted</span>
                <span className="font-extrabold text-[#E56B65]">₹{getOverallClaimsDifference().toLocaleString('en-IN')}</span>
              </div>
            </div>

            {claim.status === 'pending' ? (
              <form onSubmit={handleFinalizeClick} className="pt-4 border-t space-y-4">
                <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-black/5 flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold uppercase text-[#777A7C]">Auto Decision Type</span>
                  <span className={`text-xs font-black uppercase ${
                    determineDecisionType() === 'approved' ? 'text-brand-green' :
                    determineDecisionType() === 'partially_approved' ? 'text-[#CAB5F5]' :
                    'text-[#E56B65]'
                  }`}>
                    {determineDecisionType().replace('_', ' ')}
                  </span>
                </div>

                {determineDecisionType() !== 'approved' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#777A7C]">Reason for {determineDecisionType() === 'rejected' ? 'Rejection' : 'Partial Approval'} *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder={determineDecisionType() === 'rejected' ? 'Explain why this claim is being rejected.' : 'Explain why the full claimed amount is not being reimbursed.'}
                      value={hrReason}
                      onChange={(e) => setHrReason(e.target.value)}
                      className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg p-3 text-xs outline-none transition-colors resize-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isReadyForFinalDecision()}
                  className="w-full py-3 bg-[#B5F12C] hover:bg-[#A0DE1E] text-[#151413] text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isReadyForFinalDecision() ? (
                    determineDecisionType() === 'approved' ? 'Approve Full Claim' :
                    determineDecisionType() === 'rejected' ? 'Reject Claim' :
                    `Confirm Partial Approval — ₹${getOverallHRTotal().toLocaleString('en-IN')}`
                  ) : (
                    'Review All Categories to Finalize'
                  )}
                </button>

                {!isReadyForFinalDecision() && (
                  <div className="text-[10px] text-gray-400 text-center italic">Complete and save all category reviews before making the final decision.</div>
                )}
              </form>
            ) : (
              <div className="pt-4 border-t space-y-3">
                {claim.status !== 'rejected' && (
                  <>
                    {claim.payroll_added ? (
                      <div className="bg-[#B5F12C]/10 border border-[#B5F12C]/20 p-4 rounded-xl text-center text-xs text-[#151413] font-bold">
                        Added to {claim.payroll_month} {claim.payroll_year} Salary Slip ✓
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPayrollDrawer(true)}
                        className="w-full py-3 bg-[#B5F12C] hover:bg-[#A0DE1E] text-[#151413] text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        Add to Salary Slip
                      </button>
                    )}
                  </>
                )}

                {claim.hr_reason && (
                  <div className="bg-gray-100 p-4 rounded-xl text-xs text-gray-600 mt-2">
                    <strong>HR Reason:</strong>
                    <p className="mt-1 leading-relaxed">{claim.hr_reason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ================= HR DECISION CONFIRMATION MODAL ================= */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-[#1F1B1A]">
            <h2 className="text-lg font-extrabold text-[#2D3032] mb-1.5">Confirm Decision</h2>
            <p className="text-xs text-[#777A7C] mb-6">Are you sure you want to finalize this claim review? This will lock all amounts and notify the employee.</p>
            
            <div className="bg-[#F7F5F1] p-4 rounded-xl border border-black/5 space-y-3 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-[#777A7C] font-semibold">Claimed Total</span>
                <span className="font-bold text-[#2D3032]">₹{claim.claimed_total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777A7C] font-semibold">Approved Total</span>
                <span className="font-bold text-brand-green">₹{getOverallHRTotal().toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2.5 mt-2.5">
                <span className="text-[#777A7C]">Decision Status</span>
                <span className={`uppercase font-black ${
                  determineDecisionType() === 'approved' ? 'text-brand-green' : 'text-[#CAB5F5]'
                }`}>
                  {determineDecisionType().replace('_', ' ')}
                </span>
              </div>
              {hrReason && (
                <div className="border-t pt-2.5 mt-2">
                  <span className="text-[#777A7C] font-semibold">Reason:</span>
                  <p className="mt-1 font-medium text-[#2D3032] leading-relaxed">{hrReason}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowDecisionModal(false)}
                disabled={submittingDecision}
                className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={confirmFinalDecision}
                disabled={submittingDecision}
                className="flex-1 bg-[#151413] hover:bg-black text-white py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {submittingDecision ? 'Finalizing...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PAYROLL DRAWER SELECTOR MODAL ================= */}
      {showPayrollDrawer && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-[#1F1B1A]">
            <h2 className="text-lg font-extrabold text-[#2D3032] mb-1.5">Add to Salary Slip</h2>
            <p className="text-xs text-[#777A7C] mb-6">Link this tour reimbursement claim to the employee's payroll period.</p>
            
            <form onSubmit={handleAddPayrollSubmit} className="space-y-4">
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-black/5 text-xs mb-3 space-y-1">
                <div>Employee Name: <strong>{claim.employee_name}</strong></div>
                <div>Approved Amount: <strong className="text-brand-green">₹{claim.approved_total.toLocaleString('en-IN')}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#777A7C]">Salary Month</label>
                  <select
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(e.target.value)}
                    className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg p-2.5 text-xs font-semibold text-[#2D3032] outline-none"
                  >
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#777A7C]">Salary Year</label>
                  <select
                    value={payrollYear}
                    onChange={(e) => setPayrollYear(e.target.value)}
                    className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg p-2.5 text-xs font-semibold text-[#2D3032] outline-none"
                  >
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPayrollDrawer(false)}
                  disabled={submittingPayroll}
                  className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={submittingPayroll}
                  className="flex-1 bg-[#B5F12C] text-[#151413] py-2.5 rounded-lg text-xs font-bold hover:bg-[#A0DE1E] transition-colors flex items-center justify-center disabled:opacity-50 cursor-pointer"
                >
                  {submittingPayroll ? 'Adding...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= INTERACTIVE BILL MAGNIFIER / LIGHTBOX OVERLAY ================= */}
      {zoomBillIndex !== null && zoomed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl p-6 max-w-3xl w-full mx-6 flex flex-col justify-between max-h-[85vh] shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <span className="text-xs font-bold text-[#2D3032] truncate max-w-[400px]">
                Reviewing receipt: {zoomed.bill.original_file_name} ({zoomBillIndex + 1} of {zoomed.totalBills})
              </span>
              <button
                onClick={() => {
                  setZoomBillIndex(null);
                  setZoomBillCategory(null);
                }}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 px-2 cursor-pointer"
              >
                Close (✕)
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-hidden min-h-[300px]">
              {zoomed.bill.bill_file.endsWith('.pdf') ? (
                <iframe src={`http://localhost:8081/uploads/${zoomed.bill.bill_file}`} className="w-full h-[55vh] border-0" />
              ) : (
                <img 
                  src={`http://localhost:8081/uploads/${zoomed.bill.bill_file}`} 
                  id="adminZoomBillImage" 
                  className="max-w-full max-h-[55vh] object-contain transition-transform duration-200" 
                />
              )}
            </div>

            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  disabled={zoomBillIndex === 0}
                  onClick={() => setZoomBillIndex(zoomBillIndex - 1)}
                  className="bg-[#F7F5F1] hover:bg-[#E6E3DE] disabled:opacity-50 text-[#2D3032] text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer"
                >
                  ← Prev receipt
                </button>
                <button
                  disabled={zoomBillIndex === zoomed.totalBills - 1}
                  onClick={() => setZoomBillIndex(zoomBillIndex + 1)}
                  className="bg-[#F7F5F1] hover:bg-[#E6E3DE] disabled:opacity-50 text-[#2D3032] text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer"
                >
                  Next receipt →
                </button>
              </div>

              {!zoomed.bill.bill_file.endsWith('.pdf') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const img = document.getElementById('adminZoomBillImage');
                      if (img) img.style.transform = 'scale(1)';
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer"
                  >
                    Reset scale
                  </button>
                  <button
                    onClick={() => {
                      const img = document.getElementById('adminZoomBillImage');
                      if (img) {
                        const scale = img.style.transform ? parseFloat(img.style.transform.replace('scale(', '').replace(')', '')) : 1;
                        img.style.transform = `scale(${scale + 0.25})`;
                      }
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer"
                  >
                    Zoom (+)
                  </button>
                </div>
              )}

              <div className="text-xs text-gray-500 font-bold">
                Employee claimed: <strong className="text-[#2D3032]">₹{zoomed.bill.employee_amount.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
