import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, Users, CreditCard, Building, FileText, Settings, Upload, Star, Check } from 'lucide-react';

const Dashboard = () => {
  const { currentUser, token, logout, updateDisplayName, refreshUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Set active tab based on query param if present
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Profile State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Teams State
  const [teamMembers, setTeamMembers] = useState([]);
  const [seatsUsed, setSeatsUsed] = useState(0);
  const [maxSeats, setMaxSeats] = useState(1);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Invoices State
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Admin State
  const [adminInquiries, setAdminInquiries] = useState([]);
  const [adminSubscribers, setAdminSubscribers] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  
  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: true
  });
  
  const [targetEmail, setTargetEmail] = useState('');
  const [adminPlan, setAdminPlan] = useState('custom'); 
  const [adminRole, setAdminRole] = useState('user');
  const [adminSeats, setAdminSeats] = useState(1);
  const [adminInterval, setAdminInterval] = useState('month');
  const [adminAiCredits, setAdminAiCredits] = useState(50);
  const [adminMaxFileSize, setAdminMaxFileSize] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  
  const [customTools, setCustomTools] = useState({
    'merge-pdf': true, 'split-pdf': true, 'remove-pages': true, 'extract-pages': true, 'organize-pdf': true, 'scan-to-pdf': true,
    'optimize-compress-pdf': true, 'repair-pdf': true, 'ocr-pdf': true,
    'jpg-to-pdf': true, 'word-to-pdf': true, 'powerpoint-to-pdf': true, 'excel-to-pdf': true, 'html-to-pdf': true,
    'pdf-to-png': true, 'pdf-to-word': true, 'pdf-to-powerpoint': true, 'pdf-to-excel': true, 'pdf-to-pdf-a': true,
    'rotate-pdf': true, 'add-page-numbers': true, 'add-watermark': true, 'crop-pdf': true, 'edit-pdf': true, 'pdf-forms': true,
    'unlock-pdf': true, 'protect-pdf': true, 'sign-pdf': true, 'redact-pdf': true, 'compare-pdf': true,
    'ai-assistant': true, 'remove-background': true, 'upscale-image': true
  });

  useEffect(() => {
    if (currentUser) {
      const names = (currentUser.display_name || '').split(' ');
      setFirstName(names[0] || '');
      setLastName(names.slice(1).join(' ') || '');
      setNewEmail(currentUser.email || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'teams' && currentUser) {
      fetchTeamMembers();
    } else if (activeTab === 'admin' && (currentUser?.is_admin || currentUser?.role === 'admin')) {
      fetchAdminData();
    } else if (activeTab === 'invoices' && currentUser) {
      fetchInvoices();
    }
  }, [activeTab, currentUser]);

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await fetch('/api/user/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchTeamMembers = async () => {
    setLoadingTeams(true);
    try {
      const res = await fetch('/api/collaboration/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.collaborators || []);
        setSeatsUsed(data.seatsUsed || 0);
        setMaxSeats(data.maxSeats || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchAdminData = async () => {
    setLoadingAdmin(true);
    try {
      const [inqRes, subRes] = await Promise.all([
        fetch('/api/admin/inquiries', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/subscribers', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (inqRes.ok) {
        const data = await inqRes.json();
        setAdminInquiries(data.inquiries || []);
      }
      if (subRes.ok) {
        const data = await subRes.json();
        setAdminSubscribers(data.subscribers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Authentication Required</h2>
          <p className="text-slate-500">You must be logged in to view the dashboard.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Go Home</button>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    try {
      const res = await fetch('/api/user/display-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ first_name: firstName, last_name: lastName })
      });
      if (res.ok) {
        await refreshUser();
        addToast('Profile updated successfully!', 'success');
      } else {
        addToast('Failed to update profile.', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || newEmail === currentUser.email) return;
    setUpdatingEmail(true);
    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newEmail })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Email updated successfully! You may need to log in again.', 'success');
        setEditingEmail(false);
        if (data.token) {
          logout();
        }
      } else {
        addToast(data.error || 'Failed to update email.', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast("New passwords do not match.", "error");
      return;
    }
    setUpdatingPassword(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.ok) {
        addToast('Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to change password.', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleInviteTeam = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const res = await fetch('/api/collaboration/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail })
      });
      if (res.ok) {
        addToast('Invitation sent successfully.', 'success');
        setInviteEmail('');
        fetchTeamMembers();
      } else {
        const data = await res.json();
        addToast(data.error || 'Failed to send invite.', 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveTeam = (email) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${email} from your team? They will lose access to premium features immediately.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/collaboration/remove', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ email })
          });
          if (res.ok) {
            fetchTeamMembers();
          } else {
            addToast('Failed to remove team member.', 'error');
          }
        } catch (err) {
          addToast(err.message, 'error');
        }
      }
    });
  };

  const handleSaveUserConfig = async () => {
    if (!targetEmail) {
      addToast('Enter target user email address.', 'error');
      return;
    }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/admin/set-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          email: targetEmail,
          plan: adminPlan,
          role: adminRole,
          seats: adminSeats,
          interval: adminInterval,
          custom_features: adminPlan === 'custom' ? {
            ...customTools,
            max_file_size: adminMaxFileSize || undefined,
            ai_credits_limit: adminAiCredits || undefined
          } : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'User configuration saved successfully.', 'success');
      } else {
        addToast(data.error || 'Failed to save configuration.', 'error');
      }
    } catch (err) {
      addToast('An error occurred.', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDeleteInquiry = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Inquiry',
      message: 'Are you sure you want to delete this support inquiry? This action cannot be undone.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/inquiries/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) fetchAdminData();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const toggleTool = (toolId) => {
    setCustomTools(prev => ({ ...prev, [toolId]: !prev[toolId] }));
  };

  const isPremium = currentUser.is_premium;
  const planName = isPremium ? currentUser.subscription_plan?.toUpperCase() || 'PREMIUM PLAN' : 'FREE PLAN';

  // Calculate AI Credits
  const aiCreditsUsed = currentUser.ai_credits_used || 0;
  let aiCreditsLimit = 0;
  if (['premium', 'business', 'starter', 'base', 'pro', 'enterprise'].includes(currentUser.subscription_plan)) {
    aiCreditsLimit = currentUser.subscription_plan === 'pro' || currentUser.subscription_plan === 'premium' ? 1000 : 999999;
    if (['starter', 'base'].includes(currentUser.subscription_plan)) aiCreditsLimit = 150;
  } else if (currentUser.subscription_plan === 'custom') {
    try {
      const custom = typeof currentUser.custom_features === 'string' ? JSON.parse(currentUser.custom_features) : currentUser.custom_features;
      aiCreditsLimit = custom?.ai_credits_limit ? parseInt(custom.ai_credits_limit, 10) : 0;
    } catch(e) {}
  }
  const creditsPercentage = aiCreditsLimit > 0 ? Math.min(100, Math.round((aiCreditsUsed / aiCreditsLimit) * 100)) : 100;

  const CheckboxItem = ({ id, label }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative flex items-center justify-center shrink-0">
        <input type="checkbox" checked={customTools[id]} onChange={() => toggleTool(id)} className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-[4px] checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" />
        <Check size={14} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
      </div>
      <span className="text-[13px] text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{label}</span>
    </label>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans pb-24 md:pb-0 flex flex-col items-center pt-8">
      
      <div className="text-center mb-8">
        <h1 className="text-[32px] font-black text-[#1a1c29] tracking-tight">Accounts Dashboard</h1>
        <p className="text-[#64748b] font-medium text-[15px] mt-2 max-w-[600px] mx-auto">
          Manage your profile, security settings, team members, tools configurations, plans, packages, and invoices.
        </p>
      </div>

      <div className="flex flex-col md:flex-row max-w-[1200px] w-full px-6 gap-8">
        
        {/* Sidebar */}
        <aside className="w-full md:w-[260px] shrink-0">
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] mb-6 flex items-center gap-4 border border-slate-100">
            <div className="w-[52px] h-[52px] rounded-full border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
              {currentUser.profile_pic ? <img src={currentUser.profile_pic} className="w-full h-full object-cover" /> : currentUser.display_name ? currentUser.display_name.charAt(0).toUpperCase() : <User size={24} strokeWidth={1.5} />}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-[#1a1c29] text-[15px] truncate">{currentUser.display_name || 'User'}</h3>
              <span className="inline-block bg-[#f3e8ff] text-[#9333ea] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mt-1">{planName}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mb-3 px-2">Account Management</h4>
              <nav className="space-y-1">
                <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-colors ${activeTab === 'profile' ? 'bg-[#f5f3ff] text-[#1a1c29]' : 'text-[#64748b] hover:bg-slate-50 hover:text-[#1a1c29]'}`}>
                  <User size={18} strokeWidth={2} className={activeTab === 'profile' ? 'text-[#1a1c29]' : 'text-[#94a3b8]'} /> Profile
                </button>
                <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-colors ${activeTab === 'security' ? 'bg-[#f5f3ff] text-[#1a1c29]' : 'text-[#64748b] hover:bg-slate-50 hover:text-[#1a1c29]'}`}>
                  <Lock size={18} strokeWidth={2} className={activeTab === 'security' ? 'text-[#1a1c29]' : 'text-[#94a3b8]'} /> Security
                </button>
                <button onClick={() => setActiveTab('teams')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-colors ${activeTab === 'teams' ? 'bg-[#f5f3ff] text-[#1a1c29]' : 'text-[#64748b] hover:bg-slate-50 hover:text-[#1a1c29]'}`}>
                  <Users size={18} strokeWidth={2} className={activeTab === 'teams' ? 'text-[#1a1c29]' : 'text-[#94a3b8]'} /> Teams
                </button>
              </nav>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mb-3 px-2">Billing & Finance</h4>
              <nav className="space-y-1">
                <button onClick={() => setActiveTab('billing')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-colors ${activeTab === 'billing' ? 'bg-[#f5f3ff] text-[#1a1c29]' : 'text-[#64748b] hover:bg-slate-50 hover:text-[#1a1c29]'}`}>
                  <CreditCard size={18} strokeWidth={2} className={activeTab === 'billing' ? 'text-[#1a1c29]' : 'text-[#94a3b8]'} /> Plans & Packages
                </button>
                <button onClick={() => setActiveTab('invoices')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-colors ${activeTab === 'invoices' ? 'bg-[#f5f3ff] text-[#1a1c29]' : 'text-[#64748b] hover:bg-slate-50 hover:text-[#1a1c29]'}`}>
                  <FileText size={18} strokeWidth={2} className={activeTab === 'invoices' ? 'text-[#1a1c29]' : 'text-[#94a3b8]'} /> Invoices
                </button>
              </nav>
            </div>

            {(currentUser.is_admin || currentUser.role === 'admin') && (
              <div>
                <nav className="space-y-1">
                  <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-[14px] transition-colors ${activeTab === 'admin' ? 'bg-[#f5f3ff] text-[#1a1c29]' : 'text-[#64748b] hover:bg-slate-50 hover:text-[#1a1c29]'}`}>
                    <Settings size={18} strokeWidth={2} className={activeTab === 'admin' ? 'text-[#1a1c29]' : 'text-[#94a3b8]'} /> Admin Control
                  </button>
                </nav>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 max-w-[900px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[18px] font-bold text-[#1a1c29]">
              {activeTab === 'admin' ? 'Admin Control Center' : `My account / ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            </h2>
            {!isPremium && activeTab !== 'admin' && (
              <Link to="/pricing" className="bg-[#4f46e5] text-white px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
                <Star size={14} fill="currentColor" /> Upgrade to Premium
              </Link>
            )}
          </div>

          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100">
                  <h3 className="text-[16px] font-bold text-[#1a1c29]">Profile Info</h3>
                </div>
                
                <div className="p-8">
                  <div className="flex flex-col items-center mb-10">
                    <div className="w-[100px] h-[100px] rounded-full border border-slate-200 flex items-center justify-center text-slate-400 mb-4 bg-slate-50 overflow-hidden">
                      {currentUser.profile_pic ? (
                        <img src={currentUser.profile_pic} alt="Profile" className="w-full h-full object-cover" />
                      ) : currentUser.display_name ? (
                        <span className="text-3xl text-slate-600 font-bold">{currentUser.display_name.charAt(0).toUpperCase()}</span>
                      ) : (
                        <User size={40} strokeWidth={1} />
                      )}
                    </div>
                    <label className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 text-sm font-medium text-[#1a1c29] hover:bg-slate-50 transition-colors cursor-pointer">
                      <Upload size={14} /> Change Photo
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('profile_pic', file);
                        try {
                          setUpdatingProfile(true);
                          const res = await fetch('/api/user/profile-pic', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: formData
                          });
                          if (res.ok) {
                            await refreshUser();
                            addToast('Profile photo updated!', 'success');
                          } else {
                            addToast('Failed to upload photo', 'error');
                          }
                        } catch (err) {
                          addToast(err.message, 'error');
                        } finally {
                          setUpdatingProfile(false);
                        }
                      }} />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#475569]">First Name</label>
                      <input 
                        type="text" 
                        value={firstName} onChange={e => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-[#f8fafc] border border-slate-200 focus:border-[#4f46e5] outline-none text-[14px] text-[#1a1c29]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#475569]">Last Name</label>
                      <input 
                        type="text" 
                        value={lastName} onChange={e => setLastName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-[#f8fafc] border border-slate-200 focus:border-[#4f46e5] outline-none text-[14px] text-[#1a1c29]"
                      />
                    </div>
                  </div>

                  <button onClick={handleUpdateProfile} disabled={updatingProfile} className="bg-[#1e1b4b] hover:bg-[#2e2970] text-white px-6 py-3 rounded-xl font-bold text-[14px] transition-colors disabled:opacity-70">
                    {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </div>

              {/* AI Credits Tracker */}
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-[16px] font-bold text-[#1a1c29] flex items-center gap-2"><Star size={18} className="text-amber-500" /> AI Credits Usage</h3>
                  <span className="text-sm font-bold text-slate-500">{aiCreditsUsed} / {aiCreditsLimit > 0 ? aiCreditsLimit : 0} Used</span>
                </div>
                <div className="p-8">
                  {aiCreditsLimit > 0 ? (
                    <>
                      <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${creditsPercentage > 90 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                          style={{ width: `${creditsPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-slate-500">
                        {aiCreditsLimit - aiCreditsUsed > 0 ? `You have ${aiCreditsLimit - aiCreditsUsed} credits remaining for this billing cycle.` : 'You have exhausted your AI credits for this cycle.'}
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-600 mb-4">Your current plan does not include AI Credits.</p>
                      <Link to="/pricing" className="inline-block bg-[#4f46e5] text-white px-5 py-2.5 rounded-lg font-bold text-[13px] hover:bg-indigo-700 transition-colors shadow-sm">
                        Upgrade to Premium
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100">
                  <h3 className="text-[16px] font-bold text-[#1a1c29]">Email Settings</h3>
                </div>
                <div className="p-8 flex flex-col md:flex-row items-end gap-4">
                  <div className="flex-1 w-full space-y-2">
                    <label className="text-[13px] font-bold text-[#475569]">Current email address</label>
                    <input 
                      type="email" 
                      value={newEmail} 
                      onChange={(e) => setNewEmail(e.target.value)}
                      readOnly={!editingEmail}
                      className={`w-full px-4 py-3 rounded-lg border outline-none text-[14px] ${editingEmail ? 'bg-white border-blue-500 text-slate-900' : 'bg-[#f1f5f9] border-slate-200 text-[#64748b] cursor-not-allowed'}`}
                    />
                  </div>
                  {!editingEmail ? (
                    <button onClick={() => setEditingEmail(true)} className="px-6 py-3 rounded-xl border border-slate-200 text-[14px] font-bold text-[#1a1c29] hover:bg-slate-50 transition-colors whitespace-nowrap">
                      Change Request
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingEmail(false); setNewEmail(currentUser.email); }} className="px-4 py-3 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleChangeEmail} disabled={updatingEmail} className="px-6 py-3 rounded-xl bg-blue-600 text-[14px] font-bold text-white hover:bg-blue-700 transition-colors whitespace-nowrap disabled:opacity-70">
                        {updatingEmail ? 'Saving...' : 'Save Email'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in max-w-[600px]">
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100">
                  <h3 className="text-[16px] font-bold text-[#1a1c29]">Update Password</h3>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-[#475569]">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-lg bg-[#f8fafc] border border-slate-200 focus:border-[#4f46e5] outline-none text-[14px] text-[#1a1c29]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-[#475569]">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-3 rounded-lg bg-[#f8fafc] border border-slate-200 focus:border-[#4f46e5] outline-none text-[14px] text-[#1a1c29]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-[#475569]">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-lg bg-[#f8fafc] border border-slate-200 focus:border-[#4f46e5] outline-none text-[14px] text-[#1a1c29]"
                    />
                  </div>
                  <button onClick={handleChangePassword} disabled={updatingPassword} className="w-full bg-[#1e1b4b] hover:bg-[#2e2970] text-white px-6 py-3.5 rounded-xl font-bold text-[14px] transition-colors disabled:opacity-70 mt-2">
                    {updatingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden self-start">
                <div className="px-6 py-5 border-b border-slate-100">
                  <h3 className="text-[15px] font-bold text-[#1a1c29]">Invite Team Members</h3>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 mb-6">
                    <span className="text-[13px] font-bold text-[#1a1c29]">Plan Seat Occupancy:</span>
                    <span className="text-[13px] font-bold text-[#475569]">{seatsUsed}/{maxSeats} used</span>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <label className="text-[12px] font-medium text-[#475569]">Member Email Address</label>
                    <input 
                      type="email" 
                      value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      placeholder="collaborator@example.com"
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f8fafc] border border-slate-200 focus:border-[#4f46e5] outline-none text-[13px] text-[#1a1c29]"
                    />
                  </div>
                  
                  <button onClick={handleInviteTeam} disabled={inviting || !inviteEmail} className="bg-[#1e1b4b] hover:bg-[#2e2970] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] transition-colors disabled:opacity-70">
                    {inviting ? 'Sending...' : 'Send Team Invitation'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden self-start">
                <div className="px-6 py-5 border-b border-slate-100">
                  <h3 className="text-[15px] font-bold text-[#1a1c29]">Active Team Members & Pending Invites</h3>
                </div>
                <div className="p-6">
                  {loadingTeams ? (
                    <p className="text-center text-[#64748b] text-[13px] py-10">Loading...</p>
                  ) : teamMembers.length === 0 ? (
                    <p className="text-center text-[#64748b] text-[13px] py-10">No team members invited yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {teamMembers.map((member, i) => (
                        <li key={i} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                          <span className="text-[13px] font-medium text-[#1a1c29]">{member.email || member}</span>
                          <button onClick={() => handleRemoveTeam(member.email || member)} className="text-[11px] font-bold text-red-500 hover:underline">Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-in fade-in max-w-[800px]">
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100">
                  <h3 className="text-[16px] font-bold text-[#1a1c29]">Your Current Plan</h3>
                </div>
                <div className="p-8">
                  {currentUser.subscription_plan === 'free' ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard size={24} className="text-slate-400" />
                      </div>
                      <h4 className="text-[18px] font-bold text-slate-800 mb-2">Free Plan</h4>
                      <p className="text-slate-500 text-[14px] mb-6">You are currently using the free version with limited features.</p>
                      <Link to="/pricing" className="inline-block bg-[#4f46e5] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-indigo-700 transition-colors shadow-sm">
                        Upgrade to Premium
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-[18px] font-bold text-slate-800 capitalize">{currentUser.subscription_plan} Plan</h4>
                          <p className="text-slate-500 text-[13px] mt-1">{currentUser.subscription_seats} Seat(s) • Billed {currentUser.subscription_interval || 'monthly'}</p>
                        </div>
                        <span className="bg-green-100 text-green-700 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">Active</span>
                      </div>
                      <Link to="/pricing" className="text-[13px] font-bold text-indigo-600 hover:underline">
                        Change Plan or Manage Subscription
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-6 animate-in fade-in max-w-[800px]">
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100">
                  <h3 className="text-[16px] font-bold text-[#1a1c29]">Billing & Invoices</h3>
                </div>
                <div className="p-8">
                  {loadingInvoices ? (
                    <p className="text-center text-[#64748b] text-[13px] py-10">Fetching invoices...</p>
                  ) : invoices.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-[#64748b] text-[14px] mb-4">No invoice history found.</p>
                      <Link to="/pricing" className="inline-block bg-[#4f46e5] text-white px-5 py-2.5 rounded-lg font-bold text-[13px] hover:bg-indigo-700 transition-colors shadow-sm">
                        View Premium Plans
                      </Link>
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Invoice ID</th>
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Date</th>
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Amount</th>
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Status</th>
                          <th className="pb-4 text-[13px] font-bold text-slate-800 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {invoices.map((inv, idx) => (
                          <tr key={idx}>
                            <td className="py-4 text-[13px] font-medium text-[#1a1c29]">{inv.id || `INV-00${idx+1}`}</td>
                            <td className="py-4 text-[13px] text-slate-500">{inv.date}</td>
                            <td className="py-4 text-[13px] text-slate-500">{inv.amount}</td>
                            <td className="py-4"><span className={`text-[11px] font-bold px-2 py-1 rounded ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{inv.status}</span></td>
                            <td className="py-4 text-right">
                              {inv.pdf_url ? (
                                <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-blue-600 hover:underline">
                                  Download PDF
                                </a>
                              ) : (
                                <button 
                                  onClick={async () => {
                                    const { downloadInvoicePDF } = await import('../utils/invoice');
                                    const success = await downloadInvoicePDF(inv.id || `INV-00${idx+1}`, inv.date, `${inv.date} - Subscription`, inv.amount, currentUser);
                                    if (success) {
                                      addToast('Invoice downloaded successfully!', 'success');
                                    } else {
                                      addToast('Failed to generate and download invoice.', 'error');
                                    }
                                  }} 
                                  className="text-[12px] font-bold text-blue-600 hover:underline">
                                  Download PDF
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-8 animate-in fade-in pb-20">
              
              {/* User Config Panel */}
              <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-white">
                  <h3 className="text-[18px] font-bold text-[#1a1c29]">Manage Custom Accounts & Permissions</h3>
                  <p className="text-slate-500 text-[13px] mt-2">Configure special subscriptions, seats, custom features, and roles for any registered user account.</p>
                </div>
                
                <div className="p-8 space-y-6 bg-white">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700">Target User Email Address*</label>
                    <input type="email" value={targetEmail} onChange={e => setTargetEmail(e.target.value)} placeholder="user@example.com" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-[14px] text-slate-900" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700">Plan Package*</label>
                      <div className="relative">
                        <select value={adminPlan} onChange={e => setAdminPlan(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 outline-none text-[14px] text-slate-900 appearance-none cursor-pointer">
                          <option value="custom">Custom (Tailored Tools)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700">System Role*</label>
                      <div className="relative">
                        <select value={adminRole} onChange={e => setAdminRole(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 outline-none text-[14px] text-slate-900 appearance-none cursor-pointer">
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700">Purchased Seats count</label>
                      <input type="number" min="1" value={adminSeats} onChange={e => setAdminSeats(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 outline-none text-[14px] text-slate-900" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700">Billing Cycle</label>
                      <div className="relative">
                        <select value={adminInterval} onChange={e => setAdminInterval(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-500 outline-none text-[14px] text-slate-900 appearance-none cursor-pointer">
                          <option value="month">Monthly</option>
                          <option value="year">Yearly</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Custom Tool Permissions */}
                  {adminPlan === 'custom' && (
                    <div className="mt-8 border border-slate-100 rounded-[16px] bg-[#f8fafc] p-6 shadow-sm">
                      <h4 className="font-bold text-[#1a1c29] text-[15px] mb-1">Configure Custom Plan Tool Permissions</h4>
                      <p className="text-slate-500 text-[13px] mb-8">Checked tools will receive Pro-level features and limits. Unchecked tools will fall back to Starter limits.</p>
                      
                      <div className="space-y-8">
                        <div>
                          <h5 className="text-[12px] font-bold text-[#1e1b4b] uppercase tracking-wider mb-4">ORGANIZE PDF</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                            <CheckboxItem id="merge-pdf" label="Merge PDF" />
                            <CheckboxItem id="split-pdf" label="Split PDF" />
                            <CheckboxItem id="remove-pages" label="Remove pages" />
                            <CheckboxItem id="extract-pages" label="Extract pages" />
                            <CheckboxItem id="organize-pdf" label="Organize PDF" />
                            <CheckboxItem id="scan-to-pdf" label="Scan to PDF" />
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-[12px] font-bold text-[#1e1b4b] uppercase tracking-wider mb-4">OPTIMIZE PDF</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                            <CheckboxItem id="optimize-compress-pdf" label="Optimize / Compress PDF" />
                            <CheckboxItem id="repair-pdf" label="Repair PDF" />
                            <CheckboxItem id="ocr-pdf" label="OCR PDF" />
                          </div>
                        </div>

                        <div>
                          <h5 className="text-[12px] font-bold text-[#1e1b4b] uppercase tracking-wider mb-4">CONVERT TO PDF</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                            <CheckboxItem id="jpg-to-pdf" label="JPG to PDF" />
                            <CheckboxItem id="word-to-pdf" label="Word to PDF" />
                            <CheckboxItem id="powerpoint-to-pdf" label="PowerPoint to PDF" />
                            <CheckboxItem id="excel-to-pdf" label="Excel to PDF" />
                            <CheckboxItem id="html-to-pdf" label="HTML to PDF" />
                          </div>
                        </div>

                        <div>
                          <h5 className="text-[12px] font-bold text-[#1e1b4b] uppercase tracking-wider mb-4">CONVERT FROM PDF</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                            <CheckboxItem id="pdf-to-png" label="PDF to PNG" />
                            <CheckboxItem id="pdf-to-word" label="PDF to Word" />
                            <CheckboxItem id="pdf-to-powerpoint" label="PDF to PowerPoint" />
                            <CheckboxItem id="pdf-to-excel" label="PDF to Excel" />
                            <CheckboxItem id="pdf-to-pdf-a" label="PDF to PDF/A" />
                          </div>
                        </div>

                        <div>
                          <h5 className="text-[12px] font-bold text-[#1e1b4b] uppercase tracking-wider mb-4">EDIT PDF</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                            <CheckboxItem id="rotate-pdf" label="Rotate PDF" />
                            <CheckboxItem id="add-page-numbers" label="Add page numbers" />
                            <CheckboxItem id="add-watermark" label="Add watermark" />
                            <CheckboxItem id="crop-pdf" label="Crop PDF" />
                            <CheckboxItem id="edit-pdf" label="Edit PDF" />
                            <CheckboxItem id="pdf-forms" label="PDF Forms" />
                          </div>
                        </div>

                        <div>
                          <h5 className="text-[12px] font-bold text-[#1e1b4b] uppercase tracking-wider mb-4">PDF SECURITY</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                            <CheckboxItem id="unlock-pdf" label="Unlock PDF" />
                            <CheckboxItem id="protect-pdf" label="Protect PDF" />
                            <CheckboxItem id="sign-pdf" label="Sign PDF" />
                            <CheckboxItem id="redact-pdf" label="Redact PDF" />
                            <CheckboxItem id="compare-pdf" label="Compare PDF" />
                          </div>
                        </div>

                        <div>
                          <h5 className="text-[12px] font-bold text-[#1e1b4b] uppercase tracking-wider mb-4">PDF INTELLIGENCE & AI</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                            <CheckboxItem id="ai-assistant" label="AI Summarizer / Translate PDF" />
                            <CheckboxItem id="remove-background" label="Remove background (AI)" />
                            <CheckboxItem id="upscale-image" label="High resolution images / Upscaler" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700">AI Monthly Credits limit</label>
                      <input type="number" min="0" value={adminAiCredits} onChange={e => setAdminAiCredits(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-[14px] text-slate-900" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700">Max File Size Override (MB)</label>
                      <input type="number" min="0" value={adminMaxFileSize} onChange={e => setAdminMaxFileSize(e.target.value)} placeholder="e.g. 10240 for 10GB" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none text-[14px] text-slate-900" />
                      <p className="text-xs text-slate-500 mt-1">Leave blank for default tool limits.</p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button onClick={handleSaveUserConfig} disabled={savingConfig} className="bg-[#1e1b4b] hover:bg-[#2e2970] text-white px-8 py-3.5 rounded-full font-bold transition-colors disabled:opacity-70 text-[14px]">
                      {savingConfig ? 'Saving...' : 'Save User Configuration'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Inquiries Table */}
              <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-white">
                  <h3 className="text-[18px] font-bold text-[#1a1c29]">Enterprise Sales Inquiries</h3>
                </div>
                <div className="p-8 bg-white overflow-x-auto">
                  {loadingAdmin ? (
                    <p className="text-sm text-slate-500 text-center py-4">Loading inquiries...</p>
                  ) : adminInquiries.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No enterprise inquiries yet.</p>
                  ) : (
                    <table className="w-full text-left min-w-[800px]">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Name</th>
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Company</th>
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Email</th>
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Message</th>
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Date</th>
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {adminInquiries.map(inq => (
                          <tr key={inq.id}>
                            <td className="py-4 text-[13px] font-bold text-[#1a1c29]">{inq.first_name} {inq.last_name}</td>
                            <td className="py-4 text-[13px] text-slate-500">{inq.company_name}</td>
                            <td className="py-4 text-[13px] text-[#4f46e5] font-medium">{inq.business_email}</td>
                            <td className="py-4 text-[13px] text-slate-500 max-w-[250px] truncate pr-4">{inq.message}</td>
                            <td className="py-4 text-[13px] text-slate-500 whitespace-nowrap">
                              {new Date(inq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-4">
                              <button onClick={() => handleDeleteInquiry(inq.id)} className="bg-[#ef4444] text-white px-4 py-1.5 rounded-md text-[12px] font-bold hover:bg-red-600 transition-colors">
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Subscribers Table */}
              <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-white">
                  <h3 className="text-[18px] font-bold text-[#1a1c29]">Newsletter Subscribers</h3>
                </div>
                <div className="p-8 bg-white overflow-x-auto">
                  {loadingAdmin ? (
                    <p className="text-sm text-slate-500 text-center py-4">Loading subscribers...</p>
                  ) : adminSubscribers.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No newsletter subscribers yet.</p>
                  ) : (
                    <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Email Address</th>
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Status</th>
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Date Subscribed</th>
                          <th className="pb-4 text-[13px] font-bold text-slate-800">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {adminSubscribers.map(sub => (
                          <tr key={sub.id}>
                            <td className="py-4 text-[13px] text-[#4f46e5] font-medium">{sub.email}</td>
                            <td className="py-4 text-[13px] text-slate-500 capitalize">{sub.status || 'Active'}</td>
                            <td className="py-4 text-[13px] text-slate-500 whitespace-nowrap">
                              {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-4 text-[13px]">
                              <button className="text-slate-400 hover:text-red-500 font-bold transition-colors">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDestructive={confirmConfig.isDestructive}
      />
    </div>
  );
};

export default Dashboard;
