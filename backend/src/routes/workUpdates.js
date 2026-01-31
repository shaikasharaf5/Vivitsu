import express from 'express';
import Employee from '../models/Employee.js';
import Issue from '../models/Issue.js';
import WorkUpdate from '../models/WorkUpdate.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToCloudinary } from '../utils/cloudinaryService.js';

const router = express.Router();

// Configure multer
const uploadsDir = process.env.UPLOAD_FOLDER || 'uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'work-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5242880 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get work updates for an issue
router.get('/issue/:issueId', authenticate, async (req, res) => {
  try {
    const updates = await WorkUpdate.find({ issue: req.params.issueId })
      .populate('worker', 'firstName lastName employeeId')
      .populate('verifiedBy', 'firstName lastName employeeId')
      .sort({ createdAt: -1 });

    res.json(updates);
  } catch (error) {
    console.error('Get work updates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create work update (worker only)
router.post('/', authenticate, authorizeRoles('WORKER'), upload.array('photos', 5), async (req, res) => {
  try {
    const {
      issueId,
      updateType,
      description,
      progressPercentage,
      materialsUsed,
      hoursWorked
    } = req.body;

    // Verify worker is assigned to this issue
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Find employee record for this user
    const employee = await Employee.findOne({ email: req.user.email });
    if (!employee) {
      return res.status(403).json({ error: 'Employee record not found' });
    }

    // Upload photos to Cloudinary
    let photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.path);
          photos.push({
            url: result.secure_url,
            publicId: result.public_id,
            uploadedAt: new Date()
          });
          
          // Delete local file
          fs.unlinkSync(file.path);
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
        }
      }
    }

    // Create work update
    const workUpdate = new WorkUpdate({
      issue: issueId,
      worker: employee._id,
      updateType,
      description,
      photos,
      progressPercentage: progressPercentage || 0,
      materialsUsed: materialsUsed ? JSON.parse(materialsUsed) : [],
      hoursWorked: hoursWorked || 0
    });

    await workUpdate.save();

    // Update issue status based on update type
    if (updateType === 'STARTED' && issue.status === 'ASSIGNED') {
      issue.status = 'IN_PROGRESS';
      await issue.save();
    }

    const populatedUpdate = await WorkUpdate.findById(workUpdate._id)
      .populate('worker', 'firstName lastName employeeId')
      .populate('issue', 'title category');

    res.status(201).json(populatedUpdate);
  } catch (error) {
    console.error('Create work update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify work update (inspector only)
router.put('/:id/verify', authenticate, authorizeRoles('INSPECTOR'), async (req, res) => {
  try {
    const { status, verificationNotes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const workUpdate = await WorkUpdate.findById(req.params.id);
    if (!workUpdate) {
      return res.status(404).json({ error: 'Work update not found' });
    }

    // Find inspector employee record
    const inspector = await Employee.findOne({ email: req.user.email });
    if (!inspector) {
      return res.status(403).json({ error: 'Inspector record not found' });
    }

    workUpdate.status = status;
    workUpdate.verifiedBy = inspector._id;
    workUpdate.verificationNotes = verificationNotes;
    workUpdate.verifiedAt = new Date();

    await workUpdate.save();

    // If approved and progress is 100%, update issue status
    if (status === 'APPROVED' && workUpdate.progressPercentage >= 100) {
      const issue = await Issue.findById(workUpdate.issue);
      if (issue) {
        issue.status = 'RESOLVED';
        await issue.save();
        
        // Update worker stats
        const worker = await Employee.findById(workUpdate.worker);
        if (worker) {
          worker.stats.issuesResolved++;
          worker.currentLoad = Math.max(0, worker.currentLoad - 1);
          await worker.save();
        }
      }
    }

    const populatedUpdate = await WorkUpdate.findById(workUpdate._id)
      .populate('worker', 'firstName lastName employeeId')
      .populate('verifiedBy', 'firstName lastName employeeId');

    res.json(populatedUpdate);
  } catch (error) {
    console.error('Verify work update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending verifications (inspector only)
router.get('/pending-verifications', authenticate, authorizeRoles('INSPECTOR'), async (req, res) => {
  try {
    const inspector = await Employee.findOne({ email: req.user.email });
    if (!inspector) {
      return res.status(403).json({ error: 'Inspector record not found' });
    }

    const pendingUpdates = await WorkUpdate.find({
      status: 'PENDING'
    })
      .populate('worker', 'firstName lastName employeeId')
      .populate({
        path: 'issue',
        match: { city: inspector.assignedCity },
        populate: { path: 'reportedBy', select: 'firstName lastName' }
      })
      .sort({ createdAt: -1 });

    // Filter out updates where issue is null (not in inspector's city)
    const filtered = pendingUpdates.filter(update => update.issue !== null);

    res.json(filtered);
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
