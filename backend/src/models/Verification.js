import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  verdict: { type: String, enum: ['APPROVED', 'REJECTED'] },
  inspectorNotes: String,
  rejectionReason: String,
  checklist: mongoose.Schema.Types.Mixed,
  verifiedAt: Date
}, { timestamps: true });

export default mongoose.model('Verification', verificationSchema);
