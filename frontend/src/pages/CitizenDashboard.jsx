import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useSocket } from '../utils/SocketContext';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'react-toastify';
import { Plus, Heart, MessageCircle, MapPin, LogOut, Map as MapIcon, TrendingUp, Clock } from 'lucide-react';
import ReportIssueModal from '../components/ReportIssueModal';
import IssueCard from '../components/IssueCard';

const CitizenDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const socket = useSocket();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const categories = ['ROADS', 'UTILITIES', 'PARKS', 'TRAFFIC', 'SANITATION', 'HEALTH', 'OTHER'];

  useEffect(() => {
    fetchIssues();
  }, [sortBy, categoryFilter]);

  useEffect(() => {
    if (socket) {
      socket.on('issueCreated', (data) => {
        setIssues((prev) => [data.issue, ...prev]);
        toast.info('New issue reported in your area');
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

  const fetchIssues = async () => {
    try {
      const params = { sort: sortBy };
      if (categoryFilter.length > 0) {
        params.category = categoryFilter.join(',');
      }
      const response = await axios.get('/api/issues', { params });
      setIssues(response.data);
    } catch (error) {
      toast.error('Failed to fetch issues');
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold ml-2">FixMyCity</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/map')}
              className="flex items-center px-4 py-2 text-gray-700 hover:text-blue-600"
            >
              <MapIcon className="h-5 w-5 mr-2" />
              Map View
            </button>
            
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="ml-2 text-gray-700">{user?.name}</span>
            </div>
            
            <button onClick={logout} className="text-gray-600 hover:text-red-600">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`flex items-center px-4 py-2 rounded-lg ${sortBy === 'recent' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              <Clock className="h-4 w-4 mr-2" />
              Recent
            </button>
            <button
              onClick={() => setSortBy('trending')}
              className={`flex items-center px-4 py-2 rounded-lg ${sortBy === 'trending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </button>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Report Issue
          </button>
        </div>

        {/* Category Filter */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-4 py-2 rounded-full text-sm ${
                  categoryFilter.includes(category)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Issues Feed */}
        <div className="grid gap-4">
          {issues.map((issue) => (
            <IssueCard key={issue._id} issue={issue} onUpvote={handleUpvote} />
          ))}
          
          {issues.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No issues found. Be the first to report one!</p>
            </div>
          )}
        </div>
      </div>

      {showReportModal && (
        <ReportIssueModal
          onClose={() => setShowReportModal(false)}
          onSuccess={(newIssue) => {
            setIssues([newIssue, ...issues]);
            setShowReportModal(false);
            toast.success('Issue reported successfully!');
          }}
        />
      )}
    </div>
  );
};

export default CitizenDashboard;
