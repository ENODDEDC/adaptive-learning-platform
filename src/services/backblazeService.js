import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

class BackblazeService {
  constructor() {
    console.log('🔧 Backblaze Service Initializing...');
    console.log('Environment Variables:', {
      B2_ENDPOINT: process.env.B2_ENDPOINT,
      B2_KEY_ID: process.env.B2_KEY_ID,
      B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY ? '[HIDDEN]' : 'NOT SET',
      B2_BUCKET_NAME: process.env.B2_BUCKET_NAME,
    });

    // Validate required environment variables
    if (!process.env.B2_KEY_ID || !process.env.B2_APPLICATION_KEY || !process.env.B2_BUCKET_NAME || !process.env.B2_ENDPOINT) {
      throw new Error('Missing required Backblaze B2 environment variables');
    }

    // Validate credential format
    if (!process.env.B2_KEY_ID.startsWith('005') || process.env.B2_APPLICATION_KEY.length < 20) {
      console.warn('⚠️ Backblaze B2 credentials may be in incorrect format');
    }

    try {
      this.client = new S3Client({
        endpoint: process.env.B2_ENDPOINT,
        region: 'us-east-005', // Updated to match your actual Backblaze B2 region
        credentials: {
          accessKeyId: process.env.B2_KEY_ID,
          secretAccessKey: process.env.B2_APPLICATION_KEY,
        },
        forcePathStyle: true, // Required for Backblaze B2
        // Additional configuration for better compatibility
        maxAttempts: 3,
        retryMode: 'adaptive',
      });
      this.bucketName = process.env.B2_BUCKET_NAME;
      console.log('✅ Backblaze Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Backblaze Service:', error);
      throw error;
    }
  }

  /**
   * Upload a file to Backblaze B2
   * @param {Buffer} fileBuffer - The file buffer
   * @param {string} fileName - The file name
   * @param {string} contentType - The MIME type of the file
   * @param {string} folder - Optional folder path (e.g., 'classwork', 'courses/123')
   * @returns {Promise<{url: string, key: string}>}
   */
  async uploadFile(fileBuffer, fileName, contentType, folder = 'uploads') {
    try {
      console.log('Starting upload:', { fileName, contentType, folder, bufferSize: fileBuffer.length });

      // Generate a unique file key
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileKey = `${folder}/${timestamp}_${sanitizedFileName}`;

      console.log('Upload details:', {
        bucketName: this.bucketName,
        fileKey,
        endpoint: process.env.B2_ENDPOINT
      });

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: contentType,
        // Remove ACL for Backblaze B2 - it doesn't support ACL like AWS S3
      });

      const result = await this.client.send(command);
      console.log('Upload successful:', result);

      // Since your bucket is private, we'll use our API endpoint to generate fresh presigned URLs
      // This ensures files are always accessible even if presigned URLs expire
      console.log('🔍 Environment variables:', {
        RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
        VERCEL_URL: process.env.VERCEL_URL,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL
      });
      
      let baseUrl;
      if (process.env.RENDER_EXTERNAL_URL) {
        const renderUrl = process.env.RENDER_EXTERNAL_URL;
        console.log('🔍 RENDER_EXTERNAL_URL value:', renderUrl);
        console.log('🔍 Starts with http?', renderUrl.startsWith('http'));
        
        // Check if it already has https://, if so use as-is, otherwise add it
        baseUrl = renderUrl.startsWith('http') 
          ? renderUrl 
          : `https://${renderUrl}`;
      } else if (process.env.VERCEL_URL) {
        baseUrl = process.env.VERCEL_URL.startsWith('http')
          ? process.env.VERCEL_URL
          : `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      }
      
      console.log('🌐 Base URL constructed:', baseUrl);
      
      const apiUrl = `${baseUrl}/api/files/${encodeURIComponent(fileKey)}`;

      console.log('🔗 Generated file URL:', apiUrl);
      console.log('🔑 File key:', fileKey);

      return {
        url: apiUrl,
        key: fileKey,
        fileName: sanitizedFileName,
        originalName: fileName,
        size: fileBuffer.length,
        contentType,
      };
    } catch (error) {
      console.error('Error uploading file to Backblaze B2:', error);
      console.error('Full error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId,
        hostname: error.hostname,
        region: error.region,
        retryable: error.retryable,
        stack: error.stack
      });
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete a file from Backblaze B2
   * @param {string} fileKey - The file key to delete
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting file from Backblaze B2:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file data for direct serving
   * @param {string} fileKey - The file key
   * @returns {Promise<{Body: ReadableStream, ContentType: string}>}
   */
  async getFileData(fileKey) {
    try {
      console.log('🔍 Getting file data for key:', fileKey);
      console.log('🔍 Bucket name:', this.bucketName);
      console.log('🔍 Client configured:', !!this.client);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      console.log('📡 Sending GetObjectCommand to Backblaze B2...');
      console.log('📡 Command details:', {
        Bucket: this.bucketName,
        Key: fileKey
      });
      
      const response = await this.client.send(command);
      
      console.log('✅ File data retrieved:', {
        ContentType: response.ContentType,
        ContentLength: response.ContentLength,
        LastModified: response.LastModified,
        ETag: response.ETag
      });

      return {
        Body: response.Body,
        ContentType: response.ContentType,
        ContentLength: response.ContentLength,
      };
    } catch (error) {
      console.error('❌ Error getting file data:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        key: fileKey,
        bucket: this.bucketName,
        name: error.name,
        $fault: error.$fault,
        $metadata: error.$metadata
      });
      
      // Check if it's a "NoSuchKey" error (file doesn't exist)
      if (error.name === 'NoSuchKey' || error.code === 'NoSuchKey') {
        throw new Error(`File not found: ${fileKey}`);
      }
      
      // Check if it's an access denied error
      if (error.name === 'AccessDenied' || error.code === 'AccessDenied') {
        throw new Error(`Access denied to file: ${fileKey}`);
      }
      
      throw new Error(`Failed to get file data: ${error.message}`);
    }
  }

  /**
   * Get file stream for direct serving (fallback method)
   * @param {string} fileKey - The file key
   * @returns {Promise<ReadableStream>}
   */
  async getFileStream(fileKey) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const response = await this.client.send(command);
      return response.Body;
    } catch (error) {
      console.error('Error getting file stream:', error);
      throw new Error(`Failed to get file stream: ${error.message}`);
    }
  }

  /**
   * Get file as buffer for processing (e.g., PowerPoint conversion)
   * @param {string} fileKey - The file key
   * @returns {Promise<Buffer>}
   */
  async getFileBuffer(fileKey) {
    try {
      console.log('🔍 Getting file buffer for key:', fileKey);
      console.log('📊 This will count as 1 Class B (Download) operation');
      
      // Validate fileKey
      if (!fileKey) {
        throw new Error('File key is required');
      }
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const response = await this.client.send(command);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      console.log('✅ File buffer retrieved, size:', buffer.length, 'bytes');
      console.log('💰 Class B operation completed - this counts toward your daily quota');
      
      return buffer;
    } catch (error) {
      console.error('❌ Error getting file buffer:', error);
      console.error('❌ File key attempted:', fileKey);
      console.error('❌ Error code:', error.Code || error.name);
      
      if (error.Code === 'NoSuchKey' || error.name === 'NoSuchKey') {
        throw new Error(`File not found in storage: ${fileKey}`);
      }
      
      throw new Error(`Failed to get file buffer: ${error.message}`);
    }
  }

  /**
   * Upload multiple files
   * @param {Array} files - Array of file objects with {buffer, name, contentType}
   * @param {string} folder - Optional folder path
   * @returns {Promise<Array>}
   */
  async uploadMultipleFiles(files, folder = 'uploads') {
    try {
      const uploadPromises = files.map(file => 
        this.uploadFile(file.buffer, file.name, file.contentType, folder)
      );

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw new Error(`Failed to upload files: ${error.message}`);
    }
  }
}

// Export a singleton instance
const backblazeService = new BackblazeService();
export default backblazeService;