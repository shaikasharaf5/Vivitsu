import React, { useState } from 'react';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { X, MapPin, Upload, AlertCircle } from 'lucide-react';
import ImageDuplicateWarning from './ImageDuplicateWarning';

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

  const categories = ['ROADS', 'UTILITIES', 'PARKS', 'TRAFFIC', 'SANITATION', 'HEALTH', 'OTHER'];

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        toast.success('Location captured!');
      });
    }
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

      // Check for image duplicates or quality flags
      if (response.data.imageDuplicates || response.data.imageQualityFlags) {
        setImageDuplicates(response.data.imageDuplicates);
        setImageQualityFlags(response.data.imageQualityFlags);
        setShowImageWarning(true);
        setLoading(false);
        return;
      }

      // Check for text duplicates
      if (response.data.textDuplicates && response.data.textDuplicates.length > 0) {
        setDuplicates(response.data.textDuplicates);
        setLoading(false);
        return;
      }

      onSuccess(response.data.issue);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to report issue');
      setLoading(false);
    }
  };

  const reportAnyway = async () => {
    setShowImageWarning(false);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('ignoreDuplicates', 'true');
    photos.forEach(photo => data.append('photos', photo));

    try {
      const response = await axios.post('/api/issues', data);
      onSuccess(response.data.issue);
    } catch (error) {
      toast.error('Failed to report issue');
    }
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-yellow-600 mr-2" />
            <h2 className="text-xl font-bold">Similar Issue Found</h2>
          </div>
          
          <p className="text-gray-700 mb-4">
            We found a similar issue that might be the same problem:
          </p>

          {duplicates.map((dup) => (
            <div key={dup.issue._id} className="bg-gray-50 p-4 rounded mb-4">
              <h3 className="font-semibold">{dup.issue.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{dup.issue.description}</p>
              <p className="text-xs text-gray-500 mt-2">
                {dup.confidence}% match • {dup.issue.upvotes} upvotes
              </p>
            </div>
          ))}

          <div className="flex space-x-3">
            <button
              onClick={() => window.location.href = `/issue/${duplicates[0].issue._id}`}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              View Existing Issue
            </button>
            <button
              onClick={reportAnyway}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Report Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main report form
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Report an Issue</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Pothole on Main Street"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Describe the issue in detail..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Location *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address"
              />
              <button
                type="button"
                onClick={handleLocationClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Use My Location
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lat: {formData.latitude.toFixed(4)}, Lng: {formData.longitude.toFixed(4)}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Photos (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setPhotos(Array.from(e.target.files))}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Click to upload photos</p>
                <p className="text-xs text-gray-500 mt-1">
                  {photos.length > 0 ? `${photos.length} file(s) selected` : 'Images will be checked for duplicates'}
                </p>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ⚠️ Your images will be scanned for duplicates using perceptual hashing.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking Images...' : 'Report Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssueModal;
