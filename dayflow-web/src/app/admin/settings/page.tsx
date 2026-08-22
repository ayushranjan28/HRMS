"use client";
import React, { useEffect, useState } from 'react';
import { 
  Building, Settings as SettingsIcon, Users, Sliders, 
  Save, Plus, Check, Loader2, PlusCircle, RefreshCw 
} from 'lucide-react';
import * as api from '@/services/api';

export default function HRSettings() {
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'rules' | 'departments' | 'designations'>('company');

  // API settings values
  const [company, setCompany] = useState<any>({
    name: 'Dayflow Technologies',
    email: 'hr@dayflow.io',
    phone: '+91 80 4910 1200',
    address: 'Koramangala 80 Feet Road, Bangalore, KA, India',
    currency: 'USD',
    defaultWorkLocation: 'Office'
  });
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);

  // Add forms state
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  
  const [newDesigName, setNewDesigName] = useState('');
  const [newDesigDept, setNewDesigDept] = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setCompany(data.company || {});
      setDepartments(data.departments || []);
      setDesignations(data.designations || []);
      if (data.departments && data.departments.length > 0) {
        setNewDesigDept(data.departments[0].id);
      }
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to retrieve configuration settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompany((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCompany = async () => {
    try {
      await api.updateSettings(company);
      showToast('success', 'Company configurations saved successfully!');
    } catch (e) {
      showToast('error', 'Failed to update company profile');
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      await api.addDepartment(newDeptName, newDeptDesc);
      showToast('success', 'New department added successfully');
      setNewDeptName('');
      setNewDeptDesc('');
      loadSettingsData();
    } catch (e) {
      showToast('error', 'Failed to create department');
    }
  };

  const handleAddDesig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesigName.trim() || !newDesigDept) return;

    try {
      await api.addDesignation(newDesigName, newDesigDept);
      showToast('success', 'New designation created successfully');
      setNewDesigName('');
      loadSettingsData();
    } catch (e) {
      showToast('error', 'Failed to create designation');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto relative">
      {/* Toast Alert */}
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
          <h1 className="text-[28px] font-semibold text-[#2D3032]">Settings & Rules</h1>
          <p className="text-[#777A7C] text-sm mt-1">Configure company profiles, departments, structures, and policies.</p>
        </div>
        <button 
          onClick={loadSettingsData}
          className="p-2.5 bg-white border border-[#E6E3DE] rounded-lg hover:bg-[#F7F5F1] transition-all cursor-pointer w-fit ml-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="bg-white rounded-2xl border border-[#E6E3DE] p-4 shadow-sm h-fit space-y-1">
          {[
            { id: 'company', label: 'Company Profile', icon: Building },
            { id: 'rules', label: 'HR Rule Parameters', icon: Sliders },
            { id: 'departments', label: 'Departments List', icon: Users },
            { id: 'designations', label: 'Designations Structure', icon: SettingsIcon }
          ].map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setActiveSubTab(opt.id as any)}
                className={`w-full text-left flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all cursor-pointer ${
                  activeSubTab === opt.id 
                    ? 'bg-[#7FAF3F]/10 text-[#7FAF3F]' 
                    : 'text-[#777A7C] hover:bg-[#F7F5F1] hover:text-[#2D3032]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Setting Panel Panel */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E6E3DE] py-24 text-center text-[#777A7C] font-semibold flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#7FAF3F]" />
              <span>Fetching configurations...</span>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E6E3DE] p-8 shadow-sm">
              
              {/* COMPANY TAB */}
              {activeSubTab === 'company' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-[#2D3032]">Company Information</h2>
                    <p className="text-xs text-[#777A7C] mt-0.5">Define organization identity parameters.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#E6E3DE] pt-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Company Name</label>
                      <input type="text" name="name" value={company.name || ''} onChange={handleCompanyChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Corporate Email</label>
                      <input type="email" name="email" value={company.email || ''} onChange={handleCompanyChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Contact Phone</label>
                      <input type="text" name="phone" value={company.phone || ''} onChange={handleCompanyChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Default Work Location</label>
                      <input type="text" name="defaultWorkLocation" value={company.defaultWorkLocation || ''} onChange={handleCompanyChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Headquarters Address</label>
                      <input type="text" name="address" value={company.address || ''} onChange={handleCompanyChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" />
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveCompany}
                    className="flex items-center gap-2 bg-[#7FAF3F] text-white rounded-lg px-5 py-2.5 text-xs font-bold hover:bg-[#668F2F] transition-all shadow-sm cursor-pointer active:scale-95 ml-auto"
                  >
                    <Save className="w-4 h-4" /> Save Configuration
                  </button>
                </div>
              )}

              {/* RULES TAB */}
              {activeSubTab === 'rules' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-[#2D3032]">HR Rule Parameters</h2>
                    <p className="text-xs text-[#777A7C] mt-0.5">Parameters that dictate payroll, leaves, and attendance thresholds.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-[#E6E3DE] pt-4">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#7FAF3F]">Attendance Rules</h3>
                      <div>
                        <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Standard Daily Work Hours</label>
                        <input type="number" defaultValue="8" className="w-full bg-[#F7F5F1] rounded-lg px-4 py-2 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Late Clock-In Threshold (Mins)</label>
                        <input type="number" defaultValue="15" className="w-full bg-[#F7F5F1] rounded-lg px-4 py-2 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Overtime Payroll Multiplier</label>
                        <input type="number" step="0.1" defaultValue="1.5" className="w-full bg-[#F7F5F1] rounded-lg px-4 py-2 text-sm outline-none" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#7FAF3F]">Leave Allocations (Days / Year)</h3>
                      <div>
                        <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Paid Time Off (PTO)</label>
                        <input type="number" defaultValue="20" className="w-full bg-[#F7F5F1] rounded-lg px-4 py-2 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Sick Leaves</label>
                        <input type="number" defaultValue="12" className="w-full bg-[#F7F5F1] rounded-lg px-4 py-2 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Casual Leaves</label>
                        <input type="number" defaultValue="8" className="w-full bg-[#F7F5F1] rounded-lg px-4 py-2 text-sm outline-none" />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => showToast('success', 'HR parameters updated successfully!')}
                    className="flex items-center gap-2 bg-[#7FAF3F] text-white rounded-lg px-5 py-2.5 text-xs font-bold hover:bg-[#668F2F] transition-all shadow-sm cursor-pointer active:scale-95 ml-auto"
                  >
                    <Save className="w-4 h-4" /> Save Rules
                  </button>
                </div>
              )}

              {/* DEPARTMENTS TAB */}
              {activeSubTab === 'departments' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-[#2D3032]">Departments structure</h2>
                    <p className="text-xs text-[#777A7C] mt-0.5">Manage and add operational units.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-[#E6E3DE] pt-4">
                    {/* Add Dept Form */}
                    <form onSubmit={handleAddDept} className="bg-[#F7F5F1]/30 border border-[#E6E3DE] p-5 rounded-2xl space-y-4 h-fit">
                      <h3 className="text-xs font-bold text-[#2D3032] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-[#7FAF3F]" /> Create Department
                      </h3>
                      <div>
                        <label className="block text-[9px] font-bold text-[#777A7C] uppercase tracking-wider mb-1">Name *</label>
                        <input type="text" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} required placeholder="e.g. Sales" className="w-full bg-white border border-[#E6E3DE] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#7FAF3F]" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#777A7C] uppercase tracking-wider mb-1">Description</label>
                        <input type="text" value={newDeptDesc} onChange={(e) => setNewDeptDesc(e.target.value)} placeholder="e.g. Customer Relations" className="w-full bg-white border border-[#E6E3DE] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#7FAF3F]" />
                      </div>
                      <button type="submit" className="w-full bg-[#7FAF3F] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#668F2F] transition-all cursor-pointer">
                        Add Department
                      </button>
                    </form>

                    {/* List */}
                    <div className="md:col-span-2 space-y-3">
                      <h3 className="text-xs font-bold text-[#777A7C] uppercase tracking-wider mb-2">Active Departments</h3>
                      <div className="divide-y divide-[#E6E3DE] border border-[#E6E3DE] rounded-2xl overflow-hidden">
                        {departments.map(d => (
                          <div key={d.id} className="p-4 bg-white flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-[#2D3032] block">{d.name}</span>
                              <span className="text-[#777A7C] text-[10px] mt-0.5 block">{d.description || 'No description provided'}</span>
                            </div>
                            <span className="font-bold text-[#7FAF3F] bg-[#7FAF3F]/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{d.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DESIGNATIONS TAB */}
              {activeSubTab === 'designations' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-[#2D3032]">Designations Structure</h2>
                    <p className="text-xs text-[#777A7C] mt-0.5">Establish corporate hierarchies and employee titles.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-[#E6E3DE] pt-4">
                    {/* Add Desig Form */}
                    <form onSubmit={handleAddDesig} className="bg-[#F7F5F1]/30 border border-[#E6E3DE] p-5 rounded-2xl space-y-4 h-fit">
                      <h3 className="text-xs font-bold text-[#2D3032] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-[#7FAF3F]" /> Create Designation
                      </h3>
                      <div>
                        <label className="block text-[9px] font-bold text-[#777A7C] uppercase tracking-wider mb-1">Title *</label>
                        <input type="text" value={newDesigName} onChange={(e) => setNewDesigName(e.target.value)} required placeholder="e.g. Lead Designer" className="w-full bg-white border border-[#E6E3DE] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#7FAF3F]" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#777A7C] uppercase tracking-wider mb-1">Department *</label>
                        <select value={newDesigDept} onChange={(e) => setNewDesigDept(e.target.value)} required className="w-full bg-white border border-[#E6E3DE] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#7FAF3F]">
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" className="w-full bg-[#7FAF3F] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#668F2F] transition-all cursor-pointer">
                        Create Designation
                      </button>
                    </form>

                    {/* List */}
                    <div className="md:col-span-2 space-y-3">
                      <h3 className="text-xs font-bold text-[#777A7C] uppercase tracking-wider mb-2">System Designations</h3>
                      <div className="divide-y divide-[#E6E3DE] border border-[#E6E3DE] rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto">
                        {designations.map(d => {
                          const dept = departments.find(dep => dep.id === d.departmentId);
                          return (
                            <div key={d.id} className="p-4 bg-white flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-[#2D3032] block">{d.name}</span>
                                <span className="text-[#777A7C] text-[10px] mt-0.5 block">Department: {dept ? dept.name : 'Unknown'}</span>
                              </div>
                              <span className="font-semibold text-[#777A7C]">{d.id}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
