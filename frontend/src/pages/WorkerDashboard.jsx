import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { useSocket } from '../utils/SocketContext';
import { toast } from 'react-toastify';
import { CheckCircle, Clock, MapPin, LogOut, Upload, AlertCircle, ClipboardCheck, Camera, FileText, Calendar, Package } from 'lucide-react';

const WorkerDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [completionPhotos, setCompletionPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [completionNotes, setCompletionNotes] = useState('');
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('assignmentCreated', () => {
        fetchAssignments();
        toast.info('New assignment received!');
      });
    }
  }, [socket]);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/api/assignments/mine');
      setAssignments(response.data);
    } catch (error) {
      toast.error('Failed to fetch assignments');
    }
  };

  const handleAccept = async (assignmentId) => {
    try {
      await axios.patch(`/api/assignments/${assignmentId}/accept`);
      toast.success('Assignment accepted!');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to accept assignment');
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setCompletionPhotos(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoPreview(previews);
  };

  const handleComplete = async () => {
    if (completionPhotos.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }

    try {
      const formData = new FormData();
      completionPhotos.forEach(photo => formData.append('photos', photo));
      formData.append('notes', completionNotes);

      await axios.patch(`/api/assignments/${selectedAssignment}/complete`, formData);
      toast.success('Assignment completed! Awaiting verification.');
      setSelectedAssignment(null);
      setCompletionPhotos([]);
      setPhotoPreview([]);
      setCompletionNotes('');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to complete assignment');
    }
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

  const pendingAssignments = assignments.filter(a => a.status === 'PENDING_ACCEPTANCE');
  const activeAssignments = assignments.filter(a => ['ACCEPTED', 'IN_PROGRESS'].includes(a.status));
  const completedAssignments = assignments.filter(a => a.status === 'COMPLETED');

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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-yellow-100 text-sm font-semibold uppercase tracking-wide mb-2">Pending Acceptance</h3>
                <p className="text-5xl font-bold">{pendingAssignments.length}</p>
                <p className="text-yellow-100 text-sm mt-2">Awaiting your response</p>
              </div>
              <AlertCircle className="h-16 w-16 text-yellow-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-100 text-sm font-semibold uppercase tracking-wide mb-2">In Progress</h3>
                <p className="text-5xl font-bold">{activeAssignments.length}</p>
                <p className="text-blue-100 text-sm mt-2">Currently working on</p>
              </div>
              <Clock className="h-16 w-16 text-blue-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-100 text-sm font-semibold uppercase tracking-wide mb-2">Completed</h3>
                <p className="text-5xl font-bold">{completedAssignments.length}</p>
                <p className="text-green-100 text-sm mt-2">Awaiting verification</p>
              </div>
              <CheckCircle className="h-16 w-16 text-green-200 opacity-50" />
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Column */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <AlertCircle className="h-6 w-6 mr-2" />
                Pending Acceptance
                <span className="ml-auto bg-white/30 rounded-full px-3 py-1 text-sm">
                  {pendingAssignments.length}
                </span>
              </h2>
            </div>
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {pendingAssignments.map((assignment) => (
                <div key={assignment._id} className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">{getCategoryIcon(assignment.issue?.category)}</span>
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-lg text-xs font-semibold">
                          {assignment.issue?.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">{assignment.issue?.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{assignment.issue?.description}</p>
                    </div>
                    {assignment.issue?.photos?.[0] && (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${assignment.issue.photos[0]}`}
                        alt="Issue"
                        className="w-20 h-20 object-cover rounded-lg ml-3"
                      />
                    )}
                  </div>

                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="line-clamp-1">{assignment.issue?.address}</span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAccept(assignment._id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold text-sm"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => navigate(`/issue/${assignment.issue?._id}`)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
              {pendingAssignments.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No pending assignments</p>
                </div>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Clock className="h-6 w-6 mr-2" />
                In Progress
                <span className="ml-auto bg-white/30 rounded-full px-3 py-1 text-sm">
                  {activeAssignments.length}
                </span>
              </h2>
            </div>
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {activeAssignments.map((assignment) => (
                <div key={assignment._id} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">{getCategoryIcon(assignment.issue?.category)}</span>
                        <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-lg text-xs font-semibold">
                          {assignment.issue?.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">{assignment.issue?.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{assignment.issue?.description}</p>
                    </div>
                    {assignment.issue?.photos?.[0] && (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${assignment.issue.photos[0]}`}
                        alt="Issue"
                        className="w-20 h-20 object-cover rounded-lg ml-3"
                      />
                    )}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="line-clamp-1">{assignment.issue?.address}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Started: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedAssignment(assignment._id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center font-semibold text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </button>
                    <button 
                      onClick={() => navigate(`/issue/${assignment.issue?._id}`)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
              {activeAssignments.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No active assignments</p>
                </div>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <ClipboardCheck className="h-6 w-6 mr-2" />
                Completed
                <span className="ml-auto bg-white/30 rounded-full px-3 py-1 text-sm">
                  {completedAssignments.length}
                </span>
              </h2>
            </div>
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {completedAssignments.map((assignment) => (
                <div key={assignment._id} className="bg-green-50 border-2 border-green-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">{getCategoryIcon(assignment.issue?.category)}</span>
                        <span className="px-2 py-1 bg-green-200 text-green-800 rounded-lg text-xs font-semibold">
                          {assignment.issue?.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">{assignment.issue?.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{assignment.issue?.description}</p>
                    </div>
                  </div>

                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-3">
                    <div className="flex items-center text-green-800 text-sm font-semibold">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Awaiting Inspector Verification
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/issue/${assignment.issue?._id}`)}
                    className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-semibold"
                  >
                    View Details
                  </button>
                </div>
              ))}
              {completedAssignments.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No completed assignments</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <ClipboardCheck className="h-7 w-7 mr-3" />
                Complete Assignment
              </h2>
              <p className="text-green-100 text-sm mt-1">Upload photos and provide completion notes</p>
            </div>

            <div className="p-6">
              {/* Photo Upload Section */}
              <div className="mb-6">
                <label className="block text-gray-900 font-bold mb-3 flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-green-600" />
                  Upload Completion Photos *
                </label>
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-semibold mb-1">Click to upload photos</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
                  </label>
                </div>

                {photoPreview.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {photoPreview.map((preview, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-green-200"
                        />
                        <div className="absolute inset-0 bg-green-600/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-gray-600 mt-2 flex items-center">
                  {completionPhotos.length > 0 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                      {completionPhotos.length} file(s) selected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-600 mr-1" />
                      Upload before/after photos (Required)
                    </>
                  )}
                </p>
              </div>

              {/* Notes Section */}
              <div className="mb-6">
                <label className="block text-gray-900 font-bold mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Completion Notes (Optional)
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Describe the work completed, any challenges faced, materials used, etc..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="4"
                />
                <p className="text-xs text-gray-500 mt-2">{completionNotes.length} characters</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedAssignment(null);
                    setCompletionPhotos([]);
                    setPhotoPreview([]);
                    setCompletionNotes('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComplete}
                  disabled={completionPhotos.length === 0}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl hover:from-green-700 hover:to-green-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Submit for Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
