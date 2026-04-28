import { MongoClient } from 'mongodb';

const MONGODB_URI = "mongodb+srv://enoddedc:aB34567%21@assistive-learning-plat.0eezc0v.mongodb.net/?retryWrites=true&w=majority&appName=assistive-learning-platform";

function stripHtml(str) {
  return str
    .replace(/<[^>]*>?/g, ' ')   // strip both complete and unclosed/truncated tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/"?\s*\.\.\."\s*$/, '...')  // clean trailing quote artifacts
    .replace(/"\s+/, '"')               // clean quote + space after colon
    .replace(/\s+/g, ' ')
    .trim();
}

async function run() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('Connected to MongoDB');

  const db = client.db();
  const col = db.collection('notifications');

  const notifications = await col.find({}).toArray();
  console.log(`Found ${notifications.length} notifications`);

  let updated = 0;
  for (const notif of notifications) {
    const cleaned = stripHtml(notif.message);
    if (cleaned !== notif.message) {
      await col.updateOne({ _id: notif._id }, { $set: { message: cleaned } });
      console.log(`Fixed: "${notif.message.substring(0, 60)}" → "${cleaned.substring(0, 60)}"`);
      updated++;
    }
  }

  console.log(`\nDone. Updated ${updated} of ${notifications.length} notifications.`);
  await client.close();
}

run().catch(err => { console.error(err); process.exit(1); });
