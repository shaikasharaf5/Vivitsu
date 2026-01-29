import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'react-toastify';
import { ArrowLeft, Heart, MapPin, Calendar, User, MessageCircle, Clock, CheckCircle2, AlertCircle, Image as ImageIcon, X } from 'lucide-react';

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageModal, setImageModal] = useState(null);

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const fetchIssue = async () => {
    try {
      const response = await axios.get(`/api/issues/${id}`);
      setIssue(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Issue not found');
      navigate('/');
    }
  };

  const handleUpvote = async () => {
    try {
      const response = await axios.patch(`/api/issues/${id}/upvote`);
      setIssue({ ...issue, upvotes: response.data.upvotes, hasUpvoted: response.data.hasUpvoted });
    } catch (error) {
      toast.error('Failed to upvote');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await axios.post(`/api/issues/${id}/comments`, { text: comment });
      setIssue({ ...issue, comments: [...issue.comments, response.data] });
      setComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'from-blue-500 to-blue-600',
      MEDIUM: 'from-yellow-500 to-yellow-600',
      HIGH: 'from-orange-500 to-orange-600',
      CRITICAL: 'from-red-500 to-red-600'
    };
    return colors[priority] || colors.MEDIUM;
  };

  const getStatusInfo = (status) => {
    const info = {
      REPORTED: { color: 'bg-gray-500', icon: AlertCircle, label: 'Reported' },
      ASSIGNED: { color: 'bg-blue-500', icon: User, label: 'Assigned' },
      IN_PROGRESS: { color: 'bg-yellow-500', icon: Clock, label: 'In Progress' },
      COMPLETED: { color: 'bg-purple-500', icon: CheckCircle2, label: 'Completed' },
      RESOLVED: { color: 'bg-green-500', icon: CheckCircle2, label: 'Resolved' }
    };
    return info[status] || info.REPORTED;
  };

  const getImageUrl = (photoUrl) => {
    if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'))) {
      return photoUrl;
    }
    return `${import.meta.env.VITE_API_URL}${photoUrl}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading issue details...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(issue.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-white hover:text-blue-100 transition-colors mb-4 font-semibold"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Feed
          </button>
          <div className="flex items-center space-x-3">
            <span className={`px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${getPriorityColor(issue.priority)} shadow-lg`}>
              {issue.priority} PRIORITY
            </span>
            <span className={`px-4 py-2 rounded-xl text-sm font-bold text-white ${statusInfo.color} shadow-lg flex items-center`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {statusInfo.label}
            </span>
            <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-semibold">
              {issue.category}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{issue.title}</h1>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">{issue.description}</p>

                {/* Photo Gallery */}
                {issue.photos && issue.photos.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <ImageIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="text-lg font-bold text-gray-900">Photos ({issue.photos.length})</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {issue.photos.map((photo, idx) => (
                        <div
                          key={idx}
                          onClick={() => setImageModal(getImageUrl(photo))}
                          className="relative group cursor-pointer overflow-hidden rounded-xl"
                        >
                          <img
                            src={getImageUrl(photo)}
                            alt={`Issue photo ${idx + 1}`}
                            className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              console.error('Image failed to load:', photo);
                              e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upvote Button */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleUpvote}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all ${
                      issue.hasUpvoted 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`h-6 w-6 ${issue.hasUpvoted ? 'fill-current' : ''}`} />
                    <span className="text-lg">{issue.upvotes} Upvote{issue.upvotes !== 1 ? 's' : ''}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-6 border-b-2 border-blue-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <MessageCircle className="h-6 w-6 mr-3 text-blue-600" />
                  Comments ({issue.comments?.length || 0})
                </h2>
              </div>

              <div className="p-6">
                {/* Comment Form */}
                <form onSubmit={handleComment} className="mb-8">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts or updates..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="3"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-gray-500">{comment.length} characters</p>
                    <button
                      type="submit"
                      disabled={!comment.trim()}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                      Post Comment
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-5">
                  {issue.comments?.map((comment) => (
                    <div key={comment._id} className="border-l-4 border-blue-500 bg-gray-50 rounded-lg p-5">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                          {comment.author?.firstName?.[0]}
                        </div>
                        <div className="ml-3">
                          <p className="font-bold text-gray-900">
                            {comment.author?.firstName} {comment.author?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 ml-13 leading-relaxed">{comment.text}</p>
                    </div>
                  ))}

                  {(!issue.comments || issue.comments.length === 0) && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 font-semibold">No comments yet</p>
                      <p className="text-gray-400 text-sm">Be the first to share your thoughts!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Issue Meta Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-5">Issue Information</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-blue-600 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Location</p>
                    <p className="text-gray-900 font-medium">{issue.address || `${issue.latitude}, ${issue.longitude}`}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-blue-600 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Reported On</p>
                    <p className="text-gray-900 font-medium">{new Date(issue.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <User className="h-5 w-5 text-blue-600 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Reported By</p>
                    <p className="text-gray-900 font-medium">{issue.reportedBy?.firstName} {issue.reportedBy?.lastName}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MessageCircle className="h-5 w-5 text-blue-600 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Engagement</p>
                    <p className="text-gray-900 font-medium">{issue.comments?.length || 0} comments • {issue.upvotes} upvotes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Timeline Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-5">Status Timeline</h3>
              <div className="space-y-4">
                {[
                  { status: 'REPORTED', label: 'Reported', active: true },
                  { status: 'ASSIGNED', label: 'Assigned to Worker', active: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'RESOLVED'].includes(issue.status) },
                  { status: 'IN_PROGRESS', label: 'Work in Progress', active: ['IN_PROGRESS', 'COMPLETED', 'RESOLVED'].includes(issue.status) },
                  { status: 'COMPLETED', label: 'Work Completed', active: ['COMPLETED', 'RESOLVED'].includes(issue.status) },
                  { status: 'RESOLVED', label: 'Verified & Resolved', active: issue.status === 'RESOLVED' }
                ].map((step, idx) => {
                  const stepInfo = getStatusInfo(step.status);
                  const StepIcon = stepInfo.icon;
                  return (
                    <div key={idx} className="flex items-start">
                      <div className={`${step.active ? stepInfo.color : 'bg-gray-300'} rounded-full p-2 mr-4`}>
                        <StepIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        {step.active && issue.status === step.status && (
                          <p className="text-xs text-gray-500 mt-1">Current status</p>
                        )}
                      </div>
                      {step.active && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {imageModal && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <button
              onClick={() => setImageModal(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black/50 rounded-full p-3 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={imageModal}
              alt="Full size"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueDetail;
