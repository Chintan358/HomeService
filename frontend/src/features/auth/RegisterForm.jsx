import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { UserCheck, Briefcase, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterForm() {
  const [role, setRole] = useState('CUSTOMER');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    business_name: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        role: role,
        business_name: role === 'PROVIDER' ? formData.business_name : undefined,
      };

      await authService.register(payload);
      setSuccess('Account created successfully! Logging you in...');
      
      // Auto-login newly registered user
      await login({ email: formData.email, password: formData.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Create an Account</h2>
        <p className="text-sm text-slate-500 mt-1">Select your account type to get started</p>
      </div>

      {/* Role Selector Tabs */}
      <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setRole('CUSTOMER')}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            role === 'CUSTOMER'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          Customer
        </button>
        <button
          type="button"
          onClick={() => setRole('PROVIDER')}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            role === 'PROVIDER'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Service Provider
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          id="full_name"
          name="full_name"
          type="text"
          placeholder="e.g. John Doe"
          value={formData.full_name}
          onChange={handleChange}
          required
        />

        {role === 'PROVIDER' && (
          <Input
            label="Business Name"
            id="business_name"
            name="business_name"
            type="text"
            placeholder="e.g. Apex Electrical & Plumbing"
            value={formData.business_name}
            onChange={handleChange}
            required
          />
        )}

        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          placeholder="name@example.com"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <Input
          label="Phone Number"
          id="phone"
          name="phone"
          type="tel"
          placeholder="e.g. 9876543210"
          value={formData.phone}
          onChange={handleChange}
        />

        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          placeholder="Minimum 8 characters"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <div className="pt-2">
          <Button type="submit" variant="primary" className="w-full py-2.5" isLoading={loading}>
            Register as {role === 'PROVIDER' ? 'Service Provider' : 'Customer'}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Sign In
        </Link>
      </div>
    </div>
  );
}
