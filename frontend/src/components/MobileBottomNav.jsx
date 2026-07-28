import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, FileText, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, openAuthModal } = useAuth();
  
  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Tools', icon: LayoutGrid, path: '/#tools' },
    { label: 'Blog', icon: FileText, path: '/blog' }
  ];

  const handleAccountClick = (e) => {
    e.preventDefault();
    if (currentUser) {
      navigate('/dashboard');
    } else {
      openAuthModal('login');
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe">
      {navItems.map(item => {
        const isActive = location.pathname === item.path || (item.path === '/#tools' && location.hash === '#tools');
        const Icon = item.icon;
        return (
          <Link 
            key={item.label} 
            to={item.path} 
            className={`flex flex-col items-center gap-1.5 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
          </Link>
        );
      })}
      
      <button 
        onClick={handleAccountClick}
        className={`flex flex-col items-center gap-1.5 transition-colors ${location.pathname === '/dashboard' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}
      >
        <User size={24} strokeWidth={location.pathname === '/dashboard' ? 2.5 : 2} />
        <span className="text-[10px] font-bold tracking-wide">Account</span>
      </button>
    </div>
  );
};

export default MobileBottomNav;
