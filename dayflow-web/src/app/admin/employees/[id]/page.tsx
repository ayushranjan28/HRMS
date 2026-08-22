"use client";
import React, { useEffect, useState, use } from 'react';
import { 
  ArrowLeft, Mail, Phone, Calendar, Briefcase, MapPin, 
  Clock, Shield, DollarSign, Edit3, Save, CheckCircle, 
  XCircle, ChevronRight, FileText, Loader2 
} from 'lucide-react';
import * as api from '@/services/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EmployeeProfile({ params }: PageProps) {
  const { id: employeeId } = use(params);

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<any[]>([]);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'leaves' | 'payroll'>('profile');
  
  // Feedback
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Departments and Designations (for edit select options)
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const data = await api.getEmployeeDetail(employeeId);
      setEmployee(data.employee);
      setFormData(data.employee);
      setAttendance(data.attendance || []);
      setLeaveRequests(data.leaveRequests || []);
      setLeaveBalances(data.leaveBalances || []);
      setPayrollHistory(data.payroll || []);

      const settings = await api.getSettings();
      setDepartments(settings.departments || []);
      setDesignations(settings.designations || []);
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to retrieve employee profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [employeeId]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const updated = await api.updateEmployee(employeeId, formData);
      setEmployee(updated);
      setIsEditing(false);
      showToast('success', 'Profile updated successfully!');
      loadProfileData();
    } catch (e) {
      showToast('error', 'Failed to save changes');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-[#777A7C] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#7FAF3F]" />
        <span className="text-sm font-semibold">Loading Profile...</span>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="bg-white rounded-2xl border border-[#E6E3DE] py-20 text-center shadow-sm max-w-lg mx-auto mt-10">
        <p className="text-base font-bold text-[#2D3032]">Employee not found</p>
        <button 
          onClick={() => window.location.href = '/admin/directory'}
          className="mt-4 bg-[#7FAF3F] text-white px-4 py-2 rounded-lg text-xs font-semibold"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const deptName = departments.find(d => d.id === employee.departmentId)?.name || 'General';
  const desigName = designations.find(d => d.id === employee.designationId)?.name || 'Staff';

  // Calculate attendance counters
  const totalDays = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day' || a.status === 'Work From Home').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;

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

      {/* Back Button & Title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.location.href = '/admin/directory'}
          className="bg-white border border-[#E6E3DE] rounded-xl p-2.5 text-[#2D3032] hover:bg-[#F7F5F1] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#2D3032]">Employee Profile</h1>
          <p className="text-xs text-[#777A7C]">Manage records for {employee.firstName} {employee.lastName}.</p>
        </div>
      </div>

      {/* Profile Summary Card */}
      <div className="bg-white rounded-2xl border border-[#E6E3DE] p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#F7F5F1] shadow-inner bg-gray-100 flex items-center justify-center shrink-0">
          <img src={employee.profilePhoto || 'https://i.pravatar.cc/150'} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
            <h2 className="text-xl font-bold text-[#2D3032]">{employee.firstName} {employee.lastName}</h2>
            <span className={`inline-flex self-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
              employee.status.toLowerCase() === 'active' ? 'bg-[#7FAF3F]/10 text-[#7FAF3F]' :
              employee.status.toLowerCase() === 'on leave' ? 'bg-[#E5A83B]/10 text-[#E5A83B]' :
              'bg-[#E56B65]/10 text-[#E56B65]'
            }`}>
              {employee.status}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#7FAF3F] mt-1">{desigName} • {deptName}</p>
          <p className="text-[10px] text-[#9A9C9D] font-bold mt-1 uppercase tracking-wider">{employee.employeeId} • {employee.employmentType}</p>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-[#7FAF3F] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#668F2F] shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" /> Save Profile
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-white border border-[#E6E3DE] text-[#2D3032] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#F7F5F1] shadow-sm transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#E6E3DE]">
        {[
          { id: 'profile', name: 'Profile Details' },
          { id: 'attendance', name: 'Attendance Logs' },
          { id: 'leaves', name: 'Leave Summary' },
          { id: 'payroll', name: 'Payroll Slips' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === t.id ? 'text-[#7FAF3F]' : 'text-[#777A7C] hover:text-[#2D3032]'
            }`}
          >
            {t.name}
            {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7FAF3F] rounded-t-full"></div>}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* PANEL 1: Profile Details */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="bg-white rounded-2xl border border-[#E6E3DE] p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7FAF3F] border-b border-[#E6E3DE] pb-2">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">First Name</span>
                  {isEditing ? (
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]" />
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">{employee.firstName}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Last Name</span>
                  {isEditing ? (
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]" />
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">{employee.lastName}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Date of Birth</span>
                  {isEditing ? (
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]" />
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">{employee.dateOfBirth || '--'}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Gender</span>
                  {isEditing ? (
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">{employee.gender || '--'}</span>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Address</span>
                  {isEditing ? (
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]" />
                  ) : (
                    <span className="text-xs font-semibold text-[#2D3032]">{employee.address || '--'}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">City</span>
                  {isEditing ? (
                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]" />
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">{employee.city || '--'}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Country</span>
                  {isEditing ? (
                    <input type="text" name="country" value={formData.country} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]" />
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">{employee.country || '--'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Employment and Contact Details */}
            <div className="bg-white rounded-2xl border border-[#E6E3DE] p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7FAF3F] border-b border-[#E6E3DE] pb-2">Employment Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Email Address</span>
                  {isEditing ? (
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]" />
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">{employee.email}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Phone Number</span>
                  {isEditing ? (
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]" />
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">{employee.phone || '--'}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Department</span>
                  {isEditing ? (
                    <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]">
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">{deptName}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Designation</span>
                  {isEditing ? (
                    <select name="designationId" value={formData.designationId} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]">
                      {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">{desigName}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Employment Type</span>
                  {isEditing ? (
                    <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]">
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">{employee.employmentType}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Joining Date</span>
                  <span className="text-xs font-bold text-[#2D3032]">{employee.joiningDate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Basic Salary</span>
                  {isEditing ? (
                    <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]" />
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">₹{employee.baseSalary?.toLocaleString('en-IN') || '4,000'} / Month</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#777A7C] uppercase tracking-wider block">Work Location</span>
                  {isEditing ? (
                    <select name="workLocation" value={formData.workLocation} onChange={handleInputChange} className="w-full bg-[#F7F5F1] rounded px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#7FAF3F]">
                      <option value="Office">Office</option>
                      <option value="Remote">Remote</option>
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-[#2D3032]">{employee.workLocation}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: Attendance Logs */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl border border-[#E6E3DE] p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#F7F5F1]/30 p-4 rounded-xl border border-[#E6E3DE] text-center">
                <span className="text-[10px] font-bold text-[#777A7C] uppercase block">Total logged days</span>
                <span className="text-2xl font-bold text-[#2D3032]">{totalDays}</span>
              </div>
              <div className="bg-[#F7F5F1]/30 p-4 rounded-xl border border-[#E6E3DE] text-center">
                <span className="text-[10px] font-bold text-[#777A7C] uppercase block">Presents</span>
                <span className="text-2xl font-bold text-[#7FAF3F]">{presentCount}</span>
              </div>
              <div className="bg-[#F7F5F1]/30 p-4 rounded-xl border border-[#E6E3DE] text-center">
                <span className="text-[10px] font-bold text-[#777A7C] uppercase block">Attendance Rate</span>
                <span className="text-2xl font-bold text-[#67AFA5]">{attendanceRate}%</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F7F5F1] text-[#777A7C] text-xs uppercase tracking-wider border-b border-[#E6E3DE]">
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Check In</th>
                    <th className="py-3 px-4 font-semibold">Check Out</th>
                    <th className="py-3 px-4 font-semibold">Hours Worked</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Location</th>
                  </tr>
                </thead>
                <tbody className="text-[#2D3032] divide-y divide-[#E6E3DE]">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#777A7C]">No attendance records found for this employee.</td>
                    </tr>
                  ) : (
                    attendance.map((att) => (
                      <tr key={att.id} className="hover:bg-[#F7F5F1]/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-xs">{att.date}</td>
                        <td className="py-3 px-4 text-xs font-medium">{att.checkIn || '--'}</td>
                        <td className="py-3 px-4 text-xs font-medium">{att.checkOut || '--'}</td>
                        <td className="py-3 px-4 text-xs font-semibold">{att.totalHours || '--'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            att.status === 'Present' ? 'bg-[#7FAF3F]/10 text-[#7FAF3F]' :
                            att.status === 'Late' ? 'bg-[#E5A83B]/10 text-[#E5A83B]' :
                            att.status === 'On Leave' ? 'bg-[#7A70C7]/10 text-[#7A70C7]' :
                            'bg-[#E56B65]/10 text-[#E56B65]'
                          }`}>
                            {att.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#777A7C] font-semibold">{att.location || '--'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PANEL 3: Leave Summary */}
        {activeTab === 'leaves' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Balances */}
            <div className="bg-white rounded-2xl border border-[#E6E3DE] p-6 shadow-sm space-y-4 h-fit">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7FAF3F] border-b border-[#E6E3DE] pb-2">Available Balances</h3>
              <div className="space-y-3">
                {leaveBalances.map((b) => (
                  <div key={b.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#777A7C]">{b.leaveType}</span>
                    <span className="font-bold text-[#2D3032]">{b.remaining} / {b.allocated} Days</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requests History */}
            <div className="bg-white rounded-2xl border border-[#E6E3DE] p-6 shadow-sm space-y-4 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7FAF3F] border-b border-[#E6E3DE] pb-2">Leave Request History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F7F5F1] text-[#777A7C] text-xs uppercase tracking-wider border-b border-[#E6E3DE]">
                      <th className="py-3 px-4 font-semibold">Type</th>
                      <th className="py-3 px-4 font-semibold">Duration</th>
                      <th className="py-3 px-4 font-semibold">Reason</th>
                      <th className="py-3 px-4 font-semibold">Applied</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#2D3032] divide-y divide-[#E6E3DE]">
                    {leaveRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-[#777A7C]">No leave requests submitted.</td>
                      </tr>
                    ) : (
                      leaveRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-[#F7F5F1]/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-xs">{req.leaveType}</td>
                          <td className="py-3 px-4 text-xs font-bold">{req.duration} Day{req.duration > 1 ? 's' : ''} ({req.startDate} - {req.endDate})</td>
                          <td className="py-3 px-4 text-xs max-w-[150px] truncate" title={req.reason}>{req.reason}</td>
                          <td className="py-3 px-4 text-xs text-[#777A7C]">{req.appliedAt}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              req.status === 'Approved' ? 'bg-[#7FAF3F]/10 text-[#7FAF3F]' :
                              req.status === 'Pending' ? 'bg-[#E5A83B]/10 text-[#E5A83B]' :
                              'bg-[#E56B65]/10 text-[#E56B65]'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 4: Payroll Slips */}
        {activeTab === 'payroll' && (
          <div className="bg-white rounded-2xl border border-[#E6E3DE] p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7FAF3F] border-b border-[#E6E3DE] pb-2">Payslips Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F7F5F1] text-[#777A7C] text-xs uppercase tracking-wider border-b border-[#E6E3DE]">
                    <th className="py-3 px-4 font-semibold">Pay Period</th>
                    <th className="py-3 px-4 font-semibold">Basic Salary</th>
                    <th className="py-3 px-4 font-semibold">Allowances</th>
                    <th className="py-3 px-4 font-semibold">Gross Salary</th>
                    <th className="py-3 px-4 font-semibold">Total Deductions</th>
                    <th className="py-3 px-4 font-semibold">Net Salary</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[#2D3032] divide-y divide-[#E6E3DE]">
                  {payrollHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[#777A7C]">No payslips available for this employee.</td>
                    </tr>
                  ) : (
                    payrollHistory.map((pay) => (
                      <tr key={pay.id} className="hover:bg-[#F7F5F1]/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-xs">{pay.payrollMonth}</td>
                        <td className="py-3 px-4 text-xs font-semibold">₹{pay.basicSalary?.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-xs">₹{pay.allowances?.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-xs font-bold">₹{pay.grossSalary?.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-xs text-[#E56B65] font-semibold">₹{pay.totalDeductions?.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-xs text-[#7FAF3F] font-bold">₹{pay.netSalary?.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            pay.status === 'Paid' ? 'bg-[#7FAF3F]/10 text-[#7FAF3F]' : 'bg-[#E5A83B]/10 text-[#E5A83B]'
                          }`}>
                            {pay.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button 
                            onClick={() => alert(`Format printable payslip for Month: ${pay.payrollMonth}\nGross: $${pay.grossSalary}\nNet: $${pay.netSalary}`)}
                            className="text-[#7FAF3F] hover:text-[#668F2F] font-semibold text-xs flex items-center justify-end gap-1.5 cursor-pointer ml-auto"
                          >
                            <FileText className="w-3.5 h-3.5" /> Payslip
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
