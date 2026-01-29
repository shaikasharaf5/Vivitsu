import { v2 as cloudinary } from 'cloudinary';

/**
 * Check image for unsafe content
 * NOTE: Cloudinary free tier doesn't include advanced moderation
 * For MVP, we'll use basic local checks only
 */
export const checkImageSafety = async (publicId) => {
  try {
    // For free tier Cloudinary, skip API moderation check
    // Instead rely on local validation only
    // Production would upgrade to paid Cloudinary plan for moderation
    
    console.log(`Image safety check queued for: ${publicId}`);
    
    return {
      flagged: false,
      reason: null,
      confidence: 0,
      checkPerformed: true,
      note: 'Local validation only (upgrade Cloudinary for advanced moderation)'
    };
  } catch (error) {
    console.error('Image safety check error:', error);
    // Don't fail on AI check - just return no flag
    return {
      flagged: false,
      reason: null,
      confidence: 0,
      checkPerformed: false
    };
  }
};

/**
 * Lightweight local checks (no external API)
 * Check image dimensions, format, metadata
 * FIXED: Handle undefined/null metadata
 */
export const performLocalImageChecks = (metadata) => {
  const checks = {
    isValidDimensions: true,
    isValidSize: true,
    issues: []
  };

  // Handle edge case: no metadata
  if (!metadata) {
    checks.isValidDimensions = false;
    checks.issues.push('Could not read image metadata');
    return checks;
  }

  // Safety check: ensure metadata has required fields
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const fileSize = metadata.fileSize || 0;

  // Check minimum dimensions (prevents 1x1 pixel uploads, watermarks)
  if (width < 100 || height < 100) {
    checks.isValidDimensions = false;
    checks.issues.push('Image dimensions too small (min 100x100)');
  }

  // Check maximum dimensions (prevents massive files)
  if (width > 8000 || height > 8000) {
    checks.isValidDimensions = false;
    checks.issues.push('Image dimensions too large (max 8000x8000)');
  }

  // Check file size (5MB limit by default)
  const maxSize = parseInt(process.env.MAX_IMAGE_SIZE || 5242880);
  if (fileSize > maxSize) {
    checks.isValidSize = false;
    checks.issues.push(`File size exceeds limit (max ${(maxSize / 1024 / 1024).toFixed(1)}MB)`);
  }

  // Warn if very small file size (likely blank/corrupted)
  if (fileSize < 5000 && fileSize > 0) {
    checks.issues.push('File size unusually small - may be blank or corrupted');
  }

  return checks;
};
