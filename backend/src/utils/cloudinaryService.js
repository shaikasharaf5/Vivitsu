import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Note: DO NOT configure Cloudinary at module load time
// Configuration happens in initCloudinary() called from server.js

let isCloudinaryConfigured = false;

/**
 * Initialize Cloudinary configuration
 * MUST be called from server.js AFTER dotenv.config()
 */
export const initCloudinary = () => {
  try {
    // Validate environment variables
    const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.error('\n❌ CLOUDINARY ENVIRONMENT VARIABLES MISSING:');
      missing.forEach(key => {
        console.error(`   - ${key} is not set`);
      });
      console.error('\n📝 Instructions:');
      console.error('   1. Go to https://cloudinary.com/console');
      console.error('   2. Copy your Cloud Name, API Key, and API Secret');
      console.error('   3. Add them to your .env file:');
      console.error('      CLOUDINARY_CLOUD_NAME=your_cloud_name');
      console.error('      CLOUDINARY_API_KEY=your_api_key');
      console.error('      CLOUDINARY_API_SECRET=your_api_secret');
      console.error('   4. Restart the server\n');
      console.warn('⚠️ Cloudinary not configured - image uploads will fail\n');
      return false;
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    isCloudinaryConfigured = true;
    console.log('✅ Cloudinary configured successfully');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}\n`);
    return true;

  } catch (error) {
    console.error('❌ Cloudinary config error:', error.message);
    return false;
  }
};

/**
 * Upload image to Cloudinary with error handling
 */
export const uploadToCloudinary = async (filePath, issueId, photoIndex) => {
  let uploadResult = null;
  
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured) {
      throw new Error('Cloudinary is not configured. Check your environment variables.');
    }

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(`📤 Uploading image ${photoIndex + 1} to Cloudinary...`);
    console.log(`   File path: ${filePath}`);
    console.log(`   Issue ID: ${issueId}`);

    // Upload to Cloudinary
    uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: `fixmycity/issues/${issueId || 'temp'}`,
      public_id: `photo_${photoIndex}_${Date.now()}`,
      resource_type: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto',
      timeout: 60000 // 60 second timeout
    });

    console.log(`✅ Image uploaded successfully`);
    console.log(`   URL: ${uploadResult.secure_url}`);
    console.log(`   Public ID: ${uploadResult.public_id}`);

    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      size: uploadResult.bytes,
      format: uploadResult.format
    };

  } catch (error) {
    console.error(`❌ Cloudinary upload error for image ${photoIndex}:`, error.message);
    console.error('   Error details:', error);
    throw new Error(`Failed to upload image ${photoIndex + 1}: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      console.warn('⚠️ No publicId provided for deletion');
      return false;
    }

    if (!isCloudinaryConfigured) {
      console.warn('⚠️ Cloudinary not configured - cannot delete');
      return false;
    }

    console.log(`🗑️  Deleting from Cloudinary: ${publicId}`);
    
    await cloudinary.uploader.destroy(publicId);
    
    console.log(`✅ Deleted successfully: ${publicId}`);
    return true;

  } catch (error) {
    console.error(`❌ Error deleting from Cloudinary: ${publicId}`, error.message);
    // Don't throw - deletion failure shouldn't block other operations
    return false;
  }
};

/**
 * Get optimized image URL with transformations
 */
export const getOptimizedImageUrl = (publicId, options = {}) => {
  try {
    if (!isCloudinaryConfigured) {
      console.warn('⚠️ Cloudinary not configured');
      return null;
    }

    const {
      width = 400,
      height = 300,
      quality = 'auto',
      format = 'auto'
    } = options;

    const url = cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality,
      fetch_format: format,
      secure: true
    });

    return url;
  } catch (error) {
    console.error('Error generating optimized URL:', error);
    return null;
  }
};

/**
 * Check Cloudinary connection and credentials
 */
export const checkCloudinaryConnection = async () => {
  try {
    if (!isCloudinaryConfigured) {
      console.error('❌ Cloudinary not initialized - call initCloudinary() first');
      return false;
    }

    // Try to get API usage
    const response = await cloudinary.api.usage();
    console.log('✅ Cloudinary connection successful');
    console.log(`   Cloud name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   API usage: ${response.requests} requests this month\n`);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    console.error('   Check your CLOUDINARY_CLOUD_NAME, API_KEY, and API_SECRET\n');
    return false;
  }
};
