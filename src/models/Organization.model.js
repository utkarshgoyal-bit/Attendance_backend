import mongoose from "mongoose";

// Organization Schema
const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  address: { type: String },
  logo: { type: String },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Branch Schema
const branchSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pinCode: { type: String }
  },
  contact: {
    phone: { type: String },
    email: { type: String }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

branchSchema.index({ orgId: 1, code: 1 }, { unique: true });

// QR Code Schema (for attendance)
const qrCodeSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  code: { type: String, required: true, unique: true },
  validFrom: { type: Date, default: Date.now },
  validTo: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

qrCodeSchema.index({ orgId: 1, branchId: 1 });

export const Organization = mongoose.model("Organization", organizationSchema, "organizations");
export const Branch = mongoose.model("Branch", branchSchema, "branches");
export const QRCode = mongoose.model("QRCode", qrCodeSchema, "qrcodes");
