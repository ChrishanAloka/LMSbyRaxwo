import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Try the SRV connection first
    const uri = "mongodb+srv://sdeshan960_db_user:ccD9dtJQP85rOLkI@lms.6jppdbx.mongodb.net/lms";

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000, // 15 seconds timeout
      retryWrites: true,
      w: 'majority',
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(" Database Connected Successfully");
    return true;
  } catch (err) {
    console.error(" DB connect error:", err.message);
    console.error("\n DNS Resolution Issue Detected!");
    console.error("Your DNS cannot resolve MongoDB Atlas SRV records.");
    console.error("\n Solutions:");
    console.error("   1. Use a VPN to bypass DNS filtering");
    console.error("   2. Contact your network admin to unblock MongoDB");
    console.error("   3. Use mobile hotspot to test connection");
    console.error("   4. Try switching DNS to Google (8.8.8.8) or Cloudflare (1.1.1.1)");
    console.error("\n Server will continue but database operations will fail");
    process.exit(1);
    // return false;
    // Don't exit - let server keep running
    // process.exit(1);
  }
};
