import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      trim: true
    },
    logo: {
      type: String // URL or base64
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }
  },
  { timestamps: true }
);

// Indexes
organizationSchema.index({ email: 1 });
organizationSchema.index({ isActive: 1 });
organizationSchema.index({ adminId: 1 });

const Organization = mongoose.model("Organization", organizationSchema, "organizations");

export default Organization;