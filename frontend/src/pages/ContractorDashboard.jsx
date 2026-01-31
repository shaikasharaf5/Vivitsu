import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'react-toastify';
import { 
  DollarSign, Clock, LogOut, MapPin, ChevronDown, CheckCircle, 
  Briefcase, Filter, FileText, Package, Calendar, AlertCircle,
  TrendingUp, XCircle, Plus, X
} from 'lucide-react';

const ContractorDashboard = () => {
  const [bids, setBids] = useState([]);
  const [openIssues, setOpenIssues] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('open');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [bidForm, setBidForm] = useState({
    bidAmount: '',
    estimatedDays: '',
    proposal: '',
    methodology: '',
    materials: []
  });
  const [materialInput, setMaterialInput] = useState({ name: '', quantity: '', cost: '' });
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (user?.assignedCity && cities.length > 0 && !selectedCity) {
      const savedCityId = localStorage.getItem('selectedCityId');
      
      if (savedCityId) {
        const savedCity = cities.find(city => city._id === savedCityId);
        if (savedCity) {
          setSelectedCity(savedCity);
          return;
        }
      }
      
      const userCity = cities.find(city => city._id === user.assignedCity._id || city._id === user.assignedCity);
      if (userCity) {
        setSelectedCity(userCity);
        localStorage.setItem('selectedCityId', userCity._id);
      }
    }
  }, [user, cities, selectedCity]);

  useEffect(() => {
    if (selectedCity) {
      localStorage.setItem('selectedCityId', selectedCity._id);
      fetchBids();
      fetchOpenIssues();
    }
  }, [selectedCity]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCityDropdown && !e.target.closest('.city-dropdown-container')) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showCityDropdown]);

  const fetchCities = async () => {
    try {
      const response = await axios.get('/api/admin/cities/public');
      setCities(response.data);
    } catch (error) {
      console.error('Failed to fetch cities');
    }
  };

  const fetchBids = async () => {
    try {
      if (!selectedCity) return;
      const response = await axios.get('/api/bids/my-bids', {
        params: { city: selectedCity._id }
      });
      setBids(response.data);
    } catch (error) {
      toast.error('Failed to fetch bids');
    }
  };

  const fetchOpenIssues = async () => {
    try {
      if (!selectedCity) return;
      const response = await axios.get('/api/issues', {
        params: { 
          city: selectedCity._id,
          status: 'OPEN_FOR_BIDDING'
        }
      });
      setOpenIssues(response.data);
    } catch (error) {
      console.error('Failed to fetch open issues');
    }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    
    if (!bidForm.bidAmount || !bidForm.estimatedDays || !bidForm.proposal) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post('/api/bids', {
        issue: selectedIssue._id,
        bidAmount: parseFloat(bidForm.bidAmount),
        estimatedDays: parseInt(bidForm.estimatedDays),
        proposal: bidForm.proposal,
        methodology: bidForm.methodology || undefined,
        materials: bidForm.materials.length > 0 ? bidForm.materials : undefined,
        isPublic: true
      });
      
      toast.success('Bid submitted successfully!');
      setSelectedIssue(null);
      setBidForm({
        bidAmount: '',
        estimatedDays: '',
        proposal: '',
        methodology: '',
        materials: []
      });
      fetchBids();
      fetchOpenIssues();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit bid');
    }
  };

  const addMaterial = () => {
    if (!materialInput.name || !materialInput.quantity || !materialInput.cost) {
      toast.error('Please fill all material fields');
      return;
    }
    
    setBidForm({
      ...bidForm,
      materials: [
        ...bidForm.materials,
        {
          name: materialInput.name,
          quantity: materialInput.quantity,
          cost: parseFloat(materialInput.cost)
        }
      ]
    });
    setMaterialInput({ name: '', quantity: '', cost: '' });
  };

  const removeMaterial = (index) => {
    setBidForm({
      ...bidForm,
      materials: bidForm.materials.filter((_, i) => i !== index)
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleLogout = () => {
    localStorage.removeItem('selectedCityId');
    logout();
  };

  const filteredBids = bids.filter(bid => {
    if (activeTab === 'mybids') return bid.status === 'PENDING';
    if (activeTab === 'awarded') return bid.status === 'APPROVED';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Briefcase className="h-8 w-8 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900">Contractor Portal</h1>
            
            {/* City Selector */}
            <div className="relative city-dropdown-container">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
              >
                <MapPin className="h-4 w-4" />
                <span className="font-medium">{selectedCity?.name || 'Select City'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCityDropdown && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 max-h-80 overflow-y-auto z-50">
                  {cities.map((city) => (
                    <button
                      key={city._id}
                      onClick={() => {
                        setSelectedCity(city);
                        setShowCityDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors ${
                        selectedCity?._id === city._id ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {selectedCity?._id === city._id && <CheckCircle className="h-4 w-4" />}
                        <div>
                          <div className="font-medium">{city.name}</div>
                          <div className="text-xs text-gray-500">{city.state}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="font-semibold text-gray-900">{user?.companyName || user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'open'
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="h-5 w-5" />
              Open Issues ({openIssues.length})
            </button>
            <button
              onClick={() => setActiveTab('mybids')}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'mybids'
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="h-5 w-5" />
              My Bids ({bids.filter(b => b.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setActiveTab('awarded')}
              className={`px-6 py-4 font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'awarded'
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              Awarded ({bids.filter(b => b.status === 'APPROVED').length})
            </button>
          </div>
        </div>

        {/* Open Issues Tab */}
        {activeTab === 'open' && (
          <div className="space-y-4">
            {openIssues.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No issues currently open for bidding</p>
                <p className="text-gray-500 text-sm mt-2">Check back later for new opportunities</p>
              </div>
            ) : (
              openIssues.map((issue) => (
                <div key={issue._id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                          OPEN FOR BIDDING
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          {issue.category}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{issue.title}</h3>
                      <p className="text-gray-600 mb-4">{issue.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{issue.location?.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Posted {new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedIssue(issue)}
                      className="ml-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                    >
                      Submit Bid
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* My Bids & Awarded Tabs */}
        {(activeTab === 'mybids' || activeTab === 'awarded') && (
          <div className="space-y-4">
            {filteredBids.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  {activeTab === 'mybids' ? 'No pending bids' : 'No awarded contracts yet'}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {activeTab === 'mybids' 
                    ? 'Submit bids on open issues to see them here'
                    : 'Your awarded contracts will appear here'
                  }
                </p>
              </div>
            ) : (
              filteredBids.map((bid) => (
                <div key={bid._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(bid.status)}`}>
                        {bid.status}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 mt-2">{bid.issue?.title}</h3>
                      <p className="text-gray-600 mt-1">{bid.issue?.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">₹{bid.bidAmount.toLocaleString()}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {bid.estimatedDays} days
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Proposal
                    </h4>
                    <p className="text-gray-700 text-sm">{bid.proposal}</p>
                    
                    {bid.methodology && (
                      <>
                        <h4 className="font-semibold text-gray-900 mt-4 mb-2">Methodology</h4>
                        <p className="text-gray-700 text-sm">{bid.methodology}</p>
                      </>
                    )}
                    
                    {bid.materials?.length > 0 && (
                      <>
                        <h4 className="font-semibold text-gray-900 mt-4 mb-2 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Materials
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {bid.materials.map((material, idx) => (
                            <div key={idx} className="bg-gray-50 rounded p-2 text-sm">
                              <p className="font-medium">{material.name}</p>
                              <p className="text-gray-600">{material.quantity} - ₹{material.cost}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {bid.reviewNotes && (
                      <div className={`mt-4 p-3 rounded-lg ${
                        bid.status === 'APPROVED' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                      }`}>
                        <p className="font-semibold mb-1">Admin Review:</p>
                        <p className="text-sm">{bid.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bid Submission Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Submit Bid</h2>
                <p className="text-orange-100 text-sm mt-1">{selectedIssue.title}</p>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bid Amount (₹) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      value={bidForm.bidAmount}
                      onChange={(e) => setBidForm({...bidForm, bidAmount: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Days *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      value={bidForm.estimatedDays}
                      onChange={(e) => setBidForm({...bidForm, estimatedDays: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter days"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Proposal *
                </label>
                <textarea
                  required
                  value={bidForm.proposal}
                  onChange={(e) => setBidForm({...bidForm, proposal: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="4"
                  placeholder="Explain why you're the best choice for this project..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Methodology (Optional)
                </label>
                <textarea
                  value={bidForm.methodology}
                  onChange={(e) => setBidForm({...bidForm, methodology: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  placeholder="Describe your approach and methodology..."
                />
              </div>

              {/* Materials Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Materials (Optional)
                </label>
                
                {bidForm.materials.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {bidForm.materials.map((material, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-purple-50 p-3 rounded-lg">
                        <Package className="h-4 w-4 text-purple-600" />
                        <span className="flex-1 text-sm">
                          <strong>{material.name}</strong> - {material.quantity} - ₹{material.cost}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMaterial(idx)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={materialInput.name}
                    onChange={(e) => setMaterialInput({...materialInput, name: e.target.value})}
                    className="col-span-2 px-3 py-2 border rounded-lg text-sm"
                    placeholder="Material name"
                  />
                  <input
                    type="text"
                    value={materialInput.quantity}
                    onChange={(e) => setMaterialInput({...materialInput, quantity: e.target.value})}
                    className="px-3 py-2 border rounded-lg text-sm"
                    placeholder="Quantity"
                  />
                  <input
                    type="number"
                    value={materialInput.cost}
                    onChange={(e) => setMaterialInput({...materialInput, cost: e.target.value})}
                    className="px-3 py-2 border rounded-lg text-sm"
                    placeholder="Cost"
                  />
                </div>
                <button
                  type="button"
                  onClick={addMaterial}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Material
                </button>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors"
                >
                  Submit Bid
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorDashboard;
