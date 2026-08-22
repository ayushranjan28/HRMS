"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, CalendarCheck, FileText, User, 
  Folder, Calendar, Bell, BarChart2, Settings, LogOut, 
  Leaf, Users, Plane, Wallet
} from 'lucide-react';
import { cn } from '@/utils/cn';
import * as api from '@/services/api';

const employeeNav = [
  { name: 'My Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'My Attendance', href: '/attendance', icon: CalendarCheck },
  { name: 'Leave & Time-off', href: '/leave', icon: Calendar },
  { name: 'Tour Expenses', href: '/tour-expenses', icon: Plane },
  { name: 'My Payslip', href: '/payroll', icon: FileText },
  { name: 'My Profile', href: '/profile', icon: User },
];

const adminNav = [
  { name: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Directory', href: '/admin/directory', icon: Users },
  { name: 'All Attendance', href: '/admin/attendance', icon: CalendarCheck },
  { name: 'Leave Approvals', href: '/admin/leaves', icon: Calendar },
  { name: 'Expense Claims', href: '/admin/expenses', icon: Wallet },
  { name: 'Payroll Control', href: '/admin/payroll', icon: FileText },
  { name: 'Reports & Analytics', href: '/reports', icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<'HR' | 'Employee' | 'Admin'>('Employee');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear legacy role token if it exists
      localStorage.removeItem('dayflow_role');
      
      const cachedUser = localStorage.getItem('dayflow_user');
      if (cachedUser) {
        try {
          setRole(JSON.parse(cachedUser).role);
        } catch (e) {}
      }
    }
  }, []);

  const checkUserRole = async () => {
    try {
      const data = await api.getMe();
      setRole(data.user.role);
    } catch (e) {
      // Ignore API errors, fallback is already set by initial useEffect
    }
  };

  useEffect(() => {
    checkUserRole();
    const interval = setInterval(checkUserRole, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      router.push('/login');
    } catch (e) {
      console.error('Logout error:', e);
      router.push('/login');
    }
  };

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
          {/* Employee Portal Navigation (Visible to Everyone) */}
          <div className="mb-2 mt-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Employee Portal
          </div>
          {employeeNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && !pathname.startsWith('/admin'));
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

          {/* Admin Portal Navigation (Visible to HR/Admin only) */}
          {(role === 'HR' || role === 'Admin') && (
            <>
              <div className="mb-2 mt-6 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Admin Portal
              </div>
              {adminNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/') || (pathname === '/reports' && item.href === '/reports');
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
            </>
          )}
        </nav>
      </div>
      
      <div className="p-4 pb-8 space-y-1">
        {/* The switch button is now removed as both views are visible */}
        
        <button 
          onClick={() => router.push('/admin/settings')}
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
