import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { X, CheckCircle, XCircle, Briefcase, DollarSign, Clock, FileText, AlertCircle } from 'lucide-react';

const BidReviewModal = ({ isOpen, onClose, onSuccess }) => {
  const [pendingBids, setPendingBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPendingBids();
    }
  }, [isOpen]);

  const fetchPendingBids = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/bids/pending');
      setPendingBids(response.data);
    } catch (error) {
      toast.error('Failed to load pending bids');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (bidId, status) => {
    if (!reviewNotes.trim() && status === 'REJECTED') {
      toast.error('Please provide review notes for rejection');
      return;
    }

    try {
      await axios.put(`/api/bids/${bidId}/review`, {
        status,
        notes: reviewNotes
      });

      toast.success(`Bid ${status.toLowerCase()} successfully!`);
      setSelectedBid(null);
      setReviewNotes('');
      fetchPendingBids();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to review bid');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-t-2xl sticky top-0 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Briefcase className="h-7 w-7 mr-3" />
              Review Contractor Bids
            </h2>
            <p className="text-orange-100 text-sm mt-1">{pendingBids.length} bid(s) awaiting review</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading bids...</p>
            </div>
          ) : pendingBids.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No pending bids to review.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingBids.map((bid) => (
                <div
                  key={bid._id}
                  className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-xl p-6"
                >
                  {/* Bid Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{bid.issue?.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{bid.issue?.description}</p>
                      
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 text-orange-600 mr-2" />
                          <span className="text-sm font-semibold text-gray-700">
                            {bid.contractor?.companyName || bid.contractor?.name}
                          </span>
                        </div>
                        {bid.contractor?.rating && (
                          <div className="flex items-center">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm font-semibold text-gray-700 ml-1">
                              {bid.contractor.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bid Amount */}
                    <div className="text-right ml-6">
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Bid Amount</p>
                      <p className="text-3xl font-bold text-orange-600">₹{bid.bidAmount.toLocaleString()}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {bid.estimatedDays} days
                      </p>
                    </div>
                  </div>

                  {/* Proposal */}
                  <div className="bg-white rounded-lg p-4 mb-3">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                      <FileText className="h-4 w-4 text-orange-600 mr-2" />
                      Proposal
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{bid.proposal}</p>
                  </div>

                  {/* Methodology */}
                  {bid.methodology && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-3">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Methodology</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{bid.methodology}</p>
                    </div>
                  )}

                  {/* Materials */}
                  {bid.materials && bid.materials.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Materials Breakdown</h4>
                      <div className="space-y-2">
                        {bid.materials.map((material, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 font-medium">
                              {material.name} ({material.quantity} {material.unit})
                            </span>
                            {material.cost && (
                              <span className="text-gray-900 font-bold">₹{material.cost.toLocaleString()}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Section */}
                  {selectedBid === bid._id ? (
                    <div className="bg-gray-50 rounded-xl p-4 mt-4">
                      <label className="block text-gray-900 font-bold mb-2">
                        Review Notes
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Provide feedback for this bid..."
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none resize-none"
                        rows="3"
                      />
                      
                      <div className="flex space-x-3 mt-4">
                        <button
                          onClick={() => handleReview(bid._id, 'APPROVED')}
                          className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg font-semibold flex items-center justify-center"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Approve & Award
                        </button>
                        <button
                          onClick={() => handleReview(bid._id, 'REJECTED')}
                          className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-all shadow-lg font-semibold flex items-center justify-center"
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          Reject Bid
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBid(null);
                            setReviewNotes('');
                          }}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-4 border-t">
                      <button
                        onClick={() => setSelectedBid(bid._id)}
                        className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all shadow-lg font-semibold"
                      >
                        Review Bid
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BidReviewModal;
