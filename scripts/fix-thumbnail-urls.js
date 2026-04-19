/**
 * Script to fix thumbnail URLs in database
 * Converts absolute URLs to relative paths
 */

import mongoConfig from '../src/config/mongoConfig.js';
import Content from '../src/models/Content.js';

async function fixThumbnailUrls() {
  try {
    await mongoConfig();
    console.log('🔧 Starting thumbnail URL cleanup...');

    // Find all content with thumbnailUrl
    const contents = await Content.find({ 
      thumbnailUrl: { $exists: true, $ne: null } 
    });

    console.log(`📊 Found ${contents.length} items with thumbnail URLs`);

    let fixedCount = 0;
    
    for (const content of contents) {
      const oldUrl = content.thumbnailUrl;
      let newUrl = oldUrl;

      // Convert absolute URLs to relative paths
      if (oldUrl.includes('localhost:3000')) {
        // Extract path from localhost URL
        newUrl = oldUrl.replace(/^https?:\/\/localhost:3000/, '');
        console.log(`🔄 Localhost: ${oldUrl} → ${newUrl}`);
      } else if (oldUrl.includes('intelevo.onrender.com')) {
        // Extract path from old render URL
        newUrl = oldUrl.replace(/^https?:\/\/intelevo\.onrender\.com/, '');
        console.log(`🔄 Old Render: ${oldUrl} → ${newUrl}`);
      } else if (oldUrl.includes('assistive-learning-platform')) {
        // Extract path from current render URL
        newUrl = oldUrl.replace(/^https?:\/\/assistive-learning-platform[^\/]*/, '');
        console.log(`🔄 Current Render: ${oldUrl} → ${newUrl}`);
      } else if (oldUrl.startsWith('/')) {
        // Already relative, keep as is
        console.log(`✅ Already relative: ${oldUrl}`);
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
    console.log('🎉 Thumbnail URL cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error fixing thumbnail URLs:', error);
  } finally {
    process.exit(0);
  }
}

fixThumbnailUrls();