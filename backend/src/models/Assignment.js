import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // City reference for access control
  city: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'City', 
    required: true 
  },
  
  assignmentType: { 
    type: String, 
    enum: ['DIRECT', 'CONTRACTOR_BID', 'AUTO_ASSIGNED'],
    default: 'DIRECT'
  },
  status: { 
    type: String, 
    enum: ['PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'REASSIGNED'],
    default: 'PENDING_ACCEPTANCE'
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  slaTargetMinutes: Number,
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  estimatedCompletionTime: Date,
  completionPhotos: [String],
  completionNotes: String,
  workLogs: [{
    status: String,
    notes: String,
    location: { lat: Number, lng: Number },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Indexes for efficient queries
assignmentSchema.index({ city: 1, status: 1 });
assignmentSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model('Assignment', assignmentSchema);
