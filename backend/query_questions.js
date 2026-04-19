const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://REMOVED_USER:REMOVED_PASSWORD@cluster0.pkbfu6y.mongodb.net/?appName=Cluster0';

async function run() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.useDb('test'); // Wait, default db is test?
  const coll = db.collection('questions');
  const qs = await coll.find({}).toArray();
  console.log(JSON.stringify(qs, null, 2));
  process.exit(0);
}
run();
