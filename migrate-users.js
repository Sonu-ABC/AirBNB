/**
 * One-time migration script: Mark all existing users as isVerified = true
 * Run once with: node migrate-users.js
 * Safe to delete this file afterwards.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");

const dbUrl = process.env.ATLASDB_URL;

async function migrate() {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB");

    // Update all users that don't have isVerified set to true
    const result = await User.updateMany(
        { isVerified: { $ne: true } },
        { $set: { isVerified: true } }
    );

    console.log(`✅ Migration complete! Updated ${result.modifiedCount} users to isVerified = true.`);
    await mongoose.disconnect();
}

migrate().catch(console.error);
