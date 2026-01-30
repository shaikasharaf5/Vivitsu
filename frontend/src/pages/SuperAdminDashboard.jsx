import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'react-toastify';
import { 
  LogOut, Plus, MapPin, Users, BarChart3, Building2, 
  Shield, Eye, EyeOff, X, CheckCircle, AlertTriangle,
  TrendingUp, Activity
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showAddCity, setShowAddCity] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newCity, setNewCity] = useState({
    name: '',
    state: '',
    country: 'India',
    latitude: '',
    longitude: ''
  });

  const [newAdmin, setNewAdmin] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    phone: ''
  });

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      toast.error('Access denied');
      navigate('/');
      return;
    }
    fetchCities();
    fetchAnalytics();
  }, [user, navigate]);

  const fetchCities = async () => {
    try {
      const response = await axios.get('/api/admin/cities');
      setCities(response.data);
    } catch (error) {
      toast.error('Failed to fetch cities');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/admin/analytics/all-cities');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleAddCity = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/cities', newCity);
      toast.success('City added successfully');
      setShowAddCity(false);
      setNewCity({ name: '', state: '', country: 'India', latitude: '', longitude: '' });
      fetchCities();
      fetchAnalytics();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add city');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/admin/cities/${selectedCity}/admin`, newAdmin);
      toast.success('Municipal admin created successfully');
      setShowAddAdmin(false);
      setSelectedCity(null);
      setNewAdmin({ email: '', firstName: '', lastName: '', password: '', phone: '' });
      fetchCities();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalIssues = analytics?.cities.reduce((sum, city) => sum + city.totalIssues, 0) || 0;
  const totalOpen = analytics?.cities.reduce((sum, city) => sum + city.openIssues, 0) || 0;
  const totalResolved = analytics?.cities.reduce((sum, city) => sum + city.resolvedIssues, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-700 to-purple-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Shield className="h-8 w-8 mr-3" />
                Super Admin Dashboard
              </h1>
              <p className="text-purple-100 mt-1">Central administration & oversight</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-700 font-bold text-lg">
                  {user?.name?.charAt(0)}
                </div>
                <span className="ml-3 text-white font-semibold">{user?.name}</span>
              </div>
              <button 
                onClick={logout} 
                className="p-3 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-100 text-sm font-semibold uppercase mb-2">Total Cities</h3>
                <p className="text-5xl font-bold">{analytics?.totalCities || 0}</p>
              </div>
              <Building2 className="h-16 w-16 text-blue-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-orange-100 text-sm font-semibold uppercase mb-2">Total Issues</h3>
                <p className="text-5xl font-bold">{totalIssues}</p>
              </div>
              <AlertTriangle className="h-16 w-16 text-orange-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-yellow-100 text-sm font-semibold uppercase mb-2">Open Issues</h3>
                <p className="text-5xl font-bold">{totalOpen}</p>
              </div>
              <Activity className="h-16 w-16 text-yellow-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-100 text-sm font-semibold uppercase mb-2">Resolved</h3>
                <p className="text-5xl font-bold">{totalResolved}</p>
              </div>
              <CheckCircle className="h-16 w-16 text-green-200 opacity-50" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setShowAddCity(true)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 font-semibold shadow-lg transition-all"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New City
          </button>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cities.map((city) => {
            const cityAnalytics = analytics?.cities.find(a => a.cityId === city._id);
            return (
              <div key={city._id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-100 to-blue-50 p-6 border-b-2 border-purple-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{city.name}</h3>
                      <p className="text-gray-600">{city.state}, {city.country}</p>
                      {city.municipalAdmin ? (
                        <div className="mt-3 flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-green-700 font-semibold">
                            Admin: {city.municipalAdmin.firstName} {city.municipalAdmin.lastName}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              setSelectedCity(city._id);
                              setShowAddAdmin(true);
                            }}
                            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Municipal Admin
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      city.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {city.status}
                    </div>
                  </div>
                </div>

                {cityAnalytics && (
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Total Issues</p>
                        <p className="text-3xl font-bold text-blue-700">{cityAnalytics.totalIssues}</p>
                      </div>
                      <div className="bg-yellow-50 rounded-xl p-4">
                        <p className="text-xs text-yellow-600 font-semibold uppercase mb-1">Open</p>
                        <p className="text-3xl font-bold text-yellow-700">{cityAnalytics.openIssues}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-xs text-green-600 font-semibold uppercase mb-1">Resolved</p>
                        <p className="text-3xl font-bold text-green-700">{cityAnalytics.resolvedIssues}</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4">
                        <p className="text-xs text-purple-600 font-semibold uppercase mb-1">Completed</p>
                        <p className="text-3xl font-bold text-purple-700">{cityAnalytics.completedIssues}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {cities.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-xl">
            <Building2 className="h-20 w-20 mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Cities Yet</h3>
            <p className="text-gray-500 mb-6">Add your first city to get started</p>
            <button
              onClick={() => setShowAddCity(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold"
            >
              Add City
            </button>
          </div>
        )}
      </div>

      {/* Add City Modal */}
      {showAddCity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <MapPin className="h-7 w-7 mr-3" />
                  Add New City
                </h2>
                <button onClick={() => setShowAddCity(false)} className="text-white hover:text-gray-200">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddCity} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">City Name *</label>
                  <input
                    type="text"
                    value={newCity.name}
                    onChange={(e) => setNewCity({...newCity, name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">State *</label>
                  <input
                    type="text"
                    value={newCity.state}
                    onChange={(e) => setNewCity({...newCity, state: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={newCity.latitude}
                      onChange={(e) => setNewCity({...newCity, latitude: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={newCity.longitude}
                      onChange={(e) => setNewCity({...newCity, longitude: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddCity(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 font-semibold shadow-lg"
                >
                  Add City
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Municipal Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Users className="h-7 w-7 mr-3" />
                  Create Municipal Admin
                </h2>
                <button onClick={() => setShowAddAdmin(false)} className="text-white hover:text-gray-200">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddAdmin} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">First Name *</label>
                    <input
                      type="text"
                      value={newAdmin.firstName}
                      onChange={(e) => setNewAdmin({...newAdmin, firstName: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={newAdmin.lastName}
                      onChange={(e) => setNewAdmin({...newAdmin, lastName: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email *</label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-500"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({...newAdmin, phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddAdmin(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
