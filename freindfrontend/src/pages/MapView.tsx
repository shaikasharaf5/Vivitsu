import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIssues, Issue, categoryLabels, priorityColors, statusColors, statusLabels } from '../utils/issuesData';
import { MapPin, X, Filter, ThumbsUp, Clock, Navigation } from 'lucide-react';
import { cn } from '../utils/cn';

export function MapView() {
  const navigate = useNavigate();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'active' | 'resolved'>('all');

  const issues = useMemo(() => {
    const all = getIssues();
    switch (filter) {
      case 'critical':
        return all.filter(i => i.priority === 'critical' || i.priority === 'high');
      case 'active':
        return all.filter(i => !['resolved', 'closed'].includes(i.status));
      case 'resolved':
        return all.filter(i => ['resolved', 'closed'].includes(i.status));
      default:
        return all;
    }
  }, [filter]);

  // Generate positions for the mock map
  const getMarkerPosition = (issue: Issue) => {
    // Convert lat/lng to percentage positions (mock mapping)
    const baseX = 50;
    const baseY = 50;
    const x = baseX + (issue.location.lng + 74.01) * 500;
    const y = baseY + (40.72 - issue.location.lat) * 500;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issue Map</h1>
          <p className="text-gray-500">View all reported issues in your area</p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          {(['all', 'critical', 'active', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        {/* Mock Map Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px),
              linear-gradient(135deg, #f3f4f6 25%, #e5e7eb 25%, #e5e7eb 50%, #f3f4f6 50%, #f3f4f6 75%, #e5e7eb 75%)
            `,
            backgroundSize: '40px 40px, 40px 40px, 20px 20px',
          }}
        >
          {/* Street patterns */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-0 right-0 h-8 bg-gray-200" />
            <div className="absolute top-0 bottom-0 left-1/3 w-6 bg-gray-200" />
            <div className="absolute top-0 bottom-0 right-1/4 w-6 bg-gray-200" />
            <div className="absolute top-1/4 left-0 right-0 h-4 bg-gray-200" />
            <div className="absolute bottom-1/3 left-0 right-0 h-6 bg-gray-200" />
          </div>
          
          {/* Park area */}
          <div className="absolute top-[15%] left-[10%] w-32 h-24 bg-green-100 rounded-lg border-2 border-green-200" />
          
          {/* Buildings */}
          <div className="absolute top-[60%] right-[15%] w-20 h-16 bg-gray-300 rounded" />
          <div className="absolute top-[30%] left-[60%] w-16 h-20 bg-gray-300 rounded" />
        </div>

        {/* Map Markers */}
        {issues.map((issue) => {
          const pos = getMarkerPosition(issue);
          return (
            <button
              key={issue.id}
              onClick={() => setSelectedIssue(issue)}
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-full transition-all hover:scale-110 z-10",
                selectedIssue?.id === issue.id && "scale-125 z-20"
              )}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="relative">
                <MapPin 
                  className={cn(
                    "w-8 h-8 drop-shadow-md",
                    issue.priority === 'critical' ? "text-red-500" :
                    issue.priority === 'high' ? "text-orange-500" :
                    issue.priority === 'medium' ? "text-yellow-500" : "text-green-500"
                  )}
                  fill="currentColor"
                />
                <div className={cn(
                  "absolute top-1.5 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full",
                  getPriorityColor(issue.priority)
                )} />
              </div>
            </button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-100 p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Priority Legend</p>
          <div className="space-y-1">
            {[
              { label: 'Critical', color: 'bg-red-500' },
              { label: 'High', color: 'bg-orange-500' },
              { label: 'Medium', color: 'bg-yellow-500' },
              { label: 'Low', color: 'bg-green-500' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", color)} />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Issue count */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-100 px-4 py-2">
          <p className="text-sm font-medium text-gray-900">{issues.length} issues</p>
        </div>

        {/* Selected Issue Panel */}
        {selectedIssue && (
          <div className="absolute bottom-4 right-4 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[selectedIssue.status])}>
                    {statusLabels[selectedIssue.status]}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", priorityColors[selectedIssue.priority])}>
                    {selectedIssue.priority}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">{selectedIssue.title}</h3>
              
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{selectedIssue.location.address}</span>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{selectedIssue.description}</p>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    {selectedIssue.upvotes}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {categoryLabels[selectedIssue.category]}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/issue/${selectedIssue.id}`)}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View Details
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
