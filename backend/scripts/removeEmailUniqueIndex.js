import mongoose from 'mongoose';
import Student from '../models/Student.js';
import 'dotenv/config';
import { connectDB } from '../config/db.js';

const removeEmailUniqueIndex = async () => {
  try {
    // Connect to MongoDB using the same connection as the app
    await connectDB();
    console.log('Connected to MongoDB');

    // Get the collection
    const collection = mongoose.connection.db.collection('students');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Find and drop the email unique index
    const emailIndex = indexes.find(index => 
      index.key && index.key.email === 1 && index.unique === true
    );

    if (emailIndex) {
      console.log('Found unique email index, dropping it...');
      await collection.dropIndex(emailIndex.name);
      console.log('✅ Successfully removed unique email index');
    } else {
      console.log('✅ No unique email index found - already removed or never existed');
    }

    // Verify it's removed
    const updatedIndexes = await collection.indexes();
    console.log('Updated indexes:', updatedIndexes);

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error removing email unique index:', error);
    process.exit(1);
  }
};

removeEmailUniqueIndex();

