import { NextResponse } from 'next/server';
import mongoConfig from '@/config/mongoConfig';
import Content from '@/models/Content';

export async function POST(request) {
  try {
    await mongoConfig();
    console.log('🔧 Starting file URL cleanup...');

    // Find all content with file URLs
    const contents = await Content.find({ 
      $or: [
        { url: { $exists: true, $ne: null } },
        { filePath: { $exists: true, $ne: null } }
      ]
    });

    console.log(`📊 Found ${contents.length} items with file URLs`);

    let fixedCount = 0;
    const fixes = [];
    
    for (const content of contents) {
      let hasChanges = false;
      const changes = { id: content._id, changes: [] };

      // Fix URL field
      if (content.url) {
        const oldUrl = content.url;
        let newUrl = oldUrl;

        if (oldUrl.includes('localhost:3000')) {
          newUrl = oldUrl.replace(/^https?:\/\/localhost:3000/, '');
          changes.changes.push({ field: 'url', old: oldUrl, new: newUrl, type: 'localhost' });
          hasChanges = true;
        } else if (oldUrl.includes('intelevo.onrender.com')) {
          newUrl = oldUrl.replace(/^https?:\/\/intelevo\.onrender\.com/, '');
          changes.changes.push({ field: 'url', old: oldUrl, new: newUrl, type: 'old-render' });
          hasChanges = true;
        } else if (oldUrl.includes('assistive-learning-platform')) {
          newUrl = oldUrl.replace(/^https?:\/\/assistive-learning-platform[^\/]*/, '');
          changes.changes.push({ field: 'url', old: oldUrl, new: newUrl, type: 'current-render' });
          hasChanges = true;
        }

        if (newUrl !== oldUrl) {
          content.url = newUrl;
        }
      }

      // Fix filePath field
      if (content.filePath) {
        const oldPath = content.filePath;
        let newPath = oldPath;

        if (oldPath.includes('localhost:3000')) {
          newPath = oldPath.replace(/^https?:\/\/localhost:3000/, '');
          changes.changes.push({ field: 'filePath', old: oldPath, new: newPath, type: 'localhost' });
          hasChanges = true;
        } else if (oldPath.includes('intelevo.onrender.com')) {
          newPath = oldPath.replace(/^https?:\/\/intelevo\.onrender\.com/, '');
          changes.changes.push({ field: 'filePath', old: oldPath, new: newPath, type: 'old-render' });
          hasChanges = true;
        } else if (oldPath.includes('assistive-learning-platform')) {
          newPath = oldPath.replace(/^https?:\/\/assistive-learning-platform[^\/]*/, '');
          changes.changes.push({ field: 'filePath', old: oldPath, new: newPath, type: 'current-render' });
          hasChanges = true;
        }

        if (newPath !== oldPath) {
          content.filePath = newPath;
        }
      }

      // Save if there were changes
      if (hasChanges) {
        await content.save();
        fixes.push(changes);
        fixedCount++;
      }
    }

    console.log(`✅ Fixed ${fixedCount} file URLs`);
    
    return NextResponse.json({ 
      success: true,
      message: `Fixed file URLs in ${fixedCount} items`,
      totalFound: contents.length,
      fixes: fixes
    });
    
  } catch (error) {
    console.error('❌ Error fixing file URLs:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}