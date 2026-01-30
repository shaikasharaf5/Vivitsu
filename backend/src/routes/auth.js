import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import City from '../models/City.js';

const router = express.Router();

/**
 * ============================
 * REGISTER (Citizen / Contractor)
 * ============================
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      city,
      cityId,
      companyName,
      phone
    } = req.body;

    const selectedCityId = cityId || city;

    if (role && !['CITIZEN', 'CONTRACTOR'].includes(role)) {
      return res.status(403).json({
        error: 'Only citizens and contractors can self-register'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (selectedCityId) {
      const cityDoc = await City.findById(selectedCityId);
      if (!cityDoc) {
        return res.status(400).json({ error: 'Invalid city' });
      }
    }

    if (role === 'CONTRACTOR' && !companyName) {
      return res.status(400).json({
        error: 'Company name is required for contractors'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: role || 'CITIZEN',
      assignedCity: selectedCityId || null,
      companyName: role === 'CONTRACTOR' ? companyName : undefined,
      isSystemGenerated: false
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        cityId: user.assignedCity,
        companyName: user.companyName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * ============================
 * LOGIN
 * ============================
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    console.log('=== LOGIN REQUEST ===');
    console.log('Email:', email);
    console.log('Username:', username);
    console.log('Password provided:', !!password);
    console.log('Password length:', password?.length);

    // Build query conditions - only include non-empty values
    const queryConditions = [];
    if (email) {
      queryConditions.push({ email: email });
    }
    if (username) {
      queryConditions.push({ username: username });
    }

    // If no conditions, return error
    if (queryConditions.length === 0) {
      return res.status(400).json({ error: 'Email or username is required' });
    }

    console.log('Query conditions:', JSON.stringify(queryConditions));

    const user = await User.findOne({
      $or: queryConditions
    }).populate('assignedCity', 'name state');

    console.log('User found in DB:', !!user);
    if (user) {
      console.log('Found user email:', user.email);
      console.log('Found user role:', user.role);
      console.log('User status:', user.status);
      console.log('Stored password hash:', user.password?.substring(0, 20) + '...');
    } else {
      console.log('❌ No user found with email/username:', email || username);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Comparing password...');
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      console.log('❌ Password mismatch for user:', user.email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Account is suspended or deleted'
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful for:', user.email);

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        cityId: user.assignedCity?._id,
        cityName: user.assignedCity?.name,
        companyName: user.companyName,
        avatar: user.avatar,
        isSystemGenerated: user.isSystemGenerated
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;

