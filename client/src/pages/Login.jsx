import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-accent/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Package size={24} className="text-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">LogiWare Pro</h1>
              <p className="text-sm text-gray-400">Smart Logistics & Warehouse</p>
            </div>
          </div>

          <h2 className="text-4xl font-extrabold leading-tight mb-6">
            Smart, seamless logistics & warehouse operations
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-md">
            Visibility, automation, and scale — all in one platform. Real-time insights, predictive intelligence, and workflow automation for modern supply chains.
          </p>

          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
              <p className="text-3xl font-bold text-primary">1.3M+</p>
              <p className="text-sm text-gray-400 mt-1">Items Tracked Daily</p>
            </div>
            <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
              <p className="text-3xl font-bold text-primary">99.9%</p>
              <p className="text-sm text-gray-400 mt-1">Uptime Guaranteed</p>
            </div>
            <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
              <p className="text-3xl font-bold text-primary">400+</p>
              <p className="text-sm text-gray-400 mt-1">Integrations</p>
            </div>
            <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
              <p className="text-3xl font-bold text-primary">24/7</p>
              <p className="text-sm text-gray-400 mt-1">Support Available</p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Package size={20} className="text-navy" />
            </div>
            <span className="text-xl font-bold text-navy">LogiWare Pro</span>
          </div>

          <h2 className="text-3xl font-extrabold text-navy mb-2">Welcome back</h2>
          <p className="text-text-muted mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-muted">
                <input type="checkbox" className="rounded border-surface-border" />
                Remember me
              </label>
              <button type="button" className="text-sm text-accent hover:text-accent-hover font-medium">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-text-muted">
              Don't have an account?{' '}
              <Link to="/signup" className="text-accent hover:text-accent-hover font-semibold">
                Start free trial
              </Link>
            </p>
          </div>

          {/* Trust signals */}
          <div className="mt-8 pt-6 border-t border-surface-border">
            <div className="flex items-center justify-center gap-6 text-xs text-text-light">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                No credit card required
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Cancel anytime
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Setup in minutes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
