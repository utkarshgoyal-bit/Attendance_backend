import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: {
    street: String,
    city: String,
    state: String,
    pinCode: String
  },
  contact: {
    phone: String,
    email: String
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Branch", branchSchema);
