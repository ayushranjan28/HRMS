"use client";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Loader2 } from 'lucide-react';
import * as api from '@/services/api';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = () => {
      if (typeof window === 'undefined') return;

      const cachedUser = localStorage.getItem('dayflow_user');
      if (cachedUser) {
        const user = JSON.parse(cachedUser);
        const isEmployee = user.role !== 'HR';
        const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/reports');

        if (isEmployee && isAdminPath) {
          // Employee trying to access Admin portal - redirect
          setAccessDeniedMsg('Access Denied. You do not have permission to view Admin pages.');
          router.replace('/');
          setTimeout(() => setAccessDeniedMsg(null), 5000);
        }
      }
      setCheckingAuth(false);
    };

    checkAccess();
  }, [pathname, router]);

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#F7F5F1] text-[#777A7C] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#7FAF3F]" />
        <span className="text-sm font-semibold">Loading Dayflow HRMS...</span>
      </div>
    );
  }

  // Login page layout (Full Screen)
  if (pathname === '/login') {
    return <div className="w-full h-full">{children}</div>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Alert toast for access violations */}
      {accessDeniedMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[#E56B65] text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm">
          {accessDeniedMsg}
        </div>
      )}

      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-10 pb-10 pt-2">
          <div className="mx-auto max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
