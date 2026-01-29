import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, LogOut } from 'lucide-react';

const InspectorDashboard = () => {
  const [verifications, setVerifications] = useState([]);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [verdict, setVerdict] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const response = await axios.get('/api/verifications/pending');
      setVerifications(response.data);
    } catch (error) {
      toast.error('Failed to fetch verifications');
    }
  };

  const handleVerify = async () => {
    try {
      await axios.patch(`/api/verifications/${selectedVerification._id}/verify`, {
        verdict,
        notes,
        rejectionReason: verdict === 'REJECTED' ? rejectionReason : null
      });

      toast.success(`Work ${verdict.toLowerCase()}!`);
      setSelectedVerification(null);
      setVerdict('');
      setNotes('');
      setRejectionReason('');
      fetchVerifications();
    } catch (error) {
      toast.error('Failed to verify');
    }
  };

  // Helper to get correct image URL
  const getImageUrl = (photoUrl) => {
    if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'))) {
      return photoUrl;
    }
    return `${import.meta.env.VITE_API_URL}${photoUrl}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inspector Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
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
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-2">Pending Verifications</h2>
          <p className="text-gray-600">{verifications.length} assignments awaiting review</p>
        </div>

        {/* Verifications List */}
        <div className="space-y-4">
          {verifications.map((verification) => (
            <div key={verification._id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-2">{verification.assignment?.issue?.title}</h3>
              <p className="text-gray-600 mb-4">{verification.assignment?.issue?.description}</p>

              {/* Completion Photos */}
              {verification.assignment?.completionPhotos?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Completion Photos:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {verification.assignment.completionPhotos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={getImageUrl(photo)}
                        alt={`Completion ${idx + 1}`}
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          console.error('Image failed to load:', photo);
                          e.target.src = 'https://via.placeholder.com/200x150?text=Image+Error';
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Notes */}
              {verification.assignment?.completionNotes && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-1">Worker Notes:</h4>
                  <p className="text-gray-700">{verification.assignment.completionNotes}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedVerification(verification);
                    setVerdict('APPROVED');
                  }}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedVerification(verification);
                    setVerdict('REJECTED');
                  }}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Reject
                </button>
              </div>
            </div>
          ))}

          {verifications.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No verifications pending. Great job!</p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {verdict === 'APPROVED' ? 'Approve Work' : 'Reject Work'}
            </h2>

            {verdict === 'REJECTED' && (
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Rejection Reason *</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select reason...</option>
                  <option value="Incomplete work">Incomplete work</option>
                  <option value="Poor quality">Poor quality</option>
                  <option value="Safety concerns">Safety concerns</option>
                  <option value="Doesn't match description">Doesn't match description</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Inspector Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your inspection notes..."
                className="w-full px-4 py-2 border rounded-lg"
                rows="4"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedVerification(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={verdict === 'REJECTED' && !rejectionReason}
                className={`flex-1 py-2 rounded-lg text-white ${
                  verdict === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                Confirm {verdict === 'APPROVED' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectorDashboard;
