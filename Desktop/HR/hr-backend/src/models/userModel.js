import mongoose from "mongoose";

const {
  Schema: { Types },
  model,
  Schema,
} = mongoose;

const userSchema = new Schema({
  _id: {
    type: Types.ObjectId,
    required: true,
  },
  password: {
    type: Types.String,
    required: true,
  },
  role: {
    type: Types.String,
    required: true,
  },
  branches: [{
    type: Types.Mixed, 
  }],
  isActive: {
    type: Types.Boolean,
    required: true,
    default: true,
  },
  createdAt: {
    type: Types.Number,
    required: true,
  },
  updatedAt: {
    type: Types.Number,
    required: true,
  },
  orgName: {
    type: Types.String,
    required: true,
  },
  __v: {
    type: Types.Number,
    required: true,
  },
  createdBy: {
    type: Types.ObjectId,
    required: true,
  },
  ledgerBalance: {
    type: Types.Number,
    required: true,
  },
  ledgerBalanceHistory: [{
    type: Types.Mixed, // Assuming array of objects
  }],
  fcmToken: {
    type: Types.String,
  },
  browser: {
    type: Types.String,
  },
  os: {
    type: Types.String,
  },
  loggedIn: {
    type: Types.Number,
  },
  organization: {
    type: Types.ObjectId,
  },
  organizations: [{
    type: Types.Mixed, // Assuming array of objects or IDs
  }],
  employeeId: {
    type: Types.ObjectId,
  },
  pinnedTask: [{
    type: Types.Mixed, // Assuming array of objects
  }],
  MONGO_DELETED: {
    type: Types.Boolean,
    required: true,
    default: false,
  },
});

const User = mongoose.model("User", userSchema, "user");

export default User;
