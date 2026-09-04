/**
 * Drops the specified MongoDB database. Used for E2E test cleanup.
 * Usage: node scripts/clean-db.js
 * Env:  MONGO_URI or TEST_MONGO_URI (falls back to careerpilot_e2e)
 */
const mongoose = require('mongoose');

const uri =
  process.env.MONGO_URI ||
  process.env.TEST_MONGO_URI ||
  'mongodb://127.0.0.1:27017/careerpilot_e2e';

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    const dbName = mongoose.connection.db.databaseName;
    await mongoose.connection.dropDatabase();
    console.log(`E2E cleanup: dropped database '${dbName}'`);
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    // Non-fatal: database may not exist yet or MongoDB may be unreachable
    console.error('E2E cleanup skipped:', err.message);
    process.exit(0);
  });
