import express from 'express';
import Employee from '../models/Employee.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { generatePassword } from '../utils/helpers.js';

const router = express.Router();

// Get all employees (admin only)
router.get('/', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { role, status, city } = req.query;
    const query = {};
    
    // Filter by admin's city if not super admin
    if (req.user.role === 'ADMIN') {
      query.assignedCity = req.user.assignedCity;
    } else if (city) {
      query.assignedCity = city;
    }
    
    if (role) query.role = role;
    if (status) query.status = status;

    const employees = await Employee.find(query)
      .populate('assignedCity', 'name')
      .populate('addedBy', 'firstName lastName email')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new employee (admin only)
router.post('/', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      role,
      workLocation,
      maxCapacity,
      radiusKm
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !role || !workLocation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate email and password
    const emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${role.toLowerCase()}`;
    const domain = req.user.role === 'ADMIN' ? 
      (await Employee.findById(req.user._id).populate('assignedCity')).assignedCity.name.toLowerCase() : 
      'fixmycity';
    const email = `${emailPrefix}@${domain}.gov.in`;
    
    const generatedPassword = generatePassword();

    // Create employee
    const employee = new Employee({
      firstName,
      lastName,
      email,
      password: generatedPassword,
      phone,
      role,
      assignedCity: req.user.assignedCity || req.body.assignedCity,
      workLocation: {
        ...workLocation,
        radiusKm: radiusKm || 5
      },
      maxCapacity: maxCapacity || 10,
      addedBy: req.user._id
    });

    await employee.save();

    // Return credentials (password visible only once)
    const employeeData = employee.toObject();
    delete employeeData.password;

    res.status(201).json({
      employee: employeeData,
      credentials: {
        email,
        password: generatedPassword,
        employeeId: employee.employeeId
      },
      message: 'Employee added successfully. Please save the credentials - password will not be shown again.'
    });
  } catch (error) {
    console.error('Add employee error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Employee with this email already exists' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update employee
router.put('/:id', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { status, maxCapacity, workLocation } = req.body;
    
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check authorization
    if (req.user.role === 'ADMIN' && employee.assignedCity.toString() !== req.user.assignedCity.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this employee' });
    }

    if (status) employee.status = status;
    if (maxCapacity) employee.maxCapacity = maxCapacity;
    if (workLocation) employee.workLocation = { ...employee.workLocation, ...workLocation };

    await employee.save();

    const updatedEmployee = await Employee.findById(employee._id)
      .populate('assignedCity', 'name')
      .select('-password');

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete employee
router.delete('/:id', authenticate, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check authorization
    if (req.user.role === 'ADMIN' && employee.assignedCity.toString() !== req.user.assignedCity.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this employee' });
    }

    await employee.deleteOne();
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available workers for assignment
router.get('/workers/available', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const workers = await Employee.find({
      role: 'WORKER',
      assignedCity: req.user.assignedCity,
      status: 'ACTIVE'
    }).select('-password');

    // Filter workers by location and capacity
    const availableWorkers = workers.filter(worker => {
      return worker.isAvailableForAssignment() && 
             worker.canHandleIssueAtLocation(parseFloat(latitude), parseFloat(longitude));
    });

    res.json(availableWorkers);
  } catch (error) {
    console.error('Get available workers error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
