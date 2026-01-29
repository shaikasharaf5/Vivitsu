import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, AlertCircle } from 'lucide-react';

const IssueCard = ({ issue, onUpvote }) => {
  const navigate = useNavigate();

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
      RESOLVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.REPORTED;
  };

  // Helper to get correct image URL
  const getImageUrl = (photoUrl) => {
    // If it's already a full URL (Cloudinary), return as-is
    if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'))) {
      return photoUrl;
    }
    // Otherwise, it's a local file, prepend API URL
    return `${import.meta.env.VITE_API_URL}${photoUrl}`;
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
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
          
          <h3
            className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
            onClick={() => navigate(`/issue/${issue._id}`)}
          >
            {issue.title}
          </h3>
          
          <p className="text-gray-600 mt-2 line-clamp-2">{issue.description}</p>
          
          <div className="flex items-center mt-3 text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{issue.address || `${issue.latitude}, ${issue.longitude}`}</span>
          </div>

          {issue.reportedBy && (
            <div className="flex items-center mt-2">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                {issue.reportedBy.firstName?.[0]}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {issue.reportedBy.firstName} {issue.reportedBy.lastName}
              </span>
            </div>
          )}
        </div>

        {issue.photos && issue.photos.length > 0 && (
          <img
            src={getImageUrl(issue.photos[0])}
            alt="Issue"
            className="w-24 h-24 object-cover rounded-lg ml-4"
            onError={(e) => {
              console.error('Image failed to load:', issue.photos[0]);
              e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
            }}
          />
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onUpvote(issue._id)}
            className={`flex items-center space-x-1 ${issue.hasUpvoted ? 'text-red-600' : 'text-gray-600'} hover:text-red-600`}
          >
            <Heart className={`h-5 w-5 ${issue.hasUpvoted ? 'fill-current' : ''}`} />
            <span className="font-semibold">{issue.upvotes || 0}</span>
          </button>

          <div className="flex items-center space-x-1 text-gray-600">
            <MessageCircle className="h-5 w-5" />
            <span>{issue.comments?.length || 0}</span>
          </div>
        </div>

        <button
          onClick={() => navigate(`/issue/${issue._id}`)}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          View Details →
        </button>
      </div>
    </div>
  );
};

export default IssueCard;
