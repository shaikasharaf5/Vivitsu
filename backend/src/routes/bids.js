import express from 'express';
import Bid from '../models/Bid.js';
import Issue from '../models/Issue.js';
import Assignment from '../models/Assignment.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get contractor's bids
router.get('/mine', authenticate, authorize('CONTRACTOR'), async (req, res) => {
  try {
    const bids = await Bid.find({ contractor: req.user._id })
      .populate('issue')
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Place bid
router.post('/', authenticate, authorize('CONTRACTOR'), async (req, res) => {
  try {
    const { issueId, quotedAmount, quotedHours, notes } = req.body;

    const bid = new Bid({
      issue: issueId,
      contractor: req.user._id,
      quotedAmount,
      quotedHours,
      notes
    });

    await bid.save();

    const io = req.app.get('io');
    io.emit('bidPlaced', { bid });

    res.status(201).json(bid);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept/reject bid
router.patch('/:id/decision', authenticate, authorize('ADMIN', 'INSPECTOR'), async (req, res) => {
  try {
    const { decision } = req.body;
    const bid = await Bid.findById(req.params.id);

    bid.status = decision;
    await bid.save();

    if (decision === 'ACCEPTED') {
      // Create assignment
      const assignment = new Assignment({
        issue: bid.issue,
        assignedTo: bid.contractor,
        assignedBy: req.user._id,
        assignmentType: 'CONTRACTOR_BID'
      });
      await assignment.save();

      // Reject other bids
      await Bid.updateMany(
        { issue: bid.issue, _id: { $ne: bid._id } },
        { status: 'REJECTED' }
      );

      await Issue.findByIdAndUpdate(bid.issue, { status: 'ASSIGNED' });
    }

    res.json(bid);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
