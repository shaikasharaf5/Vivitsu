import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employeeSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Role and Assignment
  role: {
    type: String,
    enum: ['WORKER', 'INSPECTOR'],
    required: true
  },
  assignedCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  
  // Work Area (simple text description for admin assignment)
  workArea: {
    type: String,
    trim: true
  },
  
  // Work Location (where they are assigned to work)
  workLocation: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    // Radius in kilometers - worker handles issues within this radius
    radiusKm: {
      type: Number,
      default: 5
    }
  },
  
  // Capacity Management (for workers)
  maxCapacity: {
    type: Number,
    default: 10, // Max number of concurrent issues
    min: 1,
    max: 50
  },
  currentLoad: {
    type: Number,
    default: 0 // Current number of assigned issues
  },
  
  // Status
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'],
    default: 'ACTIVE'
  },
  
  // Credentials
  employeeId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Added by admin
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Statistics
  stats: {
    totalIssuesHandled: {
      type: Number,
      default: 0
    },
    issuesResolved: {
      type: Number,
      default: 0
    },
    averageResolutionTime: {
      type: Number,
      default: 0 // in hours
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  }
}, {
  timestamps: true
});

// Generate employee ID before saving
employeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const prefix = this.role === 'WORKER' ? 'WRK' : 'INS';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.employeeId = `${prefix}${randomNum}`;
  }
  
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  
  next();
});

// Method to compare password
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if worker is available for new assignment
employeeSchema.methods.isAvailableForAssignment = function() {
  return this.status === 'ACTIVE' && this.currentLoad < this.maxCapacity;
};

// Method to calculate distance from a point (Haversine formula)
employeeSchema.methods.getDistanceFromPoint = function(lat, lng) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat - this.workLocation.latitude) * Math.PI / 180;
  const dLng = (lng - this.workLocation.longitude) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.workLocation.latitude * Math.PI / 180) * 
    Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Method to check if issue is within worker's service area
employeeSchema.methods.canHandleIssueAtLocation = function(lat, lng) {
  const distance = this.getDistanceFromPoint(lat, lng);
  return distance <= this.workLocation.radiusKm;
};

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
