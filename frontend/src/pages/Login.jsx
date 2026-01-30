import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'react-toastify';
import { MapPin, Building2, Shield, Users, ArrowRight, Eye, EyeOff, Loader, UserCircle, Mail } from 'lucide-react';

const Login = () => {
  const [loginType, setLoginType] = useState('email'); // 'email' or 'username'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);

    console.log('%c=== LOGIN ATTEMPT START ===', 'color: blue; font-size: 16px; font-weight: bold');
    console.log('Login Type:', loginType);
    console.log('Email:', email);
    console.log('Username:', username);

    try {
      const result = await login(
        loginType === 'email' ? email : null,
        password,
        loginType === 'username' ? username : null
      );
      
      console.log('%c=== LOGIN SUCCESS ===', 'color: green; font-size: 16px; font-weight: bold');
      console.log('Login result:', result);
      console.log('User data:', result.user);
      console.log('User role:', result.user?.role);
      console.log('Token received:', !!result.token);
      console.log('localStorage token:', localStorage.getItem('token'));
      console.log('localStorage user:', localStorage.getItem('user'));
      
      toast.success('Login successful! Redirecting...');
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 300);
    } catch (error) {
      console.log('%c=== LOGIN ERROR ===', 'color: red; font-size: 16px; font-weight: bold');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      toast.error(errorMessage, { autoClose: 5000 });
      
      setLoading(false);
      return;
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">FixMyCity</h1>
          </div>
          <p className="text-blue-100 text-lg mb-12">Transforming civic engagement through digital innovation</p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Report Issues Instantly</h3>
                <p className="text-blue-200 text-sm">Geolocation-based issue reporting with photo evidence</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Track Progress</h3>
                <p className="text-blue-200 text-sm">Real-time updates on issue resolution status</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Secure & Verified</h3>
                <p className="text-blue-200 text-sm">Municipality-backed platform with verified workers</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-6">
          <p className="text-blue-200 text-sm">© 2026 FixMyCity. Government of India Initiative.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">FixMyCity</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-6">Sign in to access your dashboard</p>
            
            {/* Login Type Toggle */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setLoginType('email')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                  loginType === 'email' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="h-4 w-4" />
                Email Login
              </button>
              <button
                type="button"
                onClick={() => setLoginType('username')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                  loginType === 'username' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserCircle className="h-4 w-4" />
                Employee Login
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {loginType === 'email' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="WRK_BLR_JOHN1"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Use the username provided by your administrator</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Forgot password?</a>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30"
              >
                {loading ? (
                  <><Loader className="h-5 w-5 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="h-5 w-5" /></>
                )}
              </button>
            </form>
            
            <p className="text-center mt-6 text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Create Account
              </Link>
            </p>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-4">Quick Access (Demo)</p>
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-blue-50 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-3 w-3 text-blue-600" />
                    <span className="font-semibold text-blue-900">Citizen</span>
                  </div>
                  <p className="text-gray-600">citizen@gmail.com / password</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-3 w-3 text-purple-600" />
                    <span className="font-semibold text-purple-900">Admin</span>
                  </div>
                  <p className="text-gray-600">bangalore-admin@fixmycity.com / Admin@123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
