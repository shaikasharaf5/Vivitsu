import express from 'express';
import multer from 'multer';
import stringSimilarity from 'string-similarity';
import Issue from '../models/Issue.js';
import ImageHash from '../models/ImageHash.js';
import { authenticate } from '../middleware/auth.js';
import {
  calculateAHash,
  calculateDHash,
  calculateMD5Hash,
  getImageMetadata,
  validateImageFile,
  findSimilarImages
} from '../utils/imageProcessing.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryService.js';
import { performLocalImageChecks } from '../utils/aiImageCheck.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = process.env.UPLOAD_FOLDER || 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`✅ Created uploads directory: ${uploadsDir}`);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_IMAGE_SIZE || 5242880) },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.'));
    }
  }
});

// Get all issues
router.get('/', async (req, res) => {
  try {
    const { sort, category, status, city } = req.query;
    const query = {};
    
    if (category) query.category = { $in: category.split(',') };
    if (status) query.status = { $in: status.split(',') };
    if (city) query.city = city;

    let issues = await Issue.find(query)
      .populate('reportedBy', 'firstName lastName avatar')
      .lean();

    if (sort === 'trending') {
      issues = issues.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      issues = issues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json(issues);
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single issue
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'firstName lastName avatar')
      .populate('comments.author', 'firstName lastName avatar');
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    console.error('Get single issue error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create issue with image duplicate detection
router.post('/', authenticate, upload.array('photos', 5), async (req, res) => {
  const uploadedImages = [];
  let tempIssue = null;

  try {
    const { title, description, category, latitude, longitude, address, priority } = req.body;
    const PHASH_THRESHOLD = parseInt(process.env.PHASH_THRESHOLD || 10);

    console.log('\n📝 Creating new issue...');
    console.log(`   Title: ${title}`);
    console.log(`   Category: ${category}`);
    console.log(`   Files uploaded: ${req.files ? req.files.length : 0}`);

    // Step 1: Validate required fields
    if (!title || !description || !category || !latitude || !longitude) {
      throw new Error('Missing required fields: title, description, category, latitude, longitude');
    }

    // Step 2: Check for text duplicate issues
    const recentIssues = await Issue.find({
      category,
      createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
    });

    const textDuplicates = recentIssues.map(issue => ({
      issue,
      score: (
        stringSimilarity.compareTwoStrings(title, issue.title) * 0.3 +
        stringSimilarity.compareTwoStrings(description, issue.description) * 0.7
      )
    })).filter(d => d.score > 0.75);

    if (textDuplicates.length > 0) {
      console.log(`⚠️ Text duplicate detected`);
      // Clean up uploaded files
      if (req.files) {
        req.files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.error('Error deleting temp file:', e.message);
          }
        });
      }

      return res.status(200).json({
        isDuplicate: true,
        duplicateIssue: textDuplicates[0].issue,
        message: 'Similar issue already exists'
      });
    }

    // Step 3: Create issue in MongoDB FIRST (before processing images)
    const issue = new Issue({
      title,
      description,
      category,
      priority: priority || 'MEDIUM',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address,
      photos: [], // Will be populated after upload
      reportedBy: req.user._id,
      city: req.user.city,
      status: 'REPORTED'
    });

    await issue.save();
    tempIssue = issue;
    console.log(`✅ Issue created in DB: ${issue._id}`);

    // Step 4: Process images (now we have issue ID for Cloudinary folder)
    const processedPhotos = [];
    const imageDuplicates = [];

    if (req.files && req.files.length > 0) {
      console.log(`\n🖼️ Processing ${req.files.length} image(s)...`);

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const filePath = file.path;

        try {
          console.log(`\n📷 Image ${i + 1}/${req.files.length}`);
          console.log(`   Original name: ${file.originalname}`);
          console.log(`   File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

          // Step 4a: Validate image file
          const validation = validateImageFile(filePath, parseInt(process.env.MAX_IMAGE_SIZE || 5242880));
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          // Step 4b: Get metadata
          const metadata = await getImageMetadata(filePath);
          if (!metadata) {
            throw new Error('Could not read image metadata');
          }

          console.log(`   Dimensions: ${metadata.width}x${metadata.height}`);

          // Step 4c: Perform local checks
          const localChecks = performLocalImageChecks(metadata);
          if (!localChecks.isValidDimensions || !localChecks.isValidSize) {
            throw new Error(localChecks.issues.join(', '));
          }

          // Step 4d: Calculate hashes for duplicate detection
          console.log(`   🔐 Calculating image hashes...`);
          const aHash = await calculateAHash(filePath);
          const dHash = await calculateDHash(filePath);
          const md5 = await calculateMD5Hash(filePath);

          console.log(`   ✅ Hashes calculated`);
          console.log(`      aHash: ${aHash.substring(0, 16)}...`);
          console.log(`      dHash: ${dHash.substring(0, 16)}...`);

          // Step 4e: Check for duplicate images
          console.log(`   🔍 Checking for duplicate images...`);
          try {
            const storedHashes = await ImageHash.find(
              {
                $or: [
                  { aHash: { $exists: true } },
                  { dHash: { $exists: true } }
                ]
              },
              { aHash: 1, dHash: 1, md5: 1, issueId: 1, cloudinaryUrl: 1 }
            ).lean();

            const currentHash = { aHash, dHash, md5 };
            const similarImages = findSimilarImages(currentHash, storedHashes, PHASH_THRESHOLD);

            if (similarImages.length > 0) {
              console.log(`   ⚠️ Similar image found: ${similarImages[0].similarity?.toFixed(0) || 'N/A'}% match`);
              const bestMatch = similarImages[0];
              imageDuplicates.push({
                issueId: bestMatch.issueId,
                url: bestMatch.cloudinaryUrl,
                similarity: bestMatch.isExactDuplicate ? 100 : (bestMatch.similarity || 0)
              });
            } else {
              console.log(`   ✅ No duplicates found`);
            }
          } catch (hashError) {
            console.error(`   ⚠️ Error during duplicate check: ${hashError.message}`);
            // Don't fail the upload if duplicate check fails
          }

          // Step 4f: Upload to Cloudinary
          console.log(`   ☁️ Uploading to Cloudinary...`);
          const cloudinaryResult = await uploadToCloudinary(filePath, issue._id, i);
          
          uploadedImages.push({
            filePath,
            cloudinaryResult,
            aHash,
            dHash,
            md5,
            metadata
          });

          processedPhotos.push({
            url: cloudinaryResult.url,
            publicId: cloudinaryResult.publicId,
            flaggedAsUnsafe: false,
            unsafeReason: null,
            aiCheckPerformed: true,
            aiConfidence: 0
          });

          console.log(`   ✅ Successfully uploaded`);

        } catch (error) {
          console.error(`   ❌ Error processing image ${i + 1}:`, error.message);
          
          // Delete from Cloudinary if already uploaded
          if (uploadedImages[i]) {
            try {
              await deleteFromCloudinary(uploadedImages[i].cloudinaryResult.publicId);
            } catch (delError) {
              console.error('Error cleaning up Cloudinary:', delError.message);
            }
          }
          
          throw error;
        }
      }
    } else {
      console.log(`\n⚠️ No images provided for this issue`);
    }

    // Step 5: Update issue with photo URLs
    issue.photos = processedPhotos.map(p => p.url);
    await issue.save();
    
    console.log(`\n✅ Issue photos updated with URLs:`);
    issue.photos.forEach((url, idx) => {
      console.log(`   Photo ${idx + 1}: ${url}`);
    });

    // Step 6: Store image hashes for future duplicate detection
    for (let i = 0; i < uploadedImages.length; i++) {
      const img = uploadedImages[i];
      const photo = processedPhotos[i];

      try {
        const imageHash = new ImageHash({
          issueId: issue._id,
          cloudinaryUrl: photo.url,
          cloudinaryPublicId: photo.publicId,
          aHash: img.aHash,
          dHash: img.dHash,
          md5: img.md5,
          fileSize: img.cloudinaryResult.size,
          width: img.cloudinaryResult.width,
          height: img.cloudinaryResult.height,
          format: img.cloudinaryResult.format,
          flaggedAsUnsafe: false,
          unsafeReason: null,
          aiCheckPerformed: true,
          aiConfidence: 0
        });

        await imageHash.save();
        console.log(`✅ Image hash stored for future duplicate detection`);
      } catch (hashError) {
        console.error('Error saving image hash:', hashError.message);
        // Don't fail the whole operation if hash storage fails
      }
    }

    // Step 7: Clean up temporary files
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          console.error('Error deleting temp file:', e.message);
        }
      });
    }

    // Step 8: Emit real-time event
    const io = req.app.get('io');
    io.emit('issueCreated', { issue });

    console.log(`\n✅ Issue creation completed successfully\n`);

    // Return response
    res.status(201).json({
      issue,
      imageDuplicates: imageDuplicates.length > 0 ? imageDuplicates : null,
      imageQualityFlags: []
    });

  } catch (error) {
    console.error('\n❌ Issue creation failed:', error.message);

    // Rollback: Delete uploaded images from Cloudinary
    for (const img of uploadedImages) {
      try {
        await deleteFromCloudinary(img.cloudinaryResult.publicId);
      } catch (e) {
        console.error('Error cleaning up Cloudinary:', e.message);
      }
    }

    // Rollback: Delete issue from MongoDB if created
    if (tempIssue) {
      try {
        await Issue.findByIdAndDelete(tempIssue._id);
        await ImageHash.deleteMany({ issueId: tempIssue._id });
        console.log('✅ Rolled back issue creation');
      } catch (e) {
        console.error('Error rolling back issue:', e.message);
      }
    }

    // Clean up temp files
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          console.error('Error deleting temp file:', e.message);
        }
      });
    }

    res.status(500).json({ error: error.message });
  }
});

// Upvote issue
router.patch('/:id/upvote', authenticate, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const hasUpvoted = issue.upvotedBy.includes(req.user._id);
    
    if (hasUpvoted) {
      issue.upvotedBy = issue.upvotedBy.filter(id => !id.equals(req.user._id));
      issue.upvotes -= 1;
    } else {
      issue.upvotedBy.push(req.user._id);
      issue.upvotes += 1;
    }

    await issue.save();

    const io = req.app.get('io');
    io.emit('issueUpvoted', { issueId: issue._id, upvotes: issue.upvotes });

    res.json({ upvotes: issue.upvotes, hasUpvoted: !hasUpvoted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    issue.comments.push({
      text: req.body.text,
      author: req.user._id
    });

    await issue.save();

    const io = req.app.get('io');
    io.emit('commentAdded', { issueId: issue._id });

    res.status(201).json(issue.comments[issue.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
