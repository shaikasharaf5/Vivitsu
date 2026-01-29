import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, AlertCircle, Clock, ArrowRight } from 'lucide-react';

const IssueCard = ({ issue, onUpvote }) => {
  const navigate = useNavigate();

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'bg-blue-500',
      MEDIUM: 'bg-yellow-500',
      HIGH: 'bg-orange-500',
      CRITICAL: 'bg-red-500'
    };
    return colors[priority] || colors.MEDIUM;
  };

  const getStatusConfig = (status) => {
    const configs = {
      REPORTED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Reported' },
      CATEGORIZED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Categorized' },
      ASSIGNED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Assigned' },
      IN_PROGRESS: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'In Progress' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      RESOLVED: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Resolved' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
    };
    return configs[status] || configs.REPORTED;
  };

  const getCategoryColor = (category) => {
    const colors = {
      ROADS: 'bg-red-500',
      UTILITIES: 'bg-blue-500',
      PARKS: 'bg-green-500',
      TRAFFIC: 'bg-orange-500',
      SANITATION: 'bg-teal-500',
      HEALTH: 'bg-pink-500',
      OTHER: 'bg-gray-500'
    };
    return colors[category] || colors.OTHER;
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

  const formatTimeAgo = (date) => {
    const now = new Date();
    const created = new Date(date);
    const diffInSeconds = Math.floor((now - created) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return created.toLocaleDateString();
  };

  const statusConfig = getStatusConfig(issue.status);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group cursor-pointer"
         onClick={() => navigate(`/issue/${issue._id}`)}>
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
        {issue.photos && issue.photos.length > 0 ? (
          <>
            <img
              src={getImageUrl(issue.photos[0])}
              alt={issue.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                console.error('Image failed to load:', issue.photos[0]);
                e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
              }}
            />
            {issue.photos.length > 1 && (
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white rounded-full text-xs font-semibold">
                +{issue.photos.length - 1} more
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <AlertCircle className="h-16 w-16 text-gray-400" />
          </div>
        )}
        
        {/* Category Badge (Top Right) */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 ${getCategoryColor(issue.category)} text-white rounded-full text-xs font-semibold shadow-lg`}>
            {issue.category}
          </span>
        </div>

        {/* Priority Indicator (Top Left) */}
        <div className="absolute top-3 left-3">
          <div className={`h-3 w-3 ${getPriorityColor(issue.priority)} rounded-full shadow-lg ring-2 ring-white`}></div>
        </div>

        {/* Status Badge (Bottom Left) */}
        <div className="absolute bottom-3 left-3">
          <span className={`px-3 py-1 ${statusConfig.bg} ${statusConfig.text} rounded-lg text-xs font-semibold shadow-md backdrop-blur-sm`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {issue.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {issue.description}
        </p>

        {/* Location */}
        <div className="flex items-center text-gray-500 text-xs mb-4">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{issue.address || `${issue.latitude}, ${issue.longitude}`}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Left: Interactions */}
          <div className="flex items-center gap-4">
            {/* Upvote */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpvote(issue._id);
              }}
              className={`flex items-center gap-1 transition-colors ${
                issue.hasUpvoted
                  ? 'text-red-600'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <Heart className={`h-4 w-4 ${issue.hasUpvoted ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{issue.upvotes || 0}</span>
            </button>

            {/* Comments */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/issue/${issue._id}#comments`);
              }}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{issue.comments?.length || 0}</span>
            </button>
          </div>

          {/* Right: Time */}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{formatTimeAgo(issue.createdAt)}</span>
          </div>
        </div>

        {/* Reporter (if available) */}
        {issue.reportedBy && (
          <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xs font-semibold">
              {issue.reportedBy.firstName?.[0]}{issue.reportedBy.lastName?.[0]}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">
                {issue.reportedBy.firstName} {issue.reportedBy.lastName}
              </div>
              <div className="text-xs text-gray-500">Reporter</div>
            </div>
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"></div>
    </div>
  );
};

export default IssueCard;
