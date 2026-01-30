import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: String,
  avatar: String,
  
  // Role with SuperAdmin support
  role: { 
    type: String, 
    enum: ['CITIZEN', 'WORKER', 'CONTRACTOR', 'INSPECTOR', 'ADMIN', 'SUPER_ADMIN'],
    default: 'CITIZEN'
  },
  
  // Contractor-specific fields
  companyName: { 
    type: String,
    // Required only for contractors
    required: function() { return this.role === 'CONTRACTOR'; }
  },
  companyRegistrationNumber: String,
  companyAddress: String,
  
  // City assignment
  // For CITIZEN & CONTRACTOR: selected city (can change)
  // For WORKER, INSPECTOR, ADMIN: assigned city (fixed)
  // For SUPER_ADMIN: null (can access all cities)
  assignedCity: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'City',
    required: function() {
      return ['WORKER', 'INSPECTOR', 'ADMIN'].includes(this.role);
    }
  },
  
  // Legacy field for backward compatibility (will be migrated to assignedCity)
  city: { type: String },
  
  // System-generated user flag (for workers/inspectors created by admin)
  isSystemGenerated: { 
    type: Boolean, 
    default: false 
  },
  
  // Auto-generated username for workers/inspectors
  username: { 
    type: String, 
    sparse: true  // Allow null for non-system users
  },
  
  // Track who created this user (for workers/inspectors)
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SUSPENDED', 'DELETED'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

// Indexes for efficient queries
userSchema.index({ role: 1, assignedCity: 1 });
userSchema.index({ assignedCity: 1, status: 1 });

export default mongoose.model('User', userSchema);
