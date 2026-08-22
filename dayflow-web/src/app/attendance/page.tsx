"use client";
import React from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

export default function AttendancePage() {
  const mockAttendanceData = [
    { date: '28/10/2025', in: '10:00', out: '19:00', hrs: '09:00', extra: '01:00' },
    { date: '29/10/2025', in: '10:00', out: '19:00', hrs: '09:00', extra: '01:00' },
    { date: '30/10/2025', in: '10:00', out: '19:00', hrs: '09:00', extra: '01:00' },
    { date: '31/10/2025', in: '10:00', out: '18:00', hrs: '08:00', extra: '00:00' },
    { date: '01/11/2025', in: '-', out: '-', hrs: '00:00', extra: '00:00' }, // Leave/Weekend
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-semibold text-[#2D3032]">
          My Attendance
        </h1>
        <button className="flex items-center gap-2 bg-white border border-[#E6E3DE] rounded-lg px-4 py-2 text-xs font-medium text-[#2D3032] hover:bg-[#F7F5F1] transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[#E6E3DE] shadow-sm flex flex-col gap-6">
        
        {/* Top Control Bar matching Wireframe */}
        <div className="flex items-center gap-4 border-b border-[#E6E3DE] pb-6">
          <div className="flex items-center border border-[#E6E3DE] rounded-lg bg-white overflow-hidden shadow-sm shrink-0">
            <button className="px-3 py-2 hover:bg-[#F7F5F1] border-r border-[#E6E3DE] transition-colors"><ChevronLeft className="w-4 h-4 text-[#2D3032]" /></button>
            <button className="px-3 py-2 hover:bg-[#F7F5F1] border-r border-[#E6E3DE] transition-colors"><ChevronRight className="w-4 h-4 text-[#2D3032]" /></button>
            <select className="bg-white px-4 py-2 text-sm font-semibold text-[#2D3032] outline-none cursor-pointer hover:bg-[#F7F5F1] transition-colors">
              <option>October 2025</option>
              <option>November 2025</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col justify-center px-6 py-1.5 border border-[#E6E3DE] rounded-lg bg-[#F7F5F1]">
              <span className="text-[10px] text-[#777A7C] font-semibold uppercase tracking-wider">Count of days present</span>
              <span className="text-lg font-bold text-[#2D3032]">22</span>
            </div>
            <div className="flex flex-col justify-center px-6 py-1.5 border border-[#E6E3DE] rounded-lg bg-[#F7F5F1]">
              <span className="text-[10px] text-[#777A7C] font-semibold uppercase tracking-wider">Leaves count</span>
              <span className="text-lg font-bold text-[#E5A83B]">2</span>
            </div>
            <div className="flex flex-col justify-center px-6 py-1.5 border border-[#E6E3DE] rounded-lg bg-[#F7F5F1]">
              <span className="text-[10px] text-[#777A7C] font-semibold uppercase tracking-wider">Total working days</span>
              <span className="text-lg font-bold text-[#7FAF3F]">24</span>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[#9A9C9D] text-xs border-b border-[#E6E3DE]">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Check In</th>
                <th className="pb-3 font-semibold">Check Out</th>
                <th className="pb-3 font-semibold">Work Hours</th>
                <th className="pb-3 font-semibold">Extra hours</th>
              </tr>
            </thead>
            <tbody className="text-[#2D3032]">
              {mockAttendanceData.map((row, i) => (
                <tr key={i} className="border-b border-[#E6E3DE] last:border-0 hover:bg-[#F7F5F1]/50 transition-colors">
                  <td className="py-4 font-semibold">{row.date}</td>
                  <td className="py-4 text-[#777A7C] font-medium">{row.in}</td>
                  <td className="py-4 text-[#777A7C] font-medium">{row.out}</td>
                  <td className="py-4 font-bold text-[#2D3032]">{row.hrs}</td>
                  <td className="py-4 font-medium text-[#7FAF3F]">{row.extra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
