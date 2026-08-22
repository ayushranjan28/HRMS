"use client";
import React from 'react';
import { Search, Bell, MessageSquare, ChevronDown } from 'lucide-react';

export function Header() {
  return (
    <header className="flex h-24 shrink-0 items-center justify-between px-10">
      <div className="flex flex-1 items-center">
        <div className="relative w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={2.5} />
          <input 
            type="text" 
            placeholder="Search employees, documents, leave..." 
            className="w-full bg-white/70 focus:bg-white rounded-full py-3 pl-11 pr-4 text-sm font-medium outline-none transition-colors border border-white/40 focus:border-gray-200 placeholder:text-gray-400 shadow-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
             <kbd className="hidden sm:inline-flex items-center justify-center bg-gray-100 px-1.5 py-0.5 rounded-md text-[11px] font-bold text-gray-500 h-6">⌘K</kbd>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative bg-white rounded-full p-3 text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-100 transition-colors">
          <span className="absolute right-3 top-3 flex h-2 w-2 rounded-full bg-[#F43F5E] ring-2 ring-white"></span>
          <Bell className="h-5 w-5" strokeWidth={2} />
        </button>
        <button className="relative bg-white rounded-full p-3 text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-100 transition-colors">
          <span className="absolute right-3 top-3 flex h-2 w-2 rounded-full bg-[#F43F5E] ring-2 ring-white"></span>
          <MessageSquare className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="flex items-center gap-3 pl-4 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="h-11 w-11 rounded-full bg-gray-200 overflow-hidden shadow-sm">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Alex Martin" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-sm font-bold text-text-primary leading-tight">Alex Martin</span>
            <span className="text-[11px] font-medium text-text-secondary mt-0.5">UI/UX Designer</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
        </div>
      </div>
    </header>
  );
}
