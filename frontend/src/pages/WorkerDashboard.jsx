import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { useSocket } from '../utils/SocketContext';
import { toast } from 'react-toastify';
import { CheckCircle, Clock, MapPin, LogOut, Upload, AlertCircle, ClipboardCheck, Camera, FileText, Calendar, Package, Activity, TrendingUp, Briefcase } from 'lucide-react';
import WorkUpdateModal from '../components/WorkUpdateModal';

const WorkerDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, ASSIGNED, IN_PROGRESS, COMPLETED
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyIssues();
  }, [filter]);

  useEffect(() => {
    if (socket) {
      socket.on('issueAssigned', (data) => {
        toast.info('New issue assigned to you!');
        fetchMyIssues();
      });
    }
  }, [socket]);

  const fetchMyIssues = async () => {
    try {
      // Fetch issues where assignedWorker matches current user's employee record
      const response = await axios.get('/api/issues', {
        params: { assignedWorker: user._id }
      });
      
      let filteredIssues = response.data;
      if (filter !== 'ALL') {
        filteredIssues = response.data.filter(issue => issue.status === filter);
      }
      
      setIssues(filteredIssues);
    } catch (error) {
      console.error('Fetch issues error:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkUpdate = (issue) => {
    setSelectedIssue(issue);
    setShowUpdateModal(true);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      ROADS: '🛣️',
      UTILITIES: '⚡',
      PARKS: '🌳',
      TRAFFIC: '🚦',
      SANITATION: '🗑️',
      HEALTH: '🏥',
      OTHER: '📋'
    };
    return icons[category] || '📋';
  };

  const getStatusColor = (status) => {
    const colors = {
      ASSIGNED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      RESOLVED: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const assignedIssues = issues.filter(i => i.status === 'ASSIGNED');
  const inProgressIssues = issues.filter(i => i.status === 'IN_PROGRESS');
  const completedIssues = issues.filter(i => ['COMPLETED', 'RESOLVED'].includes(i.status));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Modern Header with Gradient */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Package className="h-8 w-8 mr-3" />
                Worker Dashboard
              </h1>
              <p className="text-blue-100 mt-1">Manage your field assignments</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-lg">
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
        {/* Filter Tabs */}
        <div className="mb-6 flex space-x-2 bg-white rounded-xl p-2 shadow-lg">
          {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                filter === filterOption
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filterOption.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-yellow-100 text-sm font-semibold uppercase tracking-wide mb-2">Assigned</h3>
                <p className="text-5xl font-bold">{assignedIssues.length}</p>
                <p className="text-yellow-100 text-sm mt-2">Awaiting start</p>
              </div>
              <AlertCircle className="h-16 w-16 text-yellow-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-100 text-sm font-semibold uppercase tracking-wide mb-2">In Progress</h3>
                <p className="text-5xl font-bold">{inProgressIssues.length}</p>
                <p className="text-blue-100 text-sm mt-2">Currently working on</p>
              </div>
              <Clock className="h-16 w-16 text-blue-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-100 text-sm font-semibold uppercase tracking-wide mb-2">Completed</h3>
                <p className="text-5xl font-bold">{completedIssues.length}</p>
                <p className="text-green-100 text-sm mt-2">Awaiting verification</p>
              </div>
              <CheckCircle className="h-16 w-16 text-green-200 opacity-50" />
            </div>
          </div>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading assignments...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Issues Assigned</h3>
            <p className="text-gray-600">You don't have any issues assigned yet. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {issues.map((issue) => (
              <div
                key={issue._id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-2">{getCategoryIcon(issue.category)}</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                          {issue.category}
                        </span>
                        <span className={`ml-2 px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(issue.status)}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{issue.title}</h3>
                      <p className="text-gray-600 mb-4">{issue.description}</p>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{issue.address}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Assigned: {new Date(issue.assignedAt || issue.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {issue.photos?.[0] && (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${issue.photos[0]}`}
                        alt="Issue"
                        className="w-24 h-24 object-cover rounded-xl ml-6"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => handleWorkUpdate(issue)}
                      className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Submit Work Update
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Work Update Modal */}
      {showUpdateModal && selectedIssue && (
        <WorkUpdateModal
          issue={selectedIssue}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedIssue(null);
          }}
          onSuccess={() => {
            fetchMyIssues();
          }}
        />
      )}

    </div>
  );
};

export default WorkerDashboard;
