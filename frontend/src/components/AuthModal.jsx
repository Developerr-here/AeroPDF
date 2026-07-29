import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, authModalView, setAuthModalView, login, signup, googleLogin } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (authModalView === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, firstName, lastName);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return alert("Please enter your email address first.");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setAuthModalView('reset');
        setCodeSent(true);
      } else {
        setError(data.error || "Failed to send reset link.");
      }
    } catch (err) {
      setError("Error sending reset link.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Password reset successful! You can now login.");
        setAuthModalView('login');
        setPassword('');
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("Error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[420px] overflow-hidden relative animate-in zoom-in-95 duration-200 p-8 pb-10">
        <button onClick={closeAuthModal} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1">
          <X size={20} strokeWidth={2.5} />
        </button>
        
        <div className="mb-6">
          <h2 className="text-[26px] font-black text-[#1a1c29]">
            {authModalView === 'login' ? 'Login to pdfbundles' : authModalView === 'reset' ? 'Reset Password' : 'Create Account'}
          </h2>
        </div>

        {authModalView === 'reset' ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 text-[13px] font-bold rounded-xl text-center">{error}</div>}
            {codeSent && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-[13px] font-bold rounded-xl flex items-start gap-2">
                <span>🔒 Verification code sent! Please check your email inbox (and spam folder) for the 6-digit reset code.</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#475569]">Reset Code</label>
              <input 
                type="text" required
                value={resetCode} onChange={e => setResetCode(e.target.value)}
                className="w-full border border-slate-100 bg-[#f8fafc] rounded-xl px-4 py-3 outline-none focus:border-[#1e1b4b] transition-all font-medium text-[14px]"
                placeholder="123456"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#475569]">New Password</label>
              <input 
                type="password" required minLength={6}
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full border border-slate-100 bg-[#f8fafc] rounded-xl px-4 py-3 outline-none focus:border-[#1e1b4b] transition-all font-medium text-[14px]"
                placeholder="Min 6 characters"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#475569]">Confirm Password</label>
              <input 
                type="password" required minLength={6}
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-slate-100 bg-[#f8fafc] rounded-xl px-4 py-3 outline-none focus:border-[#1e1b4b] transition-all font-medium text-[14px]"
                placeholder="Type password again"
              />
            </div>
            <button disabled={loading} type="submit" className="w-full bg-[#1e1b4b] hover:bg-[#2e2970] text-white font-bold py-3.5 rounded-[12px] transition-all mt-2 flex justify-center items-center gap-2 text-[15px]">
              {loading ? <Loader2 className="animate-spin" size={20}/> : 'Update Password'}
            </button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => { setError(null); setAuthModalView('login'); }} className="text-[13px] font-bold text-[#4f46e5] hover:underline">Back to Login</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-[13px] font-bold rounded-xl text-center">{error}</div>}
          
          {authModalView === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#475569]">First Name</label>
                <input 
                  type="text" required
                  value={firstName} onChange={e => setFirstName(e.target.value)}
                  className="w-full border border-slate-100 bg-[#f8fafc] rounded-xl px-4 py-3 outline-none focus:border-[#1e1b4b] transition-all font-medium text-[14px]"
                  placeholder="John"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#475569]">Last Name</label>
                <input 
                  type="text" required
                  value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full border border-slate-100 bg-[#f8fafc] rounded-xl px-4 py-3 outline-none focus:border-[#1e1b4b] transition-all font-medium text-[14px]"
                  placeholder="Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#475569]">Email Address</label>
            <input 
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-slate-100 bg-[#f8fafc] rounded-xl px-4 py-3 outline-none focus:border-[#1e1b4b] transition-all font-medium text-[14px]"
              placeholder="you@example.com"
            />
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-bold text-[#475569]">Password</label>
              {authModalView === 'login' && (
                <button type="button" onClick={handleForgotPassword} className="text-[13px] font-bold text-[#4f46e5] hover:underline focus:outline-none">
                  Forgot password?
                </button>
              )}
            </div>
            <input 
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-100 bg-[#f8fafc] rounded-xl px-4 py-3 outline-none focus:border-[#1e1b4b] transition-all font-medium text-[14px]"
              placeholder={authModalView === 'login' ? '••••••••' : 'Min 6 characters'}
            />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-[#1e1b4b] hover:bg-[#2e2970] text-white font-bold py-3.5 rounded-[12px] transition-all mt-2 flex justify-center items-center gap-2 text-[15px]">
            {loading ? <Loader2 className="animate-spin" size={20}/> : (authModalView === 'login' ? 'Login' : 'Create Account')}
          </button>
        </form>
        )}

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-100"></div>
          <span className="text-[12px] font-medium text-[#94a3b8]">or</span>
          <div className="flex-1 h-px bg-slate-100"></div>
        </div>

        <div className="w-full flex justify-center h-[44px]">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google Sign-In failed.")}
            useOneTap
            shape="rectangular"
            theme="outline"
            size="large"
            width="340"
          />
        </div>

        <div className="mt-8 text-center text-[14px] font-medium text-[#475569]">
          {authModalView === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => {
              setError(null);
              setAuthModalView(authModalView === 'login' ? 'signup' : 'login');
            }} 
            className="text-[#4f46e5] font-bold hover:underline focus:outline-none"
          >
            {authModalView === 'login' ? 'Sign up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
