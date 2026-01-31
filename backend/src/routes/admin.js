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
    const { firstName, lastName, role, phone, email, workArea } = req.body;

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
      workArea: workArea || undefined,
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
        phone: employee.phone,
        workArea: employee.workArea
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

    // If fetching workers, add their task statistics
    if (role === 'WORKER' || !role) {
      const Issue = (await import('../models/Issue.js')).default;
      
      for (let employee of employees) {
        if (employee.role === 'WORKER') {
          const totalTasks = await Issue.countDocuments({ 
            assignedWorker: employee._id 
          });
          const completedTasks = await Issue.countDocuments({ 
            assignedWorker: employee._id,
            status: { $in: ['COMPLETED', 'RESOLVED'] }
          });
          const inProgressTasks = await Issue.countDocuments({ 
            assignedWorker: employee._id,
            status: { $in: ['ASSIGNED', 'IN_PROGRESS'] }
          });
          
          employee._doc.stats = {
            totalTasks,
            completedTasks,
            inProgressTasks
          };
        }
      }
    }

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

// Auto-assign issues to workers (Municipal Admin)
router.post('/auto-assign-issues', authenticate, requireAdmin, async (req, res) => {
  try {
    const cityId = req.user.assignedCity;
    const Issue = (await import('../models/Issue.js')).default;
    
    // Get all categorized (unassigned) issues for this city
    const unassignedIssues = await Issue.find({ 
      city: cityId, 
      status: 'CATEGORIZED'
    })
    .populate('reportedBy', 'firstName lastName')
    .sort({ upvotes: -1, createdAt: 1 }); // Priority: most liked, then oldest
    
    if (unassignedIssues.length === 0) {
      return res.json({ message: 'No unassigned issues found', assigned: 0 });
    }
    
    // Get available workers (with capacity < 2 in-progress tasks)
    const workers = await User.find({ 
      assignedCity: cityId, 
      role: 'WORKER',
      status: 'ACTIVE'
    }).select('firstName lastName workArea');
    
    if (workers.length === 0) {
      return res.status(400).json({ error: 'No active workers found' });
    }
    
    // Calculate current workload for each worker
    const workerLoads = await Promise.all(
      workers.map(async (worker) => {
        const inProgressCount = await Issue.countDocuments({
          assignedWorker: worker._id,
          status: { $in: ['ASSIGNED', 'IN_PROGRESS'] }
        });
        return {
          worker,
          currentLoad: inProgressCount,
          available: inProgressCount < 2
        };
      })
    );
    
    // Filter only available workers
    const availableWorkers = workerLoads.filter(w => w.available);
    
    if (availableWorkers.length === 0) {
      return res.json({ message: 'All workers are at full capacity', assigned: 0 });
    }
    
    let assignedCount = 0;
    
    // Assign issues to workers
    for (const issue of unassignedIssues) {
      // Find workers whose work area matches the issue location
      const matchingWorkers = availableWorkers.filter(w => {
        if (!w.worker.workArea || !issue.location?.address) return false;
        // Simple string matching - can be enhanced with geolocation
        const workArea = w.worker.workArea.toLowerCase();
        const issueAddress = issue.location.address.toLowerCase();
        return issueAddress.includes(workArea) || workArea.includes(issueAddress.split(',')[0]);
      });
      
      // If no matching workers, use any available worker
      const candidateWorkers = matchingWorkers.length > 0 ? matchingWorkers : availableWorkers;
      
      if (candidateWorkers.length === 0) break;
      
      // Sort by current load (load balancing)
      candidateWorkers.sort((a, b) => a.currentLoad - b.currentLoad);
      
      // Assign to worker with lowest load
      const selectedWorker = candidateWorkers[0];
      
      issue.assignedWorker = selectedWorker.worker._id;
      issue.status = 'ASSIGNED';
      issue.assignedAt = new Date();
      await issue.save();
      
      assignedCount++;
      
      // Update worker load
      selectedWorker.currentLoad++;
      
      // Remove from available if now at capacity
      if (selectedWorker.currentLoad >= 2) {
        const index = availableWorkers.indexOf(selectedWorker);
        if (index > -1) {
          availableWorkers.splice(index, 1);
        }
      }
      
      // Stop if no more available workers
      if (availableWorkers.length === 0) break;
    }
    
    res.json({ 
      message: `Successfully assigned ${assignedCount} issue(s)`,
      assigned: assignedCount,
      totalUnassigned: unassignedIssues.length
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
