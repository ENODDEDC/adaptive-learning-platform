/**
 * Utility to clear old localStorage-based notes
 * Run this in browser console if you want to clean up old data:
 * 
 * import { clearOldSmartNotes } from '@/utils/clearOldNotes';
 * clearOldSmartNotes();
 */

export function clearOldSmartNotes() {
  if (typeof window === 'undefined') return;

  let clearedCount = 0;
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.startsWith('smart-notes-')) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });

  console.log(`✅ Cleared ${clearedCount} old Smart Notes from localStorage`);
  console.log('🎉 Your notes are now stored in the database and accessible globally!');
  
  return clearedCount;
}

// Auto-clear on import (optional - comment out if you want manual control)
if (typeof window !== 'undefined') {
  // Check if we've already cleared
  const hasCleared = localStorage.getItem('smart-notes-migrated');
  if (!hasCleared) {
    const count = clearOldSmartNotes();
    if (count > 0) {
      localStorage.setItem('smart-notes-migrated', 'true');
      console.log('📝 Note: Old localStorage notes have been cleared. Your new notes are now in the database!');
    }
  }
}
