import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { MapPin, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different statuses
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

const statusIcons = {
  REPORTED: createCustomIcon('#6B7280'),
  CATEGORIZED: createCustomIcon('#3B82F6'),
  ASSIGNED: createCustomIcon('#8B5CF6'),
  IN_PROGRESS: createCustomIcon('#F59E0B'),
  COMPLETED: createCustomIcon('#10B981'),
  RESOLVED: createCustomIcon('#059669'),
  OPEN_FOR_BIDDING: createCustomIcon('#F97316'),
  REJECTED: createCustomIcon('#EF4444')
};

const IssueMapView = ({ isOpen, onClose, cityId }) => {
  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center
  const [showWorkers, setShowWorkers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchIssues();
      fetchWorkers();
    }
  }, [isOpen, cityId]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (cityId) {
        params.city = cityId;
      }
      
      const response = await axios.get('/api/issues', { params });
      const issuesData = response.data;
      setIssues(issuesData);

      // Set map center to first issue or keep default
      if (issuesData.length > 0 && issuesData[0].location) {
        setMapCenter([issuesData[0].location.latitude, issuesData[0].location.longitude]);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const params = { role: 'WORKER' };
      if (cityId) {
        params.city = cityId;
      }
      
      const response = await axios.get('/api/employees', { params });
      setWorkers(response.data);
    } catch (error) {
      console.error('Failed to load workers:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      REPORTED: '#6B7280',
      CATEGORIZED: '#3B82F6',
      ASSIGNED: '#8B5CF6',
      IN_PROGRESS: '#F59E0B',
      COMPLETED: '#10B981',
      RESOLVED: '#059669',
      OPEN_FOR_BIDDING: '#F97316',
      REJECTED: '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      REPORTED: AlertCircle,
      CATEGORIZED: AlertCircle,
      ASSIGNED: Clock,
      IN_PROGRESS: Clock,
      COMPLETED: CheckCircle,
      RESOLVED: CheckCircle,
      OPEN_FOR_BIDDING: MapPin,
      REJECTED: X
    };
    return icons[status] || AlertCircle;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <MapPin className="h-7 w-7 mr-3" />
              Issue Map View
            </h2>
            <p className="text-blue-100 text-sm mt-1">{issues.length} issue(s) on map</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowWorkers(!showWorkers)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                showWorkers
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {showWorkers ? 'Hide' : 'Show'} Workers
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading map...</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              className="rounded-b-2xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Issue Markers */}
              {issues.map((issue) => {
                if (!issue.location) return null;
                
                const StatusIcon = getStatusIcon(issue.status);
                
                return (
                  <Marker
                    key={issue._id}
                    position={[issue.location.latitude, issue.location.longitude]}
                    icon={statusIcons[issue.status] || statusIcons.REPORTED}
                  >
                    <Popup className="custom-popup" maxWidth={300}>
                      <div className="p-2">
                        <div className="flex items-center mb-2">
                          <StatusIcon className="h-5 w-5 mr-2" style={{ color: getStatusColor(issue.status) }} />
                          <span
                            className="px-2 py-1 rounded text-xs font-bold text-white"
                            style={{ backgroundColor: getStatusColor(issue.status) }}
                          >
                            {issue.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">{issue.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                        <p className="text-xs text-gray-500">{issue.category}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Reported: {new Date(issue.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-semibold text-blue-600 mt-1">
                          📍 {issue.location?.address || 'Location not specified'}
                        </p>
                        {issue.upvotes > 0 && (
                          <p className="text-xs text-green-600 font-semibold mt-1">
                            👍 {issue.upvotes} upvotes
                          </p>
                        )}
                        {issue.assignedWorker && (
                          <p className="text-xs text-blue-600 font-semibold mt-1">
                            Assigned to worker
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Worker Service Areas */}
              {showWorkers && workers.map((worker) => {
                if (!worker.workLocation) return null;
                
                return (
                  <React.Fragment key={worker._id}>
                    {/* Service Radius Circle */}
                    <Circle
                      center={[worker.workLocation.latitude, worker.workLocation.longitude]}
                      radius={worker.workLocation.radiusKm * 1000} // Convert km to meters
                      pathOptions={{
                        color: worker.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                        fillColor: worker.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                        fillOpacity: 0.1,
                        weight: 2,
                        dashArray: '5, 5'
                      }}
                    />
                    
                    {/* Worker Marker */}
                    <Marker
                      position={[worker.workLocation.latitude, worker.workLocation.longitude]}
                      icon={createCustomIcon(worker.status === 'ACTIVE' ? '#10B981' : '#EF4444')}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-gray-900 mb-1">
                            {worker.firstName} {worker.lastName}
                          </h3>
                          <p className="text-xs text-gray-600 mb-1">Worker • {worker.employeeId}</p>
                          {worker.workArea && (
                            <p className="text-xs text-blue-600 font-semibold mb-1">
                              📍 Area: {worker.workArea}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Status: <span className={`font-semibold ${
                              worker.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                            }`}>{worker.status}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Capacity: {worker.currentLoad}/{worker.maxCapacity}
                          </p>
                          {worker.workLocation?.radiusKm && (
                            <p className="text-xs text-gray-500">
                              Service Radius: {worker.workLocation.radiusKm} km
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Legend */}
        <div className="bg-gray-50 p-4 rounded-b-2xl border-t">
          <div className="flex flex-wrap gap-4 justify-center">
            {Object.entries({
              REPORTED: 'Reported',
              CATEGORIZED: 'Categorized',
              ASSIGNED: 'Assigned',
              IN_PROGRESS: 'In Progress',
              COMPLETED: 'Completed',
              RESOLVED: 'Resolved',
              OPEN_FOR_BIDDING: 'Open for Bidding'
            }).map(([status, label]) => (
              <div key={status} className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: getStatusColor(status) }}
                />
                <span className="text-xs font-medium text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueMapView;
