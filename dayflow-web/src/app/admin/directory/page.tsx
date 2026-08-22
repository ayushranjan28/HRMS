"use client";
import React, { useEffect, useState } from 'react';
import { Search, Filter, Eye, Edit3, Trash2, ChevronLeft, ChevronRight, Download, RefreshCw, MapPin } from 'lucide-react';
import * as api from '@/services/api';

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDesig, setSelectedDesig] = useState('All');
  const [selectedLoc, setSelectedLoc] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals and Toast
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const emps = await api.getEmployees();
      setEmployees(emps || []);

      const settings = await api.getSettings();
      setDepartments(settings.departments || []);
      setDesignations(settings.designations || []);
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to retrieve directory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
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

  const handleExportCSV = () => {
    if (employees.length === 0) return;
    const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Joining Date', 'Type', 'Location', 'Status', 'Salary'];
    const rows = employees.map(emp => [
      emp.employeeId,
      `${emp.firstName} ${emp.lastName}`,
      emp.email,
      emp.phone,
      emp.joiningDate,
      emp.employmentType,
      emp.workLocation,
      emp.status,
      emp.baseSalary
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Sort Logic
  const filtered = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const searchMatch = fullName.includes(searchTerm.toLowerCase()) ||
                        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const deptMatch = selectedDept === 'All' || emp.departmentId === selectedDept;
    const desigMatch = selectedDesig === 'All' || emp.designationId === selectedDesig;
    const locMatch = selectedLoc === 'All' || emp.workLocation.toLowerCase() === selectedLoc.toLowerCase();
    const statusMatch = selectedStatus === 'All' || emp.status.toLowerCase() === selectedStatus.toLowerCase();
    const typeMatch = selectedType === 'All' || emp.employmentType === selectedType;

    return searchMatch && deptMatch && desigMatch && locMatch && statusMatch && typeMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    } else if (sortBy === 'name-desc') {
      return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
    } else if (sortBy === 'id-asc') {
      return a.employeeId.localeCompare(b.employeeId);
    } else if (sortBy === 'id-desc') {
      return b.employeeId.localeCompare(a.employeeId);
    } else if (sortBy === 'date-asc') {
      return new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime();
    } else if (sortBy === 'date-desc') {
      return new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime();
    }
    return 0;
  });

  // Pagination Slice
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
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
          <h1 className="text-[28px] font-semibold text-[#2D3032]">Employee Directory</h1>
          <p className="text-[#777A7C] text-sm mt-1">View, search, and manage corporate employee roster.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-[#E6E3DE] text-[#2D3032] rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#F7F5F1] transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={loadData}
            className="flex items-center justify-center p-2.5 bg-white border border-[#E6E3DE] text-[#2D3032] rounded-lg hover:bg-[#F7F5F1] transition-all cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filtering Toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E3DE] shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9C9D]" />
            <input 
              type="text" 
              placeholder="Search by name, ID or email..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg pl-10 pr-4 py-2 text-sm font-medium text-[#2D3032] outline-none transition-colors"
            />
          </div>

          <select 
            value={selectedDept} 
            onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
            className="bg-[#F7F5F1] border border-transparent rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] outline-none cursor-pointer"
          >
            <option value="All">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select 
            value={selectedDesig} 
            onChange={(e) => { setSelectedDesig(e.target.value); setCurrentPage(1); }}
            className="bg-[#F7F5F1] border border-transparent rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] outline-none cursor-pointer"
          >
            <option value="All">All Designations</option>
            {designations.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-[#E6E3DE] pt-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777A7C]">Location:</span>
            <select value={selectedLoc} onChange={(e) => { setSelectedLoc(e.target.value); setCurrentPage(1); }} className="bg-transparent border-none text-xs font-bold text-[#2D3032] outline-none cursor-pointer">
              <option value="All">All Locations</option>
              <option value="Office">Office</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <div className="flex items-center gap-2 border-l border-[#E6E3DE] pl-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777A7C]">Status:</span>
            <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }} className="bg-transparent border-none text-xs font-bold text-[#2D3032] outline-none cursor-pointer">
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2 border-l border-[#E6E3DE] pl-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777A7C]">Employment:</span>
            <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }} className="bg-transparent border-none text-xs font-bold text-[#2D3032] outline-none cursor-pointer">
              <option value="All">All Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>

          <div className="flex items-center gap-2 border-l border-[#E6E3DE] pl-4 ml-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777A7C]">Sort By:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent border-none text-xs font-bold text-[#7FAF3F] outline-none cursor-pointer">
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="id-asc">Employee ID (Low to High)</option>
              <option value="id-desc">Employee ID (High to Low)</option>
              <option value="date-asc">Joining Date (Oldest First)</option>
              <option value="date-desc">Joining Date (Newest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="bg-white rounded-2xl border border-[#E6E3DE] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-[#777A7C] font-semibold text-sm">
            Loading directory data...
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-base font-bold text-[#2D3032]">No employees found</p>
            <p className="text-xs text-[#777A7C] mt-1">No database records match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-[#F7F5F1] text-[#777A7C] text-xs uppercase tracking-wider border-b border-[#E6E3DE]">
                  <th className="py-4 px-6 font-semibold">Employee</th>
                  <th className="py-4 px-6 font-semibold">Employee ID</th>
                  <th className="py-4 px-6 font-semibold">Department</th>
                  <th className="py-4 px-6 font-semibold">Designation</th>
                  <th className="py-4 px-6 font-semibold">Email</th>
                  <th className="py-4 px-6 font-semibold">Phone</th>
                  <th className="py-4 px-6 font-semibold">Location</th>
                  <th className="py-4 px-6 font-semibold">Joining Date</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[#2D3032] divide-y divide-[#E6E3DE]">
                {paginated.map((emp) => {
                  const dept = departments.find(d => d.id === emp.departmentId)?.name || 'General';
                  const desig = designations.find(d => d.id === emp.designationId)?.name || 'Staff';
                  return (
                    <tr key={emp.id} className="hover:bg-[#F7F5F1]/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img 
                            src={emp.profilePhoto || 'https://i.pravatar.cc/150'} 
                            alt="" 
                            className="w-9 h-9 rounded-full object-cover border border-[#E6E3DE]" 
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://i.pravatar.cc/150'; }}
                          />
                          <div>
                            <div className="font-bold text-sm text-[#2D3032]">{emp.firstName} {emp.lastName}</div>
                            <div className="text-[10px] font-bold text-[#7FAF3F] mt-0.5">{emp.employmentType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-xs text-[#777A7C]">{emp.employeeId}</td>
                      <td className="py-4 px-6 font-semibold text-xs text-[#2D3032]">{dept}</td>
                      <td className="py-4 px-6 font-semibold text-xs text-[#777A7C]">{desig}</td>
                      <td className="py-4 px-6 text-xs font-medium text-[#2D3032]">{emp.email}</td>
                      <td className="py-4 px-6 text-xs text-[#777A7C]">{emp.phone || '--'}</td>
                      <td className="py-4 px-6 text-xs font-semibold text-[#2D3032]">{emp.workLocation}</td>
                      <td className="py-4 px-6 text-xs text-[#777A7C]">{emp.joiningDate}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status.toLowerCase() === 'active' ? 'bg-[#7FAF3F]/10 text-[#7FAF3F]' :
                          emp.status.toLowerCase() === 'on leave' ? 'bg-[#E5A83B]/10 text-[#E5A83B]' :
                          'bg-[#E56B65]/10 text-[#E56B65]'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => window.location.href = `/admin/employees/${emp.id}`}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#777A7C] hover:bg-[#F7F5F1] transition-all cursor-pointer"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {emp.status !== 'Inactive' && (
                            <button 
                              onClick={() => handleDeactivate(emp.id, `${emp.firstName} ${emp.lastName}`)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#E56B65] hover:bg-[#E56B65]/10 transition-all cursor-pointer"
                              title="Deactivate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E6E3DE] bg-[#F7F5F1]/30 flex items-center justify-between">
            <span className="text-xs text-[#777A7C] font-semibold">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} employees
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#E6E3DE] bg-white hover:bg-[#F7F5F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    currentPage === i + 1 ? 'bg-[#7FAF3F] text-white' : 'bg-white border border-[#E6E3DE] text-[#2D3032] hover:bg-[#F7F5F1]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#E6E3DE] bg-white hover:bg-[#F7F5F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
