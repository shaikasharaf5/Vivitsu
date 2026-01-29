import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'react-toastify';
import { DollarSign, Clock, LogOut } from 'lucide-react';

const ContractorDashboard = () => {
  const [bids, setBids] = useState([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const response = await axios.get('/api/bids/mine');
      setBids(response.data);
    } catch (error) {
      toast.error('Failed to fetch bids');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Contractor Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.name}</span>
            <button onClick={logout} className="text-gray-600 hover:text-red-600">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold">My Bids</h2>
          <p className="text-gray-600">{bids.length} total bids</p>
        </div>

        <div className="space-y-4">
          {bids.map((bid) => (
            <div key={bid._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(bid.status)}`}>
                    {bid.status}
                  </span>
                  <h3 className="text-xl font-semibold mt-2">{bid.issue?.title}</h3>
                  <p className="text-gray-600 mt-2">{bid.issue?.description}</p>
                  
                  <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>${bid.quotedAmount}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{bid.quotedHours} hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {bids.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No bids yet. Start bidding on available issues!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractorDashboard;
