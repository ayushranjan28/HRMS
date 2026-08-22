"use client";
import React, { useState, useEffect } from 'react';
import { Edit2, Mail, Phone, MapPin, Building, Briefcase, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [employee, setEmployee] = useState<any>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedEmp = localStorage.getItem('dayflow_employee');
      if (cachedEmp) {
        setEmployee(JSON.parse(cachedEmp));
      }
    }
  }, []);

  const tabs = ['Overview', 'Personal Information', 'Job Information', 'Salary Information', 'Documents'];

  const name = employee ? `${employee.firstName} ${employee.lastName}` : 'Alex Martin';
  const role = employee?.designationId || 'UI/UX Designer';
  const avatar = employee?.profilePhoto || 'https://i.pravatar.cc/150?u=a042581f4e29026024d';
  const empId = employee?.employeeId || 'OIAlin20230212';
  const department = employee?.departmentId || 'Design';
  const email = employee?.email || 'alex.martin@dayflow.com';
  const phone = employee?.phone || '+1 234 567 8901';
  const joinDate = employee?.joiningDate || '12 Jan 2023';
  const location = employee?.workLocation || 'Bangalore, India';
  const gender = employee?.gender || 'Male';
  const dateOfBirth = employee?.dateOfBirth || '15 Aug 1992';
  const nationality = employee?.country || 'American';
  const baseSalary = employee?.baseSalary ? `₹${employee.baseSalary.toLocaleString('en-IN')} / month` : '₹85,000 / month';


  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-semibold text-[#2D3032]">Profile</h1>
        <button className="flex items-center gap-2 bg-[#7FAF3F] text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-[#668F2F] transition-colors shadow-sm">
          <Edit2 className="w-3.5 h-3.5" /> Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8 mt-2">
        {/* Left Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <div className="flex flex-col items-center bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4 border-4 border-[#F7F5F1]">
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-lg font-bold text-[#2D3032]">{name}</h2>
            <p className="text-xs font-medium text-[#777A7C] mt-1 mb-8">{role}</p>
            
            <div className="w-full space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[13px] font-medium transition-colors ${
                    activeTab === tab 
                      ? 'bg-[#7FAF3F]/10 text-[#7FAF3F] font-semibold' 
                      : 'text-[#777A7C] hover:bg-[#F7F5F1] hover:text-[#2D3032]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="col-span-12 lg:col-span-9 bg-white rounded-2xl p-8 border border-[#E6E3DE] shadow-sm h-fit">
          <h2 className="text-[17px] font-semibold text-[#2D3032] mb-8 pb-4 border-b border-[#E6E3DE]">
            {activeTab}
          </h2>
          
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-2 gap-y-10 gap-x-12">
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Employee ID</div>
                <div className="text-sm font-medium text-[#2D3032]">{empId}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Department</div>
                <div className="text-sm font-medium text-[#2D3032]">{department}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2 flex items-center gap-1"><Mail className="w-3 h-3"/> Email</div>
                <div className="text-sm font-medium text-[#2D3032]">{email}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2 flex items-center gap-1"><Phone className="w-3 h-3"/> Phone</div>
                <div className="text-sm font-medium text-[#2D3032]">{phone}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2 flex items-center gap-1"><MapPin className="w-3 h-3"/> Location</div>
                <div className="text-sm font-medium text-[#2D3032]">{location}</div>
              </div>
            </div>
          )}

          {activeTab === 'Personal Information' && (
            <div className="grid grid-cols-2 gap-y-10 gap-x-12">
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Full Name</div>
                <div className="text-sm font-medium text-[#2D3032]">{name}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Date of Birth</div>
                <div className="text-sm font-medium text-[#2D3032]">{dateOfBirth}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Gender</div>
                <div className="text-sm font-medium text-[#2D3032]">{gender}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Nationality</div>
                <div className="text-sm font-medium text-[#2D3032]">{nationality}</div>
              </div>
            </div>
          )}

          {activeTab === 'Job Information' && (
            <div className="grid grid-cols-2 gap-y-10 gap-x-12">
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Employee ID</div>
                <div className="text-sm font-medium text-[#2D3032]">{empId}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Department</div>
                <div className="text-sm font-medium text-[#2D3032]">{department}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Designation</div>
                <div className="text-sm font-medium text-[#2D3032]">{role}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Reporting To</div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden"><img src="https://i.pravatar.cc/150?u=a042581f4e29026024f" /></div>
                  <div className="text-sm font-medium text-[#2D3032]">Jane Cooper</div>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2 flex items-center gap-1"><Calendar className="w-3 h-3"/> Join Date</div>
                <div className="text-sm font-medium text-[#2D3032]">{joinDate}</div>
              </div>
            </div>
          )}

          {activeTab === 'Salary Information' && (
            <div className="grid grid-cols-2 gap-y-10 gap-x-12">
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Base Salary</div>
                <div className="text-sm font-medium text-[#2D3032]">{baseSalary}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Bank Name</div>
                <div className="text-sm font-medium text-[#2D3032]">HDFC Bank</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9A9C9D] uppercase tracking-wider mb-2">Account Number</div>
                <div className="text-sm font-medium text-[#2D3032]">XXXX XXXX 1234</div>
              </div>
            </div>
          )}

          {activeTab === 'Documents' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 border border-[#E6E3DE] rounded-xl">
                <div className="flex items-center gap-3">
                  <Briefcase className="text-[#7FAF3F] w-5 h-5" />
                  <span className="text-sm font-medium text-[#2D3032]">Offer Letter.pdf</span>
                </div>
                <button className="text-xs font-semibold text-[#7FAF3F]">Download</button>
              </div>
              <div className="flex items-center justify-between p-4 border border-[#E6E3DE] rounded-xl">
                <div className="flex items-center gap-3">
                  <MapPin className="text-[#7FAF3F] w-5 h-5" />
                  <span className="text-sm font-medium text-[#2D3032]">ID Proof.pdf</span>
                </div>
                <button className="text-xs font-semibold text-[#7FAF3F]">Download</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
