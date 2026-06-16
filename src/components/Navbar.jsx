import React, { useState, useEffect } from 'react';
import { Wrench, ChevronDown, Menu, X, LogIn, LogOut, LayoutDashboard, Home } from 'lucide-react';
import api from '../api';

export default function Navbar({ isAdmin, onLogout, currentView, onViewChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dbActive, setDbActive] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    const checkDbStatus = async () => {
      try {
        const res = await api.get('/auth/db-status');
        setDbActive(res.data.active);
      } catch (err) {
        setDbActive(false);
      }
    };

    checkDbStatus();
    const interval = setInterval(checkDbStatus, 15000); // Check DB status every 15s
    return () => clearInterval(interval);
  }, [isAdmin]);

  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleNavigate = (view) => {
    onViewChange(view);
    if (view === 'home') {
      window.dispatchEvent(new Event('resetHomeFilters'));
    }
    setMobileOpen(false);
    setDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full h-[76px] bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center max-w-7xl mx-auto h-full px-6 md:px-10">
        {/* Nav Left: Brand/Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavigate('home')}>
          <div className="w-8 h-8 rounded-lg bg-[#f97316] text-white flex items-center justify-center shadow-md shadow-[#f97316]/30">
            <Wrench size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-display text-xl font-extrabold text-slate-800 tracking-tight leading-none">
              Tool<span className="text-[#f97316]">Case</span>
            </span>
            {isAdmin && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dbActive ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]'} block`}></span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                  {dbActive ? 'DB Active' : 'DB Offline'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nav Center: Desktop Navigation Items */}
        <div className="hidden md:flex items-center gap-8">
          <button 
            className={`text-sm font-medium py-1.5 relative hover:text-slate-900 transition-colors ${
              currentView === 'home' 
                ? 'text-[#f97316] font-semibold after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-0.5 after:bg-[#f97316] after:rounded-full' 
                : 'text-slate-500'
            }`}
            onClick={() => handleNavigate('home')}
          >
            Home
          </button>
          
          <button 
            className="text-sm font-medium text-slate-500 py-1.5 hover:text-slate-900 transition-colors"
            onClick={() => alert('About Us section - Framer navigation item mockup.')}
          >
            About Us
          </button>

          {/* Solutions Dropdown Menu */}
          <div 
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button 
              className={`text-sm font-medium flex items-center gap-1 py-1.5 hover:text-slate-900 transition-colors ${
                dropdownOpen ? 'text-[#f97316]' : 'text-slate-500'
              }`}
              onClick={toggleDropdown}
            >
              <span>Solutions</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-[#f97316]' : ''}`} />
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 translate-y-3 w-[280px] rounded-xl p-3 shadow-xl flex flex-col gap-1 z-50 border border-slate-100 bg-white/98 backdrop-blur-lg transition-all">
                <div className="p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 text-left" onClick={() => alert('Viewing Electrical Solutions...')}>
                  <div className="text-xs font-semibold text-slate-800 mb-0.5">Electrical Cases</div>
                  <div className="text-[10px] text-slate-500 leading-normal">Wiring & testing equipment frameworks.</div>
                </div>
                <div className="p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 text-left" onClick={() => alert('Viewing Mechanical Solutions...')}>
                  <div className="text-xs font-semibold text-slate-800 mb-0.5">Mechanical Cases</div>
                  <div className="text-[10px] text-slate-500 leading-normal">Hand & power tool organization cases.</div>
                </div>
                <div className="p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 text-left" onClick={() => alert('Viewing Safety Solutions...')}>
                  <div className="text-xs font-semibold text-slate-800 mb-0.5">Safety Solutions</div>
                  <div className="text-[10px] text-slate-500 leading-normal">Personal protection equipment setups.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav Right: Action CTA Buttons (With Increased Padding) */}
        <div className="hidden md:flex items-center gap-3">
          {currentView === 'admin' ? (
            <button 
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-900 text-white rounded-lg hover:bg-white hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm font-medium text-xs"
              onClick={() => handleNavigate('home')}
            >
              <Home size={14} />
              <span>View Site</span>
            </button>
          ) : isAdmin ? (
            <button 
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-900 text-white rounded-lg hover:bg-white hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm font-medium text-xs"
              onClick={() => handleNavigate('admin')}
            >
              <LayoutDashboard size={14} />
              <span>Admin Panel</span>
            </button>
          ) : (
            <button 
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-900 text-white rounded-lg hover:bg-white hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm font-medium text-xs"
              onClick={() => alert('Lets Talk - Framer CTA mockup.')}
            >
              Lets Talk
            </button>
          )}

          {isAdmin ? (
            <button 
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm hover:shadow-red-500/20 transition-all font-medium text-xs"
              onClick={onLogout}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          ) : currentView !== 'login' && currentView !== 'admin' ? (
            <button 
              className="flex items-center gap-2 px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg shadow-sm hover:shadow-[#f97316]/20 transition-all font-medium text-xs"
              onClick={() => handleNavigate('login')}
            >
              <LogIn size={14} />
              <span>Admin Login</span>
            </button>
          ) : null}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="block md:hidden text-slate-800">
          <button onClick={toggleMobileMenu} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer overlay */}
      {mobileOpen && (
        <div className="absolute top-[76px] left-0 w-full bg-white/98 backdrop-blur-lg border-b border-slate-100 shadow-lg p-6 flex flex-col gap-4 z-50 transition-all duration-300">
          <button 
            className={`text-base font-semibold text-left py-2 hover:text-slate-900 transition-colors ${
              currentView === 'home' ? 'text-[#f97316]' : 'text-slate-500'
            }`}
            onClick={() => handleNavigate('home')}
          >
            Home
          </button>
          <button 
            className="text-base font-semibold text-slate-500 text-left py-2 hover:text-slate-900 transition-colors"
            onClick={() => { setMobileOpen(false); alert('About Us section - Framer navigation item mockup.'); }}
          >
            About Us
          </button>
          <button 
            className="text-base font-semibold text-slate-500 text-left py-2 hover:text-slate-900 transition-colors"
            onClick={() => { setMobileOpen(false); alert('Custom case solutions.'); }}
          >
            Solutions
          </button>
          
          <div className="h-px bg-slate-100 w-full"></div>
          
          <div className="flex flex-col gap-2.5">
            {currentView === 'admin' ? (
              <button 
                className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 border border-slate-900 text-white rounded-lg hover:bg-white hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm font-medium text-sm w-full"
                onClick={() => handleNavigate('home')}
              >
                <Home size={14} />
                <span>View Site</span>
              </button>
            ) : isAdmin ? (
              <button 
                className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 border border-slate-900 text-white rounded-lg hover:bg-white hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm font-medium text-sm w-full"
                onClick={() => handleNavigate('admin')}
              >
                <LayoutDashboard size={14} />
                <span>Admin Panel</span>
              </button>
            ) : (
              <button 
                className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 border border-slate-900 text-white rounded-lg hover:bg-white hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm font-medium text-sm w-full"
                onClick={() => { setMobileOpen(false); alert('Lets Talk - Framer CTA mockup.'); }}
              >
                Lets Talk
              </button>
            )}

            {isAdmin ? (
              <button 
                className="flex items-center justify-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm hover:shadow-red-500/20 transition-all font-medium text-sm w-full"
                onClick={onLogout}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            ) : currentView !== 'login' && currentView !== 'admin' ? (
              <button 
                className="flex items-center justify-center gap-2 px-5 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg shadow-sm hover:shadow-[#f97316]/20 transition-all font-medium text-sm w-full"
                onClick={() => handleNavigate('login')}
              >
                <LogIn size={14} />
                <span>Admin Login</span>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}
