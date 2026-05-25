import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

async function connectDB(retries = MAX_RETRIES): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
  }

  try {
    await mongoose.connect(uri, {
      // These options keep the connection pool healthy
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);

    // Log disconnection events so you're aware
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
    });
  } catch (error) {
    if (retries > 0) {
      console.warn(
        `⚠️  MongoDB connection failed. Retrying in ${RETRY_DELAY_MS / 1000}s... (${retries} attempts left)`
      );
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      return connectDB(retries - 1);
    }

    console.error("❌ Could not connect to MongoDB after multiple retries.");
    process.exit(1);
  }
}

export default connectDB;