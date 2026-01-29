import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIssues, categoryLabels, statusLabels, IssueCategory, IssueStatus } from '../utils/issuesData';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Activity
} from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const issues = getIssues();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const byCategory: Record<IssueCategory, number> = {
      pothole: 0,
      streetlight: 0,
      graffiti: 0,
      trash: 0,
      water_leak: 0,
      road_damage: 0,
      other: 0,
    };
    
    const byStatus: Record<IssueStatus, number> = {
      reported: 0,
      assigned: 0,
      in_progress: 0,
      pending_inspection: 0,
      resolved: 0,
      closed: 0,
    };
    
    issues.forEach(issue => {
      byCategory[issue.category]++;
      byStatus[issue.status]++;
    });
    
    const recentIssues = issues.filter(i => new Date(i.reportedAt) > weekAgo);
    const resolvedThisWeek = issues.filter(i => ['resolved', 'closed'].includes(i.status));
    const avgResolutionTime = 4.2; // Mock data
    
    return {
      total: issues.length,
      thisWeek: recentIssues.length,
      resolved: resolvedThisWeek.length,
      avgResolutionTime,
      byCategory,
      byStatus,
      criticalCount: issues.filter(i => i.priority === 'critical').length,
    };
  }, []);

  const categoryData = Object.entries(stats.byCategory)
    .map(([key, value]) => ({
      category: categoryLabels[key as IssueCategory],
      count: value,
    }))
    .sort((a, b) => b.count - a.count);

  const statusData = Object.entries(stats.byStatus)
    .map(([key, value]) => ({
      status: statusLabels[key as IssueStatus],
      count: value,
      key,
    }));

  const maxCategoryCount = Math.max(...categoryData.map(d => d.count));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">System overview and analytics</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Issues</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
              <p className="text-sm text-gray-500">This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgResolutionTime}d</p>
              <p className="text-sm text-gray-500">Avg Resolution</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.criticalCount}</p>
              <p className="text-sm text-gray-500">Critical Issues</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            Issues by Category
          </h2>
          <div className="space-y-3">
            {categoryData.map(({ category, count }) => (
              <div key={category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{category}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            Issues by Status
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {statusData.map(({ status, count, key }) => (
              <div key={key} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">{status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/map')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <MapPin className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">View Map</p>
              <p className="text-xs text-gray-500">See all issues on map</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Users className="w-6 h-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Manage Users</p>
              <p className="text-xs text-gray-500">Add or edit users</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Export Reports</p>
              <p className="text-xs text-gray-500">Download analytics</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <AlertTriangle className="w-6 h-6 text-red-600 mb-2" />
              <p className="font-medium text-gray-900">Critical Issues</p>
              <p className="text-xs text-gray-500">Review urgent items</p>
            </button>
          </div>
        </div>

        {/* Recent Issues */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {getIssues().slice(0, 5).map((issue) => (
              <div 
                key={issue.id}
                onClick={() => navigate(`/issue/${issue.id}`)}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {issue.status === 'resolved' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{issue.title}</p>
                  <p className="text-xs text-gray-500">{issue.location.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
