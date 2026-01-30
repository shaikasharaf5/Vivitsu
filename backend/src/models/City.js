import mongoose from 'mongoose';

const citySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  state: { 
    type: String, 
    required: true,
    trim: true
  },
  country: { 
    type: String, 
    required: true,
    default: 'India'
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  municipalAdmin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  population: Number,
  area: Number, // in sq km
  metadata: {
    website: String,
    contactEmail: String,
    contactPhone: String,
    emergencyNumber: String
  }
}, { timestamps: true });

// Indexes for efficient queries (unique constraint on name via index)
citySchema.index({ name: 1 }, { unique: true });
citySchema.index({ status: 1 });

export default mongoose.model('City', citySchema);
