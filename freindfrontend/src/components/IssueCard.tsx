import { MapPin, ThumbsUp, MessageCircle, Clock } from 'lucide-react';
import { Issue, categoryLabels, statusLabels, priorityColors, statusColors } from '../utils/issuesData';
import { cn } from '../utils/cn';

interface IssueCardProps {
  issue: Issue;
  onClick?: () => void;
  onUpvote?: () => void;
  compact?: boolean;
}

export function IssueCard({ issue, onClick, onUpvote, compact = false }: IssueCardProps) {
  const timeAgo = getTimeAgo(issue.reportedAt);

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {issue.images.length > 0 && !compact && (
        <div className="h-48 overflow-hidden">
          <img
            src={issue.images[0]}
            alt={issue.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={cn("font-semibold text-gray-900", compact ? "text-sm" : "text-lg")}>
            {issue.title}
          </h3>
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", priorityColors[issue.priority])}>
            {issue.priority}
          </span>
        </div>
        
        {!compact && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {issue.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[issue.status])}>
            {statusLabels[issue.status]}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {categoryLabels[issue.category]}
          </span>
        </div>
        
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">{issue.location.address}</span>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-gray-500 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            <span>{timeAgo}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpvote?.();
              }}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="text-xs font-medium">{issue.upvotes}</span>
            </button>
            
            <div className="flex items-center gap-1 text-gray-500">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{issue.comments.length}</span>
            </div>
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
