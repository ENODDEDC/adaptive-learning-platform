import { NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

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
      const filename = Date.now() + '-' + file.name.replace(/\s/g, '_');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true }); // Ensure directory exists
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);
      uploadedFileUrls.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ urls: uploadedFileUrls }, { status: 200 });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ message: 'Failed to upload files', error: error.message }, { status: 500 });
  }
}