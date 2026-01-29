import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Calculate Hamming Distance between two hash strings
 * Lower distance = more similar images
 */
export const hammingDistance = (hash1, hash2) => {
  if (!hash1 || !hash2) return Infinity;
  if (hash1.length !== hash2.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
};

/**
 * Calculate Average Hash (aHash) for image
 * 1. Resize to 8x8
 * 2. Convert to grayscale
 * 3. Calculate average brightness
 * 4. Create 64-bit hash based on pixel comparison
 */
export const calculateAHash = async (filePath) => {
  try {
    const image = sharp(filePath);
    
    // Resize to 8x8 and convert to grayscale
    const resized = await image
      .resize(8, 8, { fit: 'cover' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const data = resized.data;
    const average = data.reduce((a, b) => a + b) / data.length;

    // Create 64-bit hash based on pixel brightness
    let hash = '';
    for (let i = 0; i < data.length; i++) {
      hash += data[i] > average ? '1' : '0';
    }

    return hash;
  } catch (error) {
    console.error('aHash calculation error:', error);
    throw new Error('Failed to calculate aHash');
  }
};

/**
 * Calculate Difference Hash (dHash) for image
 * 1. Resize to 9x8
 * 2. Convert to grayscale
 * 3. Compare adjacent pixels horizontally
 * 4. Create 64-bit hash
 */
export const calculateDHash = async (filePath) => {
  try {
    const image = sharp(filePath);
    
    // Resize to 9x8 for horizontal difference calculation
    const resized = await image
      .resize(9, 8, { fit: 'cover' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const data = resized.data;
    let hash = '';

    // Compare each pixel with right neighbor (horizontal differences)
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const idx = row * 9 + col;
        hash += data[idx] > data[idx + 1] ? '1' : '0';
      }
    }

    return hash;
  } catch (error) {
    console.error('dHash calculation error:', error);
    throw new Error('Failed to calculate dHash');
  }
};

/**
 * Calculate MD5 hash of file for exact duplicate detection
 */
export const calculateMD5Hash = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  } catch (error) {
    console.error('MD5 calculation error:', error);
    return null;
  }
};

/**
 * Get image metadata
 */
export const getImageMetadata = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    const stats = fs.statSync(filePath);
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      fileSize: stats.size
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return null;
  }
};

/**
 * Check for duplicate images based on hash similarity
 * Returns list of potential duplicates with similarity scores
 * Handles edge case: empty database (no images to compare)
 */
export const findSimilarImages = (currentHash, storedHashes, threshold = 10) => {
  // Handle edge case: no images in database yet
  if (!storedHashes || storedHashes.length === 0) {
    console.log('   ℹ️ No images in database yet - skipping duplicate check');
    return [];
  }

  return storedHashes
    .map(stored => {
      // Safety check: ensure hashes exist
      if (!stored.aHash || !stored.dHash) {
        return null;
      }

      return {
        ...stored,
        aHashDistance: hammingDistance(currentHash.aHash, stored.aHash),
        dHashDistance: hammingDistance(currentHash.dHash, stored.dHash),
        // If MD5 matches = exact duplicate (different file, same content)
        isExactDuplicate: currentHash.md5 && stored.md5 && currentHash.md5 === stored.md5
      };
    })
    .filter(item => item !== null) // Remove null entries
    .filter(item => {
      // Exact match takes priority
      if (item.isExactDuplicate) return true;
      
      // Consider similar if either perceptual hash is within threshold
      // Both should be valid numbers
      return (
        (typeof item.aHashDistance === 'number' && item.aHashDistance <= threshold) ||
        (typeof item.dHashDistance === 'number' && item.dHashDistance <= threshold)
      );
    })
    .sort((a, b) => {
      // Exact duplicates first
      if (a.isExactDuplicate && !b.isExactDuplicate) return -1;
      if (!a.isExactDuplicate && b.isExactDuplicate) return 1;
      
      // Then by hash distance
      const aScore = (a.aHashDistance || 0) + (a.dHashDistance || 0);
      const bScore = (b.aHashDistance || 0) + (b.dHashDistance || 0);
      return aScore - bScore;
    });
};

/**
 * Validate image file
 */
export const validateImageFile = (filePath, maxSize) => {
  const stats = fs.statSync(filePath);
  
  if (stats.size > maxSize) {
    return { valid: false, error: 'File size exceeds limit' };
  }

  const validFormats = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(filePath).toLowerCase();
  
  if (!validFormats.includes(ext)) {
    return { valid: false, error: 'Invalid image format' };
  }

  return { valid: true };
};
