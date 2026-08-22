"use client";
import React, { useState } from 'react';
import { Search, Filter, Plus, MoreVertical, MapPin, Mail, Phone } from 'lucide-react';

const mockEmployees = [
  { id: 'EMP001', name: 'Alex Martin', role: 'UI/UX Designer', status: 'present', location: 'Bangalore', email: 'alex@dayflow.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
  { id: 'EMP002', name: 'Jane Cooper', role: 'Engineering Lead', status: 'present', location: 'Remote', email: 'jane@dayflow.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024f' },
  { id: 'EMP003', name: 'Robert Fox', role: 'Marketing', status: 'absent', location: 'New York', email: 'robert@dayflow.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024a' },
  { id: 'EMP004', name: 'Cody Fisher', role: 'HR Manager', status: 'leave', location: 'Bangalore', email: 'cody@dayflow.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024b' },
  { id: 'EMP005', name: 'Esther Howard', role: 'Product Manager', status: 'present', location: 'London', email: 'esther@dayflow.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024c' },
  { id: 'EMP006', name: 'Brooklyn Simmons', role: 'Software Engineer', status: 'present', location: 'Bangalore', email: 'brooklyn@dayflow.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024e' },
  { id: 'EMP007', name: 'Leslie Alexander', role: 'QA Tester', status: 'leave', location: 'Remote', email: 'leslie@dayflow.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024g' },
  { id: 'EMP008', name: 'Jenny Wilson', role: 'Support Specialist', status: 'absent', location: 'New York', email: 'jenny@dayflow.com', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024h' },
];

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[28px] font-semibold text-[#2D3032]">Admin Dashboard</h1>
          <p className="text-[#777A7C] text-sm mt-1">Manage employees and view company-wide status.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#7FAF3F] text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#668F2F] transition-colors shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#E6E3DE] shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9C9D]" />
          <input 
            type="text" 
            placeholder="Search employees by name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg pl-10 pr-4 py-2 text-sm font-medium text-[#2D3032] outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors">
            <Filter className="w-4 h-4 text-[#777A7C]" /> Filter
          </button>
          <select className="bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-sm font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors outline-none cursor-pointer">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Design</option>
            <option>HR</option>
          </select>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockEmployees.map((emp) => (
          <div key={emp.id} className="bg-white rounded-2xl border border-[#E6E3DE] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
            {/* Status Dot */}
            <div className="absolute top-4 right-4 z-10">
              <div className="relative flex h-3 w-3">
                {emp.status === 'present' && <span className="absolute inline-flex h-full w-full rounded-full bg-[#7FAF3F] opacity-75 animate-ping"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white ${
                  emp.status === 'present' ? 'bg-[#7FAF3F]' : 
                  emp.status === 'leave' ? 'bg-[#E5A83B]' : 
                  'bg-[#E56B65]'
                }`}></span>
              </div>
            </div>

            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-[#F7F5F1]">
                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-base font-bold text-[#2D3032]">{emp.name}</h3>
              <p className="text-xs font-semibold text-[#7FAF3F] mt-1 mb-1">{emp.role}</p>
              <p className="text-[11px] text-[#9A9C9D] font-medium">{emp.id}</p>
            </div>

            <div className="border-t border-[#E6E3DE] p-4 bg-[#F7F5F1]/50 grid grid-cols-2 gap-4 divide-x divide-[#E6E3DE]">
              <div className="flex flex-col items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#777A7C]" />
                <span className="text-[10px] font-medium text-[#777A7C] truncate w-full text-center">{emp.location}</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 pl-4">
                <Mail className="w-3.5 h-3.5 text-[#777A7C]" />
                <span className="text-[10px] font-medium text-[#777A7C] truncate w-full text-center">Contact</span>
              </div>
            </div>

            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <button className="bg-white text-[#2D3032] text-xs font-bold py-2 px-6 rounded-lg hover:bg-[#F7F5F1] transition-colors w-32 shadow-lg">
                View Profile
              </button>
              <button className="bg-transparent border border-white text-white text-xs font-bold py-2 px-6 rounded-lg hover:bg-white/10 transition-colors w-32">
                Edit Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-[#2D3032] mb-1">Create New User</h2>
            <p className="text-xs text-[#777A7C] mb-6">Add a new employee to the organization.</p>
            
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#777A7C] mb-1.5">Full Name</label>
                <input type="text" className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" placeholder="John Doe" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-[#777A7C] mb-1.5">Email Address</label>
                <input type="email" className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" placeholder="john@dayflow.com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#777A7C] mb-1.5">Employee ID</label>
                  <input type="text" className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" placeholder="EMP010" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#777A7C] mb-1.5">Role</label>
                  <select className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors">
                    <option>Employee</option>
                    <option>HR Admin</option>
                  </select>
                </div>
              </div>

               <div>
                <label className="block text-xs font-semibold text-[#777A7C] mb-1.5">Temporary Password</label>
                <input type="password" className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors" placeholder="••••••••" />
              </div>

              <div className="flex gap-3 mt-8 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-lg text-sm font-semibold hover:bg-[#F7F5F1] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-[#7FAF3F] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#668F2F] transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
