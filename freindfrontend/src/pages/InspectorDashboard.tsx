import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IssueCard } from '../components/IssueCard';
import { getIssues, updateIssue, Issue } from '../utils/issuesData';
import { Search, CheckCircle, XCircle, Clock, ClipboardCheck } from 'lucide-react';

export function InspectorDashboard() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const pendingIssues = useMemo(() => {
    let issues = getIssues().filter(i => i.status === 'pending_inspection');
    
    if (searchQuery) {
      issues = issues.filter(i => 
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.location.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return issues;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, searchQuery]);

  const recentlyInspected = useMemo(() => {
    return getIssues().filter(i => ['resolved', 'closed'].includes(i.status)).slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleApprove = (issue: Issue) => {
    updateIssue(issue.id, { status: 'resolved' });
    setRefreshKey(k => k + 1);
  };

  const handleReject = (issue: Issue) => {
    updateIssue(issue.id, { status: 'in_progress' });
    setRefreshKey(k => k + 1);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inspector Dashboard</h1>
        <p className="text-gray-500 mt-1">Verify completed work and approve resolutions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingIssues.length}</p>
              <p className="text-sm text-gray-500">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{recentlyInspected.length}</p>
              <p className="text-sm text-gray-500">Recently Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">98%</p>
              <p className="text-sm text-gray-500">Approval Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search pending inspections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Pending Inspections */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Inspections</h2>
      
      {pendingIssues.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-500">No pending inspections at this time</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {pendingIssues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 cursor-pointer" onClick={() => navigate(`/issue/${issue.id}`)}>
                  <div className="p-4">
                    <IssueCard issue={issue} compact />
                  </div>
                </div>
                <div className="lg:w-64 p-4 bg-gray-50 flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-gray-100">
                  <p className="text-sm text-gray-600 text-center">Verify completion quality</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(issue)}
                      className="flex-1 px-4 py-2.5 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(issue)}
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recently Inspected */}
      {recentlyInspected.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recently Inspected</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentlyInspected.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onClick={() => navigate(`/issue/${issue.id}`)}
                compact
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
