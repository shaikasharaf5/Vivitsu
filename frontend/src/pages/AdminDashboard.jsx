import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { LogOut, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
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
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.name}</span>
            <button onClick={logout} className="text-gray-600 hover:text-red-600">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Total Issues</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalIssues}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Open Issues</p>
                <p className="text-3xl font-bold text-yellow-600">{analytics.openIssues}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{analytics.resolvedIssues}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold">Avg. Time</p>
                <p className="text-3xl font-bold text-purple-600">{analytics.avgResolutionTime}d</p>
              </div>
              <Clock className="h-10 w-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Issues by Category</h2>
          <div className="space-y-3">
            {analytics.byCategory?.map((cat) => (
              <div key={cat._id} className="flex items-center justify-between">
                <span className="font-medium">{cat._id}</span>
                <div className="flex items-center">
                  <div className="w-64 bg-gray-200 rounded-full h-4 mr-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full"
                      style={{ width: `${(cat.count / analytics.totalIssues) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-600 w-12 text-right">{cat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Issues */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Trending Issues</h2>
          <div className="space-y-3">
            {analytics.topIssues?.slice(0, 5).map((issue) => (
              <div key={issue._id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-semibold">{issue.title}</h3>
                  <p className="text-sm text-gray-600">
                    by {issue.reportedBy?.firstName} {issue.reportedBy?.lastName}
                  </p>
                </div>
                <span className="text-red-600 font-bold">❤️ {issue.upvotes}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
