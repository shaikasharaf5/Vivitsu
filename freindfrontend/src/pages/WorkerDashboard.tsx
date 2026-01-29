import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IssueCard } from '../components/IssueCard';
import { getIssues, updateIssue, Issue, statusLabels } from '../utils/issuesData';
import { useAuth } from '../utils/AuthContext';
import { Briefcase, Clock, CheckCircle, Play, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

type TabType = 'assigned' | 'in_progress' | 'completed';

export function WorkerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('assigned');
  const [refreshKey, setRefreshKey] = useState(0);

  const issues = useMemo(() => {
    const all = getIssues().filter(i => i.assignedTo === user?.name);
    return {
      assigned: all.filter(i => i.status === 'assigned'),
      in_progress: all.filter(i => i.status === 'in_progress'),
      completed: all.filter(i => ['pending_inspection', 'resolved', 'closed'].includes(i.status)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name, refreshKey]);

  const handleStatusChange = (issue: Issue, newStatus: 'in_progress' | 'pending_inspection') => {
    updateIssue(issue.id, { status: newStatus });
    setRefreshKey(k => k + 1);
  };

  const tabs = [
    { key: 'assigned' as TabType, label: 'Assigned', count: issues.assigned.length, icon: AlertCircle },
    { key: 'in_progress' as TabType, label: 'In Progress', count: issues.in_progress.length, icon: Play },
    { key: 'completed' as TabType, label: 'Completed', count: issues.completed.length, icon: CheckCircle },
  ];

  const currentIssues = issues[activeTab];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Worker Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your assigned tasks and work orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{issues.assigned.length + issues.in_progress.length}</p>
              <p className="text-sm text-gray-500">Active Tasks</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{issues.in_progress.length}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{issues.completed.length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      {currentIssues.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks</h3>
          <p className="text-gray-500">
            {activeTab === 'assigned' && "You don't have any assigned tasks"}
            {activeTab === 'in_progress' && "No tasks in progress"}
            {activeTab === 'completed' && "No completed tasks yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentIssues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 p-4" onClick={() => navigate(`/issue/${issue.id}`)}>
                  <IssueCard issue={issue} compact />
                </div>
                <div className="lg:w-48 p-4 bg-gray-50 flex flex-col justify-center gap-2 border-t lg:border-t-0 lg:border-l border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-medium">Status</p>
                  <p className="font-medium text-gray-900">{statusLabels[issue.status]}</p>
                  
                  {activeTab === 'assigned' && (
                    <button
                      onClick={() => handleStatusChange(issue, 'in_progress')}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Start Work
                    </button>
                  )}
                  
                  {activeTab === 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange(issue, 'pending_inspection')}
                      className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
