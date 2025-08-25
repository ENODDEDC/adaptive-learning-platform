import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import connectMongoDB from '../config/mongoConfig.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmins = async () => {
  await connectMongoDB();

  const adminUsers = [
    {
      name: 'Super',
      surname: 'Admin',
      email: 'admin@example.com',
      password: 'password', // This will be hashed
      role: 'admin',
      isVerified: true,
    },
    // Add more admin users if needed
  ];

  for (const adminData of adminUsers) {
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      await User.create({ ...adminData, password: hashedPassword });
      console.log(`Admin user ${adminData.email} seeded successfully.`);
    } else {
      console.log(`Admin user ${adminData.email} already exists.`);
    }
  }

  mongoose.disconnect();
};

seedAdmins().catch(err => {
  console.error('Admin seeder failed:', err);
  mongoose.disconnect();
});