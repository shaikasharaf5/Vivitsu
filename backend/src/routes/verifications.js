import express from 'express';
import Verification from '../models/Verification.js';
import Assignment from '../models/Assignment.js';
import Issue from '../models/Issue.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get pending verifications
router.get('/pending', authenticate, authorize('INSPECTOR', 'ADMIN'), async (req, res) => {
  try {
    const verifications = await Verification.find({ status: 'PENDING' })
      .populate({
        path: 'assignment',
        populate: { path: 'issue assignedTo' }
      })
      .sort({ createdAt: -1 });

    res.json(verifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify (approve/reject)
router.patch('/:id/verify', authenticate, authorize('INSPECTOR', 'ADMIN'), async (req, res) => {
  try {
    const { verdict, notes, rejectionReason, checklist } = req.body;

    const verification = await Verification.findById(req.params.id).populate('assignment');
    
    verification.status = verdict === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    verification.verdict = verdict;
    verification.inspector = req.user._id;
    verification.inspectorNotes = notes;
    verification.rejectionReason = rejectionReason;
    verification.checklist = checklist;
    verification.verifiedAt = new Date();

    await verification.save();

    if (verdict === 'APPROVED') {
      await Issue.findByIdAndUpdate(verification.issue, { status: 'RESOLVED' });
    } else {
      await Issue.findByIdAndUpdate(verification.issue, { status: 'REJECTED' });
      await Assignment.findByIdAndUpdate(verification.assignment._id, { status: 'REJECTED' });
    }

    const io = req.app.get('io');
    io.emit('verificationCompleted', { verification, verdict });

    res.json(verification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats
router.get('/stats', authenticate, authorize('INSPECTOR', 'ADMIN'), async (req, res) => {
  try {
    const approved = await Verification.countDocuments({ status: 'APPROVED' });
    const rejected = await Verification.countDocuments({ status: 'REJECTED' });
    const pending = await Verification.countDocuments({ status: 'PENDING' });

    res.json({
      approved,
      rejected,
      pending,
      approvalRate: approved + rejected > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
