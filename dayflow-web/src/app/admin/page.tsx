"use client";
import React, { useEffect, useState } from 'react';
import { Search, Filter, Plus, MapPin, Mail, Loader2, Edit3, Eye, Trash2 } from 'lucide-react';
import * as api from '@/services/api';

export default function AdminDashboard() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedLoc, setSelectedLoc] = useState('All Locations');

  // Modal Control
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);

  // Departments and Designations list for selector dropdowns
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);

  // Feedback Alerts
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add/Edit Form Fields
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    address: '',
    city: '',
    state: '',
    country: '',
    departmentId: '',
    designationId: '',
    managerId: '',
    joiningDate: '',
    employmentType: 'Full Time',
    workLocation: 'Office',
    status: 'Active',
    profilePhoto: '',
    baseSalary: 4000,
    role: 'Employee'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const emps = await api.getEmployees();
      setEmployees(emps || []);
      
      const settings = await api.getSettings();
      setDepartments(settings.departments || []);
      setDesignations(settings.designations || []);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
      showToast('error', 'Failed to retrieve employee data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.employeeId || !formData.firstName || !formData.lastName || !formData.email || !formData.joiningDate) {
      showToast('error', 'Please fill in all required fields marked with *');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('error', 'Please enter a valid email address');
      return false;
    }
    if (formData.phone && !/^\+?[0-9\s-]{8,15}$/.test(formData.phone)) {
      showToast('error', 'Please enter a valid phone number');
      return false;
    }
    if (formData.baseSalary < 0) {
      showToast('error', 'Salary cannot be negative');
      return false;
    }
    return true;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await api.addEmployee(formData);
      showToast('success', 'Employee added successfully!');
      setIsAddModalOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Unable to save employee';
      showToast('error', msg);
    }
  };

  const handleEditClick = (emp: any) => {
    setEditingEmpId(emp.id);
    setFormData({
      employeeId: emp.employeeId || '',
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      dateOfBirth: emp.dateOfBirth || '',
      gender: emp.gender || 'Male',
      address: emp.address || '',
      city: emp.city || '',
      state: emp.state || '',
      country: emp.country || '',
      departmentId: emp.departmentId || '',
      designationId: emp.designationId || '',
      managerId: emp.managerId || '',
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      employmentType: emp.employmentType || 'Full Time',
      workLocation: emp.workLocation || 'Office',
      status: emp.status || 'Active',
      profilePhoto: emp.profilePhoto || '',
      baseSalary: emp.baseSalary || 4000,
      role: emp.role || 'Employee'
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpId) return;
    if (!validateForm()) return;

    try {
      await api.updateEmployee(editingEmpId, formData);
      showToast('success', 'Employee updated successfully!');
      setIsEditModalOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Unable to update employee';
      showToast('error', msg);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return;

    try {
      await api.deleteEmployee(id);
      showToast('success', 'Employee deactivated successfully');
      loadData();
    } catch (e) {
      showToast('error', 'Failed to deactivate employee');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'Male',
      address: '',
      city: '',
      state: '',
      country: '',
      departmentId: departments[0]?.id || '',
      designationId: designations[0]?.id || '',
      managerId: '',
      joiningDate: new Date().toISOString().split('T')[0],
      employmentType: 'Full Time',
      workLocation: 'Office',
      status: 'Active',
      profilePhoto: '',
      baseSalary: 4000,
      role: 'Employee'
    });
    setEditingEmpId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Client-side filtering logic
  const filteredEmployees = employees.filter(emp => {
    const nameMatch = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     emp.email.toLowerCase().includes(searchTerm.toLowerCase());
                     
    const deptMatch = selectedDept === 'All Departments' || emp.departmentId === selectedDept;
    const statusMatch = selectedStatus === 'All Statuses' || emp.status.toLowerCase() === selectedStatus.toLowerCase();
    const locMatch = selectedLoc === 'All Locations' || emp.workLocation.toLowerCase() === selectedLoc.toLowerCase();

    return nameMatch && deptMatch && statusMatch && locMatch;
  });

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
          <h1 className="text-[28px] font-semibold text-[#2D3032]">Admin Dashboard</h1>
          <p className="text-[#777A7C] text-sm mt-1">Manage employees and view company-wide status.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#7FAF3F] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#668F2F] transition-all shadow-sm w-fit cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E6E3DE] shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9C9D]" />
          <input 
            type="text" 
            placeholder="Search by name, email, or employee ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg pl-10 pr-4 py-2 text-sm font-medium text-[#2D3032] outline-none transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors outline-none cursor-pointer"
          >
            <option value="All Departments">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors outline-none cursor-pointer"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select 
            value={selectedLoc} 
            onChange={(e) => setSelectedLoc(e.target.value)}
            className="bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors outline-none cursor-pointer"
          >
            <option value="All Locations">All Locations</option>
            <option value="Office">Office</option>
            <option value="Remote">Remote</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#777A7C] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#7FAF3F]" />
          <span className="text-sm font-semibold">Loading Directory...</span>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6E3DE] py-20 text-center shadow-sm">
          <p className="text-base font-bold text-[#2D3032]">No employees found</p>
          <p className="text-xs text-[#777A7C] mt-1">Try resetting your search query or department filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((emp) => {
            const deptName = departments.find(d => d.id === emp.departmentId)?.name || 'General';
            const desigName = designations.find(d => d.id === emp.designationId)?.name || 'Staff';
            return (
              <div key={emp.id} className="bg-white rounded-2xl border border-[#E6E3DE] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
                {/* Status Dot */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="relative flex h-3 w-3">
                    {emp.status.toLowerCase() === 'active' && <span className="absolute inline-flex h-full w-full rounded-full bg-[#7FAF3F] opacity-75 animate-ping"></span>}
                    <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white ${
                      emp.status.toLowerCase() === 'active' ? 'bg-[#7FAF3F]' : 
                      emp.status.toLowerCase() === 'on leave' ? 'bg-[#E5A83B]' : 
                      'bg-[#E56B65]'
                    }`}></span>
                  </div>
                </div>

                <div className="p-6 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-[#F7F5F1] shadow-inner bg-gray-100 flex items-center justify-center">
                    <img 
                      src={emp.profilePhoto || 'https://i.pravatar.cc/150'} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://i.pravatar.cc/150'; }}
                    />
                  </div>
                  <h3 className="text-base font-bold text-[#2D3032]">{emp.firstName} {emp.lastName}</h3>
                  <p className="text-xs font-semibold text-[#7FAF3F] mt-1 mb-1">{desigName}</p>
                  <p className="text-[10px] text-[#9A9C9D] font-bold tracking-wider">{emp.employeeId} • {deptName}</p>
                </div>

                <div className="border-t border-[#E6E3DE] p-4 bg-[#F7F5F1]/30 grid grid-cols-2 gap-4 divide-x divide-[#E6E3DE]">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#777A7C]" />
                    <span className="text-[10px] font-bold text-[#777A7C] truncate w-full text-center">{emp.workLocation}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 pl-4">
                    <Mail className="w-3.5 h-3.5 text-[#777A7C]" />
                    <span className="text-[10px] font-bold text-[#777A7C] truncate w-full text-center">Contact</span>
                  </div>
                </div>

                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-[#2B2E33]/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm z-20">
                  <button 
                    onClick={() => window.location.href = `/admin/employees/${emp.id}`}
                    className="flex items-center justify-center gap-2 bg-white text-[#2D3032] text-xs font-bold py-2.5 px-6 rounded-xl hover:bg-[#F7F5F1] transition-all w-36 shadow-lg active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Profile
                  </button>
                  <button 
                    onClick={() => handleEditClick(emp)}
                    className="flex items-center justify-center gap-2 bg-[#7FAF3F] text-white text-xs font-bold py-2.5 px-6 rounded-xl hover:bg-[#668F2F] transition-all w-36 shadow-lg active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Details
                  </button>
                  {emp.status !== 'Inactive' && (
                    <button 
                      onClick={() => handleDeactivate(emp.id, `${emp.firstName} ${emp.lastName}`)}
                      className="flex items-center justify-center gap-2 bg-[#E56B65]/10 border border-[#E56B65] text-[#E56B65] text-xs font-bold py-1.5 px-6 rounded-xl hover:bg-[#E56B65]/20 transition-all w-36 active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= ADD / EDIT EMPLOYEE MODAL ================= */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl relative max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-[#2D3032] mb-1">
              {isAddModalOpen ? 'Add New Employee' : 'Edit Employee Details'}
            </h2>
            <p className="text-xs text-[#777A7C] mb-6">Enter official employment details and registration parameters.</p>
            
            <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-6">
              {/* Section 1: Personal Details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7FAF3F] mb-3">1. Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">First Name *</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Last Name *</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors" placeholder="Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Date of Birth</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Personal Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors" placeholder="john.doe@gmail.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors" placeholder="+91 98765 43210" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors" placeholder="Street Address" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                    <div>
                      <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-3 py-2 text-sm outline-none transition-colors" placeholder="City" />
                    </div>
                    <div>
                      <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-3 py-2 text-sm outline-none transition-colors" placeholder="State" />
                    </div>
                    <div>
                      <input type="text" name="country" value={formData.country} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-3 py-2 text-sm outline-none transition-colors" placeholder="Country" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Profile Photo URL</label>
                    <input type="text" name="profilePhoto" value={formData.profilePhoto} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors" placeholder="https://i.pravatar.cc/150..." />
                  </div>
                </div>
              </div>

              {/* Section 2: Employment Details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7FAF3F] mb-3">2. Employment Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Employee ID *</label>
                    <input type="text" name="employeeId" value={formData.employeeId} onChange={handleInputChange} required disabled={isEditModalOpen} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors disabled:opacity-50" placeholder="EMP010" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Work Location</label>
                    <select name="workLocation" value={formData.workLocation} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors">
                      <option value="Office">Office</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Department *</label>
                    <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} required className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors">
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Designation *</label>
                    <select name="designationId" value={formData.designationId} onChange={handleInputChange} required className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors">
                      <option value="">Select Designation</option>
                      {designations.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Employment Type</label>
                    <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors">
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Joining Date *</label>
                    <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Base Salary ($ / Month)</label>
                    <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Reporting Manager ID</label>
                    <input type="text" name="managerId" value={formData.managerId} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors" placeholder="EMP002" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">Employment Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors">
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-1.5">System Portal Role</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2 text-sm outline-none transition-colors">
                      <option value="Employee">Employee (Timesheets only)</option>
                      <option value="HR">HR Officer / Administrator</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-[#E6E3DE]">
                <button 
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#F7F5F1] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#7FAF3F] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#668F2F] transition-all cursor-pointer shadow-md active:scale-95"
                >
                  {isAddModalOpen ? 'Create Profile' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
