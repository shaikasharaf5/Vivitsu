import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, LogOut, Eye, AlertTriangle, ClipboardCheck, FileText, Image as ImageIcon } from 'lucide-react';

const InspectorDashboard = () => {
  const [verifications, setVerifications] = useState([]);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [verdict, setVerdict] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [imageModal, setImageModal] = useState(null);
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

  const getImageUrl = (photoUrl) => {
    if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'))) {
      return photoUrl;
    }
    return `${import.meta.env.VITE_API_URL}${photoUrl}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Modern Header with Gradient */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <ClipboardCheck className="h-8 w-8 mr-3" />
                Inspector Dashboard
              </h1>
              <p className="text-purple-100 mt-1">Quality assurance & verification</p>
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
        {/* Stats Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-purple-100 mb-2">Pending Verifications</h2>
              <p className="text-6xl font-bold">{verifications.length}</p>
              <p className="text-purple-100 mt-2">Assignments awaiting quality review</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
              <Eye className="h-20 w-20 text-purple-100" />
            </div>
          </div>
        </div>

        {/* Verifications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {verifications.map((verification) => (
            <div key={verification._id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-purple-100 to-purple-50 p-5 border-b-2 border-purple-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {verification.assignment?.issue?.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{verification.assignment?.issue?.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-semibold">
                    {verification.assignment?.issue?.category}
                  </span>
                </div>
              </div>

              {/* Before/After Photos Section */}
              <div className="p-5">
                <div className="mb-5">
                  <div className="flex items-center mb-3">
                    <ImageIcon className="h-5 w-5 text-purple-600 mr-2" />
                    <h4 className="font-bold text-gray-900">Photo Comparison</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Before Photos (from original issue) */}
                    <div>
                      <div className="bg-red-100 border-2 border-red-300 rounded-lg p-2 mb-2">
                        <p className="text-xs font-bold text-red-800 text-center uppercase">Before</p>
                      </div>
                      {verification.assignment?.issue?.photos?.[0] ? (
                        <img
                          src={getImageUrl(verification.assignment.issue.photos[0])}
                          alt="Before"
                          onClick={() => setImageModal(getImageUrl(verification.assignment.issue.photos[0]))}
                          className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border-2 border-red-200"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-gray-400 text-sm">No before photo</p>
                        </div>
                      )}
                    </div>

                    {/* After Photos (from completion) */}
                    <div>
                      <div className="bg-green-100 border-2 border-green-300 rounded-lg p-2 mb-2">
                        <p className="text-xs font-bold text-green-800 text-center uppercase">After</p>
                      </div>
                      {verification.assignment?.completionPhotos?.[0] ? (
                        <img
                          src={getImageUrl(verification.assignment.completionPhotos[0])}
                          alt="After"
                          onClick={() => setImageModal(getImageUrl(verification.assignment.completionPhotos[0]))}
                          className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border-2 border-green-200"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-gray-400 text-sm">No after photo</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Photos Grid */}
                  {verification.assignment?.completionPhotos?.length > 1 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2 font-semibold">Additional completion photos:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {verification.assignment.completionPhotos.slice(1).map((photo, idx) => (
                          <img
                            key={idx}
                            src={getImageUrl(photo)}
                            alt={`Additional ${idx + 1}`}
                            onClick={() => setImageModal(getImageUrl(photo))}
                            className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150?text=Error';
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Worker Notes */}
                {verification.assignment?.completionNotes && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-5">
                    <div className="flex items-center mb-2">
                      <FileText className="h-4 w-4 text-blue-600 mr-2" />
                      <h4 className="font-bold text-blue-900 text-sm">Worker Notes</h4>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {verification.assignment.completionNotes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedVerification(verification);
                      setVerdict('APPROVED');
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center justify-center font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Approve Work
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVerification(verification);
                      setVerdict('REJECTED');
                    }}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl hover:from-red-700 hover:to-red-800 flex items-center justify-center font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Reject Work
                  </button>
                </div>
              </div>
            </div>
          ))}

          {verifications.length === 0 && (
            <div className="col-span-2 text-center py-20 bg-white rounded-2xl shadow-xl">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-500">No verifications pending. Great job!</p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className={`p-6 rounded-t-2xl ${
              verdict === 'APPROVED' 
                ? 'bg-gradient-to-r from-green-600 to-green-700' 
                : 'bg-gradient-to-r from-red-600 to-red-700'
            }`}>
              <h2 className="text-2xl font-bold text-white flex items-center">
                {verdict === 'APPROVED' ? (
                  <>
                    <CheckCircle className="h-7 w-7 mr-3" />
                    Approve Work
                  </>
                ) : (
                  <>
                    <XCircle className="h-7 w-7 mr-3" />
                    Reject Work
                  </>
                )}
              </h2>
              <p className={`${verdict === 'APPROVED' ? 'text-green-100' : 'text-red-100'} text-sm mt-1`}>
                {verdict === 'APPROVED' 
                  ? 'Confirm that the work meets quality standards' 
                  : 'Provide feedback on why the work needs revision'}
              </p>
            </div>

            <div className="p-6">
              {/* Rejection Reason (only for REJECTED) */}
              {verdict === 'REJECTED' && (
                <div className="mb-5">
                  <label className="block text-gray-900 font-bold mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Rejection Reason *
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a reason...</option>
                    <option value="Incomplete work">Incomplete work</option>
                    <option value="Poor quality">Poor quality</option>
                    <option value="Safety concerns">Safety concerns</option>
                    <option value="Doesn't match description">Doesn't match description</option>
                    <option value="Inadequate documentation">Inadequate documentation</option>
                    <option value="Other">Other</option>
                  </select>
                  {!rejectionReason && (
                    <p className="text-xs text-red-600 mt-2 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Please select a rejection reason
                    </p>
                  )}
                </div>
              )}

              {/* Inspector Notes */}
              <div className="mb-6">
                <label className="block text-gray-900 font-bold mb-3 flex items-center">
                  <FileText className={`h-5 w-5 mr-2 ${verdict === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`} />
                  Inspector Notes {verdict === 'REJECTED' && '*'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={verdict === 'APPROVED' 
                    ? "Add any observations or commendations..." 
                    : "Provide detailed feedback on what needs to be corrected..."}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="5"
                  required={verdict === 'REJECTED'}
                />
                <p className="text-xs text-gray-500 mt-2">{notes.length} characters</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedVerification(null);
                    setVerdict('');
                    setNotes('');
                    setRejectionReason('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify}
                  disabled={verdict === 'REJECTED' && (!rejectionReason || !notes)}
                  className={`flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ${
                    verdict === 'APPROVED' 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  }`}
                >
                  {verdict === 'APPROVED' ? (
                    <>
                      <CheckCircle className="inline h-5 w-5 mr-2" />
                      Confirm Approval
                    </>
                  ) : (
                    <>
                      <XCircle className="inline h-5 w-5 mr-2" />
                      Confirm Rejection
                    </>
                  )}
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
