import mongoose from 'mongoose';

const contractorBidSchema = new mongoose.Schema({
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true
  },
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Bid Details
  bidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDays: {
    type: Number,
    required: true,
    min: 1
  },
  proposal: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Technical Details
  methodology: {
    type: String,
    maxlength: 1000
  },
  materials: [{
    name: String,
    quantity: Number,
    cost: Number
  }],
  
  // Status
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
    default: 'PENDING'
  },
  
  // Admin Review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who reviewed
  },
  reviewNotes: String,
  reviewedAt: Date,
  
  // If approved
  workStartDate: Date,
  workEndDate: Date,
  completionStatus: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'],
    default: 'NOT_STARTED'
  },
  
  // Payment tracking
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PARTIAL', 'COMPLETED'],
    default: 'PENDING'
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  
  // Public visibility for transparency
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
contractorBidSchema.index({ issue: 1, createdAt: -1 });
contractorBidSchema.index({ contractor: 1, status: 1 });
contractorBidSchema.index({ status: 1, createdAt: -1 });

const ContractorBid = mongoose.model('ContractorBid', contractorBidSchema);

export default ContractorBid;
