import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import api from './api';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [currentView, setCurrentView] = useState('home'); // home, login, admin
  const [authChecking, setAuthChecking] = useState(true);

  // Check JWT status on mount
  useEffect(() => {
    const checkAuthToken = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setAuthChecking(false);
        return;
      }

      try {
        const res = await api.get('/auth/verify');
        if (res.data.valid) {
          setIsAdmin(true);
          setAdminUser(res.data.admin);
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      } catch (err) {
        console.warn('Auth token expired or invalid:', err.message);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuthToken();
  }, []);

  // Handle URL Routing Sync on mount & auth check complete
  useEffect(() => {
    if (authChecking) return;

    const syncRouteWithUrl = () => {
      const hash = window.location.hash || '#/';
      if (hash === '#/admin') {
        if (isAdmin) {
          setCurrentView('admin');
          window.location.hash = '#/admin/dashboard';
        } else {
          setCurrentView('login');
        }
      } else if (hash === '#/admin/dashboard') {
        if (isAdmin) {
          setCurrentView('admin');
        } else {
          setCurrentView('login');
          window.location.hash = '#/admin';
        }
      } else {
        setCurrentView('home');
        if (hash !== '#/' && hash !== '') {
          window.location.hash = '#/';
        }
      }
    };

    syncRouteWithUrl();

    // Listen for back/forward browser navigation and hash changes
    window.addEventListener('hashchange', syncRouteWithUrl);
    return () => window.removeEventListener('hashchange', syncRouteWithUrl);
  }, [authChecking, isAdmin]);

  const handleLoginSuccess = (admin) => {
    setIsAdmin(true);
    setAdminUser(admin);
    setCurrentView('admin');
    window.location.hash = '#/admin/dashboard';
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAdmin(false);
    setAdminUser(null);
    setCurrentView('home');
    window.location.hash = '#/';
  };

  const handleViewChange = (view) => {
    if (view === 'admin') {
      if (!isAdmin) {
        setCurrentView('login');
        window.location.hash = '#/admin';
      } else {
        setCurrentView('admin');
        window.location.hash = '#/admin/dashboard';
      }
    } else if (view === 'login') {
      if (isAdmin) {
        setCurrentView('admin');
        window.location.hash = '#/admin/dashboard';
      } else {
        setCurrentView('login');
        window.location.hash = '#/admin';
      }
    } else {
      setCurrentView('home');
      window.location.hash = '#/';
    }
  };

  if (authChecking) {
    return (
      <div className="flex justify-center items-center h-screen bg-white text-slate-800 font-sans text-sm font-semibold">
        <div className="animate-pulse">Loading System Settings...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/20 relative">
      {/* Background glow templates */}
      <div className="bg-glow-circle"></div>
      <div className="bg-glow-circle bottom"></div>

      {/* Global Header */}
      <Navbar
        isAdmin={isAdmin}
        onLogout={handleLogout}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      {/* Main Pages Switcher */}
      <main className="flex-1 px-5 py-10 md:py-14 md:px-10 max-w-7xl mx-auto w-full">
        {currentView === 'home' && <Home />}
        {currentView === 'login' && (
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        )}
        {currentView === 'admin' && isAdmin && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-14 pb-8 px-6">
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-brand-violet/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-6">

          {/* Big name */}
          <div className="text-center">
            <h2
              className="font-display font-extrabold tracking-tight leading-none select-none"
              style={{
                fontSize: 'clamp(52px, 12vw, 96px)',
                background: 'linear-gradient(135deg, #f97316 0%, #fb923c 40%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              AKHIL
            </h2>
            <p className="text-slate-400 text-xs font-semibold tracking-[0.25em] uppercase mt-1">
              Developed &amp; Designed by&nbsp;
              <span className="text-white font-bold">Akhil Thadaka</span>
            </p>
          </div>

          {/* Divider */}
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-brand-orange/60 to-transparent" />

          {/* Social Links */}
          <div className="flex flex-wrap items-center justify-center gap-3">

            {/* GitHub */}
            <a
              href="https://github.com/Reactjs-Nodejs-Expressjs"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-btn"
              title="GitHub"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span>GitHub</span>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/akhil-thadaka"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-btn"
              title="LinkedIn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>LinkedIn</span>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/akhil_thadaka"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-btn"
              title="Instagram"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              <span>Instagram</span>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/919121751697"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-btn"
              title="WhatsApp"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* Email */}
            <a
              href="mailto:akhilthadaka97@gmail.com"
              className="footer-social-btn"
              title="Email"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <span>Email</span>
            </a>
          </div>

          {/* Bottom copyright */}
          <p className="text-slate-600 text-[11px] font-medium tracking-wide mt-2 text-center">
            © 2026 <span className="text-slate-400">ToolCase</span> · Built with ❤️ by Akhil Thadaka
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
