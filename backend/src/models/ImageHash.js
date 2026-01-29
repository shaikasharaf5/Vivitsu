import mongoose from 'mongoose';

const imageHashSchema = new mongoose.Schema({
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  cloudinaryUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String, required: true },
  aHash: { type: String, required: true },
  dHash: { type: String, required: true },
  md5: { type: String, required: false },
  fileSize: Number,
  width: Number,
  height: Number,
  format: String,
  uploadedAt: { type: Date, default: Date.now },
  flaggedAsUnsafe: { type: Boolean, default: false },
  unsafeReason: String,
  aiCheckPerformed: { type: Boolean, default: false },
  aiConfidence: Number
}, { timestamps: true });

// Indexes for fast hash-based searches
imageHashSchema.index({ aHash: 1 });
imageHashSchema.index({ dHash: 1 });
imageHashSchema.index({ md5: 1 });
imageHashSchema.index({ issueId: 1 });

export default mongoose.model('ImageHash', imageHashSchema);
