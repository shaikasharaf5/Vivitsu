import { X, Upload, Loader, Camera, FileText, Plus, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import axios from '../utils/axios';
import { toast } from 'react-toastify';

const WorkUpdateModal = ({ isOpen, onClose, issue, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    updateType: 'IN_PROGRESS',
    description: '',
    progressPercentage: 0,
    hoursWorked: 0,
    materials: []
  });
  const [photos, setPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [materialInput, setMaterialInput] = useState({ name: '', quantity: '', unit: '' });

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoPreview(previews);
  };

  const addMaterial = () => {
    if (materialInput.name && materialInput.quantity) {
      setFormData({
        ...formData,
        materials: [...formData.materials, materialInput]
      });
      setMaterialInput({ name: '', quantity: '', unit: '' });
    }
  };

  const removeMaterial = (index) => {
    setFormData({
      ...formData,
      materials: formData.materials.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description) {
      toast.error('Please provide a description');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('issueId', issue._id);
      data.append('updateType', formData.updateType);
      data.append('description', formData.description);
      data.append('progressPercentage', formData.progressPercentage);
      data.append('hoursWorked', formData.hoursWorked);
      data.append('materialsUsed', JSON.stringify(formData.materials));

      photos.forEach(photo => {
        data.append('photos', photo);
      });

      const response = await axios.post('/api/work-updates', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Work update submitted successfully!');
      if (onSuccess) onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Work update error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit update');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Submit Work Update</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Issue Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-1">{issue?.title}</h3>
            <p className="text-sm text-blue-700">{issue?.category}</p>
          </div>

          {/* Update Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Type
            </label>
            <select
              value={formData.updateType}
              onChange={(e) => setFormData({ ...formData, updateType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="STARTED">Work Started</option>
              <option value="IN_PROGRESS">Work in Progress</option>
              <option value="COMPLETED">Work Completed</option>
              <option value="BLOCKED">Blocked/Issue</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the work done, materials used, any issues faced..."
            />
          </div>

          {/* Progress & Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progressPercentage}
                onChange={(e) => setFormData({ ...formData, progressPercentage: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours Worked
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.hoursWorked}
                onChange={(e) => setFormData({ ...formData, hoursWorked: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Materials Used */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Materials Used
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Material name"
                value={materialInput.name}
                onChange={(e) => setMaterialInput({ ...materialInput, name: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Qty"
                value={materialInput.quantity}
                onChange={(e) => setMaterialInput({ ...materialInput, quantity: e.target.value })}
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Unit"
                value={materialInput.unit}
                onChange={(e) => setMaterialInput({ ...materialInput, unit: e.target.value })}
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={addMaterial}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {formData.materials.length > 0 && (
              <div className="space-y-2">
                {formData.materials.map((material, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                    <span className="text-sm">
                      {material.name} - {material.quantity} {material.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMaterial(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Camera className="inline h-4 w-4 mr-1" />
              Work Photos (up to 5)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
              id="work-photos"
            />
            <label
              htmlFor="work-photos"
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600">Upload Photos</span>
            </label>
            {photoPreview.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {photoPreview.map((preview, index) => (
                  <img
                    key={index}
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
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
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Submit Update
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkUpdateModal;
