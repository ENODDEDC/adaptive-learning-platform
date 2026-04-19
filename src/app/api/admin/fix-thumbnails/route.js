import { NextResponse } from 'next/server';
import mongoConfig from '@/config/mongoConfig';
import Content from '@/models/Content';

export async function POST(request) {
  try {
    await mongoConfig();
    console.log('🔧 Starting thumbnail URL cleanup...');

    // Find all content with thumbnailUrl
    const contents = await Content.find({ 
      thumbnailUrl: { $exists: true, $ne: null } 
    });

    console.log(`📊 Found ${contents.length} items with thumbnail URLs`);

    let fixedCount = 0;
    const fixes = [];
    
    for (const content of contents) {
      const oldUrl = content.thumbnailUrl;
      let newUrl = oldUrl;

      // Convert absolute URLs to relative paths
      if (oldUrl.includes('localhost:3000')) {
        // Extract path from localhost URL
        newUrl = oldUrl.replace(/^https?:\/\/localhost:3000/, '');
        fixes.push({ id: content._id, old: oldUrl, new: newUrl, type: 'localhost' });
      } else if (oldUrl.includes('intelevo.onrender.com')) {
        // Extract path from old render URL
        newUrl = oldUrl.replace(/^https?:\/\/intelevo\.onrender\.com/, '');
        fixes.push({ id: content._id, old: oldUrl, new: newUrl, type: 'old-render' });
      } else if (oldUrl.includes('assistive-learning-platform')) {
        // Extract path from current render URL (in case of domain changes)
        newUrl = oldUrl.replace(/^https?:\/\/assistive-learning-platform[^\/]*/, '');
        fixes.push({ id: content._id, old: oldUrl, new: newUrl, type: 'current-render' });
      } else if (oldUrl.startsWith('/')) {
        // Already relative, keep as is
        continue;
      }

      // Update if changed
      if (newUrl !== oldUrl) {
        content.thumbnailUrl = newUrl;
        await content.save();
        fixedCount++;
      }
    }

    console.log(`✅ Fixed ${fixedCount} thumbnail URLs`);
    
    return NextResponse.json({ 
      success: true,
      message: `Fixed ${fixedCount} thumbnail URLs`,
      totalFound: contents.length,
      fixes: fixes
    });
    
  } catch (error) {
    console.error('❌ Error fixing thumbnail URLs:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}