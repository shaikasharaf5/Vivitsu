import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { 
  LogOut, TrendingUp, AlertCircle, CheckCircle, Clock, Users, MapPin,
  Bell, Search, ChevronDown, Filter, Download, MoreVertical, Eye,
  UserPlus, BarChart3, Settings, FileText, Activity
} from 'lucide-react';
import EmployeeManagement from '../components/EmployeeManagement';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics');
    }
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Activity className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">FixMyCity</span>
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                ADMIN
              </span>
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search issues, users..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-gray-300 transition-all"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-semibold shadow-md">
                  {user?.firstName?.charAt(0) || 'A'}
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Tabs */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600 mb-4">Monitor and manage city issues, users, and analytics</p>
          
          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'employees'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employees
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Issues */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">+12%</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Issues</h3>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalIssues}</p>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </div>

          {/* Open Issues */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">+5%</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Open Issues</h3>
            <p className="text-3xl font-bold text-gray-900">{analytics.openIssues}</p>
            <p className="text-xs text-gray-500 mt-2">Requires attention</p>
          </div>

          {/* Resolved */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">+8%</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Resolved Issues</h3>
            <p className="text-3xl font-bold text-gray-900">{analytics.resolvedIssues}</p>
            <p className="text-xs text-gray-500 mt-2">Successfully completed</p>
          </div>

          {/* Avg Resolution Time */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">-8%</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Avg Resolution Time</h3>
            <p className="text-3xl font-bold text-gray-900">{analytics.avgResolutionTime}d</p>
            <p className="text-xs text-gray-500 mt-2">Faster than last month</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Issues by Category</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {analytics.byCategory?.map((cat, index) => {
                const percentage = ((cat.count / analytics.totalIssues) * 100).toFixed(1);
                const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500', 'bg-gray-500'];
                return (
                  <div key={cat._id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{cat._id}</span>
                      <span className="text-sm font-semibold text-gray-900">{cat.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`${colors[index % colors.length]} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trending Issues */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Trending Issues</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            <div className="space-y-4">
              {analytics.topIssues?.slice(0, 5).map((issue, index) => (
                <div key={issue._id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{issue.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      by {issue.reportedBy?.firstName} {issue.reportedBy?.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-red-600">
                      <span className="font-bold">{issue.upvotes}</span>
                      <span className="text-xs">❤️</span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group">
            <div className="text-left">
              <h3 className="font-bold text-lg mb-1">Manage Users</h3>
              <p className="text-blue-100 text-sm">View and manage citizens, workers</p>
            </div>
            <UserPlus className="h-8 w-8 group-hover:scale-110 transition-transform" />
          </button>

          <button className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group">
            <div className="text-left">
              <h3 className="font-bold text-lg mb-1">View Analytics</h3>
              <p className="text-green-100 text-sm">Detailed reports and insights</p>
            </div>
            <BarChart3 className="h-8 w-8 group-hover:scale-110 transition-transform" />
          </button>

          <button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group">
            <div className="text-left">
              <h3 className="font-bold text-lg mb-1">Settings</h3>
              <p className="text-purple-100 text-sm">Configure system settings</p>
            </div>
            <Settings className="h-8 w-8 group-hover:scale-110 transition-transform" />
          </button>
        </div>
          </>
        ) : activeTab === 'employees' ? (
          <EmployeeManagement />
        ) : null}
      </div>
    </div>
  );
};

export default AdminDashboard;
