import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Removing email field from all users...');
  const result = await User.updateMany({}, { $unset: { email: 1 } });
  console.log(`✅ Removed email field from ${result.modifiedCount} users`);
  await mongoose.disconnect();
}).catch(err => console.error(err));
