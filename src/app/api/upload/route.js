import { NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { uploadToS3, generateS3Key } from '../../../utils/s3Utils';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'No files uploaded' }, { status: 400 });
    }

    const uploadedFileUrls = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const originalName = file.name.replace(/\s/g, '_');
      const fileExtension = path.extname(originalName);

      // Upload to S3
      const s3Key = generateS3Key('uploads', fileExtension);
      const uploadResult = await uploadToS3(buffer, s3Key, {
        contentType: file.type || 'application/octet-stream',
        optimize: false // Don't optimize non-image files
      });

      // Also save locally for backward compatibility (can be removed later)
      try {
        const filename = Date.now() + '-' + originalName;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);
      } catch (localError) {
        console.warn('Failed to save locally:', localError.message);
      }

      uploadedFileUrls.push({
        url: uploadResult.url,
        localUrl: `/uploads/${Date.now()}-${originalName}`,
        s3Key: uploadResult.key,
        size: uploadResult.size
      });
    }

    return NextResponse.json({ urls: uploadedFileUrls }, { status: 200 });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ message: 'Failed to upload files', error: error.message }, { status: 500 });
  }
}