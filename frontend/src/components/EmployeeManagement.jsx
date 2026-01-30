import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'react-toastify';
import { 
  Plus, Users, Eye, EyeOff, X, CheckCircle, Copy, 
  UserCog, Shield, Briefcase, Search, Filter
} from 'lucide-react';

const EmployeeManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    role: 'WORKER',
    phone: '',
    email: ''
  });
  const [createdCredentials, setCreatedCredentials] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, [filter]);

  const fetchEmployees = async () => {
    try {
      const params = filter !== 'ALL' ? { role: filter } : {};
      const response = await axios.get('/api/admin/employees', { params });
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to fetch employees');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/admin/employees', newEmployee);
      toast.success(`${newEmployee.role.toLowerCase()} created successfully`);
      
      // Show credentials modal
      setCreatedCredentials(response.data.employee);
      setShowAddEmployee(false);
      setNewEmployee({ firstName: '', lastName: '', role: 'WORKER', phone: '', email: '' });
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create employee');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchQuery || 
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-7 w-7 mr-3 text-blue-600" />
            Employee Management
          </h2>
          <p className="text-gray-600 mt-1">Manage workers and inspectors for your city</p>
        </div>
        <button
          onClick={() => setShowAddEmployee(true)}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transition-all"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex space-x-2">
            {['ALL', 'WORKER', 'INSPECTOR'].map((role) => (
              <button
                key={role}
                onClick={() => setFilter(role)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  filter === role
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Count */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-blue-100 text-sm font-semibold uppercase mb-2">Total Employees</h3>
          <p className="text-4xl font-bold">{employees.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-green-100 text-sm font-semibold uppercase mb-2">Workers</h3>
          <p className="text-4xl font-bold">{employees.filter(e => e.role === 'WORKER').length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-purple-100 text-sm font-semibold uppercase mb-2">Inspectors</h3>
          <p className="text-4xl font-bold">{employees.filter(e => e.role === 'INSPECTOR').length}</p>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Name</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Username</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee._id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                        {employee.firstName.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="font-semibold text-gray-900">{employee.firstName} {employee.lastName}</p>
                        {employee.isSystemGenerated && (
                          <p className="text-xs text-gray-500">System Generated</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{employee.username}</code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      employee.role === 'WORKER' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{employee.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{employee.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      employee.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(employee.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-semibold">No employees found</p>
              <p className="text-gray-400 text-sm">Add workers and inspectors to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <UserCog className="h-7 w-7 mr-3" />
                  Add Employee
                </h2>
                <button onClick={() => setShowAddEmployee(false)} className="text-white hover:text-gray-200">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Role *</label>
                  <select
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="WORKER">Worker (Field Employee)</option>
                    <option value="INSPECTOR">Inspector (Quality Assurance)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">First Name *</label>
                    <input
                      type="text"
                      value={newEmployee.firstName}
                      onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={newEmployee.lastName}
                      onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email (Optional)</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto-generated if empty"
                  />
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-800 font-semibold mb-1">Auto-Generated Credentials</p>
                  <p className="text-xs text-blue-600">
                    System will generate a unique username and temporary password. 
                    Make sure to save the credentials after creation.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddEmployee(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg"
                >
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <CheckCircle className="h-7 w-7 mr-3" />
                Employee Created Successfully
              </h2>
            </div>

            <div className="p-6">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-6">
                <p className="text-sm text-amber-800 font-semibold mb-1">⚠️ Important</p>
                <p className="text-xs text-amber-700">
                  Save these credentials now. The password will not be shown again.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-2">Name</label>
                  <p className="text-lg font-bold text-gray-900">{createdCredentials.name}</p>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-2">Role</label>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {createdCredentials.role}
                  </span>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-2">Username</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono text-sm">
                      {createdCredentials.username}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdCredentials.username)}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-2">Temporary Password</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono text-sm">
                      {createdCredentials.temporaryPassword}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdCredentials.temporaryPassword)}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-2">Email</label>
                  <p className="text-gray-900">{createdCredentials.email}</p>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-2">Phone</label>
                  <p className="text-gray-900">{createdCredentials.phone}</p>
                </div>
              </div>

              <button
                onClick={() => setCreatedCredentials(null)}
                className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
