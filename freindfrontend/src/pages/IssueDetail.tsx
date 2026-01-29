import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIssueById, upvoteIssue, addComment, statusLabels, categoryLabels, priorityColors, statusColors, updateIssue } from '../utils/issuesData';
import { useAuth } from '../utils/AuthContext';
import {
  ArrowLeft,
  MapPin,
  ThumbsUp,
  MessageCircle,
  Clock,
  User,
  Send,
  Share2,
  Flag,
  CheckCircle,
  Play,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const issue = useMemo(() => {
    if (!id) return null;
    return getIssueById(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshKey]);

  if (!issue) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Issue not found</h2>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:underline"
        >
          Go back to dashboard
        </button>
      </div>
    );
  }

  const handleUpvote = () => {
    upvoteIssue(issue.id);
    setRefreshKey(k => k + 1);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;
    
    addComment(issue.id, user.id, user.name, comment);
    setComment('');
    setRefreshKey(k => k + 1);
  };

  const handleStatusUpdate = (newStatus: 'in_progress' | 'pending_inspection' | 'resolved') => {
    updateIssue(issue.id, { status: newStatus });
    setRefreshKey(k => k + 1);
  };

  const timeAgo = getTimeAgo(issue.reportedAt);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Image */}
        {issue.images.length > 0 && (
          <div className="h-64 sm:h-80 overflow-hidden">
            <img
              src={issue.images[0]}
              alt={issue.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Status & Priority Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={cn("px-3 py-1 rounded-full text-sm font-medium", statusColors[issue.status])}>
              {statusLabels[issue.status]}
            </span>
            <span className={cn("px-3 py-1 rounded-full text-sm font-medium", priorityColors[issue.priority])}>
              {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)} Priority
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              {categoryLabels[issue.category]}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{issue.title}</h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>Reported by {issue.reportedBy}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{timeAgo}</span>
            </div>
            {issue.assignedTo && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Assigned to {issue.assignedTo}</span>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600 mb-6 p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span>{issue.location.address}</span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600 leading-relaxed">{issue.description}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pb-6 border-b border-gray-100">
            <button
              onClick={handleUpvote}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="font-medium">{issue.upvotes}</span>
              <span className="text-gray-500">Upvotes</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-red-600">
              <Flag className="w-4 h-4" />
              Report
            </button>

            {/* Worker/Inspector Actions */}
            {user?.role === 'worker' && issue.status === 'assigned' && (
              <button
                onClick={() => handleStatusUpdate('in_progress')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-auto"
              >
                <Play className="w-4 h-4" />
                Start Work
              </button>
            )}
            {user?.role === 'worker' && issue.status === 'in_progress' && (
              <button
                onClick={() => handleStatusUpdate('pending_inspection')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-auto"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Complete
              </button>
            )}
            {user?.role === 'inspector' && issue.status === 'pending_inspection' && (
              <button
                onClick={() => handleStatusUpdate('resolved')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-auto"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            )}
          </div>

          {/* Comments */}
          <div className="pt-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments ({issue.comments.length})
            </h2>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  type="submit"
                  disabled={!comment.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 disabled:text-gray-300"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Comments List */}
            {issue.comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-4">
                {issue.comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{c.userName}</span>
                        <span className="text-xs text-gray-400">{getTimeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-gray-600">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}
