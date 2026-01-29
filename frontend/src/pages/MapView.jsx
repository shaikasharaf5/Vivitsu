import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import axios from '../utils/axios';
import { useSocket } from '../utils/SocketContext';
import { ArrowLeft, Filter } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getPriorityColor = (priority) => {
  const colors = { LOW: 'blue', MEDIUM: 'yellow', HIGH: 'orange', CRITICAL: 'red' };
  return colors[priority] || 'blue';
};

const MapView = () => {
  const [issues, setIssues] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
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

  const filteredIssues = categoryFilter.length > 0
    ? issues.filter(issue => categoryFilter.includes(issue.category))
    : issues;

  // Helper to get correct image URL
  const getImageUrl = (photoUrl) => {
    if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'))) {
      return photoUrl;
    }
    return `${import.meta.env.VITE_API_URL}${photoUrl}`;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-700 hover:text-blue-600"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Feed
        </button>
        
        <h1 className="text-xl font-bold">Issue Map</h1>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b p-4">
          <h3 className="font-semibold mb-3">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-4 py-2 rounded-full text-sm ${
                  categoryFilter.includes(category)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Showing {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Map */}
      <div className="flex-1">
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
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg mb-2">{issue.title}</h3>
                  <div className="flex space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold bg-${getPriorityColor(issue.priority)}-100 text-${getPriorityColor(issue.priority)}-800`}>
                      {issue.priority}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {issue.category}
                    </span>
                  </div>
                  
                  {/* Show image preview if available */}
                  {issue.photos && issue.photos.length > 0 && (
                    <img
                      src={getImageUrl(issue.photos[0])}
                      alt="Issue preview"
                      className="w-full h-24 object-cover rounded mb-2"
                      onError={(e) => {
                        console.error('Image failed to load:', issue.photos[0]);
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {issue.description}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    👍 {issue.upvotes} upvotes
                  </p>
                  <button
                    onClick={() => navigate(`/issue/${issue._id}`)}
                    className="w-full bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;
