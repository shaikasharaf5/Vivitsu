import express from 'express';
import multer from 'multer';
import Assignment from '../models/Assignment.js';
import Issue from '../models/Issue.js';
import Verification from '../models/Verification.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Get worker's assignments
router.get('/mine', authenticate, authorize('WORKER', 'CONTRACTOR'), async (req, res) => {
  try {
    const assignments = await Assignment.find({ assignedTo: req.user._id })
      .populate('issue')
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create assignment
router.post('/', authenticate, authorize('ADMIN', 'INSPECTOR'), async (req, res) => {
  try {
    const { issueId, assignedTo, priority, slaTargetMinutes } = req.body;

    const assignment = new Assignment({
      issue: issueId,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      slaTargetMinutes,
      estimatedCompletionTime: new Date(Date.now() + slaTargetMinutes * 60000)
    });

    await assignment.save();

    await Issue.findByIdAndUpdate(issueId, { status: 'ASSIGNED' });

    const io = req.app.get('io');
    io.emit('assignmentCreated', { assignment });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept assignment
router.patch('/:id/accept', authenticate, authorize('WORKER', 'CONTRACTOR'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment.assignedTo.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not your assignment' });
    }

    assignment.status = 'ACCEPTED';
    assignment.acceptedAt = new Date();
    await assignment.save();

    await Issue.findByIdAndUpdate(assignment.issue, { status: 'IN_PROGRESS' });

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update status
router.patch('/:id/update-status', authenticate, authorize('WORKER', 'CONTRACTOR'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment.assignedTo.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not your assignment' });
    }

    assignment.workLogs.push({
      status: req.body.status,
      notes: req.body.notes,
      location: req.body.location
    });

    if (req.body.status === 'IN_PROGRESS') {
      assignment.status = 'IN_PROGRESS';
      assignment.startedAt = new Date();
    }

    await assignment.save();

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete assignment
router.patch('/:id/complete', authenticate, authorize('WORKER', 'CONTRACTOR'), upload.array('photos', 10), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment.assignedTo.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not your assignment' });
    }

    assignment.status = 'COMPLETED';
    assignment.completedAt = new Date();
    assignment.completionPhotos = req.files.map(f => `/uploads/${f.filename}`);
    assignment.completionNotes = req.body.notes;
    await assignment.save();

    await Issue.findByIdAndUpdate(assignment.issue, { status: 'COMPLETED' });

    // Create verification task
    const verification = new Verification({
      assignment: assignment._id,
      issue: assignment.issue
    });
    await verification.save();

    const io = req.app.get('io');
    io.emit('assignmentCompleted', { assignment });

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
