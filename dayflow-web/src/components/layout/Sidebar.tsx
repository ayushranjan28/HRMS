"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, CalendarCheck, FileText, User, 
  Folder, Calendar, Bell, BarChart2, Settings, LogOut, 
  Leaf, Crown, Users
} from 'lucide-react';
import { cn } from '@/utils/cn';

const employeeNav = [
  { name: 'My Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'My Attendance', href: '/attendance', icon: CalendarCheck },
  { name: 'Leave & Time-off', href: '/leave', icon: Calendar },
  { name: 'My Payslip', href: '/payroll', icon: FileText },
  { name: 'My Profile', href: '/profile', icon: User },
  { name: 'Documents', href: '/documents', icon: Folder },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Announcements', href: '/announcements', icon: Bell },
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

  return (
    <div className="flex h-full w-[260px] flex-col bg-sidebar text-gray-300 rounded-r-3xl overflow-hidden shadow-2xl z-20">
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
          {pathname.startsWith('/admin') || pathname === '/reports' ? (
            <div className="mb-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Admin Portal</div>
          ) : (
            <div className="mb-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Employee Portal</div>
          )}
          {(pathname.startsWith('/admin') || pathname === '/reports' ? adminNav : employeeNav).map((item) => {
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

        {/* Upgrade Card */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#53414D] to-[#362C34] p-5 relative overflow-hidden shadow-lg mx-1">
          <div className="text-pink-300 mb-3">
            <Crown className="w-6 h-6" />
          </div>
          <h4 className="text-white font-semibold mb-1.5">Upgrade to Pro</h4>
          <p className="text-[11px] text-gray-300 mb-5 leading-relaxed">Unlock advanced analytics, custom reports and more.</p>
          <button className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-between px-4 border border-white/5">
            Upgrade Now <span className="font-bold">→</span>
          </button>
        </div>
      </div>
      
      <div className="p-4 pb-8 space-y-1">
        {!(pathname.startsWith('/admin') || pathname === '/reports') && (
          <button 
            onClick={() => window.location.href = '/admin'}
            className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-400 hover:bg-sidebar-hover hover:text-white transition-all border border-transparent hover:border-gray-600 mb-2"
          >
            <Users className="h-5 w-5" />
            Switch to Admin
          </button>
        )}
        {(pathname.startsWith('/admin') || pathname === '/reports') && (
          <button 
            onClick={() => window.location.href = '/'}
            className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-400 hover:bg-sidebar-hover hover:text-white transition-all border border-transparent hover:border-gray-600 mb-2"
          >
            <User className="h-5 w-5" />
            Switch to Employee
          </button>
        )}
        <button className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-400 hover:bg-sidebar-hover hover:text-white transition-all">
          <Settings className="h-5 w-5" />
          Settings
        </button>
        <button className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-400 hover:bg-sidebar-hover hover:text-white transition-all">
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
