"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Search, Bell, MessageSquare, ChevronDown, Check, Trash2, Mail, User as UserIcon, LogOut } from 'lucide-react';
import * as api from '@/services/api';

export function Header() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  
  // Dropdowns
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMsgDropdown, setShowMsgDropdown] = useState(false);

  // Notifications and Messages data
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadMsgsCount, setUnreadMsgsCount] = useState(0);

  // Message chat & reply modal states
  const [activeChat, setActiveChat] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [showReplyToast, setShowReplyToast] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);

  const fetchUserData = async () => {
    try {
      const data = await api.getMe();
      setCurrentUser(data.user);
      setEmployee(data.employee);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dayflow_user', JSON.stringify(data.user));
        localStorage.setItem('dayflow_employee', JSON.stringify(data.employee));
      }
    } catch (e) {
      // Fallback to localStorage if offline or failed
      if (typeof window !== 'undefined') {
        const cachedUser = localStorage.getItem('dayflow_user');
        const cachedEmp = localStorage.getItem('dayflow_employee');
        if (cachedUser) setCurrentUser(JSON.parse(cachedUser));
        if (cachedEmp) setEmployee(JSON.parse(cachedEmp));
      }
    }
  };

  const fetchNotificationsAndMessages = async () => {
    try {
      const notifData = await api.getNotifications();
      setNotifications(notifData.list || []);
      setUnreadNotifsCount(notifData.unread || 0);

      const msgData = await api.getMessages();
      setMessages(msgData.list || []);
      setUnreadMsgsCount(msgData.unreadCount || 0);
    } catch (e) {
      console.error('Error fetching notifications/messages:', e);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchNotificationsAndMessages();

    // Poll every 10 seconds for notifications and messages
    const timer = setInterval(fetchNotificationsAndMessages, 10000);

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (msgRef.current && !msgRef.current.contains(event.target as Node)) {
        setShowMsgDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleLogout = async () => {
    try {
      await api.logout();
      window.location.href = '/login';
    } catch (e) {
      console.error('Logout error:', e);
      window.location.href = '/login';
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      fetchNotificationsAndMessages();
    } catch (e) {
      console.error('Error marking notification read:', e);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotificationsAndMessages();
    } catch (e) {
      console.error('Error marking all notifications read:', e);
    }
  };

  const handleMessageClick = async (msg: any) => {
    try {
      await api.markMessageRead(msg.id);
      setActiveChat(msg);
      setShowMsgDropdown(false);
      fetchNotificationsAndMessages();
    } catch (e) {
      console.error('Error marking message read:', e);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeChat) return;
    try {
      await api.sendMessage(activeChat.senderId, replyText);
      setReplyText('');
      setActiveChat(null);
      setShowReplyToast(true);
      setTimeout(() => setShowReplyToast(false), 3000);
      fetchNotificationsAndMessages();
    } catch (e) {
      console.error('Error replying to message:', e);
    }
  };

  const activeName = employee ? `${employee.firstName} ${employee.lastName}` : (currentUser ? currentUser.username : 'Alex Martin');
  const activeRole = employee ? storeRoleLabel(employee.designationId || currentUser?.role) : (currentUser ? currentUser.role : 'HR Manager');
  const avatar = employee?.profilePhoto || 'https://i.pravatar.cc/150?u=a042581f4e29026024d';

  function storeRoleLabel(id: string) {
    if (id === 'DS1') return 'UI/UX Designer';
    if (id === 'DS2') return 'Product Manager';
    if (id === 'DS3') return 'Engineering Lead';
    if (id === 'DS4') return 'Software Engineer';
    if (id === 'DS5') return 'QA Tester';
    if (id === 'DS6') return 'HR Manager';
    if (id === 'DS7') return 'Support Specialist';
    if (id === 'DS8') return 'Marketing Lead';
    if (id === 'HR') return 'HR Admin';
    return id || 'Employee';
  }

  const handleNotifClick = (noti: any) => {
    markRead(noti.id);
    setShowNotifDropdown(false);
    if (noti.title.toLowerCase().includes('expense') || noti.title.toLowerCase().includes('reimbursement')) {
      if (currentUser?.role === 'HR') {
        window.location.href = '/admin/expenses';
      } else {
        window.location.href = '/tour-expenses';
      }
    }
  };

  return (
    <header className="flex h-24 shrink-0 items-center justify-between px-10 relative z-30">
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
        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowMsgDropdown(false);
              setShowProfileDropdown(false);
            }}
            className="relative bg-white rounded-full p-3 text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-100 transition-colors"
          >
            {unreadNotifsCount > 0 && (
              <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#E56B65] text-[9px] font-bold text-white ring-2 ring-white">
                {unreadNotifsCount}
              </span>
            )}
            <Bell className="h-5 w-5" strokeWidth={2} />
          </button>
 
          {/* Notifications Dropdown */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E6E3DE] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 bg-[#F7F5F1] border-b border-[#E6E3DE] flex justify-between items-center">
                <span className="font-bold text-sm text-[#2D3032]">Notifications</span>
                {unreadNotifsCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-xs text-[#7FAF3F] font-semibold hover:text-[#668F2F] transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#E6E3DE]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#777A7C]">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotifClick(n)}
                      className={`p-3.5 hover:bg-[#F7F5F1]/30 transition-colors relative flex gap-2.5 items-start cursor-pointer ${!n.isRead ? 'bg-[#7FAF3F]/5' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#2D3032]">{n.title}</div>
                        <div className="text-[11px] text-[#777A7C] mt-0.5 leading-relaxed">{n.message}</div>
                        <div className="text-[9px] text-[#9A9C9D] mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {!n.isRead && (
                        <button 
                          onClick={() => markRead(n.id)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-white border border-[#E6E3DE] text-[#7FAF3F] hover:bg-[#7FAF3F] hover:text-white transition-all shadow-sm"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Message Inbox */}
        <div className="relative" ref={msgRef}>
          <button 
            onClick={() => {
              setShowMsgDropdown(!showMsgDropdown);
              setShowNotifDropdown(false);
              setShowProfileDropdown(false);
            }}
            className="relative bg-white rounded-full p-3 text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-100 transition-colors"
          >
            {unreadMsgsCount > 0 && (
              <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#E56B65] text-[9px] font-bold text-white ring-2 ring-white">
                {unreadMsgsCount}
              </span>
            )}
            <MessageSquare className="h-5 w-5" strokeWidth={2} />
          </button>

          {/* Messages Dropdown */}
          {showMsgDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E6E3DE] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 bg-[#F7F5F1] border-b border-[#E6E3DE] flex items-center justify-between">
                <span className="font-bold text-sm text-[#2D3032]">Messages Inbox</span>
                <span className="text-xs text-[#777A7C] font-medium">{unreadMsgsCount} Unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#E6E3DE]">
                {messages.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#777A7C]">No messages yet</div>
                ) : (
                  messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={`p-3.5 hover:bg-[#F7F5F1]/30 transition-colors flex gap-3 items-start cursor-pointer ${!m.isRead ? 'bg-[#7FAF3F]/5 font-bold' : ''}`}
                      onClick={() => handleMessageClick(m)}
                    >
                      <img src={m.senderAvatar} alt="" className="w-8 h-8 rounded-full object-cover border border-[#E6E3DE]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[#2D3032] flex justify-between">
                          <span className="font-bold">{m.senderName}</span>
                          <span className="text-[9px] text-[#9A9C9D]">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#777A7C] truncate mt-0.5">{m.message}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Trigger */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
              setShowMsgDropdown(false);
            }}
            className="flex items-center gap-3 pl-4 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="h-11 w-11 rounded-full bg-gray-200 overflow-hidden shadow-sm border border-[#E6E3DE]">
              <img src={avatar} alt={activeName} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-sm font-bold text-text-primary leading-tight">{activeName}</span>
              <span className="text-[11px] font-medium text-text-secondary mt-0.5">{activeRole}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
          </div>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-[#E6E3DE] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-[#E6E3DE] bg-[#F7F5F1]/30">
                <div className="text-xs font-bold text-[#2D3032] truncate">{activeName}</div>
                <div className="text-[10px] text-[#777A7C] truncate mt-0.5">{currentUser?.email}</div>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button 
                  onClick={() => {
                    setShowProfileDropdown(false);
                    window.location.href = '/profile';
                  }}
                  className="w-full text-left flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#2D3032] hover:bg-[#F7F5F1] transition-all"
                >
                  <UserIcon className="w-4 h-4 text-[#777A7C]" />
                  My Profile
                </button>

                <button 
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#E56B65] hover:bg-[#E56B65]/5 transition-all border-t border-[#E6E3DE] mt-1 pt-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Message/Reply Modal */}
      {activeChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-[#2D3032]">
            <div className="flex items-center gap-3 border-b border-[#E6E3DE] pb-4 mb-4">
              <img src={activeChat.senderAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-[#E6E3DE]" />
              <div>
                <h3 className="font-bold text-sm text-[#2D3032]">{activeChat.senderName}</h3>
                <span className="text-[10px] text-[#777A7C] font-semibold">Message Thread</span>
              </div>
              <span className="text-[9px] text-[#9A9C9D] ml-auto">
                {new Date(activeChat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="bg-[#F7F5F1] p-4 rounded-2xl text-xs leading-relaxed text-[#2D3032] mb-6 whitespace-pre-wrap max-h-48 overflow-y-auto border border-[#E6E3DE]/40">
              {activeChat.message}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#777A7C] uppercase tracking-wider mb-2">Send a Reply</label>
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response here..."
                  rows={3}
                  className="w-full bg-[#F7F5F1] border border-transparent focus:border-[#7FAF3F] rounded-xl px-4 py-3 text-xs outline-none transition-colors resize-none text-[#2D3032]"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setActiveChat(null)}
                  className="flex-1 bg-white border border-[#E6E3DE] text-[#2D3032] py-2.5 rounded-xl text-xs font-bold hover:bg-[#F7F5F1] transition-all cursor-pointer"
                >
                  Close
                </button>
                <button 
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="flex-1 bg-[#7FAF3F] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#668F2F] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md active:scale-95"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success reply Toast */}
      {showReplyToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#7FAF3F] text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm">
          Reply sent successfully!
        </div>
      )}
    </header>
  );
}
