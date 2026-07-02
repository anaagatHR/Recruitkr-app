import mongoose from "mongoose";

/**
 * Connect to MongoDB using the MONGO_URI from the environment.
 * Works with both a local mongod and MongoDB Atlas (cloud).
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error(
      "Tip: use a free MongoDB Atlas cluster and put its URI in .env (MONGO_URI)."
    );
    process.exit(1);
  }
}
