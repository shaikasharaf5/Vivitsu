import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import axios from '../utils/axios';
import { useSocket } from '../utils/SocketContext';
import { ArrowLeft, Filter, Search, MapPin, X, Navigation2, Layers } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

const getPriorityColor = (priority) => {
  const colors = { LOW: '#3B82F6', MEDIUM: '#EAB308', HIGH: '#F97316', CRITICAL: '#EF4444' };
  return colors[priority] || '#3B82F6';
};

const getStatusColor = (status) => {
  const colors = {
    REPORTED: 'bg-gray-500',
    ASSIGNED: 'bg-blue-500',
    IN_PROGRESS: 'bg-yellow-500',
    COMPLETED: 'bg-purple-500',
    RESOLVED: 'bg-green-500'
  };
  return colors[status] || 'bg-gray-500';
};

const MapView = () => {
  const [issues, setIssues] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const socket = useSocket();
  const navigate = useNavigate();

  const categories = ['ROADS', 'UTILITIES', 'PARKS', 'TRAFFIC', 'SANITATION', 'HEALTH', 'OTHER'];

  useEffect(() => {
    fetchIssues();
  }, [categoryFilter]);

  useEffect(() => {
    if (socket) {
      socket.on('issueCreated', (data) => {
        setIssues((prev) => [...prev, data.issue]);
      });
    }
  }, [socket]);

  const fetchIssues = async () => {
    try {
      const params = {};
      if (categoryFilter.length > 0) {
        params.category = categoryFilter.join(',');
      }
      const response = await axios.get('/api/issues', { params });
      setIssues(response.data);
    } catch (error) {
      console.error('Failed to fetch issues');
    }
  };

  const toggleCategory = (category) => {
    setCategoryFilter((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const filteredIssues = issues.filter(issue => {
    const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(issue.category);
    const matchesSearch = !searchQuery || 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getImageUrl = (photoUrl) => {
    if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'))) {
      return photoUrl;
    }
    return `${import.meta.env.VITE_API_URL}${photoUrl}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-white hover:text-blue-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="font-semibold">Back to Feed</span>
            </button>
            
            <h1 className="text-2xl font-bold text-white flex items-center">
              <MapPin className="h-6 w-6 mr-2" />
              Issue Map Explorer
            </h1>
            
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all"
            >
              <Layers className="h-4 w-4 mr-2" />
              Legend
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-blue-200" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search issues by title or description..."
              className="w-full pl-12 pr-4 py-3 bg-white/95 backdrop-blur-sm rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all"
          >
            <Filter className="h-4 w-4 mr-2" />
            <span className="font-semibold">
              Category Filters {categoryFilter.length > 0 && `(${categoryFilter.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-lg">Filter by Category</h3>
              {categoryFilter.length > 0 && (
                <button
                  onClick={() => setCategoryFilter([])}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                    categoryFilter.includes(category)
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-3xl mb-2">{getCategoryIcon(category)}</span>
                  <span className="text-xs font-semibold text-gray-700">{category}</span>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-4 font-medium">
              Showing {filteredIssues.length} of {issues.length} issues
            </p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          {filteredIssues.map((issue) => (
            <Marker
              key={issue._id}
              position={[issue.latitude, issue.longitude]}
              eventHandlers={{
                click: () => setSelectedIssue(issue)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[250px]">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg pr-2">{issue.title}</h3>
                    <span className="text-2xl">{getCategoryIcon(issue.category)}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: getPriorityColor(issue.priority) }}
                    >
                      {issue.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(issue.status)}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {issue.photos && issue.photos.length > 0 && (
                    <img
                      src={getImageUrl(issue.photos[0])}
                      alt="Issue preview"
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {issue.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>👍 {issue.upvotes} upvotes</span>
                    <span>💬 {issue.comments?.length || 0} comments</span>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/issue/${issue._id}`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                  >
                    View Full Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Legend */}
        {showLegend && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 max-w-xs z-[1000]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Map Legend</h3>
              <button
                onClick={() => setShowLegend(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-2">Status</h4>
                <div className="space-y-1">
                  {[
                    { status: 'REPORTED', label: 'Reported', color: 'bg-gray-500' },
                    { status: 'ASSIGNED', label: 'Assigned', color: 'bg-blue-500' },
                    { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-500' },
                    { status: 'COMPLETED', label: 'Completed', color: 'bg-purple-500' },
                    { status: 'RESOLVED', label: 'Resolved', color: 'bg-green-500' }
                  ].map(({ status, label, color }) => (
                    <div key={status} className="flex items-center text-sm">
                      <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
                      <span className="text-gray-700">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="text-xs font-semibold text-gray-600 mb-2">Priority</h4>
                <div className="space-y-1">
                  {[
                    { priority: 'LOW', color: '#3B82F6' },
                    { priority: 'MEDIUM', color: '#EAB308' },
                    { priority: 'HIGH', color: '#F97316' },
                    { priority: 'CRITICAL', color: '#EF4444' }
                  ].map(({ priority, color }) => (
                    <div key={priority} className="flex items-center text-sm">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-gray-700">{priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Issue Count Badge */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2 z-[1000]">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-gray-900">{filteredIssues.length}</span>
            <span className="text-gray-600">issues on map</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
