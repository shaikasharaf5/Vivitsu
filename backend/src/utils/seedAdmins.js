import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import City from '../models/City.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Default password for all admins (users should change on first login)
const DEFAULT_ADMIN_PASSWORD = 'Admin@123';

/**
 * Generate email from city name
 * Example: Bangalore → bangalore-admin@fixmycity.com
 */
const generateAdminEmail = (cityName) => {
  return `${cityName.toLowerCase()}-admin@fixmycity.com`;
};

/**
 * Seed admin accounts for each city
 */
const seedAdmins = async () => {
  try {
    console.log('\n🔐 Starting Admin Seeding Process...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all cities
    const cities = await City.find({ isActive: true });
    console.log(`📍 Found ${cities.length} active cities\n`);

    if (cities.length === 0) {
      console.warn('⚠️ No cities found. Please seed cities first:');
      console.warn('   npm run seed:cities\n');
      process.exit(1);
    }

    // Hash the default password
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    // Track results
    const results = {
      created: [],
      updated: [],
      failed: [],
      skipped: []
    };

    // Create/update admin for each city
    for (const city of cities) {
      try {
        const adminEmail = generateAdminEmail(city.name);

        console.log(`\n🏢 Processing City: ${city.name}`);
        console.log(`   Admin Email: ${adminEmail}`);

        // Check if admin already exists for this city
        const existingAdmin = await User.findOne({ 
          email: adminEmail,
          isEmployeeAccount: true,
          role: 'ADMIN'
        });

        if (existingAdmin) {
          console.log(`   ✅ Admin already exists (ID: ${existingAdmin._id})`);
          results.skipped.push({
            city: city.name,
            email: adminEmail,
            id: existingAdmin._id
          });
        } else {
          // Create new admin
          const admin = new User({
            email: adminEmail,
            password: hashedPassword,
            firstName: `${city.name}`,
            lastName: 'Administrator',
            phone: '',
            role: 'ADMIN',
            isEmployeeAccount: true,
            employeeId: `ADMIN${city.name.substring(0, 3).toUpperCase()}001`,
            department: 'Administration',
            designation: 'City Administrator',
            assignedCity: city._id,
            joiningDate: new Date(),
            status: 'ACTIVE'
          });

          await admin.save();

          console.log(`   ✅ Admin created successfully`);
          console.log(`      ID: ${admin._id}`);
          console.log(`      Employee ID: ${admin.employeeId}`);

          results.created.push({
            city: city.name,
            email: adminEmail,
            id: admin._id,
            employeeId: admin.employeeId
          });
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.failed.push({
          city: city.name,
          error: error.message
        });
      }
    }

    // Print summary
    console.log('\n\n════════════════════════════════════════════════════════');
    console.log('📊 SEEDING SUMMARY');
    console.log('════════════════════════════════════════════════════════\n');

    console.log(`✅ Created: ${results.created.length} admin(s)`);
    if (results.created.length > 0) {
      results.created.forEach(admin => {
        console.log(`   • ${admin.city}: ${admin.email}`);
        console.log(`     ID: ${admin.id}`);
        console.log(`     Employee ID: ${admin.employeeId}`);
      });
    }

    console.log(`\n⏭️  Already Existed: ${results.skipped.length} admin(s)`);
    if (results.skipped.length > 0) {
      results.skipped.forEach(admin => {
        console.log(`   • ${admin.city}: ${admin.email}`);
      });
    }

    if (results.failed.length > 0) {
      console.log(`\n❌ Failed: ${results.failed.length} admin(s)`);
      results.failed.forEach(item => {
        console.log(`   • ${item.city}: ${item.error}`);
      });
    }

    console.log('\n════════════════════════════════════════════════════════');
    console.log('🔐 DEFAULT LOGIN CREDENTIALS');
    console.log('════════════════════════════════════════════════════════\n');

    console.log(`Password (same for all): ${DEFAULT_ADMIN_PASSWORD}\n`);

    console.log('City Admin Accounts:');
    results.created.concat(results.skipped).forEach(admin => {
      console.log(`   Email: ${admin.email}`);
    });

    console.log('\n⚠️  IMPORTANT:');
    console.log('   1. Each admin should change their password on first login');
    console.log('   2. Admin can create employee accounts for their city');
    console.log('   3. Never share these credentials publicly\n');

    console.log('════════════════════════════════════════════════════════\n');

    console.log('🎉 Admin seeding completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  }
};

// Run the seeding
seedAdmins();
