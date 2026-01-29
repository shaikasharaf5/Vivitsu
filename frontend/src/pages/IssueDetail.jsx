import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'react-toastify';
import { ArrowLeft, Heart, MapPin, Calendar, User, MessageCircle } from 'lucide-react';

const IssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

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
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.MEDIUM;
  };

  const getStatusColor = (status) => {
    const colors = {
      REPORTED: 'bg-gray-100 text-gray-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      RESOLVED: 'bg-green-100 text-green-800'
    };
    return colors[status] || colors.REPORTED;
  };

  const getImageUrl = (photoUrl) => {
    // If it's already a full URL (Cloudinary), return as-is
    if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'))) {
      return photoUrl;
    }
    // Otherwise, it's a local file, prepend API URL
    return `${import.meta.env.VITE_API_URL}${photoUrl}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-700 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Feed
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Issue Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* Badges */}
          <div className="flex items-center space-x-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(issue.priority)}`}>
              {issue.priority}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(issue.status)}`}>
              {issue.status.replace('_', ' ')}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
              {issue.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{issue.title}</h1>

          {/* Description */}
          <p className="text-gray-700 mb-6 text-lg">{issue.description}</p>

          {/* Photos */}
          {issue.photos && issue.photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {issue.photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(photo)}
                  alt={`Issue photo ${idx + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    console.error('Image failed to load:', photo);
                    e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                  }}
                />
              ))}
            </div>
          )}

          {/* Meta Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{issue.address || `${issue.latitude}, ${issue.longitude}`}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <User className="h-4 w-4 mr-2" />
              <span>{issue.reportedBy?.firstName} {issue.reportedBy?.lastName}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <MessageCircle className="h-4 w-4 mr-2" />
              <span>{issue.comments?.length || 0} comments</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 pt-4 border-t">
            <button
              onClick={handleUpvote}
              className={`flex items-center space-x-2 ${issue.hasUpvoted ? 'text-red-600' : 'text-gray-600'} hover:text-red-600`}
            >
              <Heart className={`h-6 w-6 ${issue.hasUpvoted ? 'fill-current' : ''}`} />
              <span className="font-semibold">{issue.upvotes} Upvotes</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Comments ({issue.comments?.length || 0})</h2>

          {/* Comment Form */}
          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <button
              type="submit"
              className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Post Comment
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {issue.comments?.map((comment) => (
              <div key={comment._id} className="border-b pb-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                    {comment.author?.firstName?.[0]}
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">
                      {comment.author?.firstName} {comment.author?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 ml-11">{comment.text}</p>
              </div>
            ))}

            {(!issue.comments || issue.comments.length === 0) && (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
