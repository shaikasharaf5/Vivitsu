import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { useSocket } from '../utils/SocketContext';
import { toast } from 'react-toastify';
import { CheckCircle, Clock, MapPin, LogOut, Upload } from 'lucide-react';

const WorkerDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [completionPhotos, setCompletionPhotos] = useState([]);
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
      setCompletionNotes('');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to complete assignment');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING_ACCEPTANCE: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Worker Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0)}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-semibold">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {assignments.filter(a => a.status === 'PENDING_ACCEPTANCE').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-semibold">In Progress</h3>
            <p className="text-3xl font-bold text-blue-600">
              {assignments.filter(a => ['ACCEPTED', 'IN_PROGRESS'].includes(a.status)).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-semibold">Completed</h3>
            <p className="text-3xl font-bold text-green-600">
              {assignments.filter(a => a.status === 'COMPLETED').length}
            </p>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(assignment.status)}`}>
                      {assignment.status.replace('_', ' ')}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {assignment.issue?.category}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{assignment.issue?.title}</h3>
                  <p className="text-gray-600 mb-3">{assignment.issue?.description}</p>

                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{assignment.issue?.address}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>
                      Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                      {assignment.estimatedCompletionTime && 
                        ` • Due ${new Date(assignment.estimatedCompletionTime).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>

                {assignment.issue?.photos?.[0] && (
                  <img
                    src={`${import.meta.env.VITE_API_URL}${assignment.issue.photos[0]}`}
                    alt="Issue"
                    className="w-24 h-24 object-cover rounded-lg ml-4"
                  />
                )}
              </div>

              <div className="flex space-x-3">
                {assignment.status === 'PENDING_ACCEPTANCE' && (
                  <>
                    <button
                      onClick={() => handleAccept(assignment._id)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                      Accept Assignment
                    </button>
                    <button className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
                      Decline
                    </button>
                  </>
                )}

                {['ACCEPTED', 'IN_PROGRESS'].includes(assignment.status) && (
                  <button
                    onClick={() => setSelectedAssignment(assignment._id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Mark as Complete
                  </button>
                )}

                <button
                  onClick={() => navigate(`/issue/${assignment.issue?._id}`)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}

          {assignments.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No assignments yet. Check back later!</p>
            </div>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Complete Assignment</h2>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Upload Photos (Required)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setCompletionPhotos(Array.from(e.target.files))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                {completionPhotos.length > 0 ? `${completionPhotos.length} file(s) selected` : 'Upload before/after photos'}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Notes (Optional)</label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Describe the work completed..."
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
