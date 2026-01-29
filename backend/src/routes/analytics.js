import express from 'express';
import Issue from '../models/Issue.js';
import Assignment from '../models/Assignment.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN', 'INSPECTOR'), async (req, res) => {
  try {
    const { dateRange = '30', city } = req.query;
    const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000);

    const query = { createdAt: { $gte: startDate } };
    if (city) query.city = city;

    const totalIssues = await Issue.countDocuments(query);
    const openIssues = await Issue.countDocuments({ ...query, status: { $in: ['REPORTED', 'CATEGORIZED', 'ASSIGNED', 'IN_PROGRESS'] } });
    const resolvedIssues = await Issue.countDocuments({ ...query, status: 'RESOLVED' });

    const byCategory = await Issue.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const topIssues = await Issue.find(query)
      .sort({ upvotes: -1 })
      .limit(10)
      .populate('reportedBy', 'firstName lastName');

    const completedAssignments = await Assignment.find({ 
      status: 'COMPLETED',
      completedAt: { $exists: true },
      acceptedAt: { $exists: true }
    });

    let avgResolutionTime = 0;
    if (completedAssignments.length > 0) {
      const totalTime = completedAssignments.reduce((sum, a) => {
        return sum + (new Date(a.completedAt) - new Date(a.acceptedAt));
      }, 0);
      avgResolutionTime = Math.round(totalTime / completedAssignments.length / (1000 * 60 * 60 * 24) * 10) / 10;
    }

    res.json({
      totalIssues,
      openIssues,
      resolvedIssues,
      resolvedPercentage: totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0,
      avgResolutionTime,
      byCategory,
      topIssues
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
