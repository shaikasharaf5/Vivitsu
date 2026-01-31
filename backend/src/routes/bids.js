import express from 'express';
import ContractorBid from '../models/ContractorBid.js';
import Issue from '../models/Issue.js';
import Employee from '../models/Employee.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all bids for an issue (public for transparency)
router.get('/issue/:issueId', async (req, res) => {
  try {
    const bids = await ContractorBid.find({
      issue: req.params.issueId,
      isPublic: true
    })
      .populate('contractor', 'firstName lastName companyName rating')
      .sort({ bidAmount: 1 }); // Sort by lowest bid first

    res.json(bids);
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit a bid (contractor only)
router.post('/', authenticate, authorizeRoles('CONTRACTOR'), async (req, res) => {
  try {
    const {
      issueId,
      bidAmount,
      estimatedDays,
      proposal,
      methodology,
      materials
    } = req.body;

    if (!issueId || !bidAmount || !estimatedDays || !proposal) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if issue exists and is open for bidding
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Check if issue status allows bidding
    if (!['CATEGORIZED', 'OPEN_FOR_BIDDING'].includes(issue.status)) {
      return res.status(400).json({ error: 'Issue is not open for bidding' });
    }

    // Check if contractor already submitted a bid
    const existingBid = await ContractorBid.findOne({
      issue: issueId,
      contractor: req.user._id,
      status: { $in: ['PENDING', 'APPROVED'] }
    });

    if (existingBid) {
      return res.status(400).json({ error: 'You have already submitted a bid for this issue' });
    }

    // Create bid
    const bid = new ContractorBid({
      issue: issueId,
      contractor: req.user._id,
      bidAmount,
      estimatedDays,
      proposal,
      methodology,
      materials: materials ? JSON.parse(materials) : []
    });

    await bid.save();

    // Update issue status if it's the first bid
    if (issue.status === 'CATEGORIZED') {
      issue.status = 'OPEN_FOR_BIDDING';
      await issue.save();
    }

    const populatedBid = await ContractorBid.findById(bid._id)
      .populate('contractor', 'firstName lastName companyName')
      .populate('issue', 'title category location');

    res.status(201).json(populatedBid);
  } catch (error) {
    console.error('Submit bid error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get contractor's own bids
router.get('/my-bids', authenticate, authorizeRoles('CONTRACTOR'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = { contractor: req.user._id };
    
    if (status) query.status = status;

    const bids = await ContractorBid.find(query)
      .populate('issue', 'title category location city status')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending bids for admin review
router.get('/pending', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const bids = await ContractorBid.find({
      status: 'PENDING'
    })
      .populate('contractor', 'firstName lastName companyName rating email phone')
      .populate({
        path: 'issue',
        match: { city: req.user.assignedCity },
        populate: { path: 'reportedBy', select: 'firstName lastName' }
      })
      .sort({ createdAt: -1 });

    // Filter out bids where issue is null (not in admin's city)
    const filtered = bids.filter(bid => bid.issue !== null);

    res.json(filtered);
  } catch (error) {
    console.error('Get pending bids error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject bid (admin only)
router.put('/:id/review', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { status, reviewNotes, workStartDate } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const bid = await ContractorBid.findById(req.params.id).populate('issue');
    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    // Check authorization
    if (bid.issue.city.toString() !== req.user.assignedCity.toString()) {
      return res.status(403).json({ error: 'Not authorized to review this bid' });
    }

    bid.status = status;
    bid.reviewedBy = req.user._id;
    bid.reviewNotes = reviewNotes;
    bid.reviewedAt = new Date();

    if (status === 'APPROVED') {
      bid.workStartDate = workStartDate || new Date();
      bid.completionStatus = 'NOT_STARTED';

      // Update issue status and assign to contractor
      const issue = await Issue.findById(bid.issue._id);
      issue.status = 'ASSIGNED';
      issue.assignedContractor = bid.contractor;
      issue.contractAmount = bid.bidAmount;
      await issue.save();

      // Reject all other pending bids for this issue
      await ContractorBid.updateMany(
        {
          issue: bid.issue._id,
          _id: { $ne: bid._id },
          status: 'PENDING'
        },
        {
          status: 'REJECTED',
          reviewNotes: 'Another bid was accepted',
          reviewedBy: req.user._id,
          reviewedAt: new Date()
        }
      );
    }

    await bid.save();

    const populatedBid = await ContractorBid.findById(bid._id)
      .populate('contractor', 'firstName lastName companyName email phone')
      .populate('issue', 'title category location')
      .populate('reviewedBy', 'firstName lastName');

    res.json(populatedBid);
  } catch (error) {
    console.error('Review bid error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get issues open for bidding (contractor view)
router.get('/open-issues', authenticate, authorizeRoles('CONTRACTOR'), async (req, res) => {
  try {
    const { city, category } = req.query;
    const query = {
      status: { $in: ['CATEGORIZED', 'OPEN_FOR_BIDDING'] }
    };

    if (city) query.city = city;
    if (category) query.category = category;

    const issues = await Issue.find(query)
      .populate('city', 'name')
      .populate('reportedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Get bid counts for each issue
    const issuesWithBids = await Promise.all(issues.map(async (issue) => {
      const bidCount = await ContractorBid.countDocuments({ issue: issue._id });
      const userBid = await ContractorBid.findOne({
        issue: issue._id,
        contractor: req.user._id
      });

      return {
        ...issue.toObject(),
        bidCount,
        userHasBid: !!userBid
      };
    }));

    res.json(issuesWithBids);
  } catch (error) {
    console.error('Get open issues error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
