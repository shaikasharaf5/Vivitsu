import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

import User from './models/User.js';
import City from './models/City.js';
import Issue from './models/Issue.js';
import Assignment from './models/Assignment.js';

console.log('🔄 Starting database migration to multi-city schema...\n');

async function migrate() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create Super Admin if doesn't exist
    console.log('👑 Step 1: Creating Super Admin...');
    const existingSuperAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    
    if (!existingSuperAdmin) {
      const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
      const superAdmin = new User({
        email: 'superadmin@fixmycity.gov.in',
        password: superAdminPassword,
        firstName: 'Super',
        lastName: 'Administrator',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isSystemGenerated: false
      });
      await superAdmin.save();
      console.log('✅ Super Admin created');
      console.log('   Email: superadmin@fixmycity.gov.in');
      console.log('   Password: SuperAdmin@123');
      console.log('   ⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!\n');
    } else {
      console.log('✅ Super Admin already exists\n');
    }

    // Step 2: Create default cities if none exist
    console.log('🏙️  Step 2: Creating default cities...');
    const existingCities = await City.countDocuments();
    
    if (existingCities === 0) {
      const defaultCities = [
        {
          name: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          coordinates: { latitude: 12.9716, longitude: 77.5946 },
          status: 'ACTIVE'
        },
        {
          name: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          coordinates: { latitude: 19.0760, longitude: 72.8777 },
          status: 'ACTIVE'
        },
        {
          name: 'Delhi',
          state: 'Delhi',
          country: 'India',
          coordinates: { latitude: 28.7041, longitude: 77.1025 },
          status: 'ACTIVE'
        },
        {
          name: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          coordinates: { latitude: 13.0827, longitude: 80.2707 },
          status: 'ACTIVE'
        },
        {
          name: 'Kolkata',
          state: 'West Bengal',
          country: 'India',
          coordinates: { latitude: 22.5726, longitude: 88.3639 },
          status: 'ACTIVE'
        },
        {
          name: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          coordinates: { latitude: 17.3850, longitude: 78.4867 },
          status: 'ACTIVE'
        }
      ];

      await City.insertMany(defaultCities);
      console.log(`✅ Created ${defaultCities.length} default cities`);
      defaultCities.forEach(city => {
        console.log(`   - ${city.name}, ${city.state}`);
      });
      console.log('');
    } else {
      console.log(`✅ ${existingCities} cities already exist\n`);
    }

    // Step 3: Migrate existing users
    console.log('👥 Step 3: Migrating existing users...');
    const usersWithLegacyCity = await User.find({ 
      city: { $exists: true, $ne: null },
      assignedCity: { $exists: false }
    });

    let migratedUsers = 0;
    for (const user of usersWithLegacyCity) {
      // Find city by name
      const city = await City.findOne({ name: user.city });
      if (city) {
        user.assignedCity = city._id;
        await user.save();
        migratedUsers++;
      } else {
        console.log(`   ⚠️  Warning: City '${user.city}' not found for user ${user.email}`);
      }
    }
    console.log(`✅ Migrated ${migratedUsers} users with city assignments\n`);

    // Step 4: Migrate existing issues
    console.log('📋 Step 4: Migrating existing issues...');
    const issuesWithLegacyCity = await Issue.find({ 
      city: { $type: 'string' }
    });

    let migratedIssues = 0;
    for (const issue of issuesWithLegacyCity) {
      // Find city by name
      const city = await City.findOne({ name: issue.city });
      if (city) {
        issue.city = city._id;
        await issue.save();
        migratedIssues++;
      } else {
        console.log(`   ⚠️  Warning: City '${issue.city}' not found for issue ${issue._id}`);
      }
    }
    console.log(`✅ Migrated ${migratedIssues} issues with city references\n`);

    // Step 5: Add city reference to assignments
    console.log('📑 Step 5: Updating assignments with city references...');
    const assignmentsWithoutCity = await Assignment.find({ 
      city: { $exists: false }
    }).populate('issue');

    let updatedAssignments = 0;
    for (const assignment of assignmentsWithoutCity) {
      if (assignment.issue && assignment.issue.city) {
        assignment.city = assignment.issue.city;
        await assignment.save();
        updatedAssignments++;
      }
    }
    console.log(`✅ Updated ${updatedAssignments} assignments with city references\n`);

    // Step 6: Create municipal admins for cities without admins
    console.log('🏛️  Step 6: Creating municipal admins for cities...');
    const citiesWithoutAdmin = await City.find({ municipalAdmin: { $exists: false } });
    
    let createdAdmins = 0;
    for (const city of citiesWithoutAdmin) {
      const adminPassword = await bcrypt.hash(`Admin@${city.name}123`, 10);
      const admin = new User({
        email: `admin@${city.name.toLowerCase().replace(/\s+/g, '')}.gov.in`,
        password: adminPassword,
        firstName: city.name,
        lastName: 'Municipal Admin',
        role: 'ADMIN',
        assignedCity: city._id,
        status: 'ACTIVE',
        isSystemGenerated: false
      });
      await admin.save();
      
      city.municipalAdmin = admin._id;
      await city.save();
      
      createdAdmins++;
      console.log(`   ✅ Created admin for ${city.name}`);
      console.log(`      Email: ${admin.email}`);
      console.log(`      Password: Admin@${city.name}123`);
    }
    console.log(`\n✅ Created ${createdAdmins} municipal admins\n`);

    // Step 7: Create test citizen user
    console.log('👤 Step 7: Creating test citizen user...');
    const existingCitizen = await User.findOne({ email: 'citizen@test.com' });
    
    if (!existingCitizen) {
      const bangaloreCity = await City.findOne({ name: 'Bangalore' });
      const citizenPassword = await bcrypt.hash('Test@123', 10);
      
      const testCitizen = new User({
        email: 'citizen@test.com',
        password: citizenPassword,
        firstName: 'Test',
        lastName: 'Citizen',
        role: 'CITIZEN',
        assignedCity: bangaloreCity?._id,
        phone: '9876543210',
        status: 'ACTIVE',
        isSystemGenerated: false
      });
      await testCitizen.save();
      console.log('✅ Test citizen created');
      console.log('   Email: citizen@test.com');
      console.log('   Password: Test@123');
      console.log('   City: Bangalore\n');
    } else {
      console.log('✅ Test citizen already exists\n');
    }

    console.log('🎉 Migration completed successfully!\n');
    console.log('📝 IMPORTANT CREDENTIALS:\n');
    console.log('   TEST CITIZEN:');
    console.log('   Email: citizen@test.com');
    console.log('   Password: Test@123\n');
    console.log('   SUPER ADMIN:');
    console.log('   Email: superadmin@fixmycity.gov.in');
    console.log('   Password: SuperAdmin@123\n');
    
    const cities = await City.find().populate('municipalAdmin');
    console.log('   MUNICIPAL ADMINS:');
    cities.forEach(city => {
      if (city.municipalAdmin) {
        console.log(`   - ${city.name}: ${city.municipalAdmin.email}`);
        console.log(`     Password: Admin@${city.name}123`);
      }
    });
    
    console.log('\n⚠️  CHANGE ALL DEFAULT PASSWORDS AFTER FIRST LOGIN!\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrate();
