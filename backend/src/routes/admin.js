import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import City from '../models/City.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is SuperAdmin
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied. Super Admin only.' });
  }
  next();
};

// Middleware to check if user is Admin (Municipal Admin)
const requireAdmin = (req, res, next) => {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// ============================================
// SUPER ADMIN ROUTES
// ============================================

// Get all cities (SuperAdmin only)
router.get('/cities', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const cities = await City.find()
      .populate('municipalAdmin', 'firstName lastName email')
      .sort({ name: 1 });
    
    res.json(cities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new city (SuperAdmin only)
router.post('/cities', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { name, state, country, latitude, longitude } = req.body;

    // Check if city already exists
    const existingCity = await City.findOne({ name, state });
    if (existingCity) {
      return res.status(400).json({ error: 'City already exists in this state' });
    }

    const city = new City({
      name,
      state,
      country: country || 'India',
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      status: 'ACTIVE'
    });

    await city.save();

    res.status(201).json({
      message: 'City added successfully',
      city
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Municipal Admin for a city (SuperAdmin only)
router.post('/cities/:cityId/admin', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { cityId } = req.params;
    const { email, firstName, lastName, password, phone } = req.body;

    // Validate city exists
    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    // Check if city already has an admin
    if (city.municipalAdmin) {
      return res.status(400).json({ 
        error: 'This city already has a municipal admin. Please remove the existing admin first.' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: 'ADMIN',
      assignedCity: cityId,
      isSystemGenerated: false,
      status: 'ACTIVE'
    });

    await admin.save();

    // Update city with admin reference
    city.municipalAdmin = admin._id;
    await city.save();

    res.status(201).json({
      message: 'Municipal admin created successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        name: `${admin.firstName} ${admin.lastName}`,
        role: admin.role,
        cityId: admin.assignedCity
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics for all cities (SuperAdmin only)
router.get('/analytics/all-cities', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const Issue = (await import('../models/Issue.js')).default;
    const Assignment = (await import('../models/Assignment.js')).default;

    const cities = await City.find({ status: 'ACTIVE' }).lean();
    
    const analyticsPromises = cities.map(async (city) => {
      const totalIssues = await Issue.countDocuments({ city: city._id });
      const openIssues = await Issue.countDocuments({ 
        city: city._id, 
        status: { $in: ['REPORTED', 'ASSIGNED', 'IN_PROGRESS'] }
      });
      const resolvedIssues = await Issue.countDocuments({ 
        city: city._id, 
        status: 'RESOLVED' 
      });
      const completedIssues = await Issue.countDocuments({ 
        city: city._id, 
        status: 'COMPLETED' 
      });

      const categoryDistribution = await Issue.aggregate([
        { $match: { city: city._id } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);

      return {
        cityId: city._id,
        cityName: city.name,
        state: city.state,
        totalIssues,
        openIssues,
        resolvedIssues,
        completedIssues,
        categoryDistribution
      };
    });

    const analytics = await Promise.all(analyticsPromises);

    res.json({
      totalCities: cities.length,
      cities: analytics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MUNICIPAL ADMIN ROUTES
// ============================================

// Generate unique username for worker/inspector
const generateUsername = async (role, city, firstName) => {
  const prefix = role === 'WORKER' ? 'WRK' : 'INS';
  const cityCode = city.name.substring(0, 3).toUpperCase();
  const baseUsername = `${prefix}_${cityCode}_${firstName.substring(0, 3).toUpperCase()}`;
  
  // Find existing users with similar username
  const count = await User.countDocuments({ 
    username: new RegExp(`^${baseUsername}`, 'i')
  });
  
  return `${baseUsername}${count + 1}`;
};

// Generate random password
const generatePassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Add worker or inspector (Municipal Admin only)
router.post('/employees', authenticate, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, role, phone, email } = req.body;

    // Validate role
    if (!['WORKER', 'INSPECTOR'].includes(role)) {
      return res.status(400).json({ error: 'Only workers and inspectors can be created through this endpoint' });
    }

    // Ensure admin can only create employees for their city
    const cityId = req.user.assignedCity;
    if (!cityId) {
      return res.status(403).json({ error: 'Admin must be assigned to a city' });
    }

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    // Check if email already exists (optional field)
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Generate username and password
    const username = await generateUsername(role, city, firstName);
    const temporaryPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create employee
    const employee = new User({
      email: email || `${username}@${city.name.toLowerCase()}.gov.in`,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      username,
      role,
      assignedCity: cityId,
      isSystemGenerated: true,
      createdBy: req.user._id,
      status: 'ACTIVE'
    });

    await employee.save();

    res.status(201).json({
      message: `${role.toLowerCase()} created successfully`,
      employee: {
        id: employee._id,
        username: employee.username,
        temporaryPassword, // Send this ONCE to admin
        email: employee.email,
        name: `${employee.firstName} ${employee.lastName}`,
        role: employee.role,
        cityName: city.name,
        phone: employee.phone
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all employees for admin's city
router.get('/employees', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.query;
    const cityId = req.user.assignedCity;

    const query = { assignedCity: cityId };
    if (role) {
      query.role = role;
    } else {
      query.role = { $in: ['WORKER', 'INSPECTOR'] };
    }

    const employees = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get city analytics (Municipal Admin for their city only)
router.get('/analytics/city', authenticate, requireAdmin, async (req, res) => {
  try {
    const cityId = req.user.assignedCity;
    const Issue = (await import('../models/Issue.js')).default;
    const Assignment = (await import('../models/Assignment.js')).default;

    const totalIssues = await Issue.countDocuments({ city: cityId });
    const openIssues = await Issue.countDocuments({ 
      city: cityId, 
      status: { $in: ['REPORTED', 'ASSIGNED', 'IN_PROGRESS'] }
    });
    const resolvedIssues = await Issue.countDocuments({ 
      city: cityId, 
      status: 'RESOLVED' 
    });
    const completedIssues = await Issue.countDocuments({ 
      city: cityId, 
      status: 'COMPLETED' 
    });

    const categoryDistribution = await Issue.aggregate([
      { $match: { city: cityId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const priorityDistribution = await Issue.aggregate([
      { $match: { city: cityId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const workers = await User.countDocuments({ assignedCity: cityId, role: 'WORKER', status: 'ACTIVE' });
    const inspectors = await User.countDocuments({ assignedCity: cityId, role: 'INSPECTOR', status: 'ACTIVE' });

    res.json({
      totalIssues,
      openIssues,
      resolvedIssues,
      completedIssues,
      categoryDistribution,
      priorityDistribution,
      workforce: {
        workers,
        inspectors
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PUBLIC ROUTES (for citizens/contractors)
// ============================================

// Get list of active cities (public)
router.get('/cities/public', async (req, res) => {
  try {
    const cities = await City.find({ status: 'ACTIVE' })
      .select('name state country coordinates')
      .sort({ name: 1 });
    
    res.json(cities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
