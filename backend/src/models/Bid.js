import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quotedAmount: { type: Number, required: true },
  quotedHours: { type: Number, required: true },
  notes: String,
  status: { 
    type: String, 
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  }
}, { timestamps: true });

export default mongoose.model('Bid', bidSchema);
