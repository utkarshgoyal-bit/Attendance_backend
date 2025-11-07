import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const dbURL = process.env.MONGO_URI;

    const conn = await mongoose.connect(dbURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB connected`);
    console.log("Connected to DB:", mongoose.connection.name);
    console.log("Collections:", Object.keys(mongoose.connection.collections));
    
const count = await mongoose.connection.collection("employee").countDocuments();
console.log("Total employee documents:", count);

  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
