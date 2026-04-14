import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Eye, EyeOff, Check } from 'lucide-react';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    orgName: '',
    industry: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signup(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const trialFeatures = [
    'Get instant access to all features',
    'Connect to over 400 integrations',
    'Predictive analytics & forecasting',
    'Route optimization & dispatch',
    'Workflow automation engine',
    'Mobile & offline support',
  ];

  return (
    <div className="min-h-screen bg-surface-light-purple flex">
      {/* Left - Trial Benefits */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-center px-16">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Package size={24} className="text-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">LogiWare Pro</h1>
              <p className="text-sm text-text-muted">Smart Logistics & Warehouse</p>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-navy mb-2">Try us free</h2>
        <p className="text-text-muted mb-8">What you can look forward to in your 30-day free trial:</p>

        <div className="space-y-4 mb-10">
          {trialFeatures.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Check size={14} className="text-navy" />
              </div>
              <span className="text-text-primary">{feature}</span>
            </div>
          ))}
        </div>

        {/* Award badges */}
        <div className="flex flex-wrap gap-3">
          {['Best Est. ROI', 'Momentum Leader', 'Highest User Adoption', 'Leader', 'Easiest Setup'].map((badge) => (
            <div key={badge} className="bg-white rounded-lg px-3 py-2 text-xs font-medium text-navy border border-surface-border">
              {badge}
            </div>
          ))}
        </div>
      </div>

      {/* Right - Signup Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Package size={20} className="text-navy" />
            </div>
            <span className="text-xl font-bold text-navy">LogiWare Pro</span>
          </div>

          <div className="bg-white rounded-card shadow-form p-8">
            <h2 className="text-2xl font-extrabold text-navy mb-6">Create your LogiWare account</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Organization Name *</label>
                <input
                  type="text"
                  name="orgName"
                  value={formData.orgName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Acme Logistics Inc."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Industry</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">Select...</option>
                    <option value="logistics">Logistics</option>
                    <option value="ecommerce">E-Commerce</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="3pl">3PL Provider</option>
                    <option value="retail">Retail</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">First Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="john@company.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input pr-10"
                    placeholder="Min. 8 characters"
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

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Repeat your password"
                  required
                />
              </div>

              {/* Monthly shipments */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Monthly shipment volume</label>
                <select className="form-input">
                  <option value="">Select range...</option>
                  <option value="1-100">1 - 100 shipments</option>
                  <option value="101-500">101 - 500 shipments</option>
                  <option value="501-2000">501 - 2,000 shipments</option>
                  <option value="2001-10000">2,001 - 10,000 shipments</option>
                  <option value="10000+">10,000+ shipments</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base py-3 mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                    Creating account...
                  </span>
                ) : 'Get Started'}
              </button>

              <p className="text-xs text-text-light text-center mt-4">
                By creating an account, you agree to our Terms & Privacy Policy.
              </p>
            </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-accent hover:text-accent-hover font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
