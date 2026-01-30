import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { 
  X, MapPin, Upload, AlertCircle, Camera, Navigation, Image as ImageIcon,
  FileText, AlertTriangle, CheckCircle, Loader
} from 'lucide-react';
import ImageDuplicateWarning from './ImageDuplicateWarning';
import { getCurrentLocation, reverseGeocode, autocompleteAddress } from '../utils/geocoding';

const ReportIssueModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ROADS',
    latitude: 12.9716,
    longitude: 77.5946,
    address: '',
    priority: 'MEDIUM'
  });
  const [photos, setPhotos] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [imageDuplicates, setImageDuplicates] = useState(null);
  const [imageQualityFlags, setImageQualityFlags] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showImageWarning, setShowImageWarning] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);

  const categories = ['ROADS', 'UTILITIES', 'PARKS', 'TRAFFIC', 'SANITATION', 'HEALTH', 'OTHER'];

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSuggestions && !e.target.closest('.address-autocomplete-container')) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSuggestions]);

  const handleLocationClick = async () => {
    setGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      
      // Get address from coordinates
      const addressData = await reverseGeocode(location.latitude, location.longitude);
      
      setFormData({
        ...formData,
        latitude: location.latitude,
        longitude: location.longitude,
        address: addressData.formattedAddress
      });
      
      toast.success('📍 Location captured successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to get location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleAddressSearch = async (searchQuery) => {
    setFormData({ ...formData, address: searchQuery });
    
    if (searchQuery.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingAddress(true);
    try {
      const suggestions = await autocompleteAddress(searchQuery);
      setAddressSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search error:', error);
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setFormData({
      ...formData,
      address: suggestion.displayName,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude
    });
    setShowSuggestions(false);
    setAddressSuggestions([]);
    toast.success('📍 Location set from address');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      photos.forEach(photo => data.append('photos', photo));

      const response = await axios.post('/api/issues', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Check for text duplicates (user approval needed)
      if (response.data.textDuplicates && response.data.textDuplicates.length > 0) {
        setDuplicates(response.data.textDuplicates);
        setLoading(false);
        return;
      }

      // Check for image duplicates or quality flags
      if (response.data.imageDuplicates || response.data.imageQualityFlags) {
        setImageDuplicates(response.data.imageDuplicates);
        setImageQualityFlags(response.data.imageQualityFlags);
        setShowImageWarning(true);
        setLoading(false);
        return;
      }

      // Check for text duplicates (user approval needed)
      if (response.data.textDuplicates && response.data.textDuplicates.length > 0) {
        setDuplicates(response.data.textDuplicates);
        setLoading(false);
        return;
      }

      // Success - issue created
      if (response.data.issue) {
        onSuccess(response.data.issue);
        setLoading(false);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.error || 'Failed to report issue');
      setLoading(false);
    }
  };

  const reportAnyway = async () => {
    setShowImageWarning(false);
    setLoading(true);
    
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('ignoreDuplicates', 'true');
    photos.forEach(photo => data.append('photos', photo));

    try {
      const response = await axios.post('/api/issues', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.issue) {
        toast.success('Issue reported successfully!');
        onSuccess(response.data.issue);
      }
    } catch (error) {
      console.error('Report anyway error:', error);
      toast.error(error.response?.data?.error || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      ROADS: '🛣️',
      UTILITIES: '⚡',
      PARKS: '🌳',
      TRAFFIC: '🚦',
      SANITATION: '🗑️',
      HEALTH: '🏥',
      OTHER: '📋'
    };
    return icons[category] || '📋';
  };

  // Image duplicate warning dialog
  if (showImageWarning) {
    return (
      <ImageDuplicateWarning
        imageDuplicates={imageDuplicates}
        imageQualityFlags={imageQualityFlags}
        onProceedAnyway={reportAnyway}
        onCancel={() => {
          setShowImageWarning(false);
          setImageDuplicates(null);
          setImageQualityFlags(null);
        }}
      />
    );
  }

  // Text duplicate warning dialog
  if (duplicates.length > 0) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Similar Issue Found</h2>
                <p className="text-amber-100 text-sm">This might be a duplicate report</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-gray-700 mb-4">
              We found a similar issue that might be the same problem. Consider upvoting the existing issue instead:
            </p>

            {duplicates.map((dup) => (
              <div key={dup.issue._id} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{dup.issue.title}</h3>
                  <span className="px-2 py-1 bg-amber-200 text-amber-900 rounded-full text-xs font-bold">
                    {dup.confidence}% Match
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{dup.issue.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    ❤️ {dup.issue.upvotes} upvotes
                  </span>
                  <span>•</span>
                  <span>{dup.issue.category}</span>
                  <span>•</span>
                  <span>{dup.issue.status?.replace('_', ' ')}</span>
                </div>
              </div>
            ))}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => window.location.href = `/issue/${duplicates[0].issue._id}`}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
              >
                View Existing Issue
              </button>
              <button
                onClick={reportAnyway}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                Report Anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main report form
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Report an Issue</h2>
              <p className="text-blue-100 text-sm">Help improve your community</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Category *
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({...formData, category: cat})}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    formData.category === cat
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{getCategoryIcon(cat)}</div>
                  <div className="text-xs font-semibold text-gray-700">{cat}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Issue Title *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., Large pothole on Main Street near intersection"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows="4"
              placeholder="Provide detailed information about the issue..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length} characters
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Priority Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(priority => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({...formData, priority})}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    formData.priority === priority
                      ? priority === 'CRITICAL' ? 'bg-red-600 text-white'
                        : priority === 'HIGH' ? 'bg-orange-600 text-white'
                        : priority === 'MEDIUM' ? 'bg-yellow-500 text-white'
                        : 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">Location *</label>
              <button
                type="button"
                onClick={handleLocationClick}
                disabled={gettingLocation}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {gettingLocation ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4" />
                    Use My Location
                  </>
                )}
              </button>
            </div>
            
            {/* Address Input with Autocomplete */}
            <div className="relative address-autocomplete-container">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleAddressSearch(e.target.value)}
                onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder="Search address or use my location"
              />
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                  {addressSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{suggestion.displayName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {suggestion.latitude.toFixed(4)}, {suggestion.longitude.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {searchingAddress && (
                <div className="absolute right-3 top-2">
                  <Loader className="h-4 w-4 text-blue-600 animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Lat: {formData.latitude.toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Lng: {formData.longitude.toFixed(4)}</span>
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Photos (up to 5)
            </label>
            <div className="grid grid-cols-5 gap-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="relative aspect-square">
                  {photos[index] ? (
                    <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-blue-500 group">
                      <img
                        src={URL.createObjectURL(photos[index])}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                        Photo {index + 1}
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setPhotos([...photos, e.target.files[0]]);
                          }
                        }}
                      />
                      <Camera className="h-6 w-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Add</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Images will be scanned for duplicates using AI-powered perceptual hashing
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Analyzing Images...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Report Issue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssueModal;
