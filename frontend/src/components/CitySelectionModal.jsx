import React, { useState, useEffect } from 'react';
import { MapPin, Building2, Users, X, Search, ChevronRight } from 'lucide-react';
import axios from '../utils/axios';
import { toast } from 'react-toastify';

const CitySelectionModal = ({ isOpen, onClose, onCitySelect, user }) => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCities();
    }
  }, [isOpen]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/cities/public');
      setCities(response.data.cities || []);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
      toast.error('Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = async (city) => {
    try {
      await onCitySelect(city._id, city.name);
      toast.success(`Selected ${city.name} as your city`);
      onClose();
    } catch (error) {
      console.error('Failed to select city:', error);
      toast.error('Failed to select city');
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Select Your City</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-blue-100 text-sm">
            Choose your city to view and report local civic issues
          </p>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cities by name or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Cities List */}
        <div className="p-4 overflow-y-auto max-h-[500px]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading cities...</p>
            </div>
          ) : filteredCities.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No cities found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCities.map((city) => (
                <button
                  key={city._id}
                  onClick={() => handleCitySelect(city)}
                  className="group bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-600 transition-colors">
                          <Building2 className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                          {city.name}
                        </h3>
                      </div>
                      
                      <div className="space-y-1 mb-3">
                        {city.state && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {city.state}, {city.country || 'India'}
                          </p>
                        )}
                        
                        {city.metadata?.contactEmail && (
                          <p className="text-xs text-gray-500">
                            {city.metadata.contactEmail}
                          </p>
                        )}
                      </div>

                      {city.status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          city.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {city.status}
                        </span>
                      )}
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span>{filteredCities.length} cities available</span>
            </div>
            <p className="text-gray-500">
              Can't find your city? Contact support
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitySelectionModal;
