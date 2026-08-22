"use client";
import React, { useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';

export default function LeavePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to generate calendar grids
  const renderMonth = (month: string, days: number, startDay: number, highlightDays: number[] = []) => (
    <div className="flex flex-col mb-4">
      <h3 className="text-xs font-bold text-[#2D3032] mb-2">{month} 2024</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
        <div className="font-semibold text-[#9A9C9D]">S</div>
        <div className="font-semibold text-[#9A9C9D]">M</div>
        <div className="font-semibold text-[#9A9C9D]">T</div>
        <div className="font-semibold text-[#9A9C9D]">W</div>
        <div className="font-semibold text-[#9A9C9D]">T</div>
        <div className="font-semibold text-[#9A9C9D]">F</div>
        <div className="font-semibold text-[#9A9C9D]">S</div>
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
        {Array.from({ length: days }).map((_, i) => {
          const isHighlighted = highlightDays.includes(i + 1);
          return (
            <div key={i} className={`py-1 rounded-full ${isHighlighted ? 'bg-[#E56B65] text-white font-bold' : 'text-[#777A7C] hover:bg-[#F7F5F1] cursor-pointer'}`}>
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-semibold text-[#2D3032]">Leave & Time-off</h1>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6E3DE] shadow-sm flex flex-col overflow-hidden">
        
        {/* Top Control Bar matching Wireframe */}
        <div className="bg-[#F7F5F1] px-6 py-4 border-b border-[#E6E3DE]">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#A855F7] text-white rounded-lg px-6 py-2.5 text-sm font-bold hover:bg-[#9333EA] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> NEW
          </button>
        </div>

        <div className="grid grid-cols-2 divide-x divide-[#E6E3DE] border-b border-[#E6E3DE]">
          <div className="p-6 flex flex-col items-center justify-center bg-white">
            <span className="text-sm font-semibold text-[#3B82F6] uppercase tracking-wider mb-2">Paid time Off</span>
            <span className="text-2xl font-bold text-[#2D3032]">24 Days Available</span>
          </div>
          <div className="p-6 flex flex-col items-center justify-center bg-white">
            <span className="text-sm font-semibold text-[#3B82F6] uppercase tracking-wider mb-2">Sick time off</span>
            <span className="text-2xl font-bold text-[#2D3032]">07 Days Available</span>
          </div>
        </div>

        {/* Yearly Calendar View */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {renderMonth('January', 31, 1)}
            {renderMonth('February', 29, 4)}
            {renderMonth('March', 31, 5)}
            {renderMonth('April', 30, 1)}
            {renderMonth('May', 31, 3, [13, 14])}
            {renderMonth('June', 30, 6)}
            {renderMonth('July', 31, 1, [2, 3])}
            {renderMonth('August', 31, 4)}
            {renderMonth('September', 30, 0)}
            {renderMonth('October', 31, 2)}
            {renderMonth('November', 30, 5)}
            {renderMonth('December', 31, 0)}
          </div>
        </div>
      </div>

      {/* Time off Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden border border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-medium text-white">Time off Type Request</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 flex flex-col gap-6">
              <div className="flex items-center gap-6">
                <label className="w-32 text-sm font-medium text-gray-300">Employee</label>
                <div className="text-[#3B82F6] font-semibold text-sm">[Employee]</div>
              </div>
              
              <div className="flex items-center gap-6">
                <label className="w-32 text-sm font-medium text-gray-300">Time off Type</label>
                <select className="flex-1 bg-transparent text-[#3B82F6] font-semibold text-sm outline-none border-b border-gray-700 pb-1 cursor-pointer">
                  <option className="bg-[#1A1A1A] text-white">Paid Time off</option>
                  <option className="bg-[#1A1A1A] text-white">Sick Leave</option>
                  <option className="bg-[#1A1A1A] text-white">Unpaid Leaves</option>
                </select>
              </div>

              <div className="flex items-center gap-6">
                <label className="w-32 text-sm font-medium text-gray-300">Validity Period</label>
                <div className="flex items-center gap-4 text-[#3B82F6] font-semibold text-sm">
                  <span className="border-b border-gray-700 pb-1 cursor-pointer">May 13</span>
                  <span className="text-gray-400">To</span>
                  <span className="border-b border-gray-700 pb-1 cursor-pointer">May 14</span>
                </div>
              </div>

               <div className="flex items-center gap-6">
                <label className="w-32 text-sm font-medium text-gray-300">Allocation</label>
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span>01.00</span>
                  <span className="text-[#3B82F6]">Days</span>
                </div>
              </div>

               <div className="flex items-center gap-6 mt-2">
                <label className="w-32 text-sm font-medium text-gray-300">Attachment:</label>
                <button className="flex items-center gap-3 text-gray-300 text-sm hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white shadow-md">
                    <Upload className="w-4 h-4" />
                  </div>
                  (For sick leave certificate)
                </button>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-[#A855F7] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#9333EA] transition-colors"
                >
                  Submit
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-800 text-gray-300 px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-700 transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
