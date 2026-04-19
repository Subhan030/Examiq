require('dotenv').config();
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;

async function run() {
  if (!MONGO_URI) {
    console.error('MONGO_URI environment variable is not set');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.useDb('test');
  const coll = db.collection('questions');
  const qs = await coll.find({}).toArray();
  console.log(JSON.stringify(qs, null, 2));
  process.exit(0);
}
run();
