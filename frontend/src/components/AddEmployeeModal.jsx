import { useState, useEffect } from 'react';
import { X, MapPin, Loader, User, Phone, Briefcase, Target, Copy, CheckCircle2 } from 'lucide-react';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { forwardGeocode } from '../utils/geocoding';

const AddEmployeeModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState({});
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: 'WORKER',
    address: '',
    latitude: null,
    longitude: null,
    radiusKm: 5,
    maxCapacity: 10
  });

  const handleAddressSearch = async () => {
    if (formData.address.length < 3) {
      toast.error('Please enter a valid address');
      return;
    }

    setSearching(true);
    try {
      const results = await forwardGeocode(formData.address);
      if (results && results.length > 0) {
        setFormData({
          ...formData,
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          address: results[0].formattedAddress
        });
        toast.success('Location found!');
      } else {
        toast.error('Location not found');
      }
    } catch (error) {
      toast.error('Failed to find location');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.latitude || !formData.longitude) {
      toast.error('Please search and select a work location');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/employees', {
        ...formData,
        workLocation: {
          latitude: formData.latitude,
          longitude: formData.longitude,
          address: formData.address
        }
      });

      setCredentials(response.data.credentials);
      toast.success(response.data.message);
      
      if (onSuccess) {
        onSuccess(response.data.employee);
      }
    } catch (error) {
      console.error('Add employee error:', error);
      toast.error(error.response?.data?.error || 'Failed to add employee');
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [field]: true });
    toast.success(`${field} copied!`);
    setTimeout(() => setCopied({ ...copied, [field]: false }), 2000);
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      role: 'WORKER',
      address: '',
      latitude: null,
      longitude: null,
      radiusKm: 5,
      maxCapacity: 10
    });
    setCredentials(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add New Employee</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        {credentials ? (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Employee Added Successfully!</h3>
              <p className="text-gray-600">Save these credentials - they will not be shown again</p>
            </div>

            <div className="space-y-4 bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Employee ID</p>
                  <p className="font-mono font-semibold text-lg">{credentials.employeeId}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(credentials.employeeId, 'Employee ID')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  {copied['Employee ID'] ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-gray-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-mono font-semibold">{credentials.email}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(credentials.email, 'Email')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  {copied['Email'] ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-gray-400" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200 bg-orange-50">
                <div>
                  <p className="text-sm text-orange-700 mb-1">Password (One-time view)</p>
                  <p className="font-mono font-bold text-lg text-orange-900">{credentials.password}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(credentials.password, 'Password')}
                  className="p-2 hover:bg-orange-100 rounded-lg"
                >
                  {copied['Password'] ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-orange-600" />}
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91 1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="inline h-4 w-4 mr-1" />
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="WORKER">Worker</option>
                <option value="INSPECTOR">Inspector</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Work Location Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter work area address"
                />
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  disabled={searching}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {searching ? <Loader className="h-5 w-5 animate-spin" /> : 'Find'}
                </button>
              </div>
              {formData.latitude && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ Location set: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </p>
              )}
            </div>

            {formData.role === 'WORKER' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="inline h-4 w-4 mr-1" />
                    Service Radius (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.radiusKm}
                    onChange={(e) => setFormData({ ...formData, radiusKm: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Capacity (issues)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Employee'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddEmployeeModal;
