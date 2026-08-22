'use client';

import { useState, useEffect } from 'react';
import { ClientLayout } from '@/app/ClientLayout';
import { getCalendarEvents, createCalendarEvent } from '@/services/api';
import { Calendar as CalendarIcon, Video, Plus, X, Clock, MapPin, Users } from 'lucide-react';

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    type: 'MEETING',
    description: ''
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getCalendarEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await createCalendarEvent(formData);
      setIsModalOpen(false);
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        type: 'MEETING',
        description: ''
      });
      fetchEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to schedule meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group events by date
  const groupedEvents = events.reduce((acc: any, event: any) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
      <div className="flex-1 p-8 pt-24 bg-[#F7F5F1] min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3032]">Calendar</h1>
              <p className="text-[#777A7C] text-sm mt-1">Schedule and manage your upcoming events and meetings.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#7A70C7] hover:bg-[#685db5] text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule Event
            </button>
          </div>

          {/* Events List */}
          <div className="bg-white rounded-2xl border border-[#E6E3DE] shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-[#777A7C]">Loading calendar events...</div>
            ) : sortedDates.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-[#F7F5F1] rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-[#9A9C9D]" />
                </div>
                <h3 className="text-lg font-semibold text-[#2D3032] mb-1">No Upcoming Events</h3>
                <p className="text-[#777A7C] text-sm max-w-md">Your schedule is clear. Click "Schedule Event" to add a new meeting.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E6E3DE]">
                {sortedDates.map((date) => (
                  <div key={date} className="p-6">
                    <h3 className="text-sm font-semibold text-[#7A70C7] mb-4 uppercase tracking-wider">{formatDate(date)}</h3>
                    <div className="space-y-4">
                      {groupedEvents[date].map((event: any) => (
                        <div key={event.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border border-[#E6E3DE] hover:border-[#7A70C7]/30 transition-colors bg-[#F7F5F1]/30">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            event.type === 'VIDEO' ? 'bg-[#67AFA5]/10 text-[#67AFA5]' : 'bg-[#E5A83B]/10 text-[#E5A83B]'
                          }`}>
                            {event.type === 'VIDEO' ? <Video className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="text-[15px] font-semibold text-[#2D3032]">{event.title}</h4>
                            <p className="text-[13px] text-[#777A7C] mt-1 line-clamp-1">{event.description || 'No description provided'}</p>
                          </div>
                          
                          <div className="flex flex-col md:items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2 text-[13px] font-medium text-[#2D3032]">
                              <Clock className="w-4 h-4 text-[#9A9C9D]" />
                              {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </div>
                            <div className="flex items-center gap-2 text-[12px] text-[#777A7C]">
                              <Users className="w-3.5 h-3.5 text-[#9A9C9D]" />
                              Organizer: {event.organizerName}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Schedule Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[#E6E3DE]">
              <h2 className="text-xl font-bold text-[#2D3032]">Schedule Event</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#9A9C9D] hover:text-[#2D3032] transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-[#2D3032] mb-1.5">Event Title *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Team Weekly Sync"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] focus:border-[#7A70C7] focus:ring-1 focus:ring-[#7A70C7] outline-none transition-all text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#2D3032] mb-1.5">Event Type *</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] focus:border-[#7A70C7] focus:ring-1 focus:ring-[#7A70C7] outline-none transition-all text-sm bg-white"
                    >
                      <option value="MEETING">Meeting</option>
                      <option value="VIDEO">Video Call</option>
                      <option value="REMINDER">Reminder</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[13px] font-semibold text-[#2D3032] mb-1.5">Date *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] focus:border-[#7A70C7] focus:ring-1 focus:ring-[#7A70C7] outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#2D3032] mb-1.5">Start Time *</label>
                    <input 
                      type="time" 
                      required
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] focus:border-[#7A70C7] focus:ring-1 focus:ring-[#7A70C7] outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#2D3032] mb-1.5">End Time *</label>
                    <input 
                      type="time" 
                      required
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] focus:border-[#7A70C7] focus:ring-1 focus:ring-[#7A70C7] outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#2D3032] mb-1.5">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Add event details, agenda, or video links..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] focus:border-[#7A70C7] focus:ring-1 focus:ring-[#7A70C7] outline-none transition-all text-sm resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-[#777A7C] hover:bg-[#F7F5F1] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl font-medium bg-[#7A70C7] hover:bg-[#685db5] text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
  );
}
