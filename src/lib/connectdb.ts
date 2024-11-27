import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

/**
 * Establishes a connection to the MongoDB database if not already connected.
 */
export async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URL!);
    console.log("Connected to database");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
}
