import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Badge from '../common/Badge';
import NotificationBell from '../notifications/NotificationBell';
import { Wrench, LogOut, LayoutDashboard, Sparkles, Calendar, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">HomeService</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 ml-1">SaaS</span>
              </div>
            </Link>

            <Link
              to="/services"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              Explore Services
            </Link>

            {isAuthenticated && user?.role === 'CUSTOMER' && (
              <Link
                to="/my-bookings"
                className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                <Calendar className="w-4 h-4 text-blue-500" />
                My Bookings
              </Link>
            )}

            {isAuthenticated && user?.role === 'SUPER_ADMIN' && (
              <Link
                to="/admin"
                className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link to="/dashboard" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-blue-600">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-medium text-slate-700">{user?.full_name}</span>
                  <Badge variant="primary" className="text-[10px] uppercase">{user?.role}</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/services" className="md:hidden text-sm font-medium text-slate-700 hover:text-blue-600 px-2 py-1">
                  Services
                </Link>
                <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-2">
                  Sign In
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" className="shadow-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
