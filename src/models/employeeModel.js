import mongoose from "mongoose";
import validator from 'validator';

const {
  Schema: { Types },
  model,
  Schema,
} = mongoose;
const employeeSchema = new Schema({
   firstName: {
    type: Types.String,
    required: [false, 'First Name is required'],
  },
  lastName: {
    type: Types.String,
    required: [false, 'Last Name is required'],
  },
  eId: {
    type: Types.String,
    required: [false, 'E-ID is required'],
  },
 email: {
  type: String,
  required: true,
  validate: [validator.isEmail, 'Invalid email address'],
},

  designation: {
    type: Types.String,
  },
  role: {
    type: Types.String,
    enum: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
    default: 'EMPLOYEE'
  },

  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },

  department: {
    type: Types.String
  },

  sex: {
    type: Types.String,
    enum: ['Male', 'Female', 'Other'],
    required: [false, 'Sex is required'],
  },
  dob: {
    type: Types.Number,
    required: [false, 'Date of Birth is required'],
  },
  joiningDate: {
    type: Types.Number,
    required: [false, 'Joining Date is required'],
  },
  maritalStatus: {
    type: Types.String,
    enum: ['Single', 'Married'],
  },
  qualification: {
    type: Types.String,
  },
  addressLine1: {
    type: Types.String,
    required: [false, 'Address Line 1 is required'],
  },
  addressLine2: {
    type: Types.String,
  },
  country: {
    type: Types.String,
    required: [false, 'Country is required'],
  },
  state: {
    type: Types.String,
    required: [false, 'State is required'],
  },
  mobile: {
    type: Types.String,
    trim: true,
    required: [false, 'Mobile number is required'],
  },
  uid: {
    type: Types.String,
  },
  pan: {
    type: Types.String,
  },
  passport: {
    type: Types.String,
  },
  voterID: {
    type: Types.String,
  },
  drivingLicense: {
    type: Types.String,
  },
  baseSalary: {
    type: Types.String,
  },
  hra: {
    type: Types.String,
  },
  conveyance: {
    type: Types.String,
  },
  incentive: {
    type: Types.String,
  },
  commission: {
    type: Types.String,
  },
  ledger: {
    type: Types.String,
  },
  accountNumber: {
    type: Types.String,
  },
  ifsc: {
    type: Types.String,
  },
  bankName: {
    type: Types.String,
  },
  accountName: {
    type: Types.String,
  },
  salaries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salary'
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  hasAccount: {
    type: Boolean,
    default: false
  },

  password: String,

  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },

  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },

  probationDays: {
    type: Number,
    default: 90
  },

  isActive: {
    type: Types.Boolean,
    required: true,
    default: true,
  },


  updatedAt: {
    type: Types.Date,
    default: Date.now,
  },
  orgName: {
    type: Types.String,
    required: true,
    default: 'maitrii',
  },
  MONGO_DELETED: {
    type: Types.Boolean,
    required: true,
    default: false,
  },
  MONOGO_DELETED: {
    type: Types.Boolean,
    required: true,
    default: false,
  },
});

// Add indexes for performance optimization
employeeSchema.index({ firstName: 'text', lastName: 'text' }); // Text search index
employeeSchema.index({ email: 1 }, { unique: true }); // Unique index on email
employeeSchema.index({ eId: 1 }); // Index on employee ID for searching
employeeSchema.index({ MONGO_DELETED: 1 }); // Index for soft delete queries
employeeSchema.index({ isActive: 1 }); // Index for active status queries
employeeSchema.index({ role: 1 }); // Index for role-based queries
employeeSchema.index({ managerId: 1 }); // Index for manager hierarchy queries
employeeSchema.index({ department: 1 }); // Index for department queries

const Employee = mongoose.model("Employee", employeeSchema, "employees");

export default Employee;
