import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IssueCard } from '../components/IssueCard';
import { getIssues } from '../utils/issuesData';
import { DollarSign, FileText, Trophy, Clock, Send } from 'lucide-react';
import { cn } from '../utils/cn';

interface Bid {
  id: string;
  issueId: string;
  amount: number;
  duration: string;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: Date;
}

export function ContractorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'opportunities' | 'bids' | 'won'>('opportunities');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidDuration, setBidDuration] = useState('7');
  const [bids, setBids] = useState<Bid[]>([
    { id: '1', issueId: '4', amount: 5000, duration: '5 days', status: 'pending', submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: '2', issueId: '1', amount: 3500, duration: '3 days', status: 'accepted', submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  ]);

  const availableIssues = useMemo(() => {
    return getIssues().filter(i => ['reported', 'assigned'].includes(i.status) && i.priority !== 'low');
  }, []);

  const stats = {
    opportunities: availableIssues.length,
    pendingBids: bids.filter(b => b.status === 'pending').length,
    wonBids: bids.filter(b => b.status === 'accepted').length,
    totalValue: bids.filter(b => b.status === 'accepted').reduce((sum, b) => sum + b.amount, 0),
  };

  const handleSubmitBid = (issueId: string) => {
    const newBid: Bid = {
      id: Date.now().toString(),
      issueId,
      amount: parseFloat(bidAmount),
      duration: `${bidDuration} days`,
      status: 'pending',
      submittedAt: new Date(),
    };
    setBids([newBid, ...bids]);
    setSelectedIssue(null);
    setBidAmount('');
    setBidDuration('7');
  };

  const tabs = [
    { key: 'opportunities' as const, label: 'Opportunities', count: stats.opportunities },
    { key: 'bids' as const, label: 'My Bids', count: bids.length },
    { key: 'won' as const, label: 'Won Contracts', count: stats.wonBids },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contractor Dashboard</h1>
        <p className="text-gray-500 mt-1">Browse opportunities and manage your proposals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.opportunities}</p>
              <p className="text-sm text-gray-500">Open Jobs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingBids}</p>
              <p className="text-sm text-gray-500">Pending Bids</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.wonBids}</p>
              <p className="text-sm text-gray-500">Won Contracts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Value</p>
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
            {tab.label}
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          {availableIssues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 cursor-pointer" onClick={() => navigate(`/issue/${issue.id}`)}>
                  <div className="p-4">
                    <IssueCard issue={issue} compact />
                  </div>
                </div>
                <div className="lg:w-72 p-4 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-100">
                  {selectedIssue === issue.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Bid Amount ($)</label>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Duration (days)</label>
                        <select
                          value={bidDuration}
                          onChange={(e) => setBidDuration(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                          <option value="3">3 days</option>
                          <option value="5">5 days</option>
                          <option value="7">7 days</option>
                          <option value="14">14 days</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedIssue(null)}
                          className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSubmitBid(issue.id)}
                          disabled={!bidAmount}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedIssue(issue.id)}
                      className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Submit Proposal
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'bids' && (
        <div className="space-y-4">
          {bids.map((bid) => {
            const issue = getIssues().find(i => i.id === bid.issueId);
            if (!issue) return null;
            return (
              <div key={bid.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{issue.title}</h3>
                    <p className="text-sm text-gray-500">{issue.location.address}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">${bid.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{bid.duration}</p>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      bid.status === 'pending' && "bg-yellow-100 text-yellow-800",
                      bid.status === 'accepted' && "bg-green-100 text-green-800",
                      bid.status === 'rejected' && "bg-red-100 text-red-800"
                    )}>
                      {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'won' && (
        <div className="space-y-4">
          {bids.filter(b => b.status === 'accepted').map((bid) => {
            const issue = getIssues().find(i => i.id === bid.issueId);
            if (!issue) return null;
            return (
              <div key={bid.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <IssueCard issue={issue} onClick={() => navigate(`/issue/${issue.id}`)} />
                </div>
                <div className="px-4 py-3 bg-green-50 border-t border-green-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-700">
                    <Trophy className="w-4 h-4" />
                    <span className="font-medium">Contract Won</span>
                  </div>
                  <span className="text-lg font-bold text-green-700">${bid.amount.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
