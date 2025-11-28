// Test the API endpoint directly
console.log('🧪 Testing /api/auth/profile endpoint\n');
console.log('📝 Instructions:');
console.log('1. Make sure your dev server is running (npm run dev)');
console.log('2. Open your browser');
console.log('3. Make sure you are logged in');
console.log('4. Open this URL in a new tab:');
console.log('   http://localhost:3000/api/auth/profile');
console.log('');
console.log('5. Check if the response includes "profilePicture" field');
console.log('');
console.log('Expected response:');
console.log(JSON.stringify({
  "_id": "...",
  "name": "Joedemar",
  "email": "joedemarrosero.1724@gmail.com",
  "profilePicture": "http://localhost:3000/api/files/profile-pictures%2F...",
  "role": "student",
  "createdAt": "...",
  "updatedAt": "..."
}, null, 2));
console.log('');
console.log('⚠️  If profilePicture is missing from the API response,');
console.log('   the issue is in the API endpoint, not the Sidebar component.');
