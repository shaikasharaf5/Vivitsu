import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useSocket } from '../utils/SocketContext';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'react-toastify';
import { 
  Plus, Heart, MessageCircle, MapPin, LogOut, Map as MapIcon, TrendingUp, Clock,
  AlertCircle, CheckCircle, Loader as LoaderIcon, Bell, User, Search,
  Filter, BarChart3, Settings, ChevronDown, FileText
} from 'lucide-react';
import ReportIssueModal from '../components/ReportIssueModal';
import IssueCard from '../components/IssueCard';

const CitizenDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    inProgress: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const categories = ['ROADS', 'UTILITIES', 'PARKS', 'TRAFFIC', 'SANITATION', 'HEALTH', 'OTHER'];

  useEffect(() => {
    fetchIssues();
    fetchStats();
  }, [sortBy, categoryFilter]);

  useEffect(() => {
    if (socket) {
      socket.on('issueCreated', (data) => {
        setIssues((prev) => [data.issue, ...prev]);
        toast.info('New issue reported in your area');
        fetchStats();
      });

      socket.on('issueUpvoted', (data) => {
        setIssues((prev) =>
          prev.map((issue) =>
            issue._id === data.issueId ? { ...issue, upvotes: data.upvotes } : issue
          )
        );
      });
    }
  }, [socket]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/issues');
      const allIssues = response.data;
      setStats({
        total: allIssues.length,
        resolved: allIssues.filter(i => i.status === 'RESOLVED').length,
        inProgress: allIssues.filter(i => i.status === 'IN_PROGRESS').length,
        pending: allIssues.filter(i => ['REPORTED', 'CATEGORIZED', 'ASSIGNED'].includes(i.status)).length
      });
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = { sort: sortBy };
      if (categoryFilter.length > 0) {
        params.category = categoryFilter.join(',');
      }
      const response = await axios.get('/api/issues', { params });
      setIssues(response.data);
    } catch (error) {
      toast.error('Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (issueId) => {
    try {
      const response = await axios.patch(`/api/issues/${issueId}/upvote`);
      setIssues((prev) =>
        prev.map((issue) =>
          issue._id === issueId ? { ...issue, upvotes: response.data.upvotes, hasUpvoted: response.data.hasUpvoted } : issue
        )
      );
    } catch (error) {
      toast.error('Failed to upvote');
    }
  };

  const toggleCategory = (category) => {
    setCategoryFilter((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-2xl font-bold text-gray-900">FixMyCity</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-gray-300 transition-all"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/map')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                <MapIcon className="h-5 w-5" />
                <span className="font-medium">Map View</span>
              </button>

              <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-gray-500">Citizen</div>
                </div>
                <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold shadow-md">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-600 hidden sm:block" />
                </button>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Issues */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">+12%</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Issues</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          {/* Resolved */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">+8%</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Resolved</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <LoaderIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">-3%</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">In Progress</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">+5%</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Pending</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            <Plus className="h-5 w-5" />
            Report New Issue
          </button>

          <button
            onClick={() => navigate('/my-reports')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            <FileText className="h-5 w-5" />
            My Reports
          </button>

          <button
            onClick={() => navigate('/analytics')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            <BarChart3 className="h-5 w-5" />
            Analytics
          </button>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Category Filter */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-5 w-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-700">Filter by Category</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      categoryFilter.includes(category)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('recent')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  sortBy === 'recent'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock className="h-4 w-4" />
                Recent
              </button>
              <button
                onClick={() => setSortBy('trending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  sortBy === 'trending'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Trending
              </button>
            </div>
          </div>
        </div>

        {/* Issues Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoaderIcon className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} onUpvote={handleUpvote} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && issues.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <AlertCircle className="h-16 w-16 text-gray-300 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Issues Found</h3>
              <p className="text-gray-600 mb-6">
                {categoryFilter.length > 0
                  ? 'No issues match your filters. Try adjusting your selection.'
                  : 'No issues have been reported yet. Be the first to report one!'}
              </p>
              <button
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
              >
                <Plus className="h-5 w-5" />
                Report First Issue
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Issue Modal */}
      {showReportModal && (
        <ReportIssueModal
          onClose={() => setShowReportModal(false)}
          onSuccess={(newIssue) => {
            setIssues([newIssue, ...issues]);
            setShowReportModal(false);
            toast.success('Issue reported successfully!');
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

export default CitizenDashboard;
