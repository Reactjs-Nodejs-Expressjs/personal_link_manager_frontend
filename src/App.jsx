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
      const path = window.location.pathname;
      if (path === '/admin') {
        if (isAdmin) {
          setCurrentView('admin');
          window.history.replaceState(null, '', '/admin/dashboard');
        } else {
          setCurrentView('login');
        }
      } else if (path === '/admin/dashboard') {
        if (isAdmin) {
          setCurrentView('admin');
        } else {
          setCurrentView('login');
          window.history.replaceState(null, '', '/admin');
        }
      } else {
        setCurrentView('home');
        if (path !== '/') {
          window.history.replaceState(null, '', '/');
        }
      }
    };

    syncRouteWithUrl();

    // Listen for back/forward browser navigation
    window.addEventListener('popstate', syncRouteWithUrl);
    return () => window.removeEventListener('popstate', syncRouteWithUrl);
  }, [authChecking, isAdmin]);

  const handleLoginSuccess = (admin) => {
    setIsAdmin(true);
    setAdminUser(admin);
    setCurrentView('admin');
    window.history.pushState(null, '', '/admin/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAdmin(false);
    setAdminUser(null);
    setCurrentView('home');
    window.history.pushState(null, '', '/');
  };

  const handleViewChange = (view) => {
    if (view === 'admin') {
      if (!isAdmin) {
        setCurrentView('login');
        window.history.pushState(null, '', '/admin');
      } else {
        setCurrentView('admin');
        window.history.pushState(null, '', '/admin/dashboard');
      }
    } else if (view === 'login') {
      if (isAdmin) {
        setCurrentView('admin');
        window.history.pushState(null, '', '/admin/dashboard');
      } else {
        setCurrentView('login');
        window.history.pushState(null, '', '/admin');
      }
    } else {
      setCurrentView('home');
      window.history.pushState(null, '', '/');
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
      <footer className="text-center py-8 border-t border-slate-100 text-slate-400 text-xs font-semibold bg-white/40">
        <p>© 2026 ToolCase Systems. Premium MERN Category Management Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
