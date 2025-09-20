import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import sharp from 'sharp';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'adaptive-learning-platform';

/**
 * Upload buffer to S3 with optional optimization
 */
export async function uploadToS3(buffer, key, options = {}) {
  try {
    // Log inputs for debugging
    console.log('uploadToS3 called with:');
    console.log('- Buffer length:', buffer?.length);
    console.log('- Key:', key);
    console.log('- Options:', options);

    const { contentType = 'image/png', optimize = true, quality = 80, format = 'png' } = options;

    let processedBuffer = buffer;
    let finalContentType = contentType;
    let finalKey = key;

    // Optimize image if requested
    if (optimize && contentType.startsWith('image/')) {
      try {
        const sharpInstance = sharp(buffer);

        // Get image info
        const metadata = await sharpInstance.metadata();
        console.log(`Original image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

        // Keep the same format instead of converting to WebP to avoid confusion
        if (format === 'png' || contentType === 'image/png') {
          processedBuffer = await sharpInstance
            .png({ quality: Math.round(quality) })
            .toBuffer();
          finalContentType = 'image/png';
        } else if (format === 'jpeg' || format === 'jpg' || contentType === 'image/jpeg') {
          processedBuffer = await sharpInstance
            .jpeg({ quality: Math.round(quality) })
            .toBuffer();
          finalContentType = 'image/jpeg';
        } else {
          // Keep original format
          processedBuffer = await sharpInstance.toBuffer();
        }

        console.log(`Optimized image: ${metadata.width}x${metadata.height} -> ${processedBuffer.length} bytes`);
      } catch (error) {
        console.warn('Image optimization failed, using original:', error.message);
        processedBuffer = buffer;
      }
    }

    // Check environment variables
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
    }

    if (!BUCKET_NAME) {
      throw new Error('S3 bucket name not configured. Check AWS_S3_BUCKET_NAME environment variable.');
    }

    console.log(`Uploading to S3: ${BUCKET_NAME}/${finalKey}`);

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: finalKey,
        Body: processedBuffer,
        ContentType: finalContentType,
        ACL: 'public-read', // Make images publicly accessible
        Metadata: {
          originalSize: buffer.length.toString(),
          optimizedSize: processedBuffer.length.toString(),
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    const result = await upload.done();
    console.log('S3 upload completed:', result);

    const uploadResult = {
      url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${finalKey}`,
      key: finalKey,
      size: processedBuffer.length,
      bucket: BUCKET_NAME,
    };

    console.log('Returning uploadResult:', uploadResult);
    return uploadResult;

  } catch (error) {
    console.error('S3 upload failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode
    });
    
    // Re-throw the error so the calling code can handle it
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

/**
 * Delete object from S3
 */
export async function deleteFromS3(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate unique key for S3 object
 */
export function generateS3Key(prefix, extension = '') {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${prefix}/${timestamp}-${random}${extension}`;
}

/**
 * Check if S3 object exists
 */
export async function objectExists(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      return false;
    }
    throw error;
  }
}

/**
 * Get S3 object URL
 */
export function getS3Url(key) {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

export { BUCKET_NAME };