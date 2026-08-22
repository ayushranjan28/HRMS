"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, Upload, Trash2, Eye, RefreshCw, FileText, 
  ChevronRight, Calendar, MapPin, ClipboardList, Plane, CheckCircle2, XCircle
} from 'lucide-react';
import { submitReimbursement, getReimbursements, getReimbursementById } from '@/services/api';

interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  avatar: string;
}

interface BillFile {
  name: string;
  base64: string;
  amount: number | '';
  error?: boolean;
}

interface CategoryClaims {
  name: string;
  bills: BillFile[];
}

const DEFAULT_CATEGORIES = [
  'Petrol / Fuel',
  'Hotel / Accommodation',
  'Travel',
  'Food',
  'Local Transport',
  'Parking / Toll',
  'Other'
];

function TourExpensesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const claimIdParam = searchParams.get('claimId');

  const [activeTab, setActiveTab] = useState<'history' | 'new'>('history');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // History State
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [loadingClaimDetail, setLoadingClaimDetail] = useState(false);

  // New Claim Form State
  const [tourTitle, setTourTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  
  const [categories, setCategories] = useState<CategoryClaims[]>(
    DEFAULT_CATEGORIES.map(name => ({ name, bills: [] }))
  );
  
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Bill zoom lightbox modal
  const [zoomBill, setZoomBill] = useState<{ name: string; base64: string; fileUrl?: string } | null>(null);

  // Validation / Confirmation
  const [formErrors, setFormErrors] = useState<{ [key: string]: boolean }>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Initial user loading & claims trigger
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dayflow_user');
      const empStored = localStorage.getItem('dayflow_employee');
      if (stored && empStored) {
        try {
          const user = JSON.parse(stored);
          const emp = JSON.parse(empStored);
          setCurrentUser({
            id: emp.id || user.employeeId,
            name: `${emp.firstName} ${emp.lastName}` || user.username,
            role: user.role,
            department: emp.department || 'Design',
            email: user.email,
            avatar: emp.profilePhoto || 'https://i.pravatar.cc/150'
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const list = await getReimbursements();
      list.sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
      setClaimsList(list);
    } catch (e) {
      console.error("Failed to load claims history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadHistory();
    }
  }, [currentUser]);

  useEffect(() => {
    if (claimIdParam && currentUser) {
      handleViewClaim(claimIdParam);
    }
  }, [claimIdParam, currentUser]);

  const handleViewClaim = async (id: string) => {
    setLoadingClaimDetail(true);
    setSelectedClaim(null);
    try {
      const detail = await getReimbursementById(id);
      setSelectedClaim(detail);
      setActiveTab('history');
    } catch (e) {
      console.error(e);
      alert("Failed to load claim details.");
    } finally {
      setLoadingClaimDetail(false);
    }
  };

  // Add custom category
  const handleAddCustomCategory = () => {
    if (!customCategoryName.trim()) return;
    if (categories.some(c => c.name.toLowerCase() === customCategoryName.trim().toLowerCase())) {
      alert("Category already exists.");
      return;
    }
    setCategories([...categories, { name: customCategoryName.trim(), bills: [] }]);
    setCustomCategoryName('');
    setShowCustomInput(false);
  };

  // Convert uploaded file to base64
  const handleFileUpload = (categoryIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const base64String = event.target.result as string;
          
          setCategories(prev => {
            const updated = [...prev];
            updated[categoryIndex].bills.push({
              name: file.name,
              base64: base64String,
              amount: ''
            });
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleBillReplace = (categoryIndex: number, billIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        const base64String = event.target.result as string;
        
        setCategories(prev => {
          const updated = [...prev];
          updated[categoryIndex].bills[billIndex] = {
            ...updated[categoryIndex].bills[billIndex],
            name: file.name,
            base64: base64String
          };
          return updated;
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBillAmountChange = (categoryIndex: number, billIndex: number, val: string) => {
    if (val.startsWith('-')) return;

    setCategories(prev => {
      const updated = [...prev];
      const numericVal = val === '' ? '' : Number(val);
      updated[categoryIndex].bills[billIndex].amount = numericVal;
      return updated;
    });
  };

  const handleBillDelete = (categoryIndex: number, billIndex: number) => {
    setCategories(prev => {
      const updated = [...prev];
      updated[categoryIndex].bills.splice(billIndex, 1);
      return updated;
    });
  };

  const getCategoryTotal = (cat: CategoryClaims) => {
    return cat.bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  };

  const getClaimedTotal = () => {
    return categories.reduce((sum, cat) => sum + getCategoryTotal(cat), 0);
  };

  const getUsedCategoriesCount = () => {
    return categories.filter(c => c.bills.length > 0).length;
  };

  const getUploadedBillsCount = () => {
    return categories.reduce((sum, c) => sum + c.bills.length, 0);
  };

  const validateForm = () => {
    const errors: { [key: string]: boolean } = {};
    if (!tourTitle.trim()) errors.tourTitle = true;
    if (!destination.trim()) errors.destination = true;
    if (!startDate) errors.startDate = true;
    if (!endDate) errors.endDate = true;

    const totalBills = getUploadedBillsCount();
    if (totalBills === 0) {
      errors.noBills = true;
    }

    let hasBlankAmount = false;
    categories.forEach((cat, catIdx) => {
      cat.bills.forEach((bill, billIdx) => {
        if (bill.amount === '' || bill.amount <= 0) {
          hasBlankAmount = true;
          errors[`bill-${catIdx}-${billIdx}`] = true;
        }
      });
    });

    if (hasBlankAmount) {
      errors.blankAmounts = true;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmModal(true);
    } else {
      alert("Please check validation errors. Ensure all tour fields are complete and every uploaded bill has an amount greater than ₹0.");
    }
  };

  const confirmSubmission = async () => {
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    const submittedCategories = categories
      .filter(c => c.bills.length > 0)
      .map(c => ({
        name: c.name,
        bills: c.bills.map(b => ({
          name: b.name,
          base64: b.base64,
          amount: b.amount
        }))
      }));

    const payload = {
      employeeId: currentUser?.id,
      employeeName: currentUser?.name,
      employeeDepartment: currentUser?.department,
      tourTitle,
      destination,
      startDate,
      endDate,
      purpose,
      categories: submittedCategories
    };

    try {
      const response = await submitReimbursement(payload);
      setSubmitSuccess(`Expense claim submitted successfully and sent to HR (ID: ${response.claimId})`);
      setShowConfirmModal(false);
      
      setTourTitle('');
      setDestination('');
      setStartDate('');
      setEndDate('');
      setPurpose('');
      setCategories(DEFAULT_CATEGORIES.map(name => ({ name, bills: [] })));
      
      loadHistory();
      setTimeout(() => {
        setSubmitSuccess('');
        setActiveTab('history');
      }, 3000);
    } catch (e: any) {
      console.error(e);
      setSubmitError(e.response?.data?.error || "Failed to submit reimbursement claim. Please try again.");
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-[28px] font-semibold text-[#2D3032] flex items-center gap-2">
            Tour Expense Reimbursement
          </h1>
          <p className="text-[#777A7C] text-sm mt-1">Submit travel receipts category-wise and review HR approvals.</p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex bg-[#F7F5F1] p-1 rounded-xl border border-black/5 shadow-sm">
          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedClaim(null);
            }}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'history' && !selectedClaim
                ? 'bg-white text-[#2D3032] shadow-sm'
                : 'text-[#777A7C] hover:text-[#2D3032]'
            }`}
          >
            My Expense Claims
          </button>
          <button
            onClick={() => {
              setActiveTab('new');
              setSelectedClaim(null);
            }}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'new'
                ? 'bg-white text-[#2D3032] shadow-sm'
                : 'text-[#777A7C] hover:text-[#2D3032]'
            }`}
          >
            New Expense Claim
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="bg-[#B5F12C]/15 border border-[#B5F12C]/30 text-text-primary font-semibold text-xs p-4 rounded-2xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-brand-green" />
          {submitSuccess}
        </div>
      )}

      {submitError && (
        <div className="bg-[#E96C6C]/10 border border-[#E96C6C]/25 text-[#6E1F1F] font-semibold text-xs p-4 rounded-2xl flex items-center gap-2">
          <XCircle size={16} className="text-[#E96C6C]" />
          {submitError}
        </div>
      )}

      {/* ================= TAB 1: HISTORY OR DETAIL VIEW ================= */}
      {activeTab === 'history' && (
        <div>
          {selectedClaim ? (
            /* DETAILED COMPLETED CLAIM VIEW */
            <div className="bg-white rounded-[28px] border border-[#E6E3DE] shadow-sm p-8 max-w-5xl mx-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
                <div>
                  <button 
                    onClick={() => setSelectedClaim(null)} 
                    className="text-xs font-bold text-[#777A7C] hover:text-[#2D3032] mb-1.5 flex items-center gap-1 cursor-pointer"
                  >
                    ← Back to Claims list
                  </button>
                  <h2 className="text-xl font-extrabold text-[#2D3032] flex items-center gap-2">
                    Claim Details: <span className="font-mono text-gray-500">{selectedClaim.claim.id}</span>
                  </h2>
                </div>

                <div className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase ${
                  selectedClaim.claim.status === 'approved' ? 'bg-[#B5F12C]/12 text-[#151413]' :
                  selectedClaim.claim.status === 'partially_approved' ? 'bg-[#CAB5F5]/12 text-[#412A6E]' :
                  selectedClaim.claim.status === 'rejected' ? 'bg-[#E96C6C]/12 text-[#6E1F1F]' :
                  'bg-[#FAA276]/12 text-[#6B3012]'
                }`}>
                  {selectedClaim.claim.status.replace('_', ' ')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#F7F5F1]/50 p-6 rounded-2xl border border-black/5 mb-8">
                <div>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#9A9C9D] mb-2.5">Tour Information</h3>
                  <div className="space-y-1.5 text-xs text-[#2D3032]">
                    <div><strong>Title:</strong> {selectedClaim.claim.tour_title}</div>
                    <div><strong>Destination:</strong> {selectedClaim.claim.destination}</div>
                    <div><strong>Dates:</strong> {new Date(selectedClaim.claim.start_date).toLocaleDateString()} - {new Date(selectedClaim.claim.end_date).toLocaleDateString()}</div>
                    <div><strong>Purpose:</strong> {selectedClaim.claim.purpose || 'N/A'}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#9A9C9D] mb-2.5">Employee Information</h3>
                  <div className="space-y-1.5 text-xs text-[#2D3032]">
                    <div><strong>Name:</strong> {selectedClaim.claim.employee_name}</div>
                    <div><strong>ID:</strong> {selectedClaim.claim.employee_id}</div>
                    <div><strong>Department:</strong> {selectedClaim.claim.employee_department}</div>
                    <div><strong>Submitted On:</strong> {new Date(selectedClaim.claim.submitted_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-8 mb-8">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#2D3032] border-b pb-2">Itemized Bill Breakdown</h3>
                
                {selectedClaim.categories.map((cat: any) => {
                  const catBills = selectedClaim.bills.filter((b: any) => b.expense_category_id === cat.id);
                  return (
                    <div key={cat.id} className="border border-[#E6E3DE] rounded-2xl overflow-hidden">
                      <div className="bg-[#FAF7F2] p-4 border-b border-[#E6E3DE] flex justify-between items-center">
                        <span className="text-xs font-extrabold text-[#2D3032]">{cat.category_name}</span>
                        <div className="text-xs text-[#777A7C]">
                          Employee Claimed: <strong className="text-[#2D3032]">₹{cat.employee_category_total.toLocaleString('en-IN')}</strong>
                          {selectedClaim.claim.status !== 'pending' && (
                            <>
                              {" | "} HR Reimbursed: <strong className="text-brand-green">₹{(cat.hr_category_total || 0).toLocaleString('en-IN')}</strong>
                            </>
                          )}
                        </div>
                      </div>

                      <table className="w-full text-xs text-[#2D3032]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-[#E6E3DE] text-left text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-4">Bill attachment</th>
                            <th className="p-4 text-right">Employee Claimed</th>
                            <th className="p-4 text-right">HR Reimbursed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {catBills.map((bill: any, idx: number) => (
                            <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                                  onClick={() => setZoomBill({ name: bill.original_file_name, base64: '', fileUrl: `http://localhost:8080/uploads/${bill.bill_file}` })}
                                >
                                  {bill.bill_file.endsWith('.pdf') ? <FileText size={16} /> : <img src={`http://localhost:8080/uploads/${bill.bill_file}`} className="w-full h-full object-cover" />}
                                </div>
                                <span className="font-semibold truncate max-w-[200px]" title={bill.original_file_name}>
                                  Bill {idx + 1} ({bill.original_file_name})
                                </span>
                              </td>
                              <td className="p-4 text-right font-bold">
                                ₹{bill.employee_amount.toLocaleString('en-IN')}
                              </td>
                              <td className="p-4 text-right font-bold text-brand-green">
                                {bill.hr_approved_amount === null ? '—' : `₹${bill.hr_approved_amount.toLocaleString('en-IN')}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 pt-6 mt-8">
                <div className="flex flex-col items-end gap-3">
                  <div className="text-xs font-semibold text-[#777A7C]">
                    Total Claimed: <span className="text-sm font-bold text-[#2D3032] ml-1">₹{selectedClaim.claim.claimed_total.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedClaim.claim.status !== 'pending' && (
                    <>
                      <div className="text-xs font-semibold text-[#777A7C]">
                        Total Reimbursed: <span className="text-sm font-extrabold text-brand-green ml-1">₹{(selectedClaim.claim.approved_total || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-xs font-semibold text-[#777A7C]">
                        Difference Adjusted: <span className="text-sm font-bold text-[#E56B65] ml-1">₹{(selectedClaim.claim.claimed_total - (selectedClaim.claim.approved_total || 0)).toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                </div>

                {selectedClaim.claim.hr_reason && (
                  <div className="bg-[#CAB5F5]/5 border border-[#CAB5F5]/15 p-4 rounded-xl mt-6 text-xs text-[#412A6E]">
                    <strong>HR Final Remarks:</strong>
                    <p className="mt-1 leading-relaxed">{selectedClaim.claim.hr_reason}</p>
                  </div>
                )}

                {selectedClaim.claim.payroll_added && (
                  <div className="bg-[#B5F12C]/10 border border-[#B5F12C]/20 p-4 rounded-xl mt-4 text-xs text-[#151413]">
                    <strong>Payroll Integration:</strong> This reimbursement has been integrated into your <strong>{selectedClaim.claim.payroll_month} {selectedClaim.claim.payroll_year}</strong> salary slip.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CLAIMS LIST HISTORY TABLE */
            <div className="bg-white rounded-[28px] border border-[#E6E3DE] shadow-sm p-6 overflow-hidden">
              {loadingHistory ? (
                <div className="text-center p-12 text-[#777A7C] text-xs">Loading reimbursement history...</div>
              ) : claimsList.length === 0 ? (
                <div className="text-center p-16 text-[#777A7C]">
                  <Plane className="h-10 w-10 text-[#9A9C9D] mx-auto mb-3 opacity-60" />
                  <p className="text-xs font-semibold text-[#2D3032]">No travel expense claims submitted yet.</p>
                  <button 
                    onClick={() => setActiveTab('new')} 
                    className="text-xs font-bold text-[#7FAF3F] mt-3 hover:underline"
                  >
                    Submit your first claim
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-[#2D3032] border-collapse">
                    <thead>
                      <tr className="border-b border-[#E6E3DE] text-left text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Claim ID</th>
                        <th className="p-4">Tour Title / Destination</th>
                        <th className="p-4">Submitted Date</th>
                        <th className="p-4 text-right">Claimed (₹)</th>
                        <th className="p-4 text-right">Approved (₹)</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {claimsList.map((claim) => (
                        <tr key={claim.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-gray-500">{claim.id}</td>
                          <td className="p-4">
                            <div className="font-semibold text-text-primary">{claim.tour_title}</div>
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
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase ${
                              claim.status === 'approved' ? 'bg-[#B5F12C]/12 text-[#151413]' :
                              claim.status === 'partially_approved' ? 'bg-[#CAB5F5]/12 text-[#412A6E]' :
                              claim.status === 'rejected' ? 'bg-[#E96C6C]/12 text-[#6E1F1F]' :
                              'bg-[#FAA276]/12 text-[#6B3012]'
                            }`}>
                              {claim.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleViewClaim(claim.id)}
                              className="flex items-center gap-1 bg-[#F7F5F1] hover:bg-[#E6E3DE] text-[#2D3032] py-1.5 px-3 rounded-lg text-[11px] font-bold tracking-wide transition-colors"
                            >
                              Details <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: NEW EXPENSE CLAIM ================= */}
      {activeTab === 'new' && (
        <form onSubmit={handleFormSubmitClick} className="space-y-6">
          
          {/* Form grid info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Tour Meta Form Card */}
            <div className="lg:col-span-8 bg-white rounded-[28px] border border-[#E6E3DE] shadow-sm p-6 space-y-4">
              <h2 className="text-base font-bold text-[#2D3032] border-b pb-3 mb-2">Tour details</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#777A7C]">Tour Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mumbai Client Visit"
                    className={`w-full bg-[#F7F5F1] border ${formErrors.tourTitle ? 'border-[#E56B65]' : 'border-transparent'} focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-xs font-semibold text-[#2D3032] outline-none transition-colors`}
                    value={tourTitle}
                    onChange={(e) => setTourTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#777A7C]">Destination *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mumbai, Maharashtra"
                    className={`w-full bg-[#F7F5F1] border ${formErrors.destination ? 'border-[#E56B65]' : 'border-transparent'} focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-xs font-semibold text-[#2D3032] outline-none transition-colors`}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#777A7C]">Start Date *</label>
                  <input
                    type="date"
                    required
                    className={`w-full bg-[#F7F5F1] border ${formErrors.startDate ? 'border-[#E56B65]' : 'border-transparent'} focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-xs font-semibold text-[#2D3032] outline-none transition-colors`}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#777A7C]">End Date *</label>
                  <input
                    type="date"
                    required
                    className={`w-full bg-[#F7F5F1] border ${formErrors.endDate ? 'border-[#E56B65]' : 'border-transparent'} focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-xs font-semibold text-[#2D3032] outline-none transition-colors`}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#777A7C]">Purpose / Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Details of client meeting and sales negotiations..."
                  className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg p-4 text-xs font-semibold text-[#2D3032] outline-none transition-colors resize-none"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
            </div>

            {/* Read-only Employee Card */}
            <div className="lg:col-span-4 bg-white rounded-[28px] border border-[#E6E3DE] shadow-sm p-6 space-y-4">
              <h2 className="text-base font-bold text-[#2D3032] border-b pb-3 mb-2">Employee Claim Profile</h2>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#777A7C] font-semibold">Name</span>
                  <span className="font-extrabold text-[#2D3032]">{currentUser?.name || "Loading..."}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777A7C] font-semibold">Employee ID</span>
                  <span className="font-mono font-bold text-gray-500">{currentUser?.id || "Loading..."}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777A7C] font-semibold">Department</span>
                  <span className="font-extrabold text-[#2D3032]">{currentUser?.department || "Loading..."}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                <div className="text-[10px] text-gray-400 font-medium italic">Employee info is automatically pulled from active authentication session.</div>
              </div>
            </div>

          </div>

          {/* Core Table Grid for Bills */}
          <div className="bg-white rounded-[28px] border border-[#E6E3DE] shadow-sm p-6 overflow-hidden">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#2D3032]">Itemized Category Expenses</h2>
                <p className="text-[10px] text-[#777A7C] mt-0.5">Upload bills and list amounts for each selected category.</p>
              </div>

              <div>
                {showCustomInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Client Dinner"
                      className="bg-[#F7F5F1] border border-[#E6E3DE] rounded-lg px-3 py-1.5 text-xs font-semibold outline-none text-[#2D3032] focus:border-[#7FAF3F]"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      className="bg-[#7FAF3F] text-white hover:bg-[#668F2F] text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="text-xs font-bold text-gray-400 hover:text-gray-600 px-1"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="flex items-center gap-1.5 bg-[#FAF7F2] hover:bg-[#E6E3DE] text-[#2D3032] text-xs font-bold py-2 px-4 rounded-xl border border-[#E6E3DE] transition-colors"
                  >
                    <Plus size={14} /> Add Custom Category
                  </button>
                )}
              </div>
            </div>

            {/* EXPENSE TABLE LAYOUT */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-[#2D3032] border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E3DE] text-left text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 w-1/5">Category</th>
                    <th className="p-4 w-2/5">Bills</th>
                    <th className="p-4 w-1/5">Individual Bill Amounts</th>
                    <th className="p-4 w-1/5 text-right">Category Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((cat, catIdx) => {
                    const catTotal = getCategoryTotal(cat);
                    return (
                      <tr key={cat.name} className="hover:bg-[#FAF7F2]/20 transition-colors align-top">
                        <td className="p-4 font-bold text-[#2D3032] pt-6">
                          {cat.name}
                        </td>
                        
                        <td className="p-4">
                          <div className="space-y-4">
                            {cat.bills.map((bill, billIdx) => (
                              <div key={billIdx} className="flex items-center justify-between gap-4 p-2 bg-[#F7F5F1]/80 rounded-xl border border-black/5">
                                <div className="flex items-center gap-2 truncate flex-1">
                                  <div 
                                    className="w-8 h-8 rounded bg-gray-200 border overflow-hidden flex items-center justify-center shrink-0 text-gray-500 cursor-pointer hover:bg-gray-300"
                                    onClick={() => setZoomBill({ name: bill.name, base64: bill.base64 })}
                                    title="Click to Zoom"
                                  >
                                    {bill.name.endsWith('.pdf') ? <FileText size={14} /> : <img src={bill.base64} className="w-full h-full object-cover" />}
                                  </div>
                                  <span className="font-medium text-[11px] truncate max-w-[150px]" title={bill.name}>
                                    {bill.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setZoomBill({ name: bill.name, base64: bill.base64 })}
                                    className="p-1.5 text-gray-500 hover:text-[#2D3032]"
                                    title="View"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <label className="p-1.5 text-gray-500 hover:text-[#2D3032] cursor-pointer" title="Replace">
                                    <RefreshCw size={14} />
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                                      className="hidden"
                                      onChange={(e) => handleBillReplace(catIdx, billIdx, e)}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleBillDelete(catIdx, billIdx)}
                                    className="p-1.5 text-[#E56B65] hover:text-[#C54A44]"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}

                            <label className="flex items-center gap-2 text-[#777A7C] hover:text-[#2D3032] cursor-pointer w-fit py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-colors">
                              <Upload size={14} />
                              <span className="text-[11px] font-bold">Upload bill receipt(s)</span>
                              <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/jpg,image/png,application/pdf"
                                className="hidden"
                                onChange={(e) => handleFileUpload(catIdx, e)}
                              />
                            </label>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-4 pt-1.5">
                            {cat.bills.map((bill, billIdx) => (
                              <div key={billIdx} className="h-12 flex items-center">
                                <div className="relative w-full max-w-[150px]">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    required
                                    placeholder="0.00"
                                    value={bill.amount}
                                    onKeyDown={(e) => {
                                      if (e.key === '-' || e.key === 'e') {
                                        e.preventDefault();
                                      }
                                    }}
                                    onChange={(e) => handleBillAmountChange(catIdx, billIdx, e.target.value)}
                                    className={`w-full bg-[#F7F5F1] border ${formErrors[`bill-${catIdx}-${billIdx}`] ? 'border-[#E56B65]' : 'border-transparent'} focus:border-[#7FAF3F] rounded-lg pl-6 pr-3 py-2 text-xs font-bold text-[#2D3032] outline-none transition-colors`}
                                  />
                                </div>
                              </div>
                            ))}
                            {cat.bills.length === 0 && (
                              <div className="text-gray-400 italic text-[11px] h-9 flex items-center">No bills uploaded</div>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-right font-extrabold text-[#2D3032] pt-6">
                          {catTotal > 0 ? `₹${catTotal.toLocaleString('en-IN')}` : '₹0'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6 flex justify-between items-center px-4 bg-[#FAF7F2] p-6 rounded-2xl">
              <div>
                {formErrors.noBills && (
                  <span className="text-[#E56B65] text-xs font-bold">⚠️ At least one receipt must be uploaded to submit a claim.</span>
                )}
                {formErrors.blankAmounts && (
                  <span className="text-[#E56B65] text-xs font-bold">⚠️ Please enter an amount for all uploaded bills.</span>
                )}
              </div>
              
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#777A7C] block mb-1">TOTAL CLAIMED AMOUNT</span>
                <span className="text-2xl font-black text-brand-green tracking-tight">
                  ₹{getClaimedTotal().toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                setTourTitle('');
                setDestination('');
                setStartDate('');
                setEndDate('');
                setPurpose('');
                setCategories(DEFAULT_CATEGORIES.map(name => ({ name, bills: [] })));
              }}
              className="px-6 py-3 bg-white border border-[#E6E3DE] hover:bg-[#F7F5F1] text-[#2D3032] text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Cancel Claim
            </button>
            
            <button
              type="submit"
              className="px-8 py-3 bg-[#B5F12C] hover:bg-[#A0DE1E] text-[#151413] text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Submit Expense Claim
            </button>
          </div>
        </form>
      )}

      {/* ================= LIGHTBOX BILL ZOOM VIEW MODAL ================= */}
      {zoomBill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl p-6 max-w-3xl w-full mx-6 flex flex-col justify-between max-h-[85vh] shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <span className="text-xs font-bold text-[#2D3032] truncate max-w-[500px]" title={zoomBill.name}>
                Attachment Viewer: {zoomBill.name}
              </span>
              <button
                onClick={() => setZoomBill(null)}
                className="text-xs font-bold text-gray-500 hover:text-gray-700 px-2 cursor-pointer"
              >
                Close (✕)
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-hidden min-h-[300px]">
              {zoomBill.fileUrl ? (
                zoomBill.fileUrl.endsWith('.pdf') ? (
                  <iframe src={zoomBill.fileUrl} className="w-full h-[55vh] border-0" />
                ) : (
                  <img src={zoomBill.fileUrl} className="max-w-full max-h-[55vh] object-contain transition-transform duration-200" id="billZoomImage" />
                )
              ) : (
                zoomBill.name.endsWith('.pdf') ? (
                  <div className="text-center text-xs text-gray-500">
                    <FileText size={48} className="mx-auto text-gray-400 mb-3" />
                    PDF File loaded: Cannot render preview of local files in browser before upload.
                    <br />
                    <span className="font-semibold mt-1 block">Click Submit to upload and make it viewable.</span>
                  </div>
                ) : (
                  <img src={zoomBill.base64} className="max-w-full max-h-[55vh] object-contain" />
                )
              )}
            </div>

            {zoomBill.fileUrl && !zoomBill.fileUrl.endsWith('.pdf') && (
              <div className="flex justify-center gap-3 mt-4 pt-3 border-t">
                <button
                  onClick={() => {
                    const img = document.getElementById('billZoomImage');
                    if (img) img.style.transform = 'scale(1)';
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-xs py-1.5 px-4 rounded-lg font-semibold"
                >
                  Reset Scale
                </button>
                <button
                  onClick={() => {
                    const img = document.getElementById('billZoomImage');
                    if (img) {
                      const scale = img.style.transform ? parseFloat(img.style.transform.replace('scale(', '').replace(')', '')) : 1;
                      img.style.transform = `scale(${scale + 0.25})`;
                    }
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-xs py-1.5 px-4 rounded-lg font-semibold"
                >
                  Zoom In (+)
                </button>
                <button
                  onClick={() => {
                    const img = document.getElementById('billZoomImage');
                    if (img) {
                      const scale = img.style.transform ? parseFloat(img.style.transform.replace('scale(', '').replace(')', '')) : 1;
                      if (scale > 0.5) img.style.transform = `scale(${scale - 0.25})`;
                    }
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-xs py-1.5 px-4 rounded-lg font-semibold"
                >
                  Zoom Out (-)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= EMPLOYEE SUBMIT CONFIRMATION MODAL ================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-[#1F1B1A]">
            <h2 className="text-lg font-extrabold text-[#2D3032] mb-1.5">Submit Tour Expense Claim?</h2>
            <p className="text-xs text-[#777A7C] mb-6">Are you sure you want to lock this claim and submit it for HR review?</p>
            
            <div className="bg-[#F7F5F1] p-4 rounded-xl border border-black/5 space-y-3 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-[#777A7C] font-semibold">Tour Title</span>
                <span className="font-bold text-[#2D3032]">{tourTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777A7C] font-semibold">Categories Used</span>
                <span className="font-bold text-[#2D3032]">{getUsedCategoriesCount()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777A7C] font-semibold">Bills Attached</span>
                <span className="font-bold text-[#2D3032]">{getUploadedBillsCount()}</span>
              </div>
              <div className="flex justify-between border-t pt-2.5 mt-2.5 font-bold">
                <span className="text-[#777A7C]">Total Claimed</span>
                <span className="text-brand-green text-sm font-black">
                  ₹{getClaimedTotal().toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={confirmSubmission}
                disabled={submitting}
                className="flex-1 bg-[#B5F12C] text-[#151413] py-2.5 rounded-lg text-xs font-bold hover:bg-[#A0DE1E] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit to HR'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function TourExpensesPage() {
  return (
    <Suspense fallback={<div className="text-center p-12 text-[#777A7C]">Loading page component...</div>}>
      <TourExpensesContent />
    </Suspense>
  );
}
