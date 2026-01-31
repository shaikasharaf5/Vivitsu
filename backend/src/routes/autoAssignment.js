import express from 'express';
import Issue from '../models/Issue.js';
import Employee from '../models/Employee.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Auto-assign issues to workers based on location and capacity
router.post('/auto-assign', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { issueId } = req.body;

    // Get the issue
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Check if issue is already assigned
    if (issue.status !== 'CATEGORIZED' && issue.status !== 'REPORTED') {
      return res.status(400).json({ error: 'Issue is already assigned or not ready for assignment' });
    }

    // Check authorization - admin can only assign issues from their city
    if (issue.city.toString() !== req.user.assignedCity.toString()) {
      return res.status(403).json({ error: 'Not authorized to assign this issue' });
    }

    // Find available workers in the same city
    const workers = await Employee.find({
      role: 'WORKER',
      assignedCity: issue.city,
      status: 'ACTIVE'
    });

    if (workers.length === 0) {
      return res.status(404).json({ error: 'No workers available in this city' });
    }

    // Filter workers who can handle this issue (location + capacity)
    const suitableWorkers = workers.filter(worker => {
      return (
        worker.isAvailableForAssignment() &&
        worker.canHandleIssueAtLocation(issue.location.latitude, issue.location.longitude)
      );
    });

    if (suitableWorkers.length === 0) {
      // Mark issue as open for bidding if no workers available
      issue.status = 'OPEN_FOR_BIDDING';
      await issue.save();
      
      return res.status(200).json({
        assigned: false,
        message: 'No available workers found. Issue marked as open for contractor bidding.',
        issue
      });
    }

    // Sort by current load (assign to least busy worker)
    suitableWorkers.sort((a, b) => {
      const loadRatioA = a.currentLoad / a.maxCapacity;
      const loadRatioB = b.currentLoad / b.maxCapacity;
      return loadRatioA - loadRatioB;
    });

    // Assign to the best worker
    const assignedWorker = suitableWorkers[0];
    
    // Update issue
    issue.status = 'ASSIGNED';
    issue.assignedWorker = assignedWorker._id;
    issue.assignedAt = new Date();
    await issue.save();

    // Update worker's current load
    assignedWorker.currentLoad += 1;
    assignedWorker.stats.totalIssuesHandled += 1;
    await assignedWorker.save();

    // Populate issue for response
    const populatedIssue = await Issue.findById(issue._id)
      .populate('assignedWorker', 'firstName lastName employeeId phone email')
      .populate('reportedBy', 'firstName lastName')
      .populate('city', 'name');

    res.json({
      assigned: true,
      message: `Issue assigned to ${assignedWorker.firstName} ${assignedWorker.lastName}`,
      issue: populatedIssue,
      worker: {
        _id: assignedWorker._id,
        name: `${assignedWorker.firstName} ${assignedWorker.lastName}`,
        employeeId: assignedWorker.employeeId,
        phone: assignedWorker.phone,
        currentLoad: assignedWorker.currentLoad,
        maxCapacity: assignedWorker.maxCapacity
      }
    });
  } catch (error) {
    console.error('Auto-assign error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk auto-assign unassigned issues
router.post('/auto-assign-bulk', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    // Get all unassigned issues in admin's city
    const issues = await Issue.find({
      city: req.user.assignedCity,
      status: { $in: ['CATEGORIZED', 'REPORTED'] }
    });

    if (issues.length === 0) {
      return res.status(200).json({
        message: 'No unassigned issues found',
        assigned: 0,
        openForBidding: 0
      });
    }

    // Get all available workers
    const workers = await Employee.find({
      role: 'WORKER',
      assignedCity: req.user.assignedCity,
      status: 'ACTIVE'
    });

    let assigned = 0;
    let openForBidding = 0;
    const results = [];

    for (const issue of issues) {
      // Find suitable workers for this issue
      const suitableWorkers = workers.filter(worker => {
        return (
          worker.isAvailableForAssignment() &&
          worker.canHandleIssueAtLocation(issue.location.latitude, issue.location.longitude)
        );
      });

      if (suitableWorkers.length > 0) {
        // Sort by current load
        suitableWorkers.sort((a, b) => (a.currentLoad / a.maxCapacity) - (b.currentLoad / b.maxCapacity));
        
        const worker = suitableWorkers[0];
        
        // Assign issue
        issue.status = 'ASSIGNED';
        issue.assignedWorker = worker._id;
        issue.assignedAt = new Date();
        await issue.save();

        // Update worker load
        worker.currentLoad += 1;
        worker.stats.totalIssuesHandled += 1;
        await worker.save();

        assigned++;
        results.push({
          issueId: issue._id,
          issueTitle: issue.title,
          worker: `${worker.firstName} ${worker.lastName}`,
          status: 'assigned'
        });
      } else {
        // Mark as open for bidding
        issue.status = 'OPEN_FOR_BIDDING';
        await issue.save();
        
        openForBidding++;
        results.push({
          issueId: issue._id,
          issueTitle: issue.title,
          status: 'open_for_bidding'
        });
      }
    }

    res.json({
      message: `Auto-assignment complete: ${assigned} assigned, ${openForBidding} open for bidding`,
      assigned,
      openForBidding,
      totalProcessed: issues.length,
      results
    });
  } catch (error) {
    console.error('Bulk auto-assign error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manually assign issue to specific worker
router.post('/manual-assign', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { issueId, workerId } = req.body;

    const issue = await Issue.findById(issueId);
    const worker = await Employee.findById(workerId);

    if (!issue || !worker) {
      return res.status(404).json({ error: 'Issue or worker not found' });
    }

    // Check authorization
    if (issue.city.toString() !== req.user.assignedCity.toString()) {
      return res.status(403).json({ error: 'Not authorized to assign this issue' });
    }

    if (worker.assignedCity.toString() !== req.user.assignedCity.toString()) {
      return res.status(403).json({ error: 'Cannot assign to worker from different city' });
    }

    // Check worker availability
    if (!worker.isAvailableForAssignment()) {
      return res.status(400).json({ 
        error: `Worker is at capacity (${worker.currentLoad}/${worker.maxCapacity}) or not active` 
      });
    }

    // Assign issue
    issue.status = 'ASSIGNED';
    issue.assignedWorker = worker._id;
    issue.assignedAt = new Date();
    await issue.save();

    // Update worker
    worker.currentLoad += 1;
    worker.stats.totalIssuesHandled += 1;
    await worker.save();

    const populatedIssue = await Issue.findById(issue._id)
      .populate('assignedWorker', 'firstName lastName employeeId')
      .populate('reportedBy', 'firstName lastName');

    res.json({
      message: 'Issue assigned successfully',
      issue: populatedIssue
    });
  } catch (error) {
    console.error('Manual assign error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unassign issue from worker
router.post('/unassign', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { issueId } = req.body;

    const issue = await Issue.findById(issueId).populate('assignedWorker');
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (!issue.assignedWorker) {
      return res.status(400).json({ error: 'Issue is not assigned to any worker' });
    }

    // Update worker load
    const worker = await Employee.findById(issue.assignedWorker._id);
    if (worker) {
      worker.currentLoad = Math.max(0, worker.currentLoad - 1);
      await worker.save();
    }

    // Unassign issue
    issue.status = 'CATEGORIZED';
    issue.assignedWorker = null;
    issue.assignedAt = null;
    await issue.save();

    res.json({
      message: 'Issue unassigned successfully',
      issue
    });
  } catch (error) {
    console.error('Unassign error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
