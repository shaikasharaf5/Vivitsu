import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { useSocket } from '../utils/SocketContext';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, LogOut, Eye, AlertTriangle, ClipboardCheck, FileText, Image as ImageIcon, Clock, MapPin, Package, Calendar, AlertCircle } from 'lucide-react';

const InspectorDashboard = () => {
  const [workUpdates, setWorkUpdates] = useState([]);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [imageModal, setImageModal] = useState(null);
  const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('newWorkUpdate', (data) => {
        toast.info('New work update submitted for verification');
        fetchPendingVerifications();
      });

      return () => {
        socket.off('newWorkUpdate');
      };
    }
  }, [socket]);

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/work-updates/pending-verifications');
      setWorkUpdates(response.data);
    } catch (error) {
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (updateId, status) => {
    if (!verificationNotes.trim()) {
      toast.error('Please provide verification notes');
      return;
    }

    try {
      await axios.put(`/api/work-updates/${updateId}/verify`, {
        status,
        notes: verificationNotes
      });

      toast.success(`Work update ${status.toLowerCase()} successfully`);
      setSelectedUpdate(null);
      setVerificationNotes('');
      fetchPendingVerifications();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to verify work update');
    }
  };

  const getUpdateTypeColor = (type) => {
    const colors = {
      STARTED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      BLOCKED: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
  const filteredUpdates = filter === 'ALL' 
    ? workUpdates 
    : workUpdates.filter(update => update.verificationStatus === filter);

  const getImageUrl = (photoUrl) => {
    if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'))) {
      return photoUrl;
    }
    return `${import.meta.env.VITE_API_URL}${photoUrl}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <ClipboardCheck className="h-8 w-8 mr-3" />
                Inspector Dashboard
              </h1>
              <p className="text-purple-100 mt-1">Verify field work updates</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-600 font-bold text-lg">
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
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                filter === filterOption
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-yellow-100 text-sm font-semibold uppercase tracking-wide mb-2">Pending Review</h3>
                <p className="text-5xl font-bold">
                  {workUpdates.filter(u => u.verificationStatus === 'PENDING').length}
                </p>
                <p className="text-yellow-100 text-sm mt-2">Awaiting verification</p>
              </div>
              <AlertCircle className="h-16 w-16 text-yellow-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-100 text-sm font-semibold uppercase tracking-wide mb-2">Approved</h3>
                <p className="text-5xl font-bold">
                  {workUpdates.filter(u => u.verificationStatus === 'APPROVED').length}
                </p>
                <p className="text-green-100 text-sm mt-2">Verified work</p>
              </div>
              <CheckCircle className="h-16 w-16 text-green-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-red-100 text-sm font-semibold uppercase tracking-wide mb-2">Rejected</h3>
                <p className="text-5xl font-bold">
                  {workUpdates.filter(u => u.verificationStatus === 'REJECTED').length}
                </p>
                <p className="text-red-100 text-sm mt-2">Needs revision</p>
              </div>
              <XCircle className="h-16 w-16 text-red-200 opacity-50" />
            </div>
          </div>
        </div>

        {/* Work Updates List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading work updates...</p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <ClipboardCheck className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Work Updates</h3>
            <p className="text-gray-600">There are no work updates in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredUpdates.map((update) => (
              <div
                key={update._id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <div className="p-6">
                  {/* Update Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-2">{getCategoryIcon(update.issue?.category)}</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                          {update.issue?.category}
                        </span>
                        <span className={`ml-2 px-3 py-1 rounded-lg text-xs font-semibold ${getUpdateTypeColor(update.updateType)}`}>
                          {update.updateType.replace('_', ' ')}
                        </span>
                        <span className={`ml-2 px-3 py-1 rounded-lg text-xs font-semibold border ${
                          update.verificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          update.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {update.verificationStatus}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{update.issue?.title}</h3>
                      <p className="text-gray-600 mb-4">{update.description}</p>

                      {/* Work Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-sm">
                          <Package className="h-4 w-4 text-purple-600 mr-2" />
                          <div>
                            <p className="text-gray-500 text-xs">Progress</p>
                            <p className="font-semibold">{update.progressPercentage}%</p>
                          </div>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 text-purple-600 mr-2" />
                          <div>
                            <p className="text-gray-500 text-xs">Hours Worked</p>
                            <p className="font-semibold">{update.hoursWorked}h</p>
                          </div>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 text-purple-600 mr-2" />
                          <div>
                            <p className="text-gray-500 text-xs">Location</p>
                            <p className="font-semibold truncate">{update.issue?.address?.split(',')[0]}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                          <div>
                            <p className="text-gray-500 text-xs">Submitted</p>
                            <p className="font-semibold">{new Date(update.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Materials Used */}
                      {update.materialsUsed && update.materialsUsed.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Materials Used:</h4>
                          <div className="flex flex-wrap gap-2">
                            {update.materialsUsed.map((material, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium"
                              >
                                {material.name} ({material.quantity} {material.unit})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Worker Info */}
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Worker:</span> {update.worker?.firstName} {update.worker?.lastName}
                      </div>
                    </div>
                  </div>

                  {/* Work Photos */}
                  {update.photos && update.photos.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Work Photos:</h4>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {update.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={getImageUrl(photo)}
                            alt={`Work photo ${idx + 1}`}
                            className="w-full aspect-square object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setImageModal(getImageUrl(photo))}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verification Section */}
                  {update.verificationStatus === 'PENDING' && (
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                      <button
                        onClick={() => setSelectedUpdate(update)}
                        className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg"
                      >
                        <Eye className="h-5 w-5 mr-2" />
                        Review & Verify
                      </button>
                    </div>
                  )}

                  {/* Verification Notes (if verified) */}
                  {update.verificationNotes && (
                    <div className={`mt-4 p-4 rounded-xl ${
                      update.verificationStatus === 'APPROVED' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex items-start">
                        <FileText className={`h-5 w-5 mr-2 ${
                          update.verificationStatus === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 mb-1">Inspector Notes:</p>
                          <p className="text-sm text-gray-700">{update.verificationNotes}</p>
                          {update.verifiedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              Verified on {new Date(update.verifiedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {selectedUpdate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <ClipboardCheck className="h-7 w-7 mr-3" />
                Verify Work Update
              </h2>
              <p className="text-purple-100 text-sm mt-1">Review the work and provide your feedback</p>
            </div>

            <div className="p-6">
              {/* Update Summary */}
              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-gray-900 mb-2">{selectedUpdate.issue?.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{selectedUpdate.description}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="font-semibold">Progress: {selectedUpdate.progressPercentage}%</span>
                  <span className="font-semibold">Hours: {selectedUpdate.hoursWorked}h</span>
                  <span className={`px-3 py-1 rounded-lg font-semibold ${getUpdateTypeColor(selectedUpdate.updateType)}`}>
                    {selectedUpdate.updateType}
                  </span>
                </div>
              </div>

              {/* Verification Notes */}
              <div className="mb-6">
                <label className="block text-gray-900 font-bold mb-3">
                  Verification Notes *
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Provide detailed feedback about the work quality, materials used, and any observations..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                  rows="6"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleVerification(selectedUpdate._id, 'APPROVED')}
                  className="flex-1 bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-all shadow-lg font-semibold flex items-center justify-center"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approve Work
                </button>
                <button
                  onClick={() => handleVerification(selectedUpdate._id, 'REJECTED')}
                  className="flex-1 bg-red-600 text-white py-4 rounded-xl hover:bg-red-700 transition-all shadow-lg font-semibold flex items-center justify-center"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Reject Work
                </button>
                <button
                  onClick={() => {
                    setSelectedUpdate(null);
                    setVerificationNotes('');
                  }}
                  className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {imageModal && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setImageModal(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
            >
              <XCircle className="h-8 w-8" />
            </button>
            <img
              src={imageModal}
              alt="Full size"
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectorDashboard;
