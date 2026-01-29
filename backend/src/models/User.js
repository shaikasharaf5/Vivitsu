import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: String,
  avatar: String,
  role: { 
    type: String, 
    enum: ['CITIZEN', 'WORKER', 'CONTRACTOR', 'INSPECTOR', 'ADMIN'],
    default: 'CITIZEN'
  },
  city: { type: String, default: 'Bangalore' },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SUSPENDED', 'DELETED'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
