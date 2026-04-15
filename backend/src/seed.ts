import mongoose from 'mongoose';
import { Course } from './models/Course';
import { User } from './models/User';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/examiq');
    console.log('Seeding data...');

    // Find or create an admin
    let admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      console.log('No admin found. Please register an admin user first.');
      process.exit(1);
    }

    // Create a Course
    const course = new Course({
      title: 'Computer Science 101',
      description: 'Introduction to Algorithms and Data Structures',
      instructorId: admin._id
    });
    await course.save();

    console.log('Seed successful!');
    console.log('Course ID:', course._id);
    console.log('UPDATE YOUR FRONTEND WITH THIS ID IF NEEDED');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
