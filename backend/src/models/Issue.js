import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['ROADS', 'UTILITIES', 'PARKS', 'TRAFFIC', 'SANITATION', 'HEALTH', 'OTHER']
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: String,
  photos: [String],
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // City reference (ObjectId instead of String)
  city: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'City', 
    required: true 
  },
  
  status: { 
    type: String, 
    enum: ['REPORTED', 'CATEGORIZED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'RESOLVED', 'REJECTED'],
    default: 'REPORTED'
  },
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isDuplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
  duplicateConfidence: Number,
  comments: [{
    text: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

issueSchema.index({ city: 1, category: 1 });
issueSchema.index({ city: 1, status: 1 });
issueSchema.index({ latitude: 1, longitude: 1 });

export default mongoose.model('Issue', issueSchema);
