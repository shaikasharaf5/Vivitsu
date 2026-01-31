import mongoose from 'mongoose';

const workUpdateSchema = new mongoose.Schema({
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  
  // Update Details
  updateType: {
    type: String,
    enum: ['STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Work Evidence
  photos: [{
    url: String,
    publicId: String,
    uploadedAt: Date
  }],
  
  // Progress
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Verification
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee' // Inspector
  },
  verificationNotes: String,
  verifiedAt: Date,
  
  // Materials/Resources Used
  materialsUsed: [{
    name: String,
    quantity: Number,
    unit: String
  }],
  
  // Time tracking
  hoursWorked: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
workUpdateSchema.index({ issue: 1, createdAt: -1 });
workUpdateSchema.index({ worker: 1, status: 1 });
workUpdateSchema.index({ verifiedBy: 1, status: 1 });

const WorkUpdate = mongoose.model('WorkUpdate', workUpdateSchema);

export default WorkUpdate;
