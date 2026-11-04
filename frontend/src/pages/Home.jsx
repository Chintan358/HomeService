import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { ShieldCheck, Calendar, Wrench, Star, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-blue-50/60 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Home Services Booking SaaS v1.0
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Reliable Home Services, <br />
            <span className="text-blue-600">Delivered on Your Schedule</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Connect with verified plumbers, electricians, cleaners, and appliance technicians.
            Transparent pricing, instant booking, and guaranteed quality.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="lg" className="shadow-lg shadow-blue-500/25">
                  Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="primary" size="lg" className="shadow-lg shadow-blue-500/25">
                    Book a Service Now
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary" size="lg">
                    Join as Service Provider
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Verified Professionals</h3>
              <p className="text-sm text-slate-600">
                Every business and technician passes rigorous KYC verification and background checks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Live Availability</h3>
              <p className="text-sm text-slate-600">
                Pick accurate time slots without back-and-forth phone calls or conflicting schedules.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Transparent Reviews</h3>
              <p className="text-sm text-slate-600">
                Real feedback and star ratings verified from completed jobs so you can book with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
