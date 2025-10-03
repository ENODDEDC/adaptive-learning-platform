import { NextResponse } from 'next/server';
import backblazeService from '@/services/backblazeService';
import { verifyToken } from '@/utils/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export async function POST(request) {
  let tempInputFile = null;
  let tempOutputFile = null;

  console.log('🚀 DOCX Convert API route hit!');
  
  try {
    console.log('🔍 DOCX Convert API called');
    console.log('🔍 Request method:', request.method);
    console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Verify authentication
    let payload;
    try {
      payload = await verifyToken();
      if (!payload) {
        console.error('❌ Convert failed: Unauthorized');
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      console.log('✅ Authentication successful for user:', payload.userId);
    } catch (authError) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json({ message: 'Authentication failed', error: authError.message }, { status: 401 });
    }

    let requestBody;
    try {
      requestBody = await request.json();
      console.log('🔍 Request body:', requestBody);
    } catch (jsonError) {
      console.error('❌ Invalid JSON in request body:', jsonError);
      return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { fileKey } = requestBody;
    console.log('🔍 Converting file with key:', fileKey);
    console.log('🔍 File key type:', typeof fileKey);
    console.log('🔍 File key length:', fileKey?.length);
    
    if (!fileKey) {
      console.error('❌ No file key provided');
      return NextResponse.json({ message: 'File key is required' }, { status: 400 });
    }

    // Decode the file key in case it's URL encoded
    const decodedKey = decodeURIComponent(fileKey);
    console.log('🔍 Decoded file key:', decodedKey);

    // Get file from Backblaze B2
    console.log('📁 Getting file data from Backblaze B2...');
    console.log('📁 Using file key:', decodedKey);
    
    let fileData;
    try {
      fileData = await backblazeService.getFileData(decodedKey);
      console.log('✅ File data retrieved successfully');
    } catch (fileError) {
      console.error('❌ Error getting file from Backblaze:', fileError);
      return NextResponse.json({ 
        message: 'Failed to retrieve file from storage', 
        error: fileError.message,
        fileKey: decodedKey
      }, { status: 404 });
    }
    
    // Create temporary files
    const tempId = uuidv4();
    const tempDir = path.join(process.cwd(), 'temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    tempInputFile = path.join(tempDir, `${tempId}.docx`);
    tempOutputFile = path.join(tempDir, `${tempId}.html`);
    
    console.log('💾 Writing file to temp location:', tempInputFile);
    
    // Convert stream to buffer and write to temp file
    let buffer;
    
    if (fileData.Body.pipe) {
      // Node.js stream (from AWS SDK)
      console.log('🔍 Processing Node.js stream');
      const chunks = [];
      
      for await (const chunk of fileData.Body) {
        chunks.push(chunk);
      }
      
      buffer = Buffer.concat(chunks);
    } else if (fileData.Body.getReader) {
      // Web ReadableStream
      console.log('🔍 Processing Web ReadableStream');
      const chunks = [];
      const reader = fileData.Body.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      buffer = Buffer.concat(chunks);
    } else if (Buffer.isBuffer(fileData.Body)) {
      // Already a buffer
      console.log('🔍 Processing Buffer');
      buffer = fileData.Body;
    } else {
      // Try to convert to buffer
      console.log('🔍 Converting to buffer');
      buffer = Buffer.from(fileData.Body);
    }
    
    console.log('💾 Writing buffer to file, size:', buffer.length);
    fs.writeFileSync(tempInputFile, buffer);
    
    console.log('🔄 Converting DOCX to HTML using Pandoc...');
    
    // Test if Pandoc is accessible
    try {
      console.log('🔍 Testing Pandoc accessibility...');
      await execAsync('pandoc --version');
      console.log('✅ Pandoc is accessible');
    } catch (pandocTestError) {
      console.error('❌ Pandoc test failed:', pandocTestError);
      // Try with full path
      try {
        console.log('🔍 Trying Pandoc with full path...');
        await execAsync('"C:\\Program Files\\Pandoc\\pandoc.exe" --version');
        console.log('✅ Pandoc accessible with full path');
      } catch (fullPathError) {
        console.error('❌ Pandoc not accessible even with full path:', fullPathError);
        throw new Error('Pandoc is not accessible. Please ensure it is installed and in PATH.');
      }
    }
    
    // Convert using Pandoc - try both regular command and full path
    let pandocCommand = `pandoc "${tempInputFile}" -t html --wrap=none --extract-media="${tempDir}" -o "${tempOutputFile}"`;
    console.log('📝 Pandoc command:', pandocCommand);
    
    try {
      await execAsync(pandocCommand);
    } catch (pandocError) {
      console.error('❌ Pandoc command failed, trying with full path:', pandocError);
      // Try with full path
      pandocCommand = `"C:\\Program Files\\Pandoc\\pandoc.exe" "${tempInputFile}" -t html --wrap=none --extract-media="${tempDir}" -o "${tempOutputFile}"`;
      console.log('📝 Pandoc command (full path):', pandocCommand);
      await execAsync(pandocCommand);
    }
    
    // Read the converted HTML
    if (!fs.existsSync(tempOutputFile)) {
      throw new Error('Pandoc conversion failed - output file not created');
    }
    
    const htmlContent = fs.readFileSync(tempOutputFile, 'utf8');
    console.log('✅ DOCX converted successfully');
    
    return NextResponse.json({
      success: true,
      html: htmlContent
    });

  } catch (error) {
    console.error('❌ Error converting DOCX:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      stdout: error.stdout,
      stderr: error.stderr
    });
    
    let errorMessage = 'Failed to convert document';
    let statusCode = 500;
    
    if (error.message.includes('File not found') || error.message.includes('NoSuchKey')) {
      errorMessage = `File not found: ${fileKey || 'unknown key'}`;
      statusCode = 404;
    } else if (error.message.includes('Access denied') || error.message.includes('AccessDenied')) {
      errorMessage = 'Access denied to file';
      statusCode = 403;
    } else if (error.message.includes('pandoc') || error.message.includes('command not found')) {
      errorMessage = 'Pandoc is not installed or not accessible';
      statusCode = 500;
    } else if (error.code === 'ENOENT') {
      errorMessage = 'Required system command not found (possibly Pandoc)';
      statusCode = 500;
    } else if (error.stderr) {
      errorMessage = `Conversion failed: ${error.stderr}`;
      statusCode = 500;
    }
    
    const errorResponse = {
      success: false,
      message: errorMessage,
      error: error.message,
      fileKey: fileKey || 'not provided',
      details: {
        name: error.name,
        code: error.code,
        stdout: error.stdout,
        stderr: error.stderr
      }
    };
    
    console.error('❌ Sending error response:', errorResponse);
    
    return NextResponse.json(errorResponse, { status: statusCode });
  } finally {
    // Clean up temporary files
    try {
      if (tempInputFile && fs.existsSync(tempInputFile)) {
        fs.unlinkSync(tempInputFile);
        console.log('🗑️ Cleaned up temp input file');
      }
      if (tempOutputFile && fs.existsSync(tempOutputFile)) {
        fs.unlinkSync(tempOutputFile);
        console.log('🗑️ Cleaned up temp output file');
      }
    } catch (cleanupError) {
      console.error('⚠️ Error cleaning up temp files:', cleanupError);
    }
  }
}