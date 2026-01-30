import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'react-toastify';
import { DollarSign, Clock, LogOut, MapPin, ChevronDown, CheckCircle } from 'lucide-react';

const ContractorDashboard = () => {
  const [bids, setBids] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
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
    }
  }, [selectedCity]);

  useEffect(() => {
    if (selectedCity) {
      fetchBids();
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
      const response = await axios.get('/api/bids/mine', {
        params: { city: selectedCity._id }
      });
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

  const handleLogout = () => {
    localStorage.removeItem('selectedCityId');
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Contractor Dashboard</h1>
            
            {/* City Selector Dropdown */}
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
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.name}</span>
            <button onClick={handleLogout} className="text-gray-600 hover:text-red-600">
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
