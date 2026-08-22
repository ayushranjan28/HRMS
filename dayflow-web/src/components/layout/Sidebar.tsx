"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, CalendarCheck, FileText, User, 
  Folder, Calendar, Bell, BarChart2, Settings, LogOut, 
  Leaf, Users
} from 'lucide-react';
import { cn } from '@/utils/cn';
import * as api from '@/services/api';

const employeeNav = [
  { name: 'My Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'My Attendance', href: '/attendance', icon: CalendarCheck },
  { name: 'Leave & Time-off', href: '/leave', icon: Calendar },
  { name: 'My Payslip', href: '/payroll', icon: FileText },
  { name: 'My Profile', href: '/profile', icon: User },
];

const adminNav = [
  { name: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Directory', href: '/admin/directory', icon: Users },
  { name: 'All Attendance', href: '/admin/attendance', icon: CalendarCheck },
  { name: 'Leave Approvals', href: '/admin/leaves', icon: Calendar },
  { name: 'Payroll Control', href: '/admin/payroll', icon: FileText },
  { name: 'Reports & Analytics', href: '/reports', icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<'HR' | 'Employee'>('HR');

  const checkUserRole = async () => {
    try {
      const data = await api.getMe();
      setRole(data.user.role);
    } catch (e) {
      if (typeof window !== 'undefined') {
        const cachedUser = localStorage.getItem('dayflow_user');
        if (cachedUser) {
          setRole(JSON.parse(cachedUser).role);
        }
      }
    }
  };

  useEffect(() => {
    checkUserRole();
    // Poll role every 5 seconds to stay updated
    const interval = setInterval(checkUserRole, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleSwitch = async () => {
    try {
      const data = await api.switchRole();
      setRole(data.user.role);
      window.location.href = data.user.role === 'HR' ? '/admin' : '/';
    } catch (e) {
      console.error('Error switching role:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      window.location.href = '/login';
    } catch (e) {
      console.error('Logout error:', e);
      window.location.href = '/login';
    }
  };

  const isAdminView = pathname.startsWith('/admin') || pathname === '/reports';

  return (
    <div className="flex h-full w-[260px] flex-col bg-sidebar text-gray-300 rounded-r-3xl overflow-hidden shadow-2xl z-20 shrink-0">
      <div className="flex h-24 shrink-0 items-center px-8">
        <div className="flex items-center gap-2">
          <Leaf className="h-8 w-8 text-brand-green" fill="currentColor" />
          <div className="flex flex-col ml-1">
             <span className="text-white font-bold text-2xl leading-tight tracking-tight">Dayflow</span>
             <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] mt-0.5">HRMS</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-2 space-y-1">
        <nav className="flex-1 space-y-1.5">
          {role === 'HR' ? (
            <div className="mb-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {isAdminView ? 'Admin Portal' : 'Employee Portal'}
            </div>
          ) : (
            <div className="mb-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Employee Portal
            </div>
          )}
          {(role === 'HR' && isAdminView ? adminNav : employeeNav).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[15px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-active text-white shadow-sm'
                    : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-white transition-colors")} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 pb-8 space-y-1">
        {/* Switch Buttons for HR Admins to view both sides */}
        {role === 'HR' && (
          <button 
            onClick={handleRoleSwitch}
            className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-400 hover:bg-sidebar-hover hover:text-white transition-all border border-transparent hover:border-gray-600 mb-2 cursor-pointer"
          >
            {isAdminView ? (
              <>
                <User className="h-5 w-5" />
                Switch to Employee
              </>
            ) : (
              <>
                <Users className="h-5 w-5" />
                Switch to Admin
              </>
            )}
          </button>
        )}
        
        <button 
          onClick={() => window.location.href = '/admin/settings'}
          className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-400 hover:bg-sidebar-hover hover:text-white transition-all cursor-pointer"
        >
          <Settings className="h-5 w-5" />
          Settings
        </button>
        
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-400 hover:bg-sidebar-hover hover:text-[#E56B65] transition-all cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
